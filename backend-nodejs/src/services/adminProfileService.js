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
