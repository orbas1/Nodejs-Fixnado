import config from '../config/index.js';
import { PlatformSetting } from '../models/index.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function deepMerge(base, override) {
  const result = clone(base);
  if (!override || typeof override !== 'object') {
    return result;
  }

  for (const [key, value] of Object.entries(override)) {
    if (isPlainObject(value) && isPlainObject(result[key])) {
      result[key] = deepMerge(result[key], value);
    } else if (Array.isArray(value)) {
      result[key] = value.slice();
    } else {
      result[key] = value;
    }
  }

  return result;
}

function uniqueStrings(values = []) {
  const seen = new Set();
  const output = [];
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    const normalised = trimmed.toLowerCase();
    if (seen.has(normalised)) continue;
    seen.add(normalised);
    output.push(trimmed);
  }
  return output;
}

function parseRate(value, fallback) {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  if (parsed < 0 || parsed > 1) {
    return fallback;
  }
  return Number.parseFloat(parsed.toFixed(4));
}

const defaultCommissionRates = (() => {
  const { commissionRates = {} } = config.finance ?? {};
  const { default: defaultRate = 0.025, ...custom } = commissionRates;
  return {
    defaultRate: parseRate(defaultRate, 0.025),
    custom
  };
})();

function toSlug(value, fallback) {
  if (typeof value !== 'string') {
    return fallback;
  }
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return slug || fallback;
}

function parseIntegerInRange(value, fallback, { min = 0, max = 365 } = {}) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  if (parsed < min) {
    return min;
  }
  if (parsed > max) {
    return max;
  }
  return parsed;
}

function parseAmount(value, fallback) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return fallback;
  }
  return Number.parseFloat(parsed.toFixed(2));
}

function normaliseNotificationRecipients(update = {}, current = {}) {
  const result = { ...current };
  if (!isPlainObject(update)) {
    return result;
  }
  for (const [key, value] of Object.entries(update)) {
    if (Array.isArray(value)) {
      result[key] = uniqueStrings(value);
    } else if (typeof value === 'string') {
      result[key] = uniqueStrings(value.split(','));
    }
  }
  return result;
}

function normalisePolicy(policy, fallback, index = 0) {
  if (!policy || typeof policy !== 'object') {
    return null;
  }

  const baseDays = fallback?.autoReleaseDays ?? 3;
  const fallbackChecklist = Array.isArray(fallback?.documentChecklist) ? fallback.documentChecklist : [];
  const name = typeof policy.name === 'string' && policy.name.trim() ? policy.name.trim() : null;
  const description = typeof policy.description === 'string' ? policy.description.trim() : '';
  const id = toSlug(policy.id || name || `policy-${index + 1}`, `policy-${index + 1}`);
  const autoReleaseDays = parseIntegerInRange(policy.autoReleaseDays ?? baseDays, baseDays, {
    min: 0,
    max: 180
  });
  const maxAmount = parseAmount(policy.maxAmount, null);
  const notifyRoles = Array.isArray(policy.notifyRoles)
    ? uniqueStrings(policy.notifyRoles)
    : typeof policy.notifyRoles === 'string'
      ? uniqueStrings(policy.notifyRoles.split(','))
      : [];
  const documentChecklist = Array.isArray(policy.documentChecklist)
    ? uniqueStrings(policy.documentChecklist)
    : typeof policy.documentChecklist === 'string'
      ? uniqueStrings(policy.documentChecklist.split(','))
      : fallbackChecklist;
  const releaseConditions = Array.isArray(policy.releaseConditions)
    ? policy.releaseConditions.map((condition) => `${condition}`.trim()).filter(Boolean)
    : [];

  return {
    id,
    name: name || `Policy ${index + 1}`,
    description,
    autoReleaseDays,
    requiresDualApproval: Boolean(policy.requiresDualApproval),
    maxAmount,
    notifyRoles,
    documentChecklist: documentChecklist.length > 0 ? documentChecklist : fallbackChecklist,
    releaseConditions
  };
}

const defaultEscrowSettings = (() => {
  const escrowConfig = config.payments?.escrow ?? {};
  const autoReleaseDays = parseIntegerInRange(escrowConfig.autoReleaseDays ?? 3, 3, { min: 0, max: 180 });
  const manualApprovalThreshold = parseAmount(escrowConfig.manualApprovalThreshold ?? 2500, 2500);
  const allowedCurrencies = Array.isArray(escrowConfig.allowedCurrencies)
    ? uniqueStrings(escrowConfig.allowedCurrencies)
    : uniqueStrings(['GBP', 'USD', 'EUR']);
  const documentChecklist = Array.isArray(escrowConfig.documentChecklist)
    ? uniqueStrings(escrowConfig.documentChecklist)
    : ['Completion photos', 'Client sign-off form'];
  const notificationRecipients = normaliseNotificationRecipients(escrowConfig.notificationRecipients, {
    finance: ['finance@fixnado.com'],
    operations: []
  });
  const fallback = {
    autoReleaseDays,
    documentChecklist
  };
  const policySource = Array.isArray(escrowConfig.releasePolicies) && escrowConfig.releasePolicies.length > 0
    ? escrowConfig.releasePolicies
    : [
        {
          id: 'standard',
          name: 'Standard release',
          description: 'Auto release once buyer signs off with a three-day inspection buffer.',
          autoReleaseDays: autoReleaseDays,
          requiresDualApproval: false,
          maxAmount: 25000,
          notifyRoles: ['finance']
        },
        {
          id: 'high-value',
          name: 'High value works',
          description: 'Dual approval with finance + operations alerts for high value or regulated jobs.',
          autoReleaseDays: Math.max(autoReleaseDays, 7),
          requiresDualApproval: true,
          notifyRoles: ['finance', 'operations'],
          releaseConditions: ['Escalate to finance for manual payout approval']
        }
      ];
  const releasePolicies = policySource
    .map((policy, index) => normalisePolicy(policy, fallback, index))
    .filter(Boolean);

  return {
    autoReleaseDays,
    manualApprovalThreshold,
    allowedCurrencies: allowedCurrencies.length > 0 ? allowedCurrencies : ['GBP'],
    documentChecklist,
    notificationRecipients,
    releasePolicies
  };
})();

const DEFAULT_SETTINGS = {
  commissions: {
    enabled: config.finance?.commissionsEnabled !== false,
    baseRate: defaultCommissionRates.defaultRate,
    customRates: defaultCommissionRates.custom
  },
  subscriptions: {
    enabled: config.subscriptions?.enabled !== false,
    enforceFeatures: config.subscriptions?.enforceFeatures !== false,
    defaultTier: config.subscriptions?.defaultTier || 'standard',
    tiers: Array.isArray(config.subscriptions?.tiers) ? config.subscriptions.tiers : [],
    restrictedFeatures: Array.isArray(config.subscriptions?.restrictedFeatures)
      ? uniqueStrings(config.subscriptions.restrictedFeatures)
      : []
  },
  escrow: defaultEscrowSettings,
  integrations: {
    stripe: {
      publishableKey: config.integrations?.stripe?.publishableKey || '',
      secretKey: config.integrations?.stripe?.secretKey || '',
      webhookSecret: config.integrations?.stripe?.webhookSecret || '',
      accountId: config.integrations?.stripe?.accountId || ''
    },
    escrow: {
      apiKey: config.integrations?.escrow?.apiKey || '',
      apiSecret: config.integrations?.escrow?.apiSecret || '',
      environment: config.integrations?.escrow?.environment || 'sandbox'
    },
    smtp: {
      host: config.integrations?.smtp?.host || '',
      port: Number.parseInt(config.integrations?.smtp?.port ?? '587', 10) || 587,
      username: config.integrations?.smtp?.username || '',
      password: config.integrations?.smtp?.password || '',
      fromEmail: config.integrations?.smtp?.fromEmail || '',
      secure: config.integrations?.smtp?.secure === true
    },
    cloudflareR2: {
      accountId: config.integrations?.cloudflareR2?.accountId || '',
      accessKeyId: config.integrations?.cloudflareR2?.accessKeyId || '',
      secretAccessKey: config.integrations?.cloudflareR2?.secretAccessKey || '',
      bucket: config.integrations?.cloudflareR2?.bucket || '',
      publicUrl: config.integrations?.cloudflareR2?.publicUrl || '',
      endpoint: config.integrations?.cloudflareR2?.endpoint || ''
    },
    app: {
      name: config.integrations?.app?.name || process.env.APP_NAME || 'Fixnado',
      url: config.integrations?.app?.url || process.env.APP_URL || '',
      supportEmail: config.integrations?.app?.supportEmail || process.env.SUPPORT_EMAIL || ''
    },
    database: {
      host: config.database?.host || 'localhost',
      port: Number.parseInt(config.database?.port ?? '5432', 10) || 5432,
      name: config.database?.name || 'fixnado',
      user: config.database?.user || 'fixnado_user',
      password: process.env.DB_PASSWORD || '',
      ssl: Boolean(config.database?.ssl)
    }
  }
};

let cachedSettings = clone(DEFAULT_SETTINGS);
let cacheLoaded = false;
let inflight = null;

function applyRuntimeSideEffects(settings) {
  const commissions = settings.commissions ?? DEFAULT_SETTINGS.commissions;
  const commissionRates = { ...commissions.customRates };
  const baseRate = parseRate(commissions.baseRate, DEFAULT_SETTINGS.commissions.baseRate);
  commissionRates.default = baseRate;

  config.finance = config.finance || {};
  config.finance.commissionRates = commissionRates;
  config.finance.commissionsEnabled = commissions.enabled !== false;

  config.subscriptions = {
    ...(config.subscriptions || {}),
    enabled: settings.subscriptions?.enabled !== false,
    enforceFeatures: settings.subscriptions?.enforceFeatures !== false,
    defaultTier: settings.subscriptions?.defaultTier || DEFAULT_SETTINGS.subscriptions.defaultTier,
    tiers: clone(settings.subscriptions?.tiers ?? []),
    restrictedFeatures: clone(settings.subscriptions?.restrictedFeatures ?? [])
  };

  config.integrations = deepMerge(config.integrations || {}, settings.integrations || {});

  config.payments = config.payments || {};
  config.payments.escrow = clone(settings.escrow ?? DEFAULT_SETTINGS.escrow);
}

async function refreshCache() {
  const next = clone(DEFAULT_SETTINGS);
  try {
    const rows = await PlatformSetting.findAll({ raw: true });
    for (const row of rows) {
      if (!row?.key || !Object.hasOwn(next, row.key)) {
        continue;
      }
      const value = row.value && typeof row.value === 'object' ? row.value : {};
      next[row.key] = deepMerge(next[row.key], value);
    }
  } catch (error) {
    console.warn('Failed to hydrate platform settings, continuing with defaults:', error.message);
  }

  applyRuntimeSideEffects(next);
  cachedSettings = next;
  cacheLoaded = true;
  return next;
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

function sanitiseCommissions(update = {}, current = DEFAULT_SETTINGS.commissions) {
  const next = { ...current };
  if (Object.hasOwn(update, 'enabled')) {
    next.enabled = Boolean(update.enabled);
  }
  if (Object.hasOwn(update, 'baseRate')) {
    next.baseRate = parseRate(update.baseRate, current.baseRate);
  }
  if (isPlainObject(update.customRates)) {
    const cleaned = {};
    for (const [key, rate] of Object.entries(update.customRates)) {
      if (!key) continue;
      const numeric = parseRate(rate, null);
      if (numeric === null) continue;
      cleaned[key] = numeric;
    }
    next.customRates = cleaned;
  }
  return next;
}

function sanitiseTiers(tiers, fallback) {
  if (!Array.isArray(tiers)) {
    return fallback;
  }
  const cleaned = [];
  for (const tier of tiers) {
    if (!tier || typeof tier !== 'object') continue;
    const id = typeof tier.id === 'string' && tier.id.trim() ? tier.id.trim().toLowerCase() : null;
    const label = typeof tier.label === 'string' && tier.label.trim() ? tier.label.trim() : null;
    if (!id || !label) continue;
    const description = typeof tier.description === 'string' ? tier.description.trim() : '';
    let features = [];
    if (Array.isArray(tier.features)) {
      features = uniqueStrings(tier.features);
    } else if (typeof tier.features === 'string') {
      features = uniqueStrings(tier.features.split(','));
    }
    cleaned.push({ id, label, description, features });
  }
  return cleaned.length > 0 ? cleaned : fallback;
}

function sanitiseSubscriptions(update = {}, current = DEFAULT_SETTINGS.subscriptions) {
  const next = clone(current);
  if (Object.hasOwn(update, 'enabled')) {
    next.enabled = Boolean(update.enabled);
  }
  if (Object.hasOwn(update, 'enforceFeatures')) {
    next.enforceFeatures = Boolean(update.enforceFeatures);
  }
  if (Object.hasOwn(update, 'defaultTier') && typeof update.defaultTier === 'string' && update.defaultTier.trim()) {
    next.defaultTier = update.defaultTier.trim().toLowerCase();
  }
  if (Object.hasOwn(update, 'restrictedFeatures')) {
    if (Array.isArray(update.restrictedFeatures)) {
      next.restrictedFeatures = uniqueStrings(update.restrictedFeatures);
    } else if (typeof update.restrictedFeatures === 'string') {
      next.restrictedFeatures = uniqueStrings(update.restrictedFeatures.split(','));
    }
  }
  if (Object.hasOwn(update, 'tiers')) {
    const tiers = sanitiseTiers(update.tiers, next.tiers);
    next.tiers = tiers;
    if (!tiers.some((tier) => tier.id === next.defaultTier) && tiers.length > 0) {
      next.defaultTier = tiers[0].id;
    }
  }
  return next;
}

function sanitiseStrings(map = {}, template = {}) {
  const result = { ...template };
  for (const [key, value] of Object.entries(map)) {
    if (typeof value === 'string') {
      result[key] = value.trim();
    } else {
      result[key] = value;
    }
  }
  return result;
}

function sanitiseEscrow(update = {}, current = DEFAULT_SETTINGS.escrow) {
  const next = clone(current);
  if (Object.hasOwn(update, 'autoReleaseDays')) {
    next.autoReleaseDays = parseIntegerInRange(update.autoReleaseDays, current.autoReleaseDays, {
      min: 0,
      max: 180
    });
  }
  if (Object.hasOwn(update, 'manualApprovalThreshold')) {
    next.manualApprovalThreshold = parseAmount(update.manualApprovalThreshold, current.manualApprovalThreshold);
  }
  if (Object.hasOwn(update, 'allowedCurrencies')) {
    if (Array.isArray(update.allowedCurrencies)) {
      next.allowedCurrencies = uniqueStrings(update.allowedCurrencies);
    } else if (typeof update.allowedCurrencies === 'string') {
      next.allowedCurrencies = uniqueStrings(update.allowedCurrencies.split(','));
    }
    if (!next.allowedCurrencies.length) {
      next.allowedCurrencies = current.allowedCurrencies;
    }
  }
  if (Object.hasOwn(update, 'documentChecklist')) {
    if (Array.isArray(update.documentChecklist)) {
      next.documentChecklist = uniqueStrings(update.documentChecklist);
    } else if (typeof update.documentChecklist === 'string') {
      next.documentChecklist = uniqueStrings(update.documentChecklist.split(','));
    }
    if (!next.documentChecklist.length) {
      next.documentChecklist = current.documentChecklist;
    }
  }
  if (Object.hasOwn(update, 'notificationRecipients')) {
    next.notificationRecipients = normaliseNotificationRecipients(
      update.notificationRecipients,
      current.notificationRecipients
    );
  }
  if (Object.hasOwn(update, 'releasePolicies') && Array.isArray(update.releasePolicies)) {
    const cleaned = update.releasePolicies
      .map((policy, index) => normalisePolicy(policy, next, index))
      .filter(Boolean);
    if (cleaned.length > 0) {
      next.releasePolicies = cleaned;
    }
  }
  return next;
}

function sanitiseIntegrations(update = {}, current = DEFAULT_SETTINGS.integrations) {
  const next = clone(current);
  if (update.stripe && typeof update.stripe === 'object') {
    next.stripe = sanitiseStrings(update.stripe, next.stripe);
  }
  if (update.escrow && typeof update.escrow === 'object') {
    next.escrow = sanitiseStrings(update.escrow, next.escrow);
    if (next.escrow.environment) {
      next.escrow.environment = next.escrow.environment.toLowerCase();
    }
  }
  if (update.smtp && typeof update.smtp === 'object') {
    next.smtp = sanitiseStrings(update.smtp, next.smtp);
    if (Object.hasOwn(update.smtp, 'port')) {
      const parsed = Number.parseInt(update.smtp.port, 10);
      next.smtp.port = Number.isFinite(parsed) ? parsed : next.smtp.port;
    }
    if (Object.hasOwn(update.smtp, 'secure')) {
      next.smtp.secure = Boolean(update.smtp.secure);
    }
  }
  if (update.cloudflareR2 && typeof update.cloudflareR2 === 'object') {
    next.cloudflareR2 = sanitiseStrings(update.cloudflareR2, next.cloudflareR2);
  }
  if (update.app && typeof update.app === 'object') {
    next.app = sanitiseStrings(update.app, next.app);
  }
  if (update.database && typeof update.database === 'object') {
    next.database = sanitiseStrings(update.database, next.database);
    if (Object.hasOwn(update.database, 'port')) {
      const parsed = Number.parseInt(update.database.port, 10);
      next.database.port = Number.isFinite(parsed) ? parsed : next.database.port;
    }
    if (Object.hasOwn(update.database, 'ssl')) {
      next.database.ssl = Boolean(update.database.ssl);
    }
  }
  return next;
}

function validationError(message, details = []) {
  const error = new Error(message);
  error.name = 'ValidationError';
  error.statusCode = 422;
  error.details = details;
  return error;
}

export async function getPlatformSettings({ forceRefresh = false } = {}) {
  const settings = await ensureCache(forceRefresh);
  return clone(settings);
}

export function getCachedPlatformSettings() {
  return clone(cachedSettings);
}

export async function updatePlatformSettings(updates = {}, actor = 'system') {
  await ensureCache();
  const current = clone(cachedSettings);
  const next = clone(current);
  const changedKeys = new Set();

  if (Object.hasOwn(updates, 'commissions')) {
    next.commissions = sanitiseCommissions(updates.commissions, current.commissions);
    changedKeys.add('commissions');
  }

  if (Object.hasOwn(updates, 'subscriptions')) {
    next.subscriptions = sanitiseSubscriptions(updates.subscriptions, current.subscriptions);
    changedKeys.add('subscriptions');
  }

  if (Object.hasOwn(updates, 'escrow')) {
    next.escrow = sanitiseEscrow(updates.escrow, current.escrow);
    changedKeys.add('escrow');
  }

  if (Object.hasOwn(updates, 'integrations')) {
    next.integrations = sanitiseIntegrations(updates.integrations, current.integrations);
    changedKeys.add('integrations');
  }

  if (changedKeys.size === 0) {
    throw validationError('No recognised settings provided for update.');
  }

  const operations = [];
  for (const key of changedKeys) {
    operations.push(
      PlatformSetting.upsert({
        key,
        value: next[key],
        updatedBy: actor || 'system'
      })
    );
  }

  await Promise.all(operations);
  applyRuntimeSideEffects(next);
  cachedSettings = next;

  return clone(next);
}
