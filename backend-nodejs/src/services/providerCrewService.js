import { DateTime } from 'luxon';
import { z } from 'zod';
import {
  ProviderCrewMember,
  ProviderCrewAvailability,
  ProviderCrewDeployment,
  ProviderCrewDelegation,
  Company,
  User
} from '../models/index.js';

function buildHttpError(statusCode, message, metadata) {
  const error = new Error(message);
  error.statusCode = statusCode;
  if (metadata) {
    error.metadata = metadata;
  }
  return error;
}

const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const availabilityStatuses = ['available', 'on_call', 'unavailable', 'standby'];
const crewStatuses = ['active', 'standby', 'leave', 'inactive'];
const employmentTypes = ['employee', 'contractor', 'partner'];
const deploymentTypes = ['booking', 'project', 'standby', 'maintenance', 'training', 'support'];
const deploymentStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled', 'on_hold'];
const delegationStatuses = ['active', 'scheduled', 'expired', 'revoked'];

const optionalString = (schema) =>
  z.preprocess((value) => {
    if (value == null) {
      return undefined;
    }
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length === 0 ? undefined : trimmed;
    }
    return value;
  }, schema.optional());

const stringArrayPreprocessor = (maxLength = 120) =>
  z.preprocess((value) => {
    if (Array.isArray(value)) {
      return value.filter((entry) => typeof entry === 'string' && entry.trim().length > 0);
    }
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    }
    return undefined;
  }, z.array(z.string().max(maxLength)).optional());

const timeString = optionalString(z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/));

const crewMemberSchema = z.object({
  fullName: z.string().min(1).max(160),
  role: optionalString(z.string().max(160)),
  email: optionalString(z.string().email()),
  phone: optionalString(z.string().max(48)),
  avatarUrl: optionalString(z.string().url()),
  status: z.enum(crewStatuses).optional(),
  employmentType: z.enum(employmentTypes).optional(),
  timezone: optionalString(z.string().max(64)),
  defaultShiftStart: timeString,
  defaultShiftEnd: timeString,
  skills: stringArrayPreprocessor(80),
  notes: optionalString(z.string().max(4000)),
  allowedRoles: stringArrayPreprocessor(120)
});

const availabilitySchema = z.object({
  dayOfWeek: z.enum(daysOfWeek),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  status: z.enum(availabilityStatuses).optional(),
  location: optionalString(z.string().max(160)),
  effectiveFrom: optionalString(z.string()),
  effectiveTo: optionalString(z.string()),
  notes: optionalString(z.string().max(4000))
});

const deploymentSchema = z.object({
  crewMemberId: z.string().uuid(),
  title: z.string().min(1).max(200),
  assignmentType: z.enum(deploymentTypes).optional(),
  referenceId: optionalString(z.string().max(120)),
  startAt: z.string().refine((value) => DateTime.fromISO(value).isValid, {
    message: 'Invalid startAt'
  }),
  endAt: optionalString(z.string().refine((value) => DateTime.fromISO(value).isValid, 'Invalid endAt')),
  location: optionalString(z.string().max(160)),
  status: z.enum(deploymentStatuses).optional(),
  notes: optionalString(z.string().max(4000)),
  allowedRoles: stringArrayPreprocessor(120)
});

const delegationSchema = z.object({
  crewMemberId: optionalString(z.string().uuid()),
  delegateName: z.string().min(1).max(160),
  delegateEmail: optionalString(z.string().email()),
  delegatePhone: optionalString(z.string().max(48)),
  role: optionalString(z.string().max(160)),
  status: z.enum(delegationStatuses).optional(),
  scope: stringArrayPreprocessor(80),
  startAt: optionalString(z.string().refine((value) => DateTime.fromISO(value).isValid, 'Invalid startAt')),
  endAt: optionalString(z.string().refine((value) => DateTime.fromISO(value).isValid, 'Invalid endAt')),
  notes: optionalString(z.string().max(4000)),
  allowedRoles: stringArrayPreprocessor(120)
});

function sanitiseTime(value) {
  if (!value) return null;
  const parsed = DateTime.fromFormat(value, 'HH:mm');
  return parsed.isValid ? parsed.toFormat('HH:mm') : null;
}

function toDate(value) {
  if (!value) return null;
  const parsed = DateTime.fromISO(value);
  return parsed.isValid ? parsed.toJSDate() : null;
}

function formatTime(value) {
  if (!value) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{2}:\d{2}/.test(trimmed)) {
      return trimmed.slice(0, 5);
    }
    const parsed = DateTime.fromISO(trimmed);
    if (parsed.isValid) {
      return parsed.toFormat('HH:mm');
    }
    return null;
  }
  if (value instanceof Date) {
    return DateTime.fromJSDate(value).toFormat('HH:mm');
  }
  return null;
}

function formatDateTime(value) {
  if (!value) return null;
  if (typeof value === 'string') {
    const parsed = DateTime.fromISO(value);
    if (parsed.isValid) {
      return parsed.toISO();
    }
    return null;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return null;
}

async function resolveCompanyContext({ companyId, actor }) {
  if (!actor?.id) {
    throw buildHttpError(403, 'forbidden');
  }

  const actorRecord = await User.findByPk(actor.id, { attributes: ['id', 'type'] });
  if (!actorRecord) {
    throw buildHttpError(403, 'forbidden');
  }

  const order = [['createdAt', 'ASC']];

  if (['admin', 'operations', 'operations_admin'].includes(actorRecord.type)) {
    const where = companyId ? { id: companyId } : {};
    const companyInstance = await Company.findOne({ where, order });
    if (!companyInstance) {
      throw buildHttpError(404, 'company_not_found');
    }
    return { company: companyInstance.get({ plain: true }), actor: actorRecord };
  }

  if (actorRecord.type !== 'company') {
    throw buildHttpError(403, 'forbidden');
  }

  const where = companyId ? { id: companyId, userId: actorRecord.id } : { userId: actorRecord.id };
  const companyInstance = await Company.findOne({ where, order });
  if (!companyInstance) {
    throw buildHttpError(companyId ? 403 : 404, companyId ? 'forbidden' : 'company_not_found');
  }
  return { company: companyInstance.get({ plain: true }), actor: actorRecord };
}

function normaliseCrewMember(member) {
  const availability = (member.availability || []).map((slot) => ({
    id: slot.id,
    dayOfWeek: slot.dayOfWeek,
    startTime: formatTime(slot.startTime),
    endTime: formatTime(slot.endTime),
    status: slot.status,
    location: slot.location || null,
    effectiveFrom: slot.effectiveFrom ? slot.effectiveFrom.toISOString() : null,
    effectiveTo: slot.effectiveTo ? slot.effectiveTo.toISOString() : null,
    notes: slot.notes || null
  }));

  const deployments = (member.deployments || []).map((deployment) => ({
    id: deployment.id,
    title: deployment.title,
    assignmentType: deployment.assignmentType,
    referenceId: deployment.referenceId || null,
    startAt: formatDateTime(deployment.startAt),
    endAt: formatDateTime(deployment.endAt),
    location: deployment.location || null,
    status: deployment.status,
    notes: deployment.notes || null,
    allowedRoles: Array.isArray(deployment.metadata?.allowedRoles)
      ? deployment.metadata.allowedRoles
      : []
  }));

  const delegations = (member.delegations || []).map((delegation) => ({
    id: delegation.id,
    delegateName: delegation.delegateName,
    delegateEmail: delegation.delegateEmail || null,
    delegatePhone: delegation.delegatePhone || null,
    role: delegation.role || null,
    status: delegation.status,
    scope: Array.isArray(delegation.scope) ? delegation.scope : [],
    startAt: formatDateTime(delegation.startAt),
    endAt: formatDateTime(delegation.endAt),
    notes: delegation.notes || null,
    allowedRoles: Array.isArray(delegation.metadata?.allowedRoles)
      ? delegation.metadata.allowedRoles
      : []
  }));

  return {
    id: member.id,
    fullName: member.fullName,
    role: member.role || null,
    email: member.email || null,
    phone: member.phone || null,
    avatarUrl: member.avatarUrl || null,
    status: member.status,
    employmentType: member.employmentType,
    timezone: member.timezone || null,
    defaultShiftStart: formatTime(member.defaultShiftStart),
    defaultShiftEnd: formatTime(member.defaultShiftEnd),
    skills: Array.isArray(member.skills) ? member.skills : [],
    notes: member.notes || null,
    allowedRoles: Array.isArray(member.metadata?.allowedRoles) ? member.metadata.allowedRoles : [],
    availability,
    deployments,
    delegations
  };
}

function buildRota(crewMembers) {
  const schedule = daysOfWeek.map((day) => ({
    day,
    slots: []
  }));

  for (const member of crewMembers) {
    for (const slot of member.availability || []) {
      const bucket = schedule.find((entry) => entry.day === slot.dayOfWeek);
      if (!bucket) continue;
      bucket.slots.push({
        id: slot.id,
        crewMemberId: member.id,
        crewMemberName: member.fullName,
        status: slot.status,
        startTime: formatTime(slot.startTime),
        endTime: formatTime(slot.endTime),
        location: slot.location || null
      });
    }
  }

  schedule.forEach((entry) => {
    entry.slots.sort((a, b) => {
      if (!a.startTime) return 1;
      if (!b.startTime) return -1;
      return a.startTime.localeCompare(b.startTime);
    });
  });

  return schedule;
}

export async function listCrewManagement({ companyId, actor }) {
  const { company } = await resolveCompanyContext({ companyId, actor });
  const now = DateTime.now();

  const crewMembers = await ProviderCrewMember.findAll({
    where: { companyId: company.id },
    order: [
      ['fullName', 'ASC']
    ],
    include: [
      {
        model: ProviderCrewAvailability,
        as: 'availability',
        separate: true,
        order: [
          ['dayOfWeek', 'ASC'],
          ['startTime', 'ASC']
        ]
      },
      {
        model: ProviderCrewDeployment,
        as: 'deployments',
        separate: true,
        order: [['startAt', 'ASC']]
      },
      {
        model: ProviderCrewDelegation,
        as: 'delegations',
        separate: true,
        order: [['startAt', 'ASC']]
      }
    ]
  });

  const crewData = crewMembers.map((member) => normaliseCrewMember(member.get({ plain: true })));

  const allDeployments = crewData.flatMap((member) =>
    member.deployments.map((deployment) => ({
      ...deployment,
      crewMemberId: member.id,
      crewMemberName: member.fullName
    }))
  );

  const deployments = allDeployments.sort((a, b) => {
    const aStart = a.startAt || '';
    const bStart = b.startAt || '';
    return aStart.localeCompare(bStart);
  });

  const delegations = crewData
    .flatMap((member) =>
      member.delegations.map((delegation) => ({
        ...delegation,
        crewMemberId: member.id,
        crewMemberName: member.fullName
      }))
    )
    .sort((a, b) => {
      const priority = (status) =>
        ({ active: 0, scheduled: 1, revoked: 3, expired: 2 }[status] ?? 4);
      const diff = priority(a.status) - priority(b.status);
      if (diff !== 0) return diff;
      const aStart = a.startAt || '';
      const bStart = b.startAt || '';
      return aStart.localeCompare(bStart);
    });

  const rota = buildRota(crewMembers.map((member) => member.get({ plain: true })));

  const summary = {
    activeCrew: crewData.filter((member) => member.status === 'active').length,
    standbyCrew: crewData.filter((member) => member.status === 'standby').length,
    onLeave: crewData.filter((member) => member.status === 'leave').length,
    upcomingDeployments: deployments.filter((deployment) => {
      if (!deployment.startAt) return false;
      return DateTime.fromISO(deployment.startAt).diff(now, 'hours').hours >= 0;
    }).length,
    delegationsActive: delegations.filter((delegation) => delegation.status === 'active').length
  };

  return {
    data: {
      company: {
        id: company.id,
        name: company.contactName || company.legalStructure || 'Provider'
      },
      summary,
      crewMembers: crewData,
      deployments,
      delegations,
      rota
    },
    meta: {
      companyId: company.id,
      generatedAt: now.toISO()
    }
  };
}

export async function createCrewMember({ companyId, actor, payload }) {
  const { company, actor: actorRecord } = await resolveCompanyContext({ companyId, actor });
  const parsed = crewMemberSchema.parse(payload);

  const crewMember = await ProviderCrewMember.create({
    companyId: company.id,
    fullName: parsed.fullName.trim(),
    role: parsed.role || null,
    email: parsed.email || null,
    phone: parsed.phone || null,
    avatarUrl: parsed.avatarUrl || null,
    status: parsed.status || 'active',
    employmentType: parsed.employmentType || 'employee',
    timezone: parsed.timezone || null,
    defaultShiftStart: sanitiseTime(parsed.defaultShiftStart),
    defaultShiftEnd: sanitiseTime(parsed.defaultShiftEnd),
    skills: Array.isArray(parsed.skills) ? parsed.skills : [],
    notes: parsed.notes || null,
    metadata: {
      allowedRoles: Array.isArray(parsed.allowedRoles) ? Array.from(new Set(parsed.allowedRoles)) : []
    }
  });

  return normaliseCrewMember({ ...crewMember.get({ plain: true }), availability: [], deployments: [], delegations: [] });
}

async function findCrewMemberOrThrow(companyId, crewMemberId) {
  const crewMember = await ProviderCrewMember.findOne({ where: { id: crewMemberId, companyId } });
  if (!crewMember) {
    throw buildHttpError(404, 'crew_member_not_found');
  }
  return crewMember;
}

export async function updateCrewMember({ companyId, actor, crewMemberId, payload }) {
  const { company } = await resolveCompanyContext({ companyId, actor });
  const crewMember = await findCrewMemberOrThrow(company.id, crewMemberId);
  const parsed = crewMemberSchema.parse(payload);

  crewMember.fullName = parsed.fullName.trim();
  crewMember.role = parsed.role || null;
  crewMember.email = parsed.email || null;
  crewMember.phone = parsed.phone || null;
  crewMember.avatarUrl = parsed.avatarUrl || null;
  crewMember.status = parsed.status || crewMember.status;
  crewMember.employmentType = parsed.employmentType || crewMember.employmentType;
  crewMember.timezone = parsed.timezone || null;
  crewMember.defaultShiftStart = sanitiseTime(parsed.defaultShiftStart);
  crewMember.defaultShiftEnd = sanitiseTime(parsed.defaultShiftEnd);
  crewMember.skills = Array.isArray(parsed.skills) ? parsed.skills : [];
  crewMember.notes = parsed.notes || null;
  crewMember.metadata = {
    ...(crewMember.metadata || {}),
    allowedRoles: Array.isArray(parsed.allowedRoles) ? Array.from(new Set(parsed.allowedRoles)) : []
  };

  await crewMember.save();
  return normaliseCrewMember({ ...crewMember.get({ plain: true }), availability: [], deployments: [], delegations: [] });
}

export async function deleteCrewMember({ companyId, actor, crewMemberId }) {
  const { company } = await resolveCompanyContext({ companyId, actor });
  const crewMember = await findCrewMemberOrThrow(company.id, crewMemberId);
  await crewMember.destroy();
}

export async function upsertAvailability({ companyId, actor, crewMemberId, availabilityId, payload }) {
  const { company } = await resolveCompanyContext({ companyId, actor });
  const crewMember = await findCrewMemberOrThrow(company.id, crewMemberId);
  const parsed = availabilitySchema.parse(payload);

  const body = {
    companyId: company.id,
    crewMemberId: crewMember.id,
    dayOfWeek: parsed.dayOfWeek,
    startTime: sanitiseTime(parsed.startTime),
    endTime: sanitiseTime(parsed.endTime),
    status: parsed.status || 'available',
    location: parsed.location || null,
    effectiveFrom: toDate(parsed.effectiveFrom),
    effectiveTo: toDate(parsed.effectiveTo),
    notes: parsed.notes || null
  };

  let record;
  if (availabilityId) {
    record = await ProviderCrewAvailability.findOne({
      where: { id: availabilityId, companyId: company.id, crewMemberId: crewMember.id }
    });
    if (!record) {
      throw buildHttpError(404, 'availability_not_found');
    }
    Object.assign(record, body);
    await record.save();
  } else {
    record = await ProviderCrewAvailability.create(body);
  }

  return {
    id: record.id,
    dayOfWeek: record.dayOfWeek,
    startTime: record.startTime ? DateTime.fromJSDate(record.startTime).toFormat('HH:mm') : null,
    endTime: record.endTime ? DateTime.fromJSDate(record.endTime).toFormat('HH:mm') : null,
    status: record.status,
    location: record.location || null,
    effectiveFrom: record.effectiveFrom ? record.effectiveFrom.toISOString() : null,
    effectiveTo: record.effectiveTo ? record.effectiveTo.toISOString() : null,
    notes: record.notes || null
  };
}

export async function deleteAvailability({ companyId, actor, crewMemberId, availabilityId }) {
  const { company } = await resolveCompanyContext({ companyId, actor });
  await findCrewMemberOrThrow(company.id, crewMemberId);
  const availability = await ProviderCrewAvailability.findOne({
    where: { id: availabilityId, companyId: company.id, crewMemberId }
  });
  if (!availability) {
    throw buildHttpError(404, 'availability_not_found');
  }
  await availability.destroy();
}

export async function upsertDeployment({ companyId, actor, deploymentId, payload }) {
  const { company, actor: actorRecord } = await resolveCompanyContext({ companyId, actor });
  const parsed = deploymentSchema.parse(payload);
  const crewMember = await findCrewMemberOrThrow(company.id, parsed.crewMemberId);

  const body = {
    companyId: company.id,
    crewMemberId: crewMember.id,
    title: parsed.title.trim(),
    assignmentType: parsed.assignmentType || 'booking',
    referenceId: parsed.referenceId || null,
    startAt: DateTime.fromISO(parsed.startAt).toJSDate(),
    endAt: toDate(parsed.endAt),
    location: parsed.location || null,
    status: parsed.status || 'scheduled',
    notes: parsed.notes || null,
    metadata: {
      allowedRoles: Array.isArray(parsed.allowedRoles) ? Array.from(new Set(parsed.allowedRoles)) : []
    },
    updatedBy: actorRecord.id
  };

  let record;
  if (deploymentId) {
    record = await ProviderCrewDeployment.findOne({
      where: { id: deploymentId, companyId: company.id }
    });
    if (!record) {
      throw buildHttpError(404, 'deployment_not_found');
    }
    Object.assign(record, body);
    await record.save();
  } else {
    record = await ProviderCrewDeployment.create({ ...body, createdBy: actorRecord.id });
  }

  return {
    id: record.id,
    crewMemberId: record.crewMemberId,
    title: record.title,
    assignmentType: record.assignmentType,
    referenceId: record.referenceId || null,
    startAt: record.startAt ? record.startAt.toISOString() : null,
    endAt: record.endAt ? record.endAt.toISOString() : null,
    location: record.location || null,
    status: record.status,
    notes: record.notes || null,
    allowedRoles: Array.isArray(record.metadata?.allowedRoles)
      ? record.metadata.allowedRoles
      : []
  };
}

export async function deleteDeployment({ companyId, actor, deploymentId }) {
  const { company } = await resolveCompanyContext({ companyId, actor });
  const record = await ProviderCrewDeployment.findOne({ where: { id: deploymentId, companyId: company.id } });
  if (!record) {
    throw buildHttpError(404, 'deployment_not_found');
  }
  await record.destroy();
}

export async function upsertDelegation({ companyId, actor, delegationId, payload }) {
  const { company, actor: actorRecord } = await resolveCompanyContext({ companyId, actor });
  const parsed = delegationSchema.parse(payload);

  let crewMemberId = null;
  if (parsed.crewMemberId) {
    const crewMember = await findCrewMemberOrThrow(company.id, parsed.crewMemberId);
    crewMemberId = crewMember.id;
  }

  const scope = Array.isArray(parsed.scope) ? Array.from(new Set(parsed.scope)) : [];
  const allowedRoles = Array.isArray(parsed.allowedRoles) ? Array.from(new Set(parsed.allowedRoles)) : [];

  const body = {
    companyId: company.id,
    crewMemberId,
    delegateName: parsed.delegateName.trim(),
    delegateEmail: parsed.delegateEmail || null,
    delegatePhone: parsed.delegatePhone || null,
    role: parsed.role || null,
    status: parsed.status || 'active',
    scope,
    startAt: toDate(parsed.startAt),
    endAt: toDate(parsed.endAt),
    notes: parsed.notes || null,
    metadata: {
      allowedRoles
    },
    updatedBy: actorRecord.id
  };

  let record;
  if (delegationId) {
    record = await ProviderCrewDelegation.findOne({ where: { id: delegationId, companyId: company.id } });
    if (!record) {
      throw buildHttpError(404, 'delegation_not_found');
    }
    Object.assign(record, body);
    await record.save();
  } else {
    record = await ProviderCrewDelegation.create({ ...body, createdBy: actorRecord.id });
  }

  return {
    id: record.id,
    crewMemberId: record.crewMemberId,
    delegateName: record.delegateName,
    delegateEmail: record.delegateEmail || null,
    delegatePhone: record.delegatePhone || null,
    role: record.role || null,
    status: record.status,
    scope: Array.isArray(record.scope) ? record.scope : [],
    startAt: record.startAt ? record.startAt.toISOString() : null,
    endAt: record.endAt ? record.endAt.toISOString() : null,
    notes: record.notes || null,
    allowedRoles: Array.isArray(record.metadata?.allowedRoles)
      ? record.metadata.allowedRoles
      : []
  };
}

export async function deleteDelegation({ companyId, actor, delegationId }) {
  const { company } = await resolveCompanyContext({ companyId, actor });
  const record = await ProviderCrewDelegation.findOne({ where: { id: delegationId, companyId: company.id } });
  if (!record) {
    throw buildHttpError(404, 'delegation_not_found');
  }
  await record.destroy();
}

export default {
  listCrewManagement,
  createCrewMember,
  updateCrewMember,
  deleteCrewMember,
  upsertAvailability,
  deleteAvailability,
  upsertDeployment,
  deleteDeployment,
  upsertDelegation,
  deleteDelegation
};
