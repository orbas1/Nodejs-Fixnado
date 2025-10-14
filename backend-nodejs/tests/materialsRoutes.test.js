import request from 'supertest';
import jwt from 'jsonwebtoken';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';

const { default: app } = await import('../src/app.js');
const { sequelize, User, Company, InventoryItem, InventoryAlert } = await import('../src/models/index.js');

function createToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
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

describe('GET /api/materials/showcase', () => {
  it('requires authentication', async () => {
    const response = await request(app).get('/api/materials/showcase').expect(401);
    expect(response.body).toMatchObject({ message: 'Missing authorization header' });
  });

  it('blocks unsupported roles', async () => {
    const user = await User.create({
      firstName: 'Lena',
      lastName: 'Hart',
      email: 'lena@example.com',
      passwordHash: 'hashed',
      type: 'user'
    });

    const response = await request(app)
      .get('/api/materials/showcase')
      .set('Authorization', `Bearer ${createToken(user.id)}`)
      .expect(403);

    expect(response.body).toMatchObject({ message: 'Forbidden' });
  });

  it('returns aggregated showcase data for provider actors', async () => {
    const provider = await User.create({
      firstName: 'Noah',
      lastName: 'Stevens',
      email: 'noah@provider.test',
      passwordHash: 'hashed',
      type: 'servicemen'
    });

    const company = await Company.create({
      userId: provider.id,
      legalStructure: 'Ltd',
      contactName: 'Noah Stevens',
      contactEmail: provider.email,
      serviceRegions: 'Docklands',
      marketplaceIntent: 'materials',
      verified: true
    });

    const firstItem = await InventoryItem.create({
      companyId: company.id,
      name: 'Cat6A bulk cable drums',
      sku: 'CAB-6A-500',
      category: 'materials',
      unitType: 'drum',
      quantityOnHand: 28,
      quantityReserved: 6,
      safetyStock: 12,
      metadata: {
        unitCost: 245,
        supplier: { name: 'Metro Cabling Co' },
        leadTimeDays: 3,
        compliance: ['CE'],
        nextArrival: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        carbonCategory: 'low'
      }
    });

    await InventoryItem.create({
      companyId: company.id,
      name: '6kg CO2 extinguishers',
      sku: 'FS-CO2-60',
      category: 'fire safety materials',
      unitType: 'unit',
      quantityOnHand: 60,
      quantityReserved: 18,
      safetyStock: 48,
      metadata: {
        unitCost: 70,
        supplier: 'Civic Compliance',
        leadTimeDays: 5,
        compliance: ['BS EN3'],
        nextArrival: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    });

    await InventoryAlert.create({
      itemId: firstItem.id,
      type: 'low_stock',
      severity: 'warning',
      status: 'active',
      metadata: { available: 22, safetyStock: 24 }
    });

    const response = await request(app)
      .get('/api/materials/showcase')
      .query({ companyId: company.id })
      .set('Authorization', `Bearer ${createToken(provider.id)}`)
      .expect(200);

    expect(response.body.meta).toMatchObject({ fallback: false });
    expect(response.body.data.stats.totalSkus).toBeGreaterThanOrEqual(2);
    expect(response.body.data.inventory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'Cat6A bulk cable drums', alerts: expect.any(Array) })
      ])
    );
    expect(response.body.data.suppliers).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: expect.stringContaining('Metro') })])
    );
    expect(response.body.data.collections.length).toBeGreaterThan(0);
    expect(response.body.data.insights.compliance.passingRate).toBeGreaterThan(0);
  });
});
