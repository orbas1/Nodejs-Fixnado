import { resolveSessionTelemetryContext } from './telemetry.js';

const TELEMETRY_ENDPOINT = '/api/telemetry/client-errors';

function buildReference(event) {
  const random = Math.random().toString(36).slice(2, 8);
  return `persona_${event}_${Date.now().toString(36)}_${random}`;
}

function sanitiseString(value, { maxLength = 120 } = {}) {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.slice(0, maxLength);
}

function buildPayload({
  event,
  persona,
  source,
  outcome,
  reason,
  allowed,
  analyticsContext = {},
  metadata
}) {
  const reference = buildReference(event);
  const telemetryContext = resolveSessionTelemetryContext();
  const tenantId = analyticsContext.tenantId || telemetryContext.tenantId;
  const userId = analyticsContext.userId || telemetryContext.userId;
  const sessionId = analyticsContext.sessionId ? String(analyticsContext.sessionId).slice(0, 64) : undefined;
  const locale = analyticsContext.locale || telemetryContext.locale;
  const role = analyticsContext.role || telemetryContext.role;

  const payload = {
    reference,
    severity: 'info',
    occurredAt: new Date().toISOString(),
    metadata: {
      event,
      persona: sanitiseString(persona, { maxLength: 32 }) || 'unknown',
      source: sanitiseString(source, { maxLength: 64 }) || 'unspecified',
      outcome: sanitiseString(outcome, { maxLength: 32 }) || 'unknown',
      reason: sanitiseString(reason, { maxLength: 160 }) || undefined,
      allowed: Array.isArray(allowed) ? allowed.slice(0, 12) : undefined,
      role,
      locale
    },
    tags: ['persona-analytics'],
    tenantId: tenantId ? String(tenantId).slice(0, 64) : undefined,
    userId: userId ? String(userId).slice(0, 64) : undefined,
    sessionId
  };

  if (metadata && typeof metadata === 'object') {
    payload.metadata = { ...payload.metadata, ...metadata };
  }

  return payload;
}

function sendViaBeacon(payload) {
  if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') {
    return false;
  }

  try {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    return navigator.sendBeacon(TELEMETRY_ENDPOINT, blob);
  } catch (error) {
    console.warn('[personaAnalytics] beacon dispatch failed', error);
    return false;
  }
}

export async function recordPersonaAnalytics(event, details = {}) {
  if (!event) {
    return;
  }

  const payload = buildPayload({ event, ...details });

  if (sendViaBeacon(payload)) {
    return;
  }

  try {
    await fetch(TELEMETRY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.warn('[personaAnalytics] failed to record persona analytics event', error);
  }
}

export default {
  recordPersonaAnalytics
};
