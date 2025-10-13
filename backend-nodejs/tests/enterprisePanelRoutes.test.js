import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { DateTime } from 'luxon';

const { default: app } = await import('../src/app.js');
const {
  sequelize,
  User,
  Company,
  ServiceZone,
  Booking,
  AdCampaign,
  CampaignFlight,
  CampaignDailyMetric,
  CampaignInvoice,
  Conversation,
  ConversationParticipant
} = await import('../src/models/index.js');

const IDS = {
  companyUser: '11111111-1111-4111-8111-111111111111',
  company: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  customerOne: '22222222-2222-4222-8222-222222222222',
  customerTwo: '33333333-3333-4333-8333-333333333333',
  zoneOne: '44444444-4444-4444-8444-444444444444',
  zoneTwo: '55555555-5555-4555-8555-555555555555',
  campaign: '66666666-6666-4666-8666-666666666666',
  flight: '77777777-7777-4777-8777-777777777777',
  conversation: '99999999-9999-4999-8999-999999999999'
};

const TZ = 'Europe/London';

async function seedEnterpriseScenario() {
  const now = DateTime.now().setZone(TZ);

  const [companyUser] = await Promise.all([
    User.create({
      id: IDS.companyUser,
      firstName: 'Alex',
      lastName: 'Fix',
      email: 'enterprise-ops@example.com',
      passwordHash: 'hashed',
      type: 'company'
    }),
    User.create({
      id: IDS.customerOne,
      firstName: 'Nia',
      lastName: 'Morgan',
      email: 'nia@example.com',
      passwordHash: 'hashed',
      type: 'user'
    }),
    User.create({
      id: IDS.customerTwo,
      firstName: 'Jordan',
      lastName: 'Reid',
      email: 'jordan@example.com',
      passwordHash: 'hashed',
      type: 'user'
    })
  ]);

  const company = await Company.create({
    id: IDS.company,
    userId: companyUser.id,
    legalStructure: 'limited',
    contactName: 'Albion Workspace Group',
    contactEmail: 'ops@albion.example',
    serviceRegions: 'london,manchester',
    marketplaceIntent: 'corporate real estate',
    verified: true,
    insuredSellerStatus: 'approved',
    complianceScore: 94.2
  });

  await Promise.all([
    ServiceZone.create({
      id: IDS.zoneOne,
      companyId: company.id,
      name: 'City Campus',
      boundary: { type: 'Polygon', coordinates: [] },
      centroid: { type: 'Point', coordinates: [0, 0] },
      boundingBox: { west: -0.1, south: 51.5, east: 0.1, north: 51.6 },
      metadata: { tier: 'flagship' }
    }),
    ServiceZone.create({
      id: IDS.zoneTwo,
      companyId: company.id,
      name: 'Riverfront',
      boundary: { type: 'Polygon', coordinates: [] },
      centroid: { type: 'Point', coordinates: [0, 0] },
      boundingBox: { west: -0.1, south: 51.4, east: 0.1, north: 51.5 },
      metadata: { tier: 'satellite' }
    })
  ]);

  const completedBooking = await Booking.create({
    customerId: IDS.customerOne,
    companyId: company.id,
    zoneId: IDS.zoneOne,
    status: 'completed',
    type: 'scheduled',
    scheduledStart: now.minus({ days: 6 }).toJSDate(),
    scheduledEnd: now.minus({ days: 6 }).plus({ hours: 3 }).toJSDate(),
    slaExpiresAt: now.minus({ days: 6 }).plus({ hours: 5 }).toJSDate(),
    baseAmount: 540,
    currency: 'GBP',
    totalAmount: 720,
    commissionAmount: 80,
    taxAmount: 100,
    meta: {
      title: 'Generator maintenance',
      requester: 'Facilities',
      travelMinutes: 30,
      nps: 54
    },
    lastStatusTransitionAt: now.minus({ days: 6 }).plus({ hours: 4 }).toJSDate()
  });

  const disputedBooking = await Booking.create({
    customerId: IDS.customerTwo,
    companyId: company.id,
    zoneId: IDS.zoneTwo,
    status: 'disputed',
    type: 'on_demand',
    scheduledStart: now.minus({ days: 1 }).toJSDate(),
    scheduledEnd: now.minus({ days: 1 }).plus({ hours: 1 }).toJSDate(),
    slaExpiresAt: now.minus({ days: 1 }).plus({ hours: 3 }).toJSDate(),
    baseAmount: 260,
    currency: 'GBP',
    totalAmount: 380,
    commissionAmount: 42,
    taxAmount: 60,
    meta: {
      title: 'Emergency plumbing response',
      owner: 'Escalations Desk',
      severity: 'high',
      escalated: true
    },
    lastStatusTransitionAt: now.minus({ hours: 18 }).toJSDate()
  });

  const campaign = await AdCampaign.create({
    id: IDS.campaign,
    companyId: company.id,
    name: 'Enterprise retention push',
    objective: 'retention',
    campaignType: 'ppc_conversion',
    status: 'active',
    pacingStrategy: 'even',
    bidStrategy: 'cpc',
    currency: 'GBP',
    totalBudget: 48000,
    dailySpendCap: 1800,
    startAt: now.minus({ days: 30 }).toJSDate(),
    endAt: now.plus({ days: 30 }).toJSDate(),
    timezone: TZ,
    metadata: { channel: 'Search' }
  });

  await CampaignFlight.create({
    id: IDS.flight,
    campaignId: campaign.id,
    name: 'Q2 activation',
    status: 'active',
    startAt: now.minus({ days: 15 }).toJSDate(),
    endAt: now.plus({ days: 15 }).toJSDate(),
    budget: 18000,
    dailySpendCap: 950
  });

  await Promise.all([
    CampaignDailyMetric.create({
      campaignId: campaign.id,
      flightId: IDS.flight,
      metricDate: now.minus({ days: 3 }).toJSDate(),
      impressions: 1200,
      clicks: 140,
      conversions: 18,
      spend: 620,
      revenue: 1400,
      spendTarget: 600,
      ctr: 0.116,
      cvr: 0.128,
      metadata: {}
    }),
    CampaignDailyMetric.create({
      campaignId: campaign.id,
      flightId: IDS.flight,
      metricDate: now.minus({ days: 2 }).toJSDate(),
      impressions: 980,
      clicks: 120,
      conversions: 16,
      spend: 580,
      revenue: 1200,
      spendTarget: 600,
      ctr: 0.122,
      cvr: 0.133,
      metadata: {}
    })
  ]);

  await CampaignInvoice.bulkCreate([
    {
      campaignId: campaign.id,
      invoiceNumber: 'INV-1001',
      currency: 'GBP',
      amountDue: 2200,
      amountPaid: 0,
      periodStart: now.minus({ days: 14 }).toJSDate(),
      periodEnd: now.minus({ days: 7 }).toJSDate(),
      dueDate: now.plus({ days: 5 }).toJSDate(),
      status: 'issued',
      metadata: { vendor: 'Metro Power Services' }
    },
    {
      campaignId: campaign.id,
      invoiceNumber: 'INV-1000',
      currency: 'GBP',
      amountDue: 2000,
      amountPaid: 2000,
      periodStart: now.minus({ days: 30 }).toJSDate(),
      periodEnd: now.minus({ days: 23 }).toJSDate(),
      dueDate: now.minus({ days: 2 }).toJSDate(),
      status: 'paid',
      metadata: { vendor: 'Metro Power Services' }
    }
  ]);

  const conversation = await Conversation.create({
    id: IDS.conversation,
    subject: 'Enterprise ops desk',
    createdById: companyUser.id,
    createdByType: 'company',
    defaultTimezone: TZ,
    metadata: {}
  });

  await ConversationParticipant.create({
    conversationId: conversation.id,
    participantType: 'enterprise',
    participantReferenceId: company.id,
    displayName: 'Sophia Lang',
    role: 'account_manager',
    timezone: TZ
  });

  return { company, completedBooking, disputedBooking };
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

describe('Enterprise panel overview', () => {
  it('returns enterprise delivery, spend and programme insights', async () => {
    const { company } = await seedEnterpriseScenario();

    const response = await request(app)
      .get('/api/panel/enterprise/overview')
      .query({ companyId: company.id, timezone: TZ })
      .expect(200);

    expect(response.body.enterprise.id).toBe(company.id);
    expect(response.body.enterprise.activeSites).toBe(2);
    expect(response.body.enterprise.serviceMix.length).toBeGreaterThan(0);
    expect(response.body.delivery.incidents).toBe(1);
    expect(response.body.delivery.slaCompliance).toBeGreaterThan(0);
    expect(response.body.spend.invoicesAwaitingApproval).toHaveLength(1);
    expect(response.body.programmes.length).toBeGreaterThan(0);
    expect(response.body.escalations).toHaveLength(1);
    expect(response.body.window.timezone).toBe(TZ);
  });

  it('returns a rich fallback payload when the company cannot be resolved', async () => {
    const response = await request(app)
      .get('/api/panel/enterprise/overview')
      .query({ companyId: '00000000-0000-4000-8000-000000000000', timezone: TZ })
      .expect(200);

    expect(response.body.meta).toEqual({ fallback: true, reason: 'enterprise_company_not_found' });
    expect(response.body.enterprise.name).toBe('Albion Workspace Group');
    expect(response.body.programmes).toHaveLength(2);
    expect(response.body.escalations).toHaveLength(1);
    expect(response.body.spend.invoicesAwaitingApproval).toHaveLength(2);
  });
});
