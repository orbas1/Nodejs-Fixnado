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

function stringOrDefault(value, fallback = '') {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed || fallback;
}

const defaultCommissionRates = (() => {
  const { commissionRates = {} } = config.finance ?? {};
  const { default: defaultRate = 0.025, ...custom } = commissionRates;
  return {
    defaultRate: parseRate(defaultRate, 0.025),
    custom
  };
})();

const DEFAULT_SYSTEM_SETTINGS = {
  site: {
    name: config.integrations?.app?.name || process.env.APP_NAME || 'Fixnado',
    url: config.integrations?.app?.url || process.env.APP_URL || '',
    supportEmail: config.integrations?.app?.supportEmail || process.env.SUPPORT_EMAIL || '',
    defaultLocale: process.env.DEFAULT_LOCALE || 'en-GB',
    defaultTimezone: config.dashboards?.defaultTimezone || 'Europe/London',
    logoUrl: '',
    faviconUrl: '',
    tagline: ''
  },
  storage: {
    provider: config.integrations?.cloudflareR2?.accountId ? 'cloudflare-r2' : '',
    accountId: config.integrations?.cloudflareR2?.accountId || '',
    bucket: config.integrations?.cloudflareR2?.bucket || '',
    region: process.env.STORAGE_REGION || '',
    endpoint: config.integrations?.cloudflareR2?.endpoint || '',
    publicUrl: config.integrations?.cloudflareR2?.publicUrl || '',
    accessKeyId: config.integrations?.cloudflareR2?.accessKeyId || '',
    secretAccessKey: config.integrations?.cloudflareR2?.secretAccessKey || '',
    useCdn: false
  },
  socialLinks: [],
  supportLinks: [],
  chatwoot: {
    baseUrl: process.env.CHATWOOT_BASE_URL || '',
    websiteToken: process.env.CHATWOOT_WEBSITE_TOKEN || '',
    inboxIdentifier: process.env.CHATWOOT_INBOX_IDENTIFIER || ''
  },
  openai: {
    provider: process.env.OPENAI_PROVIDER || 'openai',
    baseUrl: process.env.OPENAI_BASE_URL || '',
    apiKey: process.env.OPENAI_API_KEY || '',
    organizationId: process.env.OPENAI_ORG_ID || '',
    defaultModel: process.env.OPENAI_DEFAULT_MODEL || '',
    byokEnabled: true
  },
  slack: {
    byokEnabled: true,
    botToken: process.env.SLACK_BOT_TOKEN || '',
    signingSecret: process.env.SLACK_SIGNING_SECRET || '',
    defaultChannel: process.env.SLACK_DEFAULT_CHANNEL || '',
    appId: process.env.SLACK_APP_ID || '',
    teamId: process.env.SLACK_TEAM_ID || ''
  },
  github: {
    appId: process.env.GITHUB_APP_ID || '',
    clientId: process.env.GITHUB_CLIENT_ID || '',
    clientSecret: process.env.GITHUB_CLIENT_SECRET || '',
    privateKey: process.env.GITHUB_PRIVATE_KEY || '',
    webhookSecret: process.env.GITHUB_WEBHOOK_SECRET || '',
    organization: process.env.GITHUB_ORGANIZATION || '',
    installationId: process.env.GITHUB_INSTALLATION_ID || ''
  },
  googleDrive: {
    clientId: process.env.GOOGLE_DRIVE_CLIENT_ID || '',
    clientSecret: process.env.GOOGLE_DRIVE_CLIENT_SECRET || '',
    redirectUri: process.env.GOOGLE_DRIVE_REDIRECT_URI || '',
    refreshToken: process.env.GOOGLE_DRIVE_REFRESH_TOKEN || '',
    serviceAccountEmail: process.env.GOOGLE_DRIVE_SERVICE_EMAIL || '',
    serviceAccountKey: process.env.GOOGLE_DRIVE_SERVICE_KEY || '',
    rootFolderId: process.env.GOOGLE_DRIVE_ROOT_FOLDER_ID || '',
    sharedDriveId: process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID || ''
const SEO_ALLOWED_ROLES = ['admin', 'provider', 'finance', 'serviceman', 'user', 'enterprise'];

function normaliseSeoRole(value) {
  if (typeof value !== 'string') {
    return 'admin';
  }
  const trimmed = value.trim().toLowerCase();
  return SEO_ALLOWED_ROLES.includes(trimmed) ? trimmed : 'admin';
}

function buildSeoRoleAccess(values) {
  const roles = uniqueStrings(
    Array.isArray(values)
      ? values
      : typeof values === 'string'
        ? values.split(',')
        : []
  ).map((role) => role.toLowerCase());
  const allowed = roles.filter((role) => SEO_ALLOWED_ROLES.includes(role));
  if (!allowed.includes('admin')) {
    allowed.push('admin');
  }
  return allowed;
}

const defaultSeoRoleAccess = buildSeoRoleAccess(config.seo?.tagDefaults?.defaultRoleAccess);

const DEFAULT_SEO_SETTINGS = {
  siteName: stringOrDefault(config.seo?.siteName, 'Fixnado'),
  defaultTitle: stringOrDefault(config.seo?.defaultTitle, 'Fixnado — Facilities command'),
  titleTemplate: stringOrDefault(config.seo?.titleTemplate, '%s • Fixnado'),
  defaultDescription: stringOrDefault(config.seo?.defaultDescription, ''),
  defaultKeywords: uniqueStrings(
    Array.isArray(config.seo?.defaultKeywords)
      ? config.seo.defaultKeywords
      : typeof config.seo?.defaultKeywords === 'string'
        ? config.seo.defaultKeywords.split(',')
        : []
  ),
  canonicalHost: stringOrDefault(config.seo?.canonicalHost, ''),
  robots: {
    index: config.seo?.robots?.index !== false,
    follow: config.seo?.robots?.follow !== false,
    advancedDirectives: stringOrDefault(config.seo?.robots?.advancedDirectives, '')
  },
  sitemap: {
    autoGenerate: config.seo?.sitemap?.autoGenerate !== false,
    pingSearchEngines: config.seo?.sitemap?.pingSearchEngines !== false,
    lastGeneratedAt: config.seo?.sitemap?.lastGeneratedAt || null
  },
  social: {
    twitterHandle: stringOrDefault(config.seo?.social?.twitterHandle, ''),
    facebookAppId: stringOrDefault(config.seo?.social?.facebookAppId, ''),
    defaultImageUrl: stringOrDefault(config.seo?.social?.defaultImageUrl, ''),
    defaultImageAlt: stringOrDefault(config.seo?.social?.defaultImageAlt, '')
  },
  structuredData: {
    organisationJsonLd: stringOrDefault(config.seo?.structuredData?.organisationJsonLd, ''),
    enableAutoBreadcrumbs: config.seo?.structuredData?.enableAutoBreadcrumbs !== false
  },
  tagDefaults: {
    metaTitleTemplate: stringOrDefault(config.seo?.tagDefaults?.metaTitleTemplate, '%tag% • Fixnado'),
    metaDescriptionTemplate: stringOrDefault(config.seo?.tagDefaults?.metaDescriptionTemplate, ''),
    defaultRoleAccess: defaultSeoRoleAccess,
    ownerRole: normaliseSeoRole(config.seo?.tagDefaults?.ownerRole),
    defaultOgImageAlt: stringOrDefault(config.seo?.tagDefaults?.defaultOgImageAlt, ''),
    autoPopulateOg: config.seo?.tagDefaults?.autoPopulateOg !== false
  },
  governance: {
    lockSlugEdits: config.seo?.governance?.lockSlugEdits === true,
    requireOwnerForPublish: config.seo?.governance?.requireOwnerForPublish === true
  }
};

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
  },
  system: DEFAULT_SYSTEM_SETTINGS
  seo: DEFAULT_SEO_SETTINGS
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

  if (settings.system) {
    config.system = clone(settings.system);
    config.app = {
      ...(config.app || {}),
      name: settings.system.site?.name || config.integrations?.app?.name || DEFAULT_SYSTEM_SETTINGS.site.name,
      url: settings.system.site?.url || config.integrations?.app?.url || '',
      supportEmail:
        settings.system.site?.supportEmail || config.integrations?.app?.supportEmail || DEFAULT_SYSTEM_SETTINGS.site.supportEmail,
      defaultLocale: settings.system.site?.defaultLocale || DEFAULT_SYSTEM_SETTINGS.site.defaultLocale,
      defaultTimezone: settings.system.site?.defaultTimezone || DEFAULT_SYSTEM_SETTINGS.site.defaultTimezone,
      logoUrl: settings.system.site?.logoUrl || '',
      faviconUrl: settings.system.site?.faviconUrl || '',
      tagline: settings.system.site?.tagline || ''
    };
    config.social = { links: clone(settings.system.socialLinks ?? []) };
    config.support = { links: clone(settings.system.supportLinks ?? []) };
    config.integrations = deepMerge(config.integrations || {}, {
      chatwoot: settings.system.chatwoot || {},
      slack: settings.system.slack || {},
      github: settings.system.github || {},
      googleDrive: settings.system.googleDrive || {},
      storage: settings.system.storage || {}
    });
    config.ai = {
      ...(config.ai || {}),
      openai: settings.system.openai || {}
    };
  }
  config.seo = clone(settings.seo ?? DEFAULT_SEO_SETTINGS);

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

function slugify(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function sanitiseLinkArray(entries = [], fallback = []) {
  if (!Array.isArray(entries)) {
    return fallback;
  }
  const cleaned = [];
  const seen = new Set();
  for (const entry of entries) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    const label = typeof entry.label === 'string' ? entry.label.trim() : '';
    const url = typeof entry.url === 'string' ? entry.url.trim() : '';
    if (!label || !url) {
      continue;
    }
    const idSource = typeof entry.id === 'string' && entry.id.trim() ? entry.id : label;
    const id = slugify(idSource);
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    const handle = typeof entry.handle === 'string' ? entry.handle.trim() : '';
    const type = typeof entry.type === 'string' ? entry.type.trim().toLowerCase() : '';
    const icon = typeof entry.icon === 'string' ? entry.icon.trim() : '';
    const description = typeof entry.description === 'string' ? entry.description.trim() : '';
    cleaned.push({ id, label, url, handle, type, icon, description });
  }
  return cleaned;
}

function sanitiseSystem(update = {}, current = DEFAULT_SYSTEM_SETTINGS) {
  const next = clone(current);

  if (update.site && typeof update.site === 'object') {
    next.site = sanitiseStrings(update.site, next.site);
    if (Object.hasOwn(update.site, 'defaultLocale') && typeof update.site.defaultLocale === 'string') {
      next.site.defaultLocale = update.site.defaultLocale.trim() || next.site.defaultLocale;
    }
    if (Object.hasOwn(update.site, 'defaultTimezone') && typeof update.site.defaultTimezone === 'string') {
      next.site.defaultTimezone = update.site.defaultTimezone.trim() || next.site.defaultTimezone;
    }
  }

  if (update.storage && typeof update.storage === 'object') {
    next.storage = sanitiseStrings(update.storage, next.storage);
    if (Object.hasOwn(update.storage, 'useCdn')) {
      next.storage.useCdn = Boolean(update.storage.useCdn);
    }
  }

  if (Object.hasOwn(update, 'socialLinks')) {
    next.socialLinks = sanitiseLinkArray(update.socialLinks, next.socialLinks);
  }

  if (Object.hasOwn(update, 'supportLinks')) {
    next.supportLinks = sanitiseLinkArray(update.supportLinks, next.supportLinks);
  }

  if (update.chatwoot && typeof update.chatwoot === 'object') {
    next.chatwoot = sanitiseStrings(update.chatwoot, next.chatwoot);
  }

  if (update.openai && typeof update.openai === 'object') {
    next.openai = sanitiseStrings(update.openai, next.openai);
    if (Object.hasOwn(update.openai, 'byokEnabled')) {
      next.openai.byokEnabled = Boolean(update.openai.byokEnabled);
    }
  }

  if (update.slack && typeof update.slack === 'object') {
    next.slack = sanitiseStrings(update.slack, next.slack);
    if (Object.hasOwn(update.slack, 'byokEnabled')) {
      next.slack.byokEnabled = Boolean(update.slack.byokEnabled);
    }
  }

  if (update.github && typeof update.github === 'object') {
    next.github = sanitiseStrings(update.github, next.github);
  }

  if (update.googleDrive && typeof update.googleDrive === 'object') {
    next.googleDrive = sanitiseStrings(update.googleDrive, next.googleDrive);
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

function sanitiseSeo(update = {}, current = DEFAULT_SEO_SETTINGS) {
  const next = clone(current);
  const errors = [];

  const assignTopLevelString = (field, value, { allowEmpty = false, maxLength } = {}) => {
    if (typeof value !== 'string') {
      errors.push({ field, message: 'must be a string' });
      return;
    }
    const trimmed = value.trim();
    if (!trimmed) {
      if (allowEmpty) {
        next[field] = '';
        return;
      }
      errors.push({ field, message: 'cannot be empty' });
      return;
    }
    if (maxLength && trimmed.length > maxLength) {
      errors.push({ field, message: `must be ${maxLength} characters or fewer` });
      return;
    }
    next[field] = trimmed;
  };

  if (Object.hasOwn(update, 'siteName')) {
    assignTopLevelString('siteName', update.siteName, { allowEmpty: false, maxLength: 80 });
  }

  if (Object.hasOwn(update, 'defaultTitle')) {
    assignTopLevelString('defaultTitle', update.defaultTitle, { allowEmpty: false, maxLength: 140 });
  }

  if (Object.hasOwn(update, 'titleTemplate')) {
    assignTopLevelString('titleTemplate', update.titleTemplate, { allowEmpty: false, maxLength: 160 });
  }

  if (Object.hasOwn(update, 'defaultDescription')) {
    if (typeof update.defaultDescription === 'string') {
      const trimmed = update.defaultDescription.trim();
      if (trimmed.length > 320) {
        errors.push({ field: 'defaultDescription', message: 'must be 320 characters or fewer' });
      } else {
        next.defaultDescription = trimmed;
      }
    } else {
      errors.push({ field: 'defaultDescription', message: 'must be a string' });
    }
  }

  if (Object.hasOwn(update, 'defaultKeywords')) {
    const keywords = Array.isArray(update.defaultKeywords)
      ? uniqueStrings(update.defaultKeywords)
      : typeof update.defaultKeywords === 'string'
        ? uniqueStrings(update.defaultKeywords.split(','))
        : null;
    if (keywords) {
      next.defaultKeywords = keywords.slice(0, 50);
    } else {
      errors.push({ field: 'defaultKeywords', message: 'must be an array or comma separated string' });
    }
  }

  if (Object.hasOwn(update, 'canonicalHost')) {
    if (typeof update.canonicalHost === 'string') {
      const trimmed = update.canonicalHost.trim();
      if (!trimmed) {
        next.canonicalHost = '';
      } else {
        try {
          const url = new URL(trimmed);
          next.canonicalHost = url.origin;
        } catch (error) {
          errors.push({ field: 'canonicalHost', message: 'must be a valid absolute URL (https://example.com)' });
        }
      }
    } else {
      errors.push({ field: 'canonicalHost', message: 'must be a string' });
    }
  }

  if (Object.hasOwn(update, 'robots')) {
    if (!isPlainObject(update.robots)) {
      errors.push({ field: 'robots', message: 'must be an object' });
    } else {
      if (Object.hasOwn(update.robots, 'index')) {
        next.robots.index = Boolean(update.robots.index);
      }
      if (Object.hasOwn(update.robots, 'follow')) {
        next.robots.follow = Boolean(update.robots.follow);
      }
      if (Object.hasOwn(update.robots, 'advancedDirectives')) {
        if (typeof update.robots.advancedDirectives === 'string') {
          const trimmed = update.robots.advancedDirectives.trim();
          if (trimmed.length > 400) {
            errors.push({ field: 'robots.advancedDirectives', message: 'must be 400 characters or fewer' });
          } else {
            next.robots.advancedDirectives = trimmed;
          }
        } else {
          errors.push({ field: 'robots.advancedDirectives', message: 'must be a string' });
        }
      }
    }
  }

  if (Object.hasOwn(update, 'sitemap')) {
    if (!isPlainObject(update.sitemap)) {
      errors.push({ field: 'sitemap', message: 'must be an object' });
    } else {
      if (Object.hasOwn(update.sitemap, 'autoGenerate')) {
        next.sitemap.autoGenerate = Boolean(update.sitemap.autoGenerate);
      }
      if (Object.hasOwn(update.sitemap, 'pingSearchEngines')) {
        next.sitemap.pingSearchEngines = Boolean(update.sitemap.pingSearchEngines);
      }
      if (Object.hasOwn(update.sitemap, 'lastGeneratedAt')) {
        const value = update.sitemap.lastGeneratedAt;
        if (value === null || value === '') {
          next.sitemap.lastGeneratedAt = null;
        } else if (typeof value === 'string') {
          const parsed = new Date(value);
          if (Number.isNaN(parsed.getTime())) {
            errors.push({ field: 'sitemap.lastGeneratedAt', message: 'must be an ISO 8601 date string' });
          } else {
            next.sitemap.lastGeneratedAt = parsed.toISOString();
          }
        } else {
          errors.push({ field: 'sitemap.lastGeneratedAt', message: 'must be a string or null' });
        }
      }
    }
  }

  if (Object.hasOwn(update, 'social')) {
    if (!isPlainObject(update.social)) {
      errors.push({ field: 'social', message: 'must be an object' });
    } else {
      if (Object.hasOwn(update.social, 'twitterHandle')) {
        if (typeof update.social.twitterHandle === 'string') {
          next.social.twitterHandle = update.social.twitterHandle.trim();
        } else {
          errors.push({ field: 'social.twitterHandle', message: 'must be a string' });
        }
      }
      if (Object.hasOwn(update.social, 'facebookAppId')) {
        if (typeof update.social.facebookAppId === 'string') {
          next.social.facebookAppId = update.social.facebookAppId.trim();
        } else {
          errors.push({ field: 'social.facebookAppId', message: 'must be a string' });
        }
      }
      if (Object.hasOwn(update.social, 'defaultImageUrl')) {
        if (typeof update.social.defaultImageUrl === 'string') {
          const trimmed = update.social.defaultImageUrl.trim();
          if (!trimmed) {
            next.social.defaultImageUrl = '';
          } else {
            try {
              const url = new URL(trimmed);
              if (!['http:', 'https:'].includes(url.protocol)) {
                throw new Error('invalid protocol');
              }
              next.social.defaultImageUrl = url.toString();
            } catch (error) {
              errors.push({ field: 'social.defaultImageUrl', message: 'must be an absolute URL with http or https' });
            }
          }
        } else {
          errors.push({ field: 'social.defaultImageUrl', message: 'must be a string' });
        }
      }
      if (Object.hasOwn(update.social, 'defaultImageAlt')) {
        if (typeof update.social.defaultImageAlt === 'string') {
          const trimmed = update.social.defaultImageAlt.trim();
          if (trimmed.length > 180) {
            errors.push({ field: 'social.defaultImageAlt', message: 'must be 180 characters or fewer' });
          } else {
            next.social.defaultImageAlt = trimmed;
          }
        } else {
          errors.push({ field: 'social.defaultImageAlt', message: 'must be a string' });
        }
      }
    }
  }

  if (Object.hasOwn(update, 'structuredData')) {
    if (!isPlainObject(update.structuredData)) {
      errors.push({ field: 'structuredData', message: 'must be an object' });
    } else {
      if (Object.hasOwn(update.structuredData, 'organisationJsonLd')) {
        const payload = update.structuredData.organisationJsonLd;
        if (payload == null || payload === '') {
          next.structuredData.organisationJsonLd = '';
        } else if (typeof payload === 'string') {
          const trimmed = payload.trim();
          if (!trimmed) {
            next.structuredData.organisationJsonLd = '';
          } else {
            try {
              JSON.parse(trimmed);
              next.structuredData.organisationJsonLd = trimmed;
            } catch (error) {
              errors.push({ field: 'structuredData.organisationJsonLd', message: 'must be valid JSON' });
            }
          }
        } else if (typeof payload === 'object') {
          try {
            next.structuredData.organisationJsonLd = JSON.stringify(payload);
          } catch (error) {
            errors.push({ field: 'structuredData.organisationJsonLd', message: 'could not serialise JSON payload' });
          }
        } else {
          errors.push({ field: 'structuredData.organisationJsonLd', message: 'must be a string or object' });
        }
      }
      if (Object.hasOwn(update.structuredData, 'enableAutoBreadcrumbs')) {
        next.structuredData.enableAutoBreadcrumbs = Boolean(update.structuredData.enableAutoBreadcrumbs);
      }
    }
  }

  if (Object.hasOwn(update, 'tagDefaults')) {
    if (!isPlainObject(update.tagDefaults)) {
      errors.push({ field: 'tagDefaults', message: 'must be an object' });
    } else {
      if (Object.hasOwn(update.tagDefaults, 'metaTitleTemplate')) {
        if (typeof update.tagDefaults.metaTitleTemplate === 'string') {
          const trimmed = update.tagDefaults.metaTitleTemplate.trim();
          if (!trimmed) {
            errors.push({ field: 'tagDefaults.metaTitleTemplate', message: 'cannot be empty' });
          } else if (trimmed.length > 160) {
            errors.push({ field: 'tagDefaults.metaTitleTemplate', message: 'must be 160 characters or fewer' });
          } else {
            next.tagDefaults.metaTitleTemplate = trimmed;
          }
        } else {
          errors.push({ field: 'tagDefaults.metaTitleTemplate', message: 'must be a string' });
        }
      }
      if (Object.hasOwn(update.tagDefaults, 'metaDescriptionTemplate')) {
        if (typeof update.tagDefaults.metaDescriptionTemplate === 'string') {
          const trimmed = update.tagDefaults.metaDescriptionTemplate.trim();
          if (trimmed.length > 320) {
            errors.push({ field: 'tagDefaults.metaDescriptionTemplate', message: 'must be 320 characters or fewer' });
          } else {
            next.tagDefaults.metaDescriptionTemplate = trimmed;
          }
        } else {
          errors.push({ field: 'tagDefaults.metaDescriptionTemplate', message: 'must be a string' });
        }
      }
      if (Object.hasOwn(update.tagDefaults, 'defaultRoleAccess')) {
        next.tagDefaults.defaultRoleAccess = buildSeoRoleAccess(update.tagDefaults.defaultRoleAccess);
      }
      if (Object.hasOwn(update.tagDefaults, 'ownerRole')) {
        next.tagDefaults.ownerRole = normaliseSeoRole(update.tagDefaults.ownerRole);
      }
      if (Object.hasOwn(update.tagDefaults, 'defaultOgImageAlt')) {
        if (typeof update.tagDefaults.defaultOgImageAlt === 'string') {
          const trimmed = update.tagDefaults.defaultOgImageAlt.trim();
          if (trimmed.length > 180) {
            errors.push({ field: 'tagDefaults.defaultOgImageAlt', message: 'must be 180 characters or fewer' });
          } else {
            next.tagDefaults.defaultOgImageAlt = trimmed;
          }
        } else {
          errors.push({ field: 'tagDefaults.defaultOgImageAlt', message: 'must be a string' });
        }
      }
      if (Object.hasOwn(update.tagDefaults, 'autoPopulateOg')) {
        next.tagDefaults.autoPopulateOg = Boolean(update.tagDefaults.autoPopulateOg);
      }
    }
  }

  if (Object.hasOwn(update, 'governance')) {
    if (!isPlainObject(update.governance)) {
      errors.push({ field: 'governance', message: 'must be an object' });
    } else {
      if (Object.hasOwn(update.governance, 'lockSlugEdits')) {
        next.governance.lockSlugEdits = Boolean(update.governance.lockSlugEdits);
      }
      if (Object.hasOwn(update.governance, 'requireOwnerForPublish')) {
        next.governance.requireOwnerForPublish = Boolean(update.governance.requireOwnerForPublish);
      }
    }
  }

  return { value: next, errors };
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

  if (Object.hasOwn(updates, 'system')) {
    next.system = sanitiseSystem(updates.system, current.system);
    changedKeys.add('system');
  if (Object.hasOwn(updates, 'seo')) {
    const { value, errors } = sanitiseSeo(updates.seo, current.seo);
    if (errors.length > 0) {
      throw validationError('Invalid SEO configuration', errors);
    }
    next.seo = value;
    changedKeys.add('seo');
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
