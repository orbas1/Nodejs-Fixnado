export const STORAGE_SYNC_FIELDS = new Set([
  'accountId',
  'bucket',
  'accessKeyId',
  'secretAccessKey',
  'endpoint',
  'publicUrl'
]);

export const SECTION_LABELS = {
  smtp: 'Email delivery',
  storage: 'Storage',
  chatwoot: 'Chatwoot',
  openai: 'OpenAI BYOK',
  slack: 'Slack BYOK',
  github: 'GitHub connection',
  'google-drive': 'Google Drive API'
};

export const STATUS_STYLES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  error: 'border-rose-200 bg-rose-50 text-rose-700'
};

export const STATUS_TONES = {
  success: 'success',
  warning: 'warning',
  error: 'danger'
};

export const DATE_FORMATTER = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short'
});

export function emptyLink() {
  return { id: '', label: '', url: '', handle: '', type: '', icon: '', description: '' };
}

export function buildLinkDrafts(list) {
  if (!Array.isArray(list) || list.length === 0) {
    return [emptyLink()];
  }
  return list.map((item) => ({ ...emptyLink(), ...item }));
}

export function buildFormState(settings) {
  const system = settings.system ?? {};
  const integrations = settings.integrations ?? {};
  const app = integrations.app ?? {};
  const cloudflare = integrations.cloudflareR2 ?? {};

  const site = system.site ?? {};
  const storage = system.storage ?? {};
  const chatwoot = system.chatwoot ?? {};
  const openai = system.openai ?? {};
  const slack = system.slack ?? {};
  const github = system.github ?? {};
  const googleDrive = system.googleDrive ?? {};
  const smtp = integrations.smtp ?? {};

  return {
    system: {
      site: {
        name: site.name || app.name || '',
        url: site.url || app.url || '',
        supportEmail: site.supportEmail || app.supportEmail || '',
        defaultLocale: site.defaultLocale || 'en-GB',
        defaultTimezone: site.defaultTimezone || 'Europe/London',
        logoUrl: site.logoUrl || '',
        faviconUrl: site.faviconUrl || '',
        tagline: site.tagline || ''
      },
      storage: {
        provider: storage.provider || (cloudflare.accountId ? 'cloudflare-r2' : ''),
        accountId: storage.accountId || cloudflare.accountId || '',
        bucket: storage.bucket || cloudflare.bucket || '',
        region: storage.region || '',
        endpoint: storage.endpoint || cloudflare.endpoint || '',
        publicUrl: storage.publicUrl || cloudflare.publicUrl || '',
        accessKeyId: storage.accessKeyId || cloudflare.accessKeyId || '',
        secretAccessKey: storage.secretAccessKey || cloudflare.secretAccessKey || '',
        useCdn: Boolean(storage.useCdn)
      },
      socialLinks: buildLinkDrafts(system.socialLinks),
      supportLinks: buildLinkDrafts(system.supportLinks),
      chatwoot: {
        baseUrl: chatwoot.baseUrl || '',
        websiteToken: chatwoot.websiteToken || '',
        inboxIdentifier: chatwoot.inboxIdentifier || ''
      },
      openai: {
        provider: openai.provider || 'openai',
        baseUrl: openai.baseUrl || '',
        apiKey: openai.apiKey || '',
        organizationId: openai.organizationId || '',
        defaultModel: openai.defaultModel || '',
        byokEnabled: openai.byokEnabled !== false
      },
      slack: {
        botToken: slack.botToken || '',
        signingSecret: slack.signingSecret || '',
        defaultChannel: slack.defaultChannel || '',
        appId: slack.appId || '',
        teamId: slack.teamId || '',
        byokEnabled: slack.byokEnabled !== false
      },
      github: {
        appId: github.appId || '',
        clientId: github.clientId || '',
        clientSecret: github.clientSecret || '',
        privateKey: github.privateKey || '',
        webhookSecret: github.webhookSecret || '',
        organization: github.organization || '',
        installationId: github.installationId || ''
      },
      googleDrive: {
        clientId: googleDrive.clientId || '',
        clientSecret: googleDrive.clientSecret || '',
        redirectUri: googleDrive.redirectUri || '',
        refreshToken: googleDrive.refreshToken || '',
        serviceAccountEmail: googleDrive.serviceAccountEmail || '',
        serviceAccountKey: googleDrive.serviceAccountKey || '',
        rootFolderId: googleDrive.rootFolderId || '',
        sharedDriveId: googleDrive.sharedDriveId || ''
      }
    },
    integrations: {
      smtp: {
        host: smtp.host || '',
        port: smtp.port != null ? String(smtp.port) : '',
        username: smtp.username || '',
        password: smtp.password || '',
        fromEmail: smtp.fromEmail || '',
        secure: Boolean(smtp.secure)
      },
      app: {
        name: app.name || site.name || '',
        url: app.url || site.url || '',
        supportEmail: app.supportEmail || site.supportEmail || ''
      },
      cloudflareR2: {
        accountId: cloudflare.accountId || storage.accountId || '',
        accessKeyId: cloudflare.accessKeyId || storage.accessKeyId || '',
        secretAccessKey: cloudflare.secretAccessKey || storage.secretAccessKey || '',
        bucket: cloudflare.bucket || storage.bucket || '',
        publicUrl: cloudflare.publicUrl || storage.publicUrl || '',
        endpoint: cloudflare.endpoint || storage.endpoint || ''
      }
    }
  };
}

export function filterLinks(list) {
  return list
    .map((entry) => ({ ...entry, label: entry.label?.trim() ?? '', url: entry.url?.trim() ?? '' }))
    .filter((entry) => entry.label && entry.url)
    .map((entry) => ({
      id: entry.id,
      label: entry.label,
      url: entry.url,
      handle: entry.handle?.trim() ?? '',
      type: entry.type?.trim() ?? '',
      icon: entry.icon?.trim() ?? '',
      description: entry.description?.trim() ?? ''
    }));
}

export function buildSettingsPayload(form) {
  const payload = {
    system: {
      site: { ...form.system.site },
      storage: { ...form.system.storage },
      socialLinks: filterLinks(form.system.socialLinks),
      supportLinks: filterLinks(form.system.supportLinks),
      chatwoot: { ...form.system.chatwoot },
      openai: { ...form.system.openai },
      slack: { ...form.system.slack },
      github: { ...form.system.github },
      googleDrive: { ...form.system.googleDrive }
    },
    integrations: {
      smtp: { ...form.integrations.smtp, port: form.integrations.smtp.port },
      app: { ...form.integrations.app },
      cloudflareR2: { ...form.integrations.cloudflareR2 }
    }
  };

  if (payload.integrations.smtp.port === '') {
    delete payload.integrations.smtp.port;
  }

  return payload;
}

export function computeMeta(form) {
  if (!form) return [];
  const smtpReady = Boolean(form.integrations.smtp.host && form.integrations.smtp.username && form.integrations.smtp.fromEmail);
  const storageReady = Boolean(form.system.storage.bucket);
  const chatwootReady = Boolean(form.system.chatwoot.websiteToken);
  const openAiReady = Boolean(form.system.openai.apiKey);

  return [
    {
      label: 'Email delivery',
      value: smtpReady ? 'Ready' : 'Needs setup',
      caption: smtpReady ? 'SMTP credentials active' : 'Configure SMTP host and sender'
    },
    {
      label: 'Storage',
      value: storageReady ? 'Connected' : 'Pending',
      caption: storageReady ? form.system.storage.provider || 'Custom provider' : 'Add storage credentials'
    },
    {
      label: 'Chat & AI',
      value: chatwootReady && openAiReady ? 'Operational' : 'Action required',
      caption: `${chatwootReady ? 'Chatwoot linked' : 'Chatwoot missing'} • ${
        openAiReady ? 'OpenAI BYOK ready' : 'OpenAI key needed'
      }`
    }
  ];
}
