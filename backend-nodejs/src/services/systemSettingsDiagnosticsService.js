import nodemailer from 'nodemailer';
import { SystemSettingAudit } from '../models/index.js';

const SECTION_DEFINITIONS = [
  { value: 'smtp', label: 'Email delivery' },
  { value: 'storage', label: 'Storage' },
  { value: 'chatwoot', label: 'Chatwoot' },
  { value: 'openai', label: 'OpenAI BYOK' },
  { value: 'slack', label: 'Slack BYOK' },
  { value: 'github', label: 'GitHub connection' },
  { value: 'google-drive', label: 'Google Drive API' }
];

const SECTION_NAMES = new Set(SECTION_DEFINITIONS.map((section) => section.value));
const SECTION_LABELS = SECTION_DEFINITIONS.reduce((acc, section) => {
  acc[section.value] = section.label;
  return acc;
}, {});

const PROBE_TIMEOUT_MS = 5000;

function now() {
  return typeof process?.hrtime?.bigint === 'function' ? process.hrtime.bigint() : null;
}

function durationMsSince(startedAt) {
  if (typeof startedAt !== 'bigint' || typeof process?.hrtime?.bigint !== 'function') {
    return null;
  }
  const diff = Number(process.hrtime.bigint() - startedAt) / 1e6;
  return Math.round(diff * 10) / 10;
}

function maskSecret(secret, { preserve = 4 } = {}) {
  if (typeof secret !== 'string' || secret.length === 0) {
    return '';
  }
  if (secret.length <= preserve) {
    return '*'.repeat(secret.length);
  }
  const visible = secret.slice(-preserve);
  return `${'*'.repeat(secret.length - preserve)}${visible}`;
}

function normaliseSection(section) {
  if (typeof section !== 'string') {
    return null;
  }
  const key = section.trim().toLowerCase();
  if (SECTION_NAMES.has(key)) {
    return key;
  }
  return null;
}

async function recordAudit({ section, action, status, message, metadata, actor }) {
  const metadataPayload = metadata && typeof metadata === 'object' ? { ...metadata } : {};
  if (!metadataPayload.sectionLabel && SECTION_LABELS[section]) {
    metadataPayload.sectionLabel = SECTION_LABELS[section];
  }

  const entry = await SystemSettingAudit.create({
    section,
    action,
    status,
    message,
    metadata: metadataPayload,
    performedBy: actor || 'system'
  });

  return entry.get({ plain: true });
}

async function probeUrl(url, { method = 'HEAD', headers } = {}) {
  if (typeof url !== 'string' || !url.trim()) {
    return { ok: false, status: null, message: 'URL missing' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  const startedAt = now();

  try {
    const response = await fetch(url, {
      method,
      headers,
      signal: controller.signal
    });
    return {
      ok: response.ok,
      status: response.status,
      message: response.statusText || 'Received response',
      durationMs: durationMsSince(startedAt)
    };
  } catch (error) {
    return {
      ok: false,
      status: null,
      message: error instanceof Error ? error.message : 'Unknown network error',
      durationMs: durationMsSince(startedAt)
    };
  } finally {
    clearTimeout(timeout);
  }
}

function validateEmail(value) {
  if (typeof value !== 'string') {
    return false;
  }
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function getSupportedDiagnosticSections() {
  return SECTION_DEFINITIONS.map((section) => ({ ...section }));
}

export async function listDiagnostics({ section, limit = 20 } = {}) {
  const where = {};
  const normalised = normaliseSection(section);
  if (normalised) {
    where.section = normalised;
  }

  const entries = await SystemSettingAudit.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit
  });

  return entries.map((entry) => entry.get({ plain: true }));
}

export async function runSmtpDiagnostic(payload = {}, actor) {
  const { host, port, secure, username, password, fromEmail } = payload;
  const metadata = {
    host: host || '',
    port: port || '',
    secure: Boolean(secure),
    username: username || '',
    hasPassword: Boolean(password),
    fromEmail: fromEmail || ''
  };

  if (!host || !fromEmail) {
    return recordAudit({
      section: 'smtp',
      action: 'verify',
      status: 'error',
      message: 'SMTP host and sender email are required before testing.',
      metadata,
      actor
    });
  }

  if (!validateEmail(fromEmail)) {
    return recordAudit({
      section: 'smtp',
      action: 'verify',
      status: 'error',
      message: 'The sender email address is not valid.',
      metadata,
      actor
    });
  }

  const startedAt = now();

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: port ? Number.parseInt(port, 10) : undefined,
      secure: Boolean(secure),
      auth:
        username || password
          ? {
              user: username,
              pass: password
            }
          : undefined
    });
    await transporter.verify();
    return recordAudit({
      section: 'smtp',
      action: 'verify',
      status: 'success',
      message: 'SMTP connection verified successfully.',
      metadata: {
        ...metadata,
        durationMs: durationMsSince(startedAt)
      },
      actor
    });
  } catch (error) {
    return recordAudit({
      section: 'smtp',
      action: 'verify',
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown SMTP failure',
      metadata: {
        ...metadata,
        durationMs: durationMsSince(startedAt)
      },
      actor
    });
  }
}

export async function runStorageDiagnostic(payload = {}, actor) {
  const { provider, bucket, endpoint, publicUrl } = payload;
  const metadata = {
    provider: provider || '',
    bucket: bucket || '',
    endpoint: endpoint || '',
    publicUrl: publicUrl || ''
  };

  if (!bucket) {
    return recordAudit({
      section: 'storage',
      action: 'verify',
      status: 'error',
      message: 'A bucket name is required for storage verification.',
      metadata,
      actor
    });
  }

  if (publicUrl) {
    const probe = await probeUrl(publicUrl, { method: 'HEAD' });
    const status = probe.ok ? 'success' : 'warning';
    return recordAudit({
      section: 'storage',
      action: 'verify',
      status,
      message: probe.ok
        ? 'Public storage URL responded successfully.'
        : `Unable to reach public storage URL: ${probe.message}`,
      metadata: {
        ...metadata,
        probeStatus: probe.status,
        probeMessage: probe.message,
        durationMs: probe.durationMs ?? null
      },
      actor
    });
  }

  if (endpoint) {
    const probe = await probeUrl(endpoint, { method: 'HEAD' });
    const status = probe.ok ? 'success' : 'warning';
    return recordAudit({
      section: 'storage',
      action: 'verify',
      status,
      message: probe.ok
        ? 'Storage endpoint responded successfully.'
        : `Unable to reach storage endpoint: ${probe.message}`,
      metadata: {
        ...metadata,
        probeStatus: probe.status,
        probeMessage: probe.message,
        durationMs: probe.durationMs ?? null
      },
      actor
    });
  }

  return recordAudit({
    section: 'storage',
    action: 'verify',
    status: 'warning',
    message: 'Provide either a public URL or endpoint to perform connectivity checks.',
    metadata,
    actor
  });
}

export async function runChatwootDiagnostic(payload = {}, actor) {
  const { baseUrl, websiteToken } = payload;
  const metadata = {
    baseUrl: baseUrl || '',
    hasToken: Boolean(websiteToken)
  };

  if (!baseUrl) {
    return recordAudit({
      section: 'chatwoot',
      action: 'verify',
      status: 'error',
      message: 'Chatwoot base URL is required to test connectivity.',
      metadata,
      actor
    });
  }

  const url = `${baseUrl.replace(/\/$/, '')}/api/v1/widget/inboxes/${websiteToken || ''}`;
  const probe = await probeUrl(url, { method: 'GET' });
  const status = probe.ok ? 'success' : 'warning';
  const message = probe.ok
    ? 'Chatwoot endpoint responded successfully.'
    : `Chatwoot endpoint response: ${probe.message}`;

  return recordAudit({
    section: 'chatwoot',
    action: 'verify',
    status,
    message,
    metadata: {
      ...metadata,
      probeStatus: probe.status,
      probeMessage: probe.message,
      durationMs: probe.durationMs ?? null
    },
    actor
  });
}

export async function runOpenAiDiagnostic(payload = {}, actor) {
  const {
    baseUrl,
    apiKey,
    provider,
    organizationId,
    defaultModel
  } = payload;
  const metadata = {
    provider: provider || 'openai',
    baseUrl: baseUrl || '',
    hasApiKey: Boolean(apiKey),
    organizationId: organizationId || '',
    defaultModel: defaultModel || ''
  };

  if (!apiKey) {
    return recordAudit({
      section: 'openai',
      action: 'verify',
      status: 'error',
      message: 'An API key is required to verify OpenAI connectivity.',
      metadata,
      actor
    });
  }

  const endpoint = `${(baseUrl || 'https://api.openai.com').replace(/\/$/, '')}/v1/models`;
  const headers = {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
  };
  if (organizationId) {
    headers['OpenAI-Organization'] = organizationId;
  }

  const probe = await probeUrl(endpoint, {
    method: 'GET',
    headers
  });

  const status = probe.ok ? 'success' : 'warning';
  const message = probe.ok
    ? 'OpenAI API responded successfully.'
    : `OpenAI API response: ${probe.message}`;

  return recordAudit({
    section: 'openai',
    action: 'verify',
    status,
    message,
    metadata: {
      ...metadata,
      probeStatus: probe.status,
      probeMessage: probe.message,
      durationMs: probe.durationMs ?? null
    },
    actor
  });
}

export async function runSlackDiagnostic(payload = {}, actor) {
  const { botToken, signingSecret, defaultChannel } = payload;
  const metadata = {
    hasBotToken: Boolean(botToken),
    hasSigningSecret: Boolean(signingSecret),
    defaultChannel: defaultChannel || ''
  };

  if (!botToken || !botToken.startsWith('xoxb-')) {
    return recordAudit({
      section: 'slack',
      action: 'verify',
      status: 'error',
      message: 'Slack bot token must be provided and begin with xoxb-.',
      metadata,
      actor
    });
  }

  if (!signingSecret || signingSecret.length < 20) {
    return recordAudit({
      section: 'slack',
      action: 'verify',
      status: 'error',
      message: 'Slack signing secret must be provided.',
      metadata,
      actor
    });
  }

  return recordAudit({
    section: 'slack',
    action: 'verify',
    status: 'success',
    message: 'Slack credentials meet the required format checks.',
    metadata,
    actor
  });
}

export async function runGithubDiagnostic(payload = {}, actor) {
  const { appId, clientId, clientSecret, privateKey, webhookSecret } = payload;
  const metadata = {
    appId: appId || '',
    clientId: clientId || '',
    hasClientSecret: Boolean(clientSecret),
    hasPrivateKey: Boolean(privateKey),
    webhookSecret: webhookSecret ? maskSecret(webhookSecret) : ''
  };

  if (!appId || !clientId || !clientSecret) {
    return recordAudit({
      section: 'github',
      action: 'verify',
      status: 'error',
      message: 'GitHub App ID, Client ID, and Client Secret are required.',
      metadata,
      actor
    });
  }

  if (!privateKey || !privateKey.includes('BEGIN PRIVATE KEY')) {
    return recordAudit({
      section: 'github',
      action: 'verify',
      status: 'error',
      message: 'GitHub private key must be a valid PEM string.',
      metadata,
      actor
    });
  }

  return recordAudit({
    section: 'github',
    action: 'verify',
    status: 'success',
    message: 'GitHub App credentials pass format validation.',
    metadata,
    actor
  });
}

export async function runGoogleDriveDiagnostic(payload = {}, actor) {
  const {
    clientId,
    clientSecret,
    redirectUri,
    serviceAccountEmail,
    serviceAccountKey
  } = payload;

  const metadata = {
    clientId: clientId || '',
    redirectUri: redirectUri || '',
    hasClientSecret: Boolean(clientSecret),
    hasServiceAccount: Boolean(serviceAccountEmail && serviceAccountKey)
  };

  if (!clientId || !clientSecret || !redirectUri) {
    return recordAudit({
      section: 'google-drive',
      action: 'verify',
      status: 'error',
      message: 'OAuth client ID, secret, and redirect URI are required.',
      metadata,
      actor
    });
  }

  if (serviceAccountEmail && !serviceAccountEmail.endsWith('.iam.gserviceaccount.com')) {
    return recordAudit({
      section: 'google-drive',
      action: 'verify',
      status: 'warning',
      message: 'Service account email has an unexpected format.',
      metadata,
      actor
    });
  }

  return recordAudit({
    section: 'google-drive',
    action: 'verify',
    status: 'success',
    message: 'Google Drive credentials look complete.',
    metadata,
    actor
  });
}

export async function runDiagnostic(section, payload = {}, actor) {
  const normalised = normaliseSection(section);
  if (!normalised) {
    throw new Error('Unsupported diagnostic section requested.');
  }

  switch (normalised) {
    case 'smtp':
      return runSmtpDiagnostic(payload, actor);
    case 'storage':
      return runStorageDiagnostic(payload, actor);
    case 'chatwoot':
      return runChatwootDiagnostic(payload, actor);
    case 'openai':
      return runOpenAiDiagnostic(payload, actor);
    case 'slack':
      return runSlackDiagnostic(payload, actor);
    case 'github':
      return runGithubDiagnostic(payload, actor);
    case 'google-drive':
      return runGoogleDriveDiagnostic(payload, actor);
    default:
      throw new Error('Unsupported diagnostic section requested.');
  }
}
