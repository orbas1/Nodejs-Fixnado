import {
  CommandMetricCard,
  CommandMetricSetting
} from '../models/index.js';

const SUMMARY_SCOPE = 'summary';
const METRIC_SCOPES = ['escrow', 'disputes', 'jobs', 'sla'];
const CARD_TONES = new Set(['info', 'success', 'warning', 'danger', 'neutral']);
const MAX_NOTE_LENGTH = 240;
const MAX_DETAILS = 8;

function toNumber(value) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return numeric;
}

function toPositiveInteger(value) {
  if (value == null || value === '') {
    return null;
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return null;
  }
  return numeric;
}

function sanitiseNotes(notes) {
  if (!Array.isArray(notes)) {
    return [];
  }
  return notes
    .map((note) => (typeof note === 'string' ? note.trim() : ''))
    .filter((note) => note.length > 0)
    .slice(0, 6)
    .map((note) => (note.length > MAX_NOTE_LENGTH ? `${note.slice(0, MAX_NOTE_LENGTH - 1)}…` : note));
}

function sanitiseSummaryConfig(config = {}) {
  return {
    highlightNotes: sanitiseNotes(config.highlightNotes)
  };
}

function assertThresholdOrder({ low, high, message }) {
  if (low != null && high != null && low >= high) {
    const error = new Error(message);
    error.statusCode = 422;
    throw error;
  }
}

function sanitiseEscrowConfig(config = {}) {
  const targetHigh = toNumber(config.targetHigh);
  const targetMedium = toNumber(config.targetMedium);
  if (targetHigh != null && targetHigh < 0) {
    const error = new Error('Escrow high target must be zero or greater');
    error.statusCode = 422;
    throw error;
  }
  if (targetMedium != null && targetMedium < 0) {
    const error = new Error('Escrow medium target must be zero or greater');
    error.statusCode = 422;
    throw error;
  }
  assertThresholdOrder({
    low: targetMedium,
    high: targetHigh,
    message: 'Escrow high target must exceed the medium target'
  });
  const captionNote = typeof config.captionNote === 'string' ? config.captionNote.trim() : '';
  return {
    targetHigh,
    targetMedium,
    captionNote: captionNote || null
  };
}

function sanitiseDisputesConfig(config = {}) {
  const thresholdLow = toNumber(config.thresholdLow);
  const thresholdMedium = toNumber(config.thresholdMedium);
  if (thresholdLow != null && thresholdLow < 0) {
    const error = new Error('Dispute low threshold must be zero or greater');
    error.statusCode = 422;
    throw error;
  }
  if (thresholdMedium != null && thresholdMedium < 0) {
    const error = new Error('Dispute medium threshold must be zero or greater');
    error.statusCode = 422;
    throw error;
  }
  assertThresholdOrder({
    low: thresholdLow,
    high: thresholdMedium,
    message: 'Dispute medium threshold must be greater than the low threshold'
  });
  const targetMedianMinutes = toPositiveInteger(config.targetMedianMinutes);
  const captionNote = typeof config.captionNote === 'string' ? config.captionNote.trim() : '';
  return {
    thresholdLow,
    thresholdMedium,
    targetMedianMinutes,
    captionNote: captionNote || null
  };
}

function sanitiseJobsConfig(config = {}) {
  const targetHigh = toNumber(config.targetHigh);
  const targetMedium = toNumber(config.targetMedium);
  if (targetHigh != null && targetHigh < 0) {
    const error = new Error('Live jobs peak threshold must be zero or greater');
    error.statusCode = 422;
    throw error;
  }
  if (targetMedium != null && targetMedium < 0) {
    const error = new Error('Live jobs medium threshold must be zero or greater');
    error.statusCode = 422;
    throw error;
  }
  assertThresholdOrder({
    low: targetMedium,
    high: targetHigh,
    message: 'Live jobs peak threshold must be greater than the available capacity threshold'
  });
  const captionNote = typeof config.captionNote === 'string' ? config.captionNote.trim() : '';
  return {
    targetHigh,
    targetMedium,
    captionNote: captionNote || null
  };
}

function sanitiseSlaConfig(config = {}) {
  const target = toNumber(config.target);
  const warning = toNumber(config.warning);
  if (target != null && (target < 0 || target > 100)) {
    const error = new Error('SLA target must be between 0 and 100');
    error.statusCode = 422;
    throw error;
  }
  if (warning != null && (warning < 0 || warning > 100)) {
    const error = new Error('SLA warning threshold must be between 0 and 100');
    error.statusCode = 422;
    throw error;
  }
  assertThresholdOrder({
    low: warning,
    high: target,
    message: 'SLA warning threshold must be below the SLA target'
  });
  const captionNote = typeof config.captionNote === 'string' ? config.captionNote.trim() : '';
  return {
    target,
    warning,
    captionNote: captionNote || null
  };
}

function normaliseMetricConfig(scope, config = {}) {
  switch (scope) {
    case 'escrow':
      return sanitiseEscrowConfig(config);
    case 'disputes':
      return sanitiseDisputesConfig(config);
    case 'jobs':
      return sanitiseJobsConfig(config);
    case 'sla':
      return sanitiseSlaConfig(config);
    default:
      return {};
  }
}

function serialiseSetting(record) {
  if (!record) {
    return {};
  }
  const config = record.config || {};
  if (record.scope === SUMMARY_SCOPE) {
    return sanitiseSummaryConfig(config);
  }
  return normaliseMetricConfig(record.scope, config);
}

export async function getCommandMetricSettingsSnapshot() {
  const records = await CommandMetricSetting.findAll();
  const summaryRecord = records.find((record) => record.scope === SUMMARY_SCOPE);
  const summary = summaryRecord ? sanitiseSummaryConfig(summaryRecord.config) : sanitiseSummaryConfig();
  const metrics = METRIC_SCOPES.reduce((acc, scope) => {
    const record = records.find((item) => item.scope === scope);
    acc[scope] = record ? normaliseMetricConfig(scope, record.config) : normaliseMetricConfig(scope, {});
    return acc;
  }, {});
  const latestUpdatedAt = records.reduce((acc, record) => {
    if (!record?.updatedAt) {
      return acc;
    }
    const timestamp = record.updatedAt.getTime();
    return timestamp > acc ? timestamp : acc;
  }, 0);
  return {
    summary,
    metrics,
    metadata: {
      updatedAt: latestUpdatedAt ? new Date(latestUpdatedAt).toISOString() : null
    }
  };
}

export async function upsertCommandMetricSettings({ actorId, summary, metrics }) {
  const summaryConfig = sanitiseSummaryConfig(summary);
  const metricConfigs = METRIC_SCOPES.reduce((acc, scope) => {
    acc[scope] = normaliseMetricConfig(scope, metrics?.[scope]);
    return acc;
  }, {});

  await CommandMetricSetting.upsert({
    scope: SUMMARY_SCOPE,
    config: summaryConfig,
    updatedBy: actorId
  });

  await Promise.all(
    METRIC_SCOPES.map((scope) =>
      CommandMetricSetting.upsert({
        scope,
        config: metricConfigs[scope],
        updatedBy: actorId
      })
    )
  );

  return getCommandMetricSettingsSnapshot();
}

function sanitiseCardDetails(details) {
  if (!Array.isArray(details)) {
    return [];
  }
  return details
    .map((detail) => (typeof detail === 'string' ? detail.trim() : ''))
    .filter((detail) => detail.length > 0)
    .slice(0, MAX_DETAILS)
    .map((detail) => (detail.length > MAX_NOTE_LENGTH ? `${detail.slice(0, MAX_NOTE_LENGTH - 1)}…` : detail));
}

function sanitiseCardPayload(payload = {}) {
  const title = typeof payload.title === 'string' ? payload.title.trim() : '';
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

  const mediaUrl = typeof payload.mediaUrl === 'string' ? payload.mediaUrl.trim() : '';
  const mediaAlt = typeof payload.mediaAlt === 'string' ? payload.mediaAlt.trim() : '';

  const ctaPayload = payload.cta && typeof payload.cta === 'object' ? payload.cta : null;
  let cta = null;
  if (ctaPayload) {
    const label = typeof ctaPayload.label === 'string' ? ctaPayload.label.trim() : '';
    const href = typeof ctaPayload.href === 'string' ? ctaPayload.href.trim() : '';
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
    mediaUrl: mediaUrl || null,
    mediaAlt: mediaAlt || null,
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
    updatedAt: card.updatedAt ? card.updatedAt.toISOString() : null,
    updatedBy: card.updatedBy ?? card.createdBy ?? null
  };
}

export async function listActiveCommandMetricCards() {
  const cards = await CommandMetricCard.findAll({
    where: { isActive: true },
    order: [
      ['displayOrder', 'ASC'],
      ['createdAt', 'ASC']
    ]
  });
  return cards.map((card) => serialiseCard(card)).filter(Boolean);
}

export async function listAllCommandMetricCards() {
  const cards = await CommandMetricCard.findAll({
    order: [
      ['displayOrder', 'ASC'],
      ['createdAt', 'ASC']
    ]
  });
  return cards.map((card) => serialiseCard(card)).filter(Boolean);
}

export async function createCommandMetricCard({ payload, actorId }) {
  const body = sanitiseCardPayload(payload);
  const card = await CommandMetricCard.create({
    ...body,
    createdBy: actorId,
    updatedBy: actorId
  });
  return serialiseCard(card);
}

export async function updateCommandMetricCard({ id, payload, actorId }) {
  const card = await CommandMetricCard.findByPk(id);
  if (!card) {
    const error = new Error('Command metric card not found');
    error.statusCode = 404;
    throw error;
  }
  const body = sanitiseCardPayload(payload);
  await card.update({
    ...body,
    updatedBy: actorId
  });
  return serialiseCard(card);
}

export async function deleteCommandMetricCard({ id }) {
  const card = await CommandMetricCard.findByPk(id);
  if (!card) {
    const error = new Error('Command metric card not found');
    error.statusCode = 404;
    throw error;
  }
  await card.destroy();
}

export default {
  getCommandMetricSettingsSnapshot,
  upsertCommandMetricSettings,
  listActiveCommandMetricCards,
  listAllCommandMetricCards,
  createCommandMetricCard,
  updateCommandMetricCard,
  deleteCommandMetricCard
};
