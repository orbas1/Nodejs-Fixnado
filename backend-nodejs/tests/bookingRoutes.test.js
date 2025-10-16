import request from 'supertest';
import { DateTime } from 'luxon';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';

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

const polygon = {
  type: 'Polygon',
  coordinates: [
    [
      [-0.2, 51.45],
      [-0.12, 51.45],
      [-0.12, 51.5],
      [-0.2, 51.5],
      [-0.2, 51.45]
    ]
  ]
};

async function createCompanyWithZone() {
  const admin = await User.create({
    firstName: 'Provider',
    lastName: 'Lead',
    email: `provider-${Date.now()}@example.com`,
    passwordHash: 'hashed',
    type: 'provider_admin'
  });

  const company = await Company.create({
    userId: admin.id,
    legalStructure: 'Ltd',
    contactName: 'Provider Lead',
    contactEmail: admin.email,
    serviceRegions: 'London',
    marketplaceIntent: 'growth'
  });

  const zoneResponse = await request(app)
    .post('/api/zones')
    .send({ companyId: company.id, name: 'Westminster', geometry: polygon })
    .expect(201);

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
  await sequelize.truncate({ cascade: true, restartIdentity: true });
});

describe('Booking orchestration', () => {
  it('creates bookings, orchestrates assignments, bids, and disputes', async () => {
    const customer = await User.create({
      firstName: 'Customer',
      lastName: 'Jones',
      email: 'customer@example.com',
      passwordHash: 'hashed',
      type: 'user'
    });

    const provider = await User.create({
      firstName: 'Technician',
      lastName: 'Smith',
      email: 'tech@example.com',
      passwordHash: 'hashed',
      type: 'servicemen'
    });

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
    expect(Number(bookingResponse.body.totalAmount)).toBeCloseTo(161.28, 2);
    expect(Number(bookingResponse.body.commissionAmount)).toBeCloseTo(14.4, 2);
    expect(Number(bookingResponse.body.taxAmount)).toBeCloseTo(26.88, 2);

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
    const customer = await User.create({
      firstName: 'Invalid',
      lastName: 'User',
      email: 'invalid@example.com',
      passwordHash: 'hashed',
      type: 'user'
    });

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

  it('updates booking schedule, metadata, and status', async () => {
    const customer = await User.create({
      firstName: 'Calendar',
      lastName: 'Owner',
      email: 'calendar-owner@example.com',
      passwordHash: 'hashed',
      type: 'user'
    });

    const { company, zoneId } = await createCompanyWithZone();

    const start = DateTime.now().plus({ days: 1 }).set({ minute: 0, second: 0, millisecond: 0 });
    const end = start.plus({ hours: 2 });

    const createResponse = await request(app)
      .post('/api/bookings')
      .send({
        customerId: customer.id,
        companyId: company.id,
        zoneId,
        type: 'scheduled',
        demandLevel: 'medium',
        baseAmount: 140,
        currency: 'GBP',
        scheduledStart: start.toISO(),
        scheduledEnd: end.toISO(),
        metadata: { title: 'Initial Boiler Service' }
      })
      .expect(201);

    const bookingId = createResponse.body.id;

    const newStart = start.plus({ hours: 1 });
    const newEnd = end.plus({ hours: 1 });

    const patchResponse = await request(app)
      .patch(`/api/bookings/${bookingId}`)
      .send({
        title: 'Updated Boiler Service',
        location: 'Block A, Roof plant room',
        instructions: 'Meet caretaker on arrival. Bring lift keys.',
        scheduledStart: newStart.toISO(),
        scheduledEnd: newEnd.toISO(),
        status: 'in_progress',
        actorId: customer.id,
        statusReason: 'Crew dispatched to site',
        attachments: [
          { url: 'https://files.example.com/site-plan.pdf', label: 'Site plan', type: 'document' }
        ]
      })
      .expect(200);

    expect(patchResponse.body.status).toBe('in_progress');
    expect(patchResponse.body.title).toBe('Updated Boiler Service');
    expect(patchResponse.body.location).toContain('Roof');
    expect(patchResponse.body.instructions).toContain('caretaker');
    expect(patchResponse.body.meta.attachments).toHaveLength(1);

    const refreshed = await Booking.findByPk(bookingId);
    expect(refreshed.status).toBe('in_progress');
    expect(refreshed.title).toBe('Updated Boiler Service');
    expect(new Date(refreshed.scheduledStart).getTime()).toBeCloseTo(newStart.toJSDate().getTime());
    expect(new Date(refreshed.scheduledEnd).getTime()).toBeCloseTo(newEnd.toJSDate().getTime());
  });

  it('manages booking notes lifecycle', async () => {
    const customer = await User.create({
      firstName: 'Notes',
      lastName: 'Owner',
      email: 'notes-owner@example.com',
      passwordHash: 'hashed',
      type: 'user'
    });

    const { company, zoneId } = await createCompanyWithZone();
    const start = DateTime.now().plus({ days: 2 }).set({ minute: 0, second: 0, millisecond: 0 });
    const end = start.plus({ hours: 1 });

    const bookingResponse = await request(app)
      .post('/api/bookings')
      .send({
        customerId: customer.id,
        companyId: company.id,
        zoneId,
        type: 'scheduled',
        baseAmount: 90,
        currency: 'GBP',
        scheduledStart: start.toISO(),
        scheduledEnd: end.toISO()
      })
      .expect(201);

    const bookingId = bookingResponse.body.id;

    const noteResponse = await request(app)
      .post(`/api/bookings/${bookingId}/notes`)
      .send({
        authorId: customer.id,
        authorType: 'user',
        body: 'Site contact is Alice. Gate code 4821.',
        attachments: [{ url: 'https://files.example.com/site-photo.jpg', label: 'Site photo' }]
      })
      .expect(201);

    const noteId = noteResponse.body.id;

    const listResponse = await request(app)
      .get(`/api/bookings/${bookingId}/notes`)
      .expect(200);

    expect(listResponse.body).toHaveLength(1);
    expect(listResponse.body[0].attachments).toHaveLength(1);

    const updatedNote = await request(app)
      .patch(`/api/bookings/${bookingId}/notes/${noteId}`)
      .send({ body: 'Site contact Alice – ring before arrival.', isPinned: true })
      .expect(200);

    expect(updatedNote.body.body).toContain('ring before');
    expect(updatedNote.body.isPinned).toBe(true);

    await request(app)
      .delete(`/api/bookings/${bookingId}/notes/${noteId}`)
      .expect(204);

    const postDelete = await request(app)
      .get(`/api/bookings/${bookingId}/notes`)
      .expect(200);

    expect(postDelete.body).toHaveLength(0);
  });

  it('manages crew assignments through dedicated endpoints', async () => {
    const customer = await User.create({
      firstName: 'Schedule',
      lastName: 'Owner',
      email: `calendar-owner-${Date.now()}@example.com`,
      passwordHash: 'hashed',
      type: 'user'
    });

    const leadProvider = await User.create({
      firstName: 'Amelia',
      lastName: 'Rigby',
      email: `lead-${Date.now()}@example.com`,
      passwordHash: 'hashed',
      type: 'servicemen'
    });

    const supportProvider = await User.create({
      firstName: 'Noah',
      lastName: 'Cole',
      email: `support-${Date.now()}@example.com`,
      passwordHash: 'hashed',
      type: 'servicemen'
    });

    const { company, zoneId } = await createCompanyWithZone();

    const start = DateTime.now().plus({ hours: 2 }).set({ minute: 0, second: 0, millisecond: 0 });
    const end = start.plus({ hours: 3 });

    const bookingResponse = await request(app)
      .post('/api/bookings')
      .send({
        customerId: customer.id,
        companyId: company.id,
        zoneId,
        type: 'scheduled',
        baseAmount: 200,
        currency: 'GBP',
        scheduledStart: start.toISO(),
        scheduledEnd: end.toISO()
      })
      .expect(201);

    const bookingId = bookingResponse.body.id;

    const initialAssignmentResponse = await request(app)
      .post(`/api/bookings/${bookingId}/assignments`)
      .send({ assignments: [{ providerId: leadProvider.id, role: 'lead' }] })
      .expect(201);

    expect(initialAssignmentResponse.body).toHaveLength(1);
    expect(initialAssignmentResponse.body[0].providerId).toBe(leadProvider.id);
    expect(initialAssignmentResponse.body[0].provider.email).toBe(leadProvider.email);

    await request(app)
      .post(`/api/bookings/${bookingId}/assignments`)
      .send({ assignments: [{ providerId: supportProvider.id }] })
      .expect(201);

    const listResponse = await request(app)
      .get(`/api/bookings/${bookingId}/assignments`)
      .expect(200);

    expect(listResponse.body).toHaveLength(2);
    const supportAssignment = listResponse.body.find((assignment) => assignment.providerId === supportProvider.id);
    expect(supportAssignment.role).toBe('support');

    const updatedAssignment = await request(app)
      .patch(`/api/bookings/${bookingId}/assignments/${supportAssignment.id}`)
      .send({ role: 'lead', status: 'accepted' })
      .expect(200);

    expect(updatedAssignment.body.role).toBe('lead');
    expect(updatedAssignment.body.status).toBe('accepted');
    expect(new Date(updatedAssignment.body.acknowledgedAt).getTime()).toBeGreaterThan(0);

    const bookingAfterAcceptance = await Booking.findByPk(bookingId);
    expect(bookingAfterAcceptance.status).toBe('scheduled');

    const assignmentToRemove = listResponse.body.find((assignment) => assignment.providerId === leadProvider.id);

    await request(app)
      .delete(`/api/bookings/${bookingId}/assignments/${assignmentToRemove.id}`)
      .expect(204);

    const afterDeletion = await request(app)
      .get(`/api/bookings/${bookingId}/assignments`)
      .expect(200);

    expect(afterDeletion.body).toHaveLength(1);
    expect(afterDeletion.body[0].providerId).toBe(supportProvider.id);
  });

  it('returns calendar data for customer scheduling', async () => {
    const customer = await User.create({
      firstName: 'Calendar',
      lastName: 'Viewer',
      email: 'calendar-viewer@example.com',
      passwordHash: 'hashed',
      type: 'user'
    });

    const { company, zoneId } = await createCompanyWithZone();

    const base = DateTime.now().plus({ days: 5 }).set({ hour: 9, minute: 0, second: 0, millisecond: 0 });
    const bookingOneStart = base;
    const bookingOneEnd = base.plus({ hours: 2 });

    await request(app)
      .post('/api/bookings')
      .send({
        customerId: customer.id,
        companyId: company.id,
        zoneId,
        type: 'scheduled',
        baseAmount: 120,
        currency: 'GBP',
        scheduledStart: bookingOneStart.toISO(),
        scheduledEnd: bookingOneEnd.toISO(),
        metadata: { title: 'HVAC service', primaryCrew: 'Team Volt' }
      })
      .expect(201);

    await request(app)
      .post('/api/bookings')
      .send({
        customerId: customer.id,
        companyId: company.id,
        zoneId,
        type: 'on_demand',
        baseAmount: 60,
        currency: 'GBP'
      })
      .expect(201);

    const monthValue = bookingOneStart.toFormat('yyyy-LL');

    const calendarResponse = await request(app)
      .get('/api/bookings/calendar')
      .query({ customerId: customer.id, companyId: company.id, month: monthValue, timezone: 'Europe/London' })
      .expect(200);

    expect(calendarResponse.body.monthValue).toBe(monthValue);
    expect(calendarResponse.body.weeks.length).toBeGreaterThan(0);
    const hasEvent = calendarResponse.body.weeks.some((week) =>
      week.some((day) => day.events && day.events.length > 0)
    );
    expect(hasEvent).toBe(true);
    expect(calendarResponse.body.backlog.length).toBeGreaterThan(0);
    expect(calendarResponse.body.filters.statuses).toHaveLength(5);
  });
});
