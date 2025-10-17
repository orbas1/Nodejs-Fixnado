import { Op } from 'sequelize';
import {
  ProviderProfile,
  ProviderOnboardingTask,
  ProviderOnboardingRequirement,
  ProviderOnboardingNote,
  User
} from '../models/index.js';
import { resolveCompanyForActor } from './panelService.js';

export const STAGE_OPTIONS = [
  { value: 'intake', label: 'Intake' },
  { value: 'documents', label: 'Document collection' },
  { value: 'compliance', label: 'Compliance review' },
  { value: 'go-live', label: 'Go-live preparation' },
  { value: 'live', label: 'Live' }
];

export const PROVIDER_STATUS_OPTIONS = [
  { value: 'prospect', label: 'Prospect' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'archived', label: 'Archived' }
];

export const TASK_STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not started' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'completed', label: 'Completed' }
];

export const TASK_PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' }
];

export const REQUIREMENT_TYPE_OPTIONS = [
  { value: 'document', label: 'Document' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'payment', label: 'Payment & billing' },
  { value: 'training', label: 'Training & enablement' },
  { value: 'integration', label: 'Integration' },
  { value: 'other', label: 'Other' }
];

export const REQUIREMENT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'waived', label: 'Waived' }
];

export const NOTE_TYPE_OPTIONS = [
  { value: 'update', label: 'Update' },
  { value: 'risk', label: 'Risk' },
  { value: 'decision', label: 'Decision' },
  { value: 'note', label: 'Note' }
];

export const NOTE_VISIBILITY_OPTIONS = [
  { value: 'internal', label: 'Internal only' },
  { value: 'shared', label: 'Shared with provider' }
];

const STAGE_LABELS = new Map(STAGE_OPTIONS.map((option) => [option.value, option.label]));
const TASK_STATUS_LABELS = new Map(TASK_STATUS_OPTIONS.map((option) => [option.value, option.label]));
const TASK_PRIORITY_LABELS = new Map(TASK_PRIORITY_OPTIONS.map((option) => [option.value, option.label]));
const REQUIREMENT_TYPE_LABELS = new Map(REQUIREMENT_TYPE_OPTIONS.map((option) => [option.value, option.label]));
const REQUIREMENT_STATUS_LABELS = new Map(REQUIREMENT_STATUS_OPTIONS.map((option) => [option.value, option.label]));
const NOTE_TYPE_LABELS = new Map(NOTE_TYPE_OPTIONS.map((option) => [option.value, option.label]));
const NOTE_VISIBILITY_LABELS = new Map(NOTE_VISIBILITY_OPTIONS.map((option) => [option.value, option.label]));
const PROVIDER_STATUS_LABELS = new Map(PROVIDER_STATUS_OPTIONS.map((option) => [option.value, option.label]));

const REQUIREMENT_COMPLETE_STATUSES = new Set(['approved', 'waived']);

function buildHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function toPlain(instance) {
  return instance?.get ? instance.get({ plain: true }) : instance ?? null;
}

function formatUser(user) {
  if (!user) {
    return null;
  }
  const plain = toPlain(user);
  const fullName = [plain.firstName, plain.lastName].filter(Boolean).join(' ').trim();
  return {
    id: plain.id,
    name: fullName || plain.email || 'Team member',
    email: plain.email ?? null
  };
}

function normaliseTask(task) {
  const plain = toPlain(task);
  if (!plain) return null;
  return {
    id: plain.id,
    title: plain.title,
    description: plain.description ?? null,
    status: plain.status,
    statusLabel: TASK_STATUS_LABELS.get(plain.status) ?? plain.status,
    priority: plain.priority,
    priorityLabel: TASK_PRIORITY_LABELS.get(plain.priority) ?? plain.priority,
    stage: plain.stage,
    stageLabel: STAGE_LABELS.get(plain.stage) ?? plain.stage,
    dueDate: plain.dueDate ? new Date(plain.dueDate).toISOString() : null,
    completedAt: plain.completedAt ? new Date(plain.completedAt).toISOString() : null,
    owner: formatUser(task.owner),
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null
  };
}

function normaliseRequirement(requirement) {
  const plain = toPlain(requirement);
  if (!plain) return null;
  return {
    id: plain.id,
    name: plain.name,
    description: plain.description ?? null,
    type: plain.type,
    typeLabel: REQUIREMENT_TYPE_LABELS.get(plain.type) ?? plain.type,
    status: plain.status,
    statusLabel: REQUIREMENT_STATUS_LABELS.get(plain.status) ?? plain.status,
    stage: plain.stage,
    stageLabel: STAGE_LABELS.get(plain.stage) ?? plain.stage,
    dueDate: plain.dueDate ? new Date(plain.dueDate).toISOString() : null,
    completedAt: plain.completedAt ? new Date(plain.completedAt).toISOString() : null,
    reviewer: formatUser(requirement.reviewer),
    externalUrl: plain.externalUrl ?? null,
    documentId: plain.documentId ?? null,
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null
  };
}

function normaliseNote(note) {
  const plain = toPlain(note);
  if (!plain) return null;
  return {
    id: plain.id,
    type: plain.type,
    typeLabel: NOTE_TYPE_LABELS.get(plain.type) ?? plain.type,
    stage: plain.stage,
    stageLabel: STAGE_LABELS.get(plain.stage) ?? plain.stage,
    visibility: plain.visibility,
    visibilityLabel: NOTE_VISIBILITY_LABELS.get(plain.visibility) ?? plain.visibility,
    summary: plain.summary,
    body: plain.body ?? null,
    followUpAt: plain.followUpAt ? new Date(plain.followUpAt).toISOString() : null,
    author: formatUser(note.author),
    createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
    updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null
  };
}

function computeSummary({ profile, tasks = [], requirements = [], notes = [] }) {
  const stage = profile?.onboardingStage ?? 'intake';
  const status = profile?.status ?? 'prospect';

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.status === 'completed').length;
  const blockedTasks = tasks.filter((task) => task.status === 'blocked').length;

  const totalRequirements = requirements.length;
  const satisfiedRequirements = requirements.filter((item) => REQUIREMENT_COMPLETE_STATUSES.has(item.status)).length;

  const totalUnits = totalTasks + totalRequirements;
  const progressRatio = totalUnits > 0 ? (completedTasks + satisfiedRequirements) / totalUnits : 0;

  const nextTaskDeadline = tasks
    .filter((task) => task.dueDate && task.status !== 'completed')
    .map((task) => new Date(task.dueDate).getTime())
    .filter((timestamp) => Number.isFinite(timestamp))
    .sort((a, b) => a - b)[0];

  const nextRequirementDeadline = requirements
    .filter((requirement) => requirement.dueDate && !REQUIREMENT_COMPLETE_STATUSES.has(requirement.status))
    .map((requirement) => new Date(requirement.dueDate).getTime())
    .filter((timestamp) => Number.isFinite(timestamp))
    .sort((a, b) => a - b)[0];

  const nextDeadlineTimestamp = [nextTaskDeadline, nextRequirementDeadline]
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b)[0];

  const lastNote = notes
    .map((note) => (note.createdAt ? new Date(note.createdAt).getTime() : null))
    .filter((timestamp) => Number.isFinite(timestamp))
    .sort((a, b) => b - a)[0];

  return {
    stage,
    stageLabel: STAGE_LABELS.get(stage) ?? stage,
    status,
    statusLabel: PROVIDER_STATUS_LABELS.get(status) ?? status,
    totals: {
      tasks: totalTasks,
      tasksCompleted: completedTasks,
      tasksBlocked: blockedTasks,
      requirements: totalRequirements,
      requirementsSatisfied: satisfiedRequirements
    },
    progress: {
      ratio: Number(progressRatio.toFixed(3)),
      percentage: Math.round(progressRatio * 100)
    },
    nextDeadline: nextDeadlineTimestamp ? new Date(nextDeadlineTimestamp).toISOString() : null,
    lastUpdated: lastNote ? new Date(lastNote).toISOString() : profile?.updatedAt ?? null
  };
}

function sanitiseStage(stage) {
  return STAGE_LABELS.has(stage) ? stage : 'intake';
}

function sanitiseTaskStatus(status) {
  return TASK_STATUS_LABELS.has(status) ? status : 'not_started';
}

function sanitiseTaskPriority(priority) {
  return TASK_PRIORITY_LABELS.has(priority) ? priority : 'medium';
}

function sanitiseRequirementType(type) {
  return REQUIREMENT_TYPE_LABELS.has(type) ? type : 'document';
}

function sanitiseRequirementStatus(status) {
  return REQUIREMENT_STATUS_LABELS.has(status) ? status : 'pending';
}

function sanitiseNoteType(type) {
  return NOTE_TYPE_LABELS.has(type) ? type : 'note';
}

function sanitiseNoteVisibility(visibility) {
  return NOTE_VISIBILITY_LABELS.has(visibility) ? visibility : 'internal';
}

function normalisePayloadDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function getOnboardingWorkspace({ companyId, actor } = {}) {
  const { company } = await resolveCompanyForActor({ companyId, actor });
  const profile = await ProviderProfile.findOne({ where: { companyId: company.id } });

  const [tasksRaw, requirementsRaw, notesRaw] = await Promise.all([
    ProviderOnboardingTask.findAll({
      where: { companyId: company.id },
      order: [
        ['status', 'ASC'],
        ['dueDate', 'ASC NULLS LAST'],
        ['createdAt', 'DESC']
      ],
      include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] }]
    }),
    ProviderOnboardingRequirement.findAll({
      where: { companyId: company.id },
      order: [
        ['status', 'ASC'],
        ['dueDate', 'ASC NULLS LAST'],
        ['createdAt', 'DESC']
      ],
      include: [{ model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] }]
    }),
    ProviderOnboardingNote.findAll({
      where: { companyId: company.id },
      order: [['createdAt', 'DESC']],
      include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] }]
    })
  ]);

  const tasks = tasksRaw.map(normaliseTask).filter(Boolean);
  const requirements = requirementsRaw.map(normaliseRequirement).filter(Boolean);
  const notes = notesRaw.map(normaliseNote).filter(Boolean);
  const summary = computeSummary({ profile: toPlain(profile), tasks, requirements, notes });

  return {
    data: {
      company: {
        id: company.id,
        name: profile?.displayName ?? company.contactName ?? 'Provider',
        tradingName: profile?.tradingName ?? company.contactName ?? null,
        supportEmail: profile?.supportEmail ?? company.contactEmail ?? null,
        supportPhone: profile?.supportPhone ?? null,
        stage: summary.stage,
        stageLabel: summary.stageLabel,
        status: summary.status,
        statusLabel: summary.statusLabel
      },
      summary,
      tasks,
      requirements,
      notes,
      enums: {
        stages: STAGE_OPTIONS,
        taskStatuses: TASK_STATUS_OPTIONS,
        taskPriorities: TASK_PRIORITY_OPTIONS,
        requirementTypes: REQUIREMENT_TYPE_OPTIONS,
        requirementStatuses: REQUIREMENT_STATUS_OPTIONS,
        noteTypes: NOTE_TYPE_OPTIONS,
        noteVisibilities: NOTE_VISIBILITY_OPTIONS
      }
    },
    meta: {
      companyId: company.id,
      generatedAt: new Date().toISOString()
    }
  };
}

export async function upsertOnboardingTask({ companyId, actor, taskId = null, payload = {} }) {
  const { company, actor: actorRecord } = await resolveCompanyForActor({ companyId, actor });

  let task;
  if (taskId) {
    task = await ProviderOnboardingTask.findOne({ where: { id: taskId, companyId: company.id } });
    if (!task) {
      throw buildHttpError(404, 'task_not_found');
    }
  } else {
    task = ProviderOnboardingTask.build({ companyId: company.id, createdBy: actorRecord.id });
  }

  task.title = payload.title ?? task.title;
  task.description = payload.description ?? task.description ?? null;
  task.stage = sanitiseStage(payload.stage ?? task.stage);
  task.priority = sanitiseTaskPriority(payload.priority ?? task.priority);
  task.status = sanitiseTaskStatus(payload.status ?? task.status);
  task.ownerId = payload.ownerId ?? task.ownerId ?? null;
  task.dueDate = normalisePayloadDate(payload.dueDate);
  task.updatedBy = actorRecord.id;

  if (task.status === 'completed' && !task.completedAt) {
    task.completedAt = new Date();
  }
  if (task.status !== 'completed') {
    task.completedAt = null;
  }

  await task.save();

  const saved = await ProviderOnboardingTask.findByPk(task.id, {
    include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] }]
  });

  return normaliseTask(saved);
}

export async function updateTaskStatus({ companyId, actor, taskId, status }) {
  const normalisedStatus = sanitiseTaskStatus(status);
  const { company, actor: actorRecord } = await resolveCompanyForActor({ companyId, actor });
  const task = await ProviderOnboardingTask.findOne({ where: { id: taskId, companyId: company.id } });

  if (!task) {
    throw buildHttpError(404, 'task_not_found');
  }

  task.status = normalisedStatus;
  task.updatedBy = actorRecord.id;
  task.completedAt = normalisedStatus === 'completed' ? new Date() : null;

  await task.save();

  const saved = await ProviderOnboardingTask.findByPk(task.id, {
    include: [{ model: User, as: 'owner', attributes: ['id', 'firstName', 'lastName', 'email'] }]
  });

  return normaliseTask(saved);
}

export async function deleteTask({ companyId, actor, taskId }) {
  const { company } = await resolveCompanyForActor({ companyId, actor });
  const deleted = await ProviderOnboardingTask.destroy({ where: { id: taskId, companyId: company.id } });
  if (!deleted) {
    throw buildHttpError(404, 'task_not_found');
  }
  return { status: 'deleted' };
}

export async function upsertRequirement({ companyId, actor, requirementId = null, payload = {} }) {
  const { company, actor: actorRecord } = await resolveCompanyForActor({ companyId, actor });

  let requirement;
  if (requirementId) {
    requirement = await ProviderOnboardingRequirement.findOne({
      where: { id: requirementId, companyId: company.id }
    });
    if (!requirement) {
      throw buildHttpError(404, 'requirement_not_found');
    }
  } else {
    requirement = ProviderOnboardingRequirement.build({ companyId: company.id, createdBy: actorRecord.id });
  }

  requirement.name = payload.name ?? requirement.name;
  requirement.description = payload.description ?? requirement.description ?? null;
  requirement.type = sanitiseRequirementType(payload.type ?? requirement.type);
  requirement.stage = sanitiseStage(payload.stage ?? requirement.stage);
  requirement.status = sanitiseRequirementStatus(payload.status ?? requirement.status);
  requirement.reviewerId = payload.reviewerId ?? requirement.reviewerId ?? null;
  requirement.documentId = payload.documentId ?? requirement.documentId ?? null;
  requirement.externalUrl = payload.externalUrl ?? requirement.externalUrl ?? null;
  requirement.metadata = payload.metadata ?? requirement.metadata ?? {};
  requirement.dueDate = normalisePayloadDate(payload.dueDate);
  requirement.updatedBy = actorRecord.id;

  if (REQUIREMENT_COMPLETE_STATUSES.has(requirement.status) && !requirement.completedAt) {
    requirement.completedAt = new Date();
  }
  if (!REQUIREMENT_COMPLETE_STATUSES.has(requirement.status)) {
    requirement.completedAt = null;
  }

  await requirement.save();

  const saved = await ProviderOnboardingRequirement.findByPk(requirement.id, {
    include: [{ model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] }]
  });

  return normaliseRequirement(saved);
}

export async function updateRequirementStatus({ companyId, actor, requirementId, status }) {
  const normalisedStatus = sanitiseRequirementStatus(status);
  const { company, actor: actorRecord } = await resolveCompanyForActor({ companyId, actor });
  const requirement = await ProviderOnboardingRequirement.findOne({
    where: { id: requirementId, companyId: company.id }
  });

  if (!requirement) {
    throw buildHttpError(404, 'requirement_not_found');
  }

  requirement.status = normalisedStatus;
  requirement.updatedBy = actorRecord.id;
  requirement.completedAt = REQUIREMENT_COMPLETE_STATUSES.has(normalisedStatus) ? new Date() : null;

  await requirement.save();

  const saved = await ProviderOnboardingRequirement.findByPk(requirement.id, {
    include: [{ model: User, as: 'reviewer', attributes: ['id', 'firstName', 'lastName', 'email'] }]
  });

  return normaliseRequirement(saved);
}

export async function deleteRequirement({ companyId, actor, requirementId }) {
  const { company } = await resolveCompanyForActor({ companyId, actor });
  const deleted = await ProviderOnboardingRequirement.destroy({
    where: { id: requirementId, companyId: company.id }
  });
  if (!deleted) {
    throw buildHttpError(404, 'requirement_not_found');
  }
  return { status: 'deleted' };
}

export async function createNote({ companyId, actor, payload = {} }) {
  const { company, actor: actorRecord } = await resolveCompanyForActor({ companyId, actor });

  const note = await ProviderOnboardingNote.create({
    companyId: company.id,
    authorId: actorRecord.id,
    type: sanitiseNoteType(payload.type),
    visibility: sanitiseNoteVisibility(payload.visibility),
    stage: sanitiseStage(payload.stage),
    summary: payload.summary,
    body: payload.body ?? null,
    followUpAt: normalisePayloadDate(payload.followUpAt)
  });

  const saved = await ProviderOnboardingNote.findByPk(note.id, {
    include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] }]
  });

  return normaliseNote(saved);
}

export async function searchAssignableUsers(companyId) {
  const users = await User.findAll({
    where: {
      [Op.or]: [{ companyId }, { type: 'admin' }]
    },
    attributes: ['id', 'firstName', 'lastName', 'email'],
    limit: 25
  });
  return users.map(formatUser).filter(Boolean);
}
