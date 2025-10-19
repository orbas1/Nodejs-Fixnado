import { DateTime } from 'luxon';
import { Op, fn, col, literal } from 'sequelize';

import config from '../config/index.js';
import {
  Escrow,
  FinanceInvoice,
  FinanceTransactionHistory,
  Order,
  Payment,
  Service,
  WalletAccount
} from '../models/index.js';

const DEFAULT_TIMEFRAME = '30d';
const DEFAULT_TIMEZONE = 'Europe/London';
const SUPPORTED_PERSONAS = new Set(['admin', 'provider', 'serviceman', 'enterprise', 'user']);
const CHARGEBACK_EVENTS = ['chargeback_opened', 'chargeback_warning'];
const ALERT_LIMIT = 5;

function httpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

const financeConfig = config.finance || {};

function normaliseCurrency(code, fallback = financeConfig.defaultCurrency || 'GBP') {
  if (!code) return fallback;
  const trimmed = String(code).trim();
  if (!trimmed) return fallback;
  return trimmed.toUpperCase().slice(0, 3);
}

function toNumber(value) {
  if (value == null) return 0;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function roundCurrency(value) {
  return Math.round((toNumber(value) + Number.EPSILON) * 100) / 100;
}

function convertCurrency(amount, fromCurrency, toCurrency) {
  const { exchangeRates = {} } = financeConfig;
  const from = normaliseCurrency(fromCurrency);
  const to = normaliseCurrency(toCurrency);
  const defaultRate = exchangeRates.default || 1;
  const fromRate = toNumber(exchangeRates[from] ?? defaultRate);
  const toRate = toNumber(exchangeRates[to] ?? defaultRate);
  if (fromRate === 0) {
    return roundCurrency(amount);
  }
  return roundCurrency((toNumber(amount) / fromRate) * toRate);
}

function parseTimeframe(value) {
  const input = value || DEFAULT_TIMEFRAME;
  const match = /^(\d+)([dwmy])$/i.exec(String(input).trim());
  if (!match) {
    return { unit: 'day', amount: 30, label: 'Last 30 days' };
  }
  const amount = Number.parseInt(match[1], 10);
  const unitToken = match[2].toLowerCase();
  const UNIT_MAP = {
    d: { unit: 'day', label: amount === 1 ? 'Last day' : `Last ${amount} days` },
    w: { unit: 'week', label: amount === 1 ? 'Last week' : `Last ${amount} weeks` },
    m: { unit: 'month', label: amount === 1 ? 'Last month' : `Last ${amount} months` },
    y: { unit: 'year', label: amount === 1 ? 'Last year' : `Last ${amount} years` }
  };
  const resolved = UNIT_MAP[unitToken];
  if (!resolved) {
    return { unit: 'day', amount: 30, label: 'Last 30 days' };
  }
  return { unit: resolved.unit, amount, label: resolved.label };
}

function resolveWindow({ startDate, endDate, timeframe, timezone }) {
  const zone = DateTime.local().setZone(timezone || DEFAULT_TIMEZONE).isValid
    ? timezone || DEFAULT_TIMEZONE
    : DEFAULT_TIMEZONE;

  if (startDate || endDate) {
    const end = DateTime.fromISO(endDate || startDate, { zone }).isValid
      ? DateTime.fromISO(endDate || startDate, { zone }).endOf('day')
      : DateTime.now().setZone(zone).endOf('day');
    const start = DateTime.fromISO(startDate || endDate, { zone }).isValid
      ? DateTime.fromISO(startDate || endDate, { zone }).startOf('day')
      : end.minus({ days: 30 });
    return {
      start,
      end,
      timezone: zone,
      label: `${start.toFormat('dd LLL yyyy')} → ${end.toFormat('dd LLL yyyy')}`
    };
  }

  const parsed = parseTimeframe(timeframe);
  const end = DateTime.now().setZone(zone).endOf('day');
  const start = end.minus({ [`${parsed.unit}s`]: parsed.amount }).startOf('day');
  return {
    start,
    end,
    timezone: zone,
    label: parsed.label
  };
}

function buildBaseScope() {
  return {
    payment: { where: {}, include: [] },
    order: { where: {}, include: [] },
    escrow: { where: {}, include: [] },
    invoice: { where: {}, include: [] },
    wallet: { where: {} }
  };
}

function resolvePersonaScope(personaInput, context = {}) {
  const persona = String(personaInput || '').trim().toLowerCase();
  if (!SUPPORTED_PERSONAS.has(persona)) {
    throw httpError('persona_not_supported', 404);
  }

  const scope = buildBaseScope();
  const { providerId, companyId, userId, servicemanId, regionId } = context;

  if (regionId) {
    scope.payment.where.regionId = regionId;
    scope.order.where.regionId = regionId;
    scope.escrow.where.regionId = regionId;
    scope.invoice.where.regionId = regionId;
  }

  if (persona === 'admin') {
    return scope;
  }

  if (persona === 'user') {
    const resolvedUserId = userId || context.actorId;
    if (!resolvedUserId) {
      throw httpError('user_context_required', 422);
    }
    scope.payment.where.buyerId = resolvedUserId;
    scope.order.where.buyerId = resolvedUserId;
    scope.wallet.where = { ownerType: 'user', ownerId: resolvedUserId };
    return scope;
  }

  if (persona === 'enterprise') {
    if (!companyId) {
      throw httpError('company_context_required', 422);
    }

    const serviceFilter = { companyId };
    scope.payment.include.push({ model: Service, as: 'service', where: serviceFilter, required: true });
    scope.order.include.push({ model: Service, where: serviceFilter, required: true });
    scope.escrow.include.push({
      model: Order,
      required: true,
      include: [{ model: Service, where: serviceFilter, required: true }]
    });
    scope.invoice.include.push({
      model: Order,
      as: 'order',
      required: true,
      include: [{ model: Service, where: serviceFilter, required: true }]
    });
    scope.wallet.where = { ownerType: 'company', companyId };
    return scope;
  }

  if (persona === 'provider') {
    const resolvedProviderId = providerId || servicemanId || context.actorId;
    if (!resolvedProviderId && !companyId) {
      throw httpError('provider_context_required', 422);
    }

    const serviceFilter = {};
    if (resolvedProviderId) {
      serviceFilter.providerId = resolvedProviderId;
    }
    if (companyId) {
      serviceFilter.companyId = companyId;
    }

    scope.payment.include.push({ model: Service, as: 'service', where: serviceFilter, required: true });
    scope.order.include.push({ model: Service, where: serviceFilter, required: true });
    scope.escrow.include.push({
      model: Order,
      required: true,
      include: [{ model: Service, where: serviceFilter, required: true }]
    });
    scope.invoice.include.push({
      model: Order,
      as: 'order',
      required: true,
      include: [{ model: Service, where: serviceFilter, required: true }]
    });
    scope.wallet.where = companyId
      ? { ownerType: 'company', companyId }
      : { ownerType: 'provider', ownerId: resolvedProviderId };
    return scope;
  }

  if (persona === 'serviceman') {
    const resolvedServicemanId = servicemanId || providerId || context.actorId;
    if (!resolvedServicemanId) {
      throw httpError('serviceman_context_required', 422);
    }
    const serviceFilter = { providerId: resolvedServicemanId };
    scope.payment.include.push({ model: Service, as: 'service', where: serviceFilter, required: true });
    scope.order.include.push({ model: Service, where: serviceFilter, required: true });
    scope.escrow.include.push({
      model: Order,
      required: true,
      include: [{ model: Service, where: serviceFilter, required: true }]
    });
    scope.invoice.include.push({
      model: Order,
      as: 'order',
      required: true,
      include: [{ model: Service, where: serviceFilter, required: true }]
    });
    scope.wallet.where = { ownerType: 'serviceman', ownerId: resolvedServicemanId };
    return scope;
  }

  return scope;
}

function mergeAmounts(target, key, amount) {
  const previous = target.get(key) ?? 0;
  target.set(key, roundCurrency(previous + toNumber(amount)));
}

function aggregateByStatus(rows, targetCurrency) {
  const totals = new Map();
  const byStatus = new Map();

  for (const row of rows) {
    const status = String(row.status || 'unknown').toLowerCase();
    const currency = row.currency || targetCurrency;
    const amount = convertCurrency(row.amount ?? row.total ?? row.dueTotal ?? 0, currency, targetCurrency);
    mergeAmounts(totals, 'total', amount);
    mergeAmounts(byStatus, status, amount);
    const count = toNumber(row.count || row.totalCount || row.totalInvoices || row.totalEscrows || 0);
    const existing = byStatus.get(`${status}:count`) ?? 0;
    byStatus.set(`${status}:count`, existing + count);
  }

  return { totals, byStatus };
}

function formatPipeline(byStatusMap, targetCurrency) {
  const pipeline = [];
  for (const [key, value] of byStatusMap.entries()) {
    if (key.endsWith(':count')) {
      continue;
    }
    const count = byStatusMap.get(`${key}:count`) ?? 0;
    pipeline.push({
      stage: key,
      count,
      amount: roundCurrency(value),
      currency: targetCurrency
    });
  }
  pipeline.sort((a, b) => b.amount - a.amount || b.count - a.count || a.stage.localeCompare(b.stage));
  return pipeline;
}

function summariseWallet(accounts, targetCurrency) {
  const currencyTotals = new Map();
  let available = 0;
  let onHold = 0;
  let suspended = 0;
  let autopayoutEnabled = 0;

  for (const account of accounts) {
    const currency = account.currency || targetCurrency;
    const balance = convertCurrency(account.balance, currency, targetCurrency);
    const hold = convertCurrency(account.holdBalance, currency, targetCurrency);
    available += balance;
    onHold += hold;
    if (String(account.status).toLowerCase() === 'suspended') {
      suspended += 1;
    }
    if (account.autopayoutEnabled) {
      autopayoutEnabled += 1;
    }
    const currencyBucket = currencyTotals.get(currency) ?? { balance: 0, hold: 0 };
    currencyBucket.balance += toNumber(account.balance);
    currencyBucket.hold += toNumber(account.holdBalance);
    currencyTotals.set(currency, currencyBucket);
  }

  return {
    available: roundCurrency(available),
    onHold: roundCurrency(onHold),
    suspendedAccounts: suspended,
    autopayoutEnabled,
    currencyBreakdown: Array.from(currencyTotals.entries()).map(([currency, totals]) => ({
      currency,
      balance: roundCurrency(totals.balance),
      hold: roundCurrency(totals.hold)
    }))
  };
}

function buildAlerts({ invoiceStats, escrowStats, chargebackCount, walletSummary }) {
  const alerts = [];

  if ((invoiceStats.overdue?.count ?? 0) > 0) {
    alerts.push({
      severity: 'critical',
      title: 'Overdue invoices require attention',
      description: `${invoiceStats.overdue.count} invoices overdue totalling ${invoiceStats.overdue.amount.toFixed(2)} ${invoiceStats.currency}.`
    });
  }

  if ((escrowStats.disputed?.count ?? 0) > 0) {
    alerts.push({
      severity: 'high',
      title: 'Escrow disputes blocking payout',
      description: `${escrowStats.disputed.count} escrow cases under dispute (${escrowStats.disputed.amount.toFixed(2)} ${escrowStats.currency}).`
    });
  }

  if (chargebackCount > 0) {
    alerts.push({
      severity: 'high',
      title: 'Chargeback investigations in progress',
      description: `${chargebackCount} chargeback alerts opened in the selected window.`
    });
  }

  if (walletSummary.suspendedAccounts > 0) {
    alerts.push({
      severity: 'medium',
      title: 'Suspended wallet accounts',
      description: `${walletSummary.suspendedAccounts} wallet accounts are suspended and cannot receive payouts.`
    });
  }

  return alerts.slice(0, ALERT_LIMIT);
}

function computeInvoiceStats(aggregates, targetCurrency) {
  const result = {
    currency: targetCurrency,
    outstanding: { amount: 0, count: 0 },
    overdue: { amount: 0, count: 0 }
  };

  for (const row of aggregates) {
    const status = String(row.status || '').toLowerCase();
    const dueAmount = convertCurrency(row.dueTotal ?? row.amountDue ?? row.amount ?? 0, row.currency, targetCurrency);
    const paidAmount = convertCurrency(row.paidTotal ?? row.amountPaid ?? 0, row.currency, targetCurrency);
    const netOutstanding = Math.max(roundCurrency(dueAmount - paidAmount), 0);
    const count = toNumber(row.count || row.totalInvoices || 0);

    if (!['paid', 'cancelled'].includes(status)) {
      result.outstanding.amount += netOutstanding;
      result.outstanding.count += count;
    }
    if (status === 'overdue') {
      result.overdue.amount += netOutstanding;
      result.overdue.count += count;
    }
  }

  result.outstanding.amount = roundCurrency(result.outstanding.amount);
  result.overdue.amount = roundCurrency(result.overdue.amount);
  return result;
}

function mapEscrowStats(aggregates, targetCurrency) {
  const stats = {};
  for (const row of aggregates) {
    const status = String(row.status || 'pending').toLowerCase();
    const amount = convertCurrency(row.amount ?? 0, row.currency, targetCurrency);
    const count = toNumber(row.count || 0);
    stats[status] = {
      amount: roundCurrency(amount),
      count,
      currency: targetCurrency
    };
  }
  stats.currency = targetCurrency;
  stats.pending ||= { amount: 0, count: 0, currency: targetCurrency };
  stats.funded ||= { amount: 0, count: 0, currency: targetCurrency };
  stats.released ||= { amount: 0, count: 0, currency: targetCurrency };
  stats.disputed ||= { amount: 0, count: 0, currency: targetCurrency };
  return stats;
}

async function fetchChargebackCount(orderIds, window) {
  if (!Array.isArray(orderIds) || orderIds.length === 0) {
    return 0;
  }
  return FinanceTransactionHistory.count({
    where: {
      orderId: { [Op.in]: orderIds },
      eventType: { [Op.in]: CHARGEBACK_EVENTS },
      occurredAt: {
        [Op.between]: [window.start.toJSDate(), window.end.toJSDate()]
      }
    }
  });
}

async function fetchEscrowReleaseSample(scope, window) {
  return Escrow.findAll({
    attributes: ['fundedAt', 'releasedAt'],
    where: {
      ...scope.escrow.where,
      status: 'released',
      releasedAt: { [Op.between]: [window.start.toJSDate(), window.end.toJSDate()] }
    },
    include: scope.escrow.include,
    order: [['releasedAt', 'DESC']],
    limit: 200
  });
}

function computeAverageSettlementHours(sample) {
  if (!Array.isArray(sample) || sample.length === 0) {
    return null;
  }
  const durations = sample
    .map((escrow) => {
      const fundedAt = escrow.fundedAt ? new Date(escrow.fundedAt) : null;
      const releasedAt = escrow.releasedAt ? new Date(escrow.releasedAt) : null;
      if (!fundedAt || !releasedAt || Number.isNaN(fundedAt.getTime()) || Number.isNaN(releasedAt.getTime())) {
        return null;
      }
      return Math.max((releasedAt.getTime() - fundedAt.getTime()) / 3_600_000, 0);
    })
    .filter((value) => typeof value === 'number');

  if (durations.length === 0) {
    return null;
  }

  const total = durations.reduce((sum, value) => sum + value, 0);
  return Math.round((total / durations.length) * 10) / 10;
}

async function fetchOrderIds(scope, window) {
  const rows = await Payment.findAll({
    attributes: [[col('Payment.order_id'), 'orderId']],
    where: {
      ...scope.payment.where,
      createdAt: { [Op.between]: [window.start.toJSDate(), window.end.toJSDate()] }
    },
    include: scope.payment.include,
    group: ['Payment.order_id'],
    order: [[literal('MAX("Payment"."created_at")'), 'DESC']],
    limit: 5000,
    raw: true
  });
  return rows.map((row) => row.orderId).filter(Boolean);
}

async function fetchAggregates(scope, window) {
  const whereWithWindow = {
    createdAt: { [Op.between]: [window.start.toJSDate(), window.end.toJSDate()] },
    ...scope.payment.where
  };

  const orderWhere = {
    ...scope.order.where,
    createdAt: { [Op.between]: [window.start.toJSDate(), window.end.toJSDate()] }
  };

  const [paymentAggregates, orderAggregates, escrowAggregates, invoiceAggregates, walletAccounts] = await Promise.all([
    Payment.findAll({
      attributes: [
        'status',
        'currency',
        [fn('COUNT', col('Payment.id')), 'count'],
        [fn('COALESCE', fn('SUM', col('Payment.amount')), 0), 'amount']
      ],
      where: whereWithWindow,
      include: scope.payment.include,
      group: ['Payment.status', 'Payment.currency'],
      raw: true
    }),
    Order.findAll({
      attributes: [
        'status',
        'currency',
        [fn('COUNT', col('Order.id')), 'count'],
        [fn('COALESCE', fn('SUM', col('Order.totalAmount')), 0), 'amount']
      ],
      where: orderWhere,
      include: scope.order.include,
      group: ['Order.status', 'Order.currency'],
      raw: true
    }),
    Escrow.findAll({
      attributes: [
        'status',
        'currency',
        [fn('COUNT', col('Escrow.id')), 'count'],
        [fn('COALESCE', fn('SUM', col('Escrow.amount')), 0), 'amount']
      ],
      where: {
        ...scope.escrow.where,
        createdAt: { [Op.between]: [window.start.toJSDate(), window.end.toJSDate()] }
      },
      include: scope.escrow.include,
      group: ['Escrow.status', 'Escrow.currency'],
      raw: true
    }),
    FinanceInvoice.findAll({
      attributes: [
        'status',
        'currency',
        [fn('COUNT', col('FinanceInvoice.id')), 'count'],
        [fn('COALESCE', fn('SUM', col('FinanceInvoice.amount_due')), 0), 'dueTotal'],
        [fn('COALESCE', fn('SUM', col('FinanceInvoice.amount_paid')), 0), 'paidTotal']
      ],
      where: {
        ...scope.invoice.where,
        createdAt: { [Op.between]: [window.start.toJSDate(), window.end.toJSDate()] }
      },
      include: scope.invoice.include,
      group: ['FinanceInvoice.status', 'FinanceInvoice.currency'],
      raw: true
    }),
    WalletAccount.findAll({
      attributes: [
        'id',
        'displayName',
        'alias',
        'currency',
        'balance',
        'holdBalance',
        'status',
        'autopayoutEnabled'
      ],
      where: scope.wallet.where,
      raw: true
    })
  ]);

  return { paymentAggregates, orderAggregates, escrowAggregates, invoiceAggregates, walletAccounts };
}

function buildTotals({ paymentStats, escrowStats, invoiceStats, walletSummary }, targetCurrency) {
  const captured = paymentStats.byStatus.get('captured') || 0;
  const refunded = paymentStats.byStatus.get('refunded') || 0;
  const authorised = paymentStats.byStatus.get('authorised') || 0;
  const pending = paymentStats.byStatus.get('pending') || 0;

  const escrowPending = escrowStats.pending?.amount ?? 0;
  const escrowFunded = escrowStats.funded?.amount ?? 0;
  const escrowReleased = escrowStats.released?.amount ?? 0;

  const outstandingInvoices = invoiceStats.outstanding.amount;

  return {
    currency: targetCurrency,
    grossMerchandiseVolume: roundCurrency(captured + refunded),
    netRevenue: roundCurrency(Math.max(captured - refunded, 0)),
    pendingAuthorisations: roundCurrency(authorised + pending),
    refunds: roundCurrency(refunded),
    escrowOnHold: roundCurrency(escrowPending + Math.max(escrowFunded - escrowReleased, 0)),
    walletAvailable: walletSummary.available,
    outstandingInvoices: roundCurrency(outstandingInvoices)
  };
}

function buildPersonaDashboard(persona, snapshot) {
  const { totals, paymentPipeline, orderPipeline, escrowStats, invoiceStats, wallet } = snapshot;
  const header = {
    persona,
    currency: snapshot.currency,
    window: snapshot.window,
    totals
  };

  const paymentSection = {
    id: 'payments',
    title: 'Payment lifecycle',
    description: 'Authorisations, captures, and refunds processed during the period.',
    pipeline: paymentPipeline
  };

  const orderSection = {
    id: 'orders',
    title: 'Order pipeline',
    description: 'Order movement across fulfilment stages.',
    pipeline: orderPipeline
  };

  const escrowSection = {
    id: 'escrow',
    title: 'Escrow management',
    description: 'Escrow balances awaiting release or flagged for dispute.',
    stats: escrowStats
  };

  const invoiceSection = {
    id: 'billing',
    title: 'Billing & tax exposure',
    description: 'Outstanding invoices and compliance readiness.',
    invoices: invoiceStats
  };

  const walletSection = {
    id: 'wallet',
    title: 'Wallet health',
    description: 'Available funds, holds, and autopayout coverage.',
    wallet
  };

  return {
    header,
    sections: [paymentSection, orderSection, escrowSection, invoiceSection, walletSection],
    alerts: snapshot.alerts,
    readiness: {
      autopayoutCoverage: wallet.autopayoutEnabled,
      settlementHours: snapshot.averageSettlementHours
    }
  };
}

export async function getCommerceSnapshot(personaInput, options = {}) {
  const persona = String(personaInput || '').trim().toLowerCase();
  const window = resolveWindow(options);
  const scope = resolvePersonaScope(persona, options);
  const targetCurrency = normaliseCurrency(options.currency);

  const [aggregates, orderIds, escrowSample] = await Promise.all([
    fetchAggregates(scope, window),
    fetchOrderIds(scope, window),
    fetchEscrowReleaseSample(scope, window)
  ]);

  const paymentStats = aggregateByStatus(aggregates.paymentAggregates, targetCurrency);
  const orderStats = aggregateByStatus(aggregates.orderAggregates, targetCurrency);
  const escrowStats = mapEscrowStats(aggregates.escrowAggregates, targetCurrency);
  const invoiceStats = computeInvoiceStats(aggregates.invoiceAggregates, targetCurrency);
  const walletSummary = summariseWallet(aggregates.walletAccounts, targetCurrency);
  const chargebackCount = await fetchChargebackCount(orderIds, window);
  const averageSettlementHours = computeAverageSettlementHours(escrowSample);

  const totals = buildTotals({ paymentStats, escrowStats, invoiceStats, walletSummary }, targetCurrency);
  const paymentPipeline = formatPipeline(paymentStats.byStatus, targetCurrency);
  const orderPipeline = formatPipeline(orderStats.byStatus, targetCurrency);
  const alerts = buildAlerts({ invoiceStats, escrowStats, chargebackCount, walletSummary });

  return {
    persona,
    currency: targetCurrency,
    window: {
      start: window.start.toISO(),
      end: window.end.toISO(),
      timezone: window.timezone,
      label: window.label
    },
    totals,
    paymentPipeline,
    orderPipeline,
    escrowStats,
    invoiceStats,
    wallet: walletSummary,
    alerts,
    chargebackCount,
    averageSettlementHours
  };
}

export async function getPersonaCommerceDashboard(persona, options = {}) {
  const snapshot = await getCommerceSnapshot(persona, options);
  const dashboard = buildPersonaDashboard(persona, snapshot);
  return { ...snapshot, dashboard };
}

export const __private__ = {
  resolveWindow,
  resolvePersonaScope,
  aggregateByStatus,
  summariseWallet,
  computeInvoiceStats,
  mapEscrowStats,
  buildTotals,
  buildAlerts,
  buildPersonaDashboard,
  computeAverageSettlementHours
};
