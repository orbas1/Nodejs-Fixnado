import { SecurityAuditEvent } from '../models/index.js';

function sanitiseString(value, maxLength = 255) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return trimmed.slice(0, maxLength);
}

function normaliseDecision(decision) {
  return decision === 'allow' ? 'allow' : 'deny';
}

export async function recordSecurityEvent({
  userId,
  actorRole,
  actorPersona,
  resource,
  action,
  decision,
  reason,
  ipAddress,
  userAgent,
  correlationId,
  metadata
}) {
  try {
    await SecurityAuditEvent.create({
      userId: userId ?? null,
      actorRole: sanitiseString(actorRole ?? 'guest', 64) ?? 'guest',
      actorPersona: sanitiseString(actorPersona, 64),
      resource: sanitiseString(resource ?? 'unknown', 128) ?? 'unknown',
      action: sanitiseString(action ?? 'unknown', 64) ?? 'unknown',
      decision: normaliseDecision(decision),
      reason: sanitiseString(reason, 255),
      ipAddress: sanitiseString(ipAddress, 64),
      userAgent: userAgent ? sanitiseString(String(userAgent), 512) : null,
      correlationId: sanitiseString(correlationId, 64),
      metadata: metadata && typeof metadata === 'object' ? metadata : null
    });
  } catch (error) {
    console.error('[auditTrail] Failed to persist security event', {
      message: error.message,
      resource,
      action,
      decision
    });
  }
}

export default {
  recordSecurityEvent
};
