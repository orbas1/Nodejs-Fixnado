import sequelize from '../config/database.js';
import {
  User,
  ServicemanProfile,
  ServicemanShiftRule,
  ServicemanCertification,
  ServicemanEquipmentItem
} from '../models/index.js';

const PROFILE_STATUSES = new Set(['active', 'standby', 'offline']);
const SHIFT_STATUSES = new Set(['available', 'standby', 'unavailable']);
const EQUIPMENT_STATUSES = new Set(['ready', 'checked_out', 'maintenance', 'retired']);

function httpError(message, statusCode = 400) {
  return Object.assign(new Error(message), { statusCode });
}

function toSafeString(value, { maxLength } = {}) {
  if (value == null) {
    return null;
  }
  const trimmed = `${value}`.trim();
  if (!trimmed) {
    return null;
  }
  if (maxLength && trimmed.length > maxLength) {
    return trimmed.slice(0, maxLength);
  }
  return trimmed;
}

function toBoolean(value, fallback = null) {
  if (value === undefined) {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const lowered = value.toLowerCase();
    if (['true', '1', 'yes', 'on'].includes(lowered)) {
      return true;
    }
    if (['false', '0', 'no', 'off'].includes(lowered)) {
      return false;
    }
  }
  if (typeof value === 'number') {
    if (Number.isNaN(value)) {
      return fallback;
    }
    return value !== 0;
  }
  return fallback;
}

function toInteger(value, fallback = null) {
  if (value === undefined) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return parsed;
}

function normaliseMinutes(value, { min = 0, max = 720, fallback = 0 } = {}) {
  const parsed = toInteger(value, fallback);
  if (parsed < min) {
    return min;
  }
  if (parsed > max) {
    return max;
  }
  return parsed;
}

function parseDate(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toDateString(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().slice(0, 10);
}

function serialiseTime(value) {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    const parts = value.split(':');
    if (parts.length >= 2) {
      return `${parts[0].padStart(2, '0')}:${parts[1].padStart(2, '0')}`;
    }
    return value;
  }
  if (value instanceof Date) {
    return `${value.getHours().toString().padStart(2, '0')}:${value
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
  }
  return null;
}

function toStorageTime(value, field) {
  const trimmed = toSafeString(value);
  if (!trimmed) {
    throw httpError(`${field} is required`, 422);
  }
  const match = trimmed.match(/^([01]\d|2[0-3]):([0-5]\d)$/);
  if (!match) {
    throw httpError(`${field} must be in HH:MM format`, 422);
  }
  return `${match[1]}:${match[2]}:00`;
}

function compareTimes(start, end) {
  const startMatch = start.match(/^([01]\d|2[0-3]):([0-5]\d):00$/);
  const endMatch = end.match(/^([01]\d|2[0-3]):([0-5]\d):00$/);
  if (!startMatch || !endMatch) {
    return 0;
  }
  const startMinutes = Number.parseInt(startMatch[1], 10) * 60 + Number.parseInt(startMatch[2], 10);
  const endMinutes = Number.parseInt(endMatch[1], 10) * 60 + Number.parseInt(endMatch[2], 10);
  return endMinutes - startMinutes;
}

function serialiseProfile(profile) {
  const plain = profile.get({ plain: true });
  return {
    id: plain.id,
    userId: plain.userId,
    displayName: plain.displayName ?? null,
    callSign: plain.callSign ?? null,
    status: plain.status,
    avatarUrl: plain.avatarUrl ?? null,
    bio: plain.bio ?? null,
    timezone: plain.timezone ?? null,
    primaryRegion: plain.primaryRegion ?? null,
    coverageRadiusKm: plain.coverageRadiusKm,
    travelBufferMinutes: plain.travelBufferMinutes,
    autoAcceptAssignments: Boolean(plain.autoAcceptAssignments),
    allowAfterHours: Boolean(plain.allowAfterHours),
    notifyOpsTeam: Boolean(plain.notifyOpsTeam),
    defaultVehicle: plain.defaultVehicle ?? null
  };
}

function serialiseShiftRule(rule) {
  const plain = rule.get({ plain: true });
  return {
    id: plain.id,
    profileId: plain.profileId,
    dayOfWeek: plain.dayOfWeek,
    startTime: serialiseTime(plain.startTime),
    endTime: serialiseTime(plain.endTime),
    status: plain.status,
    locationLabel: plain.locationLabel ?? null,
    notes: plain.notes ?? null
  };
}

function serialiseCertification(cert) {
  const plain = cert.get({ plain: true });
  return {
    id: plain.id,
    profileId: plain.profileId,
    title: plain.title,
    issuer: plain.issuer ?? null,
    credentialId: plain.credentialId ?? null,
    issuedOn: toDateString(plain.issuedOn),
    expiresOn: toDateString(plain.expiresOn),
    attachmentUrl: plain.attachmentUrl ?? null
  };
}

function serialiseEquipment(item) {
  const plain = item.get({ plain: true });
  return {
    id: plain.id,
    profileId: plain.profileId,
    name: plain.name,
    serialNumber: plain.serialNumber ?? null,
    status: plain.status,
    maintenanceDueOn: toDateString(plain.maintenanceDueOn),
    assignedAt: toDateString(plain.assignedAt),
    imageUrl: plain.imageUrl ?? null,
    notes: plain.notes ?? null
  };
}

async function ensureServicemanProfile(userId, transaction) {
  const user = await User.findByPk(userId, { transaction });
  if (!user) {
    throw httpError('serviceman_not_found', 404);
  }
  if (user.type !== 'servicemen') {
    throw httpError('persona_forbidden', 403);
  }

  const defaults = {};
  const firstName = toSafeString(user.firstName);
  const lastName = toSafeString(user.lastName);
  const derivedName = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (derivedName) {
    defaults.displayName = derivedName;
  }

  const [profile] = await ServicemanProfile.findOrCreate({
    where: { userId },
    defaults,
    transaction
  });

  return { user, profile };
}

function buildQuickLinks(profile) {
  return [
    {
      id: 'open-calendar',
      label: 'Open crew calendar',
      description: 'Adjust shift availability in the dedicated calendar workspace.',
      href: '/dashboards/serviceman/calendar',
      target: '_blank'
    },
    {
      id: 'open-pipeline',
      label: 'View job pipeline',
      description: 'Jump to the kanban board for today\'s and upcoming assignments.',
      href: '/dashboards/serviceman/schedule',
      target: '_blank'
    },
    {
      id: 'open-travel',
      label: 'Travel telemetry',
      description: 'Monitor live travel buffers and routing optimisation signals.',
      href: '/dashboards/serviceman/travel',
      target: '_blank'
    }
  ].map((link) => ({ ...link, profileId: profile.id }));
}

export async function getServicemanOverview({ userId }) {
  const { profile } = await ensureServicemanProfile(userId);

  const [shiftRules, certifications, equipment] = await Promise.all([
    ServicemanShiftRule.findAll({
      where: { profileId: profile.id },
      order: [
        ['dayOfWeek', 'ASC'],
        ['startTime', 'ASC']
      ]
    }),
    ServicemanCertification.findAll({
      where: { profileId: profile.id },
      order: [['createdAt', 'DESC']]
    }),
    ServicemanEquipmentItem.findAll({
      where: { profileId: profile.id },
      order: [['createdAt', 'DESC']]
    })
  ]);

  return {
    profile: serialiseProfile(profile),
    availability: shiftRules.map(serialiseShiftRule),
    certifications: certifications.map(serialiseCertification),
    equipment: equipment.map(serialiseEquipment),
    permissions: {
      canEditProfile: true,
      canManageAvailability: true,
      canManageCertifications: true,
      canManageEquipment: true
    },
    quickLinks: buildQuickLinks(profile)
  };
}

export async function updateServicemanProfile({ userId, payload }) {
  if (!payload || typeof payload !== 'object') {
    throw httpError('profile_payload_required', 422);
  }

  return sequelize.transaction(async (transaction) => {
    const { profile } = await ensureServicemanProfile(userId, transaction);

    const updates = {};

    if (payload.displayName !== undefined) {
      updates.displayName = toSafeString(payload.displayName, { maxLength: 160 });
    }
    if (payload.callSign !== undefined) {
      updates.callSign = toSafeString(payload.callSign, { maxLength: 64 });
    }
    if (payload.status !== undefined) {
      const status = toSafeString(payload.status, { maxLength: 32 });
      if (status && !PROFILE_STATUSES.has(status)) {
        throw httpError('invalid_profile_status', 422);
      }
      updates.status = status ?? 'active';
    }
    if (payload.avatarUrl !== undefined) {
      updates.avatarUrl = toSafeString(payload.avatarUrl);
    }
    if (payload.bio !== undefined) {
      updates.bio = toSafeString(payload.bio);
    }
    if (payload.timezone !== undefined) {
      updates.timezone = toSafeString(payload.timezone, { maxLength: 64 });
    }
    if (payload.primaryRegion !== undefined) {
      updates.primaryRegion = toSafeString(payload.primaryRegion, { maxLength: 120 });
    }
    if (payload.coverageRadiusKm !== undefined) {
      updates.coverageRadiusKm = normaliseMinutes(payload.coverageRadiusKm, { max: 400, fallback: profile.coverageRadiusKm });
    }
    if (payload.travelBufferMinutes !== undefined) {
      updates.travelBufferMinutes = normaliseMinutes(payload.travelBufferMinutes, { max: 240, fallback: profile.travelBufferMinutes });
    }
    const autoAccept = toBoolean(payload.autoAcceptAssignments);
    if (autoAccept !== null) {
      updates.autoAcceptAssignments = autoAccept;
    }
    const allowAfterHours = toBoolean(payload.allowAfterHours);
    if (allowAfterHours !== null) {
      updates.allowAfterHours = allowAfterHours;
    }
    const notifyOpsTeam = toBoolean(payload.notifyOpsTeam);
    if (notifyOpsTeam !== null) {
      updates.notifyOpsTeam = notifyOpsTeam;
    }
    if (payload.defaultVehicle !== undefined) {
      updates.defaultVehicle = toSafeString(payload.defaultVehicle, { maxLength: 96 });
    }

    await profile.update(updates, { transaction });
    await profile.reload({ transaction });
    return serialiseProfile(profile);
  });
}

export async function createShiftRule({ userId, payload }) {
  if (!payload || typeof payload !== 'object') {
    throw httpError('availability_payload_required', 422);
  }
  const dayOfWeek = toInteger(payload.dayOfWeek);
  if (dayOfWeek == null || dayOfWeek < 0 || dayOfWeek > 6) {
    throw httpError('day_of_week_invalid', 422);
  }
  const startTime = toStorageTime(payload.startTime, 'startTime');
  const endTime = toStorageTime(payload.endTime, 'endTime');
  if (compareTimes(startTime, endTime) <= 0) {
    throw httpError('end_time_must_be_after_start_time', 422);
  }

  const status = toSafeString(payload.status, { maxLength: 32 }) ?? 'available';
  if (!SHIFT_STATUSES.has(status)) {
    throw httpError('invalid_shift_status', 422);
  }

  return sequelize.transaction(async (transaction) => {
    const { profile } = await ensureServicemanProfile(userId, transaction);

    const rule = await ServicemanShiftRule.create(
      {
        profileId: profile.id,
        dayOfWeek,
        startTime,
        endTime,
        status,
        locationLabel: toSafeString(payload.locationLabel, { maxLength: 160 }),
        notes: toSafeString(payload.notes)
      },
      { transaction }
    );

    return serialiseShiftRule(rule);
  });
}

export async function updateShiftRule({ userId, id, payload }) {
  if (!payload || typeof payload !== 'object') {
    throw httpError('availability_payload_required', 422);
  }

  return sequelize.transaction(async (transaction) => {
    const { profile } = await ensureServicemanProfile(userId, transaction);
    const rule = await ServicemanShiftRule.findOne({ where: { id, profileId: profile.id }, transaction });
    if (!rule) {
      throw httpError('availability_not_found', 404);
    }

    const updates = {};
    if (payload.dayOfWeek !== undefined) {
      const dayOfWeek = toInteger(payload.dayOfWeek);
      if (dayOfWeek == null || dayOfWeek < 0 || dayOfWeek > 6) {
        throw httpError('day_of_week_invalid', 422);
      }
      updates.dayOfWeek = dayOfWeek;
    }
    if (payload.startTime !== undefined) {
      updates.startTime = toStorageTime(payload.startTime, 'startTime');
    }
    if (payload.endTime !== undefined) {
      updates.endTime = toStorageTime(payload.endTime, 'endTime');
    }
    if (updates.startTime || updates.endTime) {
      const startValue = updates.startTime ?? rule.startTime;
      const endValue = updates.endTime ?? rule.endTime;
      if (compareTimes(startValue, endValue) <= 0) {
        throw httpError('end_time_must_be_after_start_time', 422);
      }
    }
    if (payload.status !== undefined) {
      const status = toSafeString(payload.status, { maxLength: 32 }) ?? 'available';
      if (!SHIFT_STATUSES.has(status)) {
        throw httpError('invalid_shift_status', 422);
      }
      updates.status = status;
    }
    if (payload.locationLabel !== undefined) {
      updates.locationLabel = toSafeString(payload.locationLabel, { maxLength: 160 });
    }
    if (payload.notes !== undefined) {
      updates.notes = toSafeString(payload.notes);
    }

    await rule.update(updates, { transaction });
    await rule.reload({ transaction });
    return serialiseShiftRule(rule);
  });
}

export async function deleteShiftRule({ userId, id }) {
  return sequelize.transaction(async (transaction) => {
    const { profile } = await ensureServicemanProfile(userId, transaction);
    const rule = await ServicemanShiftRule.findOne({ where: { id, profileId: profile.id }, transaction });
    if (!rule) {
      throw httpError('availability_not_found', 404);
    }
    await rule.destroy({ transaction });
  });
}

export async function createCertification({ userId, payload }) {
  if (!payload || typeof payload !== 'object') {
    throw httpError('certification_payload_required', 422);
  }
  if (!toSafeString(payload.title)) {
    throw httpError('title_required', 422);
  }

  return sequelize.transaction(async (transaction) => {
    const { profile } = await ensureServicemanProfile(userId, transaction);
    const certification = await ServicemanCertification.create(
      {
        profileId: profile.id,
        title: toSafeString(payload.title, { maxLength: 180 }),
        issuer: toSafeString(payload.issuer, { maxLength: 160 }),
        credentialId: toSafeString(payload.credentialId, { maxLength: 120 }),
        issuedOn: parseDate(payload.issuedOn),
        expiresOn: parseDate(payload.expiresOn),
        attachmentUrl: toSafeString(payload.attachmentUrl)
      },
      { transaction }
    );
    return serialiseCertification(certification);
  });
}

export async function updateCertification({ userId, id, payload }) {
  if (!payload || typeof payload !== 'object') {
    throw httpError('certification_payload_required', 422);
  }

  return sequelize.transaction(async (transaction) => {
    const { profile } = await ensureServicemanProfile(userId, transaction);
    const certification = await ServicemanCertification.findOne({
      where: { id, profileId: profile.id },
      transaction
    });
    if (!certification) {
      throw httpError('certification_not_found', 404);
    }

    const updates = {};
    if (payload.title !== undefined) {
      const title = toSafeString(payload.title, { maxLength: 180 });
      if (!title) {
        throw httpError('title_required', 422);
      }
      updates.title = title;
    }
    if (payload.issuer !== undefined) {
      updates.issuer = toSafeString(payload.issuer, { maxLength: 160 });
    }
    if (payload.credentialId !== undefined) {
      updates.credentialId = toSafeString(payload.credentialId, { maxLength: 120 });
    }
    if (payload.issuedOn !== undefined) {
      updates.issuedOn = parseDate(payload.issuedOn);
    }
    if (payload.expiresOn !== undefined) {
      updates.expiresOn = parseDate(payload.expiresOn);
    }
    if (payload.attachmentUrl !== undefined) {
      updates.attachmentUrl = toSafeString(payload.attachmentUrl);
    }

    await certification.update(updates, { transaction });
    await certification.reload({ transaction });
    return serialiseCertification(certification);
  });
}

export async function deleteCertification({ userId, id }) {
  return sequelize.transaction(async (transaction) => {
    const { profile } = await ensureServicemanProfile(userId, transaction);
    const certification = await ServicemanCertification.findOne({
      where: { id, profileId: profile.id },
      transaction
    });
    if (!certification) {
      throw httpError('certification_not_found', 404);
    }
    await certification.destroy({ transaction });
  });
}

export async function createEquipmentItem({ userId, payload }) {
  if (!payload || typeof payload !== 'object') {
    throw httpError('equipment_payload_required', 422);
  }
  if (!toSafeString(payload.name)) {
    throw httpError('name_required', 422);
  }
  const status = toSafeString(payload.status, { maxLength: 48 }) ?? 'ready';
  if (!EQUIPMENT_STATUSES.has(status)) {
    throw httpError('invalid_equipment_status', 422);
  }

  return sequelize.transaction(async (transaction) => {
    const { profile } = await ensureServicemanProfile(userId, transaction);
    const item = await ServicemanEquipmentItem.create(
      {
        profileId: profile.id,
        name: toSafeString(payload.name, { maxLength: 180 }),
        serialNumber: toSafeString(payload.serialNumber, { maxLength: 120 }),
        status,
        maintenanceDueOn: parseDate(payload.maintenanceDueOn),
        assignedAt: parseDate(payload.assignedAt),
        imageUrl: toSafeString(payload.imageUrl),
        notes: toSafeString(payload.notes)
      },
      { transaction }
    );
    return serialiseEquipment(item);
  });
}

export async function updateEquipmentItem({ userId, id, payload }) {
  if (!payload || typeof payload !== 'object') {
    throw httpError('equipment_payload_required', 422);
  }

  return sequelize.transaction(async (transaction) => {
    const { profile } = await ensureServicemanProfile(userId, transaction);
    const item = await ServicemanEquipmentItem.findOne({ where: { id, profileId: profile.id }, transaction });
    if (!item) {
      throw httpError('equipment_not_found', 404);
    }

    const updates = {};
    if (payload.name !== undefined) {
      const name = toSafeString(payload.name, { maxLength: 180 });
      if (!name) {
        throw httpError('name_required', 422);
      }
      updates.name = name;
    }
    if (payload.serialNumber !== undefined) {
      updates.serialNumber = toSafeString(payload.serialNumber, { maxLength: 120 });
    }
    if (payload.status !== undefined) {
      const status = toSafeString(payload.status, { maxLength: 48 }) ?? 'ready';
      if (!EQUIPMENT_STATUSES.has(status)) {
        throw httpError('invalid_equipment_status', 422);
      }
      updates.status = status;
    }
    if (payload.maintenanceDueOn !== undefined) {
      updates.maintenanceDueOn = parseDate(payload.maintenanceDueOn);
    }
    if (payload.assignedAt !== undefined) {
      updates.assignedAt = parseDate(payload.assignedAt);
    }
    if (payload.imageUrl !== undefined) {
      updates.imageUrl = toSafeString(payload.imageUrl);
    }
    if (payload.notes !== undefined) {
      updates.notes = toSafeString(payload.notes);
    }

    await item.update(updates, { transaction });
    await item.reload({ transaction });
    return serialiseEquipment(item);
  });
}

export async function deleteEquipmentItem({ userId, id }) {
  return sequelize.transaction(async (transaction) => {
    const { profile } = await ensureServicemanProfile(userId, transaction);
    const item = await ServicemanEquipmentItem.findOne({ where: { id, profileId: profile.id }, transaction });
    if (!item) {
      throw httpError('equipment_not_found', 404);
    }
    await item.destroy({ transaction });
  });
}
