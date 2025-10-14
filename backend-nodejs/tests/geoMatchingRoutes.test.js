import request from 'supertest';
import jwt from 'jsonwebtoken';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';

const { default: app } = await import('../src/app.js');
const {
  sequelize,
  User,
  Company,
  ServiceZone,
  Service
} = await import('../src/models/index.js');
const { default: config } = await import('../src/config/index.js');

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
  return User.create({
    firstName: 'Ops',
    lastName: 'Admin',
    email: `ops-admin-${Date.now()}@example.com`,
    passwordHash: 'hashed',
    type: 'operations_admin'
  });
}

async function createCompanyWithZone() {
  const owner = await User.create({
    firstName: 'Zone',
    lastName: 'Owner',
    email: `zone-owner-${Date.now()}@example.com`,
    passwordHash: 'hashed',
    type: 'provider_admin'
  });

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

function authHeader(user) {
  const token = jwt.sign({ sub: user.id, type: user.type }, config.jwt.secret, { expiresIn: '1h' });
  return `Bearer ${token}`;
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

describe('POST /api/zones/match', () => {
  it('rejects unauthenticated requests', async () => {
    await request(app).post('/api/zones/match').send({ latitude: 51.51, longitude: -0.11 }).expect(401);
  });

  it('enforces operations admin role', async () => {
    const nonAdmin = await User.create({
      firstName: 'Regular',
      lastName: 'User',
      email: 'regular@example.com',
      passwordHash: 'hashed',
      type: 'servicemen'
    });

    await request(app)
      .post('/api/zones/match')
      .set('Authorization', authHeader(nonAdmin))
      .send({ latitude: 51.51, longitude: -0.11 })
      .expect(403);
  });

  it('returns scored matches for valid coordinates', async () => {
    const [ops, { zone }] = await Promise.all([createOperationsAdmin(), createCompanyWithZone()]);

    const response = await request(app)
      .post('/api/zones/match')
      .set('Authorization', authHeader(ops))
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
    const [ops] = await Promise.all([createOperationsAdmin(), createCompanyWithZone()]);

    const response = await request(app)
      .post('/api/zones/match')
      .set('Authorization', authHeader(ops))
      .send({ latitude: 51.6, longitude: -0.45 })
      .expect(200);

    expect(response.body.matches.length).toBeGreaterThan(0);
    expect(response.body.fallback).toMatchObject({ reason: 'closest-zone-projected' });
  });
});
