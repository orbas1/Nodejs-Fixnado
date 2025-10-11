import { Op, fn, col, literal } from 'sequelize';
import { UiPreferenceTelemetry, UiPreferenceTelemetrySnapshot } from '../models/index.js';

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
