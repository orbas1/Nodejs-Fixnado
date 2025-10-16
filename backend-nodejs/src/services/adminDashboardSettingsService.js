import { PlatformSetting } from '../models/index.js';

const SETTING_KEY = 'adminDashboardOverview';

const DEFAULT_OVERVIEW_SETTINGS = Object.freeze({
  metrics: {
    escrow: {
      label: 'Escrow under management',
      caption: '',
      targetHighMultiplier: 1.05,
      targetMediumMultiplier: 0.9
    },
    disputes: {
      label: 'Disputes requiring action',
      caption: '',
      thresholdLowMultiplier: 0.7,
      thresholdMediumMultiplier: 1.1
    },
    jobs: {
      label: 'Live jobs',
      caption: '',
      targetHighMultiplier: 1.2,
      targetMediumMultiplier: 0.9
    },
    sla: {
      label: 'SLA compliance',
      caption: '',
      goal: 97,
      warningThreshold: 94
    }
  },
  charts: {
    escrow: {
      targetDivisor: 1_000_000,
      targetLabel: 'Baseline target'
    }
  },
  insights: {
    manual: []
  },
  timeline: {
    manual: []
  },
  security: {
    manualSignals: []
  },
  automation: {
    manualBacklog: []
  },
  queues: {
    manualBoards: [],
    manualComplianceControls: []
  },
  audit: {
    manualTimeline: []
  }
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function clampNumber(value, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY, precision = 3 } = {}) {
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    return null;
  }
  const clamped = Math.min(Math.max(numeric, min), max);
  const factor = 10 ** precision;
  return Math.round(clamped * factor) / factor;
}

function normaliseText(value, fallback = '', { maxLength = 160 } = {}) {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return fallback;
  }
  return trimmed.slice(0, maxLength);
}

function sanitiseMetric(update = {}, current, defaults) {
  const next = { ...current };
  if (Object.hasOwn(update, 'label')) {
    next.label = normaliseText(update.label, current.label, { maxLength: 80 }) || defaults.label;
  }
  if (Object.hasOwn(update, 'caption')) {
    next.caption = normaliseText(update.caption, '', { maxLength: 200 });
  }
  if (Object.hasOwn(update, 'targetHighMultiplier')) {
    const numeric = clampNumber(update.targetHighMultiplier, { min: 0.01, max: 10, precision: 3 });
    if (numeric !== null) {
      next.targetHighMultiplier = numeric;
    }
  }
  if (Object.hasOwn(update, 'targetMediumMultiplier')) {
    const numeric = clampNumber(update.targetMediumMultiplier, { min: 0.01, max: 10, precision: 3 });
    if (numeric !== null) {
      next.targetMediumMultiplier = numeric;
    }
  }
  if (Object.hasOwn(update, 'thresholdLowMultiplier')) {
    const numeric = clampNumber(update.thresholdLowMultiplier, { min: 0.01, max: 10, precision: 3 });
    if (numeric !== null) {
      next.thresholdLowMultiplier = numeric;
    }
  }
  if (Object.hasOwn(update, 'thresholdMediumMultiplier')) {
    const numeric = clampNumber(update.thresholdMediumMultiplier, { min: 0.01, max: 10, precision: 3 });
    if (numeric !== null) {
      next.thresholdMediumMultiplier = numeric;
    }
  }
  if (Object.hasOwn(update, 'goal')) {
    const numeric = clampNumber(update.goal, { min: 0, max: 100, precision: 2 });
    if (numeric !== null) {
      next.goal = numeric;
    }
  }
  if (Object.hasOwn(update, 'warningThreshold')) {
    const numeric = clampNumber(update.warningThreshold, { min: 0, max: 100, precision: 2 });
    if (numeric !== null) {
      next.warningThreshold = numeric;
    }
  }
  return next;
}

function sanitiseChart(update = {}, current) {
  const next = { ...current };
  if (Object.hasOwn(update, 'targetDivisor')) {
    const numeric = clampNumber(update.targetDivisor, { min: 1, max: 10_000_000, precision: 0 });
    if (numeric !== null) {
      next.targetDivisor = numeric;
    }
  }
  if (Object.hasOwn(update, 'targetLabel')) {
    next.targetLabel = normaliseText(update.targetLabel, current.targetLabel, { maxLength: 80 });
  }
  return next;
}

function sanitiseManualInsights(update, current) {
  if (!Array.isArray(update)) {
    return current;
  }
  const seen = new Set();
  const result = [];
  for (const entry of update) {
    if (typeof entry !== 'string') continue;
    const trimmed = entry.trim();
    if (!trimmed) continue;
    const normalised = trimmed.toLowerCase();
    if (seen.has(normalised)) continue;
    seen.add(normalised);
    result.push(trimmed.slice(0, 240));
    if (result.length >= 12) break;
  }
  return result;
}

function sanitiseManualTimeline(update, current) {
  if (!Array.isArray(update)) {
    return current;
  }
  const result = [];
  for (const entry of update) {
    if (!entry || typeof entry !== 'object') continue;
    const title = normaliseText(entry.title, '', { maxLength: 80 });
    const when = normaliseText(entry.when, '', { maxLength: 80 });
    const status = normaliseText(entry.status, '', { maxLength: 80 });
    if (!title || !when) continue;
    result.push({ title, when, status });
    if (result.length >= 12) break;
  }
  return result;
}

const ALLOWED_TONES = new Set(['success', 'info', 'warning', 'danger']);

function sanitiseManualSignals(update, current) {
  if (!Array.isArray(update)) {
    return current;
  }
  const result = [];
  for (const entry of update) {
    if (!entry || typeof entry !== 'object') continue;
    const label = normaliseText(entry.label, '', { maxLength: 60 });
    const caption = normaliseText(entry.caption, '', { maxLength: 120 });
    const valueLabel = normaliseText(entry.valueLabel, '', { maxLength: 40 });
    if (!label || !valueLabel) continue;
    const tone = typeof entry.tone === 'string' && ALLOWED_TONES.has(entry.tone) ? entry.tone : 'info';
    result.push({ label, caption, valueLabel, tone });
    if (result.length >= 6) break;
  }
  return result;
}

function sanitiseManualAutomation(update, current) {
  if (!Array.isArray(update)) {
    return current;
  }
  const result = [];
  for (const entry of update) {
    if (!entry || typeof entry !== 'object') continue;
    const name = normaliseText(entry.name, '', { maxLength: 80 });
    const status = normaliseText(entry.status, '', { maxLength: 60 });
    const notes = normaliseText(entry.notes, '', { maxLength: 200 });
    if (!name || !status) continue;
    const tone = typeof entry.tone === 'string' && ALLOWED_TONES.has(entry.tone) ? entry.tone : 'info';
    result.push({ name, status, notes, tone });
    if (result.length >= 8) break;
  }
  return result;
}

function sanitiseManualBoards(update, current) {
  if (!Array.isArray(update)) {
    return current;
  }
  const result = [];
  for (const entry of update) {
    if (!entry || typeof entry !== 'object') continue;
    const title = normaliseText(entry.title, '', { maxLength: 80 });
    const summary = normaliseText(entry.summary, '', { maxLength: 200 });
    const owner = normaliseText(entry.owner, '', { maxLength: 80 });
    const updates = Array.isArray(entry.updates)
      ? entry.updates
          .map((updateEntry) => normaliseText(updateEntry, '', { maxLength: 160 }))
          .filter(Boolean)
          .slice(0, 5)
      : [];
    if (!title || !summary) continue;
    result.push({ title, summary, owner, updates });
    if (result.length >= 6) break;
  }
  return result;
}

function sanitiseManualCompliance(update, current) {
  if (!Array.isArray(update)) {
    return current;
  }
  const result = [];
  for (const entry of update) {
    if (!entry || typeof entry !== 'object') continue;
    const name = normaliseText(entry.name, '', { maxLength: 80 });
    const detail = normaliseText(entry.detail, '', { maxLength: 200 });
    const due = normaliseText(entry.due, '', { maxLength: 60 });
    const owner = normaliseText(entry.owner, '', { maxLength: 80 });
    if (!name || !detail || !due) continue;
    const tone = typeof entry.tone === 'string' && ALLOWED_TONES.has(entry.tone) ? entry.tone : 'info';
    result.push({ name, detail, due, owner, tone });
    if (result.length >= 8) break;
  }
  return result;
}

function sanitiseManualAudit(update, current) {
  if (!Array.isArray(update)) {
    return current;
  }
  const result = [];
  for (const entry of update) {
    if (!entry || typeof entry !== 'object') continue;
    const time = normaliseText(entry.time, '', { maxLength: 80 });
    const event = normaliseText(entry.event, '', { maxLength: 120 });
    const owner = normaliseText(entry.owner, '', { maxLength: 80 });
    const status = normaliseText(entry.status, '', { maxLength: 80 });
    if (!time || !event) continue;
    result.push({ time, event, owner, status });
    if (result.length >= 10) break;
  }
  return result;
}

function applyUpdate(current, update = {}) {
  const next = clone(current);
  if (update.metrics && typeof update.metrics === 'object') {
    if (update.metrics.escrow) {
      next.metrics.escrow = sanitiseMetric(update.metrics.escrow, next.metrics.escrow, DEFAULT_OVERVIEW_SETTINGS.metrics.escrow);
    }
    if (update.metrics.disputes) {
      next.metrics.disputes = sanitiseMetric(
        update.metrics.disputes,
        next.metrics.disputes,
        DEFAULT_OVERVIEW_SETTINGS.metrics.disputes
      );
    }
    if (update.metrics.jobs) {
      next.metrics.jobs = sanitiseMetric(update.metrics.jobs, next.metrics.jobs, DEFAULT_OVERVIEW_SETTINGS.metrics.jobs);
    }
    if (update.metrics.sla) {
      next.metrics.sla = sanitiseMetric(update.metrics.sla, next.metrics.sla, DEFAULT_OVERVIEW_SETTINGS.metrics.sla);
    }
  }

  if (update.charts && typeof update.charts === 'object') {
    if (update.charts.escrow) {
      next.charts.escrow = sanitiseChart(update.charts.escrow, next.charts.escrow);
    }
  }

  if (update.insights && typeof update.insights === 'object') {
    if (Object.hasOwn(update.insights, 'manual')) {
      next.insights.manual = sanitiseManualInsights(update.insights.manual, next.insights.manual);
    }
  }

  if (update.timeline && typeof update.timeline === 'object') {
    if (Object.hasOwn(update.timeline, 'manual')) {
      next.timeline.manual = sanitiseManualTimeline(update.timeline.manual, next.timeline.manual);
    }
  }

  if (update.security && typeof update.security === 'object') {
    if (Object.hasOwn(update.security, 'manualSignals')) {
      next.security.manualSignals = sanitiseManualSignals(update.security.manualSignals, next.security.manualSignals);
    }
  }

  if (update.automation && typeof update.automation === 'object') {
    if (Object.hasOwn(update.automation, 'manualBacklog')) {
      next.automation.manualBacklog = sanitiseManualAutomation(update.automation.manualBacklog, next.automation.manualBacklog);
    }
  }

  if (update.queues && typeof update.queues === 'object') {
    if (Object.hasOwn(update.queues, 'manualBoards')) {
      next.queues.manualBoards = sanitiseManualBoards(update.queues.manualBoards, next.queues.manualBoards);
    }
    if (Object.hasOwn(update.queues, 'manualComplianceControls')) {
      next.queues.manualComplianceControls = sanitiseManualCompliance(
        update.queues.manualComplianceControls,
        next.queues.manualComplianceControls
      );
    }
  }

  if (update.audit && typeof update.audit === 'object') {
    if (Object.hasOwn(update.audit, 'manualTimeline')) {
      next.audit.manualTimeline = sanitiseManualAudit(update.audit.manualTimeline, next.audit.manualTimeline);
    }
  }

  return next;
}

function normaliseSettings(raw = {}) {
  const base = clone(DEFAULT_OVERVIEW_SETTINGS);
  return applyUpdate(base, raw);
}

let cachedSettings = clone(DEFAULT_OVERVIEW_SETTINGS);
let cacheLoaded = false;
let inflight = null;

async function refreshCache() {
  let stored = {};
  try {
    const record = await PlatformSetting.findOne({ where: { key: SETTING_KEY }, raw: true });
    stored = record?.value && typeof record.value === 'object' ? record.value : {};
  } catch (error) {
    console.warn('Failed to hydrate admin dashboard overview settings, continuing with defaults:', error.message);
  }
  const normalised = normaliseSettings(stored);
  cachedSettings = normalised;
  cacheLoaded = true;
  return normalised;
}

async function ensureCache(forceRefresh = false) {
  if (cacheLoaded && !forceRefresh) {
    return cachedSettings;
  }
  if (!inflight) {
    inflight = refreshCache().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

export async function getOverviewSettings({ forceRefresh = false } = {}) {
  const settings = await ensureCache(forceRefresh);
  return clone(settings);
}

export async function updateOverviewSettings(update, actorId = 'system') {
  if (!update || typeof update !== 'object') {
    const error = new Error('Invalid overview settings payload');
    error.statusCode = 422;
    throw error;
  }

  const current = await ensureCache();
  const next = applyUpdate(current, update);

  await PlatformSetting.upsert({
    key: SETTING_KEY,
    value: next,
    updatedBy: actorId
  });

  cachedSettings = next;
  cacheLoaded = true;

  return clone(next);
}

export function __resetOverviewSettingsCache() {
  cacheLoaded = false;
  cachedSettings = clone(DEFAULT_OVERVIEW_SETTINGS);
}

export { DEFAULT_OVERVIEW_SETTINGS };
