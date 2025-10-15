import { startTelemetryAlertingJob } from './telemetryAlertJob.js';
import { startZoneAnalyticsJob } from './zoneAnalyticsJob.js';
import { startCampaignAnalyticsJob } from './campaignAnalyticsJob.js';
import { startAnalyticsIngestionJob } from './analyticsIngestionJob.js';
import { startWarehouseFreshnessJob } from './warehouseFreshnessJob.js';
import { startDataGovernanceRetentionJob } from './dataGovernanceRetentionJob.js';
import { startDataWarehouseExportJob } from './dataWarehouseExportJob.js';
import { startDatabaseCredentialRotationJob } from './databaseCredentialRotationJob.js';
import { startFinanceWebhookJob } from './financeWebhookJob.js';

function describeHandle(handle, fallbackDescription) {
  if (handle && typeof handle.description === 'string' && handle.description.trim().length > 0) {
    return handle.description.trim();
  }

  return fallbackDescription;
}

function createJobDescriptor(handle, description) {
  if (!handle) {
    return null;
  }

  const jobDescription = describeHandle(handle, description);

  if (typeof handle.stop === 'function') {
    return {
      description: jobDescription,
      stop: () => handle.stop(),
      handle
    };
  }

  if (typeof handle.close === 'function') {
    return {
      description: jobDescription,
      stop: () => handle.close(),
      handle
    };
  }

  return {
    description: jobDescription,
    stop: () => {
      clearInterval(handle);
      clearTimeout(handle);
    },
    handle
  };
}

function registerJob(jobs, handle, description, logger) {
  const descriptor = createJobDescriptor(handle, description);
  if (!descriptor) {
    logger?.info?.(`Background job '${description}' disabled.`);
    return;
  }

  jobs.push(descriptor);
  logger?.info?.(`Background job '${descriptor.description}' started.`);
}

export function startBackgroundJobs(logger = console) {
  const jobs = [];

  registerJob(jobs, startTelemetryAlertingJob(logger), 'telemetry-alerting', logger);
  registerJob(jobs, startZoneAnalyticsJob(logger), 'zone-analytics', logger);
  registerJob(jobs, startCampaignAnalyticsJob(logger), 'campaign-analytics', logger);
  registerJob(jobs, startAnalyticsIngestionJob(logger), 'analytics-ingestion', logger);
  registerJob(jobs, startWarehouseFreshnessJob(logger), 'warehouse-freshness', logger);
  registerJob(jobs, startDataGovernanceRetentionJob(logger), 'data-governance-retention', logger);
  registerJob(jobs, startDataWarehouseExportJob(logger), 'data-warehouse-export', logger);
  registerJob(jobs, startDatabaseCredentialRotationJob(logger), 'database-credential-rotation', logger);
  registerJob(jobs, startFinanceWebhookJob(logger), 'finance-webhook', logger);

  return jobs;
}

export function stopBackgroundJobs(jobs = [], logger = console) {
  jobs.forEach((job) => {
    if (!job) {
      return;
    }

    const description = job.description ?? 'background-job';

    try {
      job.stop?.();
      logger?.info?.(`Background job '${description}' stopped.`);
    } catch (error) {
      logger?.error?.(`Failed to stop background job '${description}'.`, { error });
    }
  });
}
