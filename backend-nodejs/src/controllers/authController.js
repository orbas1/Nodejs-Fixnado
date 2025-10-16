import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { validationResult } from 'express-validator';
import { User, Company } from '../models/index.js';
import { getUserProfile, updateUserProfile } from '../services/userProfileService.js';
import config from '../config/index.js';
import {
  issueSession,
  rotateSession,
  revokeSession,
  setSessionCookies,
  clearSessionCookies,
  extractTokens
} from '../services/sessionService.js';

const SALT_ROUNDS = 10;

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

    return res.status(201).json({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      type: user.type
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

export async function login(req, res, next) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }

    const { email, password, securityToken, rememberMe, clientType, deviceLabel, clientVersion } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.type === 'admin') {
      const { securityToken: expectedToken, allowedEmails, allowedDomains, sessionTtlHours } = config.auth.admin;
      if (!expectedToken || !securityToken || !secureCompare(expectedToken, securityToken)) {
        return res.status(401).json({ message: 'Admin security token required' });
      }

      if (!isEmailAllowed(user.email, allowedEmails, allowedDomains)) {
        return res.status(403).json({ message: 'Admin access restricted' });
      }

      const sessionResult = await issueSession({
        user,
        headers: req.headers,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        clientType: 'admin',
        deviceLabel: deviceLabel ?? 'Admin Console',
        metadata: { clientVersion: clientVersion ?? 'web-admin', loginContext: 'admin' },
        remember: rememberMe === true
      });

      setSessionCookies(res, sessionResult);

      return res.json({
        user: { id: user.id, email: user.email, type: user.type },
        session: {
          id: sessionResult.session.id,
          issuedAt: sessionResult.session.createdAt?.toISOString?.() ?? new Date().toISOString(),
          expiresAt: sessionResult.accessTokenExpiresAt.toISOString(),
          refreshExpiresAt: sessionResult.refreshTokenExpiresAt.toISOString(),
          role: sessionResult.actorContext.role,
          persona: sessionResult.actorContext.persona
        },
        tokens: {
          accessToken: sessionResult.accessToken,
          refreshToken: sessionResult.refreshToken
        },
        expiresIn: `${sessionTtlHours}h`
      });
    }

    const detectedClientType = typeof clientType === 'string' ? clientType.toLowerCase().trim() : '';
    const clientPlatform = detectedClientType || `${req.headers['x-client-platform'] ?? ''}`.toLowerCase();
    const mobileClients = new Set(['mobile', 'flutter', 'ios', 'android']);
    const sessionResult = await issueSession({
      user,
      headers: req.headers,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      clientType: mobileClients.has(clientPlatform) ? 'mobile' : 'web',
      deviceLabel: deviceLabel ?? null,
      metadata: { clientVersion: clientVersion ?? req.headers['x-client-version'] ?? null },
      remember: rememberMe === true
    });

    setSessionCookies(res, sessionResult);

    const tokens = mobileClients.has(clientPlatform)
      ? { accessToken: sessionResult.accessToken, refreshToken: sessionResult.refreshToken }
      : null;

    return res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        type: user.type
      },
      session: {
        id: sessionResult.session.id,
        issuedAt: sessionResult.session.createdAt?.toISOString?.() ?? new Date().toISOString(),
        expiresAt: sessionResult.accessTokenExpiresAt.toISOString(),
        refreshExpiresAt: sessionResult.refreshTokenExpiresAt.toISOString(),
        role: sessionResult.actorContext.role,
        persona: sessionResult.actorContext.persona
      },
      tokens,
      expiresIn: `${Math.floor(config.auth.session.accessTokenTtlSeconds / 60)}m`
    });
  } catch (error) {
    next(error);
  }
}

export async function refresh(req, res, next) {
  try {
    const bodyToken = typeof req.body?.refreshToken === 'string' ? req.body.refreshToken : null;
    const { refreshToken } = extractTokens(req);
    const token = bodyToken || refreshToken;
    if (!token) {
      return res.status(401).json({ message: 'Refresh token missing' });
    }

    const rotation = await rotateSession(token, {
      headers: req.headers,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    setSessionCookies(res, rotation);

    return res.json({
      session: {
        id: rotation.session.id,
        issuedAt: rotation.session.updatedAt?.toISOString?.() ?? new Date().toISOString(),
        expiresAt: rotation.accessTokenExpiresAt.toISOString(),
        refreshExpiresAt: rotation.refreshTokenExpiresAt.toISOString(),
        role: rotation.actorContext.role,
        persona: rotation.actorContext.persona
      },
      tokens: {
        accessToken: rotation.accessToken,
        refreshToken: rotation.refreshToken
      }
    });
  } catch (error) {
    clearSessionCookies(res);
    if (error.message && /session/i.test(error.message)) {
      return res.status(401).json({ message: 'Unable to refresh session', detail: error.message });
    }
    next(error);
  }
}

export async function logout(req, res, next) {
  try {
    const sessionId = req.auth?.sessionId;
    if (sessionId) {
      await revokeSession(sessionId);
    }
    clearSessionCookies(res);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

export async function profile(req, res, next) {
  try {
    const snapshot = await getUserProfile({ userId: req.user.id });
    return res.json(snapshot);
  } catch (error) {
    next(error);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const snapshot = await updateUserProfile({
      userId: req.user.id,
      actorRole: req.user.role,
      payload: req.body
    });
    return res.json(snapshot);
  } catch (error) {
    next(error);
  }
}
