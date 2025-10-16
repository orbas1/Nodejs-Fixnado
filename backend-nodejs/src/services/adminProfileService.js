import { z } from 'zod';
import sequelize from '../config/database.js';
import { AdminProfile, User } from '../models/index.js';

const DEFAULT_WORKING_HOURS = { start: '09:00', end: '17:30' };
const DEFAULT_NOTIFICATIONS = {
  securityAlerts: true,
  incidentEscalations: true,
  weeklyDigest: true,
  productUpdates: false,
  smsAlerts: false
};
const DEFAULT_SECURITY = {
  requireMfa: true,
  loginAlerts: true,
  allowSessionShare: false,
  sessionTimeoutMinutes: 60
};
const DEFAULT_ESCALATION_CONTACTS = [];
const DEFAULT_OUT_OF_OFFICE = {
  enabled: false,
  message: '',
  handoverStart: null,
  handoverEnd: null,
  delegateEmail: ''
};
const DEFAULT_RESOURCE_LINKS = [];
const ESCALATION_METHODS = ['email', 'sms', 'phone', 'slack', 'pagerduty'];
const ESCALATION_PRIORITIES = ['p0', 'p1', 'p2', 'p3'];
import { Op } from 'sequelize';
import { sequelize, User, AdminProfile, AdminDelegate } from '../models/index.js';
import { normaliseEmail } from '../utils/security/fieldEncryption.js';

const DEFAULT_NOTIFICATION_PREFERENCES = {
  email: true,
  sms: false,
  push: false,
  slack: false,
  pagerDuty: false,
  weeklyDigest: true
};

function validationError(message, details = []) {
  const error = new Error(message);
  error.name = 'ValidationError';
  error.statusCode = 422;
  error.details = details;
  return error;
}

function ensureBooleanFlags(defaults, overrides = {}) {
  const result = { ...defaults };
  if (!overrides || typeof overrides !== 'object') {
    return result;
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (Object.hasOwn(result, key)) {
      if (typeof result[key] === 'boolean') {
        result[key] = Boolean(value);
      } else {
        result[key] = value;
      }
    }
  }
  return result;
}

function nullableString(value) {
function trimToNull(value, maxLength = null) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toIsoDateTime(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function isHttpUrl(value) {
  if (typeof value !== 'string') {
    return false;
  }
  return /^https?:\/\//i.test(value.trim());
}

const optionalString = (max) =>
  z
    .union([z.string().trim().max(max), z.literal('')])
    .optional()
    .transform((value) => {
      if (typeof value === 'string') {
        return value.trim();
      }
      return '';
    });

const dateTimeSchema = z
  .union([z.string(), z.null(), z.undefined()])
  .transform((value, ctx) => {
    if (value === null || value === undefined) {
      return null;
    }
    const str = typeof value === 'string' ? value.trim() : String(value);
    if (!str) {
      return null;
    }
    const iso = toIsoDateTime(str);
    if (!iso) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Enter a valid date and time',
        path: ctx.path
      });
      return z.NEVER;
    }
    return iso;
  });

const delegateSchema = z
  .object({
    name: optionalString(120),
    email: z.union([z.string().trim().email().max(254), z.literal('')]),
    role: optionalString(120)
  })
  .transform((value) => ({
    name: value.name || '',
    email: value.email ? value.email.trim() : '',
    role: value.role || ''
  }));

const escalationContactSchema = z
  .object({
    method: z
      .string()
      .trim()
      .transform((value) => value.toLowerCase())
      .refine((value) => ESCALATION_METHODS.includes(value), {
        message: `Method must be one of: ${ESCALATION_METHODS.join(', ')}`
      }),
    label: optionalString(120),
    destination: z.string().trim().min(3).max(256),
    priority: z
      .union([z.string().trim().min(1), z.literal('')])
      .optional()
      .transform((value, ctx) => {
        if (!value) {
          return 'p1';
        }
        const normalised = value.toLowerCase();
        if (!ESCALATION_PRIORITIES.includes(normalised)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Priority must be one of: ${ESCALATION_PRIORITIES.join(', ')}`
          });
          return z.NEVER;
        }
        return normalised;
      })
  })
  .transform((value) => ({
    method: value.method,
    label: value.label || '',
    destination: value.destination.trim(),
    priority: value.priority ?? 'p1'
  }));

const resourceLinkSchema = z
  .object({
    label: z.string().trim().min(1).max(120),
    url: z
      .string()
      .trim()
      .max(2000)
      .refine((value) => isHttpUrl(value), {
        message: 'Resource link must start with http:// or https://'
      })
  })
  .transform((value) => ({
    label: value.label.trim(),
    url: value.url.trim()
  }));

const outOfOfficeSchema = z
  .object({
    enabled: z.boolean().optional(),
    message: optionalString(1000),
    handoverStart: dateTimeSchema.optional(),
    handoverEnd: dateTimeSchema.optional(),
    delegateEmail: z
      .union([z.string().trim().email().max(254), z.literal('')])
      .optional()
      .transform((value) => (typeof value === 'string' ? value.trim() : ''))
  })
  .superRefine((value, ctx) => {
    if (value.handoverStart && value.handoverEnd) {
      const start = Date.parse(value.handoverStart);
      const end = Date.parse(value.handoverEnd);
      if (!Number.isNaN(start) && !Number.isNaN(end) && start > end) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Handover end must be after the start date',
          path: ['handoverEnd']
        });
      }
    }

    if (value.enabled && !value.delegateEmail) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Assign a delegate email when enabling out of office mode',
        path: ['delegateEmail']
      });
    }
  })
  .transform((value) => ({
    enabled: Boolean(value.enabled),
    message: value.message || '',
    handoverStart: value.handoverStart ?? null,
    handoverEnd: value.handoverEnd ?? null,
    delegateEmail: value.delegateEmail || ''
  }));

const notificationsSchema = z
  .object({
    securityAlerts: z.boolean().optional(),
    incidentEscalations: z.boolean().optional(),
    weeklyDigest: z.boolean().optional(),
    productUpdates: z.boolean().optional(),
    smsAlerts: z.boolean().optional()
  })
  .optional()
  .transform((value) => ensureBooleanFlags(DEFAULT_NOTIFICATIONS, value));

const securitySchema = z
  .object({
    requireMfa: z.boolean().optional(),
    loginAlerts: z.boolean().optional(),
    allowSessionShare: z.boolean().optional(),
    sessionTimeoutMinutes: z
      .union([z.number(), z.string().trim()])
      .optional()
      .transform((value) => {
        if (value === undefined || value === null || value === '') {
          return DEFAULT_SECURITY.sessionTimeoutMinutes;
        }
        const numeric = Number.parseInt(value, 10);
        if (!Number.isFinite(numeric)) {
          return DEFAULT_SECURITY.sessionTimeoutMinutes;
        }
        return Math.max(5, Math.min(720, numeric));
      })
  })
  .optional()
  .transform((value) => {
    const merged = ensureBooleanFlags(DEFAULT_SECURITY, value);
    if (value && Object.hasOwn(value, 'sessionTimeoutMinutes')) {
      merged.sessionTimeoutMinutes = value.sessionTimeoutMinutes;
    }
    return merged;
  });

const workingHoursSchema = z
  .object({
    start: z
      .string()
      .trim()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'Start time must be in HH:MM format' }),
    end: z
      .string()
      .trim()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'End time must be in HH:MM format' })
  })
  .optional()
  .transform((value) => ({
    ...(DEFAULT_WORKING_HOURS || {}),
    ...(value ?? {})
  }));

const profileSchema = z.object({
  firstName: z.string().trim().min(1).max(120),
  lastName: z.string().trim().min(1).max(120),
  displayName: z.string().trim().min(1).max(160),
  jobTitle: optionalString(160),
  department: optionalString(120),
  pronouns: optionalString(80),
  avatarUrl: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .refine((value) => !value || /^https?:\/\//.test(value), {
      message: 'Avatar must be an http or https URL'
    })
    .transform((value) => (value ? value.trim() : '')),
  bio: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .transform((value) => (value ? value : '')),
  contactEmail: z.string().trim().email().max(254),
  backupEmail: z
    .union([z.string().trim().email().max(254), z.literal('')])
    .optional()
    .transform((value) => (typeof value === 'string' ? value.trim() : '')),
  contactPhone: optionalString(64),
  location: optionalString(160),
  timezone: z.string().trim().min(2).max(64),
  language: z.string().trim().min(2).max(32),
  theme: z.enum(['system', 'light', 'dark']),
  workingHours: workingHoursSchema,
  notifications: notificationsSchema,
  security: securitySchema,
  delegates: z
    .array(delegateSchema)
    .max(8)
    .optional()
    .transform((value) => (Array.isArray(value) ? value : [])),
  escalationContacts: z
    .array(escalationContactSchema)
    .max(10)
    .optional()
    .transform((value) => (Array.isArray(value) ? value : [])),
  outOfOffice: outOfOfficeSchema.optional().transform((value) => value ?? { ...DEFAULT_OUT_OF_OFFICE }),
  resourceLinks: z
    .array(resourceLinkSchema)
    .max(12)
    .optional()
    .transform((value) => (Array.isArray(value) ? value : []))
});

function buildDefaultProfile(user, profileRecord = null) {
  const profile = profileRecord ? profileRecord.toJSON() : {};
  const workingHours = {
    ...DEFAULT_WORKING_HOURS,
    ...(profile.workingHours ?? {})
  };
  const notifications = ensureBooleanFlags(DEFAULT_NOTIFICATIONS, profile.notificationPreferences);
  const security = ensureBooleanFlags(DEFAULT_SECURITY, profile.securityPreferences);
  const outOfOffice = {
    ...DEFAULT_OUT_OF_OFFICE,
    ...(profile.outOfOffice ?? {})
  };
  if (profile.securityPreferences && Object.hasOwn(profile.securityPreferences, 'sessionTimeoutMinutes')) {
    const timeout = Number.parseInt(profile.securityPreferences.sessionTimeoutMinutes, 10);
    if (Number.isFinite(timeout)) {
      security.sessionTimeoutMinutes = Math.max(5, Math.min(720, timeout));
    }
  }

  if (outOfOffice.handoverStart) {
    outOfOffice.handoverStart = toIsoDateTime(outOfOffice.handoverStart) ?? null;
  }
  if (outOfOffice.handoverEnd) {
    outOfOffice.handoverEnd = toIsoDateTime(outOfOffice.handoverEnd) ?? null;
  }
  outOfOffice.enabled = Boolean(outOfOffice.enabled);
  outOfOffice.message = typeof outOfOffice.message === 'string' ? outOfOffice.message : '';
  outOfOffice.delegateEmail = typeof outOfOffice.delegateEmail === 'string' ? outOfOffice.delegateEmail : '';

  return {
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    displayName: profile.displayName || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
    jobTitle: profile.jobTitle || '',
    department: profile.department || '',
    pronouns: profile.pronouns || '',
    avatarUrl: profile.avatarUrl || '',
    bio: profile.bio || '',
    contactEmail: profile.contactEmail || user.email || '',
    backupEmail: profile.backupEmail || '',
    contactPhone: profile.contactPhone || '',
    location: profile.location || user.address || '',
    timezone: profile.timezone || 'Europe/London',
    language: profile.language || 'en-GB',
    theme: profile.theme || 'system',
    workingHours,
    notifications,
    security,
    delegates: Array.isArray(profile.delegates)
      ? profile.delegates.map((delegate) => ({
          name: typeof delegate?.name === 'string' ? delegate.name : '',
          email: typeof delegate?.email === 'string' ? delegate.email : '',
          role: typeof delegate?.role === 'string' ? delegate.role : ''
        }))
      : [],
    escalationContacts: Array.isArray(profile.escalationContacts)
      ? profile.escalationContacts.map((contact) => ({
          method: ESCALATION_METHODS.includes(contact?.method) ? contact.method : 'email',
          label: typeof contact?.label === 'string' ? contact.label : '',
          destination: typeof contact?.destination === 'string' ? contact.destination : '',
          priority: ESCALATION_PRIORITIES.includes(contact?.priority)
            ? contact.priority
            : 'p1'
        }))
      : [],
    outOfOffice,
    resourceLinks: Array.isArray(profile.resourceLinks)
      ? profile.resourceLinks
          .filter((link) => typeof link?.url === 'string')
          .map((link) => ({
            label: typeof link?.label === 'string' ? link.label : '',
            url: link.url
          }))
      : [],
    updatedAt: profileRecord?.updatedAt ?? null,
    createdAt: profileRecord?.createdAt ?? null
  };
}

function sanitiseDelegates(entries = []) {
  if (!Array.isArray(entries)) {
    return [];
  }
  const seen = new Set();
  return entries
    .map((entry) => ({
      name: entry.name?.trim?.() || '',
      email: entry.email?.trim?.() || '',
      role: entry.role?.trim?.() || ''
    }))
    .filter((entry) => {
      if (!entry.email) {
        return false;
      }
      const key = entry.email.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function sanitiseEscalationContacts(entries = []) {
  if (!Array.isArray(entries)) {
    return [];
  }
  const seen = new Set();
  return entries
    .filter((entry) => entry?.destination && entry?.method)
    .map((entry) => ({
      method: entry.method,
      label: entry.label ?? '',
      destination: entry.destination.trim(),
      priority: entry.priority ?? 'p1'
    }))
    .filter((entry) => {
      const key = `${entry.method}:${entry.destination.toLowerCase()}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function sanitiseResourceLinks(entries = []) {
  if (!Array.isArray(entries)) {
    return [];
  }
  const seen = new Set();
  return entries
    .filter((entry) => entry?.label && entry?.url && isHttpUrl(entry.url))
    .map((entry) => ({
      label: entry.label.trim(),
      url: entry.url.trim()
    }))
    .filter((entry) => {
      const key = entry.url.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

function sanitiseOutOfOffice(config = DEFAULT_OUT_OF_OFFICE) {
  const merged = {
    ...DEFAULT_OUT_OF_OFFICE,
    ...(config ?? {})
  };

  merged.enabled = Boolean(merged.enabled);
  merged.message = typeof merged.message === 'string' ? merged.message.trim() : '';
  merged.delegateEmail = typeof merged.delegateEmail === 'string' ? merged.delegateEmail.trim() : '';
  merged.handoverStart = merged.enabled ? toIsoDateTime(merged.handoverStart) : null;
  merged.handoverEnd = merged.enabled ? toIsoDateTime(merged.handoverEnd) : null;

  if (!merged.enabled) {
    merged.message = '';
    merged.delegateEmail = '';
  }

  if (merged.handoverStart && merged.handoverEnd) {
    const start = Date.parse(merged.handoverStart);
    const end = Date.parse(merged.handoverEnd);
    if (!Number.isNaN(start) && !Number.isNaN(end) && start > end) {
      merged.handoverEnd = merged.handoverStart;
    }
  }

  return merged;
}

export async function getAdminProfile(userId) {
  if (!userId) {
    throw new Error('User context required to load admin profile');
  }

  const user = await User.findByPk(userId, {
    include: [{ model: AdminProfile, as: 'adminProfile' }]
  });

  if (!user) {
    const error = new Error('Admin user not found');
    error.statusCode = 404;
    throw error;
  }

  if (user.type !== 'admin') {
    const error = new Error('Only platform administrators can access this profile');
    error.statusCode = 403;
    throw error;
  }

  return buildDefaultProfile(user, user.adminProfile ?? null);
}

export async function upsertAdminProfile(userId, payload = {}, actorId = null) {
  if (!userId) {
    throw new Error('User context required to update admin profile');
  }

  const parseResult = profileSchema.safeParse(payload);
  if (!parseResult.success) {
    const details = parseResult.error.issues.map((issue) => ({
      path: issue.path.join('.') || 'profile',
      message: issue.message
    }));
    throw validationError('Invalid admin profile update.', details);
  }

  const data = parseResult.data;
  const delegates = sanitiseDelegates(data.delegates);
  const escalationContacts = sanitiseEscalationContacts(data.escalationContacts);
  const resourceLinks = sanitiseResourceLinks(data.resourceLinks);
  const outOfOffice = sanitiseOutOfOffice(data.outOfOffice);

  return sequelize.transaction(async (transaction) => {
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      const error = new Error('Admin user not found');
      error.statusCode = 404;
      throw error;
    }

    if (user.type !== 'admin') {
      const error = new Error('Only platform administrators can update this profile');
      error.statusCode = 403;
      throw error;
    }

    user.firstName = data.firstName;
    user.lastName = data.lastName;
    if (data.contactEmail) {
      user.email = data.contactEmail;
    }
    user.address = data.location || null;
    user.twoFactorEmail = data.security.requireMfa;

    await user.save({ transaction, validate: false });

    const [profile] = await AdminProfile.findOrCreate({
      where: { userId },
      defaults: { userId },
      transaction
    });

    profile.displayName = data.displayName;
    profile.jobTitle = nullableString(data.jobTitle);
    profile.department = nullableString(data.department);
    profile.pronouns = nullableString(data.pronouns);
    profile.avatarUrl = nullableString(data.avatarUrl);
    profile.bio = nullableString(data.bio);
    profile.contactEmail = data.contactEmail;
    profile.backupEmail = nullableString(data.backupEmail);
    profile.contactPhone = nullableString(data.contactPhone);
    profile.location = nullableString(data.location);
    profile.timezone = data.timezone;
    profile.language = data.language;
    profile.theme = data.theme;
    profile.workingHours = data.workingHours ?? DEFAULT_WORKING_HOURS;
    profile.notificationPreferences = ensureBooleanFlags(DEFAULT_NOTIFICATIONS, data.notifications);
    profile.securityPreferences = {
      ...ensureBooleanFlags(DEFAULT_SECURITY, data.security),
      sessionTimeoutMinutes: data.security.sessionTimeoutMinutes
    };
    profile.delegates = delegates;
    profile.escalationContacts = escalationContacts;
    profile.outOfOffice = outOfOffice;
    profile.resourceLinks = resourceLinks;
    profile.metadata = {
      ...(profile.metadata ?? {}),
      lastUpdatedBy: actorId || userId,
      lastUpdatedAt: new Date().toISOString(),
      outOfOfficeEnabled: outOfOffice.enabled
    };

    await profile.save({ transaction });

    return buildDefaultProfile(user, profile);
  });
}

export default {
  getAdminProfile,
  upsertAdminProfile
};
  if (!trimmed) {
    return null;
  }
  if (maxLength && trimmed.length > maxLength) {
    return trimmed.slice(0, maxLength);
  }
  return trimmed;
}

function sanitiseNotifications(update = {}, current = DEFAULT_NOTIFICATION_PREFERENCES) {
  const next = { ...DEFAULT_NOTIFICATION_PREFERENCES, ...current };
  for (const key of Object.keys(DEFAULT_NOTIFICATION_PREFERENCES)) {
    if (Object.hasOwn(update, key)) {
      next[key] = Boolean(update[key]);
    }
  }
  return next;
}

function uniqueStrings(values = [], maxEntries = 20) {
  const seen = new Set();
  const output = [];
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(trimmed);
    if (output.length >= maxEntries) {
      break;
    }
  }
  return output;
}

function isValidEmail(value) {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

function sanitiseNotificationEmails(values = []) {
  const emails = uniqueStrings(values);
  for (const email of emails) {
    if (!isValidEmail(email)) {
      throw validationError('One or more notification emails are invalid.', [
        { field: 'notificationEmails', message: `${email} is not a valid email address.` }
      ]);
    }
  }
  return emails;
}

function sanitisePermissions(permissions) {
  if (!Array.isArray(permissions)) {
    return [];
  }
  return uniqueStrings(permissions);
}

async function ensureAdminProfile({ userId, transaction } = {}) {
  const [profile] = await AdminProfile.findOrCreate({
    where: { userId },
    defaults: {
      notificationPreferences: { ...DEFAULT_NOTIFICATION_PREFERENCES },
      notificationEmails: [],
      timezone: 'UTC'
    },
    transaction
  });
  return profile;
}

function serializeDelegate(delegate) {
  return {
    id: delegate.id,
    name: delegate.name,
    email: delegate.email,
    role: delegate.role,
    permissions: Array.isArray(delegate.permissions) ? delegate.permissions : [],
    status: delegate.status,
    avatarUrl: delegate.avatarUrl || '',
    createdAt: delegate.createdAt?.toISOString?.() ?? null,
    updatedAt: delegate.updatedAt?.toISOString?.() ?? null
  };
}

function normalizeNotificationPreferences(preferences) {
  return sanitiseNotifications(preferences);
}

function serializeProfile(profile, user, delegates = []) {
  const preferences = normalizeNotificationPreferences(profile.notificationPreferences);
  const notificationEmails = Array.isArray(profile.notificationEmails)
    ? profile.notificationEmails.map((email) => email.trim()).filter(Boolean)
    : [];

  return {
    profile: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      jobTitle: profile.jobTitle || '',
      department: profile.department || '',
      phoneNumber: profile.phoneNumber || '',
      avatarUrl: profile.avatarUrl || '',
      timezone: profile.timezone || 'UTC'
    },
    address: {
      line1: profile.addressLine1 || '',
      line2: profile.addressLine2 || '',
      city: profile.city || '',
      state: profile.state || '',
      postalCode: profile.postalCode || '',
      country: profile.country || ''
    },
    notifications: preferences,
    notificationEmails,
    delegates: delegates.map(serializeDelegate),
    audit: {
      updatedAt: profile.updatedAt?.toISOString?.() ?? null
    }
  };
}

export async function getAdminProfileSettings({ userId }) {
  const [user, profile] = await Promise.all([
    User.findByPk(userId),
    ensureAdminProfile({ userId })
  ]);

  if (!user) {
    throw Object.assign(new Error('Admin user not found'), { statusCode: 404 });
  }

  const delegates = await AdminDelegate.findAll({
    where: { adminProfileId: profile.id },
    order: [['createdAt', 'ASC']]
  });

  return serializeProfile(profile, user, delegates);
}

export async function updateAdminProfileSettings({ userId, payload }) {
  if (!payload || typeof payload !== 'object') {
    throw validationError('Invalid request payload.');
  }

  const profilePayload = payload.profile ?? {};
  const addressPayload = payload.address ?? {};
  const notificationsPayload = payload.notifications ?? {};
  const notificationEmailsPayload = payload.notificationEmails ?? [];

  const firstName = trimToNull(profilePayload.firstName, 120);
  const lastName = trimToNull(profilePayload.lastName, 120);

  if (!firstName || !lastName) {
    throw validationError('First name and last name are required.', [
      { field: 'profile.firstName', message: 'First name is required.' },
      { field: 'profile.lastName', message: 'Last name is required.' }
    ]);
  }

  const phoneNumber = trimToNull(profilePayload.phoneNumber, 80);
  const jobTitle = trimToNull(profilePayload.jobTitle, 120);
  const department = trimToNull(profilePayload.department, 120);
  const timezone = trimToNull(profilePayload.timezone, 80) || 'UTC';
  const avatarUrl = trimToNull(profilePayload.avatarUrl, 2048);

  const notificationEmails = sanitiseNotificationEmails(notificationEmailsPayload);
  const notificationPreferences = sanitiseNotifications(notificationsPayload);

  const address = {
    addressLine1: trimToNull(addressPayload.line1, 255),
    addressLine2: trimToNull(addressPayload.line2, 255),
    city: trimToNull(addressPayload.city, 120),
    state: trimToNull(addressPayload.state, 120),
    postalCode: trimToNull(addressPayload.postalCode, 40),
    country: trimToNull(addressPayload.country, 120)
  };

  return sequelize.transaction(async (transaction) => {
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      throw Object.assign(new Error('Admin user not found'), { statusCode: 404 });
    }

    const profile = await ensureAdminProfile({ userId, transaction });

    user.set({ firstName, lastName });
    await user.save({ transaction });

    await profile.update(
      {
        jobTitle,
        department,
        phoneNumber,
        avatarUrl,
        timezone,
        notificationPreferences,
        notificationEmails,
        ...address
      },
      { transaction }
    );

    const [updatedProfile, delegates] = await Promise.all([
      profile.reload({ transaction }),
      AdminDelegate.findAll({
        where: { adminProfileId: profile.id },
        order: [['createdAt', 'ASC']],
        transaction
      })
    ]);

    await user.reload({ transaction });

    return serializeProfile(updatedProfile, user, delegates);
  });
}

export async function createAdminDelegate({ userId, payload }) {
  if (!payload || typeof payload !== 'object') {
    throw validationError('Invalid request payload.');
  }

  const name = trimToNull(payload.name, 160);
  const email = trimToNull(payload.email, 255);
  const role = trimToNull(payload.role, 120);
  const permissions = sanitisePermissions(payload.permissions);
  const avatarUrl = trimToNull(payload.avatarUrl, 2048);
  const status = payload.status && ['active', 'suspended'].includes(payload.status)
    ? payload.status
    : 'active';

  if (!name || !email || !role) {
    throw validationError('Delegate name, email, and role are required.', [
      { field: 'name', message: 'Name is required.' },
      { field: 'email', message: 'Email is required.' },
      { field: 'role', message: 'Role is required.' }
    ]);
  }

  if (!isValidEmail(email)) {
    throw validationError('Delegate email must be valid.', [
      { field: 'email', message: 'Enter a valid email address.' }
    ]);
  }

  const normalisedEmail = normaliseEmail(email);

  return sequelize.transaction(async (transaction) => {
    const profile = await ensureAdminProfile({ userId, transaction });

    const existing = await AdminDelegate.findOne({
      where: {
        adminProfileId: profile.id,
        email: { [Op.eq]: normalisedEmail }
      },
      transaction
    });

    if (existing) {
      throw validationError('A delegate with this email already exists for your workspace.', [
        { field: 'email', message: 'Delegate already added.' }
      ]);
    }

    const delegate = await AdminDelegate.create(
      {
        adminProfileId: profile.id,
        name,
        email: normalisedEmail,
        role,
        permissions,
        avatarUrl,
        status
      },
      { transaction }
    );

    return serializeDelegate(await delegate.reload({ transaction }));
  });
}

export async function updateAdminDelegate({ userId, delegateId, payload }) {
  if (!payload || typeof payload !== 'object') {
    throw validationError('Invalid request payload.');
  }

  return sequelize.transaction(async (transaction) => {
    const profile = await ensureAdminProfile({ userId, transaction });

    const delegate = await AdminDelegate.findOne({
      where: { id: delegateId, adminProfileId: profile.id },
      transaction
    });

    if (!delegate) {
      throw Object.assign(new Error('Delegate not found'), { statusCode: 404 });
    }

    const updates = {};

    if (Object.hasOwn(payload, 'name')) {
      const name = trimToNull(payload.name, 160);
      if (!name) {
        throw validationError('Delegate name cannot be empty.', [
          { field: 'name', message: 'Name is required.' }
        ]);
      }
      updates.name = name;
    }

    if (Object.hasOwn(payload, 'email')) {
      const email = trimToNull(payload.email, 255);
      if (!email || !isValidEmail(email)) {
        throw validationError('Delegate email must be valid.', [
          { field: 'email', message: 'Enter a valid email address.' }
        ]);
      }
      const normalisedEmail = normaliseEmail(email);
      const clash = await AdminDelegate.findOne({
        where: {
          adminProfileId: profile.id,
          id: { [Op.ne]: delegate.id },
          email: { [Op.eq]: normalisedEmail }
        },
        transaction
      });
      if (clash) {
        throw validationError('Another delegate already uses this email.', [
          { field: 'email', message: 'Email already in use.' }
        ]);
      }
      updates.email = normalisedEmail;
    }

    if (Object.hasOwn(payload, 'role')) {
      const role = trimToNull(payload.role, 120);
      if (!role) {
        throw validationError('Delegate role cannot be empty.', [
          { field: 'role', message: 'Role is required.' }
        ]);
      }
      updates.role = role;
    }

    if (Object.hasOwn(payload, 'permissions')) {
      updates.permissions = sanitisePermissions(payload.permissions);
    }

    if (Object.hasOwn(payload, 'avatarUrl')) {
      updates.avatarUrl = trimToNull(payload.avatarUrl, 2048);
    }

    if (Object.hasOwn(payload, 'status')) {
      const status = payload.status;
      if (!['active', 'suspended'].includes(status)) {
        throw validationError('Invalid delegate status.', [
          { field: 'status', message: 'Status must be active or suspended.' }
        ]);
      }
      updates.status = status;
    }

    await delegate.update(updates, { transaction });

    return serializeDelegate(await delegate.reload({ transaction }));
  });
}

export async function deleteAdminDelegate({ userId, delegateId }) {
  return sequelize.transaction(async (transaction) => {
    const profile = await ensureAdminProfile({ userId, transaction });

    const delegate = await AdminDelegate.findOne({
      where: { id: delegateId, adminProfileId: profile.id },
      transaction
    });

    if (!delegate) {
      throw Object.assign(new Error('Delegate not found'), { statusCode: 404 });
    }

    await delegate.destroy({ transaction });
  });
}
