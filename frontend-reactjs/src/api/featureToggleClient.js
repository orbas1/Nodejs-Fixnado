const TOGGLES_ENDPOINT = '/api/admin/feature-toggles';

export async function fetchFeatureToggles({ signal } = {}) {
  const response = await fetch(TOGGLES_ENDPOINT, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    },
    credentials: 'include',
    signal
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message = error?.message || 'Failed to load feature toggles';
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }

  const payload = await response.json();
  const { toggles = [] } = payload ?? {};
  const map = {};
  for (const toggle of toggles) {
    if (!toggle?.key) continue;
    const key = String(toggle.key);
    map[key] = {
      state: typeof toggle.state === 'string' ? toggle.state.toLowerCase() : 'disabled',
      rollout: typeof toggle.rollout === 'number' ? toggle.rollout : Number.parseFloat(toggle.rollout ?? 0) || 0,
      description: typeof toggle.description === 'string' ? toggle.description : '',
      owner: typeof toggle.owner === 'string' ? toggle.owner : '',
      ticket: typeof toggle.ticket === 'string' ? toggle.ticket : '',
      lastModifiedAt: toggle.lastModifiedAt ?? null,
      lastModifiedBy: toggle.lastModifiedBy ?? null
    };
  }

  return {
    toggles: map,
    version: response.headers.get('x-feature-toggles-version') ?? null
  };
}

export function hydrateToggleCache(raw) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const result = {};
  for (const [key, value] of Object.entries(raw)) {
    if (!key) continue;
    result[key] = {
      state: typeof value?.state === 'string' ? value.state.toLowerCase() : 'disabled',
      rollout: typeof value?.rollout === 'number' ? value.rollout : Number.parseFloat(value?.rollout ?? 0) || 0,
      description: typeof value?.description === 'string' ? value.description : '',
      owner: typeof value?.owner === 'string' ? value.owner : '',
      ticket: typeof value?.ticket === 'string' ? value.ticket : '',
      lastModifiedAt: value?.lastModifiedAt ?? null,
      lastModifiedBy: value?.lastModifiedBy ?? null
    };
  }

  return result;
}
