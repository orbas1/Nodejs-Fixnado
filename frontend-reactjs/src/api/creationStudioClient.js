const BLUEPRINTS_ENDPOINT = '/api/creation-studio/blueprints';
const DRAFTS_ENDPOINT = '/api/creation-studio/drafts';
const PUBLISH_ENDPOINT = '/api/creation-studio/publish';
const SLUG_VALIDATE_ENDPOINT = '/api/creation-studio/slug-check';

async function handleResponse(response, fallbackMessage) {
  if (response.ok) {
    if (response.status === 204) {
      return {};
    }
    const contentType = response.headers.get('content-type') ?? '';
    if (contentType.includes('application/json')) {
      return response.json();
    }
    return {};
  }

  let payload = {};
  try {
    payload = await response.json();
  } catch {
    payload = {};
  }

  const message = payload?.message || fallbackMessage;
  const error = new Error(message);
  error.status = response.status;
  if (payload?.code) {
    error.code = payload.code;
  }
  error.details = payload?.details;
  throw error;
}

export async function fetchCreationBlueprints({ signal } = {}) {
  const response = await fetch(BLUEPRINTS_ENDPOINT, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    },
    credentials: 'include',
    signal
  });

  const payload = await handleResponse(response, 'Failed to load creation blueprints');
  const blueprints = Array.isArray(payload?.data) ? payload.data : payload?.blueprints;
  if (!Array.isArray(blueprints)) {
    throw new Error('Unexpected blueprint payload received');
  }

  return blueprints.map((entry) => normalizeBlueprint(entry));
}

export async function saveCreationDraft(draft) {
  const response = await fetch(DRAFTS_ENDPOINT, {
    method: draft?.id ? 'PUT' : 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(draft)
  });

  const payload = await handleResponse(response, 'Failed to persist creation draft');
  return normalizeDraft(payload?.data ?? payload?.draft ?? draft);
}

export async function publishCreationDraft(draft) {
  const response = await fetch(PUBLISH_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(draft)
  });

  const payload = await handleResponse(response, 'Failed to publish creation entry');
  return normalizePublishResult(payload);
}

export async function validateCreationSlug({ slug, signal } = {}) {
  if (!slug) {
    throw new Error('Slug is required for validation');
  }

  const url = new URL(SLUG_VALIDATE_ENDPOINT, window.location.origin);
  url.searchParams.set('slug', slug);

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    },
    credentials: 'include',
    signal
  });

  const payload = await handleResponse(response, 'Failed to validate slug');
  return {
    available: Boolean(payload?.available ?? payload?.data?.available),
    reason: payload?.reason ?? payload?.data?.reason ?? null
  };
}

function normalizeBlueprint(entry) {
  if (!entry || typeof entry !== 'object') {
    throw new Error('Invalid blueprint entry');
  }

  return {
    id: String(entry.id ?? entry.slug ?? crypto.randomUUID()),
    title: String(entry.title ?? entry.name ?? 'Untitled blueprint'),
    description: String(
      entry.description ??
        entry.summary ??
        'Blueprint without additional context – update via creation studio admin.'
    ),
    persona: Array.isArray(entry.persona) ? entry.persona.map(String) : [String(entry.persona ?? 'provider')],
    requiredFields: Array.isArray(entry.requiredFields) ? entry.requiredFields : [],
    defaultPricingModel: entry.defaultPricingModel ?? 'fixed',
    supportedChannels: Array.isArray(entry.supportedChannels)
      ? entry.supportedChannels.map(String)
      : ['marketplace'],
    complianceChecklist: Array.isArray(entry.complianceChecklist)
      ? entry.complianceChecklist.map(String)
      : ['insurance', 'safeguarding'],
    recommendedRegions: Array.isArray(entry.recommendedRegions)
      ? entry.recommendedRegions.map(String)
      : ['national'],
    theme: entry.theme ?? 'default',
    automationHints: Array.isArray(entry.automationHints)
      ? entry.automationHints.map(String)
      : ['ai-copy', 'calendar-sync']
  };
}

function normalizeDraft(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      id: undefined,
      status: 'draft'
    };
  }

  return {
    id: payload.id ?? payload.draftId,
    status: payload.status ?? 'draft',
    updatedAt: payload.updatedAt ?? payload.updated_at ?? new Date().toISOString(),
    version: payload.version ?? 1
  };
}

function normalizePublishResult(payload) {
  if (!payload || typeof payload !== 'object') {
    return { status: 'unknown' };
  }

  return {
    status: payload.status ?? payload.result ?? 'queued',
    storefrontUrl: payload.storefrontUrl ?? payload.storefront_url ?? null,
    auditId: payload.auditId ?? payload.audit_id ?? null
  };
}
