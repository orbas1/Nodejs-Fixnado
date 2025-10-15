import { setInterval } from 'node:timers';
import config from '../config/index.js';
import { purgeExpiredDataGovernanceRecords } from '../services/dataGovernanceService.js';

export function startDataGovernanceRetentionJob(logger = console) {
  const intervalMinutes = Math.max(config.dataGovernance.retentionSweepMinutes, 15);
  if (config.env === 'test') {
    logger.info('Data governance retention job disabled in test environment.');
    return null;
  }

  let isRunning = false;
  const runSweep = async () => {
    if (isRunning) {
      return;
    }
    isRunning = true;
    try {
      await purgeExpiredDataGovernanceRecords(logger);
    } catch (error) {
      logger.error('Failed to purge data governance records', error);
    } finally {
      isRunning = false;
    }
  };

  const handle = setInterval(runSweep, intervalMinutes * 60 * 1000);
  runSweep().catch((error) => logger.error('Initial data governance purge failed', error));

  return {
    stop() {
      clearInterval(handle);
    }
  };
}
