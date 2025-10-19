import { resolveSessionTelemetryContext } from './telemetry.js';

const ROUTE_TELEMETRY_ENDPOINT = '/api/telemetry/client-errors';

function randomReference() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const segment = Math.random().toString(36).slice(2, 10);
  return `route-${Date.now().toString(36)}-${segment}`;
}

function sanitisePath(value) {
  if (typeof value !== 'string') {
    return '/';
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '/';
  }
  return trimmed.slice(0, 512);
}

function deriveSurface(pathname) {
  if (!pathname || typeof pathname !== 'string') {
    return 'public';
  }

  if (pathname.startsWith('/admin')) {
    return 'admin';
  }
  if (pathname.startsWith('/dashboards/provider') || pathname.startsWith('/provider')) {
    return 'provider';
  }
  if (pathname.startsWith('/dashboards/serviceman')) {
    return 'serviceman';
  }
  if (pathname.startsWith('/dashboards/finance')) {
    return 'finance';
  }
  if (pathname.startsWith('/dashboards/learner')) {
    return 'learner';
  }
  if (pathname.startsWith('/dashboards/enterprise')) {
    return 'enterprise';
  }
  if (pathname.startsWith('/dashboards')) {
    return 'workspace';
  }
  if (pathname.startsWith('/legal') || pathname.startsWith('/compliance')) {
    return 'compliance';
  }
  if (pathname.startsWith('/communications') || pathname.startsWith('/creation-studio')) {
    return 'communications';
  }
  return 'public';
}

function buildPayload({
  from,
  to,
  navigationType,
  durationMs,
  isInitialLoad,
  visibilityState,
  status = 'completed',
  reason
}) {
  const context = resolveSessionTelemetryContext();
  const surface = deriveSurface(to || from);

  return {
    reference: randomReference(),
    severity: status === 'error' ? 'warning' : 'info',
    occurredAt: new Date().toISOString(),
    tenantId: context.tenantId ? String(context.tenantId).slice(0, 64) : undefined,
    userId: context.userId ? String(context.userId).slice(0, 64) : undefined,
    sessionId: context.sessionId ? String(context.sessionId).slice(0, 64) : undefined,
    metadata: {
      event: 'route.transition',
      from: sanitisePath(from),
      to: sanitisePath(to),
      navigationType: typeof navigationType === 'string' ? navigationType.toLowerCase() : 'unknown',
      durationMs: Number.isFinite(durationMs) ? Math.max(0, Math.round(durationMs)) : undefined,
      persona: context.persona,
      allowedPersonas: Array.isArray(context.allowedPersonas)
        ? context.allowedPersonas.slice(0, 12)
        : undefined,
      role: context.role,
      locale: context.locale,
      surface,
      status,
      reason: reason ? String(reason).slice(0, 160) : undefined,
      isInitialLoad: Boolean(isInitialLoad),
      visibilityState: visibilityState || 'unknown'
    },
    tags: ['route-transition']
  };
}

function dispatch(payload) {
  if (!payload) {
    return;
  }

  const body = JSON.stringify(payload);

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    try {
      const beaconSent = navigator.sendBeacon(
        ROUTE_TELEMETRY_ENDPOINT,
        new Blob([body], { type: 'application/json' })
      );
      if (beaconSent) {
        return;
      }
    } catch (error) {
      console.warn('[navigationTelemetry] beacon dispatch failed', error);
    }
  }

  if (typeof fetch === 'function') {
    fetch(ROUTE_TELEMETRY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json'
      },
      credentials: 'include',
      body
    }).catch((error) => {
      console.warn('[navigationTelemetry] failed to persist route transition', error);
    });
  }
}

export function sendRouteTransitionTelemetry(details) {
  try {
    const payload = buildPayload(details);
    dispatch(payload);
  } catch (error) {
    console.warn('[navigationTelemetry] failed to build transition payload', error);
  }
}
