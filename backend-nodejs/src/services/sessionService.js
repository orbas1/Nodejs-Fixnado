import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import config from '../config/index.js';
import { UserSession, User } from '../models/index.js';
import { resolveActorContext } from './accessControlService.js';

const ACCESS_TTL_SECONDS = config.auth.session.accessTokenTtlSeconds;
const REFRESH_TTL_DAYS = config.auth.session.refreshTokenTtlDays;
const JWT_SIGN_ALGORITHM = Array.isArray(config.jwt.algorithms) && config.jwt.algorithms.length > 0
  ? config.jwt.algorithms[0]
  : 'HS256';
const JWT_VERIFY_ALGORITHMS = Array.isArray(config.jwt.algorithms) && config.jwt.algorithms.length > 0
  ? config.jwt.algorithms
  : undefined;
const JWT_MAX_AGE_SECONDS = Number.isFinite(config.jwt.maxTokenAgeSeconds)
  ? config.jwt.maxTokenAgeSeconds
  : ACCESS_TTL_SECONDS;
const JWT_CLOCK_TOLERANCE_SECONDS = Number.isFinite(config.jwt.clockToleranceSeconds)
  ? config.jwt.clockToleranceSeconds
  : 0;

function generateRefreshToken() {
  return crypto.randomBytes(48).toString('base64url');
}

function hashToken(token) {
  return crypto.createHash('sha512').update(token).digest('hex');
}

function toDate(value) {
  if (value instanceof Date) {
    return value;
  }
  return new Date(value);
}

function buildCookieOptions(expiresAt, overrides = {}) {
  const expiry = toDate(expiresAt);
  return {
    httpOnly: true,
    secure: config.auth.session.cookieSecure,
    sameSite: config.auth.session.cookieSameSite,
    domain: config.auth.session.cookieDomain,
    path: config.auth.session.cookiePath,
    expires: expiry,
    ...overrides
  };
}

function sanitiseMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return null;
  }
  try {
    return JSON.parse(JSON.stringify(metadata));
  } catch (_error) {
    return null;
  }
}

function signAccessToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: ACCESS_TTL_SECONDS,
    audience: config.jwt.audience,
    issuer: config.jwt.issuer,
    algorithm: JWT_SIGN_ALGORITHM
  });
}

export async function issueSession({
  user,
  headers = {},
  ipAddress,
  userAgent,
  clientType = 'web',
  deviceLabel,
  metadata,
  remember = false
}) {
  if (!user) {
    throw new Error('Cannot issue a session without a user.');
  }

  const actorContext = resolveActorContext({ user, headers, ipAddress, userAgent });
  const accessExpiresAt = new Date(Date.now() + ACCESS_TTL_SECONDS * 1000);
  const refreshWindowDays = remember ? REFRESH_TTL_DAYS * 2 : REFRESH_TTL_DAYS;
  const refreshExpiresAt = new Date(Date.now() + refreshWindowDays * 24 * 60 * 60 * 1000);
  const refreshToken = generateRefreshToken();

  const session = await UserSession.create({
    userId: user.id,
    refreshTokenHash: hashToken(refreshToken),
    sessionFingerprint: actorContext.fingerprint,
    clientType,
    clientVersion: metadata?.clientVersion ?? null,
    deviceLabel: deviceLabel ?? null,
    ipAddress: ipAddress ? String(ipAddress).slice(0, 64) : null,
    userAgent: userAgent ? String(userAgent).slice(0, 512) : null,
    metadata: sanitiseMetadata({ ...metadata, persona: actorContext.persona }),
    expiresAt: refreshExpiresAt,
    lastUsedAt: new Date()
  });

  const accessToken = signAccessToken({
    sub: user.id,
    sid: session.id,
    role: actorContext.role,
    persona: actorContext.persona,
    tenantId: actorContext.tenantId
  });

  return {
    session,
    accessToken,
    refreshToken,
    accessTokenExpiresAt: accessExpiresAt,
    refreshTokenExpiresAt: refreshExpiresAt,
    actorContext
  };
}

export async function rotateSession(refreshToken, { headers = {}, ipAddress, userAgent } = {}) {
  if (!refreshToken) {
    throw new Error('Refresh token required.');
  }
  const hashed = hashToken(refreshToken);
  const session = await UserSession.findOne({ where: { refreshTokenHash: hashed } });
  if (!session || !session.isActive()) {
    throw new Error('Session expired or revoked.');
  }

  const user = await User.findByPk(session.userId);
  if (!user) {
    throw new Error('Session user no longer exists.');
  }

  const actorContext = resolveActorContext({ user, headers, ipAddress, userAgent });
  const accessExpiresAt = new Date(Date.now() + ACCESS_TTL_SECONDS * 1000);
  const nextRefreshToken = generateRefreshToken();
  const rollingExpiry = config.auth.session.rollingSessions
    ? new Date(Date.now() + REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000)
    : session.expiresAt;

  session.refreshTokenHash = hashToken(nextRefreshToken);
  session.lastUsedAt = new Date();
  session.expiresAt = rollingExpiry;
  session.ipAddress = ipAddress ? String(ipAddress).slice(0, 64) : session.ipAddress;
  session.userAgent = userAgent ? String(userAgent).slice(0, 512) : session.userAgent;
  session.metadata = sanitiseMetadata({ ...session.metadata, rotatedAt: new Date().toISOString() }) ?? session.metadata;
  await session.save();

  const accessToken = signAccessToken({
    sub: user.id,
    sid: session.id,
    role: actorContext.role,
    persona: actorContext.persona,
    tenantId: actorContext.tenantId
  });

  return {
    session,
    accessToken,
    refreshToken: nextRefreshToken,
    accessTokenExpiresAt: accessExpiresAt,
    refreshTokenExpiresAt: rollingExpiry,
    actorContext
  };
}

export async function revokeSession(sessionId) {
  if (!sessionId) {
    return;
  }
  await UserSession.update(
    { revokedAt: new Date() },
    {
      where: { id: sessionId }
    }
  );
}

export async function revokeUserSessions(userId, { exceptSessionId } = {}) {
  if (!userId) {
    return;
  }
  const where = { userId };
  if (exceptSessionId) {
    where.id = { [Op.ne]: exceptSessionId };
  }
  await UserSession.update({ revokedAt: new Date() }, { where });
}

export function setSessionCookies(res, { accessToken, refreshToken, accessTokenExpiresAt, refreshTokenExpiresAt }) {
  if (!res?.cookie) {
    return;
  }
  res.cookie(config.auth.session.cookieName, accessToken, buildCookieOptions(accessTokenExpiresAt));
  res.cookie(
    config.auth.session.refreshCookieName,
    refreshToken,
    buildCookieOptions(refreshTokenExpiresAt, { httpOnly: true })
  );
}

export function clearSessionCookies(res) {
  if (!res?.clearCookie) {
    return;
  }
  const options = buildCookieOptions(new Date(0));
  res.clearCookie(config.auth.session.cookieName, options);
  res.clearCookie(config.auth.session.refreshCookieName, options);
}

function parseCookies(header) {
  const jar = new Map();
  if (!header || typeof header !== 'string') {
    return jar;
  }
  const pairs = header.split(';');
  pairs.forEach((pair) => {
    const index = pair.indexOf('=');
    if (index === -1) {
      return;
    }
    const key = pair.slice(0, index).trim();
    const value = pair.slice(index + 1).trim();
    try {
      jar.set(key, decodeURIComponent(value));
    } catch {
      jar.set(key, value);
    }
  });
  return jar;
}

export function extractTokens(req) {
  const authHeader = req.headers?.authorization ?? '';
  const bearerToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : null;
  const cookies = parseCookies(req.headers?.cookie);
  return {
    bearerToken,
    accessToken: cookies.get(config.auth.session.cookieName) ?? null,
    refreshToken: cookies.get(config.auth.session.refreshCookieName) ?? null
  };
}

export function verifyAccessToken(token, { detailed = false } = {}) {
  if (!token) {
    return detailed ? { valid: false, code: 'token_missing', payload: null, error: null } : null;
  }

  try {
    const payload = jwt.verify(token, config.jwt.secret, {
      audience: config.jwt.audience,
      issuer: config.jwt.issuer,
      algorithms: JWT_VERIFY_ALGORITHMS,
      clockTolerance: JWT_CLOCK_TOLERANCE_SECONDS,
      maxAge: `${JWT_MAX_AGE_SECONDS}s`
    });

    return detailed ? { valid: true, code: null, payload } : payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return detailed
        ? { valid: false, code: 'token_expired', payload: null, error }
        : null;
    }
    if (error instanceof jwt.NotBeforeError) {
      return detailed
        ? { valid: false, code: 'token_not_yet_valid', payload: null, error }
        : null;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return detailed
        ? { valid: false, code: 'token_invalid', payload: null, error }
        : null;
    }

    throw error;
  }
}

export default {
  issueSession,
  rotateSession,
  revokeSession,
  revokeUserSessions,
  setSessionCookies,
  clearSessionCookies,
  extractTokens,
  verifyAccessToken
};
