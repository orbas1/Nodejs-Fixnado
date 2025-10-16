import { randomUUID } from 'crypto';
import { DateTime } from 'luxon';
import { sequelize, User, Company, UserPreference, Region } from '../models/index.js';
import { CanonicalRoles, toCanonicalRole } from '../constants/permissions.js';

function validationError(message, details = []) {
  const error = new Error(message);
  error.code = 'PROFILE_VALIDATION_ERROR';
  error.statusCode = 400;
  error.status = 400;
  if (Array.isArray(details) && details.length) {
    error.details = details;
    error.errors = details;
  }
  return error;
}

function notFoundError(message) {
  const error = new Error(message);
  error.statusCode = 404;
  error.status = 404;
  error.code = 'PROFILE_NOT_FOUND';
  return error;
}

function sanitiseString(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

function sanitiseOptionalString(value) {
  const trimmed = sanitiseString(value);
  return trimmed || null;
}

const DIGEST_OPTIONS = new Set(['never', 'daily', 'weekly']);
const CHANNEL_TYPES = new Set(['email', 'sms', 'phone', 'webhook']);

function ensureArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value;
}

function buildWorkspaceShortcuts(raw, limit = 12) {
  const shortcuts = [];
  const seen = new Set();

  ensureArray(raw).forEach((entry) => {
    if (shortcuts.length >= limit) {
      return;
    }
    const value = sanitiseString(entry);
    if (!value) {
      return;
    }
    const normalised = value.toLowerCase();
    if (seen.has(normalised)) {
      return;
    }
    seen.add(normalised);
    shortcuts.push(value);
  });

  return shortcuts;
}

function buildNotificationChannels(raw, limit = 10) {
  const channels = [];

  ensureArray(raw).forEach((entry) => {
    if (channels.length >= limit) {
      return;
    }

    if (!entry || typeof entry !== 'object') {
      return;
    }

    const type = sanitiseString(entry.type).toLowerCase();
    if (!CHANNEL_TYPES.has(type)) {
      return;
    }

    const label = sanitiseOptionalString(entry.label) ?? type;
    const value = sanitiseString(entry.value);
    if (!value) {
      return;
    }

    channels.push({
      id: sanitiseString(entry.id) || randomUUID(),
      type,
      label,
      value
    });
  });

  return channels;
}

const ROLE_ASSIGNMENT_LIMIT = 10;

function buildRoleAssignments(rawAssignments, actorRole) {
  const actor = toCanonicalRole(actorRole) || CanonicalRoles.USER;
  const assignments = [];
  const seenRoles = new Set();

  ensureArray(rawAssignments).forEach((entry) => {
    if (!entry || typeof entry !== 'object' || assignments.length >= ROLE_ASSIGNMENT_LIMIT) {
      return;
    }

    const role = toCanonicalRole(entry.role);
    if (!role) {
      return;
    }

    if (role === CanonicalRoles.ADMIN && actor !== CanonicalRoles.ADMIN) {
      throw validationError('Only administrators can grant admin workspace access.');
    }

    if (role === CanonicalRoles.OPERATIONS && ![CanonicalRoles.ADMIN, CanonicalRoles.OPERATIONS].includes(actor)) {
      throw validationError('Operations workspace access requires an admin or operations actor.');
    }

    if (seenRoles.has(role)) {
      return;
    }

    seenRoles.add(role);

    const dashboards = buildWorkspaceShortcuts(entry.dashboards, 8);
    const notes = sanitiseOptionalString(entry.notes);

    assignments.push({
      id: sanitiseString(entry.id) || randomUUID(),
      role,
      allowCreate: Boolean(entry.allowCreate),
      dashboards,
      notes
    });
  });

  return assignments;
}

function validateTimezone(timezone) {
  if (!timezone) {
    return 'UTC';
  }
  const candidate = sanitiseString(timezone);
  if (!candidate) {
    return 'UTC';
  }
  const resolved = DateTime.now().setZone(candidate);
  if (!resolved.isValid) {
    throw validationError('timezone must be a valid IANA identifier.');
  }
  return candidate;
}

function validateLocale(locale) {
  if (!locale) {
    return 'en-GB';
  }
  const candidate = sanitiseString(locale);
  if (!candidate) {
    return 'en-GB';
  }
  if (!/^([a-z]{2,3})(-[A-Z]{2})?$/.test(candidate)) {
    throw validationError('locale must follow the language-region format (e.g. en-GB).');
  }
  return candidate;
}

function normaliseCommunicationPreferences(preferences = {}) {
  const digest = preferences.digestFrequency ?? preferences.digest ?? 'weekly';
  const digestFrequency = DIGEST_OPTIONS.has(digest) ? digest : 'weekly';

  return {
    emailAlerts: Boolean(preferences.emailAlerts ?? preferences.email),
    smsAlerts: Boolean(preferences.smsAlerts ?? preferences.sms),
    pushAlerts: Boolean(preferences.pushAlerts ?? preferences.push),
    marketingOptIn: Boolean(preferences.marketingOptIn ?? preferences.marketing),
    digestFrequency
  };
}

function mapPreferencesToResponse(preferences) {
  if (!preferences) {
    return {
      timezone: 'UTC',
      locale: 'en-GB',
      organisation: null,
      jobTitle: null,
      teamName: null,
      avatarUrl: null,
      signature: null,
      phone: null,
      communicationPreferences: {
        emailAlerts: true,
        smsAlerts: false,
        pushAlerts: false,
        marketingOptIn: false,
        digestFrequency: 'weekly'
      },
      workspaceShortcuts: [],
      roleAssignments: [],
      notificationChannels: []
    };
  }

  return {
    timezone: preferences.timezone ?? 'UTC',
    locale: preferences.locale ?? 'en-GB',
    organisation: preferences.organisation ?? null,
    jobTitle: preferences.jobTitle ?? null,
    teamName: preferences.teamName ?? null,
    avatarUrl: preferences.avatarUrl ?? null,
    signature: preferences.signature ?? null,
    phone: preferences.primaryPhone ?? null,
    communicationPreferences: {
      emailAlerts: preferences.emailAlerts ?? true,
      smsAlerts: preferences.smsAlerts ?? false,
      pushAlerts: preferences.pushAlerts ?? false,
      marketingOptIn: preferences.marketingOptIn ?? false,
      digestFrequency: preferences.digestFrequency ?? 'weekly'
    },
    workspaceShortcuts: Array.isArray(preferences.workspaceShortcuts) ? preferences.workspaceShortcuts : [],
    roleAssignments: Array.isArray(preferences.roleAssignments) ? preferences.roleAssignments : [],
    notificationChannels: Array.isArray(preferences.notificationChannels) ? preferences.notificationChannels : []
  };
}

function buildProfileResponse(user, preferences) {
  const pref = mapPreferencesToResponse(preferences);

  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    address: user.address ?? null,
    type: user.type,
    organisation: pref.organisation,
    timezone: pref.timezone,
    locale: pref.locale,
    jobTitle: pref.jobTitle,
    teamName: pref.teamName,
    avatarUrl: pref.avatarUrl,
    signature: pref.signature,
    phone: pref.phone,
    communicationPreferences: pref.communicationPreferences,
    workspaceShortcuts: pref.workspaceShortcuts,
    roleAssignments: pref.roleAssignments,
    notificationChannels: pref.notificationChannels,
    security: {
      twoFactorEmail: Boolean(user.twoFactorEmail),
      twoFactorApp: Boolean(user.twoFactorApp)
    },
    company: user.Company ? user.Company.toJSON() : null,
    region: user.region ? user.region.toJSON() : null,
    createdAt: user.createdAt?.toISOString?.() ?? null,
    updatedAt: user.updatedAt?.toISOString?.() ?? null
  };
}

export async function getUserProfile({ userId, transaction } = {}) {
  if (!userId) {
    throw validationError('userId is required to load a profile.');
  }

  const user = await User.findByPk(userId, {
    include: [
      { model: Company },
      { model: UserPreference, as: 'preferences' },
      { model: Region, as: 'region', attributes: ['id', 'name', 'code', 'residencyTier'] }
    ],
    transaction
  });

  if (!user) {
    throw notFoundError('User not found');
  }

  return buildProfileResponse(user, user.preferences ?? null);
}

export async function updateUserProfile({ userId, actorRole, payload } = {}) {
  if (!userId) {
    throw validationError('userId is required to update the profile.');
  }

  if (!payload || typeof payload !== 'object') {
    throw validationError('A payload is required to update the profile.');
  }

  const firstName = sanitiseString(payload.firstName);
  const lastName = sanitiseString(payload.lastName);
  if (!firstName) {
    throw validationError('firstName is required.');
  }
  if (!lastName) {
    throw validationError('lastName is required.');
  }

  const communicationPreferences = normaliseCommunicationPreferences(payload.communicationPreferences);
  const timezone = validateTimezone(payload.timezone ?? payload.timeZone ?? payload.communicationPreferences?.timezone);
  const locale = validateLocale(payload.locale ?? payload.language);
  const phone = sanitiseOptionalString(payload.phone ?? payload.primaryPhone);
  const organisation = sanitiseOptionalString(payload.organisation ?? payload.organisationName);
  const jobTitle = sanitiseOptionalString(payload.jobTitle);
  const teamName = sanitiseOptionalString(payload.teamName);
  const avatarUrl = sanitiseOptionalString(payload.avatarUrl ?? payload.avatar);
  const signature = sanitiseOptionalString(payload.signature);
  const address = sanitiseOptionalString(payload.address);

  if (signature && signature.length > 2000) {
    throw validationError('signature cannot exceed 2000 characters.');
  }

  const workspaceShortcuts = buildWorkspaceShortcuts(payload.workspaceShortcuts ?? payload.workspaces);
  const notificationChannels = buildNotificationChannels(payload.notificationChannels ?? payload.channels);
  const roleAssignments = buildRoleAssignments(payload.roleAssignments ?? payload.roles, actorRole);

  const security = payload.security && typeof payload.security === 'object' ? payload.security : {};
  const twoFactorEmail = Boolean(security.twoFactorEmail ?? security.email);
  const twoFactorApp = Boolean(security.twoFactorApp ?? security.app);

  return sequelize.transaction(async (transaction) => {
    const user = await User.findByPk(userId, {
      include: [{ model: Company }, { model: UserPreference, as: 'preferences' }, { model: Region, as: 'region' }],
      lock: transaction.LOCK.UPDATE,
      transaction
    });

    if (!user) {
      throw notFoundError('User not found');
    }

    await user.update(
      {
        firstName,
        lastName,
        address,
        twoFactorEmail,
        twoFactorApp
      },
      { transaction }
    );

    const [preferences] = await UserPreference.findOrCreate({
      where: { userId },
      defaults: {
        userId,
        timezone,
        locale,
        organisation,
        jobTitle,
        teamName,
        avatarUrl,
        signature,
        digestFrequency: communicationPreferences.digestFrequency,
        emailAlerts: communicationPreferences.emailAlerts,
        smsAlerts: communicationPreferences.smsAlerts,
        pushAlerts: communicationPreferences.pushAlerts,
        marketingOptIn: communicationPreferences.marketingOptIn,
        primaryPhone: phone,
        workspaceShortcuts,
        roleAssignments,
        notificationChannels
      },
      transaction
    });

    await preferences.update(
      {
        timezone,
        locale,
        organisation,
        jobTitle,
        teamName,
        avatarUrl,
        signature,
        digestFrequency: communicationPreferences.digestFrequency,
        emailAlerts: communicationPreferences.emailAlerts,
        smsAlerts: communicationPreferences.smsAlerts,
        pushAlerts: communicationPreferences.pushAlerts,
        marketingOptIn: communicationPreferences.marketingOptIn,
        primaryPhone: phone,
        workspaceShortcuts,
        roleAssignments,
        notificationChannels
      },
      { transaction }
    );

    return buildProfileResponse(user, { ...preferences.toJSON(), primaryPhone: phone });
  });
}

export default {
  getUserProfile,
  updateUserProfile
};
