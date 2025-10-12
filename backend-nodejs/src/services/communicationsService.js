import crypto from 'node:crypto';
import { DateTime } from 'luxon';
import { RtcRole, RtcTokenBuilder } from 'agora-access-token';
import config from '../config/index.js';
import {
  Conversation,
  ConversationMessage,
  ConversationParticipant,
  MessageDelivery,
  sequelize
} from '../models/index.js';
import { recordAnalyticsEvent } from './analyticsEventService.js';

function communicationsError(message, statusCode = 400) {
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
    throw communicationsError(`Quiet hour value \"${value}\" must follow HH:mm format`);
  }

  const [, hours, minutes] = match;
  return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
}

function resolveQuietHours({
  participant,
  conversation,
  overrides = {}
}) {
  const timezone = overrides.timezone || participant?.timezone || conversation.defaultTimezone;
  const start =
    overrides.start || normaliseQuietHour(participant?.quietHoursStart) || normaliseQuietHour(conversation.quietHoursStart);
  const end =
    overrides.end || normaliseQuietHour(participant?.quietHoursEnd) || normaliseQuietHour(conversation.quietHoursEnd);

  if (!start || !end) {
    return null;
  }

  return { start, end, timezone };
}

function isQuietHoursActive(quietHours, referenceDate = new Date()) {
  if (!quietHours) {
    return false;
  }

  const { start, end, timezone } = quietHours;
  const now = DateTime.fromJSDate(referenceDate, { zone: timezone || 'UTC' });
  const startDate = now.set({
    hour: Number.parseInt(start.slice(0, 2), 10),
    minute: Number.parseInt(start.slice(3), 10),
    second: 0,
    millisecond: 0
  });
  let endDate = now.set({
    hour: Number.parseInt(end.slice(0, 2), 10),
    minute: Number.parseInt(end.slice(3), 10),
    second: 0,
    millisecond: 0
  });

  if (endDate <= startDate) {
    endDate = endDate.plus({ days: 1 });
  }

  const adjustedNow = now < startDate ? now.plus({ days: 1 }) : now;
  return adjustedNow >= startDate && adjustedNow < endDate;
}

function serialiseParticipant(participant) {
  return {
    id: participant.id,
    conversationId: participant.conversationId,
    participantType: participant.participantType,
    participantReferenceId: participant.participantReferenceId,
    displayName: participant.displayName,
    role: participant.role,
    aiAssistEnabled: participant.aiAssistEnabled,
    notificationsEnabled: participant.notificationsEnabled,
    videoEnabled: participant.videoEnabled,
    quietHoursStart: participant.quietHoursStart,
    quietHoursEnd: participant.quietHoursEnd,
    timezone: participant.timezone,
    lastReadAt: participant.lastReadAt,
    agoraUid: participant.agoraUid,
    metadata: participant.metadata
  };
}

function serialiseDelivery(delivery) {
  return {
    id: delivery.id,
    messageId: delivery.conversationMessageId,
    participantId: delivery.participantId,
    status: delivery.status,
    suppressedReason: delivery.suppressedReason,
    deliveredAt: delivery.deliveredAt,
    readAt: delivery.readAt,
    metadata: delivery.metadata
  };
}

function serialiseMessage(message) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    senderParticipantId: message.senderParticipantId,
    messageType: message.messageType,
    body: message.body,
    aiAssistUsed: message.aiAssistUsed,
    aiConfidenceScore: message.aiConfidenceScore ? Number(message.aiConfidenceScore) : null,
    attachments: message.attachments,
    metadata: message.metadata,
    createdAt: message.createdAt,
    updatedAt: message.updatedAt,
    deliveries: message.deliveries ? message.deliveries.map(serialiseDelivery) : undefined
  };
}

function serialiseConversation(conversation, participants, messages) {
  return {
    id: conversation.id,
    subject: conversation.subject,
    createdById: conversation.createdById,
    createdByType: conversation.createdByType,
    defaultTimezone: conversation.defaultTimezone,
    quietHoursStart: conversation.quietHoursStart,
    quietHoursEnd: conversation.quietHoursEnd,
    aiAssistDefault: conversation.aiAssistDefault,
    retentionDays: conversation.retentionDays,
    metadata: conversation.metadata,
    participants: participants?.map(serialiseParticipant),
    messages: messages?.map(serialiseMessage)
  };
}

function resolveAiAssistant(participants) {
  return participants.find((participant) => participant.role === 'ai_assistant');
}

async function fetchConversationWithParticipants(conversationId, { transaction } = {}) {
  const conversation = await Conversation.findByPk(conversationId, {
    include: [{ model: ConversationParticipant, as: 'participants' }],
    transaction
  });

  if (!conversation) {
    throw communicationsError('Conversation not found', 404);
  }

  return conversation;
}

async function generateAiSuggestion({ conversation, participants, triggeringParticipant, latestMessage, transaction }) {
  const assistant = resolveAiAssistant(participants);
  if (!assistant || !assistant.aiAssistEnabled || !conversation.aiAssistDefault) {
    return null;
  }

  const trimmedBody = latestMessage.body?.trim();
  if (!trimmedBody) {
    return null;
  }

  const communicationsConfig = config.communications;
  const contextMessages = await ConversationMessage.findAll({
    where: { conversationId: conversation.id },
    include: [
      {
        model: ConversationParticipant,
        as: 'sender',
        attributes: ['id', 'displayName', 'role']
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: 6,
    transaction
  });

  const context = contextMessages
    .reverse()
    .map((message) => ({
      role: message.messageType === 'assistant' ? 'assistant' : 'user',
      content: message.body,
      author: message.sender?.displayName || message.messageType
    }));

  async function callExternalProvider() {
    if (!communicationsConfig.aiAssistEndpoint) {
      return null;
    }

    try {
      const response = await fetch(communicationsConfig.aiAssistEndpoint, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(communicationsConfig.aiAssistApiKey
            ? { Authorization: `Bearer ${communicationsConfig.aiAssistApiKey}` }
            : {})
        },
        body: JSON.stringify({
          model: communicationsConfig.aiAssistModel,
          temperature: communicationsConfig.suggestionTemperature,
          messages: context.map((entry) => ({ role: entry.role, content: entry.content }))
        })
      });

      if (!response.ok) {
        return null;
      }

      const payload = await response.json();
      const suggestion =
        payload?.choices?.[0]?.message?.content || payload?.suggestion || payload?.message || null;
      if (!suggestion) {
        return null;
      }

      const confidence = Number.parseFloat(
        payload?.choices?.[0]?.confidence ?? payload?.confidence ?? communicationsConfig.suggestionTemperature
      );

      return {
        body: suggestion.trim(),
        confidence: Number.isFinite(confidence) ? Math.max(Math.min(confidence, 0.99), 0.4) : 0.65,
        metadata: {
          provider: 'external',
          tokens: payload?.usage?.total_tokens,
          strategy: 'llm_completion'
        }
      };
    } catch (error) {
      console.warn('AI assist provider failed, falling back to heuristics:', error.message);
      return null;
    }
  }

  function heuristicSuggestion() {
    const text = trimmedBody.toLowerCase();
    const topics = [];
    let body;
    if (/quote|price|cost|estimate/.test(text)) {
      topics.push('pricing');
      body =
        'Thanks for the update. I can build a detailed costed quote once I have the site photos or access details. Do you want me to schedule a virtual walk-through or should we confirm an on-site slot?';
    } else if (/schedule|availability|slot|when|time/.test(text)) {
      topics.push('scheduling');
      const timezone = triggeringParticipant?.timezone || conversation.defaultTimezone;
      body = `I can see your preferred window. I have technicians available tomorrow and ${timezone} morning. Let me know if you want me to push a booking invite or start an instant Agora call.`;
    } else if (/refund|invoice|payment|bill/.test(text)) {
      topics.push('billing');
      body =
        'I can raise a billing summary and share the invoice draft right away. Do you want the finance team looped in or should I arrange a quick escalation call?';
    } else if (/video|call|agora|phone/.test(text)) {
      topics.push('video_session');
      body =
        'Launching a secure Agora session now. I will keep the chat synced and log the call metadata for audit. Let me know if you prefer a PSTN fallback.';
    } else {
      topics.push('general_support');
      body =
        'I can summarise the next actions, share status updates with the requester, and prepare escalation notes if needed. Let me know if you want me to draft the response or raise an alert.';
    }

    return {
      body,
      confidence: 0.72,
      metadata: {
        provider: 'heuristic',
        topics,
        analysedMessages: context.length
      }
    };
  }

  const external = await callExternalProvider();
  return external ?? heuristicSuggestion();
}

async function createDeliveries({
  message,
  participants,
  sender,
  conversation,
  transaction
}) {
  const now = new Date();
  const records = [];
  const tenantId = conversation.metadata?.tenantId || null;

  for (const participant of participants) {
    if (sender && participant.id === sender.id) {
      continue;
    }

    const quietHours = resolveQuietHours({ participant, conversation });
    const quiet = isQuietHoursActive(quietHours, now);

    if (!participant.notificationsEnabled) {
      records.push({
        conversationMessageId: message.id,
        participantId: participant.id,
        status: 'suppressed',
        suppressedReason: 'notifications_disabled',
        metadata: {
          quietHours,
          suppressedAt: now.toISOString()
        }
      });
      continue;
    }

    if (quiet) {
      records.push({
        conversationMessageId: message.id,
        participantId: participant.id,
        status: 'suppressed',
        suppressedReason: 'quiet_hours',
        metadata: {
          quietHours,
          suppressedAt: now.toISOString()
        }
      });
      continue;
    }

    records.push({
      conversationMessageId: message.id,
      participantId: participant.id,
      status: 'delivered',
      deliveredAt: now,
      metadata: {
        deliveredAt: now.toISOString()
      }
    });
  }

  if (records.length === 0) {
    return [];
  }

  const deliveries = await MessageDelivery.bulkCreate(records, { transaction, returning: true });

  for (const delivery of deliveries) {
    if (delivery.status === 'suppressed') {
      await recordAnalyticsEvent(
        {
          name: 'communications.delivery.suppressed',
          entityId: delivery.id,
          tenantId,
          occurredAt: now,
          metadata: {
            conversationId: conversation.id,
            messageId: message.id,
            participantId: delivery.participantId,
            reason: delivery.suppressedReason,
            deliveryMetadata: delivery.metadata
          }
        },
        { transaction }
      );
    }
  }

  return deliveries;
}

async function createMessageRecord({
  conversation,
  participants,
  sender,
  body,
  messageType = 'user',
  attachments = [],
  metadata = {},
  requestAiAssist = false,
  transaction
}) {
  if (!body || typeof body !== 'string' || !body.trim()) {
    throw communicationsError('Message body is required');
  }

  const tenantId = conversation.metadata?.tenantId || null;
  const message = await ConversationMessage.create(
    {
      conversationId: conversation.id,
      senderParticipantId: sender?.id ?? null,
      messageType,
      body: body.trim(),
      attachments,
      metadata
    },
    { transaction }
  );

  const deliveries = await createDeliveries({
    message,
    participants,
    sender,
    conversation,
    transaction
  });

  message.deliveries = deliveries;

  await recordAnalyticsEvent(
    {
      name: 'communications.message.sent',
      entityId: message.id,
      tenantId,
      occurredAt: message.createdAt || new Date(),
      metadata: {
        conversationId: conversation.id,
        messageId: message.id,
        participantId: sender?.id ?? null,
        messageType,
        aiAssistUsed: false,
        attachments: attachments.length
      }
    },
    { transaction }
  );

  if (sender) {
    await sender.update({ lastReadAt: new Date() }, { transaction });
  }

  const messages = [message];

  if (requestAiAssist) {
    const suggestion = await generateAiSuggestion({
      conversation,
      participants,
      triggeringParticipant: sender,
      latestMessage: message,
      transaction
    });

    if (suggestion?.body) {
      const assistant = resolveAiAssistant(participants);
      const aiMessage = await ConversationMessage.create(
        {
          conversationId: conversation.id,
          senderParticipantId: assistant?.id ?? null,
          messageType: 'assistant',
          body: suggestion.body,
          aiAssistUsed: true,
          aiConfidenceScore: suggestion.confidence,
          metadata: {
            ...suggestion.metadata,
            generatedForMessageId: message.id,
            temperature: config.communications.suggestionTemperature
          }
        },
        { transaction }
      );

      const aiDeliveries = await createDeliveries({
        message: aiMessage,
        participants,
        sender: assistant,
        conversation,
        transaction
      });

      aiMessage.deliveries = aiDeliveries;
      await recordAnalyticsEvent(
        {
          name: 'communications.message.sent',
          entityId: aiMessage.id,
          tenantId,
          occurredAt: aiMessage.createdAt || new Date(),
          metadata: {
            conversationId: conversation.id,
            messageId: aiMessage.id,
            participantId: assistant?.id ?? null,
            messageType: 'assistant',
            aiAssistUsed: true,
            attachments: 0
          }
        },
        { transaction }
      );
      messages.push(aiMessage);
    }
  }

  return messages;
}

export async function createConversation({
  subject,
  createdBy,
  participants,
  quietHours,
  metadata = {},
  aiAssist
}) {
  if (!subject || typeof subject !== 'string' || subject.trim().length < 3) {
    throw communicationsError('Conversation subject must be at least three characters long');
  }

  if (!createdBy?.id || !createdBy?.type) {
    throw communicationsError('createdBy.id and createdBy.type are required');
  }

  if (!Array.isArray(participants) || participants.length < 2) {
    throw communicationsError('At least two participants are required to start a conversation');
  }

  return sequelize.transaction(async (transaction) => {
    const communicationsConfig = config.communications;
    const defaultQuietHours = communicationsConfig.defaultQuietHours || {};
    const quietStart = normaliseQuietHour(quietHours?.start || defaultQuietHours.start);
    const quietEnd = normaliseQuietHour(quietHours?.end || defaultQuietHours.end);
    const timezone = quietHours?.timezone || defaultQuietHours.timezone || 'Europe/London';

    const conversation = await Conversation.create(
      {
        subject: subject.trim(),
        createdById: createdBy.id,
        createdByType: createdBy.type,
        defaultTimezone: timezone,
        quietHoursStart: quietStart,
        quietHoursEnd: quietEnd,
        aiAssistDefault: aiAssist?.defaultEnabled !== false,
        retentionDays: communicationsConfig.retentionDays,
        metadata
      },
      { transaction }
    );

    const participantRecords = [];
    for (const participant of participants) {
      if (!participant.participantType || !participant.participantReferenceId) {
        throw communicationsError('participantType and participantReferenceId are required for each participant');
      }

      const record = await ConversationParticipant.create(
        {
          conversationId: conversation.id,
          participantType: participant.participantType,
          participantReferenceId: participant.participantReferenceId,
          displayName: participant.displayName,
          role: participant.role || 'customer',
          aiAssistEnabled: participant.aiAssistEnabled ?? true,
          notificationsEnabled: participant.notificationsEnabled ?? true,
          videoEnabled: participant.videoEnabled ?? true,
          quietHoursStart: normaliseQuietHour(participant.quietHoursStart),
          quietHoursEnd: normaliseQuietHour(participant.quietHoursEnd),
          timezone: participant.timezone || timezone,
          metadata: participant.metadata || {}
        },
        { transaction }
      );

      participantRecords.push(record);
    }

    if (aiAssist?.defaultEnabled !== false && !resolveAiAssistant(participantRecords)) {
      const assistantRecord = await ConversationParticipant.create(
        {
          conversationId: conversation.id,
          participantType: 'support_bot',
          displayName: aiAssist?.displayName || 'Fixnado Assist',
          role: 'ai_assistant',
          aiAssistEnabled: true,
          notificationsEnabled: false,
          videoEnabled: false,
          metadata: {
            capabilities: ['knowledge_base', 'ai_suggestions'],
            temperature: communicationsConfig.suggestionTemperature
          }
        },
        { transaction }
      );
      participantRecords.push(assistantRecord);
    }

    let initialMessages;
    if (aiAssist?.initialMessage) {
      const sender = participantRecords.find((record) => record.participantReferenceId === aiAssist.initialMessage.senderId);
      if (!sender) {
        throw communicationsError('Initial message sender must be part of the conversation');
      }
      initialMessages = await createMessageRecord({
        conversation,
        participants: participantRecords,
        sender,
        body: aiAssist.initialMessage.body,
        messageType: aiAssist.initialMessage.messageType || 'user',
        attachments: aiAssist.initialMessage.attachments || [],
        metadata: {
          ...(aiAssist.initialMessage.metadata || {}),
          systemSeed: true
        },
        requestAiAssist: aiAssist.initialMessage.requestAiAssist || false,
        transaction
      });
    }

    return serialiseConversation(conversation, participantRecords, initialMessages);
  });
}

export async function listConversations({ participantId, limit = 20 }) {
  if (!participantId) {
    throw communicationsError('participantId is required');
  }

  const participant = await ConversationParticipant.findByPk(participantId, {
    include: [{ model: Conversation, as: 'conversation' }]
  });

  if (!participant) {
    throw communicationsError('Participant not found', 404);
  }

  const conversations = await Conversation.findAll({
    include: [
      {
        model: ConversationParticipant,
        as: 'participants',
        required: true,
        where: { id: participantId }
      }
    ],
    order: [['updatedAt', 'DESC']],
    limit: Math.min(Math.max(limit, 1), 50)
  });

  const enriched = await Promise.all(
    conversations.map(async (conversation) => {
      const latestMessage = await ConversationMessage.findOne({
        where: { conversationId: conversation.id },
        include: [{ model: MessageDelivery, as: 'deliveries' }],
        order: [['createdAt', 'DESC']]
      });

      const messages = latestMessage ? [latestMessage] : [];
      return serialiseConversation(conversation, conversation.participants, messages);
    })
  );

  return enriched;
}

export async function getConversation(conversationId, { limit = 50 } = {}) {
  const conversation = await fetchConversationWithParticipants(conversationId);
  const messages = await ConversationMessage.findAll({
    where: { conversationId },
    include: [{ model: MessageDelivery, as: 'deliveries' }],
    order: [['createdAt', 'DESC']],
    limit: Math.min(Math.max(limit, 1), 100)
  });

  return serialiseConversation(
    conversation,
    conversation.participants,
    messages.reverse().map((message) => {
      message.deliveries = message.deliveries;
      return message;
    })
  );
}

export async function sendMessage(conversationId, {
  senderParticipantId,
  body,
  messageType = 'user',
  attachments = [],
  metadata,
  requestAiAssist = false
}) {
  if (!senderParticipantId) {
    throw communicationsError('senderParticipantId is required');
  }

  return sequelize.transaction(async (transaction) => {
    const conversation = await fetchConversationWithParticipants(conversationId, { transaction });
    const sender = conversation.participants.find((participant) => participant.id === senderParticipantId);

    if (!sender) {
      throw communicationsError('Sender is not part of this conversation', 403);
    }

    if (messageType === 'assistant') {
      throw communicationsError('Assistant messages must be generated by the platform');
    }

    const messages = await createMessageRecord({
      conversation,
      participants: conversation.participants,
      sender,
      body,
      messageType,
      attachments,
      metadata,
      requestAiAssist: requestAiAssist && sender.aiAssistEnabled,
      transaction
    });

    conversation.updatedAt = new Date();
    await conversation.save({ transaction });

    return messages.map(serialiseMessage);
  });
}

export async function updateParticipantPreferences(conversationId, participantId, updates) {
  if (!participantId) {
    throw communicationsError('participantId is required');
  }

  return sequelize.transaction(async (transaction) => {
    const conversation = await fetchConversationWithParticipants(conversationId, { transaction });
    const participant = conversation.participants.find((item) => item.id === participantId);

    if (!participant) {
      throw communicationsError('Participant not found in conversation', 404);
    }

    const payload = {};
    if (updates.displayName) {
      payload.displayName = updates.displayName;
    }
    if (typeof updates.aiAssistEnabled === 'boolean') {
      payload.aiAssistEnabled = updates.aiAssistEnabled;
    }
    if (typeof updates.notificationsEnabled === 'boolean') {
      payload.notificationsEnabled = updates.notificationsEnabled;
    }
    if (typeof updates.videoEnabled === 'boolean') {
      payload.videoEnabled = updates.videoEnabled;
    }
    if (updates.quietHoursStart !== undefined) {
      payload.quietHoursStart = normaliseQuietHour(updates.quietHoursStart);
    }
    if (updates.quietHoursEnd !== undefined) {
      payload.quietHoursEnd = normaliseQuietHour(updates.quietHoursEnd);
    }
    if (updates.timezone) {
      payload.timezone = updates.timezone;
    }
    if (updates.metadata) {
      payload.metadata = { ...participant.metadata, ...updates.metadata };
    }

    await participant.update(payload, { transaction });
    return serialiseParticipant(participant);
  });
}

export async function createVideoSession(conversationId, participantId, { channelName, expirySeconds } = {}) {
  if (!participantId) {
    throw communicationsError('participantId is required');
  }

  const { agora } = config.communications;
  if (!agora.appId || !agora.appCertificate) {
    throw communicationsError('Agora credentials are not configured', 503);
  }

  return sequelize.transaction(async (transaction) => {
    const conversation = await fetchConversationWithParticipants(conversationId, { transaction });
    const participant = conversation.participants.find((item) => item.id === participantId);

    if (!participant) {
      throw communicationsError('Participant not found in conversation', 404);
    }

    if (!participant.videoEnabled) {
      throw communicationsError('Video has been disabled for this participant', 403);
    }

    const uid = participant.agoraUid ? Number.parseInt(participant.agoraUid, 10) : crypto.randomInt(1, 2 ** 31 - 1);
    const finalChannel = channelName || `conversation_${conversation.id.replace(/-/g, '')}`;
    const ttl = Math.max(expirySeconds || agora.defaultExpireSeconds || 3600, 300);
    const privilegeExpiresAt = Math.floor(Date.now() / 1000) + ttl;

    const token = RtcTokenBuilder.buildTokenWithUid(
      agora.appId,
      agora.appCertificate,
      finalChannel,
      uid,
      RtcRole.PUBLISHER,
      privilegeExpiresAt
    );

    await participant.update(
      {
        agoraUid: String(uid),
        metadata: {
          ...participant.metadata,
          lastVideoSession: new Date().toISOString(),
          lastVideoChannel: finalChannel
        }
      },
      { transaction }
    );

    return {
      appId: agora.appId,
      channelName: finalChannel,
      token,
      uid: String(uid),
      expiresAt: new Date(privilegeExpiresAt * 1000).toISOString()
    };
  });
}
