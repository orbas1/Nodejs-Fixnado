import isEmail from 'validator/lib/isEmail.js';
import { sequelize, User, AdminProfile, AdminDelegate } from '../models/index.js';

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
const DEFAULT_OUT_OF_OFFICE = {
  enabled: false,
  message: '',
  handoverStart: null,
  handoverEnd: null,
  delegateEmail: ''
};
const DEFAULT_NOTIFICATION_SETTINGS = {
  email: true,
  sms: false,
  push: false,
  slack: false,
  pagerDuty: false,
  weeklyDigest: true
};
const ESCALATION_METHODS = ['email', 'sms', 'phone', 'slack', 'pagerduty'];
const ESCALATION_PRIORITIES = ['p0', 'p1', 'p2', 'p3'];

function createValidationError(message, details = []) {
  const error = new Error(message);
  error.name = 'ValidationError';
  error.statusCode = 422;
  error.details = details;
  return error;
}

function trimToNull(value, maxLength) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (maxLength && trimmed.length > maxLength) {
    return trimmed.slice(0, maxLength);
  }
  return trimmed;
}

function trimToEmpty(value, maxLength) {
  return trimToNull(value, maxLength) ?? '';
}

function normaliseBooleanFlags(defaults, overrides = {}) {
  const result = { ...defaults };
  if (!overrides || typeof overrides !== 'object') {
    return result;
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (Object.hasOwn(result, key)) {
      result[key] = Boolean(value);
    }
  }
  return result;
}

function parseSessionTimeout(value) {
  if (value === undefined || value === null || value === '') {
    return DEFAULT_SECURITY.sessionTimeoutMinutes;
  }
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric)) {
    return DEFAULT_SECURITY.sessionTimeoutMinutes;
  }
  return Math.max(5, Math.min(720, numeric));
}

function parseWorkingHours(config) {
  if (!config || typeof config !== 'object') {
    return { ...DEFAULT_WORKING_HOURS };
  }
  const pattern = /^([01]\d|2[0-3]):[0-5]\d$/;
  const start = typeof config.start === 'string' && pattern.test(config.start.trim())
    ? config.start.trim()
    : DEFAULT_WORKING_HOURS.start;
  const end = typeof config.end === 'string' && pattern.test(config.end.trim())
    ? config.end.trim()
    : DEFAULT_WORKING_HOURS.end;
  return { start, end };
}

function toIsoDate(value) {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

function sanitiseOutOfOffice(config = {}, details = []) {
  const merged = { ...DEFAULT_OUT_OF_OFFICE };
  if (!config || typeof config !== 'object') {
    return merged;
  }

  merged.enabled = Boolean(config.enabled);
  merged.message = trimToEmpty(config.message, 1000);
  merged.delegateEmail = trimToEmpty(config.delegateEmail, 254);
  merged.handoverStart = toIsoDate(config.handoverStart);
  merged.handoverEnd = toIsoDate(config.handoverEnd);

  if (!merged.enabled) {
    return { ...DEFAULT_OUT_OF_OFFICE };
  }

  if (!merged.delegateEmail) {
    details.push({ field: 'outOfOffice.delegateEmail', message: 'Delegate email is required when out of office is enabled.' });
  } else if (!isEmail(merged.delegateEmail)) {
    details.push({ field: 'outOfOffice.delegateEmail', message: 'Delegate email must be a valid email address.' });
  }

  if (merged.handoverStart && merged.handoverEnd) {
    const start = Date.parse(merged.handoverStart);
    const end = Date.parse(merged.handoverEnd);
    if (!Number.isNaN(start) && !Number.isNaN(end) && start > end) {
      details.push({ field: 'outOfOffice.handoverEnd', message: 'Handover end must be after the handover start.' });
    }
  }

  return merged;
}

function sanitiseDelegates(entries = []) {
  if (!Array.isArray(entries)) {
    return [];
  }
  const seen = new Set();
  const delegates = [];
  for (const entry of entries) {
    const email = trimToEmpty(entry?.email, 254).toLowerCase();
    if (!email || !isEmail(email)) {
      continue;
    }
    if (seen.has(email)) {
      continue;
    }
    seen.add(email);
    delegates.push({
      name: trimToEmpty(entry?.name, 160),
      email,
      role: trimToEmpty(entry?.role, 160)
    });
  }
  return delegates;
}

function sanitiseEscalationContacts(entries = []) {
  if (!Array.isArray(entries)) {
    return [];
  }
  const seen = new Set();
  const contacts = [];
  for (const entry of entries) {
    const method = trimToEmpty(entry?.method, 32).toLowerCase();
    const destination = trimToEmpty(entry?.destination, 256);
    if (!method || !destination) {
      continue;
    }
    if (!ESCALATION_METHODS.includes(method)) {
      continue;
    }
    const priorityRaw = trimToEmpty(entry?.priority, 8).toLowerCase();
    const priority = ESCALATION_PRIORITIES.includes(priorityRaw) ? priorityRaw : 'p1';
    const key = `${method}:${destination.toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    contacts.push({
      method,
      label: trimToEmpty(entry?.label, 160),
      destination,
      priority
    });
  }
  return contacts;
}

function sanitiseResourceLinks(entries = []) {
  if (!Array.isArray(entries)) {
    return [];
  }
  const seen = new Set();
  const links = [];
  for (const entry of entries) {
    const label = trimToEmpty(entry?.label, 160);
    const url = trimToEmpty(entry?.url, 2000);
    if (!label || !url) {
      continue;
    }
    if (!/^https?:\/\//i.test(url)) {
      continue;
    }
    const key = url.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    links.push({ label, url });
  }
  return links;
}

function sanitiseNotificationEmails(entries = []) {
  if (!Array.isArray(entries)) {
    return [];
  }
  const seen = new Set();
  const emails = [];
  for (const entry of entries) {
    const email = trimToEmpty(entry, 254).toLowerCase();
    if (!email || !isEmail(email)) {
      continue;
    }
    if (seen.has(email)) {
      continue;
    }
    seen.add(email);
    emails.push(email);
  }
  return emails;
}

function sanitisePermissions(entries = []) {
  if (!Array.isArray(entries)) {
    return [];
  }
  const seen = new Set();
  const permissions = [];
  for (const entry of entries) {
    if (typeof entry !== 'string') {
      continue;
    }
    const key = entry.trim();
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    permissions.push(key);
  }
  return permissions;
}

function ensureUserExists(user) {
  if (!user) {
    const error = new Error('Admin user not found');
    error.statusCode = 404;
    throw error;
  }
}

async function fetchUserWithProfile(userId, options = {}) {
  const user = await User.findByPk(userId, {
    include: [{ model: AdminProfile, as: 'adminProfile' }],
    ...options
  });
  ensureUserExists(user);
  return user;
}

function buildProfileResponse(user, profileRecord) {
  const profile = profileRecord ? profileRecord.toJSON() : {};
  const workingHours = parseWorkingHours(profile.workingHours);
  const notifications = normaliseBooleanFlags(DEFAULT_NOTIFICATIONS, profile.notificationPreferences);
  const security = normaliseBooleanFlags(DEFAULT_SECURITY, profile.securityPreferences);
  security.sessionTimeoutMinutes = parseSessionTimeout(profile.securityPreferences?.sessionTimeoutMinutes);

  const outOfOffice = sanitiseOutOfOffice(profile.outOfOffice || {});
  const delegates = sanitiseDelegates(profile.delegates);
  const escalationContacts = sanitiseEscalationContacts(profile.escalationContacts);
  const resourceLinks = sanitiseResourceLinks(profile.resourceLinks);

  return {
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    displayName: trimToEmpty(profile.displayName, 160) || `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
    jobTitle: trimToEmpty(profile.jobTitle, 160),
    department: trimToEmpty(profile.department, 160),
    pronouns: trimToEmpty(profile.pronouns, 80),
    avatarUrl: trimToEmpty(profile.avatarUrl, 2000),
    bio: trimToEmpty(profile.bio, 2000),
    contactEmail: trimToEmpty(profile.contactEmail, 254) || (user.email ?? ''),
    backupEmail: trimToEmpty(profile.backupEmail, 254),
    contactPhone: trimToEmpty(profile.contactPhone, 64),
    location: trimToEmpty(profile.location, 160),
    timezone: trimToEmpty(profile.timezone, 64) || 'Europe/London',
    language: trimToEmpty(profile.language, 32) || 'en-GB',
    theme: trimToEmpty(profile.theme, 16) || 'system',
    workingHours,
    notifications,
    security,
    delegates,
    escalationContacts,
    outOfOffice,
    resourceLinks
  };
}

function validateProfilePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw createValidationError('Invalid admin profile payload.');
  }

  const details = [];
  const firstName = trimToEmpty(payload.firstName, 120);
  const lastName = trimToEmpty(payload.lastName, 120);
  const displayName = trimToEmpty(payload.displayName, 160);
  const contactEmail = trimToEmpty(payload.contactEmail, 254).toLowerCase();

  if (!firstName) {
    details.push({ field: 'firstName', message: 'First name is required.' });
  }
  if (!lastName) {
    details.push({ field: 'lastName', message: 'Last name is required.' });
  }
  if (!displayName) {
    details.push({ field: 'displayName', message: 'Display name is required.' });
  }
  if (!contactEmail) {
    details.push({ field: 'contactEmail', message: 'Contact email is required.' });
  } else if (!isEmail(contactEmail)) {
    details.push({ field: 'contactEmail', message: 'Contact email must be a valid email address.' });
  }

  const backupEmail = trimToEmpty(payload.backupEmail, 254).toLowerCase();
  if (backupEmail && !isEmail(backupEmail)) {
    details.push({ field: 'backupEmail', message: 'Backup email must be a valid email address.' });
  }

  const timezone = trimToEmpty(payload.timezone, 64);
  if (!timezone) {
    details.push({ field: 'timezone', message: 'Timezone is required.' });
  }

  const language = trimToEmpty(payload.language, 32);
  if (!language) {
    details.push({ field: 'language', message: 'Language is required.' });
  }

  const theme = trimToEmpty(payload.theme, 16);
  if (!['system', 'light', 'dark'].includes(theme)) {
    details.push({ field: 'theme', message: 'Theme must be one of system, light, or dark.' });
  }

  const outOfOffice = sanitiseOutOfOffice(payload.outOfOffice, details);
  const workingHours = parseWorkingHours(payload.workingHours);
  const notifications = normaliseBooleanFlags(DEFAULT_NOTIFICATIONS, payload.notifications);
  const security = normaliseBooleanFlags(DEFAULT_SECURITY, payload.security);
  security.sessionTimeoutMinutes = parseSessionTimeout(payload.security?.sessionTimeoutMinutes);
  const delegates = sanitiseDelegates(payload.delegates);
  const escalationContacts = sanitiseEscalationContacts(payload.escalationContacts);
  const resourceLinks = sanitiseResourceLinks(payload.resourceLinks);

  if (details.length > 0) {
    throw createValidationError('Invalid admin profile payload.', details);
  }

  return {
    firstName,
    lastName,
    displayName,
    jobTitle: trimToEmpty(payload.jobTitle, 160),
    department: trimToEmpty(payload.department, 160),
    pronouns: trimToEmpty(payload.pronouns, 80),
    avatarUrl: trimToEmpty(payload.avatarUrl, 2000),
    bio: trimToEmpty(payload.bio, 2000),
    contactEmail,
    backupEmail,
    contactPhone: trimToEmpty(payload.contactPhone, 64),
    location: trimToEmpty(payload.location, 160),
    timezone,
    language,
    theme,
    workingHours,
    notifications,
    security,
    delegates,
    escalationContacts,
    outOfOffice,
    resourceLinks
  };
}

async function ensureAdminProfile({ userId, transaction }) {
  const [profile] = await AdminProfile.findOrCreate({
    where: { userId },
    defaults: {
      displayName: '',
      jobTitle: '',
      department: '',
      pronouns: '',
      avatarUrl: '',
      bio: '',
      contactEmail: '',
      backupEmail: '',
      contactPhone: '',
      location: '',
      timezone: 'UTC',
      language: 'en-GB',
      theme: 'system',
      workingHours: { ...DEFAULT_WORKING_HOURS },
      notificationPreferences: { ...DEFAULT_NOTIFICATION_SETTINGS },
      securityPreferences: { ...DEFAULT_SECURITY },
      delegates: [],
      escalationContacts: [],
      outOfOffice: { ...DEFAULT_OUT_OF_OFFICE },
      resourceLinks: [],
      metadata: {},
      notificationEmails: []
    },
    transaction
  });
  return profile;
}

export async function getAdminProfile(userId) {
  if (!userId) {
    throw new Error('User context required to load admin profile');
  }
  const user = await fetchUserWithProfile(userId);
  return buildProfileResponse(user, user.adminProfile);
}

export async function upsertAdminProfile(userId, payload, actorId = null) {
  if (!userId) {
    throw new Error('User context required to save admin profile');
  }

  const data = validateProfilePayload(payload);

  return sequelize.transaction(async (transaction) => {
    const user = await fetchUserWithProfile(userId, { transaction });
    const profile = user.adminProfile ?? (await ensureAdminProfile({ userId, transaction }));

    await user.update(
      {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.contactEmail
      },
      { transaction }
    );

    await profile.update(
      {
        displayName: data.displayName,
        jobTitle: data.jobTitle,
        department: data.department,
        pronouns: data.pronouns,
        avatarUrl: data.avatarUrl,
        bio: data.bio,
        contactEmail: data.contactEmail,
        backupEmail: data.backupEmail,
        contactPhone: data.contactPhone,
        location: data.location,
        timezone: data.timezone,
        language: data.language,
        theme: data.theme,
        workingHours: data.workingHours,
        notificationPreferences: data.notifications,
        securityPreferences: data.security,
        delegates: data.delegates,
        escalationContacts: data.escalationContacts,
        outOfOffice: data.outOfOffice,
        resourceLinks: data.resourceLinks
      },
      { transaction }
    );

    if (actorId) {
      // Placeholder for future audit logging. Keeping the branch avoids eslint complaints about unused args.
      void actorId;
    }

    return buildProfileResponse(user, profile);
  });
}

function serializeDelegate(delegate) {
  return {
    id: delegate.id,
    name: delegate.name,
    email: delegate.email,
    role: delegate.role,
    permissions: Array.isArray(delegate.permissions) ? delegate.permissions : [],
    status: delegate.status,
    avatarUrl: delegate.avatarUrl ?? '',
    createdAt: delegate.createdAt?.toISOString?.() ?? null,
    updatedAt: delegate.updatedAt?.toISOString?.() ?? null
  };
}

export async function getAdminProfileSettings({ userId }) {
  if (!userId) {
    throw new Error('User context required to load admin profile settings');
  }

  const user = await fetchUserWithProfile(userId);
  const profile = user.adminProfile ?? (await ensureAdminProfile({ userId }));
  const delegates = await AdminDelegate.findAll({
    where: { adminProfileId: profile.id },
    order: [['createdAt', 'ASC']]
  });

  const notifications = normaliseBooleanFlags(DEFAULT_NOTIFICATION_SETTINGS, profile.notificationPreferences);
  const notificationEmails = sanitiseNotificationEmails(profile.notificationEmails);

  return {
    profile: {
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: profile.contactEmail || user.email || '',
      jobTitle: trimToEmpty(profile.jobTitle, 160),
      department: trimToEmpty(profile.department, 160),
      phoneNumber: trimToEmpty(profile.contactPhone, 64),
      avatarUrl: trimToEmpty(profile.avatarUrl, 2000),
      timezone: trimToEmpty(profile.timezone, 64) || 'UTC'
    },
    address: {
      line1: trimToEmpty(profile.addressLine1, 255),
      line2: trimToEmpty(profile.addressLine2, 255),
      city: trimToEmpty(profile.city, 120),
      state: trimToEmpty(profile.state, 120),
      postalCode: trimToEmpty(profile.postalCode, 40),
      country: trimToEmpty(profile.country, 120)
    },
    notifications,
    notificationEmails,
    delegates: delegates.map(serializeDelegate),
    audit: {
      updatedAt: profile.updatedAt?.toISOString?.() ?? null
    }
  };
}

export async function updateAdminProfileSettings({ userId, payload }) {
  if (!payload || typeof payload !== 'object') {
    throw createValidationError('Invalid request payload.');
  }
  const user = await fetchUserWithProfile(userId);
  const profile = user.adminProfile ?? (await ensureAdminProfile({ userId }));

  const details = [];
  const profilePayload = payload.profile ?? {};
  const firstName = trimToEmpty(profilePayload.firstName, 120);
  const lastName = trimToEmpty(profilePayload.lastName, 120);
  if (!firstName) {
    details.push({ field: 'profile.firstName', message: 'First name is required.' });
  }
  if (!lastName) {
    details.push({ field: 'profile.lastName', message: 'Last name is required.' });
  }

  const email = trimToEmpty(profilePayload.email, 254).toLowerCase();
  if (!email || !isEmail(email)) {
    details.push({ field: 'profile.email', message: 'Email must be a valid email address.' });
  }

  const notifications = normaliseBooleanFlags(
    DEFAULT_NOTIFICATION_SETTINGS,
    payload.notifications
  );
  const notificationEmails = sanitiseNotificationEmails(payload.notificationEmails);

  if (details.length > 0) {
    throw createValidationError('Invalid admin profile settings payload.', details);
  }

  await sequelize.transaction(async (transaction) => {
    await user.update(
      {
        firstName,
        lastName,
        email
      },
      { transaction }
    );

    await profile.update(
      {
        jobTitle: trimToEmpty(profilePayload.jobTitle, 160),
        department: trimToEmpty(profilePayload.department, 160),
        contactPhone: trimToEmpty(profilePayload.phoneNumber, 64),
        avatarUrl: trimToEmpty(profilePayload.avatarUrl, 2000),
        timezone: trimToEmpty(profilePayload.timezone, 64) || 'UTC',
        addressLine1: trimToEmpty(payload.address?.line1, 255),
        addressLine2: trimToEmpty(payload.address?.line2, 255),
        city: trimToEmpty(payload.address?.city, 120),
        state: trimToEmpty(payload.address?.state, 120),
        postalCode: trimToEmpty(payload.address?.postalCode, 40),
        country: trimToEmpty(payload.address?.country, 120),
        notificationPreferences: notifications,
        notificationEmails
      },
      { transaction }
    );
  });

  return getAdminProfileSettings({ userId });
}

function validateDelegatePayload(payload, details) {
  const name = trimToEmpty(payload.name, 160);
  const email = trimToEmpty(payload.email, 255).toLowerCase();
  const role = trimToEmpty(payload.role, 160);
  if (!name) {
    details.push({ field: 'name', message: 'Name is required.' });
  }
  if (!email || !isEmail(email)) {
    details.push({ field: 'email', message: 'Email must be a valid email address.' });
  }
  if (!role) {
    details.push({ field: 'role', message: 'Role is required.' });
  }
  return {
    name,
    email,
    role,
    permissions: sanitisePermissions(payload.permissions),
    avatarUrl: trimToEmpty(payload.avatarUrl, 2000),
    status: payload.status === 'suspended' ? 'suspended' : 'active'
  };
}

export async function createAdminDelegate({ userId, payload }) {
  if (!payload || typeof payload !== 'object') {
    throw createValidationError('Invalid delegate payload.');
  }
  const profile = await ensureAdminProfile({ userId });

  const details = [];
  const data = validateDelegatePayload(payload, details);
  if (details.length > 0) {
    throw createValidationError('Invalid delegate payload.', details);
  }

  const delegate = await AdminDelegate.create({
    adminProfileId: profile.id,
    ...data
  });
  return serializeDelegate(delegate);
}

export async function updateAdminDelegate({ userId, delegateId, payload }) {
  if (!payload || typeof payload !== 'object') {
    throw createValidationError('Invalid delegate payload.');
  }
  const profile = await ensureAdminProfile({ userId });
  const delegate = await AdminDelegate.findOne({
    where: { id: delegateId, adminProfileId: profile.id }
  });
  if (!delegate) {
    const error = new Error('Delegate not found');
    error.statusCode = 404;
    throw error;
  }

  const details = [];
  const data = validateDelegatePayload(payload, details);
  if (details.length > 0) {
    throw createValidationError('Invalid delegate payload.', details);
  }

  await delegate.update(data);
  return serializeDelegate(delegate);
}

export async function deleteAdminDelegate({ userId, delegateId }) {
  const profile = await ensureAdminProfile({ userId });
  await AdminDelegate.destroy({ where: { id: delegateId, adminProfileId: profile.id } });
}

