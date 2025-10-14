import request from 'supertest';
import jwt from 'jsonwebtoken';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';

const { default: app } = await import('../src/app.js');
const { sequelize, User, Company, InventoryItem, InventoryAlert, AnalyticsEvent } = await import('../src/models/index.js');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  try {
    await sequelize.close();
  } catch {
    // ignore double close in watch mode
  }
});

beforeEach(async () => {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
});

function createToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';

async function createCompany() {
  const admin = await User.create({
    firstName: 'Provider',
    lastName: 'Admin',
    email: `provider-${Date.now()}@example.com`,
    passwordHash: 'hashed',
    type: 'company'
  });

  const company = await Company.create({
    userId: admin.id,
    legalStructure: 'Ltd',
    contactName: 'Provider Admin',
    contactEmail: admin.email,
    serviceRegions: 'London',
    marketplaceIntent: 'rentals',
    verified: true
  });

  const token = createToken(admin.id);

  return { admin, company, token };
}

describe('Inventory and rental lifecycle', () => {
  it('reserves inventory, progresses rental lifecycle, and settles charges', async () => {
    const { admin, company, token } = await createCompany();
    const renter = await User.create({
      firstName: 'Customer',
      lastName: 'Jones',
      email: `customer-${Date.now()}@example.com`,
      passwordHash: 'hashed',
      type: 'user'
    });

    const createItemResponse = await request(app)
      .post('/api/inventory/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        companyId: company.id,
        name: 'Heavy Duty Drill',
        sku: 'DRILL-001',
        category: 'Tools',
        unitType: 'unit',
        quantityOnHand: 5,
        safetyStock: 1,
        rentalRate: 45,
        rentalRateCurrency: 'GBP',
        depositAmount: 150,
        depositCurrency: 'GBP',
        insuranceRequired: true,
        metadata: { manufacturer: 'Bosch' }
      })
      .expect(201);

    const itemId = createItemResponse.body.id;

    const start = new Date();
    const end = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);

    const rentalResponse = await request(app)
      .post('/api/rentals')
      .send({
        itemId,
        renterId: renter.id,
        quantity: 1,
        rentalStart: start.toISOString(),
        rentalEnd: end.toISOString(),
        actorId: renter.id,
        actorRole: 'customer',
        notes: 'Needs delivery before noon.'
      })
      .expect(201);

    expect(rentalResponse.body.status).toBe('requested');
    const rentalId = rentalResponse.body.id;

    await request(app)
      .post(`/api/rentals/${rentalId}/approve`)
      .send({ actorId: admin.id, actorRole: 'provider', approvalNotes: 'Verified insurance' })
      .expect(200);

    const pickupAt = new Date(Date.now() + 4 * 60 * 60 * 1000);
    const returnDue = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

    await request(app)
      .post(`/api/rentals/${rentalId}/schedule-pickup`)
      .send({
        actorId: admin.id,
        actorRole: 'provider',
        pickupAt: pickupAt.toISOString(),
        returnDueAt: returnDue.toISOString(),
        logisticsNotes: 'Courier booked with ID C1234'
      })
      .expect(200);

    await request(app)
      .post(`/api/rentals/${rentalId}/checkout`)
      .send({
        actorId: admin.id,
        actorRole: 'provider',
        rentalStartAt: pickupAt.toISOString(),
        conditionOut: { hours: 120, notes: 'Fully charged' },
        handoverNotes: 'Signed by customer'
      })
      .expect(200);

    // Customer returns the item early with light wear
    await request(app)
      .post(`/api/rentals/${rentalId}/return`)
      .send({
        actorId: renter.id,
        actorRole: 'customer',
        conditionIn: { hours: 140, notes: 'Slight scuff on case' },
        returnedAt: new Date(Date.now() + 2.5 * 24 * 60 * 60 * 1000).toISOString(),
        notes: 'Dropped at warehouse reception'
      })
      .expect(200);

    const inspectionResponse = await request(app)
      .post(`/api/rentals/${rentalId}/inspection`)
      .send({
        actorId: admin.id,
        actorRole: 'provider',
        outcome: 'partial',
        charges: [
          { code: 'cleaning', amount: 20, currency: 'GBP', description: 'Deep clean required' }
        ],
        inspectionNotes: 'Minor cosmetic wear, cleaned and ready for next hire.'
      })
      .expect(200);

    expect(inspectionResponse.body.status).toBe('settled');
    expect(inspectionResponse.body.depositStatus).toBe('partially_released');
    expect(inspectionResponse.body.meta.charges.total).toBeGreaterThan(0);

    const rentalDetail = await request(app).get(`/api/rentals/${rentalId}`).expect(200);
    expect(rentalDetail.body.timeline).toHaveLength(6);
    expect(rentalDetail.body.timeline[0].type).toBe('status_change');

    const itemHealth = await request(app)
      .get(`/api/inventory/items/${itemId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(itemHealth.body.health.available).toBe(5);
    expect(itemHealth.body.health.status).toBe('healthy');

    const alerts = await InventoryAlert.findAll({ where: { itemId } });
    expect(alerts.length).toBe(0);

    const events = await AnalyticsEvent.findAll({ where: { domain: 'rentals' }, order: [['occurred_at', 'ASC']] });
    const names = events.map((event) => event.eventName);
    expect(names).toEqual(expect.arrayContaining(['rental.requested', 'rental.status_transition', 'rental.inspection.completed']));
    const inspectionEvent = events.find((event) => event.eventName === 'rental.inspection.completed');
    expect(Number(inspectionEvent.metadata.totalCharges)).toBeGreaterThan(0);
  });

  it('prevents rentals when insufficient stock is available and creates alerts when stockouts occur', async () => {
    const { admin, company, token } = await createCompany();
    const renter = await User.create({
      firstName: 'Eve',
      lastName: 'Smith',
      email: `eve-${Date.now()}@example.com`,
      passwordHash: 'hashed',
      type: 'user'
    });

    const itemResponse = await request(app)
      .post('/api/inventory/items')
      .set('Authorization', `Bearer ${token}`)
      .send({
        companyId: company.id,
        name: 'Concrete Mixer',
        sku: 'MIX-100',
        category: 'Equipment',
        unitType: 'unit',
        quantityOnHand: 1,
        safetyStock: 1,
        rentalRate: 120,
        rentalRateCurrency: 'GBP',
        depositAmount: 300,
        depositCurrency: 'GBP'
      })
      .expect(201);

    const itemId = itemResponse.body.id;

    await request(app)
      .post('/api/rentals')
      .send({
        itemId,
        renterId: renter.id,
        quantity: 2,
        actorId: renter.id,
        actorRole: 'customer'
      })
      .expect(409);

    const rentalReservation = await request(app)
      .post('/api/rentals')
      .send({
        itemId,
        renterId: renter.id,
        quantity: 1,
        actorId: renter.id,
        actorRole: 'customer'
      })
      .expect(201);

    const rentalId = rentalReservation.body.id;

    await request(app)
      .post(`/api/rentals/${rentalId}/approve`)
      .send({ actorId: admin.id, actorRole: 'provider' })
      .expect(200);

    await request(app)
      .post(`/api/rentals/${rentalId}/checkout`)
      .send({ actorId: admin.id, actorRole: 'provider' })
      .expect(200);

    // Once checked out the item should trigger a low stock alert because available quantity reaches zero
    const alert = await InventoryAlert.findOne({ where: { itemId, type: 'low_stock', status: 'active' } });
    expect(alert).toBeTruthy();

    const updatedItem = await InventoryItem.findByPk(itemId);
    expect(updatedItem.quantityOnHand).toBe(0);
    expect(updatedItem.quantityReserved).toBe(0);

    // Returning the item resolves the alert
    await request(app)
      .post(`/api/rentals/${rentalId}/return`)
      .send({ actorId: renter.id, actorRole: 'customer' })
      .expect(200);

    await request(app)
      .post(`/api/rentals/${rentalId}/inspection`)
      .send({ actorId: admin.id, actorRole: 'provider', outcome: 'clear' })
      .expect(200);

    const resolvedAlert = await InventoryAlert.findOne({ where: { id: alert.id } });
    expect(resolvedAlert.status).toBe('resolved');
  });
});
