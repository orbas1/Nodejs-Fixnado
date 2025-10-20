import crypto from 'node:crypto';
import express from 'express';
import request from 'supertest';
import bcrypt from 'bcrypt';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
process.env.ADMIN_SECURITY_TOKEN = process.env.ADMIN_SECURITY_TOKEN || 'admin-test-token';

vi.mock('../src/middleware/auth.js', () => ({
  authenticate: (_req, _res, next) => next()
}));

let app;
let sequelize;
let User;
let Company;
let UserSession;
let Region;
let config;

function extractCookieValue(cookies, name) {
  if (!Array.isArray(cookies)) {
    return null;
  }

  const target = cookies.find((cookie) => {
    if (typeof cookie !== 'string') {
      return false;
    }
    return cookie.trim().toLowerCase().startsWith(`${name.toLowerCase()}=`);
  });

  if (!target) {
    return null;
  }

  const firstPart = target.split(';', 1)[0];
  const separatorIndex = firstPart.indexOf('=');
  if (separatorIndex === -1) {
    return null;
  }
  return firstPart.slice(separatorIndex + 1);
}

describe('Authentication routes integration', () => {
  beforeAll(async () => {
    ({ sequelize, User, Company, UserSession, Region } = await import('../src/models/index.js'));
    ({ default: config } = await import('../src/config/index.js'));
    const authRoutes = (await import('../src/routes/authRoutes.js')).default;

    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);

    await Region.sync({ force: true });
    await User.sync({ force: true });
    await Company.sync({ force: true });
    await UserSession.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    vi.useRealTimers();
    await UserSession.drop().catch(() => {});
    await Company.drop().catch(() => {});
    await User.drop().catch(() => {});
    await Region.drop().catch(() => {});
    await Region.sync({ force: true });
    await User.sync({ force: true });
    await Company.sync({ force: true });
    await UserSession.sync({ force: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const accountScenarios = [
    {
      label: 'customer user',
      type: 'user'
    },
    {
      label: 'servicemen user',
      type: 'servicemen'
    },
    {
      label: 'provider admin user',
      type: 'provider_admin'
    },
    {
      label: 'operations admin user',
      type: 'operations_admin'
    },
    {
      label: 'company account',
      type: 'company',
      company: {
        contactName: 'Aria Stone',
        contactEmail: 'contact@acme.test',
        legalStructure: 'limited',
        serviceRegions: 'london,manchester',
        marketplaceIntent: 'market-expansion'
      }
    }
  ];

  for (const scenario of accountScenarios) {
    it(`registers and logs in a ${scenario.label}`, async () => {
      const password = `StrongPass!${scenario.type}`;
      const email = `${scenario.type.replace(/[^a-z]/gi, '')}@example.test`;
      const payload = {
        firstName: `Test-${scenario.type}`,
        lastName: 'User',
        email,
        password,
        type: scenario.type,
        address: '10 Downing Street, London',
        age: 30,
        ...(scenario.company ? { company: scenario.company } : {})
      };

      const registerResponse = await request(app).post('/api/auth/register').send(payload).expect(201);

      expect(registerResponse.body).toMatchObject({
        id: expect.any(String),
        email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        type: scenario.type
      });
      expect(registerResponse.body).not.toHaveProperty('passwordHash');

      const storedUser = await User.findOne({ where: { email } });
      expect(storedUser).not.toBeNull();
      expect(storedUser.type).toBe(scenario.type);
      const passwordMatches = await bcrypt.compare(password, storedUser.passwordHash);
      expect(passwordMatches).toBe(true);

      if (scenario.type === 'company') {
        const companyRecord = await Company.findOne({ where: { userId: storedUser.id } });
        expect(companyRecord).not.toBeNull();
        expect(companyRecord.contactName).toBe(scenario.company.contactName);
        expect(companyRecord.contactEmail).toBe(scenario.company.contactEmail);
        expect(companyRecord.legalStructure).toBe(scenario.company.legalStructure);
      } else {
        const relatedCompany = await Company.findOne({ where: { userId: storedUser.id } });
        expect(relatedCompany).toBeNull();
      }

      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email, password })
        .expect(200);

      expect(loginResponse.body.user).toMatchObject({ id: storedUser.id, email, type: scenario.type });
      expect(loginResponse.body.session).toMatchObject({ id: expect.any(String), expiresAt: expect.any(String) });
      expect(loginResponse.body.tokens).toBeNull();
      expect(loginResponse.body.expiresIn).toBe('15m');

      const cookies = loginResponse.headers['set-cookie'];
      expect(Array.isArray(cookies)).toBe(true);
      expect(cookies).toEqual(
        expect.arrayContaining([
          expect.stringContaining(`${config.auth.session.cookieName}=`),
          expect.stringContaining(`${config.auth.session.refreshCookieName}=`)
        ])
      );

      const sessionCount = await UserSession.count();
      expect(sessionCount).toBe(1);
    });
  }

  it('issues extended refresh sessions when rememberMe is true', async () => {
    const password = 'LongLived!Pass1';
    const email = 'persistent@example.test';
    const now = new Date('2025-02-01T12:00:00Z');
    vi.useFakeTimers();
    vi.setSystemTime(now);

    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Persistent',
        lastName: 'User',
        email,
        password,
        type: 'user',
        address: '1 Persistence Way'
      })
      .expect(201);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email, password, rememberMe: true })
      .expect(200);

    const cookies = loginResponse.headers['set-cookie'];
    const refreshCookie = extractCookieValue(cookies, config.auth.session.refreshCookieName);
    expect(refreshCookie).toBeTruthy();

    const sessionRecord = await UserSession.findOne();
    expect(sessionRecord).not.toBeNull();

    const expectedRefreshExpiry = new Date(now.getTime() + 28 * 24 * 60 * 60 * 1000);
    expect(Math.abs(sessionRecord.expiresAt.getTime() - expectedRefreshExpiry.getTime())).toBeLessThan(1000);

    const hashedCookie = crypto.createHash('sha512').update(refreshCookie).digest('hex');
    expect(sessionRecord.refreshTokenHash).toBe(hashedCookie);

    const sessionExpiresAt = new Date(loginResponse.body.session.expiresAt);
    const expectedAccessExpiry = new Date(now.getTime() + 15 * 60 * 1000);
    expect(Math.abs(sessionExpiresAt.getTime() - expectedAccessExpiry.getTime())).toBeLessThan(1000);
  });

  it('returns bearer tokens for mobile clients', async () => {
    const password = 'Mobile#Pass123';
    const email = 'mobile@example.test';

    await request(app)
      .post('/api/auth/register')
      .send({
        firstName: 'Mobile',
        lastName: 'Tester',
        email,
        password,
        type: 'user',
        address: '3 App Street'
      })
      .expect(201);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email, password, clientType: 'Flutter', clientVersion: '2.0.0', deviceLabel: 'Pixel 9', rememberMe: false })
      .expect(200);

    expect(response.body.tokens).toEqual({
      accessToken: expect.stringMatching(/^ey/),
      refreshToken: expect.stringMatching(/^[A-Za-z0-9_-]+$/)
    });

    const cookies = response.headers['set-cookie'];
    expect(cookies).toEqual(
      expect.arrayContaining([
        expect.stringContaining(`${config.auth.session.cookieName}=`),
        expect.stringContaining(`${config.auth.session.refreshCookieName}=`)
      ])
    );
  });

  it('requires a valid security token for admin login', async () => {
    const password = 'Admin$ecure123';
    const passwordHash = await bcrypt.hash(password, 10);
    const admin = await User.create({
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@example.test',
      passwordHash,
      type: 'admin',
      address: 'Admin HQ'
    });

    await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password })
      .expect(401);

    await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password, securityToken: 'wrong-token' })
      .expect(401);

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password, securityToken: process.env.ADMIN_SECURITY_TOKEN })
      .expect(200);

    expect(response.body.user).toMatchObject({ id: admin.id, email: admin.email, type: 'admin' });
    expect(response.body.session).toMatchObject({
      id: expect.any(String),
      role: expect.any(String),
      persona: expect.any(String)
    });
    expect(response.body.expiresIn).toBe('12h');

    const cookies = response.headers['set-cookie'];
    expect(cookies).toEqual(
      expect.arrayContaining([
        expect.stringContaining(`${config.auth.session.cookieName}=`),
        expect.stringContaining(`${config.auth.session.refreshCookieName}=`)
      ])
    );

    const sessionCount = await UserSession.count();
    expect(sessionCount).toBe(1);
  });

  it('rejects invalid rememberMe values', async () => {
    const password = 'InvalidFlag#1';
    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({
      firstName: 'Morgan',
      lastName: 'Quinn',
      email: 'invalid@example.test',
      passwordHash,
      type: 'user',
      address: '42 Invalid Lane'
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'invalid@example.test', password, rememberMe: 'sometimes' })
      .expect(422);

    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          msg: 'rememberMe must be a boolean value',
          path: 'rememberMe'
        })
      ])
    );
  });
});

