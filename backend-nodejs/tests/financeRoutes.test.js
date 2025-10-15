import request from 'supertest';
import { beforeAll, afterAll, beforeEach, describe, expect, it } from 'vitest';

process.env.FINANCE_WEBHOOK_TOKEN = 'test-secret';

const { default: app } = await import('../src/app.js');
const {
  sequelize,
  User,
  Company,
  Service,
  Order,
  Region,
  Payment,
  Escrow,
  FinanceInvoice,
  PayoutRequest,
  Dispute,
  ServiceZone
} = await import('../src/models/index.js');
const { processFinanceWebhookQueue } = await import('../src/services/paymentOrchestrationService.js');

beforeAll(async () => {
  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

beforeEach(async () => {
  await sequelize.truncate({ cascade: true, restartIdentity: true });
});

describe('Finance orchestration API', () => {
  it('creates checkout sessions, processes webhooks, and exposes finance metrics', async () => {
    const region = await Region.create({ code: 'GB', name: 'Great Britain' });

    const buyer = await User.create({
      firstName: 'Buyer',
      lastName: 'Example',
      email: 'buyer@example.com',
      passwordHash: 'hashed',
      type: 'user',
      regionId: region.id
    }, { validate: false });

    const providerAdmin = await User.create({
      firstName: 'Provider',
      lastName: 'Admin',
      email: 'provider@example.com',
      passwordHash: 'hashed',
      type: 'provider_admin',
      regionId: region.id
    }, { validate: false });

    const company = await Company.create({
      userId: providerAdmin.id,
      legalStructure: 'Ltd',
      contactName: 'Provider Admin',
      contactEmail: providerAdmin.email,
      serviceRegions: 'GB',
      marketplaceIntent: 'growth',
      verified: true,
      regionId: region.id
    });

    const zone = await ServiceZone.create({
      companyId: company.id,
      name: 'Central London',
      boundary: { type: 'Polygon', coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] },
      centroid: { type: 'Point', coordinates: [0.5, 0.5] },
      boundingBox: { type: 'Polygon', coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]] },
      metadata: { regionId: region.id },
      demandLevel: 'medium'
    });

    const service = await Service.create({
      companyId: company.id,
      providerId: providerAdmin.id,
      title: 'Heavy lift inspection',
      description: 'Qualified crane inspection',
      category: 'inspection',
      price: 450,
      currency: 'GBP'
    });

    const order = await Order.create({
      buyerId: buyer.id,
      serviceId: service.id,
      status: 'draft',
      totalAmount: 450,
      currency: 'GBP',
      regionId: region.id
    });

    const checkoutResponse = await request(app)
      .post('/api/finance/checkout')
      .set('x-fixnado-role', 'admin')
      .set('x-test-user-id', providerAdmin.id)
      .send({
        orderId: order.id,
        buyerId: buyer.id,
        serviceId: service.id,
        amount: 450,
        currency: 'GBP',
        source: 'vitest',
        metadata: { bookingType: 'scheduled', demand: 'high', zoneId: zone.id }
      })
      .expect(201);

    expect(checkoutResponse.body).toMatchObject({
      orderId: order.id,
      status: 'pending',
      currency: 'GBP'
    });

    const payment = await Payment.findOne({ where: { orderId: order.id } });
    expect(payment).not.toBeNull();
    expect(payment.status).toBe('pending');

    const escrow = await Escrow.findOne({ where: { orderId: order.id } });
    expect(escrow).not.toBeNull();

    const invoice = await FinanceInvoice.findOne({ where: { orderId: order.id } });
    expect(invoice).not.toBeNull();
    expect(invoice.status).toBe('draft');

    const webhookPayload = {
      id: 'evt_test',
      data: {
        object: {
          id: 'pi_test',
          metadata: { orderId: order.id }
        }
      }
    };

    await request(app)
      .post('/api/finance/webhooks/stripe')
      .set('x-finance-webhook-token', 'test-secret')
      .send({
        eventType: 'payment_intent.succeeded',
        payload: webhookPayload
      })
      .expect(202);

    await processFinanceWebhookQueue({ limit: 5, logger: { error: () => {} } });

    await payment.reload();
    expect(payment.status).toBe('captured');
    expect(payment.capturedAt).not.toBeNull();

    await escrow.reload();
    expect(escrow.status).toBe('funded');

    const payoutRequests = await PayoutRequest.findAll({ where: { paymentId: payment.id } });
    expect(payoutRequests).toHaveLength(1);
    expect(payoutRequests[0].status).toBe('pending');

    await payoutRequests[0].update({
      scheduledFor: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    });

    await Dispute.create({
      escrowId: escrow.id,
      openedBy: buyer.id,
      reason: 'Service quality concern',
      status: 'open',
      regionId: region.id
    });

    const overdueOrder = await Order.create({
      buyerId: buyer.id,
      serviceId: service.id,
      status: 'completed',
      totalAmount: 900,
      currency: 'GBP',
      regionId: region.id
    });

    const overdueInvoice = await FinanceInvoice.create({
      orderId: overdueOrder.id,
      invoiceNumber: `INV-${Date.now()}`,
      amountDue: 900,
      amountPaid: 0,
      currency: 'GBP',
      status: 'issued',
      issuedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      dueAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      metadata: {},
      regionId: region.id
    });

    const overviewResponse = await request(app)
      .get('/api/finance/overview')
      .set('x-fixnado-role', 'admin')
      .set('x-test-user-id', providerAdmin.id)
      .expect(200);

    expect(overviewResponse.body.totals.captured).toBeGreaterThan(0);
    expect(Array.isArray(overviewResponse.body.payments)).toBe(true);

    const timelineResponse = await request(app)
      .get(`/api/finance/orders/${order.id}/timeline`)
      .set('x-fixnado-role', 'admin')
      .set('x-test-user-id', providerAdmin.id)
      .expect(200);

    expect(timelineResponse.body.order.id).toBe(order.id);
    expect(Array.isArray(timelineResponse.body.history)).toBe(true);
    expect(timelineResponse.body.payments.some((entry) => entry.status === 'captured')).toBe(true);

    const reportResponse = await request(app)
      .get('/api/finance/reports/daily')
      .set('x-fixnado-role', 'admin')
      .set('x-test-user-id', providerAdmin.id)
      .expect(200);

    expect(Array.isArray(reportResponse.body.timeline)).toBe(true);
    expect(reportResponse.body.outstandingInvoices.some((invoice) => invoice.invoiceNumber === overdueInvoice.invoiceNumber)).toBe(true);
    expect(reportResponse.body.payoutBacklog.totalRequests).toBeGreaterThan(0);

    const csvResponse = await request(app)
      .get('/api/finance/reports/daily?format=csv')
      .set('x-fixnado-role', 'admin')
      .set('x-test-user-id', providerAdmin.id)
      .expect(200);

    expect(csvResponse.headers['content-type']).toContain('text/csv');
    expect(csvResponse.text.split('\n')[0]).toBe('date,currency,captured,pending,refunded,failed,payouts,disputes');

    const alertsResponse = await request(app)
      .get('/api/finance/alerts')
      .set('x-fixnado-role', 'admin')
      .set('x-test-user-id', providerAdmin.id)
      .expect(200);

    expect(Array.isArray(alertsResponse.body.alerts)).toBe(true);
    expect(alertsResponse.body.alerts.length).toBeGreaterThan(0);
  });

  it('rejects report requests when the provided date range is invalid', async () => {
    const response = await request(app)
      .get('/api/finance/reports/daily')
      .query({ startDate: '2024-03-01', endDate: '2024-02-01' })
      .set('x-fixnado-role', 'admin')
      .set('x-test-user-id', 'range-tester')
      .expect(400);

    expect(response.body.message).toMatch(/startDate/i);
  });

  it('returns an empty regulatory alert payload when no finance data exists', async () => {
    const response = await request(app)
      .get('/api/finance/alerts')
      .set('x-fixnado-role', 'admin')
      .set('x-test-user-id', 'alerts-tester')
      .expect(200);

    expect(Array.isArray(response.body.alerts)).toBe(true);
    expect(response.body.alerts).toHaveLength(0);
    expect(response.body.metrics.totalCaptured).toBe(0);
    expect(response.body.metrics.totalDisputed).toBe(0);
  });
});
