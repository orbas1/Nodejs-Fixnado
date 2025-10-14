import { randomUUID } from 'node:crypto';
import { Op } from 'sequelize';
import { ConsentEvent } from '../models/index.js';

function normaliseSessionId(sessionId) {
  if (typeof sessionId !== 'string' || sessionId.trim() === '') {
    throw new Error('sessionId is required for consent logging');
  }
  return sessionId.trim().slice(0, 64);
}

function sanitiseMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }
  return JSON.parse(JSON.stringify(metadata));
}

export async function recordConsent({
  userId,
  sessionId,
  consentType,
  consentVersion,
  granted,
  ipAddress,
  userAgent,
  metadata
}) {
  if (!consentType || !consentVersion) {
    throw new Error('consentType and consentVersion must be provided');
  }

  await ConsentEvent.create({
    id: randomUUID(),
    userId: userId ?? null,
    sessionId: normaliseSessionId(sessionId),
    consentType: consentType.slice(0, 64),
    consentVersion: consentVersion.slice(0, 32),
    granted: Boolean(granted),
    ipAddress: ipAddress?.slice(0, 64) ?? null,
    userAgent: userAgent?.slice(0, 512) ?? null,
    metadata: sanitiseMetadata(metadata)
  });
}

export async function getLatestConsent({ sessionId, userId, consentType }) {
  const whereClause = {
    consentType
  };

  if (sessionId) {
    whereClause.sessionId = sessionId;
  }

  if (userId) {
    whereClause[Op.or] = [
      { userId },
      { sessionId }
    ];
  }

  return ConsentEvent.findOne({
    where: whereClause,
    order: [['recordedAt', 'DESC']]
  });
}

export async function listConsentHistory({ sessionId, userId, limit = 50 }) {
  const whereClause = {};

  if (sessionId) {
    whereClause.sessionId = sessionId;
  }

  if (userId) {
    whereClause.userId = userId;
  }

  return ConsentEvent.findAll({
    where: whereClause,
    order: [['recordedAt', 'DESC']],
    limit: Math.min(Math.max(parseInt(limit, 10) || 50, 1), 200)
  });
}
