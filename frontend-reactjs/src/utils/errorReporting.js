const TELEMETRY_ENDPOINT = '/api/telemetry/client-errors';

function serialiseError(error) {
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

function serialiseInfo(info) {
  if (!info) {
    return null;
  }

  return {
    componentStack: info.componentStack || null
  };
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

export async function reportClientError({ error, info, reference, boundaryId, metadata } = {}) {
  const payload = {
    reference: reference || `fx-${Date.now()}`,
    boundaryId: boundaryId || 'app-shell',
    occurredAt: new Date().toISOString(),
    error: serialiseError(error),
    info: serialiseInfo(info),
    metadata: metadata || {},
    location: typeof window !== 'undefined' ? window.location.href : 'unknown',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
  };

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
