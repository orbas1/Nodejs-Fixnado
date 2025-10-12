import config from '../config/index.js';
import {
  ensureBackfillCoverage,
  fetchPendingAnalyticsEvents,
  markEventIngestionFailure,
  markEventIngestionSuccess,
  purgeExpiredAnalyticsEvents
} from '../services/analyticsEventService.js';

const DEFAULT_RETRY_SCHEDULE = [5, 15, 60, 240, 1440];

function normaliseSchedule(input) {
  if (Array.isArray(input) && input.length > 0) {
    const cleaned = input
      .map((value) => Number.parseInt(value, 10))
      .filter((value) => Number.isFinite(value) && value > 0);

    if (cleaned.length > 0) {
      return cleaned;
    }
  }

  return DEFAULT_RETRY_SCHEDULE;
}

function computeRetryTimestamp(attempt, schedule, now) {
  const minutes = schedule[Math.min(attempt - 1, schedule.length - 1)] ?? DEFAULT_RETRY_SCHEDULE[0];
  const retryAt = new Date(now.getTime());
  retryAt.setMinutes(retryAt.getMinutes() + minutes);
  return retryAt;
}

function toWarehouseEventPayload(event) {
  return {
    id: event.id,
    domain: event.domain,
    name: event.eventName,
    schemaVersion: event.schemaVersion,
    occurredAt: event.occurredAt instanceof Date ? event.occurredAt.toISOString() : event.occurredAt,
    receivedAt: event.receivedAt instanceof Date ? event.receivedAt.toISOString() : event.receivedAt,
    source: event.source,
    channel: event.channel,
    tenantId: event.tenantId,
    correlationId: event.correlationId,
    entity: {
      type: event.entityType,
      id: event.entityId,
      externalId: event.entityExternalId
    },
    actor: {
      type: event.actorType,
      id: event.actorId,
      label: event.actorLabel
    },
    metadata: event.metadata
  };
}

function summariseEvents(events) {
  return events.reduce(
    (summary, event) => {
      summary.totalEvents += 1;
      summary.byDomain[event.domain] = (summary.byDomain[event.domain] || 0) + 1;
      summary.byEntity[event.entityType] = (summary.byEntity[event.entityType] || 0) + 1;
      return summary;
    },
    { totalEvents: 0, byDomain: {}, byEntity: {} }
  );
}

async function deliverBatch(events, settings, logger) {
  if (typeof fetch !== 'function') {
    throw new Error('Global fetch is not available for analytics ingestion');
  }

  const now = new Date();
  const payload = {
    dataset: 'analytics_events',
    exportedAt: now.toISOString(),
    source: 'fixnado.api',
    summary: summariseEvents(events),
    events: events.map(toWarehouseEventPayload)
  };

  const headers = { 'Content-Type': 'application/json' };
  if (settings.ingestApiKey) {
    headers['X-API-Key'] = settings.ingestApiKey;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), settings.requestTimeoutMs);

  try {
    const response = await fetch(settings.ingestEndpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Warehouse responded with ${response.status}: ${errorBody}`);
    }

    logger.info?.('analytics-event-batch-sent', {
      count: events.length,
      endpoint: settings.ingestEndpoint,
      domains: payload.summary.byDomain
    });
    return { success: true };
  } finally {
    clearTimeout(timeout);
  }
}

async function handleSuccess(events, retentionDays) {
  for (const event of events) {
    // eslint-disable-next-line no-await-in-loop
    await markEventIngestionSuccess(event, { retentionDays });
  }
}

async function handleFailure(events, settings, logger, error) {
  const now = new Date();
  const schedule = normaliseSchedule(settings.retryScheduleMinutes);
  for (const event of events) {
    const attemptsAfterFailure = (event.ingestionAttempts ?? 0) + 1;
    const retryAt = computeRetryTimestamp(attemptsAfterFailure, schedule, now);
    // eslint-disable-next-line no-await-in-loop
    await markEventIngestionFailure(event, { error, retryAt });
    logger.error?.('analytics-event-ingest-error', {
      eventId: event.id,
      domain: event.domain,
      eventName: event.eventName,
      error: error instanceof Error ? error.message : String(error),
      retryAt: retryAt.toISOString(),
      attempts: attemptsAfterFailure
    });
  }
}

async function runCycle(settings, logger) {
  const now = new Date();
  await ensureBackfillCoverage({ lookbackHours: settings.lookbackHours, now });

  const events = await fetchPendingAnalyticsEvents({ limit: settings.batchSize, now });

  if (events.length === 0) {
    await purgeExpiredAnalyticsEvents({ now, batchSize: settings.purgeBatchSize });
    return;
  }

  if (!settings.ingestEndpoint) {
    await handleFailure(events, settings, logger, new Error('Analytics ingest endpoint is not configured'));
    return;
  }

  try {
    await deliverBatch(events, settings, logger);
    await handleSuccess(events, settings.retentionDays);
  } catch (error) {
    await handleFailure(events, settings, logger, error);
  }

  await purgeExpiredAnalyticsEvents({ now: new Date(), batchSize: settings.purgeBatchSize });
}

export function startAnalyticsIngestionJob(logger = console) {
  const pipelineConfig = config.analyticsPipeline || {};
  const settings = {
    ingestEndpoint: pipelineConfig.ingestEndpoint,
    ingestApiKey: pipelineConfig.ingestApiKey,
    batchSize: Math.max(pipelineConfig.batchSize || 200, 1),
    pollIntervalMs: Math.max(pipelineConfig.pollIntervalSeconds || 60, 15) * 1000,
    retentionDays: Math.max(pipelineConfig.retentionDays || 395, 30),
    requestTimeoutMs: Math.max(pipelineConfig.requestTimeoutMs || 15000, 1000),
    purgeBatchSize: Math.max(pipelineConfig.purgeBatchSize || 200, 50),
    retryScheduleMinutes: pipelineConfig.retryScheduleMinutes,
    lookbackHours: Math.max(pipelineConfig.lookbackHours || 48, 1)
  };

  const tick = () => {
    runCycle(settings, logger).catch((error) => {
      logger.error?.('analytics-ingestion-job-failed', {
        error: error instanceof Error ? error.message : String(error)
      });
    });
  };

  tick();
  const handle = setInterval(tick, settings.pollIntervalMs);
  if (typeof handle.unref === 'function') {
    handle.unref();
  }

  logger.info?.('analytics-ingestion-job-started', {
    pollIntervalMs: settings.pollIntervalMs,
    batchSize: settings.batchSize,
    retentionDays: settings.retentionDays
  });

  return handle;
}
