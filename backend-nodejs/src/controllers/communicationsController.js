import {
  createConversation as createConversationRecord,
  listConversations as listConversationsForParticipant,
  getConversation as getConversationDetails,
  sendMessage as sendConversationMessage,
  updateParticipantPreferences,
  createVideoSession as createVideoSessionForParticipant
} from '../services/communicationsService.js';

function handleServiceError(res, next, error) {
  if (error && error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  return next(error);
}

export async function createConversation(req, res, next) {
  try {
    const {
      subject,
      createdBy,
      participants,
      quietHours,
      metadata,
      aiAssist
    } = req.body || {};

    const conversation = await createConversationRecord({
      subject,
      createdBy,
      participants,
      quietHours,
      metadata,
      aiAssist
    });

    res.status(201).json(conversation);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function listConversations(req, res, next) {
  try {
    const { participantId, limit } = req.query;
    const conversations = await listConversationsForParticipant({
      participantId,
      limit: limit ? Number.parseInt(limit, 10) : undefined
    });

    res.json(conversations);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function getConversation(req, res, next) {
  try {
    const { limit } = req.query;
    const conversation = await getConversationDetails(req.params.conversationId, {
      limit: limit ? Number.parseInt(limit, 10) : undefined
    });

    res.json(conversation);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function postMessage(req, res, next) {
  try {
    const messages = await sendConversationMessage(req.params.conversationId, {
      senderParticipantId: req.body?.senderParticipantId,
      body: req.body?.body,
      messageType: req.body?.messageType,
      attachments: req.body?.attachments,
      metadata: req.body?.metadata,
      requestAiAssist: req.body?.requestAiAssist === true
    });

    res.status(201).json(messages);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function patchParticipant(req, res, next) {
  try {
    const participant = await updateParticipantPreferences(
      req.params.conversationId,
      req.params.participantId,
      req.body || {}
    );

    res.json(participant);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function createVideoSession(req, res, next) {
  try {
    const payload = await createVideoSessionForParticipant(
      req.params.conversationId,
      req.body?.participantId,
      {
        channelName: req.body?.channelName,
        expirySeconds: req.body?.expirySeconds
      }
    );

    res.status(201).json(payload);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}
