import request from 'supertest';
import jwt from 'jsonwebtoken';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';

const { default: app } = await import('../src/app.js');
const {
  sequelize,
  User,
  UserSession,
  Company,
  InventoryItem
} = await import('../src/models/index.js');
const { requestRentalAgreement } = await import('../src/services/rentalService.js');

process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';

async function createAdminSession() {
  const admin = await User.create(
    {
      firstName: 'Platform',
      lastName: 'Admin',
      email: `admin-${Date.now()}@example.com`,
      passwordHash: 'hashed-password',
      type: 'admin'
    },
    { validate: false }
  );

  const session = await UserSession.create({
    userId: admin.id,
    refreshTokenHash: `hash-${Math.random().toString(36).slice(2)}`,
    sessionFingerprint: 'vitest',
    clientType: 'web',
    clientVersion: 'test',
    deviceLabel: 'vitest-suite',
    ipAddress: '127.0.0.1',
    userAgent: 'vitest',
    metadata: {},
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    lastUsedAt: new Date()
  });

  const token = jwt.sign(
    {
      sub: admin.id,
      sid: session.id,
      role: 'admin',
      persona: 'admin'
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '1h',
      audience: 'fixnado:web',
      issuer: 'fixnado-api'
    }
  );

  return { admin, token };
}

async function createRentalFixture() {
  const provider = await User.create(
    {
      firstName: 'Provider',
      lastName: 'Owner',
      email: `provider-${Date.now()}@example.com`,
      passwordHash: 'hashed-password',
      type: 'provider'
    },
    { validate: false }
  );

  const company = await Company.create({
    userId: provider.id,
    legalStructure: 'Ltd',
    contactName: 'Provider Owner',
    contactEmail: `provider-${Date.now()}@example.com`,
    serviceRegions: 'London',
    marketplaceIntent: 'rentals',
    verified: true
  });

  const renter = await User.create(
    {
      firstName: 'Customer',
      lastName: 'Jones',
      email: `customer-${Date.now()}@example.com`,
      passwordHash: 'hashed-password',
      type: 'user'
    },
    { validate: false }
  );

  const item = await InventoryItem.create({
    companyId: company.id,
    name: 'Portable Tower Light',
    sku: `TL-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    category: 'Lighting',
    unitType: 'unit',
    quantityOnHand: 10,
    quantityReserved: 0,
    safetyStock: 1,
    rentalRate: 75,
    rentalRateCurrency: 'GBP',
    depositAmount: 250,
    depositCurrency: 'GBP',
    metadata: { manufacturer: 'Doosan' }
  });

  return { provider, company, renter, item };
}

function futureDate(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

describe('Admin rental management routes', () => {
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

  it('allows admins to list rentals and update financial and schedule details', async () => {
    const { token } = await createAdminSession();

    const { renter, item } = await createRentalFixture();

    const start = futureDate(6);
    const end = futureDate(72);

    const rental = await requestRentalAgreement({
      itemId: item.id,
      renterId: renter.id,
      quantity: 1,
      rentalStart: start.toISOString(),
      rentalEnd: end.toISOString(),
      actorId: renter.id,
      actorRole: 'customer',
      notes: 'Initial request'
    });

    const listResponse = await request(app)
      .get('/api/admin/rentals')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(Array.isArray(listResponse.body.data)).toBe(true);
    expect(listResponse.body.data.length).toBe(1);
    expect(listResponse.body.data[0].id).toBe(rental.id);
    expect(listResponse.body.meta.total).toBe(1);

    const updateResponse = await request(app)
      .patch(`/api/admin/rentals/${rental.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        depositStatus: 'held',
        depositAmount: 350,
        depositCurrency: 'GBP',
        dailyRate: 90,
        rateCurrency: 'GBP',
        rentalStartAt: futureDate(8).toISOString(),
        rentalEndAt: futureDate(96).toISOString(),
        pickupAt: futureDate(10).toISOString(),
        returnDueAt: futureDate(120).toISOString(),
        notes: 'Admin updated rental window',
        logisticsNotes: 'Courier rebooked with overnight service'
      })
      .expect(200);

    expect(updateResponse.body.data.depositStatus).toBe('held');
    expect(updateResponse.body.data.depositAmount).toBeCloseTo(350);
    expect(updateResponse.body.data.dailyRate).toBeCloseTo(90);
    expect(updateResponse.body.data.meta.notes).toBe('Admin updated rental window');
    expect(updateResponse.body.data.meta.logisticsNotes).toBe('Courier rebooked with overnight service');
    expect(updateResponse.body.data.timeline.length).toBeGreaterThan(0);

    const latestCheckpoint = updateResponse.body.data.timeline[updateResponse.body.data.timeline.length - 1];
    expect(latestCheckpoint.type).toBe('note');
    expect(latestCheckpoint.payload.changes.depositStatus.next).toBe('held');
  });

  it('processes rental lifecycle actions end-to-end', async () => {
    const { token } = await createAdminSession();
    const { renter, item } = await createRentalFixture();

    const start = futureDate(12);
    const end = futureDate(96);

    const createResponse = await request(app)
      .post('/api/admin/rentals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        itemId: item.id,
        renterId: renter.id,
        quantity: 1,
        rentalStart: start.toISOString(),
        rentalEnd: end.toISOString(),
        notes: 'Admin created lifecycle test rental'
      })
      .expect(201);

    const rentalId = createResponse.body.data.id;
    expect(createResponse.body.data.status).toBe('requested');

    const approveResponse = await request(app)
      .post(`/api/admin/rentals/${rentalId}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .send({ approvalNotes: 'Auto-approved for testing' })
      .expect(200);
    expect(approveResponse.body.data.status).toBe('approved');

    const pickupAt = futureDate(24);
    const returnDue = futureDate(120);
    const scheduleResponse = await request(app)
      .post(`/api/admin/rentals/${rentalId}/schedule-pickup`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        pickupAt: pickupAt.toISOString(),
        returnDueAt: returnDue.toISOString(),
        logisticsNotes: 'Courier booked'
      })
      .expect(200);
    expect(scheduleResponse.body.data.status).toBe('pickup_scheduled');

    const checkoutResponse = await request(app)
      .post(`/api/admin/rentals/${rentalId}/checkout`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        rentalStartAt: pickupAt.toISOString(),
        conditionOut: { notes: 'Good condition', images: ['https://cdn.example.com/checkout.jpg'] },
        handoverNotes: 'Left with site manager'
      })
      .expect(200);
    expect(checkoutResponse.body.data.status).toBe('in_use');

    const checkpointResponse = await request(app)
      .post(`/api/admin/rentals/${rentalId}/checkpoints`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'note', description: 'Site inspection scheduled', payload: { inspector: 'QA-1' } })
      .expect(201);
    expect(checkpointResponse.body.data.timeline.length).toBeGreaterThanOrEqual(2);

    const returnAt = futureDate(130);
    const returnResponse = await request(app)
      .post(`/api/admin/rentals/${rentalId}/return`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        returnedAt: returnAt.toISOString(),
        conditionIn: { notes: 'Minor scuffs', images: ['https://cdn.example.com/return.jpg'] },
        notes: 'Returned via courier'
      })
      .expect(200);
    expect(returnResponse.body.data.status).toBe('inspection_pending');

    const inspectionResponse = await request(app)
      .post(`/api/admin/rentals/${rentalId}/inspection`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        outcome: 'clear',
        inspectionNotes: 'No damage observed',
        charges: []
      })
      .expect(200);
    expect(inspectionResponse.body.data.status).toBe('settled');
    expect(inspectionResponse.body.data.depositStatus).toBe('released');

    const finalResponse = await request(app)
      .get(`/api/admin/rentals/${rentalId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(finalResponse.body.data.timeline.length).toBeGreaterThanOrEqual(6);
    const timelineTypes = finalResponse.body.data.timeline.map((entry) => entry.type);
    expect(timelineTypes).toContain('inspection');
    expect(timelineTypes).toContain('handover');

    const cancelRentalResponse = await request(app)
      .post('/api/admin/rentals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        itemId: item.id,
        renterId: renter.id,
        quantity: 1,
        rentalStart: start.toISOString(),
        rentalEnd: end.toISOString(),
        notes: 'Cancellation flow'
      })
      .expect(201);

    const rentalToCancel = cancelRentalResponse.body.data.id;

    const cancelResponse = await request(app)
      .post(`/api/admin/rentals/${rentalToCancel}/cancel`)
      .set('Authorization', `Bearer ${token}`)
      .send({ reason: 'Customer request' })
      .expect(200);
    expect(cancelResponse.body.data.status).toBe('cancelled');
  });
});
