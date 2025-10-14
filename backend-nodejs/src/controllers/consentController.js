import crypto from 'crypto';
import config from '../config/index.js';
import { validationResult } from 'express-validator';
import { recordConsent, getLatestConsent, listConsentHistory } from '../services/consentService.js';
import { recordSecurityEvent } from '../services/securityAuditService.js';

export async function submitConsent(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { consentType, consentVersion, granted, metadata } = req.body;
    const sessionCookieName = config.session.cookieName;
    const cookieSession =
      req.signedCookies?.[sessionCookieName] ?? req.cookies?.[sessionCookieName] ?? null;

    const resolvedSession = req.body.sessionId || cookieSession || crypto.randomUUID();
    const { actorId: userId = null, actorRole = 'anonymous' } = req.auth ?? {};

    await recordConsent({
      userId,
      sessionId: resolvedSession,
      consentType,
      consentVersion,
      granted,
      metadata,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    await recordSecurityEvent({
      eventType: 'consent_update',
      action: 'consent:record',
      status: 'granted',
      userId,
      actorRole,
      metadata: { consentType, consentVersion, granted }
    });

    res.status(201).json({
      sessionId: resolvedSession,
      consentType,
      consentVersion,
      granted
    });
  } catch (error) {
    next(error);
  }
}

export async function latestConsent(req, res, next) {
  try {
    const sessionCookieName = config.session.cookieName;
    const cookieSession =
      req.signedCookies?.[sessionCookieName] ?? req.cookies?.[sessionCookieName] ?? null;
    const sessionId = req.query.sessionId || cookieSession;
    const consentType = req.query.type;
    const { actorId: userId = null } = req.auth ?? {};

    const latest = await getLatestConsent({ sessionId, userId, consentType });
    if (!latest) {
      return res.status(404).json({ message: 'No consent record found' });
    }

    res.json({
      id: latest.id,
      consentType: latest.consentType,
      consentVersion: latest.consentVersion,
      granted: latest.granted,
      recordedAt: latest.recordedAt
    });
  } catch (error) {
    next(error);
  }
}

export async function consentHistory(req, res, next) {
  try {
    const sessionCookieName = config.session.cookieName;
    const cookieSession =
      req.signedCookies?.[sessionCookieName] ?? req.cookies?.[sessionCookieName] ?? null;
    const sessionId = req.query.sessionId || cookieSession;
    const { actorId: userId = null } = req.auth ?? {};
    const limit = req.query.limit ? Number.parseInt(req.query.limit, 10) : 50;

    const entries = await listConsentHistory({ sessionId, userId, limit });

    res.json({
      entries: entries.map((entry) => ({
        id: entry.id,
        consentType: entry.consentType,
        consentVersion: entry.consentVersion,
        granted: entry.granted,
        recordedAt: entry.recordedAt
      }))
    });
  } catch (error) {
    next(error);
  }
}
