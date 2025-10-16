import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

const { UserSession } = await import('../../src/models/index.js');
const { default: config } = await import('../../src/config/index.js');

export async function createSessionToken(user, { role = user.type, persona = null, expiresIn = '1h' } = {}) {
  if (!user) {
    throw new Error('createSessionToken requires a user instance');
  }

  const session = await UserSession.create({
    userId: user.id,
    refreshTokenHash: crypto.randomBytes(32).toString('hex'),
    sessionFingerprint: crypto.randomBytes(16).toString('hex'),
    clientType: 'web',
    clientVersion: 'vitest',
    deviceLabel: 'vitest',
    ipAddress: '127.0.0.1',
    userAgent: 'vitest',
    metadata: { persona },
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    lastUsedAt: new Date()
  });

  const token = jwt.sign(
    {
      sub: user.id,
      sid: session.id,
      role,
      persona
    },
    config.jwt.secret,
    {
      expiresIn,
      audience: 'fixnado:web',
      issuer: 'fixnado-api'
    }
  );

  return { token: `Bearer ${token}`, session };
}

export default { createSessionToken };
