import { Op } from 'sequelize';
import { DateTime } from 'luxon';
import {
  ServicemanProfile,
  ServicemanShift,
  ServicemanCertification,
  Company
} from '../models/index.js';

const PROFILE_STATUSES = new Set(['active', 'standby', 'on_leave', 'training']);
const EMPLOYMENT_TYPES = new Set(['full_time', 'part_time', 'contractor']);
const SHIFT_STATUSES = new Set(['available', 'booked', 'standby', 'travel', 'off']);
const CERTIFICATION_STATUSES = new Set(['valid', 'expiring', 'expired', 'revoked']);

function managementError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normaliseText(value, fieldName) {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value !== 'string') {
    throw managementError(`${fieldName} must be a string`);
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function assertFromSet(value, set, fieldName) {
  if (value === null || value === undefined) {
    throw managementError(`${fieldName} is required`);
  }
  const normalised = String(value).trim().toLowerCase();
  if (!set.has(normalised)) {
    throw managementError(`${fieldName} must be one of: ${Array.from(set).join(', ')}`);
  }
  return normalised;
}

function normaliseSkills(skills) {
  if (skills === null || skills === undefined) {
    return [];
  }
  if (!Array.isArray(skills)) {
    throw managementError('skills must be an array of strings');
  }
  return skills
    .map((skill) => (typeof skill === 'string' ? skill.trim() : ''))
    .filter((skill) => skill.length > 0)
    .slice(0, 16);
}

function ensureValidTime(value, fieldName) {
  const text = normaliseText(value, fieldName);
  if (!text) {
    throw managementError(`${fieldName} is required`);
  }
  if (!/^\d{2}:\d{2}$/.test(text)) {
    throw managementError(`${fieldName} must be formatted as HH:mm`);
  }
  return text;
}

function parseTimeToMinutes(value) {
  const [hours, minutes] = value.split(':').map((part) => Number.parseInt(part, 10));
  return hours * 60 + minutes;
}

function resolveWindow(window) {
  const timezone = window?.timezone || 'Europe/London';
  const start = window?.start ? DateTime.fromJSDate(window.start).setZone(timezone) : DateTime.now().setZone(timezone);
  const rangeStart = start.startOf('day');
  const days = [];
  let cursor = rangeStart;
  for (let index = 0; index < 7; index += 1) {
    days.push({
      date: cursor.toISODate(),
      label: cursor.toFormat('ccc dd LLL')
    });
    cursor = cursor.plus({ days: 1 });
  }
  return { timezone, days, start: rangeStart, end: cursor.minus({ days: 1 }).endOf('day') };
}

function formatShift(shift, profile, timezone) {
  return {
    id: shift.id,
    profileId: shift.profileId,
    profileName: profile.displayName,
    shiftDate: shift.shiftDate,
    startTime: shift.startTime,
    endTime: shift.endTime,
    status: shift.status,
    location: shift.location,
    assignmentTitle: shift.assignmentTitle,
    notes: shift.notes,
    label: `${shift.startTime} → ${shift.endTime}`,
    dayLabel: DateTime.fromISO(shift.shiftDate, { zone: timezone }).toFormat('ccc dd LLL')
  };
}

function formatCertification(certification, profile, timezone) {
  const expiresAt = certification.expiresAt
    ? DateTime.fromJSDate(certification.expiresAt).setZone(timezone).toISODate()
    : null;
  const issuedAt = certification.issuedAt
    ? DateTime.fromJSDate(certification.issuedAt).setZone(timezone).toISODate()
    : null;

  return {
    id: certification.id,
    profileId: certification.profileId,
    profileName: profile.displayName,
    name: certification.name,
    issuer: certification.issuer,
    status: certification.status,
    issuedAt,
    expiresAt,
    documentUrl: certification.documentUrl,
    notes: certification.notes
  };
}

export async function getServicemanManagementSnapshot({ companyId, window }) {
  if (companyId) {
    const companyExists = await Company.count({ where: { id: companyId } });
    if (!companyExists) {
      throw managementError('Company not found', 404);
    }
  }

  const { timezone, days, start, end } = resolveWindow(window);
  const dateRange = { [Op.between]: [days[0].date, days[days.length - 1].date] };

  const profiles = await ServicemanProfile.findAll({
    where: companyId ? { companyId } : {},
    order: [['displayName', 'ASC']],
    include: [
      {
        model: ServicemanShift,
        as: 'shifts',
        required: false,
        where: { shiftDate: dateRange },
        separate: true,
        order: [
          ['shiftDate', 'ASC'],
          ['startTime', 'ASC']
        ]
      },
      {
        model: ServicemanCertification,
        as: 'certifications',
        required: false,
        separate: true,
        order: [['expiresAt', 'ASC NULLS LAST']]
      }
    ]
  });

  const roster = [];
  const allShifts = [];
  const certificationTracker = [];
  const standbyProfiles = new Set();
  let openSlots = 0;
  let followUps = 0;

  const today = DateTime.now().setZone(timezone).startOf('day');

  const regionAggregates = new Map();

  profiles.forEach((profile) => {
    const contactEmail = profile.get('contactEmail');
    const contactPhone = profile.get('contactPhone');
    const notes = profile.get('notes');
    const shifts = Array.isArray(profile.shifts) ? profile.shifts : [];
    const certifications = Array.isArray(profile.certifications) ? profile.certifications : [];

    const zoneKey = profile.primaryZone || 'Unassigned zone';
    const zoneStats = regionAggregates.get(zoneKey) || {
      crews: 0,
      standbyCrews: 0,
      availableSlots: 0
    };
    zoneStats.crews += 1;

    const nextShift = shifts
      .filter((shift) => DateTime.fromISO(shift.shiftDate, { zone: timezone }) >= today)
      .sort((a, b) => {
        const left = DateTime.fromISO(`${a.shiftDate}T${a.startTime}`, { zone: timezone });
        const right = DateTime.fromISO(`${b.shiftDate}T${b.startTime}`, { zone: timezone });
        return left.valueOf() - right.valueOf();
      })[0] || null;

    shifts.forEach((shift) => {
      if (shift.status === 'standby') {
        standbyProfiles.add(profile.id);
        zoneStats.standbyCrews += 1;
      }
      if (shift.status === 'available' || shift.status === 'standby') {
        openSlots += 1;
        zoneStats.availableSlots += 1;
      }
      allShifts.push(formatShift(shift, profile, timezone));
    });

    certifications.forEach((certification) => {
      const formatted = formatCertification(certification, profile, timezone);
      certificationTracker.push(formatted);
      if (['expiring', 'expired', 'revoked'].includes(formatted.status)) {
        followUps += 1;
      }
    });

    if (!regionAggregates.has(zoneKey)) {
      regionAggregates.set(zoneKey, zoneStats);
    }

    roster.push({
      id: profile.id,
      displayName: profile.displayName,
      role: profile.role,
      status: profile.status,
      employmentType: profile.employmentType,
      primaryZone: profile.primaryZone,
      avatarUrl: profile.avatarUrl,
      contactEmail,
      contactPhone,
      notes,
      skills: Array.isArray(profile.skills) ? profile.skills : [],
      certifications: certifications.slice(0, 4).map((cert) => formatCertification(cert, profile, timezone)),
      nextShift: nextShift ? formatShift(nextShift, profile, timezone) : null
    });
  });

  const coverageRegions = Array.from(regionAggregates.entries()).map(([label, stats]) => ({
    id: label.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    label,
    crews: stats.crews,
    standbyCrews: stats.standbyCrews,
    availableSlots: stats.availableSlots,
    status:
      stats.availableSlots === 0
        ? 'At capacity'
        : stats.standbyCrews === 0
          ? 'Needs standby'
          : 'Healthy'
  }));

  const coverageActions = [];
  if (openSlots > 0) {
    coverageActions.push('Assign available or standby shifts to keep daily coverage balanced.');
  }
  if (followUps > 0) {
    coverageActions.push(`${followUps} certification${followUps === 1 ? '' : 's'} require review.`);
  }
  if (coverageRegions.some((region) => region.status !== 'Healthy')) {
    coverageActions.push('Review regional staffing to restore standby coverage across all zones.');
  }
  if (coverageActions.length === 0) {
    coverageActions.push('Crew availability, standby coverage, and compliance are healthy. Maintain weekly audits.');
  }

  certificationTracker.sort((a, b) => {
    if (!a.expiresAt && !b.expiresAt) return a.name.localeCompare(b.name);
    if (!a.expiresAt) return 1;
    if (!b.expiresAt) return -1;
    return a.expiresAt.localeCompare(b.expiresAt);
  });

  return {
    summary: {
      openSlots,
      standbyCrews: standbyProfiles.size,
      followUps
    },
    roster,
    schedule: {
      days,
      timezone,
      shifts: allShifts
    },
    certifications: certificationTracker,
    coverage: {
      regions: coverageRegions,
      actions: coverageActions
    },
    formOptions: {
      statuses: Array.from(PROFILE_STATUSES),
      employmentTypes: Array.from(EMPLOYMENT_TYPES),
      shiftStatuses: Array.from(SHIFT_STATUSES),
      certificationStatuses: Array.from(CERTIFICATION_STATUSES)
    },
    context: {
      companyId: companyId || null,
      timezone,
      windowStart: start.toISO(),
      windowEnd: end.toISO()
    }
  };
}

export async function createServicemanProfile({
  companyId,
  displayName,
  role,
  status = 'active',
  employmentType = 'full_time',
  primaryZone = null,
  contactEmail = null,
  contactPhone = null,
  avatarUrl = null,
  skills = [],
  notes = null
}) {
  if (!displayName || typeof displayName !== 'string' || !displayName.trim()) {
    throw managementError('displayName is required');
  }
  if (!role || typeof role !== 'string' || !role.trim()) {
    throw managementError('role is required');
  }

  const profile = ServicemanProfile.build({
    companyId: companyId || null,
    displayName: displayName.trim(),
    role: role.trim(),
    status: assertFromSet(status, PROFILE_STATUSES, 'status'),
    employmentType: assertFromSet(employmentType, EMPLOYMENT_TYPES, 'employmentType'),
    primaryZone: normaliseText(primaryZone, 'primaryZone'),
    avatarUrl: normaliseText(avatarUrl, 'avatarUrl'),
    skills: normaliseSkills(skills)
  });

  profile.set('contactEmail', normaliseText(contactEmail, 'contactEmail'));
  profile.set('contactPhone', normaliseText(contactPhone, 'contactPhone'));
  profile.set('notes', normaliseText(notes, 'notes'));

  await profile.save();
  return profile;
}

export async function updateServicemanProfile(id, updates = {}) {
  const profile = await ServicemanProfile.findByPk(id);
  if (!profile) {
    throw managementError('Serviceman profile not found', 404);
  }

  if (updates.displayName !== undefined) {
    const name = normaliseText(updates.displayName, 'displayName');
    if (!name) {
      throw managementError('displayName cannot be empty');
    }
    profile.displayName = name;
  }

  if (updates.role !== undefined) {
    const nextRole = normaliseText(updates.role, 'role');
    if (!nextRole) {
      throw managementError('role cannot be empty');
    }
    profile.role = nextRole;
  }

  if (updates.status !== undefined) {
    profile.status = assertFromSet(updates.status, PROFILE_STATUSES, 'status');
  }

  if (updates.employmentType !== undefined) {
    profile.employmentType = assertFromSet(updates.employmentType, EMPLOYMENT_TYPES, 'employmentType');
  }

  if (updates.primaryZone !== undefined) {
    profile.primaryZone = normaliseText(updates.primaryZone, 'primaryZone');
  }

  if (updates.avatarUrl !== undefined) {
    profile.avatarUrl = normaliseText(updates.avatarUrl, 'avatarUrl');
  }

  if (updates.skills !== undefined) {
    profile.skills = normaliseSkills(updates.skills);
  }

  if (updates.contactEmail !== undefined) {
    profile.set('contactEmail', normaliseText(updates.contactEmail, 'contactEmail'));
  }

  if (updates.contactPhone !== undefined) {
    profile.set('contactPhone', normaliseText(updates.contactPhone, 'contactPhone'));
  }

  if (updates.notes !== undefined) {
    profile.set('notes', normaliseText(updates.notes, 'notes'));
  }

  await profile.save();
  return profile;
}

export async function deleteServicemanProfile(id) {
  const profile = await ServicemanProfile.findByPk(id);
  if (!profile) {
    throw managementError('Serviceman profile not found', 404);
  }
  await profile.destroy();
}

export async function createServicemanShift(profileId, payload) {
  const profile = await ServicemanProfile.findByPk(profileId);
  if (!profile) {
    throw managementError('Serviceman profile not found', 404);
  }
  const shiftDate = normaliseText(payload.shiftDate, 'shiftDate');
  if (!shiftDate) {
    throw managementError('shiftDate is required');
  }
  const startTime = ensureValidTime(payload.startTime, 'startTime');
  const endTime = ensureValidTime(payload.endTime, 'endTime');
  if (parseTimeToMinutes(endTime) <= parseTimeToMinutes(startTime)) {
    throw managementError('endTime must be after startTime');
  }

  const shift = await ServicemanShift.create({
    profileId,
    shiftDate,
    startTime,
    endTime,
    status: assertFromSet(payload.status ?? 'available', SHIFT_STATUSES, 'status'),
    assignmentTitle: normaliseText(payload.assignmentTitle, 'assignmentTitle'),
    location: normaliseText(payload.location, 'location'),
    notes: normaliseText(payload.notes, 'notes')
  });

  return shift;
}

export async function updateServicemanShift(profileId, shiftId, payload) {
  const shift = await ServicemanShift.findOne({ where: { id: shiftId, profileId } });
  if (!shift) {
    throw managementError('Serviceman shift not found', 404);
  }

  if (payload.shiftDate !== undefined) {
    const dateValue = normaliseText(payload.shiftDate, 'shiftDate');
    if (!dateValue) {
      throw managementError('shiftDate cannot be empty');
    }
    shift.shiftDate = dateValue;
  }

  if (payload.startTime !== undefined) {
    shift.startTime = ensureValidTime(payload.startTime, 'startTime');
  }

  if (payload.endTime !== undefined) {
    shift.endTime = ensureValidTime(payload.endTime, 'endTime');
  }

  if (parseTimeToMinutes(shift.endTime) <= parseTimeToMinutes(shift.startTime)) {
    throw managementError('endTime must be after startTime');
  }

  if (payload.status !== undefined) {
    shift.status = assertFromSet(payload.status, SHIFT_STATUSES, 'status');
  }

  if (payload.assignmentTitle !== undefined) {
    shift.assignmentTitle = normaliseText(payload.assignmentTitle, 'assignmentTitle');
  }

  if (payload.location !== undefined) {
    shift.location = normaliseText(payload.location, 'location');
  }

  if (payload.notes !== undefined) {
    shift.notes = normaliseText(payload.notes, 'notes');
  }

  await shift.save();
  return shift;
}

export async function deleteServicemanShift(profileId, shiftId) {
  const shift = await ServicemanShift.findOne({ where: { id: shiftId, profileId } });
  if (!shift) {
    throw managementError('Serviceman shift not found', 404);
  }
  await shift.destroy();
}

export async function createServicemanCertification(profileId, payload) {
  const profile = await ServicemanProfile.findByPk(profileId);
  if (!profile) {
    throw managementError('Serviceman profile not found', 404);
  }
  const name = normaliseText(payload.name, 'name');
  if (!name) {
    throw managementError('name is required');
  }

  const issuedAt = payload.issuedAt ? new Date(payload.issuedAt) : null;
  const expiresAt = payload.expiresAt ? new Date(payload.expiresAt) : null;
  if (expiresAt && Number.isNaN(expiresAt.getTime())) {
    throw managementError('expiresAt must be a valid date');
  }
  if (issuedAt && Number.isNaN(issuedAt.getTime())) {
    throw managementError('issuedAt must be a valid date');
  }

  const certification = await ServicemanCertification.create({
    profileId,
    name,
    issuer: normaliseText(payload.issuer, 'issuer'),
    status: assertFromSet(payload.status ?? 'valid', CERTIFICATION_STATUSES, 'status'),
    issuedAt,
    expiresAt,
    documentUrl: normaliseText(payload.documentUrl, 'documentUrl'),
    notes: normaliseText(payload.notes, 'notes')
  });

  return certification;
}

export async function updateServicemanCertification(profileId, certificationId, payload) {
  const certification = await ServicemanCertification.findOne({ where: { id: certificationId, profileId } });
  if (!certification) {
    throw managementError('Serviceman certification not found', 404);
  }

  if (payload.name !== undefined) {
    const name = normaliseText(payload.name, 'name');
    if (!name) {
      throw managementError('name cannot be empty');
    }
    certification.name = name;
  }

  if (payload.issuer !== undefined) {
    certification.issuer = normaliseText(payload.issuer, 'issuer');
  }

  if (payload.status !== undefined) {
    certification.status = assertFromSet(payload.status, CERTIFICATION_STATUSES, 'status');
  }

  if (payload.issuedAt !== undefined) {
    if (!payload.issuedAt) {
      certification.issuedAt = null;
    } else {
      const issuedAt = new Date(payload.issuedAt);
      if (Number.isNaN(issuedAt.getTime())) {
        throw managementError('issuedAt must be a valid date');
      }
      certification.issuedAt = issuedAt;
    }
  }

  if (payload.expiresAt !== undefined) {
    if (!payload.expiresAt) {
      certification.expiresAt = null;
    } else {
      const expiresAt = new Date(payload.expiresAt);
      if (Number.isNaN(expiresAt.getTime())) {
        throw managementError('expiresAt must be a valid date');
      }
      certification.expiresAt = expiresAt;
    }
  }

  if (payload.documentUrl !== undefined) {
    certification.documentUrl = normaliseText(payload.documentUrl, 'documentUrl');
  }

  if (payload.notes !== undefined) {
    certification.notes = normaliseText(payload.notes, 'notes');
  }

  await certification.save();
  return certification;
}

export async function deleteServicemanCertification(profileId, certificationId) {
  const certification = await ServicemanCertification.findOne({ where: { id: certificationId, profileId } });
  if (!certification) {
    throw managementError('Serviceman certification not found', 404);
  }
  await certification.destroy();
}

export default {
  getServicemanManagementSnapshot,
  createServicemanProfile,
  updateServicemanProfile,
  deleteServicemanProfile,
  createServicemanShift,
  updateServicemanShift,
  deleteServicemanShift,
  createServicemanCertification,
  updateServicemanCertification,
  deleteServicemanCertification
};
