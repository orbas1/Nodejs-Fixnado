import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import { User, Company } from '../models/index.js';
import config from '../config/index.js';
import {
  issueRefreshSession,
  rotateRefreshSession,
  findActiveSession,
  revokeSession
} from '../services/sessionTokenService.js';
import { recordSecurityEvent } from '../services/securityAuditService.js';
import { getAdminSecurityToken, getJwtSigningSecret } from '../services/secretVaultService.js';

const SALT_ROUNDS = 10;

async function buildAccessToken(user, sessionId) {
  const payload = {
    sub: user.id,
    role: user.type,
    sid: sessionId,
    type: user.type
  };

  const options = {
    expiresIn: `${config.tokens.accessTtlMinutes}m`,
    algorithm: config.jwt.algorithm,
    issuer: config.tokens.issuer,
    audience: config.tokens.audience.length ? config.tokens.audience : undefined
  };

  const signingSecret = await getJwtSigningSecret();
  return jwt.sign(payload, signingSecret, options);
}

function cookieOptions(maxAgeMs, overrides = {}) {
  return {
    httpOnly: true,
    secure: config.session.secure,
    sameSite: config.session.sameSite,
    domain: config.session.domain,
    path: config.session.path,
    signed: true,
    maxAge: maxAgeMs,
    ...overrides
  };
}

function csrfToken() {
  return crypto.randomBytes(24).toString('base64url');
}

function sanitiseUser(user) {
  if (typeof user?.toSafeJSON === 'function') {
    return user.toSafeJSON();
  }
  const clone = user?.toJSON?.() ?? user;
  if (!clone) {
    return null;
  }
  delete clone.passwordHash;
  delete clone.password_hash;
  delete clone.emailHash;
  return clone;
}

export async function register(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { firstName, lastName, email, password, type, address, age, company } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    const user = await User.create({
      firstName,
      lastName,
      email,
      passwordHash,
      address,
      age,
      type
    });

    if (type === 'company' && company) {
      await Company.create({
        userId: user.id,
        legalStructure: company.legalStructure || 'company',
        contactName: company.contactName,
        contactEmail: company.contactEmail || email,
        serviceRegions: company.serviceRegions,
        marketplaceIntent: company.marketplaceIntent
      });
    }

    await recordSecurityEvent({
      eventType: 'auth_registration',
      action: 'user:register',
      status: 'granted',
      userId: user.id,
      actorRole: user.type,
      metadata: { email: user.email }
    });

    return res.status(201).json({
      user: sanitiseUser(user)
    });
  } catch (error) {
    next(error);
  }
}

function secureCompare(expected, received) {
  if (typeof expected !== 'string' || typeof received !== 'string') {
    return false;
  }

  const expectedBuffer = Buffer.from(expected);
  const receivedBuffer = Buffer.from(received);
  if (expectedBuffer.length !== receivedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
}

function isEmailAllowed(email, allowedEmails = [], allowedDomains = []) {
  if (allowedEmails.length === 0 && allowedDomains.length === 0) {
    return true;
  }

  if (allowedEmails.includes(email)) {
    return true;
  }

  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) {
    return false;
  }

  return allowedDomains.includes(domain);
}

function applyAuthCookies(res, { accessToken, refreshToken, sessionId, csrf }) {
  const accessMaxAge = config.tokens.accessTtlMinutes * 60 * 1000;
  const refreshMaxAge = config.tokens.refreshTtlHours * 60 * 60 * 1000;

  res.cookie(config.session.accessCookieName, accessToken, cookieOptions(accessMaxAge));
  res.cookie(config.session.refreshCookieName, refreshToken, cookieOptions(refreshMaxAge));
  res.cookie(config.session.cookieName, sessionId, cookieOptions(refreshMaxAge));
  res.cookie('fixnado.csrf', csrf, {
    httpOnly: false,
    secure: config.session.secure,
    sameSite: config.session.sameSite,
    domain: config.session.domain,
    path: config.session.path,
    maxAge: refreshMaxAge
  });
  res.setHeader('X-CSRF-Token', csrf);
}

function mobileResponse(res, payload) {
  res.json(payload);
}

export async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { email, password, securityToken, client = 'web' } = req.body;
    const user = await User.findOne({ where: { email }, include: [{ model: Company }] });
    if (!user) {
      await recordSecurityEvent({
        eventType: 'auth_login',
        action: 'user:login',
        status: 'denied',
        metadata: { reason: 'user_not_found', email }
      });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      await recordSecurityEvent({
        eventType: 'auth_login',
        action: 'user:login',
        status: 'denied',
        userId: user.id,
        actorRole: user.type,
        metadata: { reason: 'invalid_password' }
      });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.type === 'admin') {
      const { allowedEmails, allowedDomains, sessionTtlHours } = config.auth.admin;
      const expectedToken = await getAdminSecurityToken();
      if (!expectedToken || !securityToken || !secureCompare(expectedToken, securityToken)) {
        await recordSecurityEvent({
          eventType: 'auth_login',
          action: 'admin:login',
          status: 'denied',
          userId: user.id,
          actorRole: user.type,
          metadata: { reason: 'missing_security_token' }
        });
        return res.status(401).json({ message: 'Admin security token required' });
      }

      if (!isEmailAllowed(user.email, allowedEmails, allowedDomains)) {
        await recordSecurityEvent({
          eventType: 'auth_login',
          action: 'admin:login',
          status: 'denied',
          userId: user.id,
          actorRole: user.type,
          metadata: { reason: 'email_not_allowed' }
        });
        return res.status(403).json({ message: 'Admin access restricted' });
      }

      const { rawToken: refreshToken, tokenRecord } = await issueRefreshSession({
        userId: user.id,
        context: client === 'mobile' ? 'mobile-admin' : 'admin-web',
        ttlHours: sessionTtlHours,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });

      const accessToken = await buildAccessToken(user, tokenRecord.id);
      const csrf = csrfToken();

      if (client === 'mobile') {
        mobileResponse(res, {
          accessToken,
          refreshToken,
          expiresInMinutes: config.tokens.accessTtlMinutes,
          user: sanitiseUser(user),
          sessionId: tokenRecord.id,
          csrfToken: csrf
        });
      } else {
        applyAuthCookies(res, { accessToken, refreshToken, sessionId: tokenRecord.id, csrf });
        res.json({
          user: sanitiseUser(user),
          expiresInMinutes: config.tokens.accessTtlMinutes,
          sessionId: tokenRecord.id
        });
      }

      await recordSecurityEvent({
        eventType: 'auth_login',
        action: 'admin:login',
        status: 'granted',
        userId: user.id,
        actorRole: user.type,
        metadata: { client }
      });
      return;
    }

    const { rawToken: refreshToken, tokenRecord } = await issueRefreshSession({
      userId: user.id,
      context: client === 'mobile' ? 'mobile' : 'web',
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

      const accessToken = await buildAccessToken(user, tokenRecord.id);
    const csrf = csrfToken();

    if (client === 'mobile') {
      mobileResponse(res, {
        accessToken,
        refreshToken,
        expiresInMinutes: config.tokens.accessTtlMinutes,
        user: sanitiseUser(user),
        sessionId: tokenRecord.id,
        csrfToken: csrf
      });
    } else {
      applyAuthCookies(res, { accessToken, refreshToken, sessionId: tokenRecord.id, csrf });
      res.json({
        user: sanitiseUser(user),
        expiresInMinutes: config.tokens.accessTtlMinutes,
        sessionId: tokenRecord.id
      });
    }

    await recordSecurityEvent({
      eventType: 'auth_login',
      action: 'user:login',
      status: 'granted',
      userId: user.id,
      actorRole: user.type,
      metadata: { client }
    });
  } catch (error) {
    next(error);
  }
}

function resolveRefreshToken(req) {
  return (
    req.signedCookies?.[config.session.refreshCookieName] ||
    req.cookies?.[config.session.refreshCookieName] ||
    req.body?.refreshToken ||
    null
  );
}

export async function refresh(req, res, next) {
  try {
    const currentToken = resolveRefreshToken(req);
    if (!currentToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const session = await findActiveSession(currentToken);
    if (!session) {
      await recordSecurityEvent({
        eventType: 'auth_refresh',
        action: 'token:refresh',
        status: 'denied',
        metadata: { reason: 'session_not_found' }
      });
      return res.status(401).json({ message: 'Session expired' });
    }

    const user = await User.findByPk(session.userId, { include: [{ model: Company }] });
    if (!user) {
      await recordSecurityEvent({
        eventType: 'auth_refresh',
        action: 'token:refresh',
        status: 'denied',
        metadata: { reason: 'user_not_found', sessionId: session.id }
      });
      return res.status(401).json({ message: 'Session invalid' });
    }

    const rotation = await rotateRefreshSession(currentToken, {
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    if (!rotation) {
      return res.status(401).json({ message: 'Session expired' });
    }

    const { nextToken, nextSession } = rotation;

    const accessToken = await buildAccessToken(user, nextSession.id);
    const csrf = csrfToken();

    if (req.body?.client === 'mobile') {
      res.json({
        accessToken,
        refreshToken: nextToken,
        expiresInMinutes: config.tokens.accessTtlMinutes,
        sessionId: nextSession.id,
        csrfToken: csrf
      });
    } else {
      applyAuthCookies(res, { accessToken, refreshToken: nextToken, sessionId: nextSession.id, csrf });
      res.json({
        expiresInMinutes: config.tokens.accessTtlMinutes,
        sessionId: nextSession.id
      });
    }

    await recordSecurityEvent({
      eventType: 'auth_refresh',
      action: 'token:refresh',
      status: 'granted',
      userId: user.id,
      actorRole: user.type,
      metadata: { sessionId: nextSession.id }
    });
  } catch (error) {
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    const refreshToken = resolveRefreshToken(req);
    if (refreshToken) {
      await revokeSession(refreshToken);
    }

    const clearOptions = {
      path: config.session.path,
      domain: config.session.domain,
      sameSite: config.session.sameSite,
      secure: config.session.secure
    };

    res.clearCookie(config.session.accessCookieName, clearOptions);
    res.clearCookie(config.session.refreshCookieName, clearOptions);
    res.clearCookie(config.session.cookieName, clearOptions);
    res.clearCookie('fixnado.csrf', { ...clearOptions, httpOnly: false });

    await recordSecurityEvent({
      eventType: 'auth_logout',
      action: 'user:logout',
      status: 'granted',
      metadata: { from: req.ip }
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function profile(req, res, next) {
  try {
    const userId = req.auth?.actorId;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findByPk(userId, {
      include: [{ model: Company }]
    });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    return res.json({ user: sanitiseUser(user) });
  } catch (error) {
    next(error);
  }
}
