import request from 'supertest';
import jwt from 'jsonwebtoken';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';

const { default: app } = await import('../src/app.js');
const {
  sequelize,
  User,
  Company,
  InventoryItem,
  MarketplaceItem,
  MarketplaceModerationAction,
  UserSession
} = await import('../src/models/index.js');

function createToken(userId, payload = {}) {
  return jwt.sign({ sub: userId, ...payload }, process.env.JWT_SECRET, {
    expiresIn: '1h',
    audience: 'fixnado:web',
    issuer: 'fixnado-api'
  });
}

async function seedAdminContext() {
  const admin = await User.create({
    firstName: 'Ada',
    lastName: 'Byrne',
    email: 'ada.admin@example.com',
    passwordHash: 'hashed',
    type: 'admin'
  });

  const session = await UserSession.create({
    userId: admin.id,
    refreshTokenHash: 'test-refresh-hash',
    sessionFingerprint: 'admin-test',
    clientType: 'web',
    clientVersion: 'vitest',
    deviceLabel: 'admin-suite',
    ipAddress: '127.0.0.1',
    userAgent: 'vitest',
    metadata: {},
    expiresAt: new Date(Date.now() + 60 * 60 * 1000)
  });

  const provider = await User.create({
    firstName: 'Iris',
    lastName: 'Cole',
    email: 'iris.provider@example.com',
    passwordHash: 'hashed',
    type: 'company'
  });

  const company = await Company.create({
    userId: provider.id,
    legalStructure: 'Ltd',
    contactName: 'Iris Cole',
    contactEmail: 'iris.provider@example.com',
    serviceRegions: 'London',
    marketplaceIntent: 'tools',
    verified: true,
    insuredSellerStatus: 'approved',
    insuredSellerBadgeVisible: true
  });

  return {
    admin,
    company,
    token: createToken(admin.id, { sid: session.id, role: 'admin', persona: 'platform' }),
    session
  };
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await MarketplaceModerationAction.destroy({ where: {} });
  await InventoryItem.destroy({ where: {} });
  await MarketplaceItem.destroy({ where: {} });
  await Company.destroy({ where: {} });
  await User.destroy({ where: {} });
});

describe('Admin marketplace management routes', () => {
  it('rejects unauthenticated access', async () => {
    await request(app).get('/api/admin/marketplace/overview').expect(401);
  });

  it('allows platform admins to manage tools and materials', async () => {
    const { company, token } = await seedAdminContext();

    const createToolResponse = await request(app)
      .post('/api/admin/marketplace/tools')
      .set('Authorization', `Bearer ${token}`)
      .send({
        companyId: company.id,
        name: 'Thermal imaging kit',
        sku: 'THERM-100',
        category: 'Tools',
        unitType: 'unit',
        quantityOnHand: 5,
        quantityReserved: 1,
        safetyStock: 1,
        rentalRate: 45,
        rentalRateCurrency: 'GBP',
        imageUrl: 'https://example.com/tool.jpg',
        tags: ['diagnostics']
      })
      .expect(201);

    expect(createToolResponse.body).toMatchObject({
      name: 'Thermal imaging kit',
      classification: 'tool',
      quantityReserved: 1,
      metadata: expect.objectContaining({ classification: 'tool', tags: ['diagnostics'] })
    });

    const toolId = createToolResponse.body.id;

    const materialResponse = await request(app)
      .post('/api/admin/marketplace/materials')
      .set('Authorization', `Bearer ${token}`)
      .send({
        companyId: company.id,
        name: 'Cat6A drum',
        sku: 'CAB-6A-DRUM',
        category: 'Materials',
        unitType: 'drum',
        quantityOnHand: 12,
        safetyStock: 4,
        notes: 'Key stock for outages'
      })
      .expect(201);

    expect(materialResponse.body).toMatchObject({ classification: 'material' });

    await request(app)
      .patch(`/api/admin/marketplace/tools/${toolId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ quantityOnHand: 8, quantityReserved: 2, notes: 'Serviced and ready' })
      .expect(200);

    const overview = await request(app)
      .get('/api/admin/marketplace/overview')
      .query({ companyId: company.id })
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(overview.body.summary.tools.count).toBe(1);
    expect(overview.body.summary.materials.count).toBe(1);
    expect(overview.body.tools[0]).toMatchObject({ quantityOnHand: 8, quantityReserved: 2 });

    await request(app)
      .delete(`/api/admin/marketplace/tools/${toolId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(204);
  });

  it('includes moderation queue insights in overview', async () => {
    const { company, token } = await seedAdminContext();

    const pendingItem = await MarketplaceItem.create({
      companyId: company.id,
      title: 'High access boom lift',
      availability: 'rent',
      status: 'pending_review'
    });

    await MarketplaceModerationAction.create({
      entityType: 'marketplace_item',
      entityId: pendingItem.id,
      action: 'submitted_for_review',
      actorId: null,
      metadata: {}
    });

    const overview = await request(app)
      .get('/api/admin/marketplace/overview')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(overview.body.moderationQueue)).toBe(true);
    expect(overview.body.moderationQueue[0]).toMatchObject({ title: 'High access boom lift', status: 'pending_review' });
  });

  it('rejects inventory payloads where reserved exceeds on-hand', async () => {
    const { company, token } = await seedAdminContext();

    const response = await request(app)
      .post('/api/admin/marketplace/tools')
      .set('Authorization', `Bearer ${token}`)
      .send({
        companyId: company.id,
        name: 'Laser level',
        sku: 'LASER-200',
        category: 'Tools',
        unitType: 'unit',
        quantityOnHand: 2,
        quantityReserved: 4
      })
      .expect(400);

    expect(response.body).toMatchObject({ message: 'quantityReserved cannot exceed quantityOnHand' });
  });
});
