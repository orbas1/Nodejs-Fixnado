import request from 'supertest';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import http from 'node:http';

const { default: app } = await import('../src/app.js');
const {
  sequelize,
  User,
  UserSession,
  ServiceZone,
  Company,
  CustomJobBid,
  CustomJobBidMessage
} = await import('../src/models/index.js');

async function createSessionToken(user, { role = user.type, persona = 'admin' } = {}) {
  const session = await UserSession.create({
    userId: user.id,
    refreshTokenHash: 'test-refresh',
    sessionFingerprint: 'fingerprint',
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

  return { token, session };
}

async function createZone(companyId, name) {
  return ServiceZone.create({
    companyId,
    name,
    boundary: {
      type: 'Polygon',
      coordinates: [
        [
          [-0.12, 51.5],
          [-0.12, 51.51],
          [-0.11, 51.51],
          [-0.11, 51.5],
          [-0.12, 51.5]
        ]
      ]
    },
    centroid: { type: 'Point', coordinates: [-0.115, 51.505] },
    boundingBox: { west: -0.12, south: 51.5, east: -0.11, north: 51.51 },
    metadata: { municipality: 'Test City' },
    demandLevel: 'high'
  });
}

let server;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
});

afterAll(async () => {
  await new Promise((resolve) => server.close(resolve));
  await sequelize.close();
});

beforeEach(async () => {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
});

describe('Admin custom job management routes', () => {
  it('allows admins to create, list, award, and message within custom jobs', async () => {
    const admin = await User.create(
      {
        firstName: 'Admin',
        lastName: 'Operator',
        email: 'admin@example.com',
        passwordHash: 'hash',
        type: 'admin'
      },
      { validate: false }
    );

    const companyOwner = await User.create(
      {
        firstName: 'Owner',
        lastName: 'Provider',
        email: 'owner@example.com',
        passwordHash: 'hash',
        type: 'company'
      },
      { validate: false }
    );

    const providerCompany = await Company.create({
      userId: companyOwner.id,
      legalStructure: 'Ltd',
      contactName: 'Owner Provider',
      contactEmail: 'owner@example.com',
      serviceRegions: 'Test City',
      marketplaceIntent: 'custom jobs',
      verified: true
    });

    const zone = await createZone(providerCompany.id, 'Central Zone');

    const { token } = await createSessionToken(admin);

    const createResponse = await request(server)
      .post('/api/admin/custom-jobs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'High-rise HVAC retrofit',
        description: 'Replace rooftop units and integrate IoT telemetry.',
        budgetAmount: 12500,
        budgetCurrency: 'GBP',
        budgetLabel: '£12,500',
        zoneId: zone.id,
        allowOutOfZone: false,
        images: ['https://cdn.fixnado.com/jobs/hvac.jpg'],
        customer: {
          email: 'jess.lee@example.com',
          firstName: 'Jess',
          lastName: 'Lee'
        }
      })
      .expect(201);

    expect(createResponse.body.title).toBe('High-rise HVAC retrofit');
    expect(createResponse.body.customer.email).toBe('jess.lee@example.com');

    const jobId = createResponse.body.id;

    const provider = await User.create(
      {
        firstName: 'Sky',
        lastName: 'Crew',
        email: 'provider@example.com',
        passwordHash: 'hash',
        type: 'servicemen'
      },
      { validate: false }
    );

    const bid = await CustomJobBid.create({
      postId: jobId,
      providerId: provider.id,
      companyId: providerCompany.id,
      amount: 11900,
      currency: 'GBP',
      status: 'pending',
      message: 'Full crew available within 48 hours.'
    });

    await CustomJobBidMessage.create({
      bidId: bid.id,
      authorId: provider.id,
      authorRole: 'provider',
      body: 'Includes crane hire and compliance documentation.',
      attachments: [{ url: 'https://cdn.fixnado.com/bids/plan.pdf', label: 'Execution plan' }]
    });

    const listResponse = await request(server)
      .get('/api/admin/custom-jobs')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(listResponse.body.jobs)).toBe(true);
    expect(listResponse.body.jobs[0].id).toBe(jobId);
    expect(listResponse.body.summary.openCount).toBe(1);

    const awardResponse = await request(server)
      .post(`/api/admin/custom-jobs/${jobId}/award`)
      .set('Authorization', `Bearer ${token}`)
      .send({ bidId: bid.id })
      .expect(200);

    expect(awardResponse.body.status).toBe('assigned');
    expect(awardResponse.body.awardedBidId).toBe(bid.id);
    expect(awardResponse.body.awardedBid.id).toBe(bid.id);

    const messageResponse = await request(server)
      .post(`/api/admin/custom-jobs/${jobId}/bids/${bid.id}/messages`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'Please confirm onsite start time.', attachments: [] })
      .expect(201);

    expect(messageResponse.body.messages.at(-1).body).toContain('Please confirm onsite start time');

    const updateResponse = await request(server)
      .put(`/api/admin/custom-jobs/${jobId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'completed', internalNotes: 'Signed off after QA inspection.' })
      .expect(200);

    expect(updateResponse.body.status).toBe('completed');
    expect(updateResponse.body.internalNotes).toBe('Signed off after QA inspection.');

    const detailResponse = await request(server)
      .get(`/api/admin/custom-jobs/${jobId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(detailResponse.body.id).toBe(jobId);
    expect(detailResponse.body.bids).toHaveLength(1);
    expect(detailResponse.body.bids[0].messages.length).toBeGreaterThanOrEqual(2);
  });
});
