import { startTelemetryAlertingJob } from './telemetryAlertJob.js';
import { startZoneAnalyticsJob } from './zoneAnalyticsJob.js';
import { startCampaignAnalyticsJob } from './campaignAnalyticsJob.js';
import { startAnalyticsIngestionJob } from './analyticsIngestionJob.js';
import { startWarehouseFreshnessJob } from './warehouseFreshnessJob.js';
import { startDataGovernanceRetentionJob } from './dataGovernanceRetentionJob.js';
import { startDataWarehouseExportJob } from './dataWarehouseExportJob.js';
import { startDatabaseCredentialRotationJob } from './databaseCredentialRotationJob.js';
import { startFinanceWebhookJob } from './financeWebhookJob.js';

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

  const analyticsIngestionHandle = startAnalyticsIngestionJob(logger);
  if (analyticsIngestionHandle) {
    jobs.push(analyticsIngestionHandle);
  }

  const warehouseFreshnessHandle = startWarehouseFreshnessJob(logger);
  if (warehouseFreshnessHandle) {
    jobs.push(warehouseFreshnessHandle);
  }

  const dataGovernanceHandle = startDataGovernanceRetentionJob(logger);
  if (dataGovernanceHandle) {
    jobs.push(dataGovernanceHandle);
  }

  const warehouseExportHandle = startDataWarehouseExportJob(logger);
  if (warehouseExportHandle) {
    jobs.push(warehouseExportHandle);
  }

  const credentialRotationHandle = startDatabaseCredentialRotationJob(logger);
  if (credentialRotationHandle) {
    jobs.push(credentialRotationHandle);
  }

  const financeWebhookHandle = startFinanceWebhookJob(logger);
  if (financeWebhookHandle) {
    jobs.push(financeWebhookHandle);
  }

  return jobs;
}
