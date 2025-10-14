import request from 'supertest';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';

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
  MarketplaceItem,
  MarketplaceModerationAction,
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

function createToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET ?? 'change_this_secret', { expiresIn: '1h' });
}

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

  const approvedListing = await MarketplaceItem.create({
    companyId: company.id,
    title: '13kVA generator with ATS',
    description: 'Escrow-backed rental with telemetry sensors and concierge logistics.',
    pricePerDay: 420,
    purchasePrice: 68000,
    location: 'London Docklands',
    availability: 'both',
    status: 'approved',
    insuredOnly: true,
    complianceHoldUntil: now.plus({ days: 21 }).toJSDate(),
    lastReviewedAt: now.minus({ days: 5 }).toJSDate(),
    complianceSnapshot: { status: 'approved', complianceScore: 92 }
  });

  const pendingListing = await MarketplaceItem.create({
    companyId: company.id,
    title: 'HVAC telemetry deployment',
    description: 'IoT sensors, dashboards and commissioning labour.',
    pricePerDay: 260,
    availability: 'rent',
    location: 'Canary Wharf',
    status: 'pending_review',
    insuredOnly: false
  });

  const suspendedListing = await MarketplaceItem.create({
    companyId: company.id,
    title: 'Roof access safety kit',
    description: 'Includes edge protection and harness bundle.',
    pricePerDay: 120,
    availability: 'rent',
    location: 'Stratford',
    status: 'suspended',
    insuredOnly: false,
    moderationNotes: 'Missing inspection evidence for harness lifelines.'
  });

  await MarketplaceModerationAction.create({
    entityType: 'marketplace_item',
    entityId: suspendedListing.id,
    action: 'suspended',
    reason: 'Expired inspection certificate',
    metadata: { status: 'suspended' }
  });

  await MarketplaceModerationAction.create({
    entityType: 'marketplace_item',
    entityId: pendingListing.id,
    action: 'submitted_for_review',
    metadata: { status: 'pending_review' }
  });

  await RentalAgreement.create({
    rentalNumber: 'RA-1001',
    itemId: inventoryItem.id,
    marketplaceItemId: approvedListing.id,
    companyId: company.id,
    renterId: IDS.renter,
    status: 'in_use',
    depositStatus: 'held',
    quantity: 2,
    rentalStartAt: now.minus({ days: 3 }).toJSDate(),
    returnDueAt: now.plus({ days: 4 }).toJSDate(),
    dailyRate: 420,
    rateCurrency: 'GBP',
    meta: { project: 'Generator swap' }
  });

  await RentalAgreement.create({
    rentalNumber: 'RA-1002',
    itemId: inventoryItem.id,
    marketplaceItemId: approvedListing.id,
    companyId: company.id,
    renterId: IDS.renter,
    status: 'settled',
    depositStatus: 'released',
    quantity: 1,
    rentalStartAt: now.minus({ days: 45 }).toJSDate(),
    returnDueAt: now.minus({ days: 40 }).toJSDate(),
    dailyRate: 390,
    rateCurrency: 'GBP',
    meta: { project: 'Completed works' }
  });

  return { company, owner: user };
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
    const { company, owner } = await createCompanyWithFixtures();

    const response = await request(app)
      .get('/api/panel/provider/dashboard')
      .query({ companyId: company.id })
      .set('Authorization', `Bearer ${createToken(owner.id)}`)
      .expect(200);

    expect(response.body.data.provider.tradingName).toContain('Metro');
    expect(response.body.data.metrics.activeBookings).toBeGreaterThanOrEqual(1);
    expect(response.body.data.pipeline.upcomingBookings[0].service).toBeDefined();
    expect(response.body.meta.companyId).toBe(company.id);
  });

  it('requires authentication for provider dashboards', async () => {
    const { company } = await createCompanyWithFixtures();

    const response = await request(app)
      .get('/api/panel/provider/dashboard')
      .query({ companyId: company.id })
      .expect(401);

    expect(response.body).toMatchObject({ message: 'Missing authorization header' });
  });

  it('rejects access for users without company permissions', async () => {
    await createCompanyWithFixtures();

    const user = await User.create({
      firstName: 'Jamie',
      lastName: 'Cole',
      email: `user-${Date.now()}@example.com`,
      passwordHash: 'hash',
      type: 'user'
    });

    const response = await request(app)
      .get('/api/panel/provider/dashboard')
      .set('Authorization', `Bearer ${createToken(user.id)}`)
      .expect(403);

    expect(response.body).toMatchObject({ message: 'Forbidden' });
  });

  it('prevents company owners from querying other organisations', async () => {
    const { owner } = await createCompanyWithFixtures();

    const outsiderOwner = await User.create({
      firstName: 'River',
      lastName: 'Lang',
      email: `outsider-${Date.now()}@example.com`,
      passwordHash: 'hash',
      type: 'company'
    });

    const outsiderCompany = await Company.create({
      userId: outsiderOwner.id,
      legalStructure: 'limited',
      contactName: 'Outsider Ops',
      contactEmail: 'ops@outsider.example',
      serviceRegions: 'North',
      marketplaceIntent: 'External',
      verified: false,
      insuredSellerStatus: 'pending_documents',
      complianceScore: 80
    });

    const response = await request(app)
      .get('/api/panel/provider/dashboard')
      .query({ companyId: outsiderCompany.id })
      .set('Authorization', `Bearer ${createToken(owner.id)}`)
      .expect(403);

    expect(response.body).toMatchObject({ message: 'forbidden' });
    expect(response.headers['www-authenticate']).toBeUndefined();
  });

  it('returns enterprise panel aggregates including spend and programmes', async () => {
    const { company } = await createCompanyWithFixtures();

    const response = await request(app)
      .get('/api/panel/enterprise/overview')
      .query({ companyId: company.id })
      .expect(200);

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

  it('returns a storefront management snapshot with listing intelligence for provider roles', async () => {
    const company = await createCompanyWithFixtures();

    const response = await request(app)
      .get('/api/panel/provider/storefront')
      .set('X-Fixnado-Role', 'company')
      .query({ companyId: company.id })
      .expect(200);

    expect(response.body.meta.companyId).toBe(company.id);
    expect(response.body.data.storefront.metrics.activeListings).toBeGreaterThan(0);
    expect(response.body.data.storefront.metrics.pendingReview).toBeGreaterThanOrEqual(0);
    expect(response.body.data.listings.length).toBeGreaterThan(0);
    expect(response.body.data.playbooks.length).toBeGreaterThan(0);
    expect(response.body.data.timeline[0].listingTitle).toBeDefined();
  });

  it('rejects storefront access without provider context', async () => {
    await createCompanyWithFixtures();

    const response = await request(app).get('/api/panel/provider/storefront').expect(401);

    expect(response.body).toMatchObject({ message: 'Storefront access restricted to providers' });
  });
});

