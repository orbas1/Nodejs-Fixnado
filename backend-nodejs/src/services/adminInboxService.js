import { randomUUID } from 'node:crypto';
import { Op } from 'sequelize';
import {
  InboxConfiguration,
  InboxQueue,
  InboxTemplate,
  Conversation,
  ConversationMessage,
  ConversationParticipant
} from '../models/index.js';

const DEFAULT_CONFIGURATION = {
  autoAssignEnabled: true,
  quietHoursStart: null,
  quietHoursEnd: null,
  attachmentsEnabled: true,
  maxAttachmentMb: 25,
  allowedFileTypes: ['jpg', 'png', 'pdf'],
  aiAssistEnabled: true,
  aiAssistProvider: 'fixnado-assist',
  firstResponseSlaMinutes: 10,
  resolutionSlaMinutes: 120,
  escalationPolicy: { levelOneMinutes: 15, levelTwoMinutes: 45 },
  brandColor: '#0ea5e9',
  signature: null,
  roleRestrictions: []
};

function validationError(message, details = []) {
  const error = new Error(message);
  error.name = 'ValidationError';
  error.status = 422;
  error.details = details;
  return error;
}

function notFoundError(message) {
  const error = new Error(message);
  error.name = 'NotFoundError';
  error.status = 404;
  return error;
}

function slugify(value) {
  if (!value) {
    return '';
  }
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

function uniqueStringArray(values = []) {
  const seen = new Set();
  const output = [];
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
    if (!trimmed) continue;
    const normalised = trimmed.toLowerCase();
    if (seen.has(normalised)) continue;
    seen.add(normalised);
    output.push(trimmed);
  }
  return output;
}

async function ensureConfiguration(transaction) {
  const existing = await InboxConfiguration.findOne({ transaction });
  if (existing) {
    return existing;
  }

  const created = await InboxConfiguration.create(
    {
      ...DEFAULT_CONFIGURATION,
      id: randomUUID(),
      updatedBy: 'system'
    },
    { transaction }
  );
  return created;
}

function mapQueue(queue) {
  return queue?.toJSON ? queue.toJSON() : queue;
}

function mapTemplate(template) {
  return template?.toJSON ? template.toJSON() : template;
}

function sanitizeTimeString(value) {
  if (value == null || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    throw validationError('Time values must be strings in HH:MM format.');
  }
  const trimmed = value.trim();
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(trimmed)) {
    throw validationError('Quiet hour values must use HH:MM format.');
  }
  return trimmed;
}

function sanitizePositiveInteger(value, fallback, field) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    if (fallback != null) {
      return fallback;
    }
    throw validationError(`${field} must be a positive integer.`);
  }
  return numeric;
}

function sanitizeEscalationPolicy(input, current = DEFAULT_CONFIGURATION.escalationPolicy) {
  if (!input || typeof input !== 'object') {
    return { ...current };
  }
  const levelOne = sanitizePositiveInteger(input.levelOneMinutes ?? current.levelOneMinutes, current.levelOneMinutes, 'Escalation level one');
  const levelTwo = sanitizePositiveInteger(input.levelTwoMinutes ?? current.levelTwoMinutes, current.levelTwoMinutes, 'Escalation level two');
  return { levelOneMinutes: levelOne, levelTwoMinutes: levelTwo };
}

function sanitizeRoleRestrictions(restrictions = [], current = []) {
  if (!Array.isArray(restrictions)) {
    return current;
  }
  const cleaned = [];
  for (const entry of restrictions) {
    if (!entry || typeof entry !== 'object') {
      continue;
    }
    const role = typeof entry.role === 'string' ? entry.role.trim() : '';
    if (!role) {
      continue;
    }
    cleaned.push({
      role,
      canAssign: entry.canAssign !== false,
      canResolve: entry.canResolve !== false
    });
  }
  return cleaned;
}

function normaliseChannelList(channels = []) {
  const list = Array.isArray(channels) ? channels : [channels];
  if (list.length === 0) {
    return ['in-app'];
  }
  return uniqueStringArray(list).map((item) => item.toLowerCase());
}

function normaliseRoleList(roles = []) {
  const list = Array.isArray(roles) ? roles : [roles];
  if (list.length === 0) {
    return ['support'];
  }
  return uniqueStringArray(list).map((role) => role.toLowerCase());
}

function ensureHexColour(value) {
  if (!value) {
    return null;
  }
  const trimmed = value.trim();
  if (!/^#?[0-9a-fA-F]{3,8}$/.test(trimmed)) {
    throw validationError('Accent colour must be a valid hex code.');
  }
  return trimmed.startsWith('#') ? trimmed : `#${trimmed}`;
}

export async function loadInboxAdminSnapshot() {
  const [configuration, queues, templates] = await Promise.all([
    ensureConfiguration(),
    InboxQueue.findAll({ order: [['name', 'ASC']] }),
    InboxTemplate.findAll({ order: [['updated_at', 'DESC']] })
  ]);

  const metrics = await computeInboxMetrics(queues, templates);

  return {
    configuration: mapQueue(configuration),
    queues: queues.map(mapQueue),
    templates: templates.map(mapTemplate),
    metrics
  };
}

async function computeInboxMetrics(queues, templates = []) {
  if (!queues.length) {
    const templateActive = templates.filter((template) => template.isActive !== false).length;
    return {
      totals: {
        queues: 0,
        backlog: 0,
        awaitingResponse: 0,
        breachRisk: 0,
        conversationsWithoutAssignment: 0,
        averageFirstResponseMinutes: null,
        templatesActive: templateActive,
        templatesInactive: templates.length - templateActive
      },
      queues: []
    };
  }

  const queueIds = queues.map((queue) => queue.id);
  const conversations = await Conversation.findAll({
    where: { queueId: { [Op.in]: queueIds } },
    attributes: ['id', 'queueId', 'createdAt'],
    order: [['createdAt', 'ASC']]
  });

  if (!conversations.length) {
    const templateActive = templates.filter((template) => template.isActive !== false).length;
    return {
      totals: {
        queues: queues.length,
        backlog: 0,
        awaitingResponse: 0,
        breachRisk: 0,
        conversationsWithoutAssignment: 0,
        averageFirstResponseMinutes: null,
        templatesActive: templateActive,
        templatesInactive: templates.length - templateActive
      },
      queues: queues.map((queue) => ({
        id: queue.id,
        name: queue.name,
        backlog: 0,
        awaitingResponse: 0,
        breachRisk: 0,
        averageFirstResponseMinutes: null,
        autoResponderEnabled: queue.autoResponderEnabled,
        allowedRoles: queue.allowedRoles ?? ['support']
      }))
    };
  }

  const conversationIds = conversations.map((conversation) => conversation.id);

  const [messages, participants] = await Promise.all([
    ConversationMessage.findAll({
      where: { conversationId: { [Op.in]: conversationIds } },
      attributes: ['conversationId', 'senderParticipantId', 'messageType', 'createdAt'],
      order: [['createdAt', 'ASC']]
    }),
    ConversationParticipant.findAll({
      where: { conversationId: { [Op.in]: conversationIds } },
      attributes: ['conversationId', 'id', 'role']
    })
  ]);

  const messagesByConversation = new Map();
  messages.forEach((message) => {
    if (!messagesByConversation.has(message.conversationId)) {
      messagesByConversation.set(message.conversationId, []);
    }
    messagesByConversation.get(message.conversationId).push(message);
  });

  const participantsByConversation = new Map();
  const participantRoleById = new Map();
  participants.forEach((participant) => {
    if (!participantsByConversation.has(participant.conversationId)) {
      participantsByConversation.set(participant.conversationId, []);
    }
    participantsByConversation.get(participant.conversationId).push(participant);
    participantRoleById.set(participant.id, participant.role);
  });

  const now = Date.now();
  let backlog = 0;
  let awaitingResponse = 0;
  let breachRisk = 0;
  let conversationsWithoutAssignment = 0;
  const responseTimes = [];
  const queueSummaries = [];

  queues.forEach((queue) => {
    const queueConversations = conversations.filter((conversation) => conversation.queueId === queue.id);
    const queueAllowedRoles = new Set(normaliseRoleList(queue.allowedRoles ?? ['support']));
    let queueAwaiting = 0;
    let queueBreaches = 0;
    let queueUnassigned = 0;
    const queueResponses = [];

    queueConversations.forEach((conversation) => {
      backlog += 1;
      const convMessages = messagesByConversation.get(conversation.id) ?? [];
      const convParticipants = participantsByConversation.get(conversation.id) ?? [];
      const hasSupport = convParticipants.some((participant) => queueAllowedRoles.has((participant.role ?? '').toLowerCase()));
      if (!hasSupport) {
        queueUnassigned += 1;
        conversationsWithoutAssignment += 1;
      }

      if (convMessages.length === 0) {
        queueAwaiting += 1;
        awaitingResponse += 1;
        return;
      }

      const lastMessage = convMessages[convMessages.length - 1];
      const lastSenderRole = participantRoleById.get(lastMessage.senderParticipantId ?? '') ?? lastMessage.messageType;
      const isSupportLast = queueAllowedRoles.has((lastSenderRole ?? '').toLowerCase()) || lastMessage.messageType === 'assistant';
      if (!isSupportLast) {
        queueAwaiting += 1;
        awaitingResponse += 1;
        const diff = now - new Date(lastMessage.createdAt).getTime();
        if (queue.slaMinutes && Number.isFinite(queue.slaMinutes) && diff > queue.slaMinutes * 60_000) {
          queueBreaches += 1;
          breachRisk += 1;
        }
      }

      let firstCustomerMessageAt = null;
      let firstSupportResponseAt = null;
      for (const message of convMessages) {
        const senderRole = participantRoleById.get(message.senderParticipantId ?? '') ?? message.messageType;
        const isSupportMessage = queueAllowedRoles.has((senderRole ?? '').toLowerCase()) || message.messageType === 'assistant';
        if (!isSupportMessage && !firstCustomerMessageAt) {
          firstCustomerMessageAt = new Date(message.createdAt);
          continue;
        }
        if (firstCustomerMessageAt && isSupportMessage) {
          firstSupportResponseAt = new Date(message.createdAt);
          break;
        }
      }

      if (firstCustomerMessageAt && firstSupportResponseAt) {
        const diffMinutes = (firstSupportResponseAt.getTime() - firstCustomerMessageAt.getTime()) / 60000;
        if (Number.isFinite(diffMinutes)) {
          const rounded = Number(diffMinutes.toFixed(2));
          queueResponses.push(rounded);
          responseTimes.push(rounded);
        }
      }
    });

    queueSummaries.push({
      id: queue.id,
      name: queue.name,
      backlog: queueConversations.length,
      awaitingResponse: queueAwaiting,
      breachRisk: queueBreaches,
      conversationsWithoutAssignment: queueUnassigned,
      averageFirstResponseMinutes:
        queueResponses.length > 0
          ? Number((queueResponses.reduce((sum, value) => sum + value, 0) / queueResponses.length).toFixed(2))
          : null,
      autoResponderEnabled: queue.autoResponderEnabled,
      allowedRoles: queue.allowedRoles ?? ['support']
    });
  });

  const templateActive = templates.filter((template) => template.isActive !== false).length;
  const averageFirstResponseMinutes =
    responseTimes.length > 0
      ? Number((responseTimes.reduce((sum, value) => sum + value, 0) / responseTimes.length).toFixed(2))
      : null;

  return {
    totals: {
      queues: queues.length,
      backlog,
      awaitingResponse,
      breachRisk,
      conversationsWithoutAssignment,
      averageFirstResponseMinutes,
      templatesActive: templateActive,
      templatesInactive: templates.length - templateActive
    },
    queues: queueSummaries
  };
}

export async function summariseInboxForDashboard() {
  const snapshot = await loadInboxAdminSnapshot();
  const { configuration, queues, metrics } = snapshot;
  const defaultQueue = queues.find((queue) => queue.id === configuration.defaultQueueId) ?? null;
  const quietHours =
    configuration.quietHoursStart && configuration.quietHoursEnd
      ? `${configuration.quietHoursStart} – ${configuration.quietHoursEnd}`
      : 'Not configured';

  return {
    metrics: metrics.totals,
    queues: metrics.queues.slice(0, 6),
    configuration: {
      autoAssignEnabled: configuration.autoAssignEnabled,
      attachmentsEnabled: configuration.attachmentsEnabled,
      aiAssistEnabled: configuration.aiAssistEnabled,
      defaultQueue: defaultQueue ? defaultQueue.name : 'Unassigned',
      quietHours,
      maxAttachmentMb: configuration.maxAttachmentMb,
      allowedFileTypes: configuration.allowedFileTypes
    }
  };
}

export async function updateInboxConfiguration(payload = {}, actor = 'system') {
  const configuration = await ensureConfiguration();

  if (payload.defaultQueueId) {
    const queue = await InboxQueue.findByPk(payload.defaultQueueId);
    if (!queue) {
      throw validationError('Default queue not found.');
    }
  }

  const next = {
    autoAssignEnabled: payload.autoAssignEnabled != null ? Boolean(payload.autoAssignEnabled) : configuration.autoAssignEnabled,
    quietHoursStart: payload.quietHoursStart !== undefined ? sanitizeTimeString(payload.quietHoursStart) : configuration.quietHoursStart,
    quietHoursEnd: payload.quietHoursEnd !== undefined ? sanitizeTimeString(payload.quietHoursEnd) : configuration.quietHoursEnd,
    attachmentsEnabled: payload.attachmentsEnabled != null ? Boolean(payload.attachmentsEnabled) : configuration.attachmentsEnabled,
    maxAttachmentMb: sanitizePositiveInteger(
      payload.maxAttachmentMb ?? configuration.maxAttachmentMb,
      configuration.maxAttachmentMb,
      'Max attachment size'
    ),
    allowedFileTypes: payload.allowedFileTypes ? uniqueStringArray(payload.allowedFileTypes) : configuration.allowedFileTypes,
    aiAssistEnabled: payload.aiAssistEnabled != null ? Boolean(payload.aiAssistEnabled) : configuration.aiAssistEnabled,
    aiAssistProvider:
      typeof payload.aiAssistProvider === 'string'
        ? payload.aiAssistProvider.trim()
        : configuration.aiAssistProvider,
    firstResponseSlaMinutes: sanitizePositiveInteger(
      payload.firstResponseSlaMinutes ?? configuration.firstResponseSlaMinutes,
      configuration.firstResponseSlaMinutes,
      'First response SLA'
    ),
    resolutionSlaMinutes: sanitizePositiveInteger(
      payload.resolutionSlaMinutes ?? configuration.resolutionSlaMinutes,
      configuration.resolutionSlaMinutes,
      'Resolution SLA'
    ),
    escalationPolicy: sanitizeEscalationPolicy(payload.escalationPolicy, configuration.escalationPolicy),
    brandColor: payload.brandColor !== undefined ? ensureHexColour(payload.brandColor) : configuration.brandColor,
    signature:
      payload.signature !== undefined && payload.signature !== null
        ? String(payload.signature).trim() || null
        : configuration.signature,
    roleRestrictions: sanitizeRoleRestrictions(payload.roleRestrictions, configuration.roleRestrictions),
    defaultQueueId: payload.defaultQueueId ?? configuration.defaultQueueId
  };

  if (!next.allowedFileTypes || next.allowedFileTypes.length === 0) {
    next.allowedFileTypes = configuration.allowedFileTypes ?? DEFAULT_CONFIGURATION.allowedFileTypes;
  }

  await configuration.update({
    autoAssignEnabled: next.autoAssignEnabled,
    quietHoursStart: next.quietHoursStart,
    quietHoursEnd: next.quietHoursEnd,
    attachmentsEnabled: next.attachmentsEnabled,
    maxAttachmentMb: next.maxAttachmentMb,
    allowedFileTypes: next.allowedFileTypes,
    aiAssistEnabled: next.aiAssistEnabled,
    aiAssistProvider: next.aiAssistProvider,
    firstResponseSlaMinutes: next.firstResponseSlaMinutes,
    resolutionSlaMinutes: next.resolutionSlaMinutes,
    escalationPolicy: next.escalationPolicy,
    brandColor: next.brandColor,
    signature: next.signature,
    roleRestrictions: next.roleRestrictions,
    defaultQueueId: next.defaultQueueId,
    updatedBy: actor || 'system'
  });

  await configuration.reload();
  return mapQueue(configuration);
}

async function ensureQueueSlug(name, existingId = null) {
  let baseSlug = slugify(name);
  if (!baseSlug) {
    throw validationError('Queue name must contain letters or numbers.');
  }

  let candidate = baseSlug;
  let suffix = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const conflict = await InboxQueue.findOne({
      where: existingId
        ? { slug: candidate, id: { [Op.ne]: existingId } }
        : { slug: candidate }
    });
    if (!conflict) {
      return candidate;
    }
    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

export async function upsertInboxQueue(payload = {}, actor = 'system') {
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  if (name.length < 3) {
    throw validationError('Queue name must be at least three characters long.');
  }

  const description = typeof payload.description === 'string' ? payload.description.trim() : null;
  const slaMinutes = sanitizePositiveInteger(payload.slaMinutes ?? 15, 15, 'SLA minutes');
  const escalationMinutes = sanitizePositiveInteger(payload.escalationMinutes ?? 45, 45, 'Escalation minutes');
  const allowedRoles = normaliseRoleList(payload.allowedRoles ?? ['support']);
  const autoResponderEnabled = payload.autoResponderEnabled !== undefined ? Boolean(payload.autoResponderEnabled) : true;
  const triageFormUrl = typeof payload.triageFormUrl === 'string' ? payload.triageFormUrl.trim() || null : null;
  const channels = normaliseChannelList(payload.channels ?? ['in-app']);
  const accentColor = payload.accentColor !== undefined ? ensureHexColour(payload.accentColor) : null;

  let queue;
  if (payload.id) {
    queue = await InboxQueue.findByPk(payload.id);
    if (!queue) {
      throw notFoundError('Inbox queue not found.');
    }
    const slug = await ensureQueueSlug(name, queue.id);
    await queue.update({
      name,
      slug,
      description,
      slaMinutes,
      escalationMinutes,
      allowedRoles,
      autoResponderEnabled,
      triageFormUrl,
      channels,
      accentColor,
      updatedBy: actor || 'system'
    });
    await queue.reload();
    return mapQueue(queue);
  }

  const slug = await ensureQueueSlug(name);
  queue = await InboxQueue.create({
    name,
    slug,
    description,
    slaMinutes,
    escalationMinutes,
    allowedRoles,
    autoResponderEnabled,
    triageFormUrl,
    channels,
    accentColor,
    updatedBy: actor || 'system'
  });
  return mapQueue(queue);
}

export async function deleteInboxQueue(queueId) {
  if (!queueId) {
    throw validationError('Queue id is required.');
  }
  const queue = await InboxQueue.findByPk(queueId);
  if (!queue) {
    throw notFoundError('Inbox queue not found.');
  }

  const configuration = await ensureConfiguration();
  if (configuration.defaultQueueId === queueId) {
    configuration.defaultQueueId = null;
    configuration.updatedBy = 'system';
    await configuration.save();
  }

  await Conversation.update({ queueId: null }, { where: { queueId } });
  await queue.destroy();
}

export async function upsertInboxTemplate(payload = {}, actor = 'system') {
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  if (name.length < 3) {
    throw validationError('Template name must be at least three characters long.');
  }

  const body = typeof payload.body === 'string' ? payload.body.trim() : '';
  if (!body) {
    throw validationError('Template body is required.');
  }

  const queueId = payload.queueId || null;
  if (queueId) {
    const exists = await InboxQueue.findByPk(queueId);
    if (!exists) {
      throw validationError('Associated queue not found for template.');
    }
  }

  const category = typeof payload.category === 'string' ? payload.category.trim() || null : null;
  const locale = typeof payload.locale === 'string' ? payload.locale.trim() || 'en-GB' : 'en-GB';
  const subject = typeof payload.subject === 'string' ? payload.subject.trim() || null : null;
  const tags = uniqueStringArray(payload.tags ?? []);
  const previewImageUrl = typeof payload.previewImageUrl === 'string' ? payload.previewImageUrl.trim() || null : null;
  const isActive = payload.isActive !== undefined ? Boolean(payload.isActive) : true;

  let template;
  if (payload.id) {
    template = await InboxTemplate.findByPk(payload.id);
    if (!template) {
      throw notFoundError('Inbox template not found.');
    }
    await template.update({
      queueId,
      name,
      category,
      locale,
      subject,
      body,
      isActive,
      tags,
      previewImageUrl,
      updatedBy: actor || 'system'
    });
    await template.reload();
    return mapTemplate(template);
  }

  template = await InboxTemplate.create({
    queueId,
    name,
    category,
    locale,
    subject,
    body,
    isActive,
    tags,
    previewImageUrl,
    updatedBy: actor || 'system'
  });
  return mapTemplate(template);
}

export async function deleteInboxTemplate(templateId) {
  if (!templateId) {
    throw validationError('Template id is required.');
  }
  const template = await InboxTemplate.findByPk(templateId);
  if (!template) {
    throw notFoundError('Inbox template not found.');
  }
  await template.destroy();
}
