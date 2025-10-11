import { startTelemetryAlertingJob } from './telemetryAlertJob.js';

export function startBackgroundJobs(logger = console) {
  const jobs = [];
  const telemetryHandle = startTelemetryAlertingJob(logger);
  if (telemetryHandle) {
    jobs.push(telemetryHandle);
  }

  return jobs;
}
