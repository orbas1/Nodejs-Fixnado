const SETTINGS_ENDPOINT = '/api/admin/platform-settings';
const DIAGNOSTIC_ENDPOINT = '/api/admin/platform-settings/test';
const AUDIT_ENDPOINT = '/api/admin/platform-settings/audit';

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

export async function runPlatformSettingDiagnostic(section, payload) {
  const response = await fetch(DIAGNOSTIC_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ section, payload })
  });

  const data = await handleResponse(response, 'Failed to run integration diagnostic');
  if (!data?.diagnostic) {
    return null;
  }
  const diagnostic = data.diagnostic;
  return {
    ...diagnostic,
    createdAt: diagnostic.createdAt ? new Date(diagnostic.createdAt) : null,
    updatedAt: diagnostic.updatedAt ? new Date(diagnostic.updatedAt) : null
  };
}

export async function fetchPlatformSettingDiagnostics({ section, limit, signal } = {}) {
  const params = new URLSearchParams();
  if (section) {
    params.set('section', section);
  }
  if (limit) {
    params.set('limit', String(limit));
  }

  const url = params.toString() ? `${AUDIT_ENDPOINT}?${params.toString()}` : AUDIT_ENDPOINT;
  const response = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    credentials: 'include',
    signal
  });

  const data = await handleResponse(response, 'Failed to load diagnostics history');
  const diagnostics = Array.isArray(data?.diagnostics)
    ? data.diagnostics.map((entry) => ({
        ...entry,
        createdAt: entry.createdAt ? new Date(entry.createdAt) : null,
        updatedAt: entry.updatedAt ? new Date(entry.updatedAt) : null,
        metadata:
          entry.metadata && typeof entry.metadata === 'object' ? { ...entry.metadata } : {}
      }))
    : [];

  const sections = Array.isArray(data?.meta?.sections)
    ? data.meta.sections.map((item) => ({
        value: item.value,
        label: item.label ?? item.value
      }))
    : [];

  return { diagnostics, sections };
}

function slugify(value) {
  if (typeof value !== 'string') return '';
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function normaliseLinkList(list) {
  if (!Array.isArray(list)) {
    return [];
  }
  const seen = new Set();
  return list
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }
      const label = typeof entry.label === 'string' ? entry.label.trim() : '';
      const url = typeof entry.url === 'string' ? entry.url.trim() : '';
      if (!label || !url) {
        return null;
      }
      const idSource = typeof entry.id === 'string' && entry.id.trim() ? entry.id : label;
      const id = slugify(idSource);
      if (!id || seen.has(id)) {
        return null;
      }
      seen.add(id);
      return {
        id,
        label,
        url,
        handle: typeof entry.handle === 'string' ? entry.handle.trim() : '',
        type: typeof entry.type === 'string' ? entry.type.trim() : '',
        icon: typeof entry.icon === 'string' ? entry.icon.trim() : '',
        description: typeof entry.description === 'string' ? entry.description.trim() : ''
      };
    })
    .filter(Boolean);
}

function normalizeSystem(system) {
  const source = system && typeof system === 'object' ? system : {};
  const site = source.site && typeof source.site === 'object' ? source.site : {};
  const storage = source.storage && typeof source.storage === 'object' ? source.storage : {};
  const chatwoot = source.chatwoot && typeof source.chatwoot === 'object' ? source.chatwoot : {};
  const openai = source.openai && typeof source.openai === 'object' ? source.openai : {};
  const slack = source.slack && typeof source.slack === 'object' ? source.slack : {};
  const github = source.github && typeof source.github === 'object' ? source.github : {};
  const googleDrive = source.googleDrive && typeof source.googleDrive === 'object' ? source.googleDrive : {};

  return {
    site: {
      name: typeof site.name === 'string' ? site.name : '',
      url: typeof site.url === 'string' ? site.url : '',
      supportEmail: typeof site.supportEmail === 'string' ? site.supportEmail : '',
      defaultLocale: typeof site.defaultLocale === 'string' ? site.defaultLocale : 'en-GB',
      defaultTimezone: typeof site.defaultTimezone === 'string' ? site.defaultTimezone : 'Europe/London',
      logoUrl: typeof site.logoUrl === 'string' ? site.logoUrl : '',
      faviconUrl: typeof site.faviconUrl === 'string' ? site.faviconUrl : '',
      tagline: typeof site.tagline === 'string' ? site.tagline : ''
    },
    storage: {
      provider: typeof storage.provider === 'string' ? storage.provider : '',
      accountId: typeof storage.accountId === 'string' ? storage.accountId : '',
      bucket: typeof storage.bucket === 'string' ? storage.bucket : '',
      region: typeof storage.region === 'string' ? storage.region : '',
      endpoint: typeof storage.endpoint === 'string' ? storage.endpoint : '',
      publicUrl: typeof storage.publicUrl === 'string' ? storage.publicUrl : '',
      accessKeyId: typeof storage.accessKeyId === 'string' ? storage.accessKeyId : '',
      secretAccessKey: typeof storage.secretAccessKey === 'string' ? storage.secretAccessKey : '',
      useCdn: Boolean(storage.useCdn)
    },
    socialLinks: normaliseLinkList(source.socialLinks),
    supportLinks: normaliseLinkList(source.supportLinks),
    chatwoot: {
      baseUrl: typeof chatwoot.baseUrl === 'string' ? chatwoot.baseUrl : '',
      websiteToken: typeof chatwoot.websiteToken === 'string' ? chatwoot.websiteToken : '',
      inboxIdentifier: typeof chatwoot.inboxIdentifier === 'string' ? chatwoot.inboxIdentifier : ''
    },
    openai: {
      provider: typeof openai.provider === 'string' ? openai.provider : 'openai',
      baseUrl: typeof openai.baseUrl === 'string' ? openai.baseUrl : '',
      apiKey: typeof openai.apiKey === 'string' ? openai.apiKey : '',
      organizationId: typeof openai.organizationId === 'string' ? openai.organizationId : '',
      defaultModel: typeof openai.defaultModel === 'string' ? openai.defaultModel : '',
      byokEnabled: openai.byokEnabled !== false
    },
    slack: {
      botToken: typeof slack.botToken === 'string' ? slack.botToken : '',
      signingSecret: typeof slack.signingSecret === 'string' ? slack.signingSecret : '',
      defaultChannel: typeof slack.defaultChannel === 'string' ? slack.defaultChannel : '',
      appId: typeof slack.appId === 'string' ? slack.appId : '',
      teamId: typeof slack.teamId === 'string' ? slack.teamId : '',
      byokEnabled: slack.byokEnabled !== false
    },
    github: {
      appId: typeof github.appId === 'string' ? github.appId : '',
      clientId: typeof github.clientId === 'string' ? github.clientId : '',
      clientSecret: typeof github.clientSecret === 'string' ? github.clientSecret : '',
      privateKey: typeof github.privateKey === 'string' ? github.privateKey : '',
      webhookSecret: typeof github.webhookSecret === 'string' ? github.webhookSecret : '',
      organization: typeof github.organization === 'string' ? github.organization : '',
      installationId: typeof github.installationId === 'string' ? github.installationId : ''
    },
    googleDrive: {
      clientId: typeof googleDrive.clientId === 'string' ? googleDrive.clientId : '',
      clientSecret: typeof googleDrive.clientSecret === 'string' ? googleDrive.clientSecret : '',
      redirectUri: typeof googleDrive.redirectUri === 'string' ? googleDrive.redirectUri : '',
      refreshToken: typeof googleDrive.refreshToken === 'string' ? googleDrive.refreshToken : '',
      serviceAccountEmail:
        typeof googleDrive.serviceAccountEmail === 'string' ? googleDrive.serviceAccountEmail : '',
      serviceAccountKey: typeof googleDrive.serviceAccountKey === 'string' ? googleDrive.serviceAccountKey : '',
      rootFolderId: typeof googleDrive.rootFolderId === 'string' ? googleDrive.rootFolderId : '',
      sharedDriveId: typeof googleDrive.sharedDriveId === 'string' ? googleDrive.sharedDriveId : ''
    }
  };
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
    system: normalizeSystem(settings.system)
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
