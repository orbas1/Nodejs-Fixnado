import request from 'supertest';
import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';

const { default: app } = await import('../src/app.js');
const {
  sequelize,
  User,
  Company,
  ServiceZone,
  Service
} = await import('../src/models/index.js');
const { createSessionToken } = await import('./helpers/session.js');

const polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [-0.125, 51.5],
      [-0.09, 51.5],
      [-0.09, 51.53],
      [-0.125, 51.53],
      [-0.125, 51.5]
    ]
  ]
};

async function createOperationsAdmin() {
  const user = await User.create(
    {
      firstName: 'Ops',
      lastName: 'Admin',
      email: `ops-admin-${Date.now()}@example.com`,
      passwordHash: 'hashed',
      type: 'operations'
    },
    { validate: false }
  );

  const { token } = await createSessionToken(user, { role: 'operations' });
  return { user, token };
}

async function createCompanyWithZone(authToken) {
  const owner = await User.create(
    {
      firstName: 'Zone',
      lastName: 'Owner',
      email: `zone-owner-${Date.now()}@example.com`,
      passwordHash: 'hashed',
      type: 'provider_admin'
    },
    { validate: false }
  );

  const company = await Company.create({
    userId: owner.id,
    legalStructure: 'Ltd',
    contactName: 'Zone Owner',
    contactEmail: owner.email,
    serviceRegions: 'London',
    marketplaceIntent: 'expansion'
  });

  const zoneResponse = await request(app)
    .post('/api/zones')
    .set('Authorization', authToken)
    .send({ companyId: company.id, name: 'Central Ops', geometry: polygon, demandLevel: 'high' })
    .expect(201);

  const zone = await ServiceZone.findByPk(zoneResponse.body.id);

  await Service.create({
    companyId: company.id,
    title: 'Mission critical electrical response',
    description: 'Rapid deployment specialists with telemetry synced vans.',
    category: 'operations',
    price: 1250,
    currency: 'GBP'
  });

  await Service.create({
    companyId: company.id,
    title: 'High voltage containment',
    description: 'Emergency containment for HV incidents within 30 minutes.',
    category: 'operations',
    price: 1850,
    currency: 'GBP'
  });

  return { company, zone };
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  vi.restoreAllMocks();
  vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({
      display_name: 'London',
      place_id: 321,
      boundingbox: ['51.48', '51.53', '-0.16', '-0.09'],
      licence: 'Data © OpenStreetMap contributors'
    })
  });

  await sequelize.truncate({ cascade: true, restartIdentity: true });
});

describe('POST /api/zones/match', () => {
  it('rejects unauthenticated requests', async () => {
    await request(app).post('/api/zones/match').send({ latitude: 51.51, longitude: -0.11 }).expect(401);
  });

  it('enforces operations admin role', async () => {
    const nonAdmin = await User.create(
      {
        firstName: 'Regular',
        lastName: 'User',
        email: 'regular@example.com',
        passwordHash: 'hashed',
        type: 'servicemen'
      },
      { validate: false }
    );

    const { token: nonAdminToken } = await createSessionToken(nonAdmin, { role: 'servicemen' });

    await request(app)
      .post('/api/zones/match')
      .set('Authorization', nonAdminToken)
      .send({ latitude: 51.51, longitude: -0.11 })
      .expect(403);
  });

  it('returns scored matches for valid coordinates', async () => {
    const { token } = await createOperationsAdmin();
    const { zone } = await createCompanyWithZone(token);

    const response = await request(app)
      .post('/api/zones/match')
      .set('Authorization', token)
      .send({ latitude: 51.512, longitude: -0.11, radiusKm: 12, limit: 5 })
      .expect(200);

    expect(response.body.matches).toHaveLength(1);
    expect(response.body.matches[0].zone.id).toEqual(zone.id);
    expect(response.body.matches[0].services.length).toBeGreaterThanOrEqual(1);
    expect(response.body.matches[0].score).toBeGreaterThan(0);
    expect(response.body.totalServices).toBeGreaterThan(0);
    expect(response.body.fallback).toBeNull();
  });

  it('falls back to the nearest zone when outside all polygons', async () => {
    const { token } = await createOperationsAdmin();
    await createCompanyWithZone(token);

    const response = await request(app)
      .post('/api/zones/match')
      .set('Authorization', token)
      .send({ latitude: 51.6, longitude: -0.45 })
      .expect(200);

    expect(response.body.matches.length).toBeGreaterThan(0);
    expect(response.body.fallback).toMatchObject({ reason: 'closest-zone-projected' });
  });
});
