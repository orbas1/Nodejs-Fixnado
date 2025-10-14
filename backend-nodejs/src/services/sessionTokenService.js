import crypto from 'node:crypto';
import { Op } from 'sequelize';
import { SessionToken } from '../models/index.js';
import config from '../config/index.js';

const TOKEN_SIZE_BYTES = 64;

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
}

function createRandomToken() {
  return crypto.randomBytes(TOKEN_SIZE_BYTES).toString('base64url');
}

function calculateExpiry(ttlHours) {
  const hours = Number.isFinite(ttlHours) ? ttlHours : config.tokens.refreshTtlHours;
  const durationMs = Math.max(hours, 1) * 60 * 60 * 1000;
  return new Date(Date.now() + durationMs);
}

export async function issueRefreshSession({
  userId,
  context = 'web',
  ipAddress,
  userAgent,
  ttlHours = config.tokens.refreshTtlHours
}) {
  const rawToken = createRandomToken();
  const expiresAt = calculateExpiry(ttlHours);
  const issuedAt = new Date();
  const tokenRecord = await SessionToken.create({
    userId,
    context,
    issuedAt,
    expiresAt,
    tokenHash: hashToken(rawToken),
    ipAddress: ipAddress?.slice(0, 64) ?? null,
    userAgent: userAgent?.slice(0, 512) ?? null
  });

  return { rawToken, tokenRecord };
}

export async function findActiveSession(rawToken, { userId } = {}) {
  if (!rawToken) {
    return null;
  }

  const tokenHash = hashToken(rawToken);
  const now = new Date();
  const whereClause = {
    tokenHash,
    revokedAt: { [Op.is]: null },
    expiresAt: { [Op.gt]: now }
  };

  if (userId) {
    whereClause.userId = userId;
  }

  const session = await SessionToken.findOne({ where: whereClause });
  return session;
}

export async function rotateRefreshSession(rawToken, { ipAddress, userAgent } = {}) {
  const session = await findActiveSession(rawToken);
  if (!session) {
    return null;
  }

  const now = new Date();
  session.lastRotatedAt = now;
  session.expiresAt = calculateExpiry(config.tokens.refreshTtlHours);
  session.ipAddress = ipAddress?.slice(0, 64) ?? session.ipAddress;
  session.userAgent = userAgent?.slice(0, 512) ?? session.userAgent;
  await session.save();

  const { rawToken: nextToken, tokenRecord: nextSession } = await issueRefreshSession({
    userId: session.userId,
    context: session.context,
    ipAddress,
    userAgent
  });

  session.revokedAt = now;
  await session.save();

  return { previousSession: session, nextToken, nextSession };
}

export async function revokeSession(rawToken) {
  const session = await findActiveSession(rawToken);
  if (!session) {
    return false;
  }

  session.revokedAt = new Date();
  await session.save();
  return true;
}

export async function revokeAllSessions(userId, context) {
  const whereClause = {
    userId,
    revokedAt: { [Op.is]: null }
  };

  if (context) {
    whereClause.context = context;
  }

  await SessionToken.update(
    { revokedAt: new Date() },
    {
      where: whereClause
    }
  );
}

export { hashToken };
