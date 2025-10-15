import app, { getReadinessSnapshot, initDatabase, updateReadiness } from './app.js';
import config from './config/index.js';
import { startBackgroundJobs, stopBackgroundJobs } from './jobs/index.js';
import { sequelize } from './models/index.js';

let serverInstance = null;
let backgroundJobs = [];
let shuttingDown = false;

function logSecretsSyncMetadata() {
  const secretSources = config.secrets?.sources ?? [];
  if (secretSources.length === 0) {
    return;
  }

  const appliedKeys = secretSources.reduce((acc, source) => acc + (source.appliedKeys ?? 0), 0);
  console.info(`Secrets manager synchronised ${appliedKeys} key(s) across ${secretSources.length} source(s).`);
}

function closeServer() {
  if (!serverInstance) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    serverInstance.close((error) => {
      if (error) {
        console.error('Error while closing HTTP server', error);
      }
      resolve();
    });
  });
}

async function shutdown(signal, { exit = true, exitCode = 0 } = {}) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  const shutdownLabel = signal ?? 'unknown-signal';
  console.info(`Received ${shutdownLabel}. Beginning graceful shutdown.`);

  updateReadiness('httpServer', { status: 'stopping', metadata: { signal: shutdownLabel } });
  updateReadiness('backgroundJobs', { status: 'stopping', metadata: { signal: shutdownLabel } });

  const forceExitTimeout = setTimeout(() => {
    const snapshot = getReadinessSnapshot();
    console.error('Graceful shutdown timed out. Forcing exit.', { snapshot });
    process.exit(exitCode || 1);
  }, config.security?.shutdown?.timeoutMs ?? 15000);
  forceExitTimeout.unref?.();

  try {
    stopBackgroundJobs(backgroundJobs, console);
    updateReadiness('backgroundJobs', {
      status: 'stopped',
      metadata: { signal: shutdownLabel, stoppedJobs: backgroundJobs.length }
    });
  } catch (error) {
    console.error('Failed to stop background jobs gracefully', error);
    updateReadiness('backgroundJobs', { status: 'error', error });
  }

  await closeServer();
  updateReadiness('httpServer', { status: 'stopped', metadata: { signal: shutdownLabel } });

  try {
    await sequelize.close();
  } catch (error) {
    console.error('Failed to close database connections gracefully', error);
  }

  clearTimeout(forceExitTimeout);

  if (exit) {
    process.exit(exitCode);
  }
}

async function start() {
  try {
    logSecretsSyncMetadata();
    updateReadiness('httpServer', { status: 'initialising', metadata: { port: config.port } });
    updateReadiness('backgroundJobs', { status: 'initialising' });

    await initDatabase(console);

    backgroundJobs = startBackgroundJobs(console);
    updateReadiness('backgroundJobs', {
      status: 'ready',
      metadata: { runningJobs: backgroundJobs.length }
    });

    serverInstance = app.listen(config.port, () => {
      console.info(`Fixnado API listening on port ${config.port}`);
      updateReadiness('httpServer', {
        status: 'ready',
        metadata: { port: config.port }
      });
    });

    serverInstance.on('error', (error) => {
      console.error('HTTP server error', error);
      updateReadiness('httpServer', { status: 'error', error });
    });
  } catch (error) {
    updateReadiness('httpServer', { status: 'error', error });
    console.error('Failed to start server', error);
    await shutdown('startup-error', { exit: false, exitCode: 1 });
    process.exit(1);
  }
}

start();

['SIGINT', 'SIGTERM'].forEach((signal) => {
  process.on(signal, () => {
    shutdown(signal, { exit: true, exitCode: 0 }).catch((error) => {
      console.error(`Failed to shutdown gracefully on ${signal}`, error);
      process.exit(1);
    });
  });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Promise rejection detected', reason);
  shutdown('unhandledRejection', { exit: true, exitCode: 1 }).catch((error) => {
    console.error('Forced exit after unhandled rejection', error);
    process.exit(1);
  });
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception detected', error);
  shutdown('uncaughtException', { exit: true, exitCode: 1 }).catch((shutdownError) => {
    console.error('Forced exit after uncaught exception', shutdownError);
    process.exit(1);
  });
});
