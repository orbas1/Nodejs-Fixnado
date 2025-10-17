import request from 'supertest';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';

process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-secret';

const { default: app } = await import('../src/app.js');
const {
  sequelize,
  User,
  Company,
  ServiceZone,
  Booking,
  ProviderCalendarEvent
} = await import('../src/models/index.js');

function createToken(userId) {
  return jwt.sign({ sub: userId, role: 'provider', persona: 'provider' }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

async function createProviderFixtures() {
  const providerUser = await User.create(
    {
      firstName: 'Taylor',
      lastName: 'Provider',
      email: `provider-${Date.now()}@example.com`,
      passwordHash: 'hashed',
      type: 'provider'
    },
    { validate: false }
  );

  const company = await Company.create({
    userId: providerUser.id,
    legalStructure: 'Ltd',
    contactName: 'Taylor Provider',
    contactEmail: providerUser.email,
    serviceRegions: 'London',
    marketplaceIntent: 'provider'
  });

  const zone = await ServiceZone.create({
    companyId: company.id,
    name: 'Central',
    boundary: { type: 'Polygon', coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] },
    centroid: { type: 'Point', coordinates: [0.5, 0.5] },
    boundingBox: { west: 0, south: 0, east: 1, north: 1 },
    metadata: {}
  });

  const booking = await Booking.create({
    customerId: providerUser.id,
    companyId: company.id,
    zoneId: zone.id,
    status: 'scheduled',
    type: 'scheduled',
    scheduledStart: DateTime.now().setZone('Europe/London').plus({ hours: 2 }).toJSDate(),
    scheduledEnd: DateTime.now().setZone('Europe/London').plus({ hours: 5 }).toJSDate(),
    slaExpiresAt: DateTime.now().plus({ hours: 6 }).toJSDate(),
    baseAmount: 500,
    currency: 'GBP',
    totalAmount: 500,
    commissionAmount: 0,
    taxAmount: 0,
    meta: { title: 'Initial booking', customer: 'Facilities Team' },
    lastStatusTransitionAt: new Date()
  });

  const token = createToken(providerUser.id);

  return { token, company, zone, booking };
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await ProviderCalendarEvent.destroy({ where: {} });
  await Booking.destroy({ where: {} });
  await ServiceZone.destroy({ where: {} });
  await Company.destroy({ where: {} });
  await User.destroy({ where: {} });
});

describe('Provider calendar routes', () => {
  it('returns calendar snapshot with bookings', async () => {
    const { token, company, booking } = await createProviderFixtures();

    const response = await request(app)
      .get('/api/providers/calendar')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Fixnado-Persona', 'provider')
      .query({ companyId: company.id, timezone: 'Europe/London' })
      .expect(200);

    expect(response.body.data.bookings).toEqual(
      expect.arrayContaining([expect.objectContaining({ id: booking.id })])
    );
    expect(response.body.data.calendar.weeks.length).toBeGreaterThan(0);
  });

  it('creates and lists calendar events', async () => {
    const { token, company } = await createProviderFixtures();

    const createResponse = await request(app)
      .post('/api/providers/calendar/events')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Fixnado-Persona', 'provider')
      .send({
        companyId: company.id,
        title: 'Crew standby',
        start: DateTime.now().setZone('Europe/London').plus({ hours: 1 }).toISO(),
        end: DateTime.now().setZone('Europe/London').plus({ hours: 3 }).toISO(),
        type: 'hold',
        status: 'planned'
      })
      .expect(201);

    expect(createResponse.body.event.title).toBe('Crew standby');

    const listResponse = await request(app)
      .get('/api/providers/calendar')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Fixnado-Persona', 'provider')
      .query({ companyId: company.id, timezone: 'Europe/London' })
      .expect(200);

    expect(listResponse.body.data.events).toEqual(
      expect.arrayContaining([expect.objectContaining({ title: 'Crew standby' })])
    );
  });

  it('updates booking schedule', async () => {
    const { token, company, booking } = await createProviderFixtures();
    const newStart = DateTime.now().setZone('Europe/London').plus({ days: 1, hours: 2 }).toISO();

    const response = await request(app)
      .patch(`/api/providers/calendar/bookings/${booking.id}`)
      .set('Authorization', `Bearer ${token}`)
      .set('X-Fixnado-Persona', 'provider')
      .send({ companyId: company.id, start: newStart, status: 'scheduled' })
      .expect(200);

    expect(response.body.booking.start).toBe(newStart);
  });

  it('creates manual bookings', async () => {
    const { token, company, zone } = await createProviderFixtures();

    const payload = {
      companyId: company.id,
      title: 'Manual assignment',
      customerName: 'Acme plc',
      start: DateTime.now().setZone('Europe/London').plus({ days: 2 }).toISO(),
      end: DateTime.now().setZone('Europe/London').plus({ days: 2, hours: 4 }).toISO(),
      zoneId: zone.id,
      value: 1200,
      currency: 'GBP'
    };

    const response = await request(app)
      .post('/api/providers/calendar/bookings')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Fixnado-Persona', 'provider')
      .send(payload)
      .expect(201);

    expect(response.body.booking.title).toBe('Manual assignment');
    expect(response.body.booking.zoneId).toBe(zone.id);
  });
});
