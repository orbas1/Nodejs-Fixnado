import { v4 as uuid } from 'uuid';
import { ServicemanMetricSetting, ServicemanMetricCard } from '../models/index.js';

const SUMMARY_SCOPE = 'summary';
const PRODUCTIVITY_SCOPE = 'productivity';
const QUALITY_SCOPE = 'quality';
const LOGISTICS_SCOPE = 'logistics';
const TRAINING_SCOPE = 'training';
const WELLNESS_SCOPE = 'wellness';
const OPERATIONS_SCOPE = 'operations';

const ALL_SCOPES = [
  SUMMARY_SCOPE,
  PRODUCTIVITY_SCOPE,
  QUALITY_SCOPE,
  LOGISTICS_SCOPE,
  TRAINING_SCOPE,
  WELLNESS_SCOPE,
  OPERATIONS_SCOPE
];

const CARD_TONES = new Set(['info', 'success', 'warning', 'danger', 'neutral']);

function clampNumber(value, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY, fallback = null } = {}) {
  if (value == null || value === '') {
    return fallback;
  }
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  const clamped = Math.min(Math.max(numeric, min), max);
  return Number.isInteger(min) && Number.isInteger(max) && Number.isInteger(numeric) ? Math.round(clamped) : clamped;
}

function clampInteger(value, options = {}) {
  return clampNumber(value, { ...options, min: options.min ?? 0, fallback: options.fallback ?? null });
}

function sanitisePercentage(value, fallback = null) {
  const numeric = clampNumber(value, { min: 0, max: 100, fallback: fallback ?? null });
  if (numeric == null) {
    return fallback ?? null;
  }
  return Number.parseFloat(numeric.toFixed(2));
}

function sanitiseString(value, { maxLength = 240, fallback = '' } = {}) {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }
  return trimmed.slice(0, maxLength);
}

function sanitiseNullableString(value, options = {}) {
  const result = sanitiseString(value, { ...options, fallback: '' });
  return result || null;
}

function sanitiseNotes(notes) {
  if (!Array.isArray(notes)) {
    return [''];
  }
  const cleaned = notes
    .map((note) => (typeof note === 'string' ? note.trim() : ''))
    .filter((note) => note.length > 0)
    .slice(0, 10)
    .map((note) => (note.length > 280 ? `${note.slice(0, 279)}…` : note));
  return cleaned.length > 0 ? cleaned : [''];
}

function sanitiseSummaryConfig(config = {}) {
  return {
    ownerName: sanitiseNullableString(config.ownerName, { maxLength: 120 }),
    ownerEmail: sanitiseNullableString(config.ownerEmail, { maxLength: 160 }),
    escalationChannel: sanitiseNullableString(config.escalationChannel, { maxLength: 160 }),
    reviewCadence: sanitiseNullableString(config.reviewCadence, { maxLength: 120 }),
    highlightNotes: sanitiseNotes(config.highlightNotes)
  };
}

function sanitiseProductivityConfig(config = {}) {
  return {
    targetBillableHours: clampNumber(config.targetBillableHours, { min: 0, max: 400, fallback: null }),
    targetUtilisation: sanitisePercentage(config.targetUtilisation),
    backlogCeiling: clampInteger(config.backlogCeiling, { min: 0, max: 500, fallback: null }),
    responseTargetMinutes: clampInteger(config.responseTargetMinutes, { min: 0, max: 480, fallback: null }),
    note: sanitiseNullableString(config.note, { maxLength: 280 })
  };
}

function sanitiseQualityConfig(config = {}) {
  return {
    targetSla: sanitisePercentage(config.targetSla),
    reworkThreshold: sanitisePercentage(config.reworkThreshold),
    npsTarget: sanitisePercentage(config.npsTarget),
    qualityFlagLimit: clampInteger(config.qualityFlagLimit, { min: 0, max: 50, fallback: null }),
    note: sanitiseNullableString(config.note, { maxLength: 280 })
  };
}

function sanitiseLogisticsConfig(config = {}) {
  return {
    travelBufferMinutes: clampInteger(config.travelBufferMinutes, { min: 0, max: 480, fallback: null }),
    maxConcurrentJobs: clampInteger(config.maxConcurrentJobs, { min: 0, max: 50, fallback: null }),
    vehicleComplianceRate: sanitisePercentage(config.vehicleComplianceRate),
    standbyCrew: clampInteger(config.standbyCrew, { min: 0, max: 25, fallback: null }),
    note: sanitiseNullableString(config.note, { maxLength: 280 })
  };
}

function sanitiseTrainingConfig(config = {}) {
  const modules = Array.isArray(config.requiredModules) ? config.requiredModules : [];
  const cleanedModules = modules
    .map((module) => (typeof module === 'string' ? module.trim() : ''))
    .filter(Boolean)
    .slice(0, 12)
    .map((module) => module.slice(0, 160));
  const certifications = Array.isArray(config.certificationAlerts) ? config.certificationAlerts : [];
  const cleanedCertifications = certifications
    .map((cert) => {
      if (!cert || typeof cert !== 'object') {
        return null;
      }
      return {
        id: typeof cert.id === 'string' ? cert.id : uuid(),
        name: sanitiseString(cert.name, { maxLength: 160, fallback: 'Certification' }),
        dueDate: sanitiseNullableString(cert.dueDate, { maxLength: 32 }),
        owner: sanitiseNullableString(cert.owner, { maxLength: 120 })
      };
    })
    .filter(Boolean)
    .slice(0, 20);

  return {
    requiredModules: cleanedModules,
    certificationAlerts: cleanedCertifications,
    complianceDueInDays: clampInteger(config.complianceDueInDays, { min: 0, max: 365, fallback: null }),
    lastDrillCompletedAt: sanitiseNullableString(config.lastDrillCompletedAt, { maxLength: 32 }),
    nextDrillScheduledAt: sanitiseNullableString(config.nextDrillScheduledAt, { maxLength: 32 }),
    note: sanitiseNullableString(config.note, { maxLength: 280 })
  };
}

function sanitiseWellnessConfig(config = {}) {
  return {
    overtimeCapHours: clampNumber(config.overtimeCapHours, { min: 0, max: 80, fallback: null }),
    wellbeingCheckCadence: sanitiseNullableString(config.wellbeingCheckCadence, { maxLength: 120 }),
    safetyIncidentThreshold: clampInteger(config.safetyIncidentThreshold, { min: 0, max: 20, fallback: null }),
    fatigueFlagLimit: clampInteger(config.fatigueFlagLimit, { min: 0, max: 20, fallback: null }),
    note: sanitiseNullableString(config.note, { maxLength: 280 })
  };
}

function sanitiseCrewLeaderboard(entries) {
  if (!Array.isArray(entries)) {
    return [];
  }
  return entries
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      const name = sanitiseString(entry.name, { maxLength: 120, fallback: 'Crew member' });
      return {
        id: typeof entry.id === 'string' && entry.id ? entry.id : uuid(),
        name,
        role: sanitiseNullableString(entry.role, { maxLength: 120 }),
        completedJobs: clampInteger(entry.completedJobs, { min: 0, max: 10000, fallback: 0 }),
        utilisation: sanitisePercentage(entry.utilisation, 0),
        qualityScore: sanitisePercentage(entry.qualityScore, null),
        rating: clampNumber(entry.rating, { min: 0, max: 5, fallback: null }),
        avatarUrl: sanitiseNullableString(entry.avatarUrl, { maxLength: 512 }),
        spotlight: sanitiseNullableString(entry.spotlight, { maxLength: 160 })
      };
    })
    .filter(Boolean)
    .slice(0, 20);
}

function sanitiseChecklists(items) {
  if (!Array.isArray(items)) {
    return [];
  }
  return items
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null;
      }
      const label = sanitiseString(item.label, { maxLength: 160, fallback: 'Checklist item' });
      return {
        id: typeof item.id === 'string' && item.id ? item.id : uuid(),
        label,
        owner: sanitiseNullableString(item.owner, { maxLength: 120 }),
        cadence: sanitiseNullableString(item.cadence, { maxLength: 120 }),
        lastCompletedAt: sanitiseNullableString(item.lastCompletedAt, { maxLength: 32 })
      };
    })
    .filter(Boolean)
    .slice(0, 25);
}

function sanitiseAutomationConfig(config = {}) {
  return {
    autoAssignEnabled: config.autoAssignEnabled !== false,
    escalationChannel: sanitiseNullableString(config.escalationChannel, { maxLength: 160 }),
    followUpChannel: sanitiseNullableString(config.followUpChannel, { maxLength: 160 }),
    escalateWhen: sanitiseNullableString(config.escalateWhen, { maxLength: 200 })
  };
}

function sanitiseOperationsConfig(config = {}) {
  return {
    crewLeaderboard: sanitiseCrewLeaderboard(config.crewLeaderboard),
    checklists: sanitiseChecklists(config.checklists),
    automation: sanitiseAutomationConfig(config.automation)
  };
}

function sanitiseScopeConfig(scope, config) {
  switch (scope) {
    case SUMMARY_SCOPE:
      return sanitiseSummaryConfig(config);
    case PRODUCTIVITY_SCOPE:
      return sanitiseProductivityConfig(config);
    case QUALITY_SCOPE:
      return sanitiseQualityConfig(config);
    case LOGISTICS_SCOPE:
      return sanitiseLogisticsConfig(config);
    case TRAINING_SCOPE:
      return sanitiseTrainingConfig(config);
    case WELLNESS_SCOPE:
      return sanitiseWellnessConfig(config);
    case OPERATIONS_SCOPE:
      return sanitiseOperationsConfig(config);
    default:
      return {};
  }
}

function serialiseScope(record, fallback) {
  if (!record) {
    return fallback;
  }
  return sanitiseScopeConfig(record.scope, record.config || {});
}

function calculateMetadata(records = []) {
  if (!records.length) {
    return { updatedAt: null, updatedBy: null };
  }
  const sorted = [...records].sort((a, b) => {
    const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
    const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
    return bTime - aTime;
  });
  const latest = sorted[0];
  return {
    updatedAt: latest?.updatedAt ? latest.updatedAt.toISOString?.() ?? new Date(latest.updatedAt).toISOString() : null,
    updatedBy: latest?.updatedBy ?? latest?.createdBy ?? null
  };
}

function buildSettingsSnapshot(records = []) {
  const lookup = new Map(records.map((record) => [record.scope, record]));
  return {
    summary: serialiseScope(lookup.get(SUMMARY_SCOPE), sanitiseSummaryConfig()),
    productivity: serialiseScope(lookup.get(PRODUCTIVITY_SCOPE), sanitiseProductivityConfig()),
    quality: serialiseScope(lookup.get(QUALITY_SCOPE), sanitiseQualityConfig()),
    logistics: serialiseScope(lookup.get(LOGISTICS_SCOPE), sanitiseLogisticsConfig()),
    training: serialiseScope(lookup.get(TRAINING_SCOPE), sanitiseTrainingConfig()),
    wellness: serialiseScope(lookup.get(WELLNESS_SCOPE), sanitiseWellnessConfig()),
    operations: serialiseScope(lookup.get(OPERATIONS_SCOPE), sanitiseOperationsConfig()),
    metadata: calculateMetadata(records)
  };
}

function sanitiseCardDetails(details) {
  if (!Array.isArray(details)) {
    return [];
  }
  return details
    .map((detail) => (typeof detail === 'string' ? detail.trim() : ''))
    .filter((detail) => detail.length > 0)
    .slice(0, 8)
    .map((detail) => (detail.length > 240 ? `${detail.slice(0, 239)}…` : detail));
}

function sanitiseCardPayload(payload = {}) {
  const title = sanitiseString(payload.title, { maxLength: 160, fallback: '' });
  if (!title) {
    const error = new Error('Card title is required');
    error.statusCode = 422;
    throw error;
  }

  const tone = typeof payload.tone === 'string' ? payload.tone.trim().toLowerCase() : 'info';
  if (!CARD_TONES.has(tone)) {
    const error = new Error('Select a supported tone for the card');
    error.statusCode = 422;
    throw error;
  }

  const details = sanitiseCardDetails(payload.details);
  if (!details.length) {
    const error = new Error('Provide at least one detail bullet for the card');
    error.statusCode = 422;
    throw error;
  }

  const displayOrderRaw = Number.parseInt(payload.displayOrder ?? 100, 10);
  const displayOrder = Number.isFinite(displayOrderRaw) ? displayOrderRaw : 100;

  const mediaUrl = sanitiseNullableString(payload.mediaUrl, { maxLength: 512 });
  const mediaAlt = sanitiseNullableString(payload.mediaAlt, { maxLength: 160 });

  const ctaPayload = payload.cta && typeof payload.cta === 'object' ? payload.cta : null;
  let cta = null;
  if (ctaPayload) {
    const label = sanitiseString(ctaPayload.label, { maxLength: 120, fallback: '' });
    const href = sanitiseString(ctaPayload.href, { maxLength: 512, fallback: '' });
    const external = Boolean(ctaPayload.external);
    if (!label || !href) {
      const error = new Error('CTA label and link are required when adding an action');
      error.statusCode = 422;
      throw error;
    }
    cta = { label, href, external };
  }

  const isActive = payload.isActive !== false;

  return {
    title,
    tone,
    details,
    displayOrder,
    isActive,
    mediaUrl,
    mediaAlt,
    cta
  };
}

function serialiseCard(card) {
  if (!card) {
    return null;
  }
  const details = sanitiseCardDetails(card.details ?? []);
  const ctaRaw = card.cta;
  const cta = ctaRaw && typeof ctaRaw === 'object'
    ? {
        label: typeof ctaRaw.label === 'string' ? ctaRaw.label : '',
        href: typeof ctaRaw.href === 'string' ? ctaRaw.href : '',
        external: Boolean(ctaRaw.external)
      }
    : null;

  return {
    id: card.id,
    title: card.title,
    tone: card.tone || 'info',
    details,
    displayOrder: card.displayOrder ?? 100,
    isActive: card.isActive !== false,
    mediaUrl: card.mediaUrl || null,
    mediaAlt: card.mediaAlt || null,
    cta,
    updatedAt: card.updatedAt ? card.updatedAt.toISOString?.() ?? new Date(card.updatedAt).toISOString() : null,
    updatedBy: card.updatedBy ?? card.createdBy ?? null
  };
}

export async function getServicemanMetricSettingsSnapshot() {
  const records = await ServicemanMetricSetting.findAll({
    where: { scope: ALL_SCOPES },
    order: [['updatedAt', 'DESC']]
  });
  return buildSettingsSnapshot(records);
}

export async function upsertServicemanMetricSettings({
  actorId,
  summary,
  productivity,
  quality,
  logistics,
  training,
  wellness,
  operations
}) {
  const payloads = [
    { scope: SUMMARY_SCOPE, config: sanitiseSummaryConfig(summary) },
    { scope: PRODUCTIVITY_SCOPE, config: sanitiseProductivityConfig(productivity) },
    { scope: QUALITY_SCOPE, config: sanitiseQualityConfig(quality) },
    { scope: LOGISTICS_SCOPE, config: sanitiseLogisticsConfig(logistics) },
    { scope: TRAINING_SCOPE, config: sanitiseTrainingConfig(training) },
    { scope: WELLNESS_SCOPE, config: sanitiseWellnessConfig(wellness) },
    { scope: OPERATIONS_SCOPE, config: sanitiseOperationsConfig(operations) }
  ];

  await Promise.all(
    payloads.map((entry) =>
      ServicemanMetricSetting.upsert({ scope: entry.scope, config: entry.config, updatedBy: actorId ?? null })
    )
  );

  return getServicemanMetricSettingsSnapshot();
}

export async function listAllServicemanMetricCards() {
  const cards = await ServicemanMetricCard.findAll({
    order: [
      ['displayOrder', 'ASC'],
      ['createdAt', 'ASC']
    ]
  });
  return cards.map((card) => serialiseCard(card)).filter(Boolean);
}

export async function listActiveServicemanMetricCards() {
  const cards = await ServicemanMetricCard.findAll({
    where: { isActive: true },
    order: [
      ['displayOrder', 'ASC'],
      ['createdAt', 'ASC']
    ]
  });
  return cards.map((card) => serialiseCard(card)).filter(Boolean);
}

export async function createServicemanMetricCard({ payload, actorId }) {
  const body = sanitiseCardPayload(payload);
  const record = await ServicemanMetricCard.create({
    ...body,
    createdBy: actorId ?? null,
    updatedBy: actorId ?? null
  });
  return serialiseCard(record);
}

export async function updateServicemanMetricCard({ id, payload, actorId }) {
  const record = await ServicemanMetricCard.findByPk(id);
  if (!record) {
    const error = new Error('Metric card not found');
    error.statusCode = 404;
    throw error;
  }
  const body = sanitiseCardPayload(payload);
  Object.assign(record, body, { updatedBy: actorId ?? record.updatedBy ?? null });
  await record.save();
  return serialiseCard(record);
}

export async function deleteServicemanMetricCard({ id }) {
  const record = await ServicemanMetricCard.findByPk(id);
  if (!record) {
    return;
  }
  await record.destroy();
}

export async function getServicemanMetricsBundle({ includeInactiveCards = true } = {}) {
  const cardLoader = includeInactiveCards ? listAllServicemanMetricCards : listActiveServicemanMetricCards;
  const [settings, cards] = await Promise.all([
    getServicemanMetricSettingsSnapshot(),
    cardLoader()
  ]);
  return { settings, cards };
}

export default {
  getServicemanMetricSettingsSnapshot,
  upsertServicemanMetricSettings,
  listAllServicemanMetricCards,
  listActiveServicemanMetricCards,
  createServicemanMetricCard,
  updateServicemanMetricCard,
  deleteServicemanMetricCard,
  getServicemanMetricsBundle
};
