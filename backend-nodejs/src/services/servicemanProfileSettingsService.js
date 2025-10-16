import crypto from 'node:crypto';
import validator from 'validator';
import { ServicemanProfileSetting, User, sequelize } from '../models/index.js';

const SUPPORTED_LANGUAGES = ['en-GB', 'en-US', 'es-ES', 'fr-FR', 'de-DE'];
const DEFAULT_TIMEZONE = 'Europe/London';

const SUPPORTED_TIMEZONES = (() => {
  if (typeof Intl?.supportedValuesOf === 'function') {
    try {
      const values = Intl.supportedValuesOf('timeZone');
      if (Array.isArray(values) && values.length > 0) {
        return values;
      }
    } catch (error) {
      console.warn('[servicemanProfile] Failed to enumerate timezones, using fallback', error);
    }
  }
  return [DEFAULT_TIMEZONE, 'UTC'];
})();

const DEFAULT_AVAILABILITY = Object.freeze({
  monday: { available: true, start: '08:00', end: '17:00' },
  tuesday: { available: true, start: '08:00', end: '17:00' },
  wednesday: { available: true, start: '08:00', end: '17:00' },
  thursday: { available: true, start: '08:00', end: '17:00' },
  friday: { available: true, start: '08:00', end: '17:00' },
  saturday: { available: false, start: null, end: null },
  sunday: { available: false, start: null, end: null }
});

function generateId() {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return crypto.randomBytes(12).toString('hex');
}

function createValidationError(message, details = []) {
  const error = new Error(message);
  error.name = 'ValidationError';
  error.statusCode = 422;
  error.details = details;
  return error;
}

function ensureArray(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (value === undefined || value === null) {
    return [];
  }
  return [value];
}

function normaliseString(value, { field, min = 1, max = 255, required = true, errors } = {}) {
  if (value === undefined || value === null) {
    if (required) {
      errors.push({ field, message: 'This field is required.' });
    }
    return null;
  }

  if (typeof value !== 'string') {
    errors.push({ field, message: 'Value must be a string.' });
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed && required) {
    errors.push({ field, message: 'This field cannot be empty.' });
    return null;
  }

  if (trimmed && trimmed.length < min) {
    errors.push({ field, message: `Must be at least ${min} characters.` });
    return null;
  }

  if (trimmed && trimmed.length > max) {
    errors.push({ field, message: `Must be ${max} characters or fewer.` });
    return null;
  }

  return trimmed || null;
}

function normaliseOptionalString(value, options) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  return normaliseString(value, { ...options, required: false });
}

function normaliseEmail(value, { field, errors }) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value !== 'string' || !validator.isEmail(value.trim())) {
    errors.push({ field, message: 'Enter a valid email address.' });
    return null;
  }
  return value.trim().toLowerCase();
}

function normalisePhone(value, { field, errors }) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    errors.push({ field, message: 'Enter a valid phone number.' });
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length < 7 || trimmed.length > 32) {
    errors.push({ field, message: 'Phone numbers must be between 7 and 32 characters.' });
    return null;
  }
  return trimmed;
}

function normaliseTimezone(value, { field, errors }) {
  if (value === undefined || value === null || value === '') {
    return DEFAULT_TIMEZONE;
  }
  if (typeof value !== 'string') {
    errors.push({ field, message: 'Choose a valid timezone.' });
    return DEFAULT_TIMEZONE;
  }
  const trimmed = value.trim();
  if (!SUPPORTED_TIMEZONES.includes(trimmed)) {
    errors.push({ field, message: 'Timezone is not supported.' });
    return DEFAULT_TIMEZONE;
  }
  return trimmed;
}

function normaliseLanguage(value, { field, errors }) {
  if (value === undefined || value === null || value === '') {
    return SUPPORTED_LANGUAGES[0];
  }
  if (typeof value !== 'string') {
    errors.push({ field, message: 'Choose a valid language.' });
    return SUPPORTED_LANGUAGES[0];
  }
  const trimmed = value.trim();
  if (!SUPPORTED_LANGUAGES.includes(trimmed)) {
    errors.push({ field, message: 'Language is not supported.' });
    return SUPPORTED_LANGUAGES[0];
  }
  return trimmed;
}

function normaliseBoolean(value) {
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
  if (typeof value === 'number') {
    return value === 1;
  }
  return false;
}

function normaliseInteger(value, { field, min = 0, max = 99, errors }) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    errors.push({ field, message: 'Enter a valid number.' });
    return null;
  }
  if (parsed < min) {
    errors.push({ field, message: `Value must be at least ${min}.` });
    return null;
  }
  if (parsed > max) {
    errors.push({ field, message: `Value must be ${max} or less.` });
    return null;
  }
  return parsed;
}

function normaliseTime(value, { field, errors }) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    errors.push({ field, message: 'Enter time as HH:MM.' });
    return null;
  }
  const trimmed = value.trim();
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed)) {
    errors.push({ field, message: 'Enter time as HH:MM.' });
    return null;
  }
  return trimmed;
}

function normaliseDate(value, { field, errors }) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    errors.push({ field, message: 'Enter a valid date.' });
    return null;
  }
  const trimmed = value.trim();
  if (!validator.isISO8601(trimmed, { strict: true })) {
    errors.push({ field, message: 'Dates must be ISO-8601 formatted (YYYY-MM-DD).' });
    return null;
  }
  return trimmed;
}

function normaliseUrl(value, { field, errors }) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    errors.push({ field, message: 'Enter a valid URL.' });
    return null;
  }
  const trimmed = value.trim();
  if (!validator.isURL(trimmed, { require_protocol: true })) {
    errors.push({ field, message: 'URLs must include the protocol (https://).' });
    return null;
  }
  return trimmed;
}

function sanitiseSpecialties(input, errors, fieldPrefix = 'skills.specialties') {
  const values = ensureArray(input).map((entry, index) =>
    normaliseString(entry, {
      field: `${fieldPrefix}[${index}]`,
      min: 2,
      max: 120,
      errors
    })
  );
  const filtered = values.filter(Boolean);
  return Array.from(new Set(filtered));
}

function sanitiseCertifications(input, errors, fieldPrefix = 'skills.certifications') {
  const records = ensureArray(input);
  return records
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') {
        errors.push({ field: `${fieldPrefix}[${index}]`, message: 'Certification must be an object.' });
        return null;
      }
      const id = normaliseOptionalString(entry.id, {
        field: `${fieldPrefix}[${index}].id`,
        min: 4,
        max: 64,
        errors
      }) || generateId();
      const name = normaliseString(entry.name, {
        field: `${fieldPrefix}[${index}].name`,
        min: 2,
        max: 120,
        errors
      });
      const issuer = normaliseOptionalString(entry.issuer, {
        field: `${fieldPrefix}[${index}].issuer`,
        min: 2,
        max: 120,
        errors
      });
      const issuedOn = normaliseDate(entry.issuedOn, {
        field: `${fieldPrefix}[${index}].issuedOn`,
        errors
      });
      const expiresOn = normaliseDate(entry.expiresOn, {
        field: `${fieldPrefix}[${index}].expiresOn`,
        errors
      });
      const credentialUrl = normaliseUrl(entry.credentialUrl, {
        field: `${fieldPrefix}[${index}].credentialUrl`,
        errors
      });
      if (!name) {
        return null;
      }
      return {
        id,
        name,
        issuer,
        issuedOn,
        expiresOn,
        credentialUrl
      };
    })
    .filter(Boolean);
}

function sanitiseEmergencyContacts(input, errors, fieldPrefix = 'contact.emergencyContacts') {
  return ensureArray(input)
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') {
        errors.push({ field: `${fieldPrefix}[${index}]`, message: 'Contact must be an object.' });
        return null;
      }
      const id = normaliseOptionalString(entry.id, {
        field: `${fieldPrefix}[${index}].id`,
        min: 4,
        max: 64,
        errors
      }) || generateId();
      const name = normaliseString(entry.name, {
        field: `${fieldPrefix}[${index}].name`,
        min: 2,
        max: 120,
        errors
      });
      const relationship = normaliseOptionalString(entry.relationship, {
        field: `${fieldPrefix}[${index}].relationship`,
        min: 2,
        max: 120,
        errors
      });
      const phoneNumber = normalisePhone(entry.phoneNumber, {
        field: `${fieldPrefix}[${index}].phoneNumber`,
        errors
      });
      const email = normaliseEmail(entry.email, {
        field: `${fieldPrefix}[${index}].email`,
        errors
      });
      if (!name) {
        return null;
      }
      return {
        id,
        name,
        relationship,
        phoneNumber,
        email
      };
    })
    .filter(Boolean);
}

function sanitiseEquipment(input, errors, fieldPrefix = 'equipment.items') {
  return ensureArray(input)
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') {
        errors.push({ field: `${fieldPrefix}[${index}]`, message: 'Equipment must be an object.' });
        return null;
      }
      const id = normaliseOptionalString(entry.id, {
        field: `${fieldPrefix}[${index}].id`,
        min: 4,
        max: 64,
        errors
      }) || generateId();
      const name = normaliseString(entry.name, {
        field: `${fieldPrefix}[${index}].name`,
        min: 2,
        max: 120,
        errors
      });
      const status = normaliseOptionalString(entry.status, {
        field: `${fieldPrefix}[${index}].status`,
        min: 2,
        max: 60,
        errors
      });
      const serialNumber = normaliseOptionalString(entry.serialNumber, {
        field: `${fieldPrefix}[${index}].serialNumber`,
        min: 2,
        max: 120,
        errors
      });
      const assignedOn = normaliseDate(entry.assignedOn, {
        field: `${fieldPrefix}[${index}].assignedOn`,
        errors
      });
      const notes = normaliseOptionalString(entry.notes, {
        field: `${fieldPrefix}[${index}].notes`,
        min: 2,
        max: 240,
        errors
      });
      if (!name) {
        return null;
      }
      return {
        id,
        name,
        status,
        serialNumber,
        assignedOn,
        notes
      };
    })
    .filter(Boolean);
}

function sanitiseDocuments(input, errors, fieldPrefix = 'documents.items') {
  return ensureArray(input)
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') {
        errors.push({ field: `${fieldPrefix}[${index}]`, message: 'Document must be an object.' });
        return null;
      }
      const id = normaliseOptionalString(entry.id, {
        field: `${fieldPrefix}[${index}].id`,
        min: 4,
        max: 64,
        errors
      }) || generateId();
      const name = normaliseString(entry.name ?? entry.title, {
        field: `${fieldPrefix}[${index}].name`,
        min: 2,
        max: 160,
        errors
      });
      const type = normaliseOptionalString(entry.type, {
        field: `${fieldPrefix}[${index}].type`,
        min: 2,
        max: 120,
        errors
      });
      const url = normaliseUrl(entry.url, {
        field: `${fieldPrefix}[${index}].url`,
        errors
      });
      const expiresOn = normaliseDate(entry.expiresOn, {
        field: `${fieldPrefix}[${index}].expiresOn`,
        errors
      });
      const notes = normaliseOptionalString(entry.notes ?? entry.description, {
        field: `${fieldPrefix}[${index}].notes`,
        min: 2,
        max: 240,
        errors
      });
      if (!name) {
        return null;
      }
      return {
        id,
        name,
        type,
        url,
        expiresOn,
        notes
      };
    })
    .filter(Boolean);
}

function sanitiseAvailability(input, errors) {
  if (!input || typeof input !== 'object') {
    return { ...DEFAULT_AVAILABILITY };
  }
  const schedule = {};
  const entries = Object.entries(DEFAULT_AVAILABILITY);
  for (const [day] of entries) {
    const value = input[day];
    if (!value || typeof value !== 'object') {
      schedule[day] = { ...DEFAULT_AVAILABILITY[day] };
      continue;
    }
    const available = normaliseBoolean(value.available);
    const start = available
      ? normaliseTime(value.start, { field: `availability.${day}.start`, errors }) || DEFAULT_AVAILABILITY[day].start
      : null;
    const end = available
      ? normaliseTime(value.end, { field: `availability.${day}.end`, errors }) || DEFAULT_AVAILABILITY[day].end
      : null;
    schedule[day] = {
      available,
      start,
      end
    };
  }
  return schedule;
}

function ensureSettings(userId, transaction) {
  return ServicemanProfileSetting.findOrCreate({
    where: { userId },
    defaults: {
      availabilityTemplate: { ...DEFAULT_AVAILABILITY },
      specialties: [],
      certifications: [],
      equipment: [],
      emergencyContacts: [],
      documents: [],
      metadata: {}
    },
    transaction
  }).then(([settings]) => settings);
}

function serialiseSettings(user, settings) {
  const metadata = typeof settings.metadata === 'object' && settings.metadata !== null ? settings.metadata : {};
  return {
    profile: {
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      preferredName: metadata.preferredName ?? '',
      title: settings.title ?? '',
      badgeId: settings.badgeId ?? '',
      region: settings.region ?? '',
      summary: settings.summary ?? '',
      bio: settings.bio ?? '',
      avatarUrl: settings.avatarUrl ?? '',
      email: user.email ?? '',
      timezone: settings.timezone ?? DEFAULT_TIMEZONE,
      language: settings.language ?? SUPPORTED_LANGUAGES[0]
    },
    contact: {
      phoneNumber: settings.phoneNumber ?? '',
      email: user.email ?? '',
      emergencyContacts: Array.isArray(settings.emergencyContacts) ? settings.emergencyContacts : []
    },
    workPreferences: {
      preferredShiftStart: settings.preferredShiftStart ?? DEFAULT_AVAILABILITY.monday.start,
      preferredShiftEnd: settings.preferredShiftEnd ?? DEFAULT_AVAILABILITY.monday.end,
      maxJobsPerDay: settings.maxJobsPerDay ?? 5,
      travelRadiusKm: settings.travelRadiusKm ?? 25,
      crewLeadEligible: Boolean(settings.crewLeadEligible),
      mentorEligible: Boolean(settings.mentorEligible),
      remoteSupport: Boolean(settings.remoteSupport)
    },
    skills: {
      specialties: Array.isArray(settings.specialties) ? settings.specialties : [],
      certifications: Array.isArray(settings.certifications) ? settings.certifications : []
    },
    availability: {
      template: settings.availabilityTemplate && Object.keys(settings.availabilityTemplate).length
        ? settings.availabilityTemplate
        : { ...DEFAULT_AVAILABILITY }
    },
    equipment: Array.isArray(settings.equipment) ? settings.equipment : [],
    documents: Array.isArray(settings.documents) ? settings.documents : [],
    metadata: {
      lastUpdatedAt: metadata.lastUpdatedAt ?? null,
      lastUpdatedBy: metadata.lastUpdatedBy ?? null
    }
  };
}

export async function getServicemanProfileSettings(userId) {
  if (!userId) {
    const error = new Error('user_required');
    error.statusCode = 400;
    throw error;
  }

  const transaction = await sequelize.transaction();
  try {
    const user = await User.findByPk(userId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!user) {
      const error = new Error('user_not_found');
      error.statusCode = 404;
      throw error;
    }
    const settings = await ensureSettings(userId, transaction);
    await transaction.commit();
    return serialiseSettings(user, settings);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function updateServicemanProfileSettings(userId, payload = {}, actorId = null) {
  if (!userId) {
    const error = new Error('user_required');
    error.statusCode = 400;
    throw error;
  }

  const errors = [];
  const transaction = await sequelize.transaction();
  try {
    const user = await User.findByPk(userId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!user) {
      const error = new Error('user_not_found');
      error.statusCode = 404;
      throw error;
    }

    const settings = await ensureSettings(userId, transaction);
    const metadata = typeof settings.metadata === 'object' && settings.metadata !== null ? { ...settings.metadata } : {};

    if (payload.profile) {
      const { profile } = payload;
      const firstName = normaliseString(profile.firstName ?? user.firstName, {
        field: 'profile.firstName',
        min: 2,
        max: 120,
        errors
      });
      const lastName = normaliseString(profile.lastName ?? user.lastName, {
        field: 'profile.lastName',
        min: 2,
        max: 120,
        errors
      });
      const email = normaliseEmail(profile.email ?? user.email, {
        field: 'profile.email',
        errors
      });
      if (firstName) {
        user.firstName = firstName;
      }
      if (lastName) {
        user.lastName = lastName;
      }
      if (email) {
        user.email = email;
      }
      metadata.preferredName = normaliseOptionalString(profile.preferredName ?? metadata.preferredName, {
        field: 'profile.preferredName',
        min: 2,
        max: 120,
        errors
      }) ?? metadata.preferredName ?? '';
      settings.title = normaliseOptionalString(profile.title ?? settings.title, {
        field: 'profile.title',
        min: 2,
        max: 160,
        errors
      });
      settings.badgeId = normaliseOptionalString(profile.badgeId ?? settings.badgeId, {
        field: 'profile.badgeId',
        min: 2,
        max: 64,
        errors
      });
      settings.region = normaliseOptionalString(profile.region ?? settings.region, {
        field: 'profile.region',
        min: 2,
        max: 160,
        errors
      });
      settings.summary = normaliseOptionalString(profile.summary ?? settings.summary, {
        field: 'profile.summary',
        min: 2,
        max: 240,
        errors
      });
      settings.bio = normaliseOptionalString(profile.bio ?? settings.bio, {
        field: 'profile.bio',
        min: 2,
        max: 1024,
        errors
      });
      settings.avatarUrl = normaliseUrl(profile.avatarUrl ?? settings.avatarUrl, {
        field: 'profile.avatarUrl',
        errors
      });
      settings.timezone = normaliseTimezone(profile.timezone ?? settings.timezone, {
        field: 'profile.timezone',
        errors
      });
      settings.language = normaliseLanguage(profile.language ?? settings.language, {
        field: 'profile.language',
        errors
      });
    }

    if (payload.contact) {
      const { contact } = payload;
      settings.phoneNumber = normalisePhone(contact.phoneNumber ?? settings.phoneNumber, {
        field: 'contact.phoneNumber',
        errors
      });
      const updatedEmail = normaliseEmail(contact.email ?? user.email, {
        field: 'contact.email',
        errors
      });
      if (updatedEmail) {
        user.email = updatedEmail;
      }
      settings.emergencyContacts = sanitiseEmergencyContacts(contact.emergencyContacts, errors);
    }

    if (payload.work) {
      const { work } = payload;
      settings.preferredShiftStart = normaliseTime(work.preferredShiftStart ?? settings.preferredShiftStart, {
        field: 'work.preferredShiftStart',
        errors
      }) ?? settings.preferredShiftStart;
      settings.preferredShiftEnd = normaliseTime(work.preferredShiftEnd ?? settings.preferredShiftEnd, {
        field: 'work.preferredShiftEnd',
        errors
      }) ?? settings.preferredShiftEnd;
      settings.maxJobsPerDay = normaliseInteger(work.maxJobsPerDay ?? settings.maxJobsPerDay, {
        field: 'work.maxJobsPerDay',
        min: 1,
        max: 20,
        errors
      }) ?? settings.maxJobsPerDay ?? 5;
      settings.travelRadiusKm = normaliseInteger(work.travelRadiusKm ?? settings.travelRadiusKm, {
        field: 'work.travelRadiusKm',
        min: 5,
        max: 250,
        errors
      }) ?? settings.travelRadiusKm ?? 25;
      settings.crewLeadEligible = normaliseBoolean(work.crewLeadEligible ?? settings.crewLeadEligible);
      settings.mentorEligible = normaliseBoolean(work.mentorEligible ?? settings.mentorEligible);
      settings.remoteSupport = normaliseBoolean(work.remoteSupport ?? settings.remoteSupport);
    }

    if (payload.skills) {
      const { skills } = payload;
      settings.specialties = sanitiseSpecialties(skills.specialties ?? settings.specialties, errors);
      settings.certifications = sanitiseCertifications(skills.certifications ?? settings.certifications, errors);
    }

    if (payload.availability) {
      settings.availabilityTemplate = sanitiseAvailability(payload.availability.template, errors);
    }

    if (payload.equipment) {
      settings.equipment = sanitiseEquipment(payload.equipment ?? settings.equipment, errors);
    }

    if (payload.documents) {
      settings.documents = sanitiseDocuments(payload.documents ?? settings.documents, errors);
    }

    if (errors.length > 0) {
      throw createValidationError('Unable to update serviceman profile settings.', errors);
    }

    metadata.lastUpdatedAt = new Date().toISOString();
    metadata.lastUpdatedBy = actorId ?? userId;
    settings.metadata = metadata;

    await user.save({ transaction, validate: false });
    await settings.save({ transaction });
    await transaction.commit();

    return serialiseSettings(user, settings);
  } catch (error) {
    await transaction.rollback();
    if (error.name === 'ValidationError') {
      throw error;
    }
    throw error;
  }
}

export default {
  getServicemanProfileSettings,
  updateServicemanProfileSettings
};
