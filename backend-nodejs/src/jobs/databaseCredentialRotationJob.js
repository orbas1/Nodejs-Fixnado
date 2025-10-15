import { setInterval } from 'node:timers';
import config from '../config/index.js';
import { maybeRotateDatabaseCredentials } from '../services/databaseCredentialRotationService.js';

export function startDatabaseCredentialRotationJob(logger = console) {
  if (!config.database.rotation.enabled) {
    logger.info('Database credential rotation job disabled via configuration.');
    return null;
  }
  if (config.env === 'test') {
    logger.info('Database credential rotation job disabled in test environment.');
    return null;
  }

  const intervalHours = Math.max(Number(config.database.rotation.intervalHours ?? 168), 1);
  const intervalMs = intervalHours * 60 * 60 * 1000;
  let running = false;

  const execute = async (reason) => {
    if (running) {
      logger.warn?.('Skipping credential rotation run because a previous execution is still active.');
      return;
    }
    running = true;
    try {
      await maybeRotateDatabaseCredentials({ reason, logger });
    } catch (error) {
      logger.error?.('Database credential rotation execution failed', error);
    } finally {
      running = false;
    }
  };

  const timer = setInterval(() => {
    execute('interval').catch((error) => logger.error?.('Scheduled database rotation run failed', error));
  }, intervalMs);

  execute('bootstrap').catch((error) => logger.error?.('Initial database rotation run failed', error));

  return {
    stop() {
      clearInterval(timer);
    }
  };
}

export default startDatabaseCredentialRotationJob;
