import { describe, expect, it, beforeEach, beforeAll, afterEach, vi } from 'vitest';

import config from '../src/config/index.js';
import { User, UserSession } from '../src/models/index.js';

vi.mock('../src/services/accessControlService.js', () => ({
  resolveActorContext: vi.fn().mockReturnValue({
    role: 'user',
    persona: 'customer',
    tenantId: 'tenant-1',
    fingerprint: 'fp-test',
  }),
}));

let issueSession;
let rotateSession;
let setSessionCookies;
let extractTokens;

beforeAll(async () => {
  ({ issueSession, rotateSession, setSessionCookies, extractTokens } = await import('../src/services/sessionService.js'));
});

describe('sessionService', () => {
  const user = { id: 'user-1', type: 'user' };
  let dateNowSpy;

  beforeEach(() => {
    dateNowSpy = vi.spyOn(Date, 'now').mockReturnValue(new Date('2025-03-12T10:00:00Z').valueOf());
  });

  afterEach(() => {
    dateNowSpy?.mockRestore();
    vi.clearAllMocks();
  });

  it('issues a session with hashed refresh token and jwt payload', async () => {
    const fakeSession = {
      id: 'session-123',
      createdAt: new Date('2025-03-12T10:00:00Z'),
    };
    const createSpy = vi.spyOn(UserSession, 'create').mockResolvedValue(fakeSession);

    const result = await issueSession({ user, headers: {}, ipAddress: '127.0.0.1', userAgent: 'vitest' });

    expect(createSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: user.id,
        refreshTokenHash: expect.any(String),
        clientType: 'web',
        ipAddress: '127.0.0.1',
      }),
    );
    expect(result.session).toEqual(fakeSession);
    expect(result.accessToken).toMatch(/^ey/);
    expect(typeof result.refreshToken).toBe('string');
    expect(result.accessTokenExpiresAt.toISOString()).toBe('2025-03-12T10:15:00.000Z');
    expect(result.refreshTokenExpiresAt.toISOString()).toBe('2025-03-26T10:00:00.000Z');
  });

  it('rotates an existing session and re-issues jwt', async () => {
    const storedSession = {
      id: 'session-123',
      userId: user.id,
      isActive: () => true,
      expiresAt: new Date('2025-03-26T10:00:00Z'),
      save: vi.fn().mockResolvedValue(),
      metadata: null,
    };
    vi.spyOn(UserSession, 'findOne').mockResolvedValue(storedSession);
    vi.spyOn(User, 'findByPk').mockResolvedValue(user);

    const result = await rotateSession('legacy-refresh-token', { headers: {}, ipAddress: '127.0.0.1' });

    expect(storedSession.save).toHaveBeenCalled();
    expect(result.session).toBe(storedSession);
    expect(result.refreshTokenExpiresAt.toISOString()).toBe('2025-03-26T10:00:00.000Z');
    expect(typeof result.refreshToken).toBe('string');
    expect(result.accessToken).toMatch(/^ey/);
  });

  it('writes secure cookies for web clients', () => {
    const res = { cookie: vi.fn() };
    const accessExpiry = new Date('2025-03-12T10:15:00Z');
    const refreshExpiry = new Date('2025-03-26T10:00:00Z');

    setSessionCookies(res, {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      accessTokenExpiresAt: accessExpiry,
      refreshTokenExpiresAt: refreshExpiry,
    });

    expect(res.cookie).toHaveBeenCalledWith(
      config.auth.session.cookieName,
      'access-token',
      expect.objectContaining({
        httpOnly: true,
        secure: config.auth.session.cookieSecure,
        expires: accessExpiry,
      }),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      config.auth.session.refreshCookieName,
      'refresh-token',
      expect.objectContaining({
        httpOnly: true,
        expires: refreshExpiry,
      }),
    );
  });

  it('extracts tokens from cookies and authorization header', () => {
    const req = {
      headers: {
        authorization: 'Bearer bearer-token',
        cookie: `${config.auth.session.cookieName}=cookie-access; ${config.auth.session.refreshCookieName}=cookie-refresh; other=value`,
      },
    };

    const tokens = extractTokens(req);

    expect(tokens).toEqual({
      bearerToken: 'bearer-token',
      accessToken: 'cookie-access',
      refreshToken: 'cookie-refresh',
    });
  });
});
