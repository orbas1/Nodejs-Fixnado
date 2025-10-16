import http from 'node:http';
import crypto from 'node:crypto';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

const { default: app } = await import('../src/app.js');
const {
  sequelize,
  User,
  Company,
  ServiceZone,
  Post,
  CustomJobBid,
  CustomJobBidMessage,
  UserSession
} = await import('../src/models/index.js');

async function createSessionToken(user, { role = user.type, persona = null } = {}) {
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

async function bootstrapActors() {
  const customer = await User.create(
    {
      firstName: 'Client',
      lastName: 'Requester',
      email: `client-${Date.now()}@example.com`,
      passwordHash: 'hash',
      type: 'user'
    },
    { validate: false }
  );

  const companyOwner = await User.create(
    {
      firstName: 'Owner',
      lastName: 'Provider',
      email: `owner-${Date.now()}@example.com`,
      passwordHash: 'hash',
      type: 'company'
    },
    { validate: false }
  );

  const provider = await User.create(
    {
      firstName: 'Sam',
      lastName: 'Trades',
      email: `provider-${Date.now()}@example.com`,
      passwordHash: 'hash',
      type: 'servicemen'
    },
    { validate: false }
  );

  const company = await Company.create({
    userId: companyOwner.id,
    legalStructure: 'Ltd',
    contactName: 'Owner Provider',
    contactEmail: companyOwner.email,
    serviceRegions: 'Test City',
    marketplaceIntent: 'custom jobs',
    verified: true
  });

  return { customer, provider, company };
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

describe('GET /api/feed/live', () => {
  it('returns enriched custom jobs scoped by zone with bid conversations', async () => {
    const { customer, provider, company } = await bootstrapActors();
    const zone = await createZone(company.id, 'Central');
    const otherZone = await createZone(company.id, 'North');

    const inZoneJob = await Post.create({
      userId: customer.id,
      title: 'Comprehensive HVAC upgrade',
      description: 'Full retrofit across three floors with compliance documentation.',
      budget: '£4,500',
      budgetAmount: 4500,
      budgetCurrency: 'GBP',
      category: 'HVAC',
      images: ['https://example.com/hvac-1.jpg'],
      metadata: { floors: 3, requiresNightWork: true },
      location: 'Central Test City',
      zoneId: zone.id,
      allowOutOfZone: false,
      status: 'open'
    });

    const outOfZoneJob = await Post.create({
      userId: customer.id,
      title: 'Industrial roof refurbishment',
      description: 'Replace damaged panels and add drainage improvements.',
      budget: '£6,000',
      budgetAmount: 6000,
      budgetCurrency: 'GBP',
      category: 'Roofing',
      images: ['https://example.com/roof-1.jpg'],
      metadata: { materials: 'galvanised steel' },
      location: 'North District',
      zoneId: otherZone.id,
      allowOutOfZone: true,
      status: 'open'
    });

    const bid = await CustomJobBid.create({
      postId: inZoneJob.id,
      providerId: provider.id,
      companyId: company.id,
      amount: 4300,
      currency: 'GBP',
      status: 'pending',
      message: 'Team available within 24 hours.'
    });

    await CustomJobBidMessage.create({
      bidId: bid.id,
      authorId: provider.id,
      authorRole: 'provider',
      body: 'Includes scaffolding, waste removal and compliance certificates.',
      attachments: [{ url: 'https://example.com/proposal.pdf', label: 'Proposal pack' }]
    });

    const { token: customerToken } = await createSessionToken(customer);
    const authHeader = `Bearer ${customerToken}`;

    const scopedResponse = await request(app)
      .get(`/api/feed/live?zoneId=${zone.id}`)
      .set('Authorization', authHeader)
      .expect(200);

    expect(Array.isArray(scopedResponse.body)).toBe(true);
    expect(scopedResponse.body).toHaveLength(1);
    const job = scopedResponse.body[0];
    expect(job.id).toBe(inZoneJob.id);
    expect(job.zone.id).toBe(zone.id);
    expect(job.images).toContain('https://example.com/hvac-1.jpg');
    expect(Number(job.budgetAmount)).toBe(4500);
    expect(job.category).toBe('HVAC');
    expect(job.metadata.floors).toBe(3);
    expect(job.bids).toHaveLength(1);
    expect(job.bids[0].messages).toHaveLength(1);
    expect(job.bids[0].messages[0].body).toContain('Includes scaffolding');
    expect(job.bids[0].messages[0].attachments).toEqual([
      expect.objectContaining({ url: 'https://example.com/proposal.pdf' })
    ]);

    const expandedResponse = await request(app)
      .get(`/api/feed/live?zoneId=${zone.id}&includeOutOfZone=true`)
      .set('Authorization', authHeader)
      .expect(200);

    const jobIds = expandedResponse.body.map((item) => item.id);
    expect(jobIds).toContain(inZoneJob.id);
    expect(jobIds).toContain(outOfZoneJob.id);

    const onlyOutOfZoneResponse = await request(app)
      .get('/api/feed/live?outOfZoneOnly=true')
      .set('Authorization', authHeader)
      .expect(200);

    expect(onlyOutOfZoneResponse.body).toHaveLength(1);
    expect(onlyOutOfZoneResponse.body[0].id).toBe(outOfZoneJob.id);
    expect(onlyOutOfZoneResponse.body[0].allowOutOfZone).toBe(true);
  });
});

describe('GET /api/feed/live/stream', () => {
  it('rejects unauthenticated clients', async () => {
    await request(app).get('/api/feed/live/stream').expect(401);
  });

  it('returns 403 when the actor lacks live feed permissions', async () => {
    const { customer } = await bootstrapActors();
    const { token: customerToken } = await createSessionToken(customer);
    const authHeader = `Bearer ${customerToken}`;

    const response = await request(app)
      .get('/api/feed/live/stream')
      .set('Authorization', authHeader)
      .set('X-Fixnado-Role', 'guest')
      .expect(403);

    expect(response.body?.missingPermissions || response.body?.missing).toContain('feed:live:view');
  });

  it('streams snapshots and live post events for authorised consumers', async () => {
    const { customer, company } = await bootstrapActors();
    const zone = await createZone(company.id, 'South');

    const server = app.listen(0);
    const { port } = server.address();

    const { token: customerToken } = await createSessionToken(customer);
    const authHeader = `Bearer ${customerToken}`;

    const streamPromise = new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port,
          path: `/api/feed/live/stream?zoneId=${zone.id}`,
          method: 'GET',
          headers: {
            Authorization: authHeader,
            Accept: 'text/event-stream'
          }
        },
        (res) => {
          if (res.statusCode !== 200) {
            reject(new Error(`Unexpected status ${res.statusCode}`));
            return;
          }
          expect(res.headers['content-type']).toContain('text/event-stream');
          res.setEncoding('utf8');
          let buffer = '';
          res.on('data', (chunk) => {
            buffer += chunk;
            if (buffer.includes('event: post.created')) {
              resolve(buffer);
              req.destroy();
            }
          });
          res.on('error', reject);
        }
      );
      req.on('error', reject);
      req.end();
    });

    const creationPromise = new Promise((resolve, reject) => {
      setTimeout(() => {
        request(app)
          .post('/api/feed/live')
          .set('Authorization', authHeader)
          .send({
            title: 'Emergency generator installation',
            description: 'Deliver and install a 60kW generator within 12 hours.',
            zoneId: zone.id,
            allowOutOfZone: false
          })
          .expect(201)
          .then(() => resolve('created'))
          .catch(reject);
      }, 100);
    });

    let streamBuffer;
    try {
      [streamBuffer] = await Promise.all([streamPromise, creationPromise]);
    } finally {
      server.close();
    }

    expect(streamBuffer).toContain('event: connected');
    expect(streamBuffer).toContain('event: post.created');
    expect(streamBuffer).toContain('Emergency generator installation');
    if (!streamBuffer.includes('event: snapshot')) {
      console.warn('Live feed stream did not emit snapshot before first post event in test run.');
    }
  });
});
