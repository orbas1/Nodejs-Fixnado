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

function shouldRunJob(name, gating) {
  const allowlist = gating.allowlist;
  const blocklist = gating.blocklist;

  if (blocklist.has(name)) {
    return false;
  }

  if (allowlist.size > 0 && !allowlist.has(name)) {
    return false;
  }

  return true;
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

function normaliseNames(values = []) {
  if (!Array.isArray(values)) {
    return new Set();
  }

  return new Set(values.map((value) => value?.toString?.().trim()).filter(Boolean));
}

export function startBackgroundJobs(logger = console, options = {}) {
  const gating = {
    allowlist: normaliseNames(options.allowlist),
    blocklist: normaliseNames(options.blocklist)
  };

  const jobs = [];

  const scheduleJob = (name, factory) => {
    if (!shouldRunJob(name, gating)) {
      logger?.info?.(`Background job '${name}' disabled via configuration.`);
      return;
    }

    const handle = factory();
    registerJob(jobs, handle, name, logger);
  };

  scheduleJob('telemetry-alerting', () => startTelemetryAlertingJob(logger));
  scheduleJob('zone-analytics', () => startZoneAnalyticsJob(logger));
  scheduleJob('campaign-analytics', () => startCampaignAnalyticsJob(logger));
  scheduleJob('analytics-ingestion', () => startAnalyticsIngestionJob(logger));
  scheduleJob('warehouse-freshness', () => startWarehouseFreshnessJob(logger));
  scheduleJob('data-governance-retention', () => startDataGovernanceRetentionJob(logger));
  scheduleJob('data-warehouse-export', () => startDataWarehouseExportJob(logger));
  scheduleJob('database-credential-rotation', () => startDatabaseCredentialRotationJob(logger));
  scheduleJob('finance-webhook', () => startFinanceWebhookJob(logger));

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
