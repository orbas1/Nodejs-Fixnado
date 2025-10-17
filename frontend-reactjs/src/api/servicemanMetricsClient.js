const CONFIG_ENDPOINT = '/api/serviceman/metrics/config';
const SETTINGS_ENDPOINT = '/api/serviceman/metrics/settings';
const CARDS_ENDPOINT = '/api/serviceman/metrics/cards';

const globalCrypto = typeof globalThis !== 'undefined' ? globalThis.crypto : null;

function generateId(prefix = 'id') {
  if (globalCrypto?.randomUUID) {
    return globalCrypto.randomUUID();
  }
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}-${Date.now()}`;
}

async function parseResponse(response, fallbackMessage) {
  if (response.ok) {
    if (response.status === 204) {
      return null;
    }
    return response.json();
  }

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    // ignore parse errors
  }
  const message = payload?.message || fallbackMessage;
  const error = new Error(message);
  error.status = response.status;
  error.details = payload?.details;
  throw error;
}

function normaliseHighlightNotes(notes) {
  if (!Array.isArray(notes)) {
    return [''];
  }
  const cleaned = notes
    .map((note) => (typeof note === 'string' ? note : ''))
    .filter(Boolean);
  return cleaned.length ? cleaned : [''];
}

function normaliseSummary(summary = {}) {
  return {
    ownerName: summary.ownerName ?? '',
    ownerEmail: summary.ownerEmail ?? '',
    escalationChannel: summary.escalationChannel ?? '',
    reviewCadence: summary.reviewCadence ?? '',
    highlightNotes: normaliseHighlightNotes(summary.highlightNotes)
  };
}

function normaliseNumeric(value) {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : '';
}

function normaliseMetricGroup(group = {}, fields = []) {
  return fields.reduce((acc, field) => {
    const value = group[field] ?? null;
    acc[field] = typeof value === 'number' ? value : value ?? '';
    return acc;
  }, {});
}

function normaliseProductivity(productivity = {}) {
  return {
    targetBillableHours: normaliseNumeric(productivity.targetBillableHours),
    targetUtilisation: normaliseNumeric(productivity.targetUtilisation),
    backlogCeiling: normaliseNumeric(productivity.backlogCeiling),
    responseTargetMinutes: normaliseNumeric(productivity.responseTargetMinutes),
    note: productivity.note ?? ''
  };
}

function normaliseQuality(quality = {}) {
  return {
    targetSla: normaliseNumeric(quality.targetSla),
    reworkThreshold: normaliseNumeric(quality.reworkThreshold),
    npsTarget: normaliseNumeric(quality.npsTarget),
    qualityFlagLimit: normaliseNumeric(quality.qualityFlagLimit),
    note: quality.note ?? ''
  };
}

function normaliseLogistics(logistics = {}) {
  return {
    travelBufferMinutes: normaliseNumeric(logistics.travelBufferMinutes),
    maxConcurrentJobs: normaliseNumeric(logistics.maxConcurrentJobs),
    vehicleComplianceRate: normaliseNumeric(logistics.vehicleComplianceRate),
    standbyCrew: normaliseNumeric(logistics.standbyCrew),
    note: logistics.note ?? ''
  };
}

function normaliseTraining(training = {}) {
  const requiredModules = Array.isArray(training.requiredModules)
    ? training.requiredModules.map((module) => (typeof module === 'string' ? module : '')).filter(Boolean)
    : [];
  const certificationAlerts = Array.isArray(training.certificationAlerts)
    ? training.certificationAlerts.map((item) => ({
        id: item.id ?? generateId('cert'),
        name: item.name ?? '',
        dueDate: item.dueDate ?? '',
        owner: item.owner ?? ''
      }))
    : [];
  return {
    requiredModules,
    certificationAlerts,
    complianceDueInDays: normaliseNumeric(training.complianceDueInDays),
    lastDrillCompletedAt: training.lastDrillCompletedAt ?? '',
    nextDrillScheduledAt: training.nextDrillScheduledAt ?? '',
    note: training.note ?? ''
  };
}

function normaliseWellness(wellness = {}) {
  return {
    overtimeCapHours: normaliseNumeric(wellness.overtimeCapHours),
    wellbeingCheckCadence: wellness.wellbeingCheckCadence ?? '',
    safetyIncidentThreshold: normaliseNumeric(wellness.safetyIncidentThreshold),
    fatigueFlagLimit: normaliseNumeric(wellness.fatigueFlagLimit),
    note: wellness.note ?? ''
  };
}

function normaliseCrewLeaderboard(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }
  return entries.map((entry) => ({
    id: entry.id ?? generateId('crew'),
    name: entry.name ?? '',
    role: entry.role ?? '',
    completedJobs: normaliseNumeric(entry.completedJobs),
    utilisation: normaliseNumeric(entry.utilisation),
    qualityScore: normaliseNumeric(entry.qualityScore),
    rating: normaliseNumeric(entry.rating),
    avatarUrl: entry.avatarUrl ?? '',
    spotlight: entry.spotlight ?? ''
  }));
}

function normaliseChecklists(items) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map((item) => ({
    id: item.id ?? generateId('checklist'),
    label: item.label ?? '',
    owner: item.owner ?? '',
    cadence: item.cadence ?? '',
    lastCompletedAt: item.lastCompletedAt ?? ''
  }));
}

function normaliseAutomation(automation = {}) {
  return {
    autoAssignEnabled: automation.autoAssignEnabled !== false,
    escalationChannel: automation.escalationChannel ?? '',
    followUpChannel: automation.followUpChannel ?? '',
    escalateWhen: automation.escalateWhen ?? ''
  };
}

function normaliseOperations(operations = {}) {
  return {
    crewLeaderboard: normaliseCrewLeaderboard(operations.crewLeaderboard),
    checklists: normaliseChecklists(operations.checklists),
    automation: normaliseAutomation(operations.automation)
  };
}

function normaliseSettings(settings = {}) {
  return {
    summary: normaliseSummary(settings.summary),
    productivity: normaliseProductivity(settings.productivity),
    quality: normaliseQuality(settings.quality),
    logistics: normaliseLogistics(settings.logistics),
    training: normaliseTraining(settings.training),
    wellness: normaliseWellness(settings.wellness),
    operations: normaliseOperations(settings.operations),
    metadata: {
      updatedAt: settings.metadata?.updatedAt ?? null,
      updatedBy: settings.metadata?.updatedBy ?? null
    }
  };
}

function normaliseCard(card) {
  if (!card) {
    return null;
  }
  return {
    id: card.id,
    title: card.title ?? '',
    tone: card.tone ?? 'info',
    details: Array.isArray(card.details) ? card.details : [],
    displayOrder: card.displayOrder ?? 100,
    isActive: card.isActive !== false,
    mediaUrl: card.mediaUrl ?? '',
    mediaAlt: card.mediaAlt ?? '',
    cta: card.cta
      ? {
          label: card.cta.label ?? '',
          href: card.cta.href ?? '',
          external: Boolean(card.cta.external)
        }
      : { label: '', href: '', external: false },
    updatedAt: card.updatedAt ?? null,
    updatedBy: card.updatedBy ?? null
  };
}

function normaliseCards(cards = []) {
  return cards.map(normaliseCard).filter(Boolean);
}

export async function fetchServicemanMetricsConfig({ signal } = {}) {
  const response = await fetch(CONFIG_ENDPOINT, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });
  const payload = await parseResponse(response, 'Failed to load serviceman metrics');
  return {
    settings: normaliseSettings(payload?.data?.settings ?? {}),
    cards: normaliseCards(payload?.data?.cards ?? [])
  };
}

export async function saveServicemanMetricsSettings(body) {
  const response = await fetch(SETTINGS_ENDPOINT, {
    method: 'PUT',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(body)
  });
  const payload = await parseResponse(response, 'Failed to save serviceman metrics');
  return {
    settings: normaliseSettings(payload?.data?.settings ?? {}),
    cards: normaliseCards(payload?.data?.cards ?? [])
  };
}

export async function createServicemanMetricCard(payload) {
  const response = await fetch(CARDS_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  const data = await parseResponse(response, 'Failed to create metrics card');
  return normaliseCard(data?.data);
}

export async function updateServicemanMetricCard(id, payload) {
  const response = await fetch(`${CARDS_ENDPOINT}/${id}`, {
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify(payload)
  });
  const data = await parseResponse(response, 'Failed to update metrics card');
  return normaliseCard(data?.data);
}

export async function deleteServicemanMetricCard(id) {
  const response = await fetch(`${CARDS_ENDPOINT}/${id}`, {
    method: 'DELETE',
    headers: { Accept: 'application/json' },
    credentials: 'include'
  });
  await parseResponse(response, 'Failed to delete metrics card');
}

export default {
  fetchServicemanMetricsConfig,
  saveServicemanMetricsSettings,
  createServicemanMetricCard,
  updateServicemanMetricCard,
  deleteServicemanMetricCard
};
