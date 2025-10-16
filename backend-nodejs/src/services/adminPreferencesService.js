import { PlatformSetting } from '../models/index.js';

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function toStringValue(input, fallback = '') {
  if (input == null) {
    return fallback;
  }
  if (typeof input === 'string') {
    return input.trim();
  }
  if (typeof input === 'number' || typeof input === 'boolean') {
    return String(input);
  }
  return fallback;
}

function normaliseBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true' || value === '1') {
    return true;
  }
  if (value === 'false' || value === '0') {
    return false;
  }
  return fallback;
}

function normaliseNumber(value, { min = Number.NEGATIVE_INFINITY, max = Number.POSITIVE_INFINITY, fallback = 0 } = {}) {
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

function validationError(message, details = []) {
  const error = new Error(message);
  error.name = 'ValidationError';
  error.statusCode = 422;
  error.details = details;
  return error;
}

function uniqueStrings(values = []) {
  const set = new Set();
  const output = [];
  values
    .filter((value) => typeof value === 'string')
    .map((value) => value.trim())
    .filter((value) => value.length > 0)
    .forEach((value) => {
      const key = value.toLowerCase();
      if (set.has(key)) {
        return;
      }
      set.add(key);
      output.push(value);
    });
  return output;
}

function normaliseEmailList(value) {
  if (Array.isArray(value)) {
    return uniqueStrings(value);
  }
  if (typeof value === 'string') {
    return uniqueStrings(value.split(/[,\n]/));
  }
  return [];
}

function normaliseRoleList(value, fallback = []) {
  if (Array.isArray(value)) {
    return uniqueStrings(value);
  }
  if (typeof value === 'string') {
    return uniqueStrings(value.split(/[,\n]/));
  }
  return fallback.slice();
}

function normaliseIpList(value, fallback = []) {
  if (Array.isArray(value)) {
    return uniqueStrings(value);
  }
  if (typeof value === 'string') {
    return uniqueStrings(value.split(/[,\n]/));
  }
  return fallback.slice();
}

function sanitiseQuickLinks(value, fallback = []) {
  if (!Array.isArray(value)) {
    return fallback.slice();
  }

  const links = [];
  value.forEach((link) => {
    if (!link || typeof link !== 'object') {
      return;
    }
    const label = toStringValue(link.label);
    const href = toStringValue(link.href);
    if (!label || !href) {
      return;
    }
    links.push({ label, href });
  });
  return links;
}

const DEFAULT_ADMIN_PREFERENCES = Object.freeze({
  general: {
    platformName: 'Fixnado',
    supportEmail: 'support@fixnado.com',
    defaultLocale: 'en-GB',
    defaultTimezone: 'Europe/London',
    brandColor: '#1D4ED8',
    loginUrl: 'https://app.fixnado.com/admin'
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: false,
    pushEnabled: true,
    dailyDigestHour: 8,
    digestTimezone: 'Europe/London',
    escalationEmails: ['security@fixnado.com'],
    incidentWebhookUrl: ''
  },
  security: {
    requireMfa: true,
    sessionTimeoutMinutes: 30,
    passwordRotationDays: 90,
    allowPasswordless: false,
    ipAllowlist: [],
    loginAlertEmails: ['security@fixnado.com']
  },
  workspace: {
    maintenanceMode: false,
    maintenanceMessage: '',
    defaultLandingPage: '/admin/dashboard',
    theme: 'system',
    enableBetaFeatures: false,
    allowedAdminRoles: ['admin', 'operations'],
    quickLinks: [
      { label: 'Security centre', href: '/admin/dashboard#security-posture' },
      { label: 'Monetisation controls', href: '/admin/monetisation' }
    ]
  }
});

const DEFAULT_META = Object.freeze({
  updatedAt: null,
  updatedBy: null,
  version: 0,
  changedSections: []
});

let cachedPreferences = clone(DEFAULT_ADMIN_PREFERENCES);
let cachedMeta = { ...DEFAULT_META };
let cacheLoaded = false;
let inflight = null;

function sanitiseGeneral(update = {}, current = DEFAULT_ADMIN_PREFERENCES.general) {
  const next = { ...current };
  if (Object.hasOwn(update, 'platformName')) {
    const value = toStringValue(update.platformName, current.platformName);
    if (!value) {
      throw validationError('Platform name cannot be empty.', [
        { field: 'general.platformName', message: 'Provide a platform name.' }
      ]);
    }
    next.platformName = value;
  }
  if (Object.hasOwn(update, 'supportEmail')) {
    const value = toStringValue(update.supportEmail, current.supportEmail);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      throw validationError('Support email must be a valid email address.', [
        { field: 'general.supportEmail', message: 'Enter a valid email address.' }
      ]);
    }
    next.supportEmail = value;
  }
  if (Object.hasOwn(update, 'defaultLocale')) {
    const value = toStringValue(update.defaultLocale, current.defaultLocale);
    next.defaultLocale = value || current.defaultLocale;
  }
  if (Object.hasOwn(update, 'defaultTimezone')) {
    const value = toStringValue(update.defaultTimezone, current.defaultTimezone);
    next.defaultTimezone = value || current.defaultTimezone;
  }
  if (Object.hasOwn(update, 'brandColor')) {
    const value = toStringValue(update.brandColor, current.brandColor);
    next.brandColor = value || current.brandColor;
  }
  if (Object.hasOwn(update, 'loginUrl')) {
    const value = toStringValue(update.loginUrl, current.loginUrl);
    if (value && !/^https?:\/\//i.test(value)) {
      throw validationError('Login URL must be an absolute HTTP(S) URL.', [
        { field: 'general.loginUrl', message: 'Provide a full URL including protocol.' }
      ]);
    }
    next.loginUrl = value || current.loginUrl;
  }
  return next;
}

function sanitiseNotifications(update = {}, current = DEFAULT_ADMIN_PREFERENCES.notifications) {
  const next = { ...current };
  if (Object.hasOwn(update, 'emailEnabled')) {
    next.emailEnabled = normaliseBoolean(update.emailEnabled, current.emailEnabled);
  }
  if (Object.hasOwn(update, 'smsEnabled')) {
    next.smsEnabled = normaliseBoolean(update.smsEnabled, current.smsEnabled);
  }
  if (Object.hasOwn(update, 'pushEnabled')) {
    next.pushEnabled = normaliseBoolean(update.pushEnabled, current.pushEnabled);
  }
  if (Object.hasOwn(update, 'dailyDigestHour')) {
    next.dailyDigestHour = normaliseNumber(update.dailyDigestHour, { min: 0, max: 23, fallback: current.dailyDigestHour });
  }
  if (Object.hasOwn(update, 'digestTimezone')) {
    const value = toStringValue(update.digestTimezone, current.digestTimezone);
    next.digestTimezone = value || current.digestTimezone;
  }
  if (Object.hasOwn(update, 'escalationEmails')) {
    const emails = normaliseEmailList(update.escalationEmails);
    if (emails.length === 0) {
      throw validationError('At least one escalation email is required.', [
        { field: 'notifications.escalationEmails', message: 'Add at least one escalation contact email.' }
      ]);
    }
    next.escalationEmails = emails;
  }
  if (Object.hasOwn(update, 'incidentWebhookUrl')) {
    const value = toStringValue(update.incidentWebhookUrl, current.incidentWebhookUrl);
    if (value && !/^https?:\/\//i.test(value)) {
      throw validationError('Incident webhook URL must be an absolute HTTP(S) URL.', [
        { field: 'notifications.incidentWebhookUrl', message: 'Provide a valid webhook URL.' }
      ]);
    }
    next.incidentWebhookUrl = value;
  }
  return next;
}

function sanitiseSecurity(update = {}, current = DEFAULT_ADMIN_PREFERENCES.security) {
  const next = { ...current };
  if (Object.hasOwn(update, 'requireMfa')) {
    next.requireMfa = normaliseBoolean(update.requireMfa, current.requireMfa);
  }
  if (Object.hasOwn(update, 'allowPasswordless')) {
    next.allowPasswordless = normaliseBoolean(update.allowPasswordless, current.allowPasswordless);
  }
  if (Object.hasOwn(update, 'sessionTimeoutMinutes')) {
    next.sessionTimeoutMinutes = normaliseNumber(update.sessionTimeoutMinutes, {
      min: 5,
      max: 480,
      fallback: current.sessionTimeoutMinutes
    });
  }
  if (Object.hasOwn(update, 'passwordRotationDays')) {
    next.passwordRotationDays = normaliseNumber(update.passwordRotationDays, {
      min: 0,
      max: 365,
      fallback: current.passwordRotationDays
    });
  }
  if (Object.hasOwn(update, 'ipAllowlist')) {
    next.ipAllowlist = normaliseIpList(update.ipAllowlist, current.ipAllowlist);
  }
  if (Object.hasOwn(update, 'loginAlertEmails')) {
    next.loginAlertEmails = normaliseEmailList(update.loginAlertEmails);
  }
  if (next.requireMfa && next.loginAlertEmails.length === 0) {
    throw validationError('Configure login alert recipients when MFA is enforced.', [
      { field: 'security.loginAlertEmails', message: 'Add at least one login alert email when MFA is required.' }
    ]);
  }
  return next;
}

function sanitiseWorkspace(update = {}, current = DEFAULT_ADMIN_PREFERENCES.workspace) {
  const next = { ...current };
  if (Object.hasOwn(update, 'maintenanceMode')) {
    next.maintenanceMode = normaliseBoolean(update.maintenanceMode, current.maintenanceMode);
  }
  if (Object.hasOwn(update, 'maintenanceMessage')) {
    next.maintenanceMessage = toStringValue(update.maintenanceMessage, current.maintenanceMessage);
  }
  if (Object.hasOwn(update, 'defaultLandingPage')) {
    const value = toStringValue(update.defaultLandingPage, current.defaultLandingPage);
    next.defaultLandingPage = value || current.defaultLandingPage;
  }
  if (Object.hasOwn(update, 'theme')) {
    const value = toStringValue(update.theme, current.theme).toLowerCase();
    next.theme = ['light', 'dark', 'system'].includes(value) ? value : current.theme;
  }
  if (Object.hasOwn(update, 'enableBetaFeatures')) {
    next.enableBetaFeatures = normaliseBoolean(update.enableBetaFeatures, current.enableBetaFeatures);
  }
  if (Object.hasOwn(update, 'allowedAdminRoles')) {
    const roles = normaliseRoleList(update.allowedAdminRoles, current.allowedAdminRoles);
    if (roles.length === 0) {
      throw validationError('At least one admin role is required.', [
        { field: 'workspace.allowedAdminRoles', message: 'Specify at least one allowed admin role.' }
      ]);
    }
    next.allowedAdminRoles = roles;
  }
  if (Object.hasOwn(update, 'quickLinks')) {
    next.quickLinks = sanitiseQuickLinks(update.quickLinks, current.quickLinks);
  }
  return next;
}

async function refreshCache() {
  const row = await PlatformSetting.findOne({ where: { key: 'admin_preferences' } });
  const base = clone(DEFAULT_ADMIN_PREFERENCES);
  let storedMeta = null;
  if (row?.value && typeof row.value === 'object') {
    const { __meta, general, notifications, security, workspace } = row.value;
    storedMeta = __meta;
    if (general) {
      base.general = { ...base.general, ...general };
    }
    if (notifications) {
      base.notifications = { ...base.notifications, ...notifications };
    }
    if (security) {
      base.security = { ...base.security, ...security };
    }
    if (workspace) {
      base.workspace = { ...base.workspace, ...workspace };
    }
  }
  cachedPreferences = base;
  const hasRow = Boolean(row);
  const previousVersion = cachedMeta.version ?? DEFAULT_META.version;
  const resolvedVersion =
    typeof storedMeta?.version === 'number'
      ? storedMeta.version
      : hasRow
        ? previousVersion
        : DEFAULT_META.version;
  const resolvedChangedSections = Array.isArray(storedMeta?.changedSections)
    ? storedMeta.changedSections.slice()
    : DEFAULT_META.changedSections.slice();
  cachedMeta = {
    updatedAt: row?.updatedAt ? row.updatedAt.toISOString() : null,
    updatedBy: row?.updatedBy ?? null,
    version: resolvedVersion,
    changedSections: resolvedChangedSections
  };
  cacheLoaded = true;
  return {
    preferences: clone(cachedPreferences),
    meta: { ...cachedMeta, changedSections: cachedMeta.changedSections.slice() }
  };
}

async function ensureCache(forceRefresh = false) {
  if (cacheLoaded && !forceRefresh) {
    return {
      preferences: clone(cachedPreferences),
      meta: { ...cachedMeta, changedSections: cachedMeta.changedSections.slice() }
    };
  }
  if (!inflight || forceRefresh) {
    inflight = refreshCache().finally(() => {
      inflight = null;
    });
  }
  return inflight;
}

export async function getAdminPreferences({ forceRefresh = false } = {}) {
  const snapshot = await ensureCache(forceRefresh);
  return snapshot;
}

export async function updateAdminPreferences(updates = {}, actor = 'system') {
  await ensureCache();
  const current = clone(cachedPreferences);
  const next = { ...current };
  const sections = new Set();

  if (Object.hasOwn(updates, 'general')) {
    next.general = sanitiseGeneral(updates.general, current.general);
    sections.add('general');
  }
  if (Object.hasOwn(updates, 'notifications')) {
    next.notifications = sanitiseNotifications(updates.notifications, current.notifications);
    sections.add('notifications');
  }
  if (Object.hasOwn(updates, 'security')) {
    next.security = sanitiseSecurity(updates.security, current.security);
    sections.add('security');
  }
  if (Object.hasOwn(updates, 'workspace')) {
    next.workspace = sanitiseWorkspace(updates.workspace, current.workspace);
    sections.add('workspace');
  }

  if (sections.size === 0) {
    throw validationError('No recognised preference updates provided.');
  }

  const changedSections = Array.from(sections).sort();
  const version = (cachedMeta.version ?? DEFAULT_META.version) + 1;
  const persistedValue = { ...next, __meta: { changedSections, version } };

  await PlatformSetting.upsert({
    key: 'admin_preferences',
    value: persistedValue,
    updatedBy: actor || 'system'
  });

  const snapshot = await refreshCache();
  return snapshot;
}

export function getCachedAdminPreferences() {
  return {
    preferences: clone(cachedPreferences),
    meta: { ...cachedMeta, changedSections: cachedMeta.changedSections.slice() }
  };
}

export default {
  getAdminPreferences,
  updateAdminPreferences,
  getCachedAdminPreferences
};
