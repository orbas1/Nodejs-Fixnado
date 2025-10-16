import crypto from 'node:crypto';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { withAuth } from './helpers/auth.js';

const { default: app } = await import('../src/app.js');
const { sequelize, User, CustomerNotificationRecipient, UserSession } = await import('../src/models/index.js');

describe('accountRoutes', () => {
  let user;
  let session;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
  });

  beforeEach(async () => {
    await sequelize.truncate({ cascade: true, restartIdentity: true });
    user = await User.create({
      firstName: 'Avery',
      lastName: 'Stone',
      email: 'avery@example.com',
      passwordHash: 'hash',
      type: 'user'
    });
    session = await UserSession.create({
      userId: user.id,
      refreshTokenHash: crypto.randomBytes(32).toString('hex'),
      sessionFingerprint: crypto.randomBytes(16).toString('hex'),
      clientType: 'web',
      clientVersion: 'vitest',
      deviceLabel: 'vitest',
      ipAddress: '127.0.0.1',
      userAgent: 'vitest',
      metadata: { persona: 'user' },
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      lastUsedAt: new Date()
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('returns account settings snapshot for the authenticated user', async () => {
    const response = await withAuth(request(app).get('/api/account/settings'), user.id, {
      payload: { role: 'user', persona: 'user', sid: session.id }
    }).set('x-fixnado-persona', 'user');

    expect(response.statusCode).toBe(200);
    expect(response.body.profile.email).toBe('avery@example.com');
    expect(response.body.preferences.defaultCurrency).toBe('GBP');
  });

  it('updates profile and persists phone + avatar', async () => {
    const response = await withAuth(request(app).put('/api/account/settings/profile'), user.id, {
      payload: { role: 'user', persona: 'user', sid: session.id }
    })
      .set('x-fixnado-persona', 'user')
      .send({
        firstName: 'Jordan',
        lastName: 'Miles',
        email: 'jordan@example.com',
        phoneNumber: '+44 7700 900123',
        profileImageUrl: 'https://cdn.fixnado.test/avatar.png'
      });

    expect(response.statusCode).toBe(200);
    expect(response.body.profile.firstName).toBe('Jordan');
    expect(response.body.profile.phoneNumber).toBe('+44 7700 900123');

    const record = await User.findByPk(user.id);
    expect(record.phoneNumber).toBe('+44 7700 900123');
  });

  it('creates and updates notification recipients', async () => {
    const createResponse = await withAuth(request(app).post('/api/account/settings/recipients'), user.id, {
      payload: { role: 'user', persona: 'user', sid: session.id }
    })
      .set('x-fixnado-persona', 'user')
      .send({
        label: 'Finance desk',
        channel: 'email',
        target: 'finance@example.com',
        role: 'finance',
        enabled: true
      });

    expect(createResponse.statusCode).toBe(201);
    expect(createResponse.body.channel).toBe('email');

    const recipientId = createResponse.body.id;
    const updateResponse = await withAuth(
      request(app).patch(`/api/account/settings/recipients/${recipientId}`),
      user.id,
      { payload: { role: 'user', persona: 'user', sid: session.id } }
    )
      .set('x-fixnado-persona', 'user')
      .send({ role: 'approver', enabled: false });

    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.body.role).toBe('approver');
    expect(updateResponse.body.enabled).toBe(false);

    const deleteResponse = await withAuth(
      request(app).delete(`/api/account/settings/recipients/${recipientId}`),
      user.id,
      { payload: { role: 'user', persona: 'user', sid: session.id } }
    ).set('x-fixnado-persona', 'user');

    expect(deleteResponse.statusCode).toBe(200);
    const remaining = await CustomerNotificationRecipient.count();
    expect(remaining).toBe(0);
  });
});
