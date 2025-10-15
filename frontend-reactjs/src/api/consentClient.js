export class ConsentApiError extends Error {
  constructor(message, status, options = {}) {
    super(message, options);
    this.name = 'ConsentApiError';
    this.status = status;
    this.cause = options.cause;
  }
}

function buildHeaders(subjectId) {
  const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json' });
  if (subjectId) {
    headers.set('X-Consent-Subject', subjectId);
  }
  return headers;
}

async function parseResponse(response) {
  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message = body?.message || response.statusText || 'Consent request failed';
    throw new ConsentApiError(message, response.status, { cause: body });
  }

  return body;
}

export async function fetchConsentSnapshot({ subjectId, signal } = {}) {
  const headers = buildHeaders(subjectId);
  const response = await fetch('/api/consent/requirements', {
    method: 'GET',
    credentials: 'include',
    headers,
    signal
  });
  return parseResponse(response);
}

export async function submitConsentDecision({ subjectId, policyKey, decision, metadata, region, channel }) {
  if (!policyKey) {
    throw new ConsentApiError('policyKey is required', 400);
  }
  const headers = buildHeaders(subjectId);
  const response = await fetch('/api/consent/events', {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify({ policyKey, decision, metadata, region, channel, subjectId })
  });
  return parseResponse(response);
}

export async function verifyConsent({ subjectId, policies, signal } = {}) {
  const headers = buildHeaders(subjectId);
  const response = await fetch('/api/consent/verify', {
    method: 'POST',
    credentials: 'include',
    headers,
    signal,
    body: JSON.stringify({ subjectId, policies })
  });
  return parseResponse(response);
}

export default {
  fetchConsentSnapshot,
  submitConsentDecision,
  verifyConsent
};
