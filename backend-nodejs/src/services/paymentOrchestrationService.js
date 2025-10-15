import crypto from 'node:crypto';

import { Op } from 'sequelize';
import sequelize from '../config/database.js';
import config from '../config/index.js';
import {
  Booking,
  BookingAssignment,
  Company,
  Dispute,
  Escrow,
  FinanceInvoice,
  FinanceTransactionHistory,
  FinanceWebhookEvent,
  Order,
  Payment,
  PayoutRequest,
  Region,
  Service,
  User
} from '../models/index.js';
import { calculateBookingTotals, resolveSlaExpiry } from './financeService.js';
import { Permissions } from './accessControlService.js';

const { finance: financeConfig } = config;

function invariant(condition, message, statusCode = 400) {
  if (!condition) {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
  }
}

function buildFingerprint(orderId, buyerId, amount, currency, source) {
  const payload = JSON.stringify({ orderId, buyerId, amount, currency, source });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

async function recordFinanceEvent({
  transaction,
  orderId,
  escrowId,
  disputeId,
  paymentId,
  payoutRequestId,
  invoiceId,
  actorId,
  eventType,
  snapshot,
  regionId
}) {
  return FinanceTransactionHistory.create(
    {
      orderId,
      escrowId,
      disputeId,
      paymentId,
      payoutRequestId,
      invoiceId,
      actorId,
      eventType,
      regionId,
      snapshot: snapshot || {}
    },
    { transaction }
  );
}

async function ensureInvoice({ transaction, order, payment }) {
  const existingInvoice = await FinanceInvoice.findOne({
    where: { orderId: order.id },
    transaction
  });

  if (existingInvoice) {
    return existingInvoice;
  }

  const invoiceNumber = `INV-${order.id.slice(0, 8).toUpperCase()}-${Date.now()}`;
  const totals = calculateBookingTotals({
    baseAmount: payment.amount,
    currency: payment.currency,
    type: order.meta?.bookingType,
    demandLevel: order.meta?.demand,
    targetCurrency: payment.currency
  });

  return FinanceInvoice.create(
    {
      orderId: order.id,
      invoiceNumber,
      amountDue: totals.totalAmount,
      amountPaid: payment.status === 'captured' ? totals.totalAmount : 0,
      currency: totals.currency,
      status: payment.status === 'captured' ? 'issued' : 'draft',
      issuedAt: new Date(),
      dueAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      metadata: {
        commissionAmount: totals.commissionAmount,
        taxAmount: totals.taxAmount,
        bookingType: order.meta?.bookingType || 'on_demand'
      },
      regionId: order.regionId
    },
    { transaction }
  );
}

async function ensureEscrow({ transaction, order, payment, gatewayReference }) {
  const [escrow] = await Escrow.findOrCreate({
    where: { orderId: order.id },
    defaults: {
      orderId: order.id,
      status: 'pending',
      fundedAt: null,
      regionId: order.regionId,
      amount: payment.amount,
      currency: payment.currency,
      externalReference: gatewayReference || null
    },
    transaction
  });

  if (escrow.amount === null || Number.parseFloat(escrow.amount) !== Number.parseFloat(payment.amount)) {
    escrow.amount = payment.amount;
  }
  if (!escrow.currency) {
    escrow.currency = payment.currency;
  }
  if (gatewayReference && escrow.externalReference !== gatewayReference) {
    escrow.externalReference = gatewayReference;
  }

  await escrow.save({ transaction });
  return escrow;
}

async function resolveProvider(serviceId) {
  const service = await Service.findByPk(serviceId, {
    include: [
      { model: User, as: 'provider', required: true },
      { model: Company, required: false }
    ]
  });

  invariant(service, 'Service not found for checkout');
  invariant(service.providerId, 'Service must belong to a provider before checkout', 422);

  let companyId = service.companyId || null;
  if (!companyId) {
    const company = await Company.findOne({ where: { userId: service.providerId } });
    if (company) {
      invariant(company.verified !== false, 'Provider company must be verified before accepting payments', 409);
      companyId = company.id;
    }
  } else {
    const company = await Company.findByPk(companyId);
    if (company) {
      invariant(company.verified !== false, 'Provider company must be verified before accepting payments', 409);
    }
  }

  invariant(companyId, 'Provider company must be verified before accepting payments', 409);

  return {
    providerId: service.providerId,
    companyId,
    provider: service.provider
  };
}

async function ensureBookingRecord({ transaction, order, payment, buyerId, companyId }) {
  const existingBooking = await Booking.findByPk(order.id, { transaction });
  if (existingBooking) {
    return existingBooking;
  }

  const totals = calculateBookingTotals({
    baseAmount: payment.amount,
    currency: payment.currency,
    type: payment.metadata?.bookingType || 'on_demand',
    demandLevel: payment.metadata?.demand || 'medium',
    targetCurrency: payment.currency
  });

  const booking = await Booking.create(
    {
      id: order.id,
      customerId: buyerId,
      companyId: companyId,
      zoneId: payment.metadata?.zoneId || order.regionId,
      status: 'awaiting_assignment',
      type: payment.metadata?.bookingType || 'on_demand',
      scheduledStart: payment.metadata?.scheduledStart || null,
      scheduledEnd: payment.metadata?.scheduledEnd || null,
      slaExpiresAt: resolveSlaExpiry(payment.metadata?.bookingType || 'on_demand'),
      baseAmount: totals.baseAmount,
      currency: totals.currency,
      totalAmount: totals.totalAmount,
      commissionAmount: totals.commissionAmount,
      taxAmount: totals.taxAmount,
      meta: {
        ...payment.metadata,
        bookingSource: 'checkout-orchestrator'
      },
      lastStatusTransitionAt: new Date()
    },
    { transaction }
  );

  await recordFinanceEvent({
    transaction,
    orderId: order.id,
    actorId: buyerId,
    eventType: 'booking.created',
    regionId: order.regionId,
    snapshot: {
      bookingId: booking.id,
      status: booking.status,
      source: 'checkout'
    }
  });

  return booking;
}

async function assignServicemen({ transaction, booking, companyId, zoneId, regionId }) {
  const candidates = await User.findAll({
    where: {
      type: 'servicemen',
      ...(regionId ? { regionId } : {})
    },
    limit: 15,
    order: [['createdAt', 'ASC']]
  });

  if (!candidates.length) {
    return [];
  }

  const assignments = [];
  const now = new Date();
  for (const [index, candidate] of candidates.entries()) {
    const role = index === 0 ? 'lead' : 'support';
    const assignment = await BookingAssignment.create(
      {
        bookingId: booking.id,
        providerId: candidate.id,
        role,
        status: 'pending',
        assignedAt: now,
        acknowledgedAt: null
      },
      { transaction }
    );
    assignments.push({
      id: assignment.id,
      providerId: candidate.id,
      role
    });
  }

  await recordFinanceEvent({
    transaction,
    orderId: booking.id,
    eventType: 'booking.assignments.created',
    snapshot: {
      zoneId,
      assignments: assignments.map((entry) => ({ id: entry.id, providerId: entry.providerId, role: entry.role }))
    }
  });

  return assignments;
}

export async function createCheckoutSession({
  orderId,
  buyerId,
  serviceId,
  amount,
  currency,
  source,
  metadata,
  actorId
}) {
  invariant(orderId, 'orderId is required');
  invariant(buyerId, 'buyerId is required');
  invariant(serviceId, 'serviceId is required');
  invariant(Number.isFinite(Number(amount)) && Number(amount) > 0, 'amount must be a positive number');
  invariant(typeof currency === 'string' && currency.length === 3, 'currency must be a 3 letter ISO code');

  const fingerprint = buildFingerprint(orderId, buyerId, amount, currency, source || 'web');
  const existing = await Payment.findOne({ where: { fingerprint } });
  if (existing) {
    return existing;
  }

  return sequelize.transaction(async (transaction) => {
    const order = await Order.findByPk(orderId, { transaction, include: [{ model: Region, as: 'region' }] });
    invariant(order, 'Order not found');
    invariant(order.buyerId === buyerId, 'Buyer does not match order', 403);

    const { providerId, companyId } = await resolveProvider(serviceId);

    const payment = await Payment.create(
      {
        orderId,
        buyerId,
        providerId,
        serviceId,
        amount,
        currency: currency.toUpperCase(),
        status: 'pending',
        metadata: {
          source: source || 'web',
          ...metadata
        },
        fingerprint,
        regionId: order.regionId
      },
      { transaction }
    );

    const escrow = await ensureEscrow({
      transaction,
      order,
      payment,
      gatewayReference: metadata?.gatewayReference
    });

    const booking = await ensureBookingRecord({
      transaction,
      order,
      payment,
      buyerId,
      companyId
    });

    await ensureInvoice({ transaction, order, payment });

    await recordFinanceEvent({
      transaction,
      orderId,
      escrowId: escrow.id,
      paymentId: payment.id,
      actorId: actorId || buyerId,
      eventType: 'checkout.created',
      regionId: order.regionId,
      snapshot: {
        amount: payment.amount,
        currency: payment.currency,
        fingerprint,
        bookingId: booking.id,
        source: source || 'web'
      }
    });

    await assignServicemen({
      transaction,
      booking,
      companyId,
      zoneId: booking.zoneId,
      regionId: order.regionId
    });

    return payment;
  });
}

function shouldRetry(event) {
  if (event.status === 'failed' && event.nextRetryAt) {
    return event.nextRetryAt <= new Date();
  }
  return event.status === 'queued';
}

function scheduleRetry(event) {
  const attempts = event.attempts + 1;
  const maxAttempts = Number.isFinite(financeConfig.webhookMaxAttempts)
    ? financeConfig.webhookMaxAttempts
    : 8;

  if (attempts >= maxAttempts) {
    event.status = 'discarded';
    event.attempts = attempts;
    event.nextRetryAt = null;
    return;
  }

  const delaySeconds = Math.min(60 * 15, 2 ** attempts);
  event.status = 'failed';
  event.attempts = attempts;
  event.nextRetryAt = new Date(Date.now() + delaySeconds * 1000);
}

async function markSucceeded(event, transaction) {
  event.status = 'succeeded';
  event.lastError = null;
  event.nextRetryAt = null;
  await event.save({ transaction });
}

async function handleStripeEvent(event, transaction) {
  const { payload } = event;
  const type = event.eventType;
  const intent = payload?.data?.object || {};
  const orderId = event.orderId || intent.metadata?.orderId;
  if (!orderId) {
    event.status = 'discarded';
    event.lastError = 'Missing order id in event payload';
    await event.save({ transaction });
    return;
  }

  const payment = await Payment.findOne({ where: { orderId }, transaction });
  if (!payment) {
    event.status = 'discarded';
    event.lastError = `Payment not found for order ${orderId}`;
    await event.save({ transaction });
    return;
  }

  if (type === 'payment_intent.succeeded') {
    payment.status = 'captured';
    payment.capturedAt = new Date();
    payment.gatewayReference = intent.id;
    payment.metadata = { ...payment.metadata, stripeChargeId: intent.id };
    await payment.save({ transaction });

    const escrow = await Escrow.findOne({ where: { orderId }, transaction });
    if (escrow) {
      escrow.status = 'funded';
      escrow.fundedAt = new Date();
      escrow.externalReference = intent.id;
      await escrow.save({ transaction });
    }

    const invoice = await FinanceInvoice.findOne({ where: { orderId }, transaction });
    if (invoice) {
      invoice.status = 'paid';
      invoice.amountPaid = invoice.amountDue;
      invoice.paidAt = new Date();
      await invoice.save({ transaction });
    }

    const payout = await PayoutRequest.create(
      {
        providerId: payment.providerId,
        paymentId: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: 'pending',
        scheduledFor: new Date(Date.now() + financeConfig.payoutDelayDays * 24 * 60 * 60 * 1000 || 0),
        metadata: {
          sourceEvent: type,
          gateway: 'stripe'
        },
        regionId: payment.regionId
      },
      { transaction }
    );

    await recordFinanceEvent({
      transaction,
      orderId,
      paymentId: payment.id,
      escrowId: escrow?.id,
      payoutRequestId: payout.id,
      eventType: 'payment.captured',
      regionId: payment.regionId,
      snapshot: {
        provider: 'stripe',
        gatewayReference: intent.id,
        amount: payment.amount,
        currency: payment.currency
      }
    });
  } else if (type === 'charge.refunded') {
    payment.status = 'refunded';
    payment.refundedAt = new Date();
    await payment.save({ transaction });

    const invoice = await FinanceInvoice.findOne({ where: { orderId }, transaction });
    if (invoice) {
      invoice.status = 'cancelled';
      invoice.amountPaid = 0;
      invoice.paidAt = null;
      await invoice.save({ transaction });
    }

    await recordFinanceEvent({
      transaction,
      orderId,
      paymentId: payment.id,
      eventType: 'payment.refunded',
      regionId: payment.regionId,
      snapshot: {
        provider: 'stripe',
        reason: payload?.data?.object?.reason || 'unspecified'
      }
    });
  } else {
    await recordFinanceEvent({
      transaction,
      orderId,
      paymentId: payment.id,
      eventType: `payment.webhook.${type}`,
      regionId: payment.regionId,
      snapshot: payload
    });
  }

  await markSucceeded(event, transaction);
}

async function handleEscrowEvent(event, transaction) {
  const { payload } = event;
  const escrowReference = payload?.data?.escrow_id || payload?.escrowId;
  const escrow = await Escrow.findOne({
    where: {
      [Op.or]: [{ id: event.escrowId }, { externalReference: escrowReference }]
    },
    transaction
  });

  if (!escrow) {
    event.status = 'discarded';
    event.lastError = `Escrow not found for event ${event.id}`;
    await event.save({ transaction });
    return;
  }

  if (payload?.type === 'escrow_funded' || event.eventType === 'escrow.funded') {
    escrow.status = 'funded';
    escrow.fundedAt = new Date(payload?.data?.funded_at || Date.now());
  }

  if (payload?.type === 'escrow_released' || event.eventType === 'escrow.released') {
    escrow.status = 'released';
    escrow.releasedAt = new Date(payload?.data?.released_at || Date.now());
  }

  await escrow.save({ transaction });

  const payment = await Payment.findOne({ where: { orderId: escrow.orderId }, transaction });
  if (payment) {
    await recordFinanceEvent({
      transaction,
      orderId: escrow.orderId,
      escrowId: escrow.id,
      paymentId: payment.id,
      eventType: `escrow.${escrow.status}`,
      regionId: payment.regionId,
      snapshot: payload
    });
  }

  await markSucceeded(event, transaction);
}

export async function processFinanceWebhookQueue({ limit = 10, logger = console } = {}) {
  const events = await FinanceWebhookEvent.findAll({
    where: {
      status: { [Op.in]: ['queued', 'failed'] }
    },
    order: [['createdAt', 'ASC']],
    limit
  });

  for (const event of events) {
    if (!shouldRetry(event)) {
      continue;
    }

    await sequelize.transaction(async (transaction) => {
      const fresh = await FinanceWebhookEvent.findByPk(event.id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!fresh || !shouldRetry(fresh)) {
        return;
      }

      try {
        if (fresh.provider === 'stripe') {
          await handleStripeEvent(fresh, transaction);
        } else if (fresh.provider === 'escrow') {
          await handleEscrowEvent(fresh, transaction);
        } else {
          fresh.status = 'discarded';
          fresh.lastError = `Unsupported provider ${fresh.provider}`;
          await fresh.save({ transaction });
        }
      } catch (error) {
        logger.error?.('Failed to process finance webhook event', { id: fresh.id, error });
        fresh.lastError = error instanceof Error ? error.message : 'Unknown error';
        scheduleRetry(fresh);
        await fresh.save({ transaction });
      }
    });
  }
}

export async function enqueueFinanceWebhook({ provider, eventType, payload, orderId, paymentId, escrowId }) {
  invariant(provider, 'provider is required');
  invariant(eventType, 'eventType is required');
  invariant(payload && typeof payload === 'object', 'payload must be an object');

  const normalisedProvider = provider.toLowerCase();

  return FinanceWebhookEvent.create({
    provider: normalisedProvider,
    eventType,
    payload,
    status: 'queued',
    attempts: 0,
    lastError: null,
    orderId: orderId || payload?.data?.object?.metadata?.orderId || null,
    paymentId: paymentId || null,
    escrowId: escrowId || null
  });
}

export async function getFinanceOverview({ regionId = null, providerId = null } = {}) {
  const where = {};
  if (regionId) {
    where.regionId = regionId;
  }
  if (providerId) {
    where.providerId = providerId;
  }

  const [payments, payouts, disputes, invoices] = await Promise.all([
    Payment.findAll({ where, order: [['createdAt', 'DESC']], limit: 50 }),
    PayoutRequest.findAll({ where: providerId ? { providerId } : {}, order: [['createdAt', 'DESC']], limit: 50 }),
    Dispute.findAll({ include: [{ model: Escrow, include: [Order] }], order: [['createdAt', 'DESC']], limit: 20 }),
    FinanceInvoice.findAll({ where: regionId ? { regionId } : {}, order: [['createdAt', 'DESC']], limit: 50 })
  ]);

  const totalCaptured = payments
    .filter((payment) => payment.status === 'captured')
    .reduce((sum, payment) => sum + Number.parseFloat(payment.amount), 0);
  const totalRefunded = payments
    .filter((payment) => payment.status === 'refunded')
    .reduce((sum, payment) => sum + Number.parseFloat(payment.amount), 0);

  return {
    totals: {
      captured: totalCaptured,
      refunded: totalRefunded,
      outstandingInvoices: invoices.filter((invoice) => invoice.status !== 'paid').length,
      pendingPayouts: payouts.filter((payout) => payout.status !== 'paid').length
    },
    payments: payments.map((payment) => payment.toJSON()),
    payouts: payouts.map((payout) => payout.toJSON()),
    invoices: invoices.map((invoice) => invoice.toJSON()),
    disputes: disputes.map((dispute) => dispute.toJSON())
  };
}

export async function getOrderFinanceTimeline(orderId) {
  invariant(orderId, 'orderId is required');

  const order = await Order.findByPk(orderId, {
    include: [
      { model: Payment, as: 'payments' },
      { model: Escrow, as: 'Escrow' },
      { model: FinanceWebhookEvent, as: 'financeEvents' },
      { model: FinanceInvoice, as: 'invoice' }
    ]
  });

  invariant(order, 'Order not found');

  const history = await FinanceTransactionHistory.findAll({
    where: { orderId },
    order: [['occurredAt', 'ASC']]
  });

  const disputes = await Dispute.findAll({ where: { escrowId: order.Escrow?.id || null } });

  return {
    order: order.toJSON(),
    payments: order.payments?.map((payment) => payment.toJSON()) || [],
    escrow: order.Escrow ? order.Escrow.toJSON() : null,
    invoice: order.invoice ? order.invoice.toJSON() : null,
    disputes: disputes.map((dispute) => dispute.toJSON()),
    history: history.map((entry) => entry.toJSON())
  };
}

export const FinancePermissions = Object.freeze({
  OVERVIEW: Permissions.FINANCE_OVERVIEW,
  PAYOUT_VIEW: Permissions.FINANCE_PAYOUT_VIEW,
  PAYOUT_MANAGE: Permissions.FINANCE_PAYOUT_MANAGE,
  DISPUTE_VIEW: Permissions.DISPUTE_VIEW,
  DISPUTE_MANAGE: Permissions.DISPUTE_MANAGE
});
