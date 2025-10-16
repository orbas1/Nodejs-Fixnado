import { randomUUID } from 'crypto';
import { sequelize, User, UserProfileSetting } from '../models/index.js';
import { recordSecurityEvent } from './auditTrailService.js';

const DEFAULT_NOTIFICATION_PREFERENCES = Object.freeze({
  dispatch: { email: true, sms: false },
  support: { email: true, sms: false },
  weeklySummary: { email: true },
  concierge: { email: true, sms: false },
  escalationContacts: []
});

const DEFAULT_BILLING_PREFERENCES = Object.freeze({
  preferredCurrency: 'GBP',
  defaultPaymentMethod: null,
  paymentNotes: null
});

function createValidationError(message, details = []) {
  const error = new Error(message);
  error.name = 'ValidationError';
  error.statusCode = 422;
  error.details = details;
  return error;
}

function mergePreferences(base, override) {
  if (!override || typeof override !== 'object') {
    return { ...base };
  }
  const output = { ...base };
  Object.entries(override).forEach(([key, value]) => {
    if (value === undefined) return;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      output[key] = mergePreferences(base[key] ?? {}, value);
    } else {
      output[key] = value;
    }
  });
  return output;
}

function normaliseBoolean(value, fallback = false) {
  if (value === undefined || value === null) {
    return Boolean(fallback);
  }
  return value === 'false' ? false : Boolean(value);
}

function normaliseString(value) {
  if (value === undefined || value === null) {
    return null;
  }
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

function normaliseTimezone(value, { field, errors }) {
  const candidate = normaliseString(value);
  if (!candidate) {
    return null;
  }

  try {
    if (typeof Intl.supportedValuesOf === 'function') {
      const supported = Intl.supportedValuesOf('timeZone');
      if (!supported.includes(candidate)) {
        throw new Error('unsupported');
      }
    } else {
      new Intl.DateTimeFormat('en', { timeZone: candidate });
    }
  } catch (error) {
    errors.push({ field, message: 'Timezone is not recognised.' });
    return null;
  }

  return candidate;
}

function normaliseLanguage(value, { field, errors }) {
  const candidate = normaliseString(value);
  if (!candidate) {
    return null;
  }

  const pattern = /^[a-z]{2}(?:-[A-Z]{2})?$/;
  if (!pattern.test(candidate)) {
    errors.push({ field, message: 'Language must follow BCP-47 (e.g. en-GB).' });
    return null;
  }
  return candidate;
}

function normaliseCurrency(value, { field, errors }) {
  const candidate = normaliseString(value);
  if (!candidate) {
    return null;
  }
  if (!/^[A-Z]{3}$/.test(candidate)) {
    errors.push({ field, message: 'Currency must be a three-letter ISO code.' });
    return null;
  }
  return candidate;
}

function normaliseUrl(value, { field, errors }) {
  const candidate = normaliseString(value);
  if (!candidate) {
    return null;
  }
  try {
    const parsed = new URL(candidate);
    return parsed.toString();
  } catch (error) {
    errors.push({ field, message: 'URL is invalid.' });
    return null;
  }
}

function normaliseEmail(value, { field, errors }) {
  const candidate = normaliseString(value);
  if (!candidate) {
    return null;
  }
  const pattern = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  if (!pattern.test(candidate)) {
    errors.push({ field, message: 'Email address is invalid.' });
    return null;
  }
  return candidate;
}

function normaliseTime(value, { field, errors }) {
  const candidate = normaliseString(value);
  if (!candidate) {
    return null;
  }
  if (!/^\d{2}:\d{2}$/.test(candidate)) {
    errors.push({ field, message: 'Time must be formatted HH:MM.' });
    return null;
  }
  const [hours, minutes] = candidate.split(':').map((part) => Number.parseInt(part, 10));
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    errors.push({ field, message: 'Time must be a valid 24h clock value.' });
    return null;
  }
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function sanitiseNotificationPreferences(preferences, errors, current = {}) {
  const merged = mergePreferences(DEFAULT_NOTIFICATION_PREFERENCES, current);
  if (!preferences || typeof preferences !== 'object') {
    return merged;
  }

  const output = { ...merged };
  if (Object.hasOwn(preferences, 'dispatch')) {
    output.dispatch = {
      email: normaliseBoolean(preferences.dispatch?.email, output.dispatch.email),
      sms: normaliseBoolean(preferences.dispatch?.sms, output.dispatch.sms)
    };
  }
  if (Object.hasOwn(preferences, 'support')) {
    output.support = {
      email: normaliseBoolean(preferences.support?.email, output.support.email),
      sms: normaliseBoolean(preferences.support?.sms, output.support.sms)
    };
  }
  if (Object.hasOwn(preferences, 'weeklySummary')) {
    output.weeklySummary = {
      email: normaliseBoolean(preferences.weeklySummary?.email, output.weeklySummary.email)
    };
  }
  if (Object.hasOwn(preferences, 'concierge')) {
    output.concierge = {
      email: normaliseBoolean(preferences.concierge?.email, output.concierge.email),
      sms: normaliseBoolean(preferences.concierge?.sms, output.concierge.sms)
    };
  }
  if (Array.isArray(preferences.escalationContacts)) {
    output.escalationContacts = preferences.escalationContacts
      .map((entry, index) => {
        const name = normaliseString(entry?.name);
        const email = normaliseEmail(entry?.email, {
          field: `notifications.escalationContacts[${index}].email`,
          errors
        });
        if (!email) {
          return null;
        }
        return {
          id: normaliseString(entry?.id) ?? randomUUID(),
          name: name ?? null,
          email
        };
      })
      .filter(Boolean);
  }

  return output;
}

function sanitiseBillingPreferences(preferences, errors, current = {}) {
  const merged = mergePreferences(DEFAULT_BILLING_PREFERENCES, current);
  if (!preferences || typeof preferences !== 'object') {
    return merged;
  }

  const output = { ...merged };
  if (Object.hasOwn(preferences, 'preferredCurrency')) {
    output.preferredCurrency =
      normaliseCurrency(preferences.preferredCurrency, {
        field: 'billing.preferredCurrency',
        errors
      }) ?? output.preferredCurrency;
  }
  if (Object.hasOwn(preferences, 'defaultPaymentMethod')) {
    output.defaultPaymentMethod = normaliseString(preferences.defaultPaymentMethod);
  }
  if (Object.hasOwn(preferences, 'paymentNotes')) {
    output.paymentNotes = normaliseString(preferences.paymentNotes);
  }
  return output;
}

function sanitiseInvoiceRecipients(list, errors) {
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .map((entry, index) => {
      const email = normaliseEmail(entry?.email, {
        field: `billing.invoiceRecipients[${index}].email`,
        errors
      });
      if (!email) {
        return null;
      }
      return {
        id: normaliseString(entry?.id) ?? randomUUID(),
        name: normaliseString(entry?.name),
        email
      };
    })
    .filter(Boolean);
}

function sanitiseQuietHours(payload, errors, settings) {
  if (!payload || typeof payload !== 'object') {
    return {
      enabled: settings?.quietHoursEnabled ?? false,
      start: settings?.quietHoursStart ?? null,
      end: settings?.quietHoursEnd ?? null,
      timezone: settings?.quietHoursTimezone ?? null
    };
  }

  const enabled = normaliseBoolean(payload.enabled, settings?.quietHoursEnabled ?? false);
  const start = normaliseTime(payload.start, { field: 'notifications.quietHours.start', errors }) ??
    settings?.quietHoursStart ?? null;
  const end = normaliseTime(payload.end, { field: 'notifications.quietHours.end', errors }) ??
    settings?.quietHoursEnd ?? null;
  const timezone =
    normaliseTimezone(payload.timezone, { field: 'notifications.quietHours.timezone', errors }) ??
    settings?.quietHoursTimezone ?? null;

  return { enabled, start, end, timezone };
}

async function ensureSettings(userId, transaction) {
  const [settings] = await UserProfileSetting.findOrCreate({
    where: { userId },
    defaults: { userId },
    transaction
  });
  return settings;
}

function mapNotificationPreferences(settings) {
  return mergePreferences(DEFAULT_NOTIFICATION_PREFERENCES, settings.notificationPreferences ?? {});
}

function mapBillingPreferences(settings) {
  return mergePreferences(DEFAULT_BILLING_PREFERENCES, settings.billingPreferences ?? {});
}

function serializeSettings(user, settings) {
  const timezoneFallback = settings.timezone ?? user?.region?.timezone ?? 'Europe/London';
  const notificationPrefs = mapNotificationPreferences(settings);
  const billingPrefs = mapBillingPreferences(settings);
  const invoiceRecipients = Array.isArray(settings.invoiceRecipients)
    ? settings.invoiceRecipients
    : [];
  const quietHours = {
    enabled: Boolean(settings.quietHoursEnabled),
    start: settings.quietHoursStart,
    end: settings.quietHoursEnd,
    timezone: settings.quietHoursTimezone ?? timezoneFallback
  };

  return {
    profile: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      preferredName: settings.preferredName,
      jobTitle: settings.jobTitle,
      phoneNumber: settings.phoneNumber,
      timezone: settings.timezone ?? timezoneFallback,
      language: settings.language ?? 'en-GB',
      avatarUrl: settings.avatarUrl
    },
    notifications: {
      ...notificationPrefs,
      quietHours
    },
    billing: {
      ...billingPrefs,
      invoiceRecipients
    },
    security: {
      twoFactor: {
        app: Boolean(user.twoFactorApp),
        email: Boolean(user.twoFactorEmail),
        enabled: Boolean(user.twoFactorApp || user.twoFactorEmail),
        methods: Array.isArray(settings.securityMethods) ? settings.securityMethods : [],
        lastUpdated: settings.securityUpdatedAt ? settings.securityUpdatedAt.toISOString() : null
      }
    },
    metadata: {
      updatedAt: settings.updatedAt ? settings.updatedAt.toISOString() : null
    }
  };
}

export async function getUserProfileSettings(userId) {
  if (!userId) {
    throw new Error('User id is required to fetch profile settings.');
  }

  const transaction = await sequelize.transaction();
  try {
    const user = await User.findByPk(userId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!user) {
      throw new Error('User not found');
    }

    const settings = await ensureSettings(userId, transaction);
    await transaction.commit();

    return serializeSettings(user, settings);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function updateUserProfileSettings(userId, payload = {}, actorId = null) {
  if (!userId) {
    throw new Error('User id is required to update profile settings.');
  }

  const errors = [];

  const transaction = await sequelize.transaction();
  try {
    const user = await User.findByPk(userId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!user) {
      throw new Error('User not found');
    }

    const settings = await ensureSettings(userId, transaction);

    if (payload.profile) {
      const { profile } = payload;
      if (Object.hasOwn(profile, 'firstName')) {
        const value = normaliseString(profile.firstName);
        if (!value) {
          errors.push({ field: 'profile.firstName', message: 'First name is required.' });
        } else {
          user.firstName = value;
        }
      }
      if (Object.hasOwn(profile, 'lastName')) {
        const value = normaliseString(profile.lastName);
        if (!value) {
          errors.push({ field: 'profile.lastName', message: 'Last name is required.' });
        } else {
          user.lastName = value;
        }
      }
      if (Object.hasOwn(profile, 'email')) {
        const email = normaliseEmail(profile.email, { field: 'profile.email', errors });
        if (email) {
          user.email = email;
        }
      }
      if (Object.hasOwn(profile, 'preferredName')) {
        settings.preferredName = normaliseString(profile.preferredName);
      }
      if (Object.hasOwn(profile, 'jobTitle')) {
        settings.jobTitle = normaliseString(profile.jobTitle);
      }
      if (Object.hasOwn(profile, 'phoneNumber')) {
        settings.phoneNumber = normaliseString(profile.phoneNumber);
      }
      if (Object.hasOwn(profile, 'timezone')) {
        settings.timezone = normaliseTimezone(profile.timezone, {
          field: 'profile.timezone',
          errors
        });
      }
      if (Object.hasOwn(profile, 'language')) {
        settings.language = normaliseLanguage(profile.language, {
          field: 'profile.language',
          errors
        });
      }
      if (Object.hasOwn(profile, 'avatarUrl')) {
        settings.avatarUrl = normaliseUrl(profile.avatarUrl, {
          field: 'profile.avatarUrl',
          errors
        });
      }
    }

    if (payload.notifications) {
      settings.notificationPreferences = sanitiseNotificationPreferences(
        payload.notifications,
        errors,
        settings.notificationPreferences
      );
      const quiet = sanitiseQuietHours(payload.notifications.quietHours, errors, settings);
      settings.quietHoursEnabled = quiet.enabled;
      settings.quietHoursStart = quiet.start;
      settings.quietHoursEnd = quiet.end;
      settings.quietHoursTimezone = quiet.timezone;
    }

    if (payload.billing) {
      settings.billingPreferences = sanitiseBillingPreferences(
        payload.billing,
        errors,
        settings.billingPreferences
      );
      if (Object.hasOwn(payload.billing, 'invoiceRecipients')) {
        settings.invoiceRecipients = sanitiseInvoiceRecipients(payload.billing.invoiceRecipients, errors);
      }
    }

    if (payload.security) {
      const securityPayload = payload.security;
      if (Object.hasOwn(securityPayload, 'twoFactorApp')) {
        user.twoFactorApp = normaliseBoolean(securityPayload.twoFactorApp);
      }
      if (Object.hasOwn(securityPayload, 'twoFactorEmail')) {
        user.twoFactorEmail = normaliseBoolean(securityPayload.twoFactorEmail);
      }
      if (Object.hasOwn(securityPayload, 'methods')) {
        if (Array.isArray(securityPayload.methods)) {
          const methods = securityPayload.methods
            .map((method) => normaliseString(method))
            .filter(Boolean);
          settings.securityMethods = methods;
        } else {
          errors.push({ field: 'security.methods', message: 'Methods must be an array of strings.' });
        }
      }
      settings.securityUpdatedAt = new Date();
    }

    if (errors.length > 0) {
      throw createValidationError('Profile settings validation failed.', errors);
    }

    await user.save({ transaction, validate: false });
    await settings.save({ transaction });

    if (payload.security && actorId) {
      await recordSecurityEvent({
        userId,
        actorRole: 'user',
        actorPersona: 'user',
        resource: 'settings:security',
        action: 'update',
        decision: 'allow',
        ipAddress: null,
        userAgent: null,
        metadata: {
          actorId,
          methods: Array.isArray(settings.securityMethods) ? settings.securityMethods : [],
          twoFactorApp: Boolean(user.twoFactorApp),
          twoFactorEmail: Boolean(user.twoFactorEmail)
        }
      });
    }

    await transaction.commit();

    return serializeSettings(user, settings);
  } catch (error) {
    await transaction.rollback();
    if (error?.name === 'SequelizeUniqueConstraintError' && error?.fields?.email_hash) {
      throw createValidationError('Email already exists.', [
        { field: 'profile.email', message: 'Email address is already registered.' }
      ]);
    }
    if (error.name === 'ValidationError') {
      throw error;
    }
    throw error;
  }
}
