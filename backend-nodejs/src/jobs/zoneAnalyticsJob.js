import config from '../config/index.js';
import { ServiceZone } from '../models/index.js';
import { generateAnalyticsSnapshot } from '../services/zoneService.js';

export function startZoneAnalyticsJob(logger = console) {
  const intervalMinutes = config.zoneAnalytics.snapshotIntervalMinutes;
  if (!Number.isFinite(intervalMinutes) || intervalMinutes <= 0) {
    logger.warn('Zone analytics job disabled due to invalid interval configuration');
    return null;
  }

  async function execute() {
    try {
      const zones = await ServiceZone.findAll({ attributes: ['id'] });
      const now = new Date();
      for (const zone of zones) {
        try {
          await generateAnalyticsSnapshot(zone.id, now);
        } catch (error) {
          logger.error(`Failed to generate analytics for zone ${zone.id}`, error);
        }
      }
    } catch (error) {
      logger.error('Zone analytics job failed to enumerate zones', error);
    }
  }

  execute().catch((error) => {
    logger.error('Zone analytics job initial run failed', error);
  });

  const handle = setInterval(() => {
    execute().catch((error) => {
      logger.error('Zone analytics scheduled run failed', error);
    });
  }, intervalMinutes * 60 * 1000);

  if (typeof handle.unref === 'function') {
    handle.unref();
  }

  return handle;
}
