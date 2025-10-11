import crypto from 'node:crypto';
import { validationResult } from 'express-validator';
import { ingestUiPreferenceEvent, summariseUiPreferenceEvents } from '../services/telemetryService.js';

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
