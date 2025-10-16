import request from 'supertest';
import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';

const { default: app } = await import('../src/app.js');
const {
  sequelize,
  User,
  Company,
  Booking,
  BookingAssignment,
  BookingBid,
  BookingBidComment,
  AnalyticsEvent
} = await import('../src/models/index.js');
const { createSessionToken } = await import('./helpers/session.js');

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

async function createCompanyWithZone() {
  const admin = await User.create(
    {
      firstName: 'Provider',
      lastName: 'Lead',
      email: `provider-${Date.now()}@example.com`,
      passwordHash: 'hashed',
      type: 'provider_admin'
    },
    { validate: false }
  );

  const company = await Company.create({
    userId: admin.id,
    legalStructure: 'Ltd',
    contactName: 'Provider Lead',
    contactEmail: admin.email,
    serviceRegions: 'London',
    marketplaceIntent: 'growth'
  });

  const opsUser = await User.create(
    {
      firstName: 'Ops',
      lastName: 'Controller',
      email: `ops-${Date.now()}@example.com`,
      passwordHash: 'hashed',
      type: 'operations'
    },
    { validate: false }
  );

  const { token } = await createSessionToken(opsUser, { role: 'operations' });

  const zoneResponse = await request(app)
    .post('/api/zones')
    .set('Authorization', token)
    .send({ companyId: company.id, name: 'Westminster', geometry: polygon });

  expect(zoneResponse.status).toBe(201);

  return { company, zoneId: zoneResponse.body.id };
}

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

describe('Booking orchestration', () => {
  it('creates bookings, orchestrates assignments, bids, and disputes', async () => {
    const customer = await User.create(
      {
        firstName: 'Customer',
        lastName: 'Jones',
        email: 'customer@example.com',
        passwordHash: 'hashed',
        type: 'user'
      },
      { validate: false }
    );

    const provider = await User.create(
      {
        firstName: 'Technician',
        lastName: 'Smith',
        email: 'tech@example.com',
        passwordHash: 'hashed',
        type: 'servicemen'
      },
      { validate: false }
    );

    const { company, zoneId } = await createCompanyWithZone();

    const start = new Date(Date.now() + 3600 * 1000);
    const end = new Date(start.getTime() + 2 * 3600 * 1000);

    const bookingResponse = await request(app)
      .post('/api/bookings')
      .send({
        customerId: customer.id,
        companyId: company.id,
        zoneId,
        type: 'scheduled',
        demandLevel: 'high',
        baseAmount: 120,
        currency: 'GBP',
        scheduledStart: start.toISOString(),
        scheduledEnd: end.toISOString(),
        metadata: { service: 'boiler maintenance' }
      })
      .expect(201);

    expect(bookingResponse.body.status).toBe('scheduled');

    const commissionRate = Number(bookingResponse.body.meta?.commissionRate ?? 0);
    const taxRate = Number(bookingResponse.body.meta?.taxRate ?? 0);
    const expectedCommission = 120 * commissionRate;
    const expectedTax = (120 + expectedCommission) * taxRate;
    const expectedTotal = 120 + expectedCommission + expectedTax;

    expect(Number(bookingResponse.body.commissionAmount)).toBeCloseTo(expectedCommission, 2);
    expect(Number(bookingResponse.body.taxAmount)).toBeCloseTo(expectedTax, 2);
    expect(Number(bookingResponse.body.totalAmount)).toBeCloseTo(expectedTotal, 2);

    const bookingId = bookingResponse.body.id;

    await request(app)
      .post(`/api/bookings/${bookingId}/assignments`)
      .send({
        actorId: company.userId,
        assignments: [{ providerId: provider.id, role: 'lead' }]
      })
      .expect(201);

    const assignmentResponse = await request(app)
      .post(`/api/bookings/${bookingId}/assignments/response`)
      .send({ providerId: provider.id, status: 'accepted' })
      .expect(200);

    expect(assignmentResponse.body.booking.status).toBe('scheduled');
    expect(assignmentResponse.body.booking.meta.assignmentAcceptedAt).toBeTruthy();

    const bidResponse = await request(app)
      .post(`/api/bookings/${bookingId}/bids`)
      .send({ providerId: provider.id, amount: 150, currency: 'GBP', message: 'Includes consumables' })
      .expect(201);

    expect(bidResponse.body.status).toBe('pending');

    const bidId = bidResponse.body.id;

    await request(app)
      .patch(`/api/bookings/${bookingId}/bids/${bidId}/status`)
      .send({ status: 'accepted', actorId: customer.id })
      .expect(200);

    await request(app)
      .post(`/api/bookings/${bookingId}/bids/${bidId}/comments`)
      .send({ authorId: customer.id, authorType: 'customer', body: 'Please arrive with DBS card.' })
      .expect(201);

    await request(app)
      .patch(`/api/bookings/${bookingId}/status`)
      .send({ status: 'in_progress', actorId: provider.id })
      .expect(200);

    const disputeResponse = await request(app)
      .post(`/api/bookings/${bookingId}/disputes`)
      .send({ reason: 'Damage reported', actorId: customer.id })
      .expect(200);

    expect(disputeResponse.body.status).toBe('disputed');
    expect(disputeResponse.body.meta.dispute.reason).toBe('Damage reported');

    const listResponse = await request(app).get('/api/bookings').expect(200);
    expect(listResponse.body).toHaveLength(1);

    const storedBooking = await Booking.findByPk(bookingId, { include: [BookingAssignment, BookingBid] });
    expect(storedBooking.BookingAssignments).toHaveLength(1);
    expect(storedBooking.BookingBids).toHaveLength(1);

    expect(await BookingBidComment.count({ where: { bidId } })).toBe(2);

    const events = await AnalyticsEvent.findAll({ order: [['occurred_at', 'ASC']] });
    const names = events.map((event) => event.eventName);
    expect(names).toEqual(expect.arrayContaining(['booking.created', 'booking.assignment.created', 'booking.status_transition', 'booking.dispute.raised']));
    const disputeEvent = events.find((event) => event.eventName === 'booking.dispute.raised');
    expect(disputeEvent.metadata.reason).toBe('Damage reported');
    const assignmentEvent = events.find((event) => event.eventName === 'booking.assignment.created');
    expect(assignmentEvent.metadata.providerId).toEqual(provider.id);
  });

  it('enforces validation on on-demand bookings with schedule payload', async () => {
    const customer = await User.create(
      {
        firstName: 'Invalid',
        lastName: 'User',
        email: 'invalid@example.com',
        passwordHash: 'hashed',
        type: 'user'
      },
      { validate: false }
    );

    const { company, zoneId } = await createCompanyWithZone();

    const response = await request(app)
      .post('/api/bookings')
      .send({
        customerId: customer.id,
        companyId: company.id,
        zoneId,
        type: 'on_demand',
        baseAmount: 80,
        currency: 'GBP',
        scheduledStart: new Date().toISOString()
      })
      .expect(400);

    expect(response.body.message).toMatch(/on-demand/i);
    expect(await Booking.count()).toBe(0);
  });
});
