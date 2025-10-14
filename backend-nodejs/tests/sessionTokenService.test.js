import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  findActiveSession,
  issueRefreshSession,
  revokeAllSessions,
  revokeSession,
  rotateRefreshSession
} from '../src/services/sessionTokenService.js';
import sequelize from '../src/config/database.js';
import { SessionToken, User } from '../src/models/index.js';

const TEST_USER_ID = '11111111-2222-4333-8444-555555555555';

async function ensureUser() {
  const [user] = await User.findOrCreate({
    where: { id: TEST_USER_ID },
    defaults: {
      id: TEST_USER_ID,
      firstName: 'Vault',
      lastName: 'Tester',
      email: 'vault-tester@example.com',
      passwordHash: 'hash',
      type: 'user'
    }
  });
  return user;
}

describe('sessionTokenService', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await ensureUser();
  });

  beforeEach(async () => {
    await SessionToken.destroy({ where: {} });
  });

  it('issues refresh sessions with hashed tokens and persistence metadata', async () => {
    const { rawToken, tokenRecord } = await issueRefreshSession({
      userId: TEST_USER_ID,
      context: 'web',
      ipAddress: '192.0.2.10',
      userAgent: 'vitest'
    });

    expect(typeof rawToken).toBe('string');
    expect(rawToken).toHaveLength(86);
    expect(tokenRecord.tokenHash).not.toBe(rawToken);

    const stored = await SessionToken.findByPk(tokenRecord.id);
    expect(stored).toBeTruthy();
    expect(stored.tokenHash).toBe(tokenRecord.tokenHash);
    expect(stored.ipAddress).toBe('192.0.2.10');
    expect(stored.userAgent).toBe('vitest');
  });

  it('finds active sessions and enforces revocation semantics', async () => {
    const { rawToken } = await issueRefreshSession({ userId: TEST_USER_ID });
    const active = await findActiveSession(rawToken);
    expect(active).toBeTruthy();
    expect(await findActiveSession('invalid')).toBeNull();

    const revoked = await revokeSession(rawToken);
    expect(revoked).toBe(true);
    expect(await findActiveSession(rawToken)).toBeNull();
    expect(await revokeSession(rawToken)).toBe(false);
  });

  it('rotates refresh tokens atomically and revokes the previous session', async () => {
    const { rawToken } = await issueRefreshSession({
      userId: TEST_USER_ID,
      context: 'mobile',
      ipAddress: '203.0.113.5',
      userAgent: 'ios'
    });

    const rotation = await rotateRefreshSession(rawToken, {
      ipAddress: '203.0.113.9',
      userAgent: 'android'
    });

    expect(rotation).toBeTruthy();
    expect(rotation.nextToken).toBeDefined();
    expect(rotation.nextSession.context).toBe('mobile');

    const previous = await SessionToken.findByPk(rotation.previousSession.id);
    expect(previous.revokedAt).not.toBeNull();
    expect(previous.lastRotatedAt).not.toBeNull();
    expect(previous.ipAddress).toBe('203.0.113.9');
    expect(previous.userAgent).toBe('android');

    const active = await findActiveSession(rotation.nextToken);
    expect(active).not.toBeNull();
    expect(active.id).toBe(rotation.nextSession.id);
  });

  it('revokes all sessions for a user and optional context', async () => {
    const web = await issueRefreshSession({ userId: TEST_USER_ID, context: 'web' });
    const mobile = await issueRefreshSession({ userId: TEST_USER_ID, context: 'mobile' });

    await revokeAllSessions(TEST_USER_ID, 'web');

    expect(await findActiveSession(web.rawToken)).toBeNull();
    expect(await findActiveSession(mobile.rawToken)).not.toBeNull();

    await revokeAllSessions(TEST_USER_ID);
    expect(await findActiveSession(mobile.rawToken)).toBeNull();
  });
});
