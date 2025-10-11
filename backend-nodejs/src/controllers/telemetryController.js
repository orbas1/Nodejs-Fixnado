import crypto from 'node:crypto';
import { validationResult } from 'express-validator';
import {
  ingestUiPreferenceEvent,
  summariseUiPreferenceEvents,
  listUiPreferenceTelemetrySnapshots
} from '../services/telemetryService.js';

const RANGE_TO_DAYS = {
  '1d': 1,
  '7d': 7,
  '30d': 30
};

function resolveRange(range) {
  const key = range && RANGE_TO_DAYS[range] ? range : '7d';
  const days = RANGE_TO_DAYS[key];
  const end = new Date();
  const start = new Date(end.getTime() - days * 24 * 60 * 60 * 1000);
  return { key, start, end };
}

function resolveClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim().length > 0) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.ip;
}

export async function recordUiPreferenceTelemetry(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const {
      theme,
      density,
      contrast,
      marketingVariant,
      tenantId,
      role,
      userId,
      locale,
      timestamp,
      userAgent,
      source,
      correlationId,
      dataVersion
    } = req.body;

    const occurredAt = timestamp ? new Date(timestamp) : new Date();
    const clientIp = resolveClientIp(req);
    const hashedIp = clientIp ? crypto.createHash('sha256').update(clientIp).digest('hex') : null;

    const payload = {
      theme,
      density,
      contrast,
      marketingVariant: marketingVariant || 'default',
      tenantId: tenantId || 'fixnado-demo',
      userRole: role || 'unknown',
      userId: userId || null,
      locale: locale || null,
      occurredAt,
      userAgent: userAgent || req.get('user-agent'),
      source: source || 'theme-studio',
      correlationId: correlationId || req.headers['x-request-id'] || null,
      dataVersion: dataVersion || '1.0.0',
      ipHash: hashedIp
    };

    const event = await ingestUiPreferenceEvent(payload);

    res.status(202).json({ id: event.id, receivedAt: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
}

export async function getUiPreferenceTelemetrySummary(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { key, start, end } = resolveRange(req.query.range);

    const summary = await summariseUiPreferenceEvents({
      startDate: start,
      endDate: end,
      tenantId: req.query.tenantId || null
    });

    res.json({ range: key, ...summary });
  } catch (error) {
    next(error);
  }
}

function encodeCursor(cursor) {
  const payload = JSON.stringify({
    capturedAt: cursor.capturedAt.toISOString(),
    id: cursor.id
  });

  return Buffer.from(payload, 'utf8').toString('base64url');
}

function decodeCursor(rawCursor) {
  const buffer = Buffer.from(rawCursor, 'base64url');
  const payload = JSON.parse(buffer.toString('utf8'));

  if (!payload || typeof payload !== 'object') {
    throw new Error('Cursor payload malformed');
  }

  if (!payload.capturedAt || !payload.id) {
    throw new Error('Cursor requires capturedAt and id');
  }

  const capturedAt = new Date(payload.capturedAt);
  if (Number.isNaN(capturedAt.getTime())) {
    throw new Error('Cursor capturedAt invalid');
  }

  return { capturedAt, id: payload.id };
}

function parseOptionalDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseOptionalInteger(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseOptionalBoolean(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (typeof value === 'boolean') {
    return value;
  }

  const normalized = String(value).toLowerCase();
  if (['1', 'true', 'yes'].includes(normalized)) {
    return true;
  }
  if (['0', 'false', 'no'].includes(normalized)) {
    return false;
  }

  return null;
}

export async function getUiPreferenceTelemetrySnapshots(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const {
      rangeKey,
      tenantId,
      capturedAfter,
      capturedBefore,
      limit,
      cursor: rawCursor,
      leadingTheme,
      staleMinutesGte,
      staleMinutesLte,
      includeStats,
      freshnessWindowMinutes
    } = req.query;

    let cursor;
    if (rawCursor) {
      try {
        cursor = decodeCursor(rawCursor);
      } catch (error) {
        return res.status(422).json({
          errors: [
            {
              type: 'field',
              value: rawCursor,
              msg: error.message,
              path: 'cursor',
              location: 'query'
            }
          ]
        });
      }
    }

    const includeStatsProvided = includeStats !== undefined;
    const parsedIncludeStats = includeStatsProvided ? parseOptionalBoolean(includeStats) : false;
    const parsedFreshnessWindow = parseOptionalInteger(freshnessWindowMinutes);

    if (includeStatsProvided && parsedIncludeStats === null) {
      return res.status(422).json({
        errors: [
          {
            type: 'field',
            value: includeStats,
            msg: 'includeStats must be a boolean value',
            path: 'includeStats',
            location: 'query'
          }
        ]
      });
    }

    const sanitizedLeadingTheme =
      typeof leadingTheme === 'string' && leadingTheme.trim().length > 0 ? leadingTheme.trim() : undefined;

    const options = {
      rangeKey,
      tenantId,
      capturedAfter: parseOptionalDate(capturedAfter),
      capturedBefore: parseOptionalDate(capturedBefore),
      cursor,
      limit: limit ? Number(limit) : undefined,
      leadingTheme: sanitizedLeadingTheme,
      staleMinutesGte: parseOptionalInteger(staleMinutesGte),
      staleMinutesLte: parseOptionalInteger(staleMinutesLte),
      includeStats: Boolean(parsedIncludeStats),
      freshnessWindowMinutes: parsedFreshnessWindow
    };

    if (
      options.staleMinutesGte !== null &&
      options.staleMinutesLte !== null &&
      options.staleMinutesGte > options.staleMinutesLte
    ) {
      return res.status(422).json({
        errors: [
          {
            type: 'field',
            value: staleMinutesGte,
            msg: 'staleMinutesGte cannot be greater than staleMinutesLte',
            path: 'staleMinutesGte',
            location: 'query'
          }
        ]
      });
    }

    const { items, nextCursor, limit: appliedLimit, stats } = await listUiPreferenceTelemetrySnapshots(options);

    res.json({
      snapshots: items,
      pagination: {
        limit: appliedLimit,
        nextCursor: nextCursor ? encodeCursor(nextCursor) : null,
        hasMore: Boolean(nextCursor)
      },
      appliedFilters: {
        rangeKey: rangeKey || null,
        tenantId: tenantId || null,
        capturedAfter: capturedAfter || null,
        capturedBefore: capturedBefore || null,
        leadingTheme: sanitizedLeadingTheme || null,
        staleMinutesGte: options.staleMinutesGte,
        staleMinutesLte: options.staleMinutesLte,
        includeStats: options.includeStats,
        freshnessWindowMinutes: options.freshnessWindowMinutes
      },
      stats: stats || undefined
    });
  } catch (error) {
    next(error);
  }
}
