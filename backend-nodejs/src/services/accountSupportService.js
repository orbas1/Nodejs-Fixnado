import { Op, fn, col, literal } from 'sequelize';
import { AccountSupportTask, AccountSupportTaskUpdate } from '../models/index.js';
import { createConversation as createSupportConversation } from './communicationsService.js';

const STATUS_VALUES = new Set(['open', 'in_progress', 'waiting_external', 'resolved', 'dismissed']);
const PRIORITY_VALUES = new Set(['low', 'medium', 'high', 'critical']);
const CHANNEL_VALUES = new Set(['concierge', 'email', 'phone', 'slack', 'self_service']);

function supportError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normaliseString(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function normaliseStatus(value, { allowNull = false } = {}) {
  const trimmed = normaliseString(value);
  if (!trimmed) {
    if (allowNull) {
      return null;
    }
    throw supportError('status is required');
  }
  const lowered = trimmed.toLowerCase();
  if (!STATUS_VALUES.has(lowered)) {
    throw supportError(`Unsupported status: ${value}`);
  }
  return lowered;
}

function normalisePriority(value, { allowNull = false } = {}) {
  const trimmed = normaliseString(value);
  if (!trimmed) {
    if (allowNull) {
      return null;
    }
    throw supportError('priority is required');
  }
  const lowered = trimmed.toLowerCase();
  if (!PRIORITY_VALUES.has(lowered)) {
    throw supportError(`Unsupported priority: ${value}`);
  }
  return lowered;
}

function normaliseChannel(value, { allowNull = false } = {}) {
  const trimmed = normaliseString(value);
  if (!trimmed) {
    if (allowNull) {
      return null;
    }
    throw supportError('channel is required');
  }
  const lowered = trimmed.toLowerCase();
  if (!CHANNEL_VALUES.has(lowered)) {
    throw supportError(`Unsupported channel: ${value}`);
  }
  return lowered;
}

function toDate(value, fieldName) {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    throw supportError(`${fieldName} must be a valid ISO date`);
  }
  return parsed;
}

function ensureMetadata(value) {
  if (value == null) {
    return {};
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw supportError('metadata must be an object');
  }
  return value;
}

function serializeUpdate(update) {
  return {
    id: update.id,
    taskId: update.taskId,
    body: update.body,
    status: update.status ?? null,
    attachments: Array.isArray(update.attachments) ? update.attachments : [],
    createdBy: update.createdBy || null,
    createdByRole: update.createdByRole || null,
    createdAt: update.createdAt,
    updatedAt: update.updatedAt
  };
}

function buildConversationUrl(conversationId) {
  if (!conversationId) {
    return null;
  }
  return `/support/conversations/${conversationId}`;
}

function serializeTask(task) {
  const updates = Array.isArray(task.updates)
    ? task.updates
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .map(serializeUpdate)
    : [];

  return {
    id: task.id,
    companyId: task.companyId || null,
    userId: task.userId || null,
    title: task.title,
    summary: task.summary,
    status: task.status,
    priority: task.priority,
    channel: task.channel,
    dueAt: task.dueAt || null,
    assignedTo: task.assignedTo || null,
    assignedToRole: task.assignedToRole || null,
    createdBy: task.createdBy || null,
    createdByRole: task.createdByRole || null,
    updatedBy: task.updatedBy || null,
    resolvedAt: task.resolvedAt || null,
    conversationId: task.conversationId || null,
    conversationUrl: buildConversationUrl(task.conversationId),
    metadata: task.metadata || {},
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    updates
  };
}

async function maybeCreateConversation({ task, payload }) {
  if (!payload?.createConversation || task.conversationId) {
    return task;
  }

  const ownerDescriptor = payload.conversationOwner?.id && payload.conversationOwner?.type
    ? payload.conversationOwner
    : task.companyId
    ? { id: task.companyId, type: 'company' }
    : task.userId
    ? { id: task.userId, type: 'user' }
    : null;

  if (!ownerDescriptor) {
    throw supportError('companyId or userId required to open a support conversation');
  }

  const participants = [];
  if (task.companyId) {
    participants.push({
      participantType: 'company',
      participantReferenceId: task.companyId,
      displayName: payload.companyDisplayName || 'Account admin',
      role: 'customer',
      notificationsEnabled: true
    });
  }
  if (task.userId) {
    participants.push({
      participantType: 'user',
      participantReferenceId: task.userId,
      displayName: payload.userDisplayName || 'Workspace owner',
      role: 'customer',
      notificationsEnabled: true
    });
  }

  if (participants.length === 0) {
    participants.push({
      participantType: 'company',
      participantReferenceId: ownerDescriptor.id,
      displayName: 'Account admin',
      role: 'customer',
      notificationsEnabled: true
    });
  }

  participants.push({
    participantType: 'admin',
    participantReferenceId: payload.supportParticipantId || null,
    displayName: payload.supportDisplayName || 'Fixnado Concierge',
    role: 'support',
    notificationsEnabled: true,
    aiAssistEnabled: true
  });

  const conversation = await createSupportConversation({
    subject: payload.conversationSubject || `Support • ${task.title}`,
    createdBy: ownerDescriptor,
    participants,
    metadata: { taskId: task.id },
    aiAssist: { defaultEnabled: true }
  });

  await task.update({ conversationId: conversation.id });
  return task;
}

export async function listTasks({ companyId, userId, status, includeResolved = false, limit = 25 } = {}) {
  const baseWhere = {};
  if (companyId) {
    baseWhere.companyId = companyId;
  }
  if (userId) {
    baseWhere.userId = userId;
  }

  const filterWhere = { ...baseWhere };
  if (status) {
    filterWhere.status = normaliseStatus(status);
  } else if (!includeResolved) {
    filterWhere.status = { [Op.ne]: 'resolved' };
  }

  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 25, 1), 100);

  const priorityOrder = literal(
    `CASE "AccountSupportTask"."priority" WHEN 'critical' THEN 0 WHEN 'high' THEN 1 WHEN 'medium' THEN 2 ELSE 3 END`
  );
  const dueNullOrder = literal(`CASE WHEN "AccountSupportTask"."due_at" IS NULL THEN 1 ELSE 0 END`);
  const resolvedOrder = literal(`CASE WHEN "AccountSupportTask"."status" = 'resolved' THEN 1 ELSE 0 END`);

  const tasks = await AccountSupportTask.findAll({
    where: filterWhere,
    include: [
      {
        model: AccountSupportTaskUpdate,
        as: 'updates',
        separate: true,
        order: [['createdAt', 'ASC']]
      }
    ],
    order: [
      [resolvedOrder, 'ASC'],
      [dueNullOrder, 'ASC'],
      ['dueAt', 'ASC'],
      [priorityOrder, 'ASC'],
      ['createdAt', 'DESC']
    ],
    limit: safeLimit
  });

  const countsRaw = await AccountSupportTask.findAll({
    where: baseWhere,
    attributes: ['status', [fn('COUNT', col('id')), 'count']],
    group: ['status']
  });

  const stats = {
    open: 0,
    inProgress: 0,
    waitingExternal: 0,
    resolved: 0,
    dismissed: 0
  };

  countsRaw.forEach((row) => {
    const statusKey = row.get('status');
    const count = Number.parseInt(row.get('count'), 10) || 0;
    if (statusKey === 'open') stats.open = count;
    if (statusKey === 'in_progress') stats.inProgress = count;
    if (statusKey === 'waiting_external') stats.waitingExternal = count;
    if (statusKey === 'resolved') stats.resolved = count;
    if (statusKey === 'dismissed') stats.dismissed = count;
  });

  return {
    tasks: tasks.map(serializeTask),
    meta: {
      total: stats.open + stats.inProgress + stats.waitingExternal + stats.resolved + stats.dismissed,
      ...stats
    }
  };
}

export async function createTask(payload = {}) {
  const title = normaliseString(payload.title);
  const summary = normaliseString(payload.summary);
  if (!title) {
    throw supportError('title is required');
  }
  if (!summary) {
    throw supportError('summary is required');
  }

  const taskPayload = {
    companyId: normaliseString(payload.companyId) || null,
    userId: normaliseString(payload.userId) || null,
    title,
    summary,
    status: payload.status ? normaliseStatus(payload.status, { allowNull: true }) || 'open' : 'open',
    priority: payload.priority ? normalisePriority(payload.priority) : 'medium',
    channel: payload.channel ? normaliseChannel(payload.channel) : 'concierge',
    dueAt: toDate(payload.dueAt, 'dueAt'),
    assignedTo: normaliseString(payload.assignedTo),
    assignedToRole: normaliseString(payload.assignedToRole),
    createdBy: normaliseString(payload.createdBy),
    createdByRole: normaliseString(payload.createdByRole),
    updatedBy: normaliseString(payload.updatedBy),
    resolvedAt: toDate(payload.resolvedAt, 'resolvedAt'),
    conversationId: normaliseString(payload.conversationId),
    metadata: ensureMetadata(payload.metadata)
  };

  if (!taskPayload.companyId && !taskPayload.userId) {
    throw supportError('companyId or userId is required to create a support task');
  }

  const task = await AccountSupportTask.create(taskPayload);
  await maybeCreateConversation({ task, payload });
  const withUpdates = await AccountSupportTask.findByPk(task.id, {
    include: [{ model: AccountSupportTaskUpdate, as: 'updates', order: [['createdAt', 'ASC']] }]
  });
  return serializeTask(withUpdates);
}

export async function updateTask(taskId, updates = {}) {
  const trimmedId = normaliseString(taskId);
  if (!trimmedId) {
    throw supportError('taskId is required');
  }

  const task = await AccountSupportTask.findByPk(trimmedId, {
    include: [{ model: AccountSupportTaskUpdate, as: 'updates', order: [['createdAt', 'ASC']] }]
  });
  if (!task) {
    throw supportError('Support task not found', 404);
  }

  const nextValues = {};

  if (Object.prototype.hasOwnProperty.call(updates, 'title')) {
    const title = normaliseString(updates.title);
    if (!title) {
      throw supportError('title cannot be empty');
    }
    nextValues.title = title;
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'summary')) {
    const summary = normaliseString(updates.summary);
    if (!summary) {
      throw supportError('summary cannot be empty');
    }
    nextValues.summary = summary;
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'status')) {
    const status = updates.status ? normaliseStatus(updates.status, { allowNull: true }) : null;
    if (status) {
      nextValues.status = status;
      if (status === 'resolved' && !updates.resolvedAt && !task.resolvedAt) {
        nextValues.resolvedAt = new Date();
      }
    }
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'priority')) {
    nextValues.priority = normalisePriority(updates.priority, { allowNull: false });
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'channel')) {
    nextValues.channel = normaliseChannel(updates.channel, { allowNull: false });
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'dueAt')) {
    nextValues.dueAt = toDate(updates.dueAt, 'dueAt');
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'assignedTo')) {
    nextValues.assignedTo = normaliseString(updates.assignedTo);
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'assignedToRole')) {
    nextValues.assignedToRole = normaliseString(updates.assignedToRole);
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'createdBy')) {
    nextValues.createdBy = normaliseString(updates.createdBy);
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'createdByRole')) {
    nextValues.createdByRole = normaliseString(updates.createdByRole);
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'updatedBy')) {
    nextValues.updatedBy = normaliseString(updates.updatedBy);
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'resolvedAt')) {
    nextValues.resolvedAt = toDate(updates.resolvedAt, 'resolvedAt');
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'conversationId')) {
    nextValues.conversationId = normaliseString(updates.conversationId);
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'metadata')) {
    nextValues.metadata = ensureMetadata(updates.metadata);
  }

  if (Object.keys(nextValues).length === 0) {
    return serializeTask(task);
  }

  await task.update(nextValues);
  await maybeCreateConversation({ task, payload: updates });
  await task.reload({ include: [{ model: AccountSupportTaskUpdate, as: 'updates', order: [['createdAt', 'ASC']] }] });
  return serializeTask(task);
}

export async function appendTaskUpdate(taskId, payload = {}) {
  const trimmedId = normaliseString(taskId);
  if (!trimmedId) {
    throw supportError('taskId is required');
  }

  const task = await AccountSupportTask.findByPk(trimmedId, {
    include: [{ model: AccountSupportTaskUpdate, as: 'updates', order: [['createdAt', 'ASC']] }]
  });
  if (!task) {
    throw supportError('Support task not found', 404);
  }

  const body = normaliseString(payload.body);
  if (!body) {
    throw supportError('Update body cannot be empty');
  }

  const status = payload.status ? normaliseStatus(payload.status, { allowNull: true }) : null;
  const updateRecord = await AccountSupportTaskUpdate.create({
    taskId: task.id,
    body,
    status,
    attachments: Array.isArray(payload.attachments) ? payload.attachments : [],
    createdBy: normaliseString(payload.createdBy),
    createdByRole: normaliseString(payload.createdByRole)
  });

  if (status && status !== task.status) {
    const updatedValues = { status };
    if (status === 'resolved' && !task.resolvedAt) {
      updatedValues.resolvedAt = new Date();
    }
    if (payload.updatedBy) {
      updatedValues.updatedBy = normaliseString(payload.updatedBy);
    }
    await task.update(updatedValues);
  }

  await task.reload({ include: [{ model: AccountSupportTaskUpdate, as: 'updates', order: [['createdAt', 'ASC']] }] });
  return serializeTask(task, updateRecord);
}

export default {
  listTasks,
  createTask,
  updateTask,
  appendTaskUpdate
};
