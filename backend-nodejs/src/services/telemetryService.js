import { Op, fn, col, literal } from 'sequelize';
import { UiPreferenceTelemetry } from '../models/index.js';

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
