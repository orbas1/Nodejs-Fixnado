import { setInterval } from 'node:timers';
import config from '../config/index.js';
import { runScheduledWarehouseExports } from '../services/dataWarehouseExportService.js';

export function startDataWarehouseExportJob(logger = console) {
  if (config.env === 'test') {
    logger.info('Data warehouse export job disabled in test environment.');
    return null;
  }

  const intervalMinutes = Math.max(Number(config.dataWarehouse.scheduleMinutes ?? 180), 30);
  if (config.dataWarehouse.datasets && Object.values(config.dataWarehouse.datasets).every((entry) => entry?.enabled === false)) {
    logger.info('Data warehouse export job skipped; all datasets disabled.');
    return null;
  }

  let running = false;
  const execute = async (reason = 'interval') => {
    if (running) {
      logger.warn?.('Skipping warehouse export scheduler run because a previous execution is still in flight.');
      return;
    }
    running = true;
    try {
      const { triggered } = await runScheduledWarehouseExports(logger);
      if (triggered.length > 0) {
        logger.info?.(
          `Warehouse export scheduler (${reason}) triggered ${triggered.length} run(s): ${triggered
            .map((run) => `${run.dataset}:${run.regionId ?? 'GLOBAL'}`)
            .join(', ')}`
        );
      }
    } catch (error) {
      logger.error?.('Warehouse export scheduler failed', error);
    } finally {
      running = false;
    }
  };

  const intervalMs = intervalMinutes * 60 * 1000;
  const timer = setInterval(() => {
    execute('interval').catch((error) => logger.error?.('Warehouse export interval execution failed', error));
  }, intervalMs);

  execute('bootstrap').catch((error) => logger.error?.('Initial warehouse export execution failed', error));

  return {
    stop() {
      clearInterval(timer);
    }
  };
}

export default startDataWarehouseExportJob;
