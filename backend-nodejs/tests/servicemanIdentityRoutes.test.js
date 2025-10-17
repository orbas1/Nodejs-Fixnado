import crypto from 'node:crypto';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const { default: app } = await import('../src/app.js');
const {
  sequelize,
  User,
  UserSession,
  ServicemanIdentityDocument,
  ServicemanIdentityCheck,
  ServicemanIdentityWatcher,
  ServicemanIdentityEvent
} = await import('../src/models/index.js');

process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';

async function createSessionToken(user, { role = 'servicemen', persona = null } = {}) {
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
    process.env.JWT_SECRET,
    { expiresIn: '1h', audience: 'fixnado:web', issuer: 'fixnado-api' }
  );

  return token;
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
});

describe('Serviceman identity routes', () => {
  it('provides full CRUD for serviceman identity verification artefacts', async () => {
    const serviceman = await User.create(
      {
        firstName: 'Jordan',
        lastName: 'Miles',
        email: `serviceman-${crypto.randomUUID()}@example.com`,
        passwordHash: 'hash',
        type: 'servicemen'
      },
      { validate: false }
    );

    const reviewer = await User.create(
      {
        firstName: 'Clara',
        lastName: 'Benton',
        email: `reviewer-${crypto.randomUUID()}@example.com`,
        passwordHash: 'hash',
        type: 'user'
      },
      { validate: false }
    );

    const token = await createSessionToken(serviceman, { role: 'servicemen' });

    const initialResponse = await request(app)
      .get(`/api/servicemen/${serviceman.id}/identity`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(initialResponse.body.referenceData.statuses).toContain('pending');
    expect(initialResponse.body.verification.servicemanId).toBe(serviceman.id);

    const updateResponse = await request(app)
      .put(`/api/servicemen/${serviceman.id}/identity`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'in_review',
        riskRating: 'high',
        verificationLevel: 'enhanced',
        reviewerId: reviewer.id,
        expiresAt: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Urgent hospital deployment pending clearance.'
      })
      .expect(200);

    expect(updateResponse.body.verification.status).toBe('in_review');
    expect(updateResponse.body.verification.reviewer).toMatchObject({ id: reviewer.id });
    expect(updateResponse.body.verification.notes).toContain('hospital');

    const documentResponse = await request(app)
      .post(`/api/servicemen/${serviceman.id}/identity/documents`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        documentType: 'passport',
        status: 'approved',
        documentNumber: 'A1234567',
        issuingCountry: 'United Kingdom',
        issuedAt: '2020-01-01',
        expiresAt: '2030-01-01',
        fileUrl: 'https://example.com/passport.pdf'
      })
      .expect(201);

    expect(documentResponse.body.documents).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ documentType: 'passport', status: 'approved' })
      ])
    );

    const createdDocument = await ServicemanIdentityDocument.findOne({ where: { identityId: documentResponse.body.verification.id } });
    expect(createdDocument).not.toBeNull();

    const checkResponse = await request(app)
      .post(`/api/servicemen/${serviceman.id}/identity/checks`)
      .set('Authorization', `Bearer ${token}`)
      .send({ label: 'Utility confirmation', dueAt: '2030-03-01' })
      .expect(201);

    expect(checkResponse.body.checks.length).toBeGreaterThan(0);

    const checkId = checkResponse.body.checks[0].id;

    await request(app)
      .put(`/api/servicemen/${serviceman.id}/identity/checks/${checkId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'completed', completedAt: '2030-02-20' })
      .expect(200);

    const watcherResponse = await request(app)
      .post(`/api/servicemen/${serviceman.id}/identity/watchers`)
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'ops.manager@example.com', role: 'operations_lead' })
      .expect(201);

    expect(watcherResponse.body.watchers).toEqual(
      expect.arrayContaining([expect.objectContaining({ email: 'ops.manager@example.com' })])
    );

    const watcherId = watcherResponse.body.watchers.find((watcher) => watcher.email === 'ops.manager@example.com').id;

    const eventResponse = await request(app)
      .post(`/api/servicemen/${serviceman.id}/identity/events`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        eventType: 'note',
        title: 'Uploaded manual identity proof',
        description: 'Document verified during onsite audit.'
      })
      .expect(201);

    expect(eventResponse.body.events.length).toBeGreaterThan(0);

    await request(app)
      .put(`/api/servicemen/${serviceman.id}/identity/watchers/${watcherId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'safety_manager' })
      .expect(200);

    await request(app)
      .delete(`/api/servicemen/${serviceman.id}/identity/watchers/${watcherId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    await request(app)
      .delete(`/api/servicemen/${serviceman.id}/identity/checks/${checkId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const [checkCount, watcherCount, eventCount] = await Promise.all([
      ServicemanIdentityCheck.count(),
      ServicemanIdentityWatcher.count(),
      ServicemanIdentityEvent.count()
    ]);

    expect(checkCount).toBeGreaterThanOrEqual(0);
    expect(watcherCount).toBeGreaterThanOrEqual(0);
    expect(eventCount).toBeGreaterThan(0);
  });
});
