import {
  CustomerAccountSetting,
  CustomerNotificationRecipient,
  User,
  sequelize
} from '../models/index.js';

const SUPPORTED_CHANNELS = ['email', 'sms', 'slack', 'webhook'];
const SUPPORTED_ROLES = ['viewer', 'approver', 'finance', 'admin'];
const SUPPORTED_CURRENCIES = ['GBP', 'EUR', 'USD'];
const SUPPORTED_LOCALES = ['en-GB', 'en-US', 'es-ES', 'fr-FR', 'de-DE'];

const SUPPORTED_TIMEZONES = (() => {
  if (typeof Intl?.supportedValuesOf === 'function') {
    try {
      return Intl.supportedValuesOf('timeZone');
    } catch (error) {
      console.warn('Failed to enumerate timezones, falling back to defaults', error);
    }
  }
  return ['Europe/London', 'UTC'];
})();

const DEFAULT_SETTINGS = Object.freeze({
  timezone: 'Europe/London',
  locale: 'en-GB',
  defaultCurrency: 'GBP',
  weeklySummaryEnabled: true,
  dispatchAlertsEnabled: true,
  escrowAlertsEnabled: true,
  conciergeAlertsEnabled: true,
  quietHoursStart: null,
  quietHoursEnd: null
});

function assertUserId(userId) {
  if (!userId) {
    const error = new Error('user_required');
    error.statusCode = 400;
    throw error;
  }
}

function normaliseString(value, { field, min = 1, max = 255, optional = false } = {}) {
  if (value === undefined || value === null) {
    if (optional) {
      return null;
    }
    const error = new Error(`${field}_required`);
    error.statusCode = 422;
    throw error;
  }

  if (typeof value !== 'string') {
    const error = new TypeError(`${field}_must_be_string`);
    error.statusCode = 422;
    throw error;
  }

  const trimmed = value.trim();
  if (!optional && trimmed.length < min) {
    const error = new Error(`${field}_too_short`);
    error.statusCode = 422;
    throw error;
  }

  if (trimmed.length > max) {
    const error = new Error(`${field}_too_long`);
    error.statusCode = 422;
    throw error;
  }

  return trimmed;
}

function normaliseOptionalString(value, options = {}) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return normaliseString(value, { ...options, optional: true });
}

function normaliseBoolean(value, fallback = false) {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lowered = value.trim().toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(lowered)) {
      return true;
    }
    if (['0', 'false', 'no', 'off'].includes(lowered)) {
      return false;
    }
  }
  return fallback;
}

function normaliseTimeWindow(value, field) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    const error = new TypeError(`${field}_must_be_string`);
    error.statusCode = 422;
    throw error;
  }
  const trimmed = value.trim();
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed)) {
    const error = new Error(`${field}_invalid`);
    error.statusCode = 422;
    throw error;
  }
  return trimmed;
}

async function getOrCreateAccountSetting(userId, transaction) {
  const [settings] = await CustomerAccountSetting.findOrCreate({
    where: { userId },
    defaults: DEFAULT_SETTINGS,
    transaction
  });
  return settings;
}

function serialiseRecipient(recipient) {
  return {
    id: recipient.id,
    accountSettingId: recipient.accountSettingId,
    label: recipient.label,
    channel: recipient.channel,
    target: recipient.target,
    role: recipient.role,
    enabled: Boolean(recipient.enabled),
    createdAt: recipient.createdAt?.toISOString?.() ?? null,
    updatedAt: recipient.updatedAt?.toISOString?.() ?? null
  };
}

function buildCatalogs() {
  return {
    channels: SUPPORTED_CHANNELS,
    roles: SUPPORTED_ROLES,
    currencies: SUPPORTED_CURRENCIES,
    locales: SUPPORTED_LOCALES,
    timezones: SUPPORTED_TIMEZONES
  };
}

export async function getAccountSettings(userId) {
  assertUserId(userId);
  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error('user_not_found');
    error.statusCode = 404;
    throw error;
  }

  const settings = await getOrCreateAccountSetting(userId);
  const recipients = await CustomerNotificationRecipient.findAll({
    where: { accountSettingId: settings.id },
    order: [['createdAt', 'ASC']]
  });

  return {
    profile: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      profileImageUrl: user.profileImageUrl,
      timezone: settings.timezone,
      locale: settings.locale
    },
    security: {
      twoFactorApp: Boolean(user.twoFactorApp),
      twoFactorEmail: Boolean(user.twoFactorEmail)
    },
    preferences: {
      defaultCurrency: settings.defaultCurrency,
      weeklySummaryEnabled: Boolean(settings.weeklySummaryEnabled),
      dispatchAlertsEnabled: Boolean(settings.dispatchAlertsEnabled),
      escrowAlertsEnabled: Boolean(settings.escrowAlertsEnabled),
      conciergeAlertsEnabled: Boolean(settings.conciergeAlertsEnabled),
      quietHoursStart: settings.quietHoursStart,
      quietHoursEnd: settings.quietHoursEnd
    },
    recipients: recipients.map(serialiseRecipient),
    catalogs: buildCatalogs()
  };
}

export async function updateAccountProfile(userId, payload = {}) {
  assertUserId(userId);
  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error('user_not_found');
    error.statusCode = 404;
    throw error;
  }

  const firstName = normaliseString(payload.firstName ?? user.firstName ?? '', { field: 'first_name' });
  const lastName = normaliseString(payload.lastName ?? user.lastName ?? '', { field: 'last_name' });
  const email = normaliseString(payload.email ?? user.email ?? '', {
    field: 'email',
    max: 320
  });
  const phoneNumber = normaliseOptionalString(payload.phoneNumber, {
    field: 'phone_number',
    max: 32,
    optional: true
  });
  const profileImageUrl = normaliseOptionalString(payload.profileImageUrl, {
    field: 'profile_image_url',
    max: 2048,
    optional: true
  });

  user.firstName = firstName;
  user.lastName = lastName;
  user.email = email;
  user.phoneNumber = phoneNumber;
  user.profileImageUrl = profileImageUrl;

  await user.save();

  return getAccountSettings(userId);
}

export async function updateAccountPreferences(userId, payload = {}) {
  assertUserId(userId);

  await sequelize.transaction(async (transaction) => {
    const settings = await getOrCreateAccountSetting(userId, transaction);

    const timezone = normaliseString(payload.timezone ?? settings.timezone ?? DEFAULT_SETTINGS.timezone, {
      field: 'timezone',
      max: 120
    });
    const locale = normaliseString(payload.locale ?? settings.locale ?? DEFAULT_SETTINGS.locale, {
      field: 'locale',
      max: 24
    });
    const defaultCurrency = normaliseString(
      payload.defaultCurrency ?? settings.defaultCurrency ?? DEFAULT_SETTINGS.defaultCurrency,
      { field: 'default_currency', max: 12 }
    );

    if (!SUPPORTED_TIMEZONES.includes(timezone)) {
      console.warn('Requested timezone not in supported list, accepting for compatibility', timezone);
    }

    if (!SUPPORTED_LOCALES.includes(locale)) {
      console.warn('Requested locale not in supported list, accepting for compatibility', locale);
    }

    if (!SUPPORTED_CURRENCIES.includes(defaultCurrency)) {
      const error = new Error('currency_not_supported');
      error.statusCode = 422;
      throw error;
    }

    const quietHoursStart = normaliseTimeWindow(payload.quietHoursStart ?? settings.quietHoursStart, 'quiet_hours_start');
    const quietHoursEnd = normaliseTimeWindow(payload.quietHoursEnd ?? settings.quietHoursEnd, 'quiet_hours_end');

    const weeklySummaryEnabled = normaliseBoolean(payload.weeklySummaryEnabled, settings.weeklySummaryEnabled);
    const dispatchAlertsEnabled = normaliseBoolean(payload.dispatchAlertsEnabled, settings.dispatchAlertsEnabled);
    const escrowAlertsEnabled = normaliseBoolean(payload.escrowAlertsEnabled, settings.escrowAlertsEnabled);
    const conciergeAlertsEnabled = normaliseBoolean(payload.conciergeAlertsEnabled, settings.conciergeAlertsEnabled);

    settings.timezone = timezone;
    settings.locale = locale;
    settings.defaultCurrency = defaultCurrency;
    settings.weeklySummaryEnabled = weeklySummaryEnabled;
    settings.dispatchAlertsEnabled = dispatchAlertsEnabled;
    settings.escrowAlertsEnabled = escrowAlertsEnabled;
    settings.conciergeAlertsEnabled = conciergeAlertsEnabled;
    settings.quietHoursStart = quietHoursStart;
    settings.quietHoursEnd = quietHoursEnd;

    await settings.save({ transaction });
  });

  return getAccountSettings(userId);
}

export async function updateAccountSecurity(userId, payload = {}) {
  assertUserId(userId);
  const user = await User.findByPk(userId);
  if (!user) {
    const error = new Error('user_not_found');
    error.statusCode = 404;
    throw error;
  }

  const twoFactorApp = normaliseBoolean(payload.twoFactorApp, user.twoFactorApp);
  const twoFactorEmail = normaliseBoolean(payload.twoFactorEmail, user.twoFactorEmail);

  user.twoFactorApp = twoFactorApp;
  user.twoFactorEmail = twoFactorEmail;

  await user.save();

  return getAccountSettings(userId);
}

async function resolveAccountSettingId(userId, transaction) {
  const settings = await getOrCreateAccountSetting(userId, transaction);
  return settings.id;
}

function validateRecipientPayload(payload = {}) {
  const label = normaliseString(payload.label ?? '', { field: 'label', max: 120 });
  const channel = normaliseString(payload.channel ?? '', { field: 'channel', max: 32 }).toLowerCase();
  const role = normaliseString(payload.role ?? 'viewer', { field: 'role', max: 32 }).toLowerCase();
  const enabled = normaliseBoolean(payload.enabled, true);
  const target = normaliseString(payload.target ?? '', { field: 'target', max: 320 });

  if (!SUPPORTED_CHANNELS.includes(channel)) {
    const error = new Error('channel_not_supported');
    error.statusCode = 422;
    throw error;
  }

  if (!SUPPORTED_ROLES.includes(role)) {
    const error = new Error('role_not_supported');
    error.statusCode = 422;
    throw error;
  }

  if (channel === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(target)) {
    const error = new Error('target_invalid_email');
    error.statusCode = 422;
    throw error;
  }

  if (channel === 'sms' && !/^\+?[0-9\s-]{7,20}$/.test(target)) {
    const error = new Error('target_invalid_sms');
    error.statusCode = 422;
    throw error;
  }

  return { label, channel, role, enabled, target };
}

export async function createNotificationRecipient(userId, payload = {}) {
  assertUserId(userId);

  return sequelize.transaction(async (transaction) => {
    const accountSettingId = await resolveAccountSettingId(userId, transaction);
    const existingCount = await CustomerNotificationRecipient.count({
      where: { accountSettingId },
      transaction
    });

    if (existingCount >= 25) {
      const error = new Error('recipient_limit_reached');
      error.statusCode = 422;
      throw error;
    }

    const { label, channel, role, enabled, target } = validateRecipientPayload(payload);

    const recipient = await CustomerNotificationRecipient.create(
      { accountSettingId, label, channel, role, enabled, target },
      { transaction }
    );

    return serialiseRecipient(recipient);
  });
}

export async function updateNotificationRecipient(userId, recipientId, payload = {}) {
  assertUserId(userId);
  if (!recipientId) {
    const error = new Error('recipient_required');
    error.statusCode = 400;
    throw error;
  }

  return sequelize.transaction(async (transaction) => {
    const accountSettingId = await resolveAccountSettingId(userId, transaction);

    const recipient = await CustomerNotificationRecipient.findOne({
      where: { id: recipientId, accountSettingId },
      transaction
    });

    if (!recipient) {
      const error = new Error('recipient_not_found');
      error.statusCode = 404;
      throw error;
    }

    const { label, channel, role, enabled, target } = validateRecipientPayload({
      label: payload.label ?? recipient.label,
      channel: payload.channel ?? recipient.channel,
      role: payload.role ?? recipient.role,
      enabled: payload.enabled ?? recipient.enabled,
      target: payload.target ?? recipient.target
    });

    recipient.label = label;
    recipient.channel = channel;
    recipient.role = role;
    recipient.enabled = enabled;
    recipient.target = target;

    await recipient.save({ transaction });

    return serialiseRecipient(recipient);
  });
}

export async function deleteNotificationRecipient(userId, recipientId) {
  assertUserId(userId);
  if (!recipientId) {
    const error = new Error('recipient_required');
    error.statusCode = 400;
    throw error;
  }

  return sequelize.transaction(async (transaction) => {
    const accountSettingId = await resolveAccountSettingId(userId, transaction);

    const deleted = await CustomerNotificationRecipient.destroy({
      where: { id: recipientId, accountSettingId },
      transaction
    });

    if (deleted === 0) {
      const error = new Error('recipient_not_found');
      error.statusCode = 404;
      throw error;
    }

    return { success: true };
  });
}

export default {
  getAccountSettings,
  updateAccountProfile,
  updateAccountPreferences,
  updateAccountSecurity,
  createNotificationRecipient,
  updateNotificationRecipient,
  deleteNotificationRecipient
};
