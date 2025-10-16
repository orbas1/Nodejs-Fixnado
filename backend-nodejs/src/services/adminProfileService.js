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

function trimToNull(value, maxLength = null) {
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
