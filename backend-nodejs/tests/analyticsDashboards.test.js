import request from 'supertest';
import jwt from 'jsonwebtoken';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';

const { default: app } = await import('../src/app.js');
const {
  sequelize,
  AdCampaign,
  Booking,
  BookingAssignment,
  BookingBid,
  CampaignDailyMetric,
  CampaignFraudSignal,
  Company,
  ComplianceDocument,
  ConversationParticipant,
  Dispute,
  Escrow,
  InventoryAlert,
  InventoryItem,
  Order,
  Service,
  RentalAgreement,
  ServiceZone,
  User,
  Conversation
} = await import('../src/models/index.js');

function dateMinus(days, timezone = 'Europe/London') {
  return DateTime.now().setZone(timezone).minus({ days }).toJSDate();
}

const IDS = {
  companyUser: '11111111-1111-4111-8111-111111111111',
  customerOne: '22222222-2222-4222-8222-222222222222',
  customerTwo: '33333333-3333-4333-8333-333333333333',
  customerThree: '44444444-4444-4444-8444-444444444444',
  renter: '55555555-5555-4555-8555-555555555555',
  provider: '66666666-6666-4666-8666-666666666666',
  zoneCentral: '77777777-7777-4777-8777-777777777777',
  zoneNorth: '88888888-8888-4888-8888-888888888888',
  zoneSouth: '99999999-9999-4999-8999-999999999999',
  conversation: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
};

function createToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
}

async function createUser(id, overrides = {}) {
  return User.create({
    id,
    firstName: 'Test',
    lastName: 'User',
    email: `${id.replace(/-/g, '')}@example.com`,
    passwordHash: 'hashed',
    type: overrides.type ?? 'user',
    ...overrides
  });
}

async function seedCompany() {
  const user = await createUser(IDS.companyUser, {
    email: `ops-${Date.now()}@example.com`,
    type: 'company'
  });

  return Company.create({
    userId: user.id,
    legalStructure: 'limited',
    contactName: 'Alex Fix',
    contactEmail: 'ops@example.com',
    serviceRegions: 'london',
    marketplaceIntent: 'provider',
    verified: true,
    insuredSellerStatus: 'approved',
    complianceScore: 92.5
  });
}

async function seedAdminFixtures(company) {
  const now = DateTime.now().setZone('Europe/London');
  await Promise.all([
    createUser(IDS.customerOne, { email: 'customer1@example.com' }),
    createUser(IDS.customerTwo, { email: 'customer2@example.com' }),
    createUser(IDS.customerThree, { email: 'customer3@example.com' }),
    createUser(IDS.renter, { email: 'renter@example.com' }),
    createUser(IDS.provider, { email: 'provider@example.com', type: 'provider' })
  ]);

  await Promise.all([
    ServiceZone.create({
      id: IDS.zoneCentral,
      companyId: company.id,
      name: 'Central',
      boundary: { type: 'Polygon', coordinates: [] },
      centroid: { type: 'Point', coordinates: [0, 0] },
      boundingBox: { west: -0.1, south: 51.5, east: 0.1, north: 51.6 },
      metadata: {}
    }),
    ServiceZone.create({
      id: IDS.zoneNorth,
      companyId: company.id,
      name: 'North',
      boundary: { type: 'Polygon', coordinates: [] },
      centroid: { type: 'Point', coordinates: [0, 0] },
      boundingBox: { west: -0.1, south: 51.6, east: 0.1, north: 51.7 },
      metadata: {}
    }),
    ServiceZone.create({
      id: IDS.zoneSouth,
      companyId: company.id,
      name: 'South',
      boundary: { type: 'Polygon', coordinates: [] },
      centroid: { type: 'Point', coordinates: [0, 0] },
      boundingBox: { west: -0.1, south: 51.4, east: 0.1, north: 51.5 },
      metadata: {}
    })
  ]);
  const providerId = IDS.provider;

  const [generatorService, plumbingService, liftService] = await Promise.all([
    Service.create({
      providerId,
      companyId: company.id,
      title: 'Generator Maintenance',
      description: 'Quarterly generator servicing',
      category: 'Electrical',
      price: 540,
      currency: 'GBP'
    }),
    Service.create({
      providerId,
      companyId: company.id,
      title: 'Emergency Plumbing',
      description: 'Rapid leak repair',
      category: 'Plumbing',
      price: 360,
      currency: 'GBP'
    }),
    Service.create({
      providerId,
      companyId: company.id,
      title: 'Lift Inspection',
      description: 'Safety inspection and certification',
      category: 'Mechanical',
      price: 220,
      currency: 'GBP'
    })
  ]);

  const bookingOne = await Booking.create({
    customerId: IDS.customerOne,
    companyId: company.id,
    zoneId: IDS.zoneCentral,
    status: 'completed',
    type: 'scheduled',
    scheduledStart: now.minus({ days: 5 }).toJSDate(),
    scheduledEnd: now.minus({ days: 5 }).plus({ hours: 2 }).toJSDate(),
    slaExpiresAt: now.minus({ days: 5 }).plus({ hours: 4 }).toJSDate(),
    baseAmount: 420,
    currency: 'GBP',
    totalAmount: 540,
    commissionAmount: 60,
    taxAmount: 60,
    meta: {
      title: 'Generator maintenance',
      requester: 'Facilities Ops',
      primaryCrew: 'Team Volt',
      zoneName: 'Central',
      travelMinutes: 25,
      serviceId: generatorService.id,
      source: 'fixnado_ads',
      autoMatched: true
    },
    lastStatusTransitionAt: now.minus({ days: 5 }).toJSDate()
  });

  const bookingTwo = await Booking.create({
    customerId: IDS.customerTwo,
    companyId: company.id,
    zoneId: IDS.zoneNorth,
    status: 'scheduled',
    type: 'on_demand',
    scheduledStart: now.plus({ days: 2 }).toJSDate(),
    scheduledEnd: now.plus({ days: 2, hours: 2 }).toJSDate(),
    slaExpiresAt: now.plus({ days: 2, hours: 4 }).toJSDate(),
    baseAmount: 220,
    currency: 'GBP',
    totalAmount: 360,
    commissionAmount: 48,
    taxAmount: 72,
    meta: {
      title: 'Emergency plumbing',
      requester: 'HR',
      owner: 'Ops Escalation',
      travelMinutes: 35,
      serviceId: plumbingService.id,
      source: 'marketplace',
      autoMatched: false
    },
    lastStatusTransitionAt: now.toJSDate()
  });

  const bookingThree = await Booking.create({
    customerId: IDS.customerThree,
    companyId: company.id,
    zoneId: IDS.zoneSouth,
    status: 'disputed',
    type: 'scheduled',
    scheduledStart: now.minus({ days: 1 }).toJSDate(),
    scheduledEnd: now.minus({ days: 1 }).plus({ hours: 1 }).toJSDate(),
    slaExpiresAt: now.minus({ hours: 6 }).toJSDate(),
    baseAmount: 120,
    currency: 'GBP',
    totalAmount: 220,
    commissionAmount: 22,
    taxAmount: 44,
    meta: {
      title: 'Lift repair',
      owner: 'Support Escalations',
      primaryCrew: 'Lift Masters',
      travelMinutes: 18,
      serviceId: liftService.id,
      source: 'partner_referral',
      autoMatched: true
    },
    lastStatusTransitionAt: now.minus({ hours: 1 }).toJSDate()
  });

  await BookingAssignment.create({
    bookingId: bookingOne.id,
    providerId,
    role: 'lead',
    status: 'accepted',
    assignedAt: dateMinus(5)
  });
  await BookingAssignment.create({
    bookingId: bookingTwo.id,
    providerId,
    role: 'support',
    status: 'pending',
    assignedAt: dateMinus(1)
  });
  await BookingAssignment.create({
    bookingId: bookingThree.id,
    providerId,
    role: 'support',
    status: 'accepted',
    assignedAt: dateMinus(2)
  });

  await BookingBid.create({
    bookingId: bookingOne.id,
    providerId,
    amount: 540,
    currency: 'GBP',
    status: 'accepted',
    revisionHistory: [],
    auditLog: [],
    submittedAt: dateMinus(6),
    updatedAt: dateMinus(5)
  });

  await BookingBid.create({
    bookingId: bookingTwo.id,
    providerId,
    amount: 360,
    currency: 'GBP',
    status: 'pending',
    revisionHistory: [{ amount: 360, at: dateMinus(2) }],
    auditLog: [{ action: 'counter_offer', at: dateMinus(1) }],
    submittedAt: dateMinus(3),
    updatedAt: dateMinus(1)
  });

  await BookingBid.create({
    bookingId: bookingThree.id,
    providerId,
    amount: 220,
    currency: 'GBP',
    status: 'declined',
    revisionHistory: [],
    auditLog: [{ action: 'declined', at: dateMinus(1) }],
    submittedAt: dateMinus(4),
    updatedAt: dateMinus(1)
  });

  const inventoryItem = await InventoryItem.create({
    companyId: company.id,
    name: 'Industrial fan',
    sku: 'FAN-100',
    category: 'HVAC',
    quantityOnHand: 4,
    quantityReserved: 2,
    safetyStock: 1,
    metadata: { manufacturer: 'Flux Air' }
  });

  await InventoryAlert.create({
    itemId: inventoryItem.id,
    type: 'low_stock',
    severity: 'critical',
    status: 'active',
    metadata: { note: 'Only two units available.' },
    triggeredAt: dateMinus(2)
  });

  await RentalAgreement.create({
    rentalNumber: 'RA-001',
    itemId: inventoryItem.id,
    companyId: company.id,
    renterId: IDS.renter,
    status: 'inspection_pending',
    depositStatus: 'held',
    quantity: 1,
    pickupAt: dateMinus(3),
    returnDueAt: dateMinus(1),
    meta: {}
  });

  await ComplianceDocument.create({
    companyId: company.id,
    type: 'Insurance Certificate',
    status: 'approved',
    storageKey: 's3://bucket/doc.pdf',
    fileName: 'insurance.pdf',
    fileSizeBytes: 1024,
    mimeType: 'application/pdf',
    submittedAt: dateMinus(30),
    reviewedAt: dateMinus(25),
    expiryAt: DateTime.now().plus({ days: 15 }).toJSDate(),
    metadata: {}
  });

  await ComplianceDocument.create({
    companyId: company.id,
    type: 'Safety Policy',
    status: 'expired',
    storageKey: 's3://bucket/safety.pdf',
    fileName: 'safety.pdf',
    fileSizeBytes: 2048,
    mimeType: 'application/pdf',
    submittedAt: dateMinus(180),
    reviewedAt: dateMinus(170),
    expiryAt: dateMinus(5),
    metadata: {}
  });

  const campaign = await AdCampaign.create({
    companyId: company.id,
    name: 'Winter Safety',
    objective: 'lead_generation',
    campaignType: 'ppc_conversion',
    status: 'active',
    pacingStrategy: 'even',
    bidStrategy: 'cpc',
    currency: 'GBP',
    totalBudget: 10000,
    dailySpendCap: 800,
    startAt: dateMinus(10),
    endAt: DateTime.now().plus({ days: 20 }).toJSDate(),
    timezone: 'Europe/London',
    metadata: { channel: 'Search' }
  });

  await CampaignDailyMetric.create({
    campaignId: campaign.id,
    metricDate: dateMinus(2),
    impressions: 1500,
    clicks: 120,
    conversions: 16,
    spend: 420,
    revenue: 920,
    spendTarget: 400,
    ctr: 0.08,
    cvr: 0.13,
    metadata: {}
  });

  await CampaignFraudSignal.create({
    campaignId: campaign.id,
    signalType: 'overspend',
    severity: 'warning',
    detectedAt: dateMinus(1),
    metadata: { threshold: 0.2 }
  });

  return { bookingTwo, providerId };
}

async function seedUserFixtures(company) {
  const now = DateTime.now().setZone('Europe/London');

  const [serviceOne, serviceTwo] = await Promise.all([
    Service.create({
      companyId: company.id,
      providerId: company.userId,
      title: 'Critical facilities response',
      description: 'Emergency diagnostics with rapid mobilisation.',
      category: 'Electrical',
      price: 540,
      currency: 'GBP'
    }),
    Service.create({
      companyId: company.id,
      providerId: company.userId,
      title: 'Preventative HVAC care',
      description: 'Seasonal maintenance programme across zones.',
      category: 'HVAC',
      price: 380,
      currency: 'GBP'
    })
  ]);

  const draftOrder = await Order.create({
    buyerId: IDS.customerOne,
    serviceId: serviceTwo.id,
    status: 'draft',
    totalAmount: 320,
    currency: 'GBP',
    scheduledFor: now.plus({ days: 10 }).toJSDate(),
    createdAt: now.minus({ days: 6 }).toJSDate(),
    updatedAt: now.minus({ days: 6 }).toJSDate()
  });

  const fundedOrder = await Order.create({
    buyerId: IDS.customerOne,
    serviceId: serviceOne.id,
    status: 'funded',
    totalAmount: 540,
    currency: 'GBP',
    scheduledFor: now.plus({ days: 2 }).toJSDate(),
    createdAt: now.minus({ days: 3 }).toJSDate(),
    updatedAt: now.minus({ days: 3 }).toJSDate()
  });
  await Escrow.create({
    orderId: fundedOrder.id,
    status: 'funded',
    fundedAt: now.minus({ days: 2 }).toJSDate(),
    createdAt: now.minus({ days: 3 }).toJSDate(),
    updatedAt: now.minus({ days: 2 }).toJSDate()
  });

  const inProgressOrder = await Order.create({
    buyerId: IDS.customerOne,
    serviceId: serviceOne.id,
    status: 'in_progress',
    totalAmount: 620,
    currency: 'GBP',
    scheduledFor: now.plus({ hours: 6 }).toJSDate(),
    createdAt: now.minus({ days: 1 }).toJSDate(),
    updatedAt: now.minus({ hours: 1 }).toJSDate()
  });
  await Escrow.create({
    orderId: inProgressOrder.id,
    status: 'funded',
    fundedAt: now.minus({ days: 1 }).toJSDate()
  });

  const disputedOrder = await Order.create({
    buyerId: IDS.customerOne,
    serviceId: serviceTwo.id,
    status: 'disputed',
    totalAmount: 410,
    currency: 'GBP',
    scheduledFor: now.minus({ days: 1 }).toJSDate(),
    createdAt: now.minus({ days: 8 }).toJSDate(),
    updatedAt: now.minus({ hours: 5 }).toJSDate()
  });
  const disputedEscrow = await Escrow.create({
    orderId: disputedOrder.id,
    status: 'disputed',
    fundedAt: now.minus({ days: 7 }).toJSDate(),
    createdAt: now.minus({ days: 8 }).toJSDate(),
    updatedAt: now.minus({ hours: 5 }).toJSDate()
  });
  await Dispute.create({
    escrowId: disputedEscrow.id,
    openedBy: IDS.customerOne,
    reason: 'Crew departed without closing open checklist items.',
    status: 'open',
    createdAt: now.minus({ hours: 4 }).toJSDate(),
    updatedAt: now.minus({ hours: 4 }).toJSDate()
  });

  const inventory = await InventoryItem.create({
    companyId: company.id,
    name: 'Thermal imaging kit',
    sku: 'THERM-200',
    category: 'Diagnostics',
    quantityOnHand: 5,
    quantityReserved: 1,
    safetyStock: 1,
    metadata: {}
  });

  await RentalAgreement.create({
    rentalNumber: 'RA-USER-001',
    itemId: inventory.id,
    companyId: company.id,
    renterId: IDS.customerOne,
    status: 'in_use',
    depositStatus: 'held',
    quantity: 1,
    pickupAt: now.minus({ days: 2 }).toJSDate(),
    returnDueAt: now.plus({ days: 2 }).toJSDate(),
    meta: {},
    createdAt: now.minus({ days: 2 }).toJSDate(),
    updatedAt: now.minus({ days: 1 }).toJSDate()
  });

  const conversation = await Conversation.create({
    subject: 'Support escalation',
    createdById: IDS.customerOne,
    createdByType: 'user',
    defaultTimezone: 'Europe/London',
    metadata: {},
    createdAt: now.minus({ days: 1 }).toJSDate(),
    updatedAt: now.minus({ days: 1 }).toJSDate()
  });

  await ConversationParticipant.create({
    conversationId: conversation.id,
    participantType: 'user',
    participantReferenceId: IDS.customerOne,
    displayName: 'Jordan Miles',
    role: 'customer',
    timezone: 'Europe/London',
    createdAt: now.minus({ hours: 12 }).toJSDate()
  });

  return {
    userId: IDS.customerOne,
    orders: [draftOrder, fundedOrder, inProgressOrder, disputedOrder]
  };
}

async function seedEnterpriseFixtures(company) {
  await Conversation.create({
    id: IDS.conversation,
    subject: 'Enterprise Ops',
    createdById: company.userId,
    createdByType: 'company',
    defaultTimezone: 'Europe/London',
    metadata: {}
  });

  await ConversationParticipant.create({
    conversationId: IDS.conversation,
    participantType: 'enterprise',
    participantReferenceId: company.id,
    displayName: 'Enterprise Ops',
    role: 'operations',
    timezone: 'Europe/London',
    createdAt: dateMinus(3)
  });
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

describe('Persona analytics dashboards', () => {
  it('returns an admin dashboard with metrics, navigation, and export reference', async () => {
    const company = await seedCompany();
    await seedAdminFixtures(company);

    const response = await request(app)
      .get(`/api/analytics/dashboards/admin`)
      .set('X-Fixnado-Persona', 'admin')
      .set('Authorization', `Bearer ${createToken(IDS.companyUser)}`)
      .query({ companyId: company.id, timezone: 'Europe/London' })
      .expect(200);

    expect(response.body.persona).toBe('admin');
    expect(response.body.navigation).toBeInstanceOf(Array);
    expect(response.body.navigation[0].analytics.metrics[0].label).toBe('Jobs Received');
    expect(response.body.navigation[2].data.rows.length).toBeGreaterThan(0);
    expect(response.body.exports.csv.href).toContain('/api/analytics/dashboards/admin/export');
  });

  it('supports provider persona with acceptance and rental metrics', async () => {
    const company = await seedCompany();
    const { providerId } = await seedAdminFixtures(company);

    const response = await request(app)
      .get('/api/analytics/dashboards/provider')
      .set('X-Fixnado-Persona', 'provider')
      .set('Authorization', `Bearer ${createToken(IDS.companyUser)}`)
      .query({ companyId: company.id, providerId, timezone: 'Europe/London' })
      .expect(200);

    expect(response.body.persona).toBe('provider');
    expect(response.body.navigation[0].analytics.metrics[0].label).toBe('Assignments Received');
    expect(response.body.navigation[2].data.rows[0][0]).toBe('RA-001');
    const inventorySection = response.body.navigation.find((section) => section.id === 'inventory');
    expect(inventorySection).toBeTruthy();
    expect(inventorySection.data.summary[0].label).toBe('Available units');
    expect(inventorySection.data.groups[0].items.length).toBeGreaterThan(0);
  });

  it('delivers a user command center with orders, rentals, and support signals', async () => {
    const company = await seedCompany();
    await seedAdminFixtures(company);
    const { userId } = await seedUserFixtures(company);

    const response = await request(app)
      .get('/api/analytics/dashboards/user')
      .set('X-Fixnado-Persona', 'user')
      .set('Authorization', `Bearer ${createToken(userId)}`)
      .query({ userId, timezone: 'Europe/London' })
      .expect(200);

    expect(response.body.persona).toBe('user');
    expect(response.body.navigation[0].analytics.metrics).toHaveLength(4);
    const calendarSection = response.body.navigation.find((section) => section.id === 'calendar');
    expect(calendarSection).toBeTruthy();
    expect(calendarSection.data.weeks.length).toBeGreaterThan(0);
    expect(calendarSection.data.summary[0].value).toBeGreaterThanOrEqual(0);
    const ordersSection = response.body.navigation.find((section) => section.id === 'orders');
    expect(ordersSection.data.columns).toHaveLength(4);
    const rentalsSection = response.body.navigation.find((section) => section.id === 'rentals');
    expect(rentalsSection.data.rows.length).toBeGreaterThan(0);
    const accountSection = response.body.navigation.find((section) => section.id === 'account');
    expect(accountSection.data.items.length).toBeGreaterThan(0);
    expect(response.body.navigation[0].sidebar.badge).toContain('jobs');
    const settingsSection = response.body.navigation.find((section) => section.id === 'settings');
    expect(settingsSection.data.panels.length).toBeGreaterThan(0);
  });

  it('streams governed CSV exports for persona dashboards', async () => {
    const company = await seedCompany();
    await seedAdminFixtures(company);

    const exportResponse = await request(app)
      .get(`/api/analytics/dashboards/admin/export`)
      .set('X-Fixnado-Persona', 'admin')
      .set('Authorization', `Bearer ${createToken(IDS.companyUser)}`)
      .query({ companyId: company.id, timezone: 'Europe/London' })
      .expect(200);

    expect(exportResponse.headers['content-type']).toContain('text/csv');
    expect(exportResponse.text).toContain('Persona,admin');
    expect(exportResponse.text).toContain('Executive Overview');
  });

  it('returns enterprise analytics with compliance snapshot', async () => {
    const company = await seedCompany();
    await seedAdminFixtures(company);
    await seedEnterpriseFixtures(company);

    const response = await request(app)
      .get('/api/analytics/dashboards/enterprise')
      .set('X-Fixnado-Persona', 'enterprise')
      .set('Authorization', `Bearer ${createToken(IDS.companyUser)}`)
      .query({ companyId: company.id, timezone: 'Europe/London' })
      .expect(200);

    expect(response.body.persona).toBe('enterprise');
    expect(response.body.navigation[1].data.headers[0]).toBe('Document');
  });

  it('rejects persona access when actor lacks role alignment', async () => {
    const company = await seedCompany();
    await seedAdminFixtures(company);
    const { userId } = await seedUserFixtures(company);
    const serviceman = await createUser('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', {
      email: 'crew@example.com',
      type: 'servicemen'
    });

    const response = await request(app)
      .get('/api/analytics/dashboards/user')
      .set('Authorization', `Bearer ${createToken(serviceman.id)}`)
      .query({ userId, timezone: 'Europe/London' })
      .expect(403);

    expect(response.body).toMatchObject({ message: 'persona_forbidden' });
  });

  it('rejects unsupported personas', async () => {
    await createUser(IDS.companyUser, { type: 'company' });
    const token = createToken(IDS.companyUser);
    const response = await request(app)
      .get('/api/analytics/dashboards/unknown')
      .set('Authorization', `Bearer ${token}`)
      .expect(404);
    expect(response.body.message).toBe('persona_not_supported');
  });
});
