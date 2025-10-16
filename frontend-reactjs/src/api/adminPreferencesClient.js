const PREFERENCES_ENDPOINT = '/api/admin/preferences';

async function handleResponse(response, fallbackMessage) {
  if (response.ok) {
    return response.json();
  }

  const errorPayload = await response.json().catch(() => ({}));
  const message = errorPayload?.message || fallbackMessage;
  const error = new Error(message);
  error.status = response.status;
  error.details = errorPayload?.details;
  throw error;
}

function normaliseArray(value) {
  if (Array.isArray(value)) {
    return value.filter((item) => item != null);
  }
  return [];
}

function normaliseQuickLinks(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => ({
      label: typeof entry?.label === 'string' ? entry.label : '',
      href: typeof entry?.href === 'string' ? entry.href : ''
    }))
    .filter((entry) => entry.label || entry.href);
}

function normaliseChangedSections(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => entry.length > 0);
}

function normalisePreferences(preferences = {}) {
  return {
    general: {
      platformName: preferences.general?.platformName ?? 'Fixnado',
      supportEmail: preferences.general?.supportEmail ?? '',
      defaultLocale: preferences.general?.defaultLocale ?? 'en-GB',
      defaultTimezone: preferences.general?.defaultTimezone ?? 'Europe/London',
      brandColor: preferences.general?.brandColor ?? '#1D4ED8',
      loginUrl: preferences.general?.loginUrl ?? ''
    },
    notifications: {
      emailEnabled: preferences.notifications?.emailEnabled !== false,
      smsEnabled: preferences.notifications?.smsEnabled === true,
      pushEnabled: preferences.notifications?.pushEnabled !== false,
      dailyDigestHour:
        typeof preferences.notifications?.dailyDigestHour === 'number'
          ? preferences.notifications.dailyDigestHour
          : 8,
      digestTimezone: preferences.notifications?.digestTimezone ?? 'Europe/London',
      escalationEmails: normaliseArray(preferences.notifications?.escalationEmails),
      incidentWebhookUrl: preferences.notifications?.incidentWebhookUrl ?? ''
    },
    security: {
      requireMfa: preferences.security?.requireMfa !== false,
      sessionTimeoutMinutes:
        typeof preferences.security?.sessionTimeoutMinutes === 'number'
          ? preferences.security.sessionTimeoutMinutes
          : 30,
      passwordRotationDays:
        typeof preferences.security?.passwordRotationDays === 'number'
          ? preferences.security.passwordRotationDays
          : 90,
      allowPasswordless: preferences.security?.allowPasswordless === true,
      ipAllowlist: normaliseArray(preferences.security?.ipAllowlist),
      loginAlertEmails: normaliseArray(preferences.security?.loginAlertEmails)
    },
    workspace: {
      maintenanceMode: preferences.workspace?.maintenanceMode === true,
      maintenanceMessage: preferences.workspace?.maintenanceMessage ?? '',
      defaultLandingPage: preferences.workspace?.defaultLandingPage ?? '/admin/dashboard',
      theme: preferences.workspace?.theme ?? 'system',
      enableBetaFeatures: preferences.workspace?.enableBetaFeatures === true,
      allowedAdminRoles: normaliseArray(preferences.workspace?.allowedAdminRoles),
      quickLinks: normaliseQuickLinks(preferences.workspace?.quickLinks)
    }
  };
}

function buildSnapshot(payload = {}) {
  const preferences = normalisePreferences(payload.preferences ?? payload);
  const meta = {
    updatedAt: payload.meta?.updatedAt ?? null,
    updatedBy: payload.meta?.updatedBy ?? null,
    version:
      typeof payload.meta?.version === 'number'
        ? payload.meta.version
        : null,
    changedSections: normaliseChangedSections(payload.meta?.changedSections)
  };
  return { preferences, meta };
}

export async function fetchAdminPreferences({ signal } = {}) {
  const response = await fetch(PREFERENCES_ENDPOINT, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });

  const payload = await handleResponse(response, 'Failed to load admin preferences');
  return buildSnapshot(payload);
}

export async function persistAdminPreferences(body) {
  const response = await fetch(PREFERENCES_ENDPOINT, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });

  const payload = await handleResponse(response, 'Failed to save admin preferences');
  return buildSnapshot(payload);
}

export default {
  fetchAdminPreferences,
  persistAdminPreferences
};
