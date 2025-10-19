import { SESSION_STORAGE_KEY, DEFAULT_TENANT_ID, DEFAULT_LOCALE } from '../constants/session.js';

const FALLBACK_CONTEXT = {
  tenantId: DEFAULT_TENANT_ID,
  role: 'guest',
  userId: null,
  locale: DEFAULT_LOCALE,
  persona: 'guest',
  allowedPersonas: []
};

function sanitiseString(value, { maxLength = 128, fallback = undefined } = {}) {
  if (typeof value !== 'string' || value.trim() === '') {
    return fallback;
  }

  return value.trim().slice(0, maxLength);
}

export function resolveSessionTelemetryContext() {
  if (typeof window === 'undefined') {
    return { ...FALLBACK_CONTEXT };
  }

  const context = { ...FALLBACK_CONTEXT };

  if (typeof window.__FIXNADO_SESSION__ === 'object' && window.__FIXNADO_SESSION__ !== null) {
    const { tenantId, role, userId, locale, activePersona, allowedPersonas } = window.__FIXNADO_SESSION__;
    context.tenantId = sanitiseString(tenantId, { fallback: context.tenantId });
    context.role = sanitiseString(role, { fallback: context.role });
    context.userId = typeof userId === 'string' ? userId : context.userId;
    context.locale = sanitiseString(locale, { fallback: context.locale });
    context.persona = sanitiseString(activePersona, { fallback: context.persona });
    if (Array.isArray(allowedPersonas)) {
      context.allowedPersonas = allowedPersonas
        .map((persona) => sanitiseString(persona, { fallback: null }))
        .filter(Boolean);
    }
  }

  try {
    const stored = window.localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      context.tenantId = sanitiseString(parsed.tenantId, { fallback: context.tenantId });
      context.role = sanitiseString(parsed.role, { fallback: context.role });
      context.userId = typeof parsed.userId === 'string' ? parsed.userId : context.userId;
      context.locale = sanitiseString(parsed.locale, { fallback: context.locale });
      context.persona = sanitiseString(parsed.activePersona, { fallback: context.persona });
      if (Array.isArray(parsed.allowedPersonas)) {
        context.allowedPersonas = parsed.allowedPersonas
          .map((persona) => sanitiseString(persona, { fallback: null }))
          .filter(Boolean);
      }
    }
  } catch (error) {
    console.warn('Failed to parse session context from storage', error);
  }

  return context;
}

export function buildPreferenceTelemetryPayload(preferences) {
  const context = resolveSessionTelemetryContext();
  const timestamp = new Date().toISOString();

  const basePayload = {
    type: 'ui_theme_preference',
    theme: preferences.theme,
    density: preferences.density,
    contrast: preferences.contrast,
    marketingVariant: preferences.marketingVariant,
    tenantId: context.tenantId,
    role: context.role,
    userId: context.userId,
    locale: context.locale,
    timestamp,
    source: 'theme-studio',
    dataVersion: '1.0.0'
  };

  if (typeof window !== 'undefined' && window.crypto?.randomUUID) {
    basePayload.correlationId = window.crypto.randomUUID();
  }

  if (typeof navigator !== 'undefined') {
    basePayload.userAgent = sanitiseString(navigator.userAgent, { maxLength: 255 });
  }

  return basePayload;
}
