import config from '../config/index.js';
import {
  fetchPendingAnalyticsExports,
  markAnalyticsExportAttempt,
  requeueFailedAnalyticsExports
} from '../services/campaignService.js';

function getIntervalMs() {
  const seconds = Math.max(config.campaigns?.exportIntervalSeconds ?? 60, 15);
  return seconds * 1000;
}

async function sendPayload(exportRecord, logger) {
  const endpoint = config.campaigns?.analyticsEndpoint;
  if (!endpoint) {
    throw new Error('Analytics warehouse endpoint is not configured');
  }

  const headers = {
    'Content-Type': 'application/json'
  };

  if (config.campaigns?.analyticsApiKey) {
    headers['X-API-Key'] = config.campaigns.analyticsApiKey;
  }

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(exportRecord.payload)
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Warehouse responded with ${response.status}: ${message}`);
  }

  logger.info?.('campaign-analytics-export-sent', {
    exportId: exportRecord.id,
    campaignId: exportRecord.campaignDailyMetric?.campaignId,
    metricDate: exportRecord.payload.metricDate
  });

  await markAnalyticsExportAttempt(exportRecord, { status: 'sent' });
}

async function processBatch(logger) {
  await requeueFailedAnalyticsExports(config.campaigns?.failedRetryMinutes ?? 10);
  const pending = await fetchPendingAnalyticsExports();
  if (!pending.length) {
    return;
  }

  for (const record of pending) {
    try {
      await sendPayload(record, logger);
    } catch (error) {
      logger.error?.('campaign-analytics-export-error', {
        exportId: record.id,
        error: error.message
      });
      await markAnalyticsExportAttempt(record, { status: 'failed', error });
    }
  }
}

export function startCampaignAnalyticsJob(logger = console) {
  const intervalMs = getIntervalMs();

  const handler = () => {
    processBatch(logger).catch((error) => {
      logger.error?.('campaign-analytics-job-failed', { error: error.message });
    });
  };

  // Kick off immediately so dashboards are hydrated without waiting for the first tick.
  handler();

  return setInterval(handler, intervalMs);
}
