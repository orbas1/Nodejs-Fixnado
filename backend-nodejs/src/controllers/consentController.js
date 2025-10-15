import config from '../config/index.js';
import {
  getConsentSnapshot,
  recordConsentEvent,
  ensureActiveConsents,
  resolveConsentSubject
} from '../services/consentService.js';

function extractSubjectToken(req) {
  const headerSubject = req.headers['x-consent-subject'] || req.headers['x-fixnado-consent'];
  if (typeof headerSubject === 'string' && headerSubject.trim()) {
    return headerSubject.trim();
  }
  if (req.query?.subjectId) {
    return String(req.query.subjectId);
  }
  if (req.body?.subjectId) {
    return String(req.body.subjectId);
  }
  return null;
}

function normaliseRegion(req, fallback) {
  const regionHeader = req.headers['cf-ipcountry'] || req.headers['x-region'];
  if (typeof regionHeader === 'string' && regionHeader.trim()) {
    return regionHeader.trim().toUpperCase();
  }
  if (typeof fallback === 'string' && fallback.trim()) {
    return fallback.trim().toUpperCase();
  }
  return config.consent?.defaultRegion ?? 'GB';
}

function normaliseChannel(req, fallback) {
  const header = req.headers['x-client-channel'] || req.headers['x-app-channel'];
  if (typeof header === 'string' && header.trim()) {
    return header.trim();
  }
  if (typeof fallback === 'string' && fallback.trim()) {
    return fallback.trim();
  }
  return req.headers['user-agent']?.includes('Flutter') ? 'mobile' : 'web';
}

export async function listConsentRequirements(req, res, next) {
  try {
    const userId = req.user?.id ?? null;
    const incomingSubject = extractSubjectToken(req);
    const subjectId = resolveConsentSubject({
      userId,
      subjectId: incomingSubject,
      generateIfMissing: !incomingSubject || !userId
    });
    const snapshot = await getConsentSnapshot({ userId, subjectId });

    res.json({
      subjectId,
      refreshDays: config.consent?.refreshDays ?? 365,
      policies: snapshot
    });
  } catch (error) {
    next(error);
  }
}

export async function submitConsentDecision(req, res, next) {
  try {
    const { policyKey, decision, version, metadata = {}, region, channel } = req.body ?? {};
    if (!policyKey) {
      return res.status(400).json({ message: 'policyKey is required' });
    }

    const userId = req.user?.id ?? null;
    const actorRole = req.user?.type ?? 'guest';
    const incomingSubject = extractSubjectToken(req);
    const subjectId = resolveConsentSubject({
      userId,
      subjectId: incomingSubject,
      generateIfMissing: true
    });

    const enrichedMetadata = { ...metadata };
    if (policyKey === 'marketing_emails' && config.consent?.marketingDoubleOptIn) {
      enrichedMetadata.doubleOptIn = Boolean(enrichedMetadata.doubleOptIn ?? req.body?.doubleOptIn ?? false);
      enrichedMetadata.doubleOptInAt = enrichedMetadata.doubleOptIn ? new Date().toISOString() : null;
    }

    const event = await recordConsentEvent({
      userId,
      subjectId,
      policyKey,
      decision,
      version,
      region: normaliseRegion(req, region),
      channel: normaliseChannel(req, channel),
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: enrichedMetadata,
      actorRole
    });

    const snapshot = await getConsentSnapshot({ userId, subjectId });
    res.status(201).json({
      subjectId,
      event,
      policies: snapshot
    });
  } catch (error) {
    next(error);
  }
}

export async function verifyConsentStatus(req, res, next) {
  try {
    const requiredPolicies = Array.isArray(req.body?.policies)
      ? req.body.policies.filter((policy) => typeof policy === 'string' && policy.trim())
      : null;
    const userId = req.user?.id ?? null;
    const incomingSubject = extractSubjectToken(req);
    const subjectId = resolveConsentSubject({
      userId,
      subjectId: incomingSubject,
      generateIfMissing: Boolean(incomingSubject) || Boolean(userId)
    });

    const snapshot = await ensureActiveConsents({
      userId,
      subjectId,
      requiredPolicies
    });

    res.json({
      subjectId,
      policies: snapshot
    });
  } catch (error) {
    if (error.statusCode === 428) {
      res.status(428).json({
        message: 'Additional consent required',
        details: error.details
      });
      return;
    }
    next(error);
  }
}

export default {
  listConsentRequirements,
  submitConsentDecision,
  verifyConsentStatus
};
