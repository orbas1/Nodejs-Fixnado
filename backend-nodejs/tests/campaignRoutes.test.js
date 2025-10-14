import request from 'supertest';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';

const { default: app } = await import('../src/app.js');
const {
  sequelize,
  User,
  Company,
  CampaignAnalyticsExport,
  CampaignFraudSignal,
  AnalyticsEvent
} = await import('../src/models/index.js');

async function createAdvertiser() {
  const owner = await User.create({
    firstName: 'Marketing',
    lastName: 'Lead',
    email: `marketing-${Date.now()}@example.com`,
    passwordHash: 'hashed',
    type: 'provider_admin'
  });

  const company = await Company.create({
    userId: owner.id,
    legalStructure: 'Ltd',
    contactName: 'Marketing Lead',
    contactEmail: owner.email,
    serviceRegions: 'London',
    marketplaceIntent: 'ads'
  });

  return company;
}

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  try {
    await sequelize.close();
  } catch {
    // ignore double close when watcher restarts tests
  }
});

beforeEach(async () => {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
});

describe('Campaign telemetry + fraud monitoring', () => {
  it('maps campaign metrics to analytics exports and surfaces fraud signals', async () => {
    const company = await createAdvertiser();
    const start = new Date();
    const end = new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);

    const campaignResponse = await request(app)
      .post('/api/campaigns')
      .send({
        companyId: company.id,
        name: 'Finova launch blitz',
        objective: 'drive_conversions',
        campaignType: 'ppc_conversion',
        status: 'active',
        pacingStrategy: 'even',
        bidStrategy: 'cpc',
        currency: 'GBP',
        totalBudget: 7000,
        dailySpendCap: 900,
        startAt: start.toISOString(),
        endAt: end.toISOString(),
        metadata: { vertical: 'home_services' }
      })
      .expect(201);

    const campaignId = campaignResponse.body.id;

    const flightResponse = await request(app)
      .post(`/api/campaigns/${campaignId}/flights`)
      .send({
        name: 'Opening week spotlight',
        startAt: start.toISOString(),
        endAt: new Date(start.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        budget: 2100,
        dailySpendCap: 500,
        status: 'active'
      })
      .expect(201);

    const flightId = flightResponse.body.id;

    await request(app)
      .put(`/api/campaigns/${campaignId}/targeting`)
      .send({
        rules: [
          { ruleType: 'zone', payload: { zoneIds: ['zone-london-central'] } },
          { ruleType: 'insured_only', payload: { required: true } },
          { ruleType: 'category', payload: { categories: ['plumbing'] } }
        ]
      })
      .expect(200);

    const metricDate = new Date().toISOString();

    await request(app)
      .post(`/api/campaigns/${campaignId}/metrics`)
      .send({
        flightId,
        metricDate,
        impressions: 1200,
        clicks: 480,
        conversions: 210,
        spend: 650,
        revenue: 1400,
        metadata: { source: 'ad_server_ingest' }
      })
      .expect(201);

    const exports = await CampaignAnalyticsExport.findAll();
    expect(exports).toHaveLength(1);
    expect(exports[0].status).toBe('pending');
    expect(exports[0].payload.campaignId).toBe(campaignId);
    expect(exports[0].payload.metricDate).toContain(metricDate.slice(0, 10));

    const fraudResponse = await request(app)
      .get(`/api/campaigns/${campaignId}/fraud-signals`)
      .expect(200);

    expect(fraudResponse.body.length).toBeGreaterThan(0);

    const openSignals = await CampaignFraudSignal.findAll({ where: { campaignId } });
    expect(openSignals.length).toBeGreaterThan(0);

    const resolveResponse = await request(app)
      .post(`/api/campaigns/fraud-signals/${fraudResponse.body[0].id}/resolve`)
      .send({ note: 'Finance reviewed overspend variance' })
      .expect(200);

    expect(resolveResponse.body.resolvedAt).toBeTruthy();

    const summaryResponse = await request(app)
      .get(`/api/campaigns/${campaignId}/summary`)
      .expect(200);

    expect(summaryResponse.body.totals.impressions).toBe(1200);
    expect(Number(summaryResponse.body.totals.ctr)).toBeGreaterThan(0.35);
    expect(summaryResponse.body.openFraudSignals).toBeGreaterThanOrEqual(0);

    const events = await AnalyticsEvent.findAll({ where: { domain: 'ads' } });
    const metricsEvent = events.find((event) => event.eventName === 'ads.campaign.metrics_recorded');
    expect(metricsEvent).toBeTruthy();
    expect(metricsEvent.metadata.campaignId).toBe(campaignId);
    const fraudEvents = events.filter((event) => event.eventName === 'ads.campaign.fraud_signal');
    expect(fraudEvents.length).toBeGreaterThan(0);
  });
});
