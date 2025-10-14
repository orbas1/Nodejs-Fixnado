import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';
import { withAuth } from './helpers/auth.js';

const { default: app } = await import('../src/app.js');
const {
  sequelize,
  Booking,
  BookingAssignment,
  CampaignDailyMetric,
  CampaignFraudSignal,
  CampaignInvoice,
  Company,
  ComplianceDocument,
  Conversation,
  ConversationParticipant,
  InventoryAlert,
  InventoryItem,
  RentalAgreement,
  Service,
  ServiceZone,
  User,
  AdCampaign
} = await import('../src/models/index.js');

const IDS = {
  companyUser: '11111111-1111-4111-8111-aaaaaaaaaaaa',
  provider: '22222222-2222-4222-8222-bbbbbbbbbbbb',
  renter: '33333333-3333-4333-8333-cccccccccccc',
  zone: '44444444-4444-4444-8444-dddddddddddd',
  campaign: '55555555-5555-4555-8555-eeeeeeeeeeee',
  conversation: '66666666-6666-4666-8666-ffffffffffff'
};

async function createCompanyWithFixtures() {
  const user = await User.create({
    id: IDS.companyUser,
    firstName: 'Metro',
    lastName: 'Ops',
    email: `ops-${Date.now()}@example.com`,
    passwordHash: 'hash',
    type: 'company'
  });

  const company = await Company.create({
    userId: user.id,
    legalStructure: 'limited',
    contactName: 'Metro Power Services',
    contactEmail: 'ops@metro.example',
    serviceRegions: 'London, South East',
    marketplaceIntent: 'Critical infrastructure',
    verified: true,
    insuredSellerStatus: 'approved',
    complianceScore: 92.5
  });

  await ServiceZone.create({
    id: IDS.zone,
    companyId: company.id,
    name: 'Central London',
    boundary: { type: 'Polygon', coordinates: [] },
    centroid: { type: 'Point', coordinates: [0, 0] },
    boundingBox: { west: -0.1, south: 51.5, east: 0.1, north: 51.6 },
    metadata: {}
  });

  await Service.create({
    companyId: company.id,
    title: 'Critical power maintenance',
    description: 'Escrow-backed electrical resilience programme.',
    category: 'Electrical',
    price: 5400,
    currency: 'GBP'
  });

  const now = DateTime.now().setZone('Europe/London');

  await User.create({
    id: IDS.provider,
    firstName: 'Amina',
    lastName: 'Khan',
    email: `crew-${Date.now()}@example.com`,
    passwordHash: 'hash',
    type: 'servicemen'
  });

  await User.create({
    id: IDS.renter,
    firstName: 'Enterprise',
    lastName: 'Client',
    email: `client-${Date.now()}@example.com`,
    passwordHash: 'hash',
    type: 'user'
  });

  const booking = await Booking.create({
    companyId: company.id,
    customerId: IDS.provider,
    zoneId: IDS.zone,
    status: 'scheduled',
    type: 'scheduled',
    scheduledStart: now.plus({ days: 2 }).toJSDate(),
    scheduledEnd: now.plus({ days: 2, hours: 2 }).toJSDate(),
    slaExpiresAt: now.plus({ days: 2, hours: 4 }).toJSDate(),
    baseAmount: 320,
    currency: 'GBP',
    totalAmount: 560,
    commissionAmount: 60,
    taxAmount: 80,
    meta: {
      title: 'Generator maintenance',
      requester: 'Facilities Ops',
      primaryCrew: 'Team Volt',
      csat: 0.96,
      zoneName: 'Central London'
    },
    lastStatusTransitionAt: now.toJSDate()
  });

  await Booking.create({
    companyId: company.id,
    customerId: IDS.provider,
    zoneId: IDS.zone,
    status: 'completed',
    type: 'scheduled',
    scheduledStart: now.minus({ days: 5 }).toJSDate(),
    scheduledEnd: now.minus({ days: 5 }).plus({ hours: 2 }).toJSDate(),
    slaExpiresAt: now.minus({ days: 5 }).plus({ hours: 4 }).toJSDate(),
    baseAmount: 180,
    currency: 'GBP',
    totalAmount: 320,
    commissionAmount: 35,
    taxAmount: 40,
    meta: {
      title: 'Switchgear inspection',
      requester: 'Campus Ops',
      primaryCrew: 'Team Volt',
      csat: 0.94,
      feedback: 'Exceptional communication and resolution.'
    },
    lastStatusTransitionAt: now.minus({ days: 5 }).plus({ hours: 1 }).toJSDate()
  });

  await BookingAssignment.create({
    bookingId: booking.id,
    providerId: IDS.provider,
    role: 'lead',
    status: 'accepted',
    assignedAt: now.minus({ days: 1 }).toJSDate(),
    acknowledgedAt: now.minus({ hours: 12 }).toJSDate()
  });

  const inventoryItem = await InventoryItem.create({
    companyId: company.id,
    name: 'Industrial fan',
    sku: 'FAN-100',
    category: 'HVAC',
    quantityOnHand: 4,
    quantityReserved: 2,
    safetyStock: 1,
    metadata: {}
  });

  await InventoryAlert.create({
    itemId: inventoryItem.id,
    type: 'low_stock',
    severity: 'critical',
    status: 'active',
    triggeredAt: now.minus({ days: 1 }).toJSDate(),
    metadata: {}
  });

  await ComplianceDocument.create({
    companyId: company.id,
    type: 'Insurance Certificate',
    status: 'approved',
    storageKey: 's3://bucket/insurance.pdf',
    fileName: 'insurance.pdf',
    fileSizeBytes: 1024,
    mimeType: 'application/pdf',
    submittedAt: now.minus({ days: 30 }).toJSDate(),
    reviewedAt: now.minus({ days: 25 }).toJSDate(),
    expiryAt: now.plus({ days: 20 }).toJSDate(),
    metadata: { issuer: 'NICEIC' }
  });

  await ComplianceDocument.create({
    companyId: company.id,
    type: 'Safety Policy',
    status: 'expired',
    storageKey: 's3://bucket/safety.pdf',
    fileName: 'safety.pdf',
    fileSizeBytes: 2048,
    mimeType: 'application/pdf',
    submittedAt: now.minus({ days: 200 }).toJSDate(),
    reviewedAt: now.minus({ days: 190 }).toJSDate(),
    expiryAt: now.minus({ days: 5 }).toJSDate(),
    metadata: { issuer: 'HSE' }
  });

  const campaign = await AdCampaign.create({
    id: IDS.campaign,
    companyId: company.id,
    name: 'Winter Safety',
    objective: 'lead_generation',
    campaignType: 'ppc_conversion',
    status: 'active',
    pacingStrategy: 'even',
    bidStrategy: 'cpc',
    currency: 'GBP',
    totalBudget: 12000,
    dailySpendCap: 800,
    startAt: now.minus({ days: 10 }).toJSDate(),
    endAt: now.plus({ days: 20 }).toJSDate(),
    timezone: 'Europe/London',
    metadata: {}
  });

  await CampaignDailyMetric.create({
    campaignId: campaign.id,
    metricDate: now.minus({ days: 2 }).toJSDate(),
    impressions: 1800,
    clicks: 140,
    conversions: 18,
    spend: 520,
    revenue: 960,
    spendTarget: 500,
    ctr: 0.077,
    cvr: 0.128,
    metadata: {}
  });

  await CampaignInvoice.create({
    campaignId: campaign.id,
    invoiceNumber: `INV-${Date.now()}`,
    currency: 'GBP',
    amountDue: 18400,
    amountPaid: 0,
    periodStart: now.minus({ days: 30 }).toJSDate(),
    periodEnd: now.minus({ days: 1 }).toJSDate(),
    dueDate: now.plus({ days: 7 }).toJSDate(),
    status: 'issued',
    metadata: {}
  });

  await CampaignFraudSignal.create({
    campaignId: campaign.id,
    signalType: 'overspend',
    severity: 'warning',
    detectedAt: now.minus({ days: 1 }).toJSDate(),
    metadata: { owner: 'Marketing Ops' }
  });

  const conversation = await Conversation.create({
    id: IDS.conversation,
    subject: 'Enterprise Ops',
    createdById: company.userId,
    createdByType: 'company',
    defaultTimezone: 'Europe/London',
    metadata: {}
  });

  await ConversationParticipant.create({
    conversationId: conversation.id,
    participantType: 'enterprise',
    participantReferenceId: company.id,
    displayName: 'Enterprise Ops',
    role: 'operations',
    timezone: 'Europe/London'
  });

  await RentalAgreement.create({
    rentalNumber: 'RA-1001',
    itemId: inventoryItem.id,
    companyId: company.id,
    renterId: IDS.renter,
    status: 'inspection_pending',
    depositStatus: 'held',
    quantity: 1,
    pickupAt: now.minus({ days: 3 }).toJSDate(),
    returnDueAt: now.plus({ days: 4 }).toJSDate(),
    meta: {}
  });

  return { company, user };
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

describe('Panel routes', () => {
  it('returns provider dashboard data with operational metrics', async () => {
    const { company, user } = await createCompanyWithFixtures();

    const response = await withAuth(
      request(app).get('/api/panel/provider/dashboard').query({ companyId: company.id }),
      user.id
    ).expect(200);

    expect(response.body.data.provider.tradingName).toContain('Metro');
    expect(response.body.data.metrics.activeBookings).toBeGreaterThanOrEqual(1);
    expect(response.body.data.pipeline.upcomingBookings[0].service).toBeDefined();
    expect(response.body.meta.companyId).toBe(company.id);
  });

  it('returns enterprise panel aggregates including spend and programmes', async () => {
    const { company, user } = await createCompanyWithFixtures();

    const response = await withAuth(
      request(app).get('/api/panel/enterprise/overview').query({ companyId: company.id }),
      user.id
    ).expect(200);

    expect(response.body.data.enterprise.activeSites).toBe(1);
    expect(response.body.data.spend.monthToDate).toBeGreaterThan(0);
    expect(response.body.data.programmes.length).toBeGreaterThan(0);
    expect(response.body.data.escalations[0].severity).toBe('warning');
  });

  it('returns a business front view with stats and testimonials', async () => {
    await createCompanyWithFixtures();

    const response = await request(app).get('/api/business-fronts/featured').expect(200);

    expect(response.body.data.hero.name).toContain('Metro');
    expect(response.body.data.packages.length).toBeGreaterThan(0);
    expect(response.body.data.stats[0].value).toBeGreaterThanOrEqual(0);
  });
  it('rejects provider dashboard requests without authentication', async () => {
    const { company } = await createCompanyWithFixtures();

    await request(app)
      .get('/api/panel/provider/dashboard')
      .query({ companyId: company.id })
      .expect(401);
  });

  it('rejects provider dashboard requests from non-company roles', async () => {
    const { company } = await createCompanyWithFixtures();

    await withAuth(
      request(app).get('/api/panel/provider/dashboard').query({ companyId: company.id }),
      IDS.provider
    ).expect(403);
  });
});

