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
    seo: normalizeSeo(settings.seo)
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

function normalizeSeo(seo) {
  const input = seo && typeof seo === 'object' ? seo : {};
  const social = input.social && typeof input.social === 'object' ? input.social : {};
  const structuredData =
    input.structuredData && typeof input.structuredData === 'object' ? input.structuredData : {};
  const tagDefaults =
    input.tagDefaults && typeof input.tagDefaults === 'object' ? input.tagDefaults : {};
  const sitemap = input.sitemap && typeof input.sitemap === 'object' ? input.sitemap : {};
  const robots = input.robots && typeof input.robots === 'object' ? input.robots : {};
  const governance =
    input.governance && typeof input.governance === 'object' ? input.governance : {};

  const defaultKeywords = Array.isArray(input.defaultKeywords) ? input.defaultKeywords : [];
  const defaultRoleAccess = Array.isArray(tagDefaults.defaultRoleAccess)
    ? tagDefaults.defaultRoleAccess
    : ['admin'];

  return {
    siteName: typeof input.siteName === 'string' ? input.siteName : 'Fixnado',
    defaultTitle: typeof input.defaultTitle === 'string' ? input.defaultTitle : '',
    titleTemplate: typeof input.titleTemplate === 'string' ? input.titleTemplate : '%s • Fixnado',
    defaultDescription: typeof input.defaultDescription === 'string' ? input.defaultDescription : '',
    defaultKeywords,
    defaultKeywordsText: defaultKeywords.join(', '),
    canonicalHost: typeof input.canonicalHost === 'string' ? input.canonicalHost : '',
    robots: {
      index: robots.index !== false,
      follow: robots.follow !== false,
      advancedDirectives:
        typeof robots.advancedDirectives === 'string' ? robots.advancedDirectives : ''
    },
    sitemap: {
      autoGenerate: sitemap.autoGenerate !== false,
      pingSearchEngines: sitemap.pingSearchEngines !== false,
      lastGeneratedAt: sitemap.lastGeneratedAt ?? null
    },
    social: {
      twitterHandle: typeof social.twitterHandle === 'string' ? social.twitterHandle : '',
      facebookAppId: typeof social.facebookAppId === 'string' ? social.facebookAppId : '',
      defaultImageUrl: typeof social.defaultImageUrl === 'string' ? social.defaultImageUrl : '',
      defaultImageAlt: typeof social.defaultImageAlt === 'string' ? social.defaultImageAlt : ''
    },
    structuredData: {
      organisationJsonLd:
        typeof structuredData.organisationJsonLd === 'string'
          ? structuredData.organisationJsonLd
          : '',
      enableAutoBreadcrumbs: structuredData.enableAutoBreadcrumbs !== false
    },
    tagDefaults: {
      metaTitleTemplate:
        typeof tagDefaults.metaTitleTemplate === 'string'
          ? tagDefaults.metaTitleTemplate
          : '%tag% • Fixnado',
      metaDescriptionTemplate:
        typeof tagDefaults.metaDescriptionTemplate === 'string'
          ? tagDefaults.metaDescriptionTemplate
          : '',
      defaultRoleAccess,
      ownerRole: typeof tagDefaults.ownerRole === 'string' ? tagDefaults.ownerRole : 'admin',
      defaultOgImageAlt:
        typeof tagDefaults.defaultOgImageAlt === 'string'
          ? tagDefaults.defaultOgImageAlt
          : '',
      autoPopulateOg: tagDefaults.autoPopulateOg !== false
    },
    governance: {
      lockSlugEdits: governance.lockSlugEdits === true,
      requireOwnerForPublish: governance.requireOwnerForPublish === true
    }
  };
}
