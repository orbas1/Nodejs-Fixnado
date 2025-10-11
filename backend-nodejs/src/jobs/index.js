import { startTelemetryAlertingJob } from './telemetryAlertJob.js';
import { startZoneAnalyticsJob } from './zoneAnalyticsJob.js';
import { startCampaignAnalyticsJob } from './campaignAnalyticsJob.js';

export function startBackgroundJobs(logger = console) {
  const jobs = [];
  const telemetryHandle = startTelemetryAlertingJob(logger);
  if (telemetryHandle) {
    jobs.push(telemetryHandle);
  }

  const zoneAnalyticsHandle = startZoneAnalyticsJob(logger);
  if (zoneAnalyticsHandle) {
    jobs.push(zoneAnalyticsHandle);
  }

  const campaignAnalyticsHandle = startCampaignAnalyticsJob(logger);
  if (campaignAnalyticsHandle) {
    jobs.push(campaignAnalyticsHandle);
  }

  return jobs;
}
