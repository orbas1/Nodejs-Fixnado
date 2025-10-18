import crypto from 'node:crypto';
import { Op, fn, col, literal } from 'sequelize';
import config from '../config/index.js';
import {
  UiPreferenceTelemetry,
  UiPreferenceTelemetrySnapshot,
  ClientErrorEvent,
  MobileCrashReport
} from '../models/index.js';

export async function ingestUiPreferenceEvent(event) {
  return UiPreferenceTelemetry.create(event);
}

function normaliseDate(input) {
  if (input instanceof Date) {
    return input;
  }

  return new Date(input);
}

function buildWhereClause({ startDate, endDate, tenantId }) {
  const where = {
    occurredAt: {
      [Op.gte]: normaliseDate(startDate),
      [Op.lte]: normaliseDate(endDate)
    }
  };

  if (tenantId) {
    where.tenantId = tenantId;
  }

  return where;
}

function resolveColumn(field) {
  const attribute = UiPreferenceTelemetry.rawAttributes[field];
  if (attribute && attribute.field) {
    return attribute.field;
  }
  return field;
}

async function groupCount(where, field) {
  const column = resolveColumn(field);
  const rows = await UiPreferenceTelemetry.findAll({
    attributes: [[col(column), 'key'], [fn('COUNT', col('id')), 'count']],
    where,
    group: [col(column)],
    order: [[fn('COUNT', col('id')), 'DESC']],
    raw: true
  });

  return rows.map((row) => ({ key: row.key ?? 'unspecified', count: Number(row.count) }));
}

export async function summariseUiPreferenceEvents({ startDate, endDate, tenantId }) {
  const where = buildWhereClause({ startDate, endDate, tenantId });
  const [totalEvents, themeBreakdown, densityBreakdown, contrastBreakdown, marketingBreakdown, timeseriesRows, latestEvent] =
    await Promise.all([
      UiPreferenceTelemetry.count({ where }),
      groupCount(where, 'theme'),
      groupCount(where, 'density'),
      groupCount(where, 'contrast'),
      groupCount(where, 'marketingVariant'),
      UiPreferenceTelemetry.findAll({
        attributes: [
          [literal('DATE(occurred_at)'), 'eventDate'],
          'theme',
          [fn('COUNT', col('id')), 'count']
        ],
        where,
        group: [literal('DATE(occurred_at)'), col('theme')],
        order: [[literal('DATE(occurred_at)'), 'ASC']],
        raw: true
      }),
      UiPreferenceTelemetry.max('occurredAt', { where })
    ]);

  const timeseriesMap = new Map();
  timeseriesRows.forEach((row) => {
    const dateKey = typeof row.eventDate === 'string' ? row.eventDate : new Date(row.eventDate).toISOString().slice(0, 10);
    if (!timeseriesMap.has(dateKey)) {
      timeseriesMap.set(dateKey, { date: dateKey, total: 0, byTheme: {} });
    }

    const entry = timeseriesMap.get(dateKey);
    const count = Number(row.count);
    entry.total += count;
    entry.byTheme[row.theme] = count;
  });

  const timeseries = Array.from(timeseriesMap.values());

  return {
    range: {
      start: normaliseDate(startDate).toISOString(),
      end: normaliseDate(endDate).toISOString(),
      tenantId: tenantId || null
    },
    totals: {
      events: totalEvents
    },
    breakdown: {
      theme: themeBreakdown,
      density: densityBreakdown,
      contrast: contrastBreakdown,
      marketingVariant: marketingBreakdown
    },
    latestEventAt: latestEvent ? new Date(latestEvent).toISOString() : null,
    timeseries
  };
}

function normaliseDecimal(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const asNumber = Number(value);
  return Number.isNaN(asNumber) ? null : asNumber;
}

function formatSnapshot(modelInstance) {
  const row = modelInstance.get({ plain: true });
  return {
    id: row.id,
    capturedAt: row.capturedAt.toISOString(),
    rangeKey: row.rangeKey,
    rangeStart: row.rangeStart.toISOString(),
    rangeEnd: row.rangeEnd.toISOString(),
    tenantId: row.tenantId,
    events: row.events,
    emoShare: normaliseDecimal(row.emoShare),
    leadingTheme: row.leadingTheme,
    leadingThemeShare: normaliseDecimal(row.leadingThemeShare),
    staleMinutes: row.staleMinutes,
    payload: row.payload
  };
}

function normaliseInteger(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function buildNumericRange({ gte, lte }) {
  const hasGte = gte !== null && gte !== undefined;
  const hasLte = lte !== null && lte !== undefined;

  if (!hasGte && !hasLte) {
    return null;
  }

  if (hasGte && hasLte) {
    return { [Op.gte]: gte, [Op.lte]: lte };
  }

  if (hasGte) {
    return { [Op.gte]: gte };
  }

  return { [Op.lte]: lte };
}

function buildSnapshotWhereClause({
  rangeKey,
  tenantId,
  capturedAfter,
  capturedBefore,
  cursor,
  leadingTheme,
  staleMinutesGte,
  staleMinutesLte
}) {
  const conditions = [];

  if (rangeKey) {
    conditions.push({ rangeKey });
  }

  if (tenantId) {
    conditions.push({ tenantId });
  }

  if (leadingTheme === 'unspecified') {
    conditions.push({ leadingTheme: null });
  } else if (leadingTheme) {
    conditions.push({ leadingTheme });
  }

  if (capturedAfter || capturedBefore) {
    const capturedRange = {};
    if (capturedAfter) {
      capturedRange[Op.gt] = capturedAfter;
    }
    if (capturedBefore) {
      capturedRange[Op.lt] = capturedBefore;
    }

    conditions.push({ capturedAt: capturedRange });
  }

  const staleMinutesRange = buildNumericRange({ gte: staleMinutesGte, lte: staleMinutesLte });
  if (staleMinutesRange) {
    conditions.push({ staleMinutes: staleMinutesRange });
  }

  if (cursor) {
    const { capturedAt, id } = cursor;
    conditions.push({
      [Op.or]: [
        { capturedAt: { [Op.gt]: capturedAt } },
        {
          capturedAt,
          id: { [Op.gt]: id }
        }
      ]
    });
  }

  if (conditions.length === 0) {
    return {};
  }

  if (conditions.length === 1) {
    return conditions[0];
  }

  return { [Op.and]: conditions };
}

function parseAggregateRow(row) {
  if (!row) {
    return null;
  }

  const coerceDecimal = (value) => (value === null || value === undefined ? null : Number(value));
  const coerceDate = (value) => {
    if (!value) {
      return null;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  };

  return {
    totalSnapshots: Number(row.count) || 0,
    capturedRange: {
      first: coerceDate(row.firstCapturedAt),
      last: coerceDate(row.lastCapturedAt)
    },
    staleMinutes: {
      min: coerceDecimal(row.minStaleMinutes),
      max: coerceDecimal(row.maxStaleMinutes),
      avg: coerceDecimal(row.avgStaleMinutes)
    },
    emoShare: {
      min: coerceDecimal(row.minEmoShare),
      max: coerceDecimal(row.maxEmoShare),
      avg: coerceDecimal(row.avgEmoShare)
    },
    leadingThemeShare: {
      avg: coerceDecimal(row.avgLeadingThemeShare)
    }
  };
}

function coerceBreakdown(rows, { keyField, valueField = 'count' }) {
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.map((row) => ({
    key: row[keyField] ?? 'unspecified',
    count: Number(row[valueField]) || 0
  }));
}

function parseFreshnessRow(row, thresholdMinutes) {
  if (!row) {
    return {
      thresholdMinutes,
      healthyCount: 0,
      staleCount: 0
    };
  }

  return {
    thresholdMinutes,
    healthyCount: Number(row.healthyCount) || 0,
    staleCount: Number(row.staleCount) || 0
  };
}

export async function listUiPreferenceTelemetrySnapshots({
  rangeKey,
  tenantId,
  capturedAfter,
  capturedBefore,
  cursor,
  limit = 200,
  leadingTheme,
  staleMinutesGte,
  staleMinutesLte,
  includeStats = false,
  freshnessWindowMinutes
}) {
  const resolvedLimit = Math.min(Math.max(Number(limit) || 0, 1), 1000);
  const normalizedFreshness = normaliseInteger(freshnessWindowMinutes);
  const appliedFreshnessThreshold = normalizedFreshness && normalizedFreshness > 0
    ? Math.min(normalizedFreshness, 10080)
    : 120;

  const where = buildSnapshotWhereClause({
    rangeKey,
    tenantId,
    capturedAfter,
    capturedBefore,
    cursor,
    leadingTheme,
    staleMinutesGte: normaliseInteger(staleMinutesGte),
    staleMinutesLte: normaliseInteger(staleMinutesLte)
  });

  const rows = await UiPreferenceTelemetrySnapshot.findAll({
    where,
    order: [
      ['capturedAt', 'ASC'],
      ['id', 'ASC']
    ],
    limit: resolvedLimit + 1
  });

  const items = rows.slice(0, resolvedLimit).map(formatSnapshot);

  let nextCursor = null;
  if (rows.length > resolvedLimit) {
    const next = rows[resolvedLimit];
    nextCursor = {
      capturedAt: next.capturedAt,
      id: next.id
    };
  }

  let stats = null;
  if (includeStats) {
    const [aggregateRow, tenantBreakdown, rangeBreakdown, themeBreakdown, freshnessRow] = await Promise.all([
      UiPreferenceTelemetrySnapshot.findOne({
        attributes: [
          [fn('COUNT', col('id')), 'count'],
          [fn('MIN', col('captured_at')), 'firstCapturedAt'],
          [fn('MAX', col('captured_at')), 'lastCapturedAt'],
          [fn('MIN', col('stale_minutes')), 'minStaleMinutes'],
          [fn('MAX', col('stale_minutes')), 'maxStaleMinutes'],
          [fn('AVG', col('stale_minutes')), 'avgStaleMinutes'],
          [fn('MIN', col('emo_share')), 'minEmoShare'],
          [fn('MAX', col('emo_share')), 'maxEmoShare'],
          [fn('AVG', col('emo_share')), 'avgEmoShare'],
          [fn('AVG', col('leading_theme_share')), 'avgLeadingThemeShare']
        ],
        where,
        raw: true
      }),
      UiPreferenceTelemetrySnapshot.findAll({
        attributes: [
          'tenantId',
          [fn('COUNT', col('id')), 'count']
        ],
        where,
        group: ['tenantId'],
        raw: true
      }),
      UiPreferenceTelemetrySnapshot.findAll({
        attributes: [
          'rangeKey',
          [fn('COUNT', col('id')), 'count']
        ],
        where,
        group: ['rangeKey'],
        raw: true
      }),
      UiPreferenceTelemetrySnapshot.findAll({
        attributes: [
          'leadingTheme',
          [fn('COUNT', col('id')), 'count']
        ],
        where,
        group: ['leadingTheme'],
        raw: true
      }),
      UiPreferenceTelemetrySnapshot.findOne({
        attributes: [
          [
            fn(
              'SUM',
              literal(`CASE WHEN stale_minutes IS NULL OR stale_minutes <= ${appliedFreshnessThreshold} THEN 1 ELSE 0 END`)
            ),
            'healthyCount'
          ],
          [
            fn('SUM', literal(`CASE WHEN stale_minutes > ${appliedFreshnessThreshold} THEN 1 ELSE 0 END`)),
            'staleCount'
          ]
        ],
        where,
        raw: true
      })
    ]);

    stats = {
      ...parseAggregateRow(aggregateRow),
      tenants: coerceBreakdown(tenantBreakdown, { keyField: 'tenantId' }),
      rangeKeys: coerceBreakdown(rangeBreakdown, { keyField: 'rangeKey' }),
      leadingThemes: coerceBreakdown(themeBreakdown, { keyField: 'leadingTheme' }),
      freshness: parseFreshnessRow(freshnessRow, appliedFreshnessThreshold)
    };
  }

  return { items, nextCursor, limit: resolvedLimit, stats };
}

const telemetryConfig = config.telemetry ?? {};
const severityRanking = { debug: 0, info: 1, warning: 2, error: 3, fatal: 4 };

function normaliseSeverityLevel(value, fallback = 'error') {
  if (typeof value !== 'string') {
    return fallback;
  }

  const token = value.trim().toLowerCase();
  if (token === 'critical' || token === 'panic') {
    return 'fatal';
  }

  return severityRanking[token] !== undefined ? token : fallback;
}

const clientErrorSettings = telemetryConfig.clientErrors ?? {};
const mobileCrashSettings = telemetryConfig.mobileCrashes ?? {};

const CLIENT_ERROR_CONFIG = {
  retentionDays: Math.max(clientErrorSettings.retentionDays ?? 30, 7),
  retentionSweepMinutes: Math.max(clientErrorSettings.retentionSweepMinutes ?? 60, 5),
  alertMinSeverity: normaliseSeverityLevel(clientErrorSettings.alertMinSeverity ?? 'fatal'),
  alertRateThreshold: Math.max(clientErrorSettings.alertRateThreshold ?? 5, 1),
  alertWindowMinutes: Math.max(clientErrorSettings.alertWindowMinutes ?? 10, 1),
  alertCooldownMinutes: Math.max(clientErrorSettings.alertCooldownMinutes ?? 30, 5),
  maxMetadataBytes: Math.max(clientErrorSettings.maxMetadataBytes ?? 8192, 1024),
  maxBreadcrumbs: Math.max(clientErrorSettings.maxBreadcrumbs ?? 50, 0)
};

const MOBILE_CRASH_CONFIG = {
  retentionDays: Math.max(mobileCrashSettings.retentionDays ?? 60, 14),
  retentionSweepMinutes: Math.max(mobileCrashSettings.retentionSweepMinutes ?? 60, 5),
  alertMinSeverity: normaliseSeverityLevel(mobileCrashSettings.alertMinSeverity ?? 'fatal'),
  alertRateThreshold: Math.max(mobileCrashSettings.alertRateThreshold ?? 1, 1),
  alertWindowMinutes: Math.max(mobileCrashSettings.alertWindowMinutes ?? 10, 1),
  alertCooldownMinutes: Math.max(mobileCrashSettings.alertCooldownMinutes ?? 60, 5),
  maxMetadataBytes: Math.max(mobileCrashSettings.maxMetadataBytes ?? 16384, 2048),
  maxBreadcrumbs: Math.max(mobileCrashSettings.maxBreadcrumbs ?? 100, 0)
};

const CLIENT_ERROR_RETENTION_MS = CLIENT_ERROR_CONFIG.retentionDays * 24 * 60 * 60 * 1000;
const MOBILE_CRASH_RETENTION_MS = MOBILE_CRASH_CONFIG.retentionDays * 24 * 60 * 60 * 1000;

const serviceEnvironment =
  typeof config.environment === 'string'
    ? config.environment
    : typeof config.env === 'string'
    ? config.env
    : process.env.NODE_ENV || 'development';

let nextClientErrorSweepAt = 0;
let nextMobileCrashSweepAt = 0;

const clientErrorAlertState = new Map();
const mobileCrashAlertState = new Map();

function parseDateInput(value, fallback) {
  if (!value) {
    return fallback;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? fallback : value;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function clampString(value, maxLength, fallback = null) {
  if (typeof value !== 'string') {
    return fallback;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }

  return trimmed.length <= maxLength ? trimmed : trimmed.slice(0, maxLength);
}

function clampMultiline(value, maxLength) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, Math.max(maxLength - 3, 0))}...`;
}

function sanitisePlainObject(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  try {
    return JSON.parse(
      JSON.stringify(value, (key, candidate) => {
        if (typeof candidate === 'bigint') {
          return candidate.toString();
        }
        if (candidate instanceof Error) {
          return {
            name: candidate.name,
            message: candidate.message,
            stack: candidate.stack
          };
        }
        if (typeof candidate === 'function' || typeof candidate === 'symbol') {
          return undefined;
        }
        return candidate;
      })
    );
  } catch (error) {
    return {
      truncated: true,
      note: `Unable to serialise metadata: ${error.message}`
    };
  }
}

function sanitiseMetadata(value, maxBytes) {
  const plain = sanitisePlainObject(value);
  if (!plain) {
    return null;
  }

  try {
    const encoded = JSON.stringify(plain);
    const size = Buffer.byteLength(encoded, 'utf8');
    if (size <= maxBytes) {
      return plain;
    }

    const sampledKeys = Object.keys(plain)
      .slice(0, 10)
      .reduce((acc, key) => {
        const candidate = plain[key];
        acc[key] = typeof candidate === 'object' ? '[truncated]' : candidate;
        return acc;
      }, {});

    return {
      truncated: true,
      originalSize: size,
      sampled: sampledKeys,
      note: `metadata exceeded ${maxBytes} bytes`
    };
  } catch (error) {
    return {
      truncated: true,
      note: `Unable to encode metadata: ${error.message}`
    };
  }
}

function sanitiseBreadcrumbs(breadcrumbs, maxItems, maxBytesBudget) {
  if (!Array.isArray(breadcrumbs) || breadcrumbs.length === 0 || maxItems <= 0) {
    return null;
  }

  const trimmed = breadcrumbs.slice(-Math.max(maxItems, 0));
  const perItemBudget = Math.max(Math.floor(maxBytesBudget / Math.max(trimmed.length, 1)), 512);

  const sanitised = trimmed
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const timestamp = entry.timestamp ? new Date(entry.timestamp) : null;

      return {
        timestamp: timestamp && !Number.isNaN(timestamp.getTime()) ? timestamp.toISOString() : null,
        category: clampString(entry.category, 64, null),
        level: clampString(entry.level, 16, null),
        message: clampString(entry.message, 512, null),
        data: sanitiseMetadata(entry.data, perItemBudget)
      };
    })
    .filter(Boolean);

  return sanitised.length > 0 ? sanitised : null;
}

function sanitiseTags(tags, maxItems) {
  if (!Array.isArray(tags) || maxItems <= 0) {
    return null;
  }

  const sanitised = [];
  for (const tag of tags) {
    if (typeof tag !== 'string') {
      continue;
    }
    const trimmed = tag.trim();
    if (!trimmed) {
      continue;
    }
    sanitised.push(trimmed.slice(0, 64));
    if (sanitised.length >= maxItems) {
      break;
    }
  }

  return sanitised.length > 0 ? sanitised : null;
}

function sanitiseThreads(threads) {
  if (!Array.isArray(threads) || threads.length === 0) {
    return null;
  }

  const limit = Math.min(threads.length, 10);
  const slice = threads.slice(0, limit);
  return slice
    .map((thread) => sanitiseMetadata(thread, Math.floor(MOBILE_CRASH_CONFIG.maxMetadataBytes / limit)))
    .filter(Boolean);
}

function hashFingerprint(parts) {
  const input = parts.filter(Boolean).join('|');
  return crypto.createHash('sha1').update(input).digest('hex');
}

function hashSensitive(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return null;
  }

  return crypto.createHash('sha256').update(value.trim()).digest('hex');
}

function severityLevel(severity) {
  return severityRanking[severity] ?? severityRanking.error;
}

async function pruneClientErrorEvents(now = new Date()) {
  if (CLIENT_ERROR_CONFIG.retentionSweepMinutes <= 0) {
    return;
  }

  if (now.getTime() < nextClientErrorSweepAt) {
    return;
  }

  nextClientErrorSweepAt =
    now.getTime() + CLIENT_ERROR_CONFIG.retentionSweepMinutes * 60 * 1000;

  try {
    await ClientErrorEvent.destroy({
      where: {
        expiresAt: {
          [Op.lt]: now
        }
      }
    });
  } catch (error) {
    console.error('[telemetry] Failed pruning client error events', {
      message: error.message
    });
  }
}

async function pruneMobileCrashReports(now = new Date()) {
  if (MOBILE_CRASH_CONFIG.retentionSweepMinutes <= 0) {
    return;
  }

  if (now.getTime() < nextMobileCrashSweepAt) {
    return;
  }

  nextMobileCrashSweepAt =
    now.getTime() + MOBILE_CRASH_CONFIG.retentionSweepMinutes * 60 * 1000;

  try {
    await MobileCrashReport.destroy({
      where: {
        expiresAt: {
          [Op.lt]: now
        }
      }
    });
  } catch (error) {
    console.error('[telemetry] Failed pruning mobile crash reports', {
      message: error.message
    });
  }
}

async function dispatchTelemetryAlert({ channel, severity, summary, details }) {
  const webhookUrl = telemetryConfig.slackWebhookUrl;
  const header = channel === 'mobile-crash' ? 'Mobile crash' : 'Client error';
  const textLines = [
    `:rotating_light: *${header}* (${severity.toUpperCase()})`,
    summary
  ];

  const detailEntries = Object.entries(details || {});
  if (detailEntries.length > 0) {
    textLines.push('');
    for (const [key, value] of detailEntries) {
      textLines.push(`• *${key}*: ${value ?? 'n/a'}`);
    }
  }

  const payload = { text: textLines.join('\n') };

  if (!webhookUrl) {
    console.warn('[telemetry] Alert dispatch skipped (no webhook configured)', payload);
    return;
  }

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('[telemetry] Failed to dispatch webhook alert', {
      message: error.message,
      channel,
      summary
    });
  }
}

async function evaluateClientErrorAlert(modelInstance) {
  const record = modelInstance.get({ plain: true });
  const key = `${record.boundaryId}:${record.fingerprint}`;
  const severity = normaliseSeverityLevel(record.severity, 'error');
  const now = Date.now();
  const windowMs = CLIENT_ERROR_CONFIG.alertWindowMinutes * 60 * 1000;
  const cooldownMs = CLIENT_ERROR_CONFIG.alertCooldownMinutes * 60 * 1000;
  const minSeverityLevel = severityLevel(CLIENT_ERROR_CONFIG.alertMinSeverity);

  const state = clientErrorAlertState.get(key) ?? {
    occurrences: [],
    lastAlertAt: 0
  };

  state.occurrences.push(now);
  state.occurrences = state.occurrences.filter((timestamp) => timestamp >= now - windowMs);
  clientErrorAlertState.set(key, state);

  const triggeredBySeverity = severityLevel(severity) >= minSeverityLevel;
  const triggeredByRate = state.occurrences.length >= CLIENT_ERROR_CONFIG.alertRateThreshold;

  if ((triggeredBySeverity || triggeredByRate) && now - state.lastAlertAt >= cooldownMs) {
    state.lastAlertAt = now;
    await dispatchTelemetryAlert({
      channel: 'client-error',
      severity,
      summary: `${record.boundaryId} reported ${record.errorName}`,
      details: {
        Reference: record.reference,
        Correlation: record.correlationId || 'n/a',
        Environment: record.environment,
        Release: record.releaseChannel,
        Version: record.appVersion || 'n/a',
        Severity: severity.toUpperCase()
      }
    });
  }
}

async function evaluateMobileCrashAlert(modelInstance) {
  const record = modelInstance.get({ plain: true });
  const key = `${record.platform}:${record.appVersion}:${record.fingerprint}`;
  const severity = normaliseSeverityLevel(record.severity, 'fatal');
  const now = Date.now();
  const windowMs = MOBILE_CRASH_CONFIG.alertWindowMinutes * 60 * 1000;
  const cooldownMs = MOBILE_CRASH_CONFIG.alertCooldownMinutes * 60 * 1000;
  const minSeverityLevel = severityLevel(MOBILE_CRASH_CONFIG.alertMinSeverity);

  const state = mobileCrashAlertState.get(key) ?? {
    occurrences: [],
    lastAlertAt: 0
  };

  state.occurrences.push(now);
  state.occurrences = state.occurrences.filter((timestamp) => timestamp >= now - windowMs);
  mobileCrashAlertState.set(key, state);

  const triggeredBySeverity = severityLevel(severity) >= minSeverityLevel;
  const triggeredByRate = state.occurrences.length >= MOBILE_CRASH_CONFIG.alertRateThreshold;

  if ((triggeredBySeverity || triggeredByRate) && now - state.lastAlertAt >= cooldownMs) {
    state.lastAlertAt = now;
    await dispatchTelemetryAlert({
      channel: 'mobile-crash',
      severity,
      summary: `${record.platform} ${record.appVersion} crash ${record.errorType}`,
      details: {
        Reference: record.reference,
        Correlation: record.correlationId || 'n/a',
        Environment: record.environment,
        Release: record.releaseChannel,
        Version: record.appVersion,
        Device: record.deviceModel || 'n/a'
      }
    });
  }
}

export async function ingestClientErrorEvent(payload = {}) {
  const now = new Date();
  const occurredAt = parseDateInput(payload.occurredAt, now);
  const severity = normaliseSeverityLevel(
    payload.severity || payload.metadata?.severity,
    payload.metadata?.isFatal ? 'fatal' : 'error'
  );
  const reference = clampString(payload.reference, 64, crypto.randomUUID());
  const correlationId =
    clampString(payload.correlationId, 64, null) ||
    clampString(payload.headers?.['x-correlation-id'], 64, null) ||
    clampString(payload.requestId, 64, null) ||
    reference;
  const requestId = clampString(payload.requestId, 64, null);
  const sessionId = clampString(payload.sessionId || payload.metadata?.sessionId, 64, null);
  const boundaryId = clampString(payload.boundaryId, 128, 'app-shell');
  const environment = clampString(payload.environment, 32, serviceEnvironment);
  const releaseChannel = clampString(payload.releaseChannel, 32, environment);
  const appVersion = clampString(payload.appVersion || payload.metadata?.appVersion, 32, null);
  const buildNumber = clampString(payload.buildNumber || payload.metadata?.buildNumber, 32, null);
  const location = clampString(payload.location, 512, null);
  const userAgent = clampString(payload.userAgent, 512, null);
  const errorSource = payload.error || {};
  const infoSource = payload.info || {};

  const metadataSource = { ...(payload.metadata || {}) };
  delete metadataSource.tags;
  delete metadataSource.breadcrumbs;

  const breadcrumbsSource = Array.isArray(payload.breadcrumbs)
    ? payload.breadcrumbs
    : Array.isArray(payload.metadata?.breadcrumbs)
    ? payload.metadata.breadcrumbs
    : undefined;

  const tagsSource = Array.isArray(payload.tags)
    ? payload.tags
    : Array.isArray(payload.metadata?.tags)
    ? payload.metadata.tags
    : undefined;

  const expiresAt = new Date(occurredAt.getTime() + CLIENT_ERROR_RETENTION_MS);
  const errorName = clampString(payload.errorName || errorSource.name || 'Error', 128, 'Error');
  const errorMessage = clampMultiline(
    payload.errorMessage || errorSource.message || 'Unknown client error',
    4000
  );
  const errorStack = clampMultiline(payload.errorStack || errorSource.stack, 24000);
  const componentStack = clampMultiline(
    payload.componentStack || infoSource.componentStack,
    24000
  );
  const fingerprint = hashFingerprint([
    boundaryId,
    errorName,
    errorMessage,
    errorStack?.slice(0, 512)
  ]);

  const metadata = sanitiseMetadata(metadataSource, CLIENT_ERROR_CONFIG.maxMetadataBytes);
  const breadcrumbs = sanitiseBreadcrumbs(
    breadcrumbsSource,
    CLIENT_ERROR_CONFIG.maxBreadcrumbs,
    CLIENT_ERROR_CONFIG.maxMetadataBytes
  );
  const tags = sanitiseTags(tagsSource, 32);

  const record = await ClientErrorEvent.create({
    reference,
    correlationId,
    requestId,
    sessionId,
    userId: clampString(payload.userId || metadataSource.userId, 64, null),
    tenantId: clampString(payload.tenantId || metadataSource.tenantId, 64, null),
    boundaryId,
    environment,
    releaseChannel,
    appVersion,
    buildNumber,
    severity,
    occurredAt,
    receivedAt: now,
    expiresAt,
    location,
    userAgent,
    ipHash: hashSensitive(payload.ipAddress || payload.clientIp),
    errorName,
    errorMessage,
    errorStack,
    componentStack,
    fingerprint,
    metadata,
    breadcrumbs,
    tags
  });

  queueMicrotask(() => {
    pruneClientErrorEvents().catch((error) => {
      console.error('[telemetry] Client error retention failed', { message: error.message });
    });
    evaluateClientErrorAlert(record).catch((error) => {
      console.error('[telemetry] Client error alert evaluation failed', { message: error.message });
    });
  });

  return record;
}

export async function ingestMobileCrashReport(payload = {}) {
  const now = new Date();
  const occurredAt = parseDateInput(payload.occurredAt, now);
  const severity = normaliseSeverityLevel(payload.severity, 'fatal');
  const reference = clampString(payload.reference, 64, crypto.randomUUID());
  const correlationId =
    clampString(payload.correlationId, 64, null) ||
    clampString(payload.requestId, 64, null) ||
    reference;
  const requestId = clampString(payload.requestId, 64, null);
  const sessionId = clampString(payload.sessionId, 64, null);
  const environment = clampString(payload.environment, 32, serviceEnvironment);
  const releaseChannel = clampString(payload.releaseChannel, 32, environment);
  const appVersion = clampString(payload.appVersion, 32, '0.0.0');
  const buildNumber = clampString(payload.buildNumber, 32, null);
  const platform = clampString(payload.platform, 32, 'unknown');
  const platformVersion = clampString(payload.platformVersion, 64, null);
  const deviceModel = clampString(payload.deviceModel, 96, null);
  const deviceManufacturer = clampString(payload.deviceManufacturer, 96, null);
  const locale = clampString(payload.locale, 32, null);
  const isEmulator = Boolean(payload.isEmulator);
  const isReleaseBuild = Boolean(payload.isReleaseBuild);
  const errorSource = payload.error || {};
  const errorType = clampString(payload.errorType || errorSource.type || 'Error', 128, 'Error');
  const errorMessage = clampMultiline(
    payload.errorMessage || errorSource.message || 'Unknown mobile crash',
    6000
  );
  const errorStack = clampMultiline(payload.errorStack || errorSource.stackTrace, 30000);
  const fingerprint = hashFingerprint([
    platform,
    appVersion,
    errorType,
    errorMessage,
    errorStack?.slice(0, 512)
  ]);

  const metadata = sanitiseMetadata(payload.metadata, MOBILE_CRASH_CONFIG.maxMetadataBytes);
  const breadcrumbs = sanitiseBreadcrumbs(
    payload.breadcrumbs,
    MOBILE_CRASH_CONFIG.maxBreadcrumbs,
    MOBILE_CRASH_CONFIG.maxMetadataBytes
  );
  const tags = sanitiseTags(payload.tags, 32);
  const threads = sanitiseThreads(payload.threads);
  const expiresAt = new Date(occurredAt.getTime() + MOBILE_CRASH_RETENTION_MS);

  const record = await MobileCrashReport.create({
    reference,
    correlationId,
    requestId,
    sessionId,
    userId: clampString(payload.userId, 64, null),
    tenantId: clampString(payload.tenantId, 64, null),
    environment,
    releaseChannel,
    appVersion,
    buildNumber,
    platform,
    platformVersion,
    deviceModel,
    deviceManufacturer,
    deviceIdentifierHash: hashSensitive(payload.deviceIdentifier),
    locale,
    isEmulator,
    isReleaseBuild,
    severity,
    errorType,
    errorMessage,
    errorStack,
    fingerprint,
    occurredAt,
    receivedAt: now,
    expiresAt,
    metadata,
    breadcrumbs,
    threads,
    tags
  });

  queueMicrotask(() => {
    pruneMobileCrashReports().catch((error) => {
      console.error('[telemetry] Mobile crash retention failed', { message: error.message });
    });
    evaluateMobileCrashAlert(record).catch((error) => {
      console.error('[telemetry] Mobile crash alert evaluation failed', { message: error.message });
    });
  });

  return record;
}
