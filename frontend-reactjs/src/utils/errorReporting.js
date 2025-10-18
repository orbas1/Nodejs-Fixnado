const TELEMETRY_ENDPOINT = '/api/telemetry/client-errors';
const VALID_SEVERITIES = new Set(['debug', 'info', 'warning', 'error', 'fatal']);

function generateReference() {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
    return cryptoApi.randomUUID();
  }

  const random = Math.random().toString(36).slice(2, 10);
  return `fx-${Date.now().toString(36)}-${random}`;
}

function resolveRuntimeInfo() {
  const env = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : {};
  const environment = env.MODE ?? env.NODE_ENV ?? 'development';
  const releaseChannel = env.VITE_RELEASE_CHANNEL ?? environment;
  const appVersion = env.VITE_APP_VERSION ?? '0.0.0-dev';
  const buildNumber = env.VITE_APP_BUILD ?? env.VITE_BUILD_ID ?? null;

  return { environment, releaseChannel, appVersion, buildNumber };
}

function normaliseError(error) {
  if (!error) {
    return null;
  }

  const shape = {
    name: error.name || error.constructor?.name || 'Error',
    message: error.message || String(error)
  };

  if (error.stack) {
    shape.stack = error.stack;
  }

  return shape;
}

function normaliseInfo(info) {
  if (!info || typeof info !== 'object') {
    return undefined;
  }

  return {
    componentStack: info.componentStack || null
  };
}

function sanitiseMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }

  const sanitised = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (value === undefined || typeof value === 'function' || typeof value === 'symbol') {
      continue;
    }

    if (value instanceof Error) {
      sanitised[key] = normaliseError(value);
      continue;
    }

    sanitised[key] = value;
  }

  return sanitised;
}

function sanitiseBreadcrumbs(breadcrumbs, limit = 60) {
  if (!Array.isArray(breadcrumbs) || breadcrumbs.length === 0) {
    return undefined;
  }

  const trimmed = breadcrumbs.slice(-limit);
  const mapped = trimmed
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const timestamp = entry.timestamp ? new Date(entry.timestamp) : null;

      return {
        timestamp: timestamp && !Number.isNaN(timestamp.getTime()) ? timestamp.toISOString() : null,
        category: typeof entry.category === 'string' ? entry.category.slice(0, 64) : null,
        level: typeof entry.level === 'string' ? entry.level.slice(0, 16) : null,
        message: typeof entry.message === 'string' ? entry.message.slice(0, 512) : null,
        data:
          entry.data && typeof entry.data === 'object'
            ? sanitiseMetadata(entry.data)
            : undefined
      };
    })
    .filter(Boolean);

  return mapped.length > 0 ? mapped : undefined;
}

function sanitiseTags(tags, limit = 32) {
  if (!Array.isArray(tags) || tags.length === 0) {
    return undefined;
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
    if (sanitised.length >= limit) {
      break;
    }
  }

  return sanitised.length > 0 ? sanitised : undefined;
}

function determineSeverity(providedSeverity, metadata = {}) {
  if (typeof providedSeverity === 'string') {
    const token = providedSeverity.trim().toLowerCase();
    if (VALID_SEVERITIES.has(token)) {
      return token;
    }
  }

  const metaSeverity = typeof metadata.severity === 'string' ? metadata.severity.trim().toLowerCase() : null;
  if (metaSeverity && VALID_SEVERITIES.has(metaSeverity)) {
    return metaSeverity;
  }

  if (metadata.isFatal === true) {
    return 'fatal';
  }

  return 'error';
}

function resolveCorrelationId(reference, metadata = {}) {
  if (typeof metadata.correlationId === 'string' && metadata.correlationId.trim()) {
    return metadata.correlationId.trim().slice(0, 64);
  }

  if (typeof metadata.traceId === 'string' && metadata.traceId.trim()) {
    return metadata.traceId.trim().slice(0, 64);
  }

  return reference;
}

function buildPayload({
  error,
  info,
  reference,
  boundaryId,
  metadata,
  breadcrumbs,
  severity
}) {
  const runtime = resolveRuntimeInfo();
  const metadataCopy = sanitiseMetadata(metadata);
  const breadcrumbList = sanitiseBreadcrumbs(breadcrumbs ?? metadata?.breadcrumbs);
  const tags = sanitiseTags(metadata?.tags);
  const sessionId = typeof metadata?.sessionId === 'string' ? metadata.sessionId : undefined;
  const tenantId = typeof metadata?.tenantId === 'string' ? metadata.tenantId : undefined;
  const userId = typeof metadata?.userId === 'string' ? metadata.userId : undefined;
  const correlationId = resolveCorrelationId(reference, metadata);

  delete metadataCopy.tags;
  delete metadataCopy.breadcrumbs;
  delete metadataCopy.correlationId;
  delete metadataCopy.traceId;
  delete metadataCopy.sessionId;
  delete metadataCopy.tenantId;
  delete metadataCopy.userId;

  const payload = {
    reference,
    correlationId,
    boundaryId,
    occurredAt: new Date().toISOString(),
    severity: determineSeverity(severity, metadata),
    environment: runtime.environment,
    releaseChannel: runtime.releaseChannel,
    appVersion: runtime.appVersion,
    buildNumber: runtime.buildNumber || undefined,
    location: typeof window !== 'undefined' && window.location ? window.location.href : undefined,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    error: normaliseError(error),
    info: normaliseInfo(info),
    metadata: metadataCopy,
    breadcrumbs: breadcrumbList,
    tags,
    sessionId,
    tenantId,
    userId
  };

  return payload;
}

async function postWithFetch(payload) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4500);

  try {
    await fetch(TELEMETRY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      keepalive: true,
      credentials: 'include'
    });
  } catch (error) {
    if (error.name !== 'AbortError') {
      throw error;
    }
  } finally {
    clearTimeout(timeout);
  }
}

function sendWithBeacon(payload) {
  if (typeof navigator === 'undefined' || typeof navigator.sendBeacon !== 'function') {
    return false;
  }

  try {
    const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    return navigator.sendBeacon(TELEMETRY_ENDPOINT, blob);
  } catch (error) {
    console.warn('Beacon delivery failed', error);
    return false;
  }
}

export async function reportClientError({
  error,
  info,
  reference,
  boundaryId = 'app-shell',
  metadata = {},
  breadcrumbs,
  severity
} = {}) {
  const resolvedReference = reference || generateReference();
  const payload = buildPayload({
    error,
    info,
    reference: resolvedReference,
    boundaryId,
    metadata,
    breadcrumbs,
    severity
  });

  if (sendWithBeacon(payload)) {
    return true;
  }

  try {
    await postWithFetch(payload);
    return true;
  } catch (networkError) {
    console.warn('Unable to report client error', networkError);
    return false;
  }
}
