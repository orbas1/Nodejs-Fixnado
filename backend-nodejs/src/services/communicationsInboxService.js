import config from '../config/index.js';
import {
  sequelize,
  CommunicationsInboxConfiguration,
  CommunicationsEntryPoint,
  CommunicationsQuickReply,
  CommunicationsEscalationRule
} from '../models/index.js';

function communicationsSettingsError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normaliseQuietHour(value) {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  const match = trimmed.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!match) {
    throw communicationsSettingsError(`Quiet hour value "${value}" must follow HH:mm format`);
  }

  const [, hours, minutes] = match;
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}

function normaliseRoles(list) {
  if (!Array.isArray(list)) {
    return [];
  }

  const unique = new Set();
  for (const role of list) {
    if (typeof role !== 'string') continue;
    const trimmed = role.trim().toLowerCase();
    if (trimmed) {
      unique.add(trimmed);
    }
  }
  return Array.from(unique);
}

function normaliseEntryKey(value) {
  if (typeof value !== 'string') {
    throw communicationsSettingsError('Entry point key is required');
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw communicationsSettingsError('Entry point key is required');
  }

  const key = trimmed
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');

  assertValidEntryKey(key);
  return key;
}

function assertValidEntryKey(key) {
  if (!key) {
    throw communicationsSettingsError('Entry point key must include at least one alphanumeric character');
  }
}

function normaliseEntryPayload(entry = {}) {
  const payload = {};

  if (typeof entry.label === 'string') {
    payload.label = entry.label.trim();
  }
  if (typeof entry.description === 'string') {
    payload.description = entry.description.trim();
  }
  if (typeof entry.icon === 'string') {
    payload.icon = entry.icon.trim().slice(0, 8) || null;
  }
  if (typeof entry.defaultMessage === 'string') {
    payload.defaultMessage = entry.defaultMessage.trim();
  }
  if (typeof entry.imageUrl === 'string') {
    payload.imageUrl = entry.imageUrl.trim() || null;
  }
  if (typeof entry.ctaLabel === 'string') {
    payload.ctaLabel = entry.ctaLabel.trim() || null;
  }
  if (typeof entry.ctaUrl === 'string') {
    payload.ctaUrl = entry.ctaUrl.trim() || null;
  }
  if (Object.hasOwn(entry, 'enabled') && typeof entry.enabled === 'boolean') {
    payload.enabled = entry.enabled;
  }
  if (Object.hasOwn(entry, 'displayOrder')) {
    const parsed = Number.parseInt(entry.displayOrder, 10);
    payload.displayOrder = Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }

  return payload;
}

const DEFAULT_ENTRY_POINTS = [
  {
    key: 'serviceLaunch',
    label: 'Service launch updates',
    description: 'Kick things off with a friendly update when your crew starts.',
    icon: '🚀',
    defaultMessage: 'Hi there! Our team is rolling out to you now. Reply here if you need to tweak anything before we arrive.',
    ctaLabel: 'Track crew',
    ctaUrl: '/dashboard/operations',
    imageUrl: null
  },
  {
    key: 'toolsMaterials',
    label: 'Tools and materials help',
    description: 'Assist customers comparing kits and supplies.',
    icon: '🧰',
    defaultMessage: 'Need clarity on tools or materials? I am right here with specs, stock levels, and pairing advice.',
    ctaLabel: 'Browse catalogue',
    ctaUrl: '/materials',
    imageUrl: null
  },
  {
    key: 'shopFronts',
    label: 'Shop front concierge',
    description: 'Chat widgets embedded on each storefront.',
    icon: '🛍️',
    defaultMessage: 'Welcome in! Tell us what you are looking for and we will match the right service instantly.',
    ctaLabel: 'Open storefront',
    ctaUrl: '/storefronts',
    imageUrl: null
  },
  {
    key: 'businessFronts',
    label: 'Business profile greeter',
    description: 'Nurture enterprise leads visiting your profile.',
    icon: '🏢',
    defaultMessage: 'Thanks for stopping by our Fixnado business profile. Ask for demos, pricing, or timelines and we will respond fast.',
    ctaLabel: 'View case studies',
    ctaUrl: '/enterprise/case-studies',
    imageUrl: null
  },
  {
    key: 'bookingFlow',
    label: 'Booking support',
    description: 'Guide customers through timeslot selection.',
    icon: '📅',
    defaultMessage: 'I am here if you want a hand selecting times or confirming what is included before you book.',
    ctaLabel: 'Review availability',
    ctaUrl: '/bookings',
    imageUrl: null
  },
  {
    key: 'purchaseFlow',
    label: 'Checkout reassurance',
    description: 'Answer last-minute questions at payment.',
    icon: '💳',
    defaultMessage: 'Spot something unclear before you pay? Message us and we will confirm details in seconds.',
    ctaLabel: 'Secure checkout',
    ctaUrl: '/checkout',
    imageUrl: null
  }
];

async function ensureConfiguration(tenantId) {
  if (!tenantId) {
    throw communicationsSettingsError('Tenant identifier is required', 401);
  }

  const communicationsConfig = config.communications || {};
  const defaultQuietHours = communicationsConfig.defaultQuietHours || {};

  const [configuration, created] = await CommunicationsInboxConfiguration.findOrCreate({
    where: { tenantId },
    defaults: {
      tenantId,
      liveRoutingEnabled: true,
      timezone: defaultQuietHours.timezone || 'Europe/London',
      quietHoursStart: defaultQuietHours.start ? normaliseQuietHour(defaultQuietHours.start) : null,
      quietHoursEnd: defaultQuietHours.end ? normaliseQuietHour(defaultQuietHours.end) : null,
      defaultGreeting:
        communicationsConfig.defaultGreeting ||
        'Thanks for contacting Fixnado. Let us know how we can help and a specialist will respond shortly.',
      aiAssistDisplayName: communicationsConfig.aiAssistDisplayName || 'Fixnado Assist',
      aiAssistDescription:
        communicationsConfig.aiAssistDescription ||
        'AI-powered co-pilot that drafts replies, schedules crews, and summarises long threads for the team.'
    }
  });

  if (created) {
    await CommunicationsEntryPoint.bulkCreate(
      DEFAULT_ENTRY_POINTS.map((entry, index) => ({
        configurationId: configuration.id,
        key: entry.key,
        label: entry.label,
        description: entry.description,
        icon: entry.icon,
        defaultMessage: entry.defaultMessage,
        ctaLabel: entry.ctaLabel,
        ctaUrl: entry.ctaUrl,
        imageUrl: entry.imageUrl,
        enabled: true,
        displayOrder: index
      }))
    );
  } else {
    const existing = await CommunicationsEntryPoint.findAll({
      where: { configurationId: configuration.id }
    });
    const missing = DEFAULT_ENTRY_POINTS.filter(
      (entry) => !existing.some((item) => item.key === entry.key)
    );
    if (missing.length > 0) {
      const nextOrder = existing.length;
      await CommunicationsEntryPoint.bulkCreate(
        missing.map((entry, offset) => ({
          configurationId: configuration.id,
          key: entry.key,
          label: entry.label,
          description: entry.description,
          icon: entry.icon,
          defaultMessage: entry.defaultMessage,
          ctaLabel: entry.ctaLabel,
          ctaUrl: entry.ctaUrl,
          imageUrl: entry.imageUrl,
          enabled: true,
          displayOrder: nextOrder + offset
        }))
      );
    }
  }

  return configuration;
}

function serialiseEntryPoint(entryPoint) {
  return {
    id: entryPoint.id,
    key: entryPoint.key,
    label: entryPoint.label,
    description: entryPoint.description,
    icon: entryPoint.icon,
    defaultMessage: entryPoint.defaultMessage,
    enabled: entryPoint.enabled,
    displayOrder: entryPoint.displayOrder,
    imageUrl: entryPoint.imageUrl,
    ctaLabel: entryPoint.ctaLabel,
    ctaUrl: entryPoint.ctaUrl,
    updatedBy: entryPoint.updatedBy,
    updatedAt: entryPoint.updatedAt
  };
}

function serialiseQuickReply(reply) {
  return {
    id: reply.id,
    title: reply.title,
    body: reply.body,
    category: reply.category,
    sortOrder: reply.sortOrder,
    allowedRoles: Array.isArray(reply.allowedRoles) ? reply.allowedRoles : [],
    createdBy: reply.createdBy,
    updatedBy: reply.updatedBy,
    updatedAt: reply.updatedAt
  };
}

function serialiseEscalationRule(rule) {
  return {
    id: rule.id,
    name: rule.name,
    description: rule.description,
    triggerType: rule.triggerType,
    triggerMetadata: rule.triggerMetadata || {},
    targetType: rule.targetType,
    targetReference: rule.targetReference,
    targetLabel: rule.targetLabel,
    active: rule.active,
    slaMinutes: rule.slaMinutes,
    allowedRoles: Array.isArray(rule.allowedRoles) ? rule.allowedRoles : [],
    responseTemplate: rule.responseTemplate,
    updatedBy: rule.updatedBy,
    updatedAt: rule.updatedAt
  };
}

export async function getInboxSettings(tenantId) {
  const configuration = await ensureConfiguration(tenantId);
  const fullConfiguration = await CommunicationsInboxConfiguration.findByPk(configuration.id, {
    include: [
      {
        model: CommunicationsEntryPoint,
        as: 'entryPoints'
      },
      {
        model: CommunicationsQuickReply,
        as: 'quickReplies'
      },
      {
        model: CommunicationsEscalationRule,
        as: 'escalationRules'
      }
    ]
  });

  return {
    configuration: {
      id: fullConfiguration.id,
      tenantId: fullConfiguration.tenantId,
      liveRoutingEnabled: fullConfiguration.liveRoutingEnabled,
      defaultGreeting: fullConfiguration.defaultGreeting,
      aiAssistDisplayName: fullConfiguration.aiAssistDisplayName,
      aiAssistDescription: fullConfiguration.aiAssistDescription,
      timezone: fullConfiguration.timezone,
      quietHoursStart: fullConfiguration.quietHoursStart,
      quietHoursEnd: fullConfiguration.quietHoursEnd,
      updatedBy: fullConfiguration.updatedBy,
      updatedAt: fullConfiguration.updatedAt
    },
    entryPoints: fullConfiguration.entryPoints
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((entry) => serialiseEntryPoint(entry)),
    quickReplies: fullConfiguration.quickReplies
      .sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title))
      .map((reply) => serialiseQuickReply(reply)),
    escalationRules: fullConfiguration.escalationRules
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((rule) => serialiseEscalationRule(rule))
  };
}

export async function updateInboxSettings(tenantId, updates = {}, { actor } = {}) {
  const configuration = await ensureConfiguration(tenantId);
  const actorLabel = actor || 'system';

  const configUpdates = {};
  if (typeof updates.liveRoutingEnabled === 'boolean') {
    configUpdates.liveRoutingEnabled = updates.liveRoutingEnabled;
  }
  if (typeof updates.defaultGreeting === 'string') {
    configUpdates.defaultGreeting = updates.defaultGreeting.trim();
  }
  if (typeof updates.aiAssistDisplayName === 'string') {
    configUpdates.aiAssistDisplayName = updates.aiAssistDisplayName.trim().slice(0, 120);
  }
  if (typeof updates.aiAssistDescription === 'string') {
    configUpdates.aiAssistDescription = updates.aiAssistDescription.trim().slice(0, 240);
  }
  if (typeof updates.timezone === 'string' && updates.timezone.trim()) {
    configUpdates.timezone = updates.timezone.trim();
  }
  if (Object.hasOwn(updates, 'quietHoursStart')) {
    configUpdates.quietHoursStart = updates.quietHoursStart
      ? normaliseQuietHour(updates.quietHoursStart)
      : null;
  }
  if (Object.hasOwn(updates, 'quietHoursEnd')) {
    configUpdates.quietHoursEnd = updates.quietHoursEnd ? normaliseQuietHour(updates.quietHoursEnd) : null;
  }

  const entryPointUpdates = Array.isArray(updates.entryPoints) ? updates.entryPoints : [];

  await sequelize.transaction(async (transaction) => {
    if (Object.keys(configUpdates).length > 0) {
      await configuration.update({ ...configUpdates, updatedBy: actorLabel }, { transaction });
    }

    for (const entry of entryPointUpdates) {
      if (!entry || (!entry.key && !entry.id)) continue;

      if (entry._delete || entry.delete || entry.deleted) {
        if (entry.id) {
          await CommunicationsEntryPoint.destroy({
            where: { id: entry.id, configurationId: configuration.id },
            transaction
          });
        }
        continue;
      }

      const payload = { ...normaliseEntryPayload(entry), updatedBy: actorLabel };

      let record = null;
      if (entry.id) {
        record = await CommunicationsEntryPoint.findOne({
          where: { id: entry.id, configurationId: configuration.id },
          transaction
        });
      }
      if (!record && entry.key) {
        record = await CommunicationsEntryPoint.findOne({
          where: { key: normaliseEntryKey(entry.key), configurationId: configuration.id },
          transaction
        });
      }

      if (record) {
        await record.update(payload, { transaction });
      } else {
        await CommunicationsEntryPoint.create(
          {
            configurationId: configuration.id,
            key: normaliseEntryKey(entry.key),
            label: payload.label || normaliseEntryKey(entry.key),
            description: payload.description,
            icon: payload.icon,
            defaultMessage: payload.defaultMessage,
            imageUrl: payload.imageUrl,
            ctaLabel: payload.ctaLabel,
            ctaUrl: payload.ctaUrl,
            enabled: payload.enabled ?? true,
            displayOrder: payload.displayOrder ?? 0,
            updatedBy: actorLabel
          },
          { transaction }
        );
      }
    }
  });

  return getInboxSettings(tenantId);
}

export async function createEntryPoint(tenantId, payload = {}, { actor } = {}) {
  const configuration = await ensureConfiguration(tenantId);
  const actorLabel = actor || 'system';

  const key = normaliseEntryKey(payload.key);

  const existing = await CommunicationsEntryPoint.findOne({
    where: { configurationId: configuration.id, key }
  });

  if (existing) {
    throw communicationsSettingsError('Entry point key already exists for this workspace', 409);
  }

  const orderCandidate = Number.parseInt(payload.displayOrder, 10);
  const currentMax = await CommunicationsEntryPoint.max('displayOrder', {
    where: { configurationId: configuration.id }
  });

  const record = await CommunicationsEntryPoint.create({
    configurationId: configuration.id,
    key,
    label: typeof payload.label === 'string' && payload.label.trim() ? payload.label.trim() : key,
    description: typeof payload.description === 'string' ? payload.description.trim() : null,
    icon: typeof payload.icon === 'string' ? payload.icon.trim().slice(0, 8) || null : null,
    defaultMessage: typeof payload.defaultMessage === 'string' ? payload.defaultMessage.trim() : null,
    imageUrl: typeof payload.imageUrl === 'string' ? payload.imageUrl.trim() || null : null,
    ctaLabel: typeof payload.ctaLabel === 'string' ? payload.ctaLabel.trim() || null : null,
    ctaUrl: typeof payload.ctaUrl === 'string' ? payload.ctaUrl.trim() || null : null,
    enabled: typeof payload.enabled === 'boolean' ? payload.enabled : true,
    displayOrder: Number.isFinite(orderCandidate) ? Math.max(0, orderCandidate) : (currentMax ?? -1) + 1,
    updatedBy: actorLabel
  });

  return serialiseEntryPoint(record);
}

export async function updateEntryPoint(tenantId, entryPointId, payload = {}, { actor } = {}) {
  const configuration = await ensureConfiguration(tenantId);
  const record = await CommunicationsEntryPoint.findOne({
    where: { id: entryPointId, configurationId: configuration.id }
  });

  if (!record) {
    throw communicationsSettingsError('Entry point not found', 404);
  }

  const updates = normaliseEntryPayload(payload);

  if (Object.keys(updates).length === 0) {
    return serialiseEntryPoint(record);
  }

  updates.updatedBy = actor || 'system';
  await record.update(updates);
  return serialiseEntryPoint(record);
}

export async function deleteEntryPoint(tenantId, entryPointId) {
  const configuration = await ensureConfiguration(tenantId);

  const deleted = await CommunicationsEntryPoint.destroy({
    where: { id: entryPointId, configurationId: configuration.id }
  });

  if (deleted === 0) {
    throw communicationsSettingsError('Entry point not found', 404);
  }
}

export async function createQuickReply(tenantId, payload = {}, { actor } = {}) {
  const configuration = await ensureConfiguration(tenantId);
  if (typeof payload.title !== 'string' || payload.title.trim().length < 3) {
    throw communicationsSettingsError('Quick reply title must be at least three characters long');
  }
  if (typeof payload.body !== 'string' || payload.body.trim().length === 0) {
    throw communicationsSettingsError('Quick reply body is required');
  }

  const actorLabel = actor || 'system';
  const existingMax = await CommunicationsQuickReply.max('sortOrder', {
    where: { configurationId: configuration.id }
  });

  const record = await CommunicationsQuickReply.create({
    configurationId: configuration.id,
    title: payload.title.trim(),
    body: payload.body.trim(),
    category: payload.category ? payload.category.trim() : null,
    sortOrder: Number.isFinite(payload.sortOrder) ? Math.max(0, Math.floor(payload.sortOrder)) : (existingMax ?? -1) + 1,
    allowedRoles: normaliseRoles(payload.allowedRoles),
    createdBy: actorLabel,
    updatedBy: actorLabel
  });

  return serialiseQuickReply(record);
}

export async function updateQuickReply(tenantId, quickReplyId, payload = {}, { actor } = {}) {
  const configuration = await ensureConfiguration(tenantId);
  const record = await CommunicationsQuickReply.findOne({
    where: { id: quickReplyId, configurationId: configuration.id }
  });

  if (!record) {
    throw communicationsSettingsError('Quick reply not found', 404);
  }

  const updates = {};
  if (typeof payload.title === 'string') {
    updates.title = payload.title.trim();
  }
  if (typeof payload.body === 'string') {
    updates.body = payload.body.trim();
  }
  if (typeof payload.category === 'string' || payload.category === null) {
    updates.category = payload.category ? payload.category.trim() : null;
  }
  if (Object.hasOwn(payload, 'sortOrder')) {
    updates.sortOrder = Number.isFinite(payload.sortOrder) ? Math.max(0, Math.floor(payload.sortOrder)) : record.sortOrder;
  }
  if (Object.hasOwn(payload, 'allowedRoles')) {
    updates.allowedRoles = normaliseRoles(payload.allowedRoles);
  }

  const actorLabel = actor || 'system';
  await record.update({ ...updates, updatedBy: actorLabel });
  return serialiseQuickReply(record);
}

export async function deleteQuickReply(tenantId, quickReplyId) {
  const configuration = await ensureConfiguration(tenantId);
  const deleted = await CommunicationsQuickReply.destroy({
    where: { id: quickReplyId, configurationId: configuration.id }
  });

  if (!deleted) {
    throw communicationsSettingsError('Quick reply not found', 404);
  }
}

export async function createEscalationRule(tenantId, payload = {}, { actor } = {}) {
  const configuration = await ensureConfiguration(tenantId);
  if (typeof payload.name !== 'string' || payload.name.trim().length < 3) {
    throw communicationsSettingsError('Escalation name must be at least three characters long');
  }
  if (typeof payload.targetReference !== 'string' || payload.targetReference.trim().length === 0) {
    throw communicationsSettingsError('Escalation rule target reference is required');
  }

  const actorLabel = actor || 'system';
  const record = await CommunicationsEscalationRule.create({
    configurationId: configuration.id,
    name: payload.name.trim(),
    description: payload.description ? payload.description.trim() : null,
    triggerType: payload.triggerType && ['keyword', 'inactivity', 'sentiment', 'manual'].includes(payload.triggerType)
      ? payload.triggerType
      : 'keyword',
    triggerMetadata: payload.triggerMetadata && typeof payload.triggerMetadata === 'object' ? payload.triggerMetadata : {},
    targetType: payload.targetType && ['user', 'team', 'email', 'webhook'].includes(payload.targetType)
      ? payload.targetType
      : 'user',
    targetReference: payload.targetReference.trim(),
    targetLabel: payload.targetLabel ? payload.targetLabel.trim() : null,
    active: payload.active !== undefined ? Boolean(payload.active) : true,
    slaMinutes: Number.isFinite(payload.slaMinutes) ? Math.max(1, Math.floor(payload.slaMinutes)) : 15,
    allowedRoles: normaliseRoles(payload.allowedRoles),
    responseTemplate: payload.responseTemplate ? payload.responseTemplate.trim() : null,
    updatedBy: actorLabel
  });

  return serialiseEscalationRule(record);
}

export async function updateEscalationRule(tenantId, escalationId, payload = {}, { actor } = {}) {
  const configuration = await ensureConfiguration(tenantId);
  const record = await CommunicationsEscalationRule.findOne({
    where: { id: escalationId, configurationId: configuration.id }
  });

  if (!record) {
    throw communicationsSettingsError('Escalation rule not found', 404);
  }

  const updates = {};
  if (typeof payload.name === 'string') {
    updates.name = payload.name.trim();
  }
  if (typeof payload.description === 'string' || payload.description === null) {
    updates.description = payload.description ? payload.description.trim() : null;
  }
  if (payload.triggerType && ['keyword', 'inactivity', 'sentiment', 'manual'].includes(payload.triggerType)) {
    updates.triggerType = payload.triggerType;
  }
  if (payload.triggerMetadata && typeof payload.triggerMetadata === 'object') {
    updates.triggerMetadata = payload.triggerMetadata;
  }
  if (payload.targetType && ['user', 'team', 'email', 'webhook'].includes(payload.targetType)) {
    updates.targetType = payload.targetType;
  }
  if (typeof payload.targetReference === 'string') {
    updates.targetReference = payload.targetReference.trim();
  }
  if (typeof payload.targetLabel === 'string' || payload.targetLabel === null) {
    updates.targetLabel = payload.targetLabel ? payload.targetLabel.trim() : null;
  }
  if (Object.hasOwn(payload, 'active')) {
    updates.active = Boolean(payload.active);
  }
  if (Object.hasOwn(payload, 'slaMinutes')) {
    updates.slaMinutes = Number.isFinite(payload.slaMinutes)
      ? Math.max(1, Math.floor(payload.slaMinutes))
      : record.slaMinutes;
  }
  if (Object.hasOwn(payload, 'allowedRoles')) {
    updates.allowedRoles = normaliseRoles(payload.allowedRoles);
  }
  if (typeof payload.responseTemplate === 'string' || payload.responseTemplate === null) {
    updates.responseTemplate = payload.responseTemplate ? payload.responseTemplate.trim() : null;
  }

  const actorLabel = actor || 'system';
  await record.update({ ...updates, updatedBy: actorLabel });
  return serialiseEscalationRule(record);
}

export async function deleteEscalationRule(tenantId, escalationId) {
  const configuration = await ensureConfiguration(tenantId);
  const deleted = await CommunicationsEscalationRule.destroy({
    where: { id: escalationId, configurationId: configuration.id }
  });

  if (!deleted) {
    throw communicationsSettingsError('Escalation rule not found', 404);
  }
}
