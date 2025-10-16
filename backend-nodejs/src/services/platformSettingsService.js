import slugify from 'slugify';
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

function parseMoney(value, fallback = 0) {
  if (value === null || value === undefined || value === '') {
    return fallback;
  }
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Number.parseFloat(parsed.toFixed(2));
}

function parsePositiveInteger(value, fallback, { min = 0, max = Number.POSITIVE_INFINITY } = {}) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  const clamped = Math.max(min, Math.min(parsed, max));
  return clamped;
}

function normaliseCurrency(value, fallback = 'GBP') {
  if (typeof value !== 'string') {
    return fallback;
  }
  const cleaned = value.trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(cleaned)) {
    return fallback;
  }
  return cleaned;
}

function sanitiseCommissionStructures(structures, fallback) {
  if (!Array.isArray(structures)) {
    return fallback;
  }

  const cleaned = [];
  for (const structure of structures) {
    if (!structure || typeof structure !== 'object') continue;

    const name = typeof structure.name === 'string' && structure.name.trim() ? structure.name.trim() : null;
    if (!name) continue;

    const rawId = typeof structure.id === 'string' && structure.id.trim() ? structure.id.trim() : name;
    const id = slugify(rawId, { lower: true, strict: true });
    if (!id) continue;

    const description = typeof structure.description === 'string' ? structure.description.trim() : '';
    const rateType = structure.rateType === 'flat' ? 'flat' : 'percentage';
    const currency = normaliseCurrency(structure.currency, 'GBP');
    const rateValue =
      rateType === 'percentage'
        ? parseRate(structure.rateValue ?? structure.rate, 0)
        : parseMoney(structure.rateValue ?? structure.rate ?? structure.flatAmount, 0);
    const appliesTo = Array.isArray(structure.appliesTo)
      ? uniqueStrings(structure.appliesTo)
      : typeof structure.appliesTo === 'string'
        ? uniqueStrings(structure.appliesTo.split(','))
        : [];
    const payoutDelayDays = parsePositiveInteger(structure.payoutDelayDays, 0, { min: 0, max: 90 });
    const minBookingValue = parseMoney(structure.minBookingValue, 0);
    const maxBookingValueRaw = parseMoney(structure.maxBookingValue, null);
    const maxBookingValue =
      maxBookingValueRaw !== null && Number.isFinite(maxBookingValueRaw)
        ? Math.max(minBookingValue, maxBookingValueRaw)
        : null;
    const active = structure.active !== false;
    const imageUrl = typeof structure.imageUrl === 'string' ? structure.imageUrl.trim() : '';

    cleaned.push({
      id,
      name,
      description,
      rateType,
      rateValue,
      currency,
      appliesTo,
      payoutDelayDays,
      minBookingValue,
      maxBookingValue,
      active,
      imageUrl
    });
  }

  return cleaned.length > 0 ? cleaned : fallback;
}

const defaultCommissionRates = (() => {
  const { commissionRates = {} } = config.finance ?? {};
  const { default: defaultRate = 0.025, ...custom } = commissionRates;
  return {
    defaultRate: parseRate(defaultRate, 0.025),
    custom
  };
})();

const DEFAULT_SETTINGS = {
  commissions: {
    enabled: config.finance?.commissionsEnabled !== false,
    baseRate: defaultCommissionRates.defaultRate,
    customRates: defaultCommissionRates.custom,
    structures: [
      {
        id: 'standard-marketplace',
        name: 'Standard marketplace',
        description: 'Applies when no bespoke commission structure is matched.',
        rateType: 'percentage',
        rateValue: defaultCommissionRates.defaultRate,
        currency: 'GBP',
        appliesTo: ['all'],
        payoutDelayDays: 0,
        minBookingValue: 0,
        maxBookingValue: null,
        active: true,
        imageUrl: ''
      }
    ]
  },
  subscriptions: {
    enabled: config.subscriptions?.enabled !== false,
    enforceFeatures: config.subscriptions?.enforceFeatures !== false,
    defaultTier: config.subscriptions?.defaultTier || 'standard',
    tiers: Array.isArray(config.subscriptions?.tiers)
      ? config.subscriptions.tiers
      : [
          {
            id: 'standard',
            label: 'Standard',
            description: 'Core toolkit for emerging providers.',
            features: ['Unlimited quotes', 'Calendar sync', 'Chat support'],
            price: { amount: 0, currency: 'GBP' },
            billingInterval: 'month',
            billingFrequency: 1,
            trialDays: 14,
            badge: '',
            imageUrl: '',
            roleAccess: ['provider', 'administrator'],
            highlight: false,
            supportUrl: ''
          }
        ],
    restrictedFeatures: Array.isArray(config.subscriptions?.restrictedFeatures)
      ? uniqueStrings(config.subscriptions.restrictedFeatures)
      : []
  },
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
  config.finance.commissionStructures = clone(commissions.structures ?? []);

  config.subscriptions = {
    ...(config.subscriptions || {}),
    enabled: settings.subscriptions?.enabled !== false,
    enforceFeatures: settings.subscriptions?.enforceFeatures !== false,
    defaultTier: settings.subscriptions?.defaultTier || DEFAULT_SETTINGS.subscriptions.defaultTier,
    tiers: clone(settings.subscriptions?.tiers ?? []),
    restrictedFeatures: clone(settings.subscriptions?.restrictedFeatures ?? [])
  };

  config.integrations = deepMerge(config.integrations || {}, settings.integrations || {});
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
  if (Object.hasOwn(update, 'structures')) {
    next.structures = sanitiseCommissionStructures(update.structures, next.structures);
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
    const id =
      typeof tier.id === 'string' && tier.id.trim() ? slugify(tier.id.trim(), { lower: true, strict: true }) : null;
    const label = typeof tier.label === 'string' && tier.label.trim() ? tier.label.trim() : null;
    if (!id || !label) continue;
    const description = typeof tier.description === 'string' ? tier.description.trim() : '';
    let features = [];
    if (Array.isArray(tier.features)) {
      features = uniqueStrings(tier.features);
    } else if (typeof tier.features === 'string') {
      features = uniqueStrings(tier.features.split(','));
    }
    const priceAmount = tier.price && typeof tier.price === 'object' ? tier.price.amount : tier.priceAmount;
    const priceCurrency = tier.price && typeof tier.price === 'object' ? tier.price.currency : tier.priceCurrency;
    const billingInterval =
      tier.billing && typeof tier.billing === 'object' ? tier.billing.interval : tier.billingInterval;
    const billingFrequency =
      tier.billing && typeof tier.billing === 'object' ? tier.billing.intervalCount : tier.billingFrequency;
    const roleAccessRaw =
      Array.isArray(tier.roleAccess)
        ? tier.roleAccess
        : typeof tier.roleAccess === 'string'
          ? tier.roleAccess.split(',')
          : [];

    cleaned.push({
      id,
      label,
      description,
      features,
      price: {
        amount: parseMoney(priceAmount, 0),
        currency: normaliseCurrency(priceCurrency, 'GBP')
      },
      billingInterval: ['week', 'month', 'year'].includes((billingInterval || '').toLowerCase())
        ? billingInterval.toLowerCase()
        : 'month',
      billingFrequency: parsePositiveInteger(billingFrequency, 1, { min: 1, max: 52 }),
      trialDays: parsePositiveInteger(tier.trialDays, 0, { min: 0, max: 365 }),
      badge: typeof tier.badge === 'string' ? tier.badge.trim() : '',
      imageUrl: typeof tier.imageUrl === 'string' ? tier.imageUrl.trim() : '',
      roleAccess: uniqueStrings(roleAccessRaw),
      highlight: tier.highlight === true,
      supportUrl: typeof tier.supportUrl === 'string' ? tier.supportUrl.trim() : ''
    });
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
    next.defaultTier = slugify(update.defaultTier.trim(), { lower: true, strict: true });
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
