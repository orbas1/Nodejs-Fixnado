import crypto from 'crypto';
import { SecurityAuditEvent } from '../models/index.js';
import config from '../config/index.js';

const auditConfig = config.security?.audit ?? {};

const registeredSinks = new Set();

if (auditConfig.enabled !== false && auditConfig.webhookUrl) {
  registeredSinks.add(createWebhookSink(auditConfig));
}

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

function clampMetadata(metadata = {}) {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }

  const copy = { ...metadata };
  const dropKeys = Array.isArray(auditConfig.dropMetadataKeys)
    ? auditConfig.dropMetadataKeys.map((key) => key.toString())
    : [];

  dropKeys.forEach((key) => {
    if (key in copy) {
      copy[key] = '[redacted]';
    }
  });

  return copy;
}

function shouldDispatch(event) {
  const sampleRate = Number.isFinite(auditConfig.sampleRate) ? auditConfig.sampleRate : 1;
  if (sampleRate >= 1) {
    return true;
  }

  if (sampleRate <= 0) {
    return false;
  }

  const hashInput = `${event.actorRole ?? 'guest'}:${event.userId ?? 'anon'}:${event.resource ?? 'unknown'}:${
    event.action ?? 'unknown'
  }`;
  const digest = crypto.createHash('sha1').update(hashInput).digest('hex').slice(0, 8);
  const bucket = Number.parseInt(digest, 16) / 0xffffffff;
  return bucket < sampleRate;
}

function createWebhookSink({ webhookUrl, webhookToken, httpTimeoutMs = 2000 }) {
  return async function dispatchToWebhook(event) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), httpTimeoutMs);

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(webhookToken ? { authorization: `Bearer ${webhookToken}` } : {})
        },
        body: JSON.stringify(event),
        signal: controller.signal
      });
    } catch (error) {
      console.error('[auditTrail] Failed to forward audit webhook', {
        message: error.message,
        resource: event.resource,
        action: event.action
      });
    } finally {
      clearTimeout(timeout);
    }
  };
}

export function registerAuditSink(sink) {
  if (typeof sink === 'function') {
    registeredSinks.add(sink);
  }
}

async function dispatchToSinks(event) {
  if (!shouldDispatch(event)) {
    return;
  }

  await Promise.allSettled(Array.from(registeredSinks).map((sink) => sink(event)));
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
    const normalisedMetadata = clampMetadata(metadata);

    const persistedEvent = await SecurityAuditEvent.create({
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
      metadata: normalisedMetadata
    });

    const eventPayload = {
      id: persistedEvent.id,
      userId: userId ?? null,
      actorRole: actorRole ?? 'guest',
      actorPersona: actorPersona ?? null,
      resource: resource ?? 'unknown',
      action: action ?? 'unknown',
      decision: normaliseDecision(decision),
      reason: reason ?? null,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      correlationId: correlationId ?? null,
      metadata: normalisedMetadata,
      recordedAt:
        persistedEvent.get?.('created_at')?.toISOString?.() ??
        persistedEvent.createdAt?.toISOString?.() ??
        new Date().toISOString()
    };

    queueMicrotask(() => {
      dispatchToSinks(eventPayload).catch((error) => {
        console.error('[auditTrail] Failed dispatching audit sinks', {
          message: error.message,
          resource: resource ?? 'unknown',
          action: action ?? 'unknown'
        });
      });
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
  recordSecurityEvent,
  registerAuditSink
};
