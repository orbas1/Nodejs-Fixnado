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
  PayoutRequest
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
    });

    const providerAdmin = await User.create({
      firstName: 'Provider',
      lastName: 'Admin',
      email: 'provider@example.com',
      passwordHash: 'hashed',
      type: 'provider_admin',
      regionId: region.id
    });

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
      .send({
        orderId: order.id,
        buyerId: buyer.id,
        serviceId: service.id,
        amount: 450,
        currency: 'GBP',
        source: 'vitest',
        metadata: { bookingType: 'scheduled', demand: 'high' }
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
    expect(Number(escrow.amount)).toBeCloseTo(450, 2);

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

    const overviewResponse = await request(app)
      .get('/api/finance/overview')
      .set('x-fixnado-role', 'admin')
      .expect(200);

    expect(overviewResponse.body.totals.captured).toBeGreaterThan(0);
    expect(Array.isArray(overviewResponse.body.payments)).toBe(true);

    const timelineResponse = await request(app)
      .get(`/api/finance/orders/${order.id}/timeline`)
      .set('x-fixnado-role', 'admin')
      .expect(200);

    expect(timelineResponse.body.order.id).toBe(order.id);
    expect(Array.isArray(timelineResponse.body.history)).toBe(true);
    expect(timelineResponse.body.payments.some((entry) => entry.status === 'captured')).toBe(true);
  });
});
