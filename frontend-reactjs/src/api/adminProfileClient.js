const PROFILE_ENDPOINT = '/api/admin/profile';
const PROFILE_SETTINGS_ENDPOINT = '/api/admin/profile-settings';

const DEFAULT_NOTIFICATIONS = {
  email: true,
  sms: false,
  push: false,
  slack: false,
  pagerDuty: false,
  weeklyDigest: true
};

async function handleResponse(response, fallbackMessage) {
  if (response.ok) {
    return response.json();
  }

  let errorBody = {};
  try {
    errorBody = await response.json();
  } catch {
    // ignore JSON parse errors
  }

  const message = errorBody?.message || fallbackMessage || 'Unable to process admin profile request';
  const error = new Error(message);
  error.status = response.status;
  error.details = errorBody?.details;
  throw error;
}

function normaliseNotifications(preferences = {}) {
  const next = { ...DEFAULT_NOTIFICATIONS };
  for (const key of Object.keys(next)) {
    if (Object.hasOwn(preferences, key)) {
      next[key] = Boolean(preferences[key]);
    }
  }
  return next;
}

function normaliseDelegate(delegate = {}) {
  return {
    id: delegate.id ?? '',
    name: delegate.name ?? '',
    email: delegate.email ?? '',
    role: delegate.role ?? '',
    permissions: Array.isArray(delegate.permissions) ? delegate.permissions : [],
    status: delegate.status ?? 'active',
    avatarUrl: delegate.avatarUrl ?? '',
    createdAt: delegate.createdAt ?? null,
    updatedAt: delegate.updatedAt ?? null
  };
}

function normaliseProfilePayload(payload = {}) {
  const data = payload.data ?? payload;
  const profile = data.profile ?? {};
  const address = data.address ?? {};
  const notifications = normaliseNotifications(data.notifications);
  const notificationEmails = Array.isArray(data.notificationEmails)
    ? data.notificationEmails.map((email) => (typeof email === 'string' ? email.trim() : '')).filter(Boolean)
    : [];
  const delegates = Array.isArray(data.delegates) ? data.delegates.map(normaliseDelegate) : [];

  return {
    profile: {
      firstName: profile.firstName ?? '',
      lastName: profile.lastName ?? '',
      email: profile.email ?? '',
      jobTitle: profile.jobTitle ?? '',
      department: profile.department ?? '',
      phoneNumber: profile.phoneNumber ?? '',
      avatarUrl: profile.avatarUrl ?? '',
      timezone: profile.timezone ?? 'UTC'
    },
    address: {
      line1: address.line1 ?? '',
      line2: address.line2 ?? '',
      city: address.city ?? '',
      state: address.state ?? '',
      postalCode: address.postalCode ?? '',
      country: address.country ?? ''
    },
    notifications,
    notificationEmails,
    delegates,
    audit: {
      updatedAt: data.audit?.updatedAt ?? null
    }
  };
}

export async function fetchAdminProfile({ signal } = {}) {
  const response = await fetch(PROFILE_ENDPOINT, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });

  const payload = await handleResponse(response, 'Failed to load admin profile');
  return payload?.profile ?? payload;
}

export async function saveAdminProfile(profile, { signal } = {}) {
  const response = await fetch(PROFILE_ENDPOINT, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(profile),
    signal
  });

  const payload = await handleResponse(response, 'Failed to save admin profile');
  return payload?.profile ?? payload;
}

export async function getAdminProfileSettings({ signal } = {}) {
  const response = await fetch(PROFILE_SETTINGS_ENDPOINT, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });

  const payload = await handleResponse(response, 'Failed to load profile settings');
  return normaliseProfilePayload(payload);
}

export async function updateAdminProfileSettings(body, { signal } = {}) {
  const response = await fetch(PROFILE_SETTINGS_ENDPOINT, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body),
    signal
  });

  const payload = await handleResponse(response, 'Failed to save profile settings');
  return normaliseProfilePayload(payload);
}

export async function createAdminDelegate(payload, { signal } = {}) {
  const response = await fetch(`${PROFILE_SETTINGS_ENDPOINT}/delegates`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(payload),
    signal
  });

  const body = await handleResponse(response, 'Failed to add delegate');
  return normaliseDelegate(body.data ?? body);
}

export async function updateAdminDelegate(delegateId, payload, { signal } = {}) {
  const response = await fetch(`${PROFILE_SETTINGS_ENDPOINT}/delegates/${delegateId}`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(payload),
    signal
  });

  const body = await handleResponse(response, 'Failed to update delegate');
  return normaliseDelegate(body.data ?? body);
}

export async function deleteAdminDelegate(delegateId, { signal } = {}) {
  const response = await fetch(`${PROFILE_SETTINGS_ENDPOINT}/delegates/${delegateId}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });

  if (response.status === 204) {
    return true;
  }

  await handleResponse(response, 'Failed to remove delegate');
  return true;
}

export { normaliseProfilePayload };
