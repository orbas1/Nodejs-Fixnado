import { Op } from 'sequelize';
import config from '../config/index.js';
import { AnalyticsEvent, AnalyticsPipelineRun } from '../models/index.js';
import { getFeatureToggle, upsertFeatureToggle } from './featureToggleService.js';

const CONTROL_KEY = config.analyticsPipeline?.controlToggleKey || 'analytics.pipeline.enabled';
const CACHE_TTL_MS = Math.max((config.analyticsPipeline?.controlCacheSeconds ?? 30) * 1000, 5000);
const DEFAULT_METADATA = Object.freeze({});
const STATUS_SUCCESSORS = new Set(['success', 'idle']);

let cachedState = { value: null, expiresAt: 0 };

function isPlainObject(value) {
  return value != null && typeof value === 'object' && !Array.isArray(value);
}

function normaliseMetadata(metadata) {
  if (isPlainObject(metadata)) {
    return metadata;
  }
  if (metadata == null) {
    return {};
  }
  return { note: String(metadata) };
}

function withEvaluatedAt(state) {
  return { ...state, evaluatedAt: new Date().toISOString() };
}

export function clearAnalyticsPipelineStateCache() {
  cachedState = { value: null, expiresAt: 0 };
}

function coerceStatus(input) {
  switch (input) {
    case 'failed':
    case 'skipped':
    case 'idle':
      return input;
    case 'success':
    default:
      return 'success';
  }
}

function coerceDate(value, fallback = new Date()) {
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  return fallback instanceof Date ? fallback : new Date();
}

function coerceCount(value) {
  const parsed = Number.parseInt(value ?? 0, 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return 0;
}

function summariseToggle(toggle) {
  if (!toggle) {
    return {
      enabled: true,
      source: 'default',
      reason: null,
      toggleState: null,
      rollout: null,
      owner: null
    };
  }

  const state = typeof toggle.state === 'string' ? toggle.state.toLowerCase() : 'disabled';
  const enabled = !['disabled', 'sunset'].includes(state);

  return {
    enabled,
    source: 'feature_toggle',
    reason: toggle.description || null,
    toggleState: state,
    rollout: typeof toggle.rollout === 'number' ? toggle.rollout : null,
    owner: toggle.owner || null
  };
}

export async function evaluatePipelineState({ forceRefresh = false } = {}) {
  const envDisabled = config.analyticsPipeline?.enabled === false;
  const now = Date.now();

  if (envDisabled) {
    const state = withEvaluatedAt({
      enabled: false,
      source: 'env',
      reason: 'ANALYTICS_INGEST_ENABLED=false',
      toggleState: 'disabled',
      rollout: null,
      owner: null
    });
    cachedState = { value: state, expiresAt: Number.POSITIVE_INFINITY };
    return state;
  }

  if (!forceRefresh && cachedState.value && cachedState.expiresAt > now) {
    return withEvaluatedAt(cachedState.value);
  }

  try {
    const toggle = await getFeatureToggle(CONTROL_KEY);
    const base = summariseToggle(toggle);
    const state = withEvaluatedAt(base);
    cachedState = { value: base, expiresAt: now + CACHE_TTL_MS };
    return state;
  } catch (error) {
    const base = {
      enabled: true,
      source: 'default',
      reason: 'toggle_fetch_failed',
      toggleState: null,
      rollout: null,
      owner: null,
      warning: error instanceof Error ? error.message : String(error)
    };
    const state = withEvaluatedAt(base);
    cachedState = { value: base, expiresAt: now + CACHE_TTL_MS };
    return state;
  }
}

export async function recordPipelineRun({
  status = 'success',
  startedAt = new Date(),
  finishedAt = new Date(),
  eventsProcessed = 0,
  eventsFailed = 0,
  batchesDelivered = 0,
  purgedEvents = 0,
  triggeredBy = 'scheduler',
  lastError = null,
  metadata = DEFAULT_METADATA
} = {}) {
  const payload = {
    status: coerceStatus(status),
    startedAt: coerceDate(startedAt),
    finishedAt: coerceDate(finishedAt, startedAt),
    eventsProcessed: coerceCount(eventsProcessed),
    eventsFailed: coerceCount(eventsFailed),
    batchesDelivered: coerceCount(batchesDelivered),
    purgedEvents: coerceCount(purgedEvents),
    triggeredBy: typeof triggeredBy === 'string' && triggeredBy.trim() ? triggeredBy.trim() : 'scheduler',
    lastError: lastError ? String(lastError) : null,
    metadata: normaliseMetadata(metadata)
  };

  return AnalyticsPipelineRun.create(payload);
}

function formatRun(run) {
  return {
    id: run.id,
    status: run.status,
    startedAt: run.startedAt?.toISOString?.() ?? null,
    finishedAt: run.finishedAt?.toISOString?.() ?? null,
    durationMs: run.durationMs ?? null,
    eventsProcessed: run.eventsProcessed,
    eventsFailed: run.eventsFailed,
    batchesDelivered: run.batchesDelivered,
    purgedEvents: run.purgedEvents,
    triggeredBy: run.triggeredBy,
    lastError: run.lastError,
    metadata: run.metadata || {}
  };
}

function computeFailureStreak(runs) {
  let streak = 0;
  for (const run of runs) {
    if (run.status === 'failed') {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

export async function getPipelineStatus() {
  const statePromise = evaluatePipelineState();
  const pendingPromise = AnalyticsEvent.count({ where: { ingestedAt: null } });
  const oldestPromise = AnalyticsEvent.findOne({
    where: { ingestedAt: null },
    attributes: ['occurredAt'],
    order: [['occurredAt', 'ASC']]
  });
  const nextRetryPromise = AnalyticsEvent.findOne({
    where: {
      ingestedAt: null,
      nextIngestAttemptAt: { [Op.not]: null }
    },
    attributes: ['nextIngestAttemptAt'],
    order: [['nextIngestAttemptAt', 'ASC']]
  });
  const runsPromise = AnalyticsPipelineRun.findAll({
    order: [['startedAt', 'DESC']],
    limit: 20
  });

  const [state, pendingEvents, oldest, nextRetry, runs] = await Promise.all([
    statePromise,
    pendingPromise,
    oldestPromise,
    nextRetryPromise,
    runsPromise
  ]);

  const formattedRuns = runs.map(formatRun);
  const failureStreak = computeFailureStreak(runs);
  const lastSuccess = runs.find((run) => STATUS_SUCCESSORS.has(run.status));
  const lastFailure = runs.find((run) => run.status === 'failed');

  return {
    pipeline: state,
    backlog: {
      pendingEvents,
      oldestPendingAt: oldest?.occurredAt?.toISOString?.() ?? null,
      nextRetryAt: nextRetry?.nextIngestAttemptAt?.toISOString?.() ?? null
    },
    runs: formattedRuns,
    failureStreak,
    lastSuccessAt: lastSuccess?.finishedAt?.toISOString?.() ?? null,
    lastError: lastFailure
      ? {
          message: lastFailure.lastError,
          occurredAt: lastFailure.finishedAt?.toISOString?.() ?? null
        }
      : null
  };
}

function normaliseControlInput({ actor, reason, ticket }) {
  if (typeof actor !== 'string' || actor.trim() === '') {
    throw new Error('actor is required for analytics pipeline control actions');
  }

  return {
    actor: actor.trim(),
    reason: typeof reason === 'string' && reason.trim() ? reason.trim() : null,
    ticket: typeof ticket === 'string' && ticket.trim() ? ticket.trim() : null
  };
}

export async function pauseAnalyticsPipeline({ actor, reason, ticket } = {}) {
  const input = normaliseControlInput({ actor, reason, ticket });
  await upsertFeatureToggle(
    CONTROL_KEY,
    {
      state: 'disabled',
      rollout: 1,
      description: input.reason || 'Paused via API',
      owner: input.actor,
      ticket: input.ticket || ''
    },
    input.actor
  );

  cachedState = {
    value: {
      enabled: false,
      source: 'feature_toggle',
      reason: input.reason || 'Paused via API',
      toggleState: 'disabled',
      rollout: 1,
      owner: input.actor
    },
    expiresAt: Date.now() + CACHE_TTL_MS
  };
  const state = withEvaluatedAt(cachedState.value);
  await recordPipelineRun({
    status: 'skipped',
    startedAt: new Date(),
    finishedAt: new Date(),
    triggeredBy: input.actor,
    metadata: {
      controlAction: 'pause',
      reason: input.reason,
      ticket: input.ticket
    }
  });
  return state;
}

export async function resumeAnalyticsPipeline({ actor, reason, ticket } = {}) {
  const input = normaliseControlInput({ actor, reason, ticket });
  await upsertFeatureToggle(
    CONTROL_KEY,
    {
      state: 'enabled',
      rollout: 1,
      description: input.reason || 'Resumed via API',
      owner: input.actor,
      ticket: input.ticket || ''
    },
    input.actor
  );

  cachedState = {
    value: {
      enabled: true,
      source: 'feature_toggle',
      reason: input.reason || 'Resumed via API',
      toggleState: 'enabled',
      rollout: 1,
      owner: input.actor
    },
    expiresAt: Date.now() + CACHE_TTL_MS
  };
  const state = withEvaluatedAt(cachedState.value);
  await recordPipelineRun({
    status: 'skipped',
    startedAt: new Date(),
    finishedAt: new Date(),
    triggeredBy: input.actor,
    metadata: {
      controlAction: 'resume',
      reason: input.reason,
      ticket: input.ticket
    }
  });
  return state;
}
