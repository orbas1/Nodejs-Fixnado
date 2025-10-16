import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const { default: app } = await import('../src/app.js');
const {
  sequelize,
  User,
  UserProfileSetting,
  UserSession
} = await import('../src/models/index.js');

async function createSessionToken(user, { role = user.type, persona = 'user' } = {}) {
  const session = await UserSession.create({
    userId: user.id,
    refreshTokenHash: crypto.randomBytes(32).toString('hex'),
    sessionFingerprint: crypto.randomBytes(16).toString('hex'),
    clientType: 'web',
    clientVersion: 'vitest',
    deviceLabel: 'vitest-suite',
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
    process.env.JWT_SECRET,
    { expiresIn: '1h', audience: 'fixnado:web', issuer: 'fixnado-api' }
  );

  return { token, session };
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

beforeEach(async () => {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('User profile settings API', () => {
  it('returns default settings for a new customer profile', async () => {
    const user = await User.create(
      {
        firstName: 'Jordan',
        lastName: 'Miles',
        email: 'jordan@example.com',
        passwordHash: 'hash',
        type: 'user'
      },
      { validate: false }
    );

    const { token } = await createSessionToken(user);

    const response = await request(app)
      .get('/api/settings/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body).toHaveProperty('data');
    const { data } = response.body;
    expect(data.profile.firstName).toBe('Jordan');
    expect(data.notifications.quietHours.enabled).toBe(false);
    expect(data.security.twoFactor.enabled).toBe(false);
    const stored = await UserProfileSetting.findOne({ where: { userId: user.id } });
    expect(stored).not.toBeNull();
  });

  it('persists profile, notification, billing, and security updates', async () => {
    const user = await User.create(
      {
        firstName: 'Jordan',
        lastName: 'Miles',
        email: 'jordan@fixnado.test',
        passwordHash: 'hash',
        type: 'user'
      },
      { validate: false }
    );

    const { token } = await createSessionToken(user);

    const payload = {
      profile: {
        firstName: 'Avery',
        lastName: 'Stone',
        email: 'avery@fixnado.test',
        preferredName: 'Ave',
        jobTitle: 'Facilities Lead',
        phoneNumber: '+44 7700 900123',
        timezone: 'Europe/London',
        language: 'en-GB'
      },
      notifications: {
        dispatch: { email: true, sms: true },
        support: { email: true, sms: false },
        quietHours: { enabled: true, start: '20:00', end: '07:00', timezone: 'Europe/London' },
        escalationContacts: [{ name: 'Ops Desk', email: 'ops@example.com' }]
      },
      billing: {
        preferredCurrency: 'USD',
        defaultPaymentMethod: 'Visa 4242',
        paymentNotes: 'Bill to HQ',
        invoiceRecipients: [{ name: 'Finance Team', email: 'finance@example.com' }]
      },
      security: {
        twoFactorApp: true,
        twoFactorEmail: false,
        methods: ['authenticator']
      }
    };

    const response = await request(app)
      .put('/api/settings/profile')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(200);

    expect(response.body.data.profile.firstName).toBe('Avery');
    expect(response.body.data.notifications.dispatch.sms).toBe(true);
    expect(response.body.data.billing.preferredCurrency).toBe('USD');
    expect(response.body.data.security.twoFactor.app).toBe(true);

    const stored = await UserProfileSetting.findOne({ where: { userId: user.id } });
    expect(stored.timezone).toBe('Europe/London');
    expect(stored.language).toBe('en-GB');
    expect(stored.securityMethods).toContain('authenticator');
    expect(stored.notificationPreferences.dispatch.sms).toBe(true);
    expect(stored.billingPreferences.preferredCurrency).toBe('USD');
    expect(Array.isArray(stored.invoiceRecipients)).toBe(true);
    expect(stored.invoiceRecipients[0].email).toBe('finance@example.com');

    await user.reload();
    expect(user.firstName).toBe('Avery');
    expect(user.twoFactorApp).toBe(true);
  });

  it('rejects invalid email updates', async () => {
    const user = await User.create(
      {
        firstName: 'Jordan',
        lastName: 'Miles',
        email: 'jordan@fixnado.dev',
        passwordHash: 'hash',
        type: 'user'
      },
      { validate: false }
    );
    const { token } = await createSessionToken(user);

    const result = await request(app)
      .put('/api/settings/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ profile: { email: 'not-an-email' } })
      .expect(422);

    expect(result.body.details[0].field).toBe('profile.email');
    await user.reload();
    expect(user.email).toBe('jordan@fixnado.dev');
  });
});
