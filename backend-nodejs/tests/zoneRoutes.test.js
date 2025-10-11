import request from 'supertest';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';

const { default: app } = await import('../src/app.js');
const { sequelize, Company, User, ServiceZone, ZoneAnalyticsSnapshot } = await import('../src/models/index.js');

async function bootstrapCompany() {
  const owner = await User.create({
    firstName: 'Zone',
    lastName: 'Owner',
    email: `zone-owner-${Date.now()}@example.com`,
    passwordHash: 'hashed',
    type: 'provider_admin'
  });

  return Company.create({
    userId: owner.id,
    legalStructure: 'Ltd',
    contactName: 'Zone Owner',
    contactEmail: owner.email,
    serviceRegions: 'London',
    marketplaceIntent: 'expansion'
  });
}

const polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [-0.15, 51.5],
      [-0.1, 51.5],
      [-0.1, 51.52],
      [-0.15, 51.52],
      [-0.15, 51.5]
    ]
  ]
};

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  try {
    await sequelize.close();
  } catch (error) {
    // ignore double close during watch mode
  }
});

beforeEach(async () => {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
});

describe('Zone routes', () => {
  it('rejects invalid polygons', async () => {
    const company = await bootstrapCompany();
    const malformed = {
      type: 'Polygon',
      coordinates: [[[-0.1, 51.5], [-0.1, 51.52], [-0.15, 51.52]]] // missing closure
    };

    const response = await request(app)
      .post('/api/zones')
      .send({ companyId: company.id, name: 'Invalid', geometry: malformed })
      .expect(400);

    expect(response.body.message).toMatch(/polygon/i);
    expect(await ServiceZone.count()).toBe(0);
  });

  it('creates a zone with computed centroid and bounding box', async () => {
    const company = await bootstrapCompany();

    const response = await request(app)
      .post('/api/zones')
      .send({
        companyId: company.id,
        name: 'Central London',
        geometry: polygon,
        demandLevel: 'high',
        metadata: { categories: ['plumbing', 'electrical'] }
      })
      .expect(201);

    expect(response.body).toMatchObject({
      name: 'Central London',
      demandLevel: 'high',
      metadata: { categories: ['plumbing', 'electrical'] }
    });

    expect(response.body.centroid).toBeTruthy();
    expect(response.body.boundingBox).toMatchObject({
      west: expect.any(Number),
      east: expect.any(Number)
    });
  });

  it('exposes analytics snapshots via the API', async () => {
    const company = await bootstrapCompany();

    const zoneResponse = await request(app)
      .post('/api/zones')
      .send({ companyId: company.id, name: 'Analytics Zone', geometry: polygon })
      .expect(201);

    const zoneId = zoneResponse.body.id;

    await request(app).post(`/api/zones/${zoneId}/analytics/snapshot`).expect(201);

    const listResponse = await request(app)
      .get('/api/zones')
      .query({ includeAnalytics: 'true' })
      .expect(200);

    const [entry] = listResponse.body;
    expect(entry.zone.id).toEqual(zoneId);
    expect(entry.analytics).not.toBeNull();
    expect(entry.analytics.bookingTotals).toMatchObject({});

    expect(await ZoneAnalyticsSnapshot.count()).toBeGreaterThan(0);
  });
});
