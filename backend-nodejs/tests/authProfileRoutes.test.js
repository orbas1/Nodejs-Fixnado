import request from 'supertest';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';
import { withAuth } from './helpers/auth.js';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

const { default: app } = await import('../src/app.js');
const { sequelize, User, Company, UserPreference, UserSession } = await import('../src/models/index.js');

async function createUserFixture(overrides = {}) {
  return User.create(
    {
      firstName: 'Avery',
      lastName: 'Stone',
      email: 'avery@example.com',
      passwordHash: 'hash',
      type: 'user',
      address: '100 Market Street, London',
      ...overrides
    },
    { validate: false }
  );
}

async function createActiveSession(user, overrides = {}) {
  return UserSession.create({
    userId: user.id,
    refreshTokenHash: `test-refresh-${user.id}-${Date.now()}-${Math.random()}`,
    clientType: 'web',
    clientVersion: 'vitest',
    deviceLabel: 'vitest',
    ipAddress: '127.0.0.1',
    userAgent: 'vitest',
    metadata: null,
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    lastUsedAt: new Date(),
    ...overrides
  });
}

describe('Auth profile routes', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await sequelize.truncate({ cascade: true, restartIdentity: true });
  });

  it('returns an enriched profile snapshot for the authenticated user', async () => {
    const user = await createUserFixture();
    await Company.create({
      userId: user.id,
      legalStructure: 'limited',
      contactName: 'Fixnado Operations',
      contactEmail: user.email,
      serviceRegions: 'London',
      marketplaceIntent: 'Operations automation',
      verified: true
    });

    await UserPreference.create({
      userId: user.id,
      timezone: 'Europe/London',
      locale: 'en-GB',
      organisation: 'Fixnado',
      jobTitle: 'Operations Lead',
      teamName: 'Dispatch',
      avatarUrl: 'https://cdn.fixnado.com/profiles/avery-stone.png',
      signature: 'Avery Stone\nOperations Lead',
      digestFrequency: 'daily',
      emailAlerts: true,
      smsAlerts: true,
      pushAlerts: true,
      marketingOptIn: false,
      primaryPhone: '+44 20 7000 0000',
      workspaceShortcuts: ['provider', 'finance'],
      roleAssignments: [
        {
          id: 'provider-access',
          role: 'provider',
          allowCreate: true,
          dashboards: ['provider', 'finance'],
          notes: 'Manages field crews'
        }
      ],
      notificationChannels: [
        { id: 'ops-email', type: 'email', label: 'Ops inbox', value: 'ops@fixnado.com' }
      ]
    });

    const sessionRecord = await createActiveSession(user);
    const response = await withAuth(request(app).get('/api/auth/me'), user.id, {
      payload: { sid: sessionRecord.id, role: user.type }
    }).expect(200);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: user.id,
      email: user.email,
      firstName: 'Avery',
      lastName: 'Stone',
      organisation: 'Fixnado',
      timezone: 'Europe/London',
      jobTitle: 'Operations Lead',
      teamName: 'Dispatch',
      communicationPreferences: {
        emailAlerts: true,
        smsAlerts: true,
        pushAlerts: true,
        marketingOptIn: false,
        digestFrequency: 'daily'
      },
      workspaceShortcuts: ['provider', 'finance'],
      roleAssignments: [
        expect.objectContaining({ role: 'provider', allowCreate: true })
      ],
      notificationChannels: [
        expect.objectContaining({ type: 'email', value: 'ops@fixnado.com' })
      ],
      security: {
        twoFactorEmail: false,
        twoFactorApp: false
      }
    });
  });

  it('updates the profile, preferences, and security controls', async () => {
    const user = await createUserFixture({ type: 'provider', twoFactorEmail: false, twoFactorApp: false });

    const payload = {
      firstName: 'Jordan',
      lastName: 'Miles',
      address: '200 Mission St, San Francisco',
      organisation: 'Fixnado USA',
      timezone: 'America/Los_Angeles',
      locale: 'en-US',
      phone: '+1 415 555 1212',
      jobTitle: 'Regional Lead',
      teamName: 'West Coast Ops',
      avatarUrl: 'https://cdn.fixnado.com/profiles/jordan-miles.png',
      signature: 'Jordan Miles\nRegional Lead',
      communicationPreferences: {
        emailAlerts: true,
        smsAlerts: false,
        pushAlerts: true,
        marketingOptIn: true,
        digestFrequency: 'weekly'
      },
      workspaceShortcuts: ['enterprise', 'finance'],
      roleAssignments: [
        {
          role: 'enterprise',
          allowCreate: false,
          dashboards: ['enterprise', 'finance'],
          notes: 'Reporting access only'
        }
      ],
      notificationChannels: [
        { type: 'sms', label: 'Critical alerts', value: '+14155551212' }
      ],
      security: {
        twoFactorEmail: true,
        twoFactorApp: true
      }
    };

    const sessionRecord = await createActiveSession(user);
    const response = await withAuth(request(app).put('/api/auth/me'), user.id, {
      payload: { sid: sessionRecord.id, role: user.type }
    })
      .send(payload)
      .expect(200);

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      firstName: 'Jordan',
      lastName: 'Miles',
      organisation: 'Fixnado USA',
      timezone: 'America/Los_Angeles',
      locale: 'en-US',
      phone: '+1 415 555 1212',
      communicationPreferences: {
        emailAlerts: true,
        smsAlerts: false,
        pushAlerts: true,
        marketingOptIn: true,
        digestFrequency: 'weekly'
      },
      security: {
        twoFactorEmail: true,
        twoFactorApp: true
      }
    });

    const updatedUser = await User.findByPk(user.id, {
      include: [{ model: UserPreference, as: 'preferences' }]
    });

    expect(updatedUser.firstName).toBe('Jordan');
    expect(updatedUser.lastName).toBe('Miles');
    expect(updatedUser.twoFactorEmail).toBe(true);
    expect(updatedUser.twoFactorApp).toBe(true);
    expect(updatedUser.preferences.timezone).toBe('America/Los_Angeles');
    expect(updatedUser.preferences.workspaceShortcuts).toEqual(['enterprise', 'finance']);
    expect(updatedUser.preferences.roleAssignments).toHaveLength(1);
    expect(updatedUser.preferences.notificationChannels[0]).toMatchObject({
      type: 'sms',
      value: '+14155551212'
    });
  });

  it('prevents non-admin actors from granting admin role allowances', async () => {
    const user = await createUserFixture();

    const sessionRecord = await createActiveSession(user);
    const response = await withAuth(request(app).put('/api/auth/me'), user.id, {
      payload: { sid: sessionRecord.id, role: 'user' }
    })
      .send({
        firstName: 'Avery',
        lastName: 'Stone',
        timezone: 'UTC',
      locale: 'en-GB',
      communicationPreferences: {},
      workspaceShortcuts: ['admin'],
      roleAssignments: [
        { role: 'admin', allowCreate: true, dashboards: ['admin'] }
      ]
    });

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({
      message: 'Only administrators can grant admin workspace access.'
    });
  });
});
