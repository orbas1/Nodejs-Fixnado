const SETTINGS_ENDPOINT = '/api/admin/platform-settings';

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

export async function fetchPlatformSettings({ signal } = {}) {
  const response = await fetch(SETTINGS_ENDPOINT, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });

  const payload = await handleResponse(response, 'Failed to load platform settings');
  const settings = payload?.settings ?? {};
  return normalizeSettings(settings);
}

export async function persistPlatformSettings(body) {
  const response = await fetch(SETTINGS_ENDPOINT, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });

  const payload = await handleResponse(response, 'Failed to save platform settings');
  const settings = payload?.settings ?? {};
  return normalizeSettings(settings);
}

function normalizeSettings(settings) {
  const commissions = settings.commissions ?? {};
  const subscriptions = settings.subscriptions ?? {};
  const integrations = settings.integrations ?? {};

  return {
    commissions: {
      enabled: commissions.enabled !== false,
      baseRate: typeof commissions.baseRate === 'number' ? commissions.baseRate : Number.parseFloat(commissions.baseRate ?? 0) || 0,
      customRates: typeof commissions.customRates === 'object' && commissions.customRates !== null ? commissions.customRates : {}
    },
    subscriptions: {
      enabled: subscriptions.enabled !== false,
      enforceFeatures: subscriptions.enforceFeatures !== false,
      defaultTier: typeof subscriptions.defaultTier === 'string' ? subscriptions.defaultTier : 'standard',
      restrictedFeatures: Array.isArray(subscriptions.restrictedFeatures)
        ? subscriptions.restrictedFeatures
        : typeof subscriptions.restrictedFeatures === 'string'
          ? subscriptions.restrictedFeatures.split(',').map((value) => value.trim()).filter(Boolean)
          : [],
      tiers: Array.isArray(subscriptions.tiers) ? subscriptions.tiers : []
    },
    integrations: {
      stripe: normalizeSection(integrations.stripe),
      escrow: normalizeSection(integrations.escrow),
      smtp: normalizeSection(integrations.smtp),
      cloudflareR2: normalizeSection(integrations.cloudflareR2),
      app: normalizeSection(integrations.app),
      database: normalizeSection(integrations.database)
    },
    bookings: normalizeBookings(settings.bookings)
  };
}

function normalizeSection(section) {
  if (!section || typeof section !== 'object') {
    return {};
  }
  const normalised = {};
  for (const [key, value] of Object.entries(section)) {
    if (value == null) {
      normalised[key] = '';
      continue;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      normalised[key] = value;
      continue;
    }
    normalised[key] = String(value);
  }
  return normalised;
}

function normalizeBookings(bookings) {
  const source = bookings && typeof bookings === 'object' ? bookings : {};
  const sla = source.sla && typeof source.sla === 'object' ? source.sla : {};
  const cancellation = source.cancellation && typeof source.cancellation === 'object' ? source.cancellation : {};
  const reminders = source.reminders && typeof source.reminders === 'object' ? source.reminders : {};
  const documents = source.documents && typeof source.documents === 'object' ? source.documents : {};

  return {
    autoAssignEnabled: source.autoAssignEnabled !== false,
    allowManualAssignments: source.allowManualAssignments !== false,
    defaultDemandLevel: typeof source.defaultDemandLevel === 'string' ? source.defaultDemandLevel : 'medium',
    defaultCurrency: typeof source.defaultCurrency === 'string' ? source.defaultCurrency : 'GBP',
    sla: {
      onDemandMinutes: Number.isFinite(Number(sla.onDemandMinutes)) ? Number(sla.onDemandMinutes) : 45,
      scheduledHours: Number.isFinite(Number(sla.scheduledHours)) ? Number(sla.scheduledHours) : 24,
      followUpMinutes: Number.isFinite(Number(sla.followUpMinutes)) ? Number(sla.followUpMinutes) : 120
    },
    cancellation: {
      windowHours: Number.isFinite(Number(cancellation.windowHours)) ? Number(cancellation.windowHours) : 6,
      feePercent: Number.isFinite(Number(cancellation.feePercent)) ? Number(cancellation.feePercent) : 0.1,
      gracePeriodMinutes: Number.isFinite(Number(cancellation.gracePeriodMinutes))
        ? Number(cancellation.gracePeriodMinutes)
        : 15
    },
    reminders: {
      assignmentMinutes: Number.isFinite(Number(reminders.assignmentMinutes)) ? Number(reminders.assignmentMinutes) : 15,
      startMinutes: Number.isFinite(Number(reminders.startMinutes)) ? Number(reminders.startMinutes) : 60,
      completionMinutes: Number.isFinite(Number(reminders.completionMinutes)) ? Number(reminders.completionMinutes) : 30
    },
    documents: {
      requireRiskAssessment: documents.requireRiskAssessment !== false,
      requireInsuranceProof: documents.requireInsuranceProof !== false,
      requirePermit: documents.requirePermit === true
    }
  };
}
