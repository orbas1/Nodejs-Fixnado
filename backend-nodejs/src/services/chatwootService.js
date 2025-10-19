import { getPlatformSettings } from './platformSettingsService.js';
import { recordLiveFeedAuditEvent } from './liveFeedAuditService.js';

function trimString(value, { maxLength } = {}) {
  if (typeof value !== 'string') {
    return '';
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  if (maxLength && trimmed.length > maxLength) {
    return trimmed.slice(0, maxLength);
  }
  return trimmed;
}

function normaliseBaseUrl(value) {
  const trimmed = trimString(value);
  if (!trimmed) {
    return '';
  }
  try {
    const url = new URL(trimmed);
    url.pathname = url.pathname.replace(/\/+$|$/, '/');
    return url.toString().replace(/\/$/, '');
  } catch (error) {
    return '';
  }
}

function sanitiseMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) {
    return {};
  }
  try {
    return JSON.parse(JSON.stringify(metadata));
  } catch (error) {
    return {};
  }
}

export async function getChatwootSettings() {
  const settings = await getPlatformSettings();
  const chatwoot = settings?.system?.chatwoot ?? {};
  const baseUrl = normaliseBaseUrl(chatwoot.baseUrl);
  const websiteToken = trimString(chatwoot.websiteToken, { maxLength: 120 });
  const inboxIdentifier = trimString(chatwoot.inboxIdentifier, { maxLength: 120 });

  return {
    enabled: Boolean(baseUrl && websiteToken),
    baseUrl,
    websiteToken,
    inboxIdentifier
  };
}

export async function getChatwootWidgetConfiguration() {
  const config = await getChatwootSettings();
  if (!config.enabled) {
    return { enabled: false };
  }
  return {
    enabled: true,
    baseUrl: config.baseUrl,
    websiteToken: config.websiteToken,
    inboxIdentifier: config.inboxIdentifier
  };
}

function buildSessionPayload(config, {
  userId,
  email,
  name,
  persona,
  locale,
  metadata
}) {
  const payload = {
    website_token: config.websiteToken,
    identifier: trimString(userId, { maxLength: 120 }) || undefined,
    user: {
      email: trimString(email, { maxLength: 180 }) || undefined,
      name: trimString(name, { maxLength: 160 }) || undefined
    },
    locale: trimString(locale, { maxLength: 16 }) || undefined,
    metadata: {
      persona: trimString(persona, { maxLength: 60 }) || undefined,
      ...sanitiseMetadata(metadata)
    }
  };

  if (!payload.user.email) {
    delete payload.user.email;
  }
  if (!payload.user.name) {
    delete payload.user.name;
  }
  if (!payload.locale) {
    delete payload.locale;
  }
  if (payload.metadata && Object.keys(payload.metadata).length === 0) {
    delete payload.metadata;
  }

  return payload;
}

async function postChatwoot(url, payload, { signal } = {}) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
    signal
  });

  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch (error) {
    json = null;
  }

  if (!response.ok) {
    const error = new Error(json?.message || 'Chatwoot API responded with an error');
    error.statusCode = response.status;
    error.body = json || text;
    throw error;
  }

  return json;
}

export async function createChatwootSession({
  userId,
  email,
  name,
  persona,
  locale = 'en-GB',
  metadata = {},
  actorRole = null
}) {
  const config = await getChatwootSettings();
  if (!config.enabled) {
    const error = new Error('Chatwoot integration is not configured.');
    error.statusCode = 503;
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const payload = buildSessionPayload(config, { userId, email, name, persona, locale, metadata });
    const endpoint = `${config.baseUrl}/public/api/v1/website_token/web_sessions`;
    const response = await postChatwoot(endpoint, payload, { signal: controller.signal });

    const session = {
      id: response?.web_session?.id || response?.id || null,
      token: response?.web_session?.token || response?.token || null,
      contact: response?.contact || null,
      inboxIdentifier: config.inboxIdentifier || null,
      baseUrl: config.baseUrl,
      expiresAt: response?.web_session?.expiry || null
    };

    try {
      await recordLiveFeedAuditEvent({
        eventType: 'timeline.support.chatwoot_session.created',
        summary: 'Chatwoot support session initialised',
        details: persona ? `Persona ${persona} requested assistance.` : null,
        status: 'open',
        severity: 'info',
        actorId: userId || null,
        actorRole: actorRole || null,
        actorPersona: persona || null,
        metadata: {
          hasEmail: Boolean(email),
          hasName: Boolean(name),
          chatwootSessionId: session.id || null,
          inboxIdentifier: session.inboxIdentifier || null
        }
      });
    } catch (auditError) {
      // eslint-disable-next-line no-console
      console.warn('[chatwoot] failed to record audit trail for session creation', auditError);
    }

    return session;
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('Chatwoot session request timed out.');
      timeoutError.statusCode = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
