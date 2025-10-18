import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

import { loadSecretsIntoEnv } from './config/secretManager.js';
import { createLogger, serialiseError } from './utils/logger.js';

function isDirectExecution() {
  return process.argv[1] === fileURLToPath(import.meta.url);
}

export function createServer(options = {}) {
  const logger = options.logger ??
    createLogger({ level: options.logLevel, format: options.logFormat, serviceName: 'fixnado-api' });

  const state = {
    app: null,
    config: null,
    serverInstance: null,
    backgroundJobs: [],
    shuttingDown: false,
    started: false,
    modules: {
      app: null,
      jobs: null
    }
  };

  async function bootstrap() {
    if (state.modules.app) {
      return;
    }

    await loadSecretsIntoEnv({
      stage: 'server-bootstrap',
      logger,
      forceRefresh: options.forceSecretsReload ?? false
    });

    const configModule = await import('./config/index.js');
    state.config = configModule.default;

    const appModule = await import('./app.js');
    const jobsModule = await import('./jobs/index.js');

    state.modules.app = appModule;
    state.modules.jobs = jobsModule;

    const { configureAppRuntime, default: app, updateReadiness } = appModule;

    configureAppRuntime({
      logger,
      readinessSnapshotFile: state.config.runtime?.readiness?.snapshotFile,
      readinessPersistIntervalSeconds: state.config.runtime?.readiness?.persistIntervalSeconds ?? 5
    });

    state.app = app;

    updateReadiness('httpServer', {
      status: 'initialising',
      metadata: { port: state.config.port }
    });

    if (state.config.runtime?.backgroundJobs?.enabled) {
      updateReadiness('backgroundJobs', { status: 'initialising' });
    } else {
      updateReadiness('backgroundJobs', {
        status: 'ready',
        metadata: { enabled: false, reason: 'disabled_via_configuration' }
      });
    }
  }

  async function start() {
    if (state.started) {
      return state.serverInstance;
    }

    await bootstrap();

    const { initDatabase, updateReadiness } = state.modules.app;

    try {
      await initDatabase(logger);

      if (state.config.runtime?.backgroundJobs?.enabled) {
        const { allowlist = [], blocklist = [], startupDelaySeconds = 0 } = state.config.runtime.backgroundJobs;
        if (startupDelaySeconds > 0) {
          await delay(startupDelaySeconds * 1000);
        }
        state.backgroundJobs = state.modules.jobs.startBackgroundJobs(logger, {
          allowlist,
          blocklist
        });
        updateReadiness('backgroundJobs', {
          status: 'ready',
          metadata: { runningJobs: state.backgroundJobs.length }
        });
      }

      state.serverInstance = state.app.listen(state.config.port, () => {
        logger.info({ event: 'server.listen', port: state.config.port }, 'Fixnado API listening');
        updateReadiness('httpServer', {
          status: 'ready',
          metadata: { port: state.config.port }
        });
      });

      state.serverInstance.on('error', (error) => {
        logger.error({ event: 'server.error', error: serialiseError(error) }, 'HTTP server error');
        updateReadiness('httpServer', { status: 'error', error });
      });

      state.started = true;
      return state.serverInstance;
    } catch (error) {
      logger.error({ event: 'server.start.failed', error: serialiseError(error) }, 'Failed to start server');
      state.modules.app.updateReadiness('httpServer', { status: 'error', error });
      await stop({ signal: 'startup-error', exit: false, exitCode: 1 });
      throw error;
    }
  }

  async function stop({ signal = 'manual', exit = false, exitCode = 0 } = {}) {
    if (state.shuttingDown) {
      return;
    }

    state.shuttingDown = true;

    const { updateReadiness, getReadinessSnapshot } = state.modules.app || {};

    if (updateReadiness) {
      updateReadiness('httpServer', { status: 'stopping', metadata: { signal } });
    }

    if (state.backgroundJobs.length > 0 && state.modules.jobs) {
      updateReadiness?.('backgroundJobs', { status: 'stopping', metadata: { signal } });
      try {
        state.modules.jobs.stopBackgroundJobs(state.backgroundJobs, logger);
        updateReadiness?.('backgroundJobs', {
          status: 'stopped',
          metadata: { signal, stoppedJobs: state.backgroundJobs.length }
        });
      } catch (error) {
        logger.error({ event: 'jobs.stop.failed', error: serialiseError(error) }, 'Failed to stop background jobs');
        updateReadiness?.('backgroundJobs', { status: 'error', error });
      }
    }

    if (state.serverInstance) {
      await new Promise((resolve) => {
        state.serverInstance.close((error) => {
          if (error) {
            logger.error({ event: 'server.close.failed', error: serialiseError(error) }, 'Error closing HTTP server');
          }
          resolve();
        });
      });
    }

    if (updateReadiness) {
      updateReadiness('httpServer', { status: 'stopped', metadata: { signal } });
    }

    try {
      const { sequelize } = await import('./models/index.js');
      await sequelize.close();
    } catch (error) {
      logger.error({ event: 'database.close.failed', error: serialiseError(error) }, 'Failed to close database connections');
    }

    state.serverInstance = null;
    state.backgroundJobs = [];
    state.started = false;
    state.shuttingDown = false;

    if (exit) {
      logger.info({ event: 'process.exit', exitCode, readiness: getReadinessSnapshot?.() }, 'Process exiting after shutdown');
      process.exit(exitCode);
    }
  }

  function getReadinessSnapshot() {
    return state.modules.app?.getReadinessSnapshot?.() ?? {};
  }

  return {
    start,
    stop,
    getApp: () => state.app,
    getConfig: () => state.config,
    getLogger: () => logger,
    getReadinessSnapshot,
    isStarted: () => state.started
  };
}

if (isDirectExecution()) {
  const runtime = createServer();
  runtime
    .start()
    .catch((error) => {
      runtime
        .getLogger()
        .fatal({ event: 'server.start.fatal', error: serialiseError(error) }, 'Server startup failed');
      process.exit(1);
    });

  ['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, () => {
      runtime
        .stop({ signal, exit: true, exitCode: 0 })
        .catch((error) => {
          runtime
            .getLogger()
            .fatal({ event: 'shutdown.error', error: serialiseError(error) }, 'Forced exit after failed shutdown');
          process.exit(1);
        });
    });
  });

  process.on('unhandledRejection', (reason) => {
    runtime
      .getLogger()
      .error({ event: 'unhandledRejection', error: serialiseError(reason) }, 'Unhandled promise rejection detected');
    runtime
      .stop({ signal: 'unhandledRejection', exit: true, exitCode: 1 })
      .catch((error) => {
        runtime
          .getLogger()
          .fatal({ event: 'shutdown.error', error: serialiseError(error) }, 'Forced exit after unhandled rejection');
        process.exit(1);
      });
  });

  process.on('uncaughtException', (error) => {
    runtime
      .getLogger()
      .error({ event: 'uncaughtException', error: serialiseError(error) }, 'Uncaught exception detected');
    runtime
      .stop({ signal: 'uncaughtException', exit: true, exitCode: 1 })
      .catch((shutdownError) => {
        runtime
          .getLogger()
          .fatal({ event: 'shutdown.error', error: serialiseError(shutdownError) }, 'Forced exit after uncaught exception');
        process.exit(1);
      });
  });
}
