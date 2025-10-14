import { randomUUID } from 'node:crypto';
import { SecurityAuditEvent } from '../models/index.js';

function safeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }
  try {
    return JSON.parse(JSON.stringify(metadata));
  } catch (error) {
    return { error: 'metadata_serialisation_failed' };
  }
}

export async function recordSecurityEvent({
  eventType,
  action,
  status,
  userId,
  actorRole,
  subjectType,
  subjectId,
  metadata,
  ipAddress,
  userAgent,
  requestId
}) {
  if (!eventType || !action || !status) {
    throw new Error('eventType, action, and status are required for security audit events');
  }

  try {
    await SecurityAuditEvent.create({
      id: randomUUID(),
      eventType,
      action,
      status,
      userId: userId ?? null,
      actorRole: actorRole ?? null,
      subjectType: subjectType ?? null,
      subjectId: subjectId ?? null,
      metadata: safeMetadata(metadata),
      ipAddress: ipAddress?.slice(0, 64) ?? null,
      userAgent: userAgent?.slice(0, 512) ?? null,
      requestId: requestId?.slice(0, 64) ?? null
    });
  } catch (error) {
    console.error('Failed to record security audit event', {
      message: error.message,
      eventType,
      action,
      status
    });
  }
}

export async function auditAccessAttempt({
  req,
  action,
  status,
  subjectType,
  subjectId,
  metadata
}) {
  const userId = req?.auth?.actorId ?? null;
  const actorRole = req?.auth?.actorRole ?? null;
  const ipAddress = req?.ip;
  const userAgent = req?.get?.('user-agent');
  const requestId = req?.id ?? req?.headers?.['x-request-id'];

  await recordSecurityEvent({
    eventType: 'access_attempt',
    action,
    status,
    userId,
    actorRole,
    subjectType,
    subjectId,
    metadata,
    ipAddress,
    userAgent,
    requestId
  });
}
