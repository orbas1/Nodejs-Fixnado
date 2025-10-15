import crypto from 'node:crypto';
import { Op } from 'sequelize';
import config from '../config/index.js';
import { ConsentEvent } from '../models/index.js';
import { getConsentPolicies, getPolicyByKey, getRequiredPolicies } from '../constants/consentPolicies.js';
import { recordSecurityEvent } from './auditTrailService.js';

const { consent: consentConfig } = config;

function resolveSubjectId({ userId, subjectId, generateIfMissing = true }) {
  if (typeof subjectId === 'string' && subjectId.trim()) {
    return subjectId.trim().slice(0, 64);
  }
  if (userId) {
    return `user:${userId}`;
  }
  if (!generateIfMissing) {
    return null;
  }
  return `anon:${crypto.randomBytes(8).toString('hex')}`;
}

function normaliseDecision(decision) {
  const value = String(decision || '').toLowerCase();
  if (value === 'withdraw' || value === 'withdrawn') {
    return 'withdrawn';
  }
  return 'granted';
}

function normaliseChannel(channel) {
  if (typeof channel !== 'string') {
    return 'web';
  }
  const trimmed = channel.trim().toLowerCase();
  if (!trimmed) {
    return 'web';
  }
  return trimmed.slice(0, 32);
}

function daysBetween(start, end) {
  const msInDay = 24 * 60 * 60 * 1000;
  return Math.floor((end.getTime() - start.getTime()) / msInDay);
}

function serialiseEvent(eventInstance) {
  if (!eventInstance) {
    return null;
  }
  return {
    id: eventInstance.id,
    policyKey: eventInstance.policyKey,
    policyVersion: eventInstance.policyVersion,
    decision: eventInstance.decision,
    decisionAt: eventInstance.decisionAt,
    region: eventInstance.region,
    channel: eventInstance.channel,
    metadata: eventInstance.metadata || null
  };
}

async function fetchLatestEvents({ userId, subjectId }) {
  const whereClauses = [];
  const resolvedSubject = resolveSubjectId({ userId, subjectId, generateIfMissing: false });
  if (userId) {
    whereClauses.push({ userId });
  }
  if (resolvedSubject) {
    whereClauses.push({ subjectId: resolvedSubject });
  }

  if (whereClauses.length === 0) {
    return new Map();
  }

  const events = await ConsentEvent.findAll({
    where: {
      [Op.or]: whereClauses
    },
    order: [
      ['policyKey', 'ASC'],
      ['decisionAt', 'DESC'],
      ['createdAt', 'DESC']
    ]
  });

  const map = new Map();
  for (const event of events) {
    if (!map.has(event.policyKey)) {
      map.set(event.policyKey, event);
    }
  }

  return map;
}

export async function getConsentSnapshot({ userId = null, subjectId = null } = {}) {
  const policies = getConsentPolicies();
  const latestEvents = await fetchLatestEvents({ userId, subjectId });
  const now = new Date();
  const refreshDays = consentConfig?.refreshDays ?? 365;

  return policies.map((policy) => {
    const latestEvent = latestEvents.get(policy.key);
    const serialisedEvent = serialiseEvent(latestEvent);
    const granted = latestEvent?.decision === 'granted';
    const stale = granted && latestEvent?.decisionAt
      ? daysBetween(latestEvent.decisionAt, now) >= refreshDays
      : false;

    return {
      policy: policy.key,
      title: policy.title,
      version: policy.version,
      required: policy.required,
      description: policy.description,
      url: policy.url,
      granted,
      stale,
      grantedAt: granted ? latestEvent?.decisionAt ?? null : null,
      metadata: serialisedEvent?.metadata ?? null,
      event: serialisedEvent
    };
  });
}

export async function recordConsentEvent({
  userId = null,
  subjectId = null,
  policyKey,
  decision,
  version,
  ipAddress,
  userAgent,
  region,
  channel,
  metadata = {},
  actorRole = 'guest'
}) {
  const policy = getPolicyByKey(policyKey);
  if (!policy) {
    const error = new Error(`Unknown consent policy: ${policyKey}`);
    error.statusCode = 400;
    throw error;
  }

  const normalisedDecision = normaliseDecision(decision);
  const resolvedVersion = version || policy.version;
  const resolvedRegion = (region || policy.region || consentConfig?.defaultRegion || 'GB').toUpperCase();
  const resolvedChannel = normaliseChannel(channel);
  const resolvedSubjectId = resolveSubjectId({ userId, subjectId });
  const safeMetadata = metadata && typeof metadata === 'object' ? metadata : {};
  const decisionAt = new Date();

  const event = await ConsentEvent.create({
    userId,
    subjectId: resolvedSubjectId,
    policyKey: policy.key,
    policyVersion: resolvedVersion,
    decision: normalisedDecision,
    decisionAt,
    region: resolvedRegion,
    channel: resolvedChannel,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
    metadata: safeMetadata
  });

  await recordSecurityEvent({
    userId,
    actorRole,
    actorPersona: resolvedChannel,
    resource: `consent:${policy.key}`,
    action: 'consent_event_recorded',
    decision: 'allow',
    reason: `User set consent to ${normalisedDecision}`,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
    metadata: {
      policyVersion: resolvedVersion,
      region: resolvedRegion,
      metadata: safeMetadata
    }
  });

  return serialiseEvent(event);
}

export async function ensureActiveConsents({ userId, subjectId = null, requiredPolicies = null }) {
  const snapshot = await getConsentSnapshot({ userId, subjectId });
  const required = requiredPolicies && requiredPolicies.length > 0
    ? requiredPolicies
    : getRequiredPolicies().map((policy) => policy.key);

  const missing = snapshot.filter((entry) => {
    if (!required.includes(entry.policy)) {
      return false;
    }
    if (!entry.granted) {
      return true;
    }
    return entry.stale;
  });

  if (missing.length === 0) {
    return snapshot;
  }

  const error = new Error('Active consent required');
  error.statusCode = 428;
  error.details = missing;
  throw error;
}

export function resolveConsentSubject({ userId = null, subjectId = null, generateIfMissing = true } = {}) {
  return resolveSubjectId({ userId, subjectId, generateIfMissing });
}

export default {
  getConsentSnapshot,
  recordConsentEvent,
  ensureActiveConsents,
  resolveConsentSubject
};
