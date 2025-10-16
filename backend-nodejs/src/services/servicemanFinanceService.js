import { Op } from 'sequelize';
import { DateTime } from 'luxon';
import {
  sequelize,
  User,
  Company,
  ProviderContact,
  Booking,
  ServicemanPayment,
  ServicemanCommissionRule
} from '../models/index.js';
import { SERVICEMAN_PAYMENT_STATUSES } from '../models/servicemanPayment.js';
import {
  SERVICEMAN_COMMISSION_APPROVAL_STATUSES,
  SERVICEMAN_COMMISSION_RATE_TYPES
} from '../models/servicemanCommissionRule.js';

function createServiceError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.status = statusCode;
  return error;
}

function toNumber(value) {
  if (value == null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toCurrency(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw createServiceError(`${fieldName} must be a positive number`, 422);
  }
  return Math.round(parsed * 100) / 100;
}

function toRate(value) {
  if (value == null) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    throw createServiceError('Commission rate must be zero or a positive decimal', 422);
  }
  return Math.round(parsed * 10000) / 10000;
}

function sanitiseCurrency(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return 'GBP';
  }
  return value.trim().slice(0, 3).toUpperCase();
}

function coerceDate(value) {
  if (!value) {
    return null;
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function mergeMetadata(...entries) {
  return entries.reduce((acc, entry) => {
    if (entry && typeof entry === 'object' && !Array.isArray(entry)) {
      Object.entries(entry).forEach(([key, val]) => {
        if (val !== undefined) {
          acc[key] = val;
        }
      });
    }
    return acc;
  }, {});
}

async function resolveCompanyAccess(companyId, actor) {
  if (!actor?.id) {
    throw createServiceError('forbidden', 403);
  }

  const actorRecord = await User.findByPk(actor.id, { attributes: ['id', 'type'] });
  if (!actorRecord) {
    throw createServiceError('forbidden', 403);
  }

  if (actorRecord.type === 'admin') {
    if (companyId) {
      const company = await Company.findByPk(companyId, { attributes: ['id'] });
      if (!company) {
        throw createServiceError('company_not_found', 404);
      }
      return company.id;
    }

    const fallback = await Company.findOne({ attributes: ['id'], order: [['createdAt', 'ASC']] });
    if (!fallback) {
      throw createServiceError('company_not_found', 404);
    }
    return fallback.id;
  }

  if (actorRecord.type !== 'company') {
    throw createServiceError('forbidden', 403);
  }

  const where = companyId ? { id: companyId, userId: actorRecord.id } : { userId: actorRecord.id };
  const company = await Company.findOne({ where, attributes: ['id'] });
  if (company) {
    return company.id;
  }

  if (companyId) {
    const exists = await Company.findByPk(companyId, { attributes: ['id'] });
    if (exists) {
      throw createServiceError('forbidden', 403);
    }
  }

  throw createServiceError('company_not_found', 404);
}

function serialiseCommissionRule(rule) {
  const payload = rule?.get ? rule.get({ plain: true }) : rule;
  if (!payload) {
    return null;
  }

  const safeMetadata =
    payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {};

  return {
    id: payload.id,
    companyId: payload.companyId ?? null,
    name: payload.name || 'Commission rule',
    description: payload.description || '',
    rateType: payload.rateType || 'percentage',
    rateValue: toNumber(payload.rateValue) ?? 0,
    autoApply: Boolean(payload.autoApply),
    isDefault: Boolean(payload.isDefault),
    approvalStatus: payload.approvalStatus || 'draft',
    appliesToRole: payload.appliesToRole || null,
    serviceCategory: payload.serviceCategory || null,
    minimumBookingValue: toNumber(payload.minimumBookingValue),
    maximumCommissionValue: toNumber(payload.maximumCommissionValue),
    effectiveFrom: payload.effectiveFrom ? new Date(payload.effectiveFrom).toISOString() : null,
    effectiveTo: payload.effectiveTo ? new Date(payload.effectiveTo).toISOString() : null,
    archivedAt: payload.archivedAt ? new Date(payload.archivedAt).toISOString() : null,
    metadata: safeMetadata,
    createdAt: payload.createdAt ? new Date(payload.createdAt).toISOString() : null,
    updatedAt: payload.updatedAt ? new Date(payload.updatedAt).toISOString() : null
  };
}

function serialisePayment(payment) {
  const payload = payment.get ? payment.get({ plain: true }) : payment;
  const metadata =
    payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {};
  const serviceman = payload.serviceman || {};
  const servicemanSnapshot = payload.servicemanSnapshot || {};
  const booking = payload.booking || {};
  const bookingSnapshot = payload.bookingSnapshot || {};

  const servicemanId =
    serviceman.id ?? payload.servicemanId ?? servicemanSnapshot.id ?? metadata.externalServicemanId ?? null;
  const servicemanName =
    serviceman.name || payload.servicemanName || servicemanSnapshot.name || 'Serviceman';
  const servicemanRole =
    serviceman.role || payload.servicemanRole || servicemanSnapshot.role || 'Crew';

  const bookingReference =
    payload.bookingReference || booking.reference || bookingSnapshot.reference || null;
  const bookingServiceName =
    payload.bookingServiceName || booking.service || bookingSnapshot.serviceName || null;

  const dueDate = payload.dueDate ? new Date(payload.dueDate).toISOString() : null;
  const paidAt = payload.paidAt ? new Date(payload.paidAt).toISOString() : null;

  return {
    id: payload.id,
    companyId: payload.companyId ?? null,
    amount: toNumber(payload.amount) ?? 0,
    currency: typeof payload.currency === 'string' ? payload.currency.toUpperCase() : 'GBP',
    status: payload.status || 'scheduled',
    commissionRate: toNumber(payload.commissionRate),
    commissionAmount: toNumber(payload.commissionAmount),
    dueDate,
    paidAt,
    notes: payload.notes || '',
    metadata,
    serviceman: {
      id: servicemanId,
      name: servicemanName,
      role: servicemanRole,
      email: serviceman.email || servicemanSnapshot.email || null,
      phone: serviceman.phone || servicemanSnapshot.phone || null
    },
    booking:
      payload.bookingId || booking.id || bookingReference
        ? {
            id: booking.id ?? payload.bookingId ?? null,
            reference: bookingReference,
            service: booking.service || bookingServiceName,
            status: booking.status || null
          }
        : null,
    commissionRule: payload.commissionRule ? serialiseCommissionRule(payload.commissionRule) : null,
    createdAt: payload.createdAt ? new Date(payload.createdAt).toISOString() : null,
    updatedAt: payload.updatedAt ? new Date(payload.updatedAt).toISOString() : null
  };
}

function computeSummary(payments) {
  const now = DateTime.now();
  const threshold = now.minus({ days: 30 });
  return payments.reduce(
    (acc, payment) => {
      const amount = toNumber(payment.amount) ?? 0;
      const commissionAmount = toNumber(payment.commissionAmount) ?? 0;
      const commissionRate = toNumber(payment.commissionRate);
      const status = payment.status || 'scheduled';
      const dueDate = payment.dueDate ? DateTime.fromJSDate(payment.dueDate) : null;
      const paidAt = payment.paidAt ? DateTime.fromJSDate(payment.paidAt) : null;

      if (['scheduled', 'pending', 'approved'].includes(status)) {
        acc.outstandingTotal += amount;
        acc.commissionOutstanding += commissionAmount;
        if (!dueDate || dueDate >= now.startOf('day')) {
          acc.upcomingCount += 1;
        }
      }

      if (status === 'paid') {
        acc.commissionPaid += commissionAmount;
        if (paidAt && paidAt >= threshold) {
          acc.paidLast30Days += amount;
        }
      }

      if (commissionRate != null) {
        acc._commissionRates.push(commissionRate);
      }

      return acc;
    },
    {
      outstandingTotal: 0,
      paidLast30Days: 0,
      upcomingCount: 0,
      avgCommissionRate: 0,
      commissionPaid: 0,
      commissionOutstanding: 0,
      _commissionRates: []
    }
  );
}

function finaliseSummary(summary) {
  const rates = summary._commissionRates;
  const avg = rates.length ? rates.reduce((sum, rate) => sum + rate, 0) / rates.length : 0;
  return {
    outstandingTotal: Math.round(summary.outstandingTotal * 100) / 100,
    paidLast30Days: Math.round(summary.paidLast30Days * 100) / 100,
    upcomingCount: summary.upcomingCount,
    avgCommissionRate: Math.round(avg * 1000) / 1000,
    commissionPaid: Math.round(summary.commissionPaid * 100) / 100,
    commissionOutstanding: Math.round(summary.commissionOutstanding * 100) / 100
  };
}

async function resolveServicemanContext({ servicemanId, servicemanName, servicemanRole, companyId }) {
  const metadata = {};
  if (!servicemanId) {
    return {
      servicemanId: null,
      servicemanName: servicemanName || null,
      servicemanRole: servicemanRole || null,
      metadata,
      snapshot: {
        id: servicemanId || null,
        name: servicemanName || null,
        role: servicemanRole || null
      },
      contact: null
    };
  }

  const contact = await ProviderContact.findOne({
    where: { id: servicemanId, companyId },
    attributes: ['id', 'name', 'role', 'email', 'phone']
  });

  if (!contact) {
    metadata.externalServicemanId = servicemanId;
    return {
      servicemanId: null,
      servicemanName: servicemanName || null,
      servicemanRole: servicemanRole || null,
      metadata,
      snapshot: {
        id: servicemanId,
        name: servicemanName || null,
        role: servicemanRole || null
      },
      contact: null
    };
  }

  return {
    servicemanId: contact.id,
    servicemanName: servicemanName || contact.name,
    servicemanRole: servicemanRole || contact.role || null,
    metadata,
    snapshot: {
      id: contact.id,
      name: contact.name,
      role: contact.role || null,
      email: contact.email || null,
      phone: contact.phone || null
    },
    contact
  };
}

async function resolveBookingContext({ bookingId, bookingReference, companyId }) {
  const metadata = {};
  if (!bookingId) {
    return {
      bookingId: null,
      bookingReference: bookingReference || null,
      bookingServiceName: null,
      snapshot: bookingReference
        ? {
            reference: bookingReference
          }
        : {},
      booking: null,
      metadata
    };
  }

  const booking = await Booking.findOne({
    where: { id: bookingId, companyId },
    attributes: ['id', 'status', 'meta', 'scheduledStart', 'serviceId']
  });

  if (!booking) {
    metadata.externalBookingReference = bookingReference || bookingId;
    return {
      bookingId: null,
      bookingReference: bookingReference || bookingId,
      bookingServiceName: null,
      snapshot: {
        reference: bookingReference || bookingId
      },
      booking: null,
      metadata
    };
  }

  const meta = booking.meta || {};
  const reference = bookingReference || meta.reference || booking.id;
  const serviceName = meta.title || meta.serviceName || null;

  return {
    bookingId: booking.id,
    bookingReference: reference,
    bookingServiceName: serviceName,
    snapshot: {
      id: booking.id,
      reference,
      serviceName,
      status: booking.status,
      scheduledStart: booking.scheduledStart ? booking.scheduledStart.toISOString?.() : null
    },
    booking,
    metadata
  };
}

async function findApplicableRule({
  transaction,
  companyId,
  explicitRuleId,
  servicemanRole,
  serviceCategory,
  amount
}) {
  if (explicitRuleId) {
    const rule = await ServicemanCommissionRule.findOne({
      where: { id: explicitRuleId, companyId },
      transaction
    });
    if (!rule) {
      throw createServiceError('Commission rule not found', 404);
    }
    return rule;
  }

  const rules = await ServicemanCommissionRule.findAll({
    where: {
      companyId,
      approvalStatus: 'approved'
    },
    order: [
      ['isDefault', 'DESC'],
      ['autoApply', 'DESC'],
      ['updatedAt', 'DESC']
    ],
    transaction
  });

  for (const rule of rules) {
    if (!rule.autoApply) {
      continue;
    }
    if (rule.appliesToRole && servicemanRole && rule.appliesToRole.toLowerCase() !== servicemanRole.toLowerCase()) {
      continue;
    }
    if (rule.serviceCategory && serviceCategory && rule.serviceCategory.toLowerCase() !== serviceCategory.toLowerCase()) {
      continue;
    }
    const minimum = toNumber(rule.minimumBookingValue);
    if (minimum != null && amount < minimum) {
      continue;
    }
    return rule;
  }

  return rules.find((rule) => rule.isDefault) || null;
}

function applyCommissionRule({ rule, amount, commissionRate, commissionAmount }) {
  let appliedRate = commissionRate;
  let appliedAmount = commissionAmount;

  if (!rule) {
    if (appliedAmount == null && appliedRate != null) {
      appliedAmount = Math.round(amount * appliedRate * 100) / 100;
    }
    return { appliedRate, appliedAmount, ruleId: null };
  }

  const max = toNumber(rule.maximumCommissionValue);

  switch (rule.rateType) {
    case 'flat': {
      const value = toNumber(rule.rateValue) ?? 0;
      appliedAmount = appliedAmount != null ? appliedAmount : value;
      appliedRate = null;
      break;
    }
    case 'hybrid':
    case 'percentage':
    default: {
      const rateValue = toNumber(rule.rateValue) ?? 0;
      appliedRate = appliedRate != null ? appliedRate : rateValue;
      appliedAmount = appliedAmount != null ? appliedAmount : Math.round(amount * rateValue * 100) / 100;
      if (max != null && appliedAmount > max) {
        appliedAmount = max;
      }
      break;
    }
  }

  return {
    appliedRate,
    appliedAmount,
    ruleId: rule.id
  };
}

const PAYMENT_INCLUDE = [
  {
    model: ProviderContact,
    as: 'serviceman',
    attributes: ['id', 'name', 'role', 'email', 'phone']
  },
  {
    model: Booking,
    as: 'booking',
    attributes: ['id', 'status', 'meta']
  },
  {
    model: ServicemanCommissionRule,
    as: 'commissionRule'
  }
];

export async function getServicemanPaymentsWorkspace({
  companyId,
  actor,
  limit = 10,
  offset = 0,
  status,
  query
} = {}) {
  const resolvedCompanyId = await resolveCompanyAccess(companyId, actor);
  const pageSize = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);
  const pageOffset = Math.max(parseInt(offset, 10) || 0, 0);

  const historyWhere = { companyId: resolvedCompanyId };

  if (status && status !== 'all') {
    if (!SERVICEMAN_PAYMENT_STATUSES.includes(status)) {
      throw createServiceError('Invalid payment status filter', 422);
    }
    historyWhere.status = status;
  }

  const trimmedQuery = typeof query === 'string' ? query.trim() : '';
  const likeOperator = sequelize.getDialect() === 'postgres' ? Op.iLike : Op.like;
  if (trimmedQuery) {
    const pattern = `%${trimmedQuery}%`;
    historyWhere[Op.or] = [
      { servicemanName: { [likeOperator]: pattern } },
      { bookingReference: { [likeOperator]: pattern } },
      { bookingServiceName: { [likeOperator]: pattern } },
      { notes: { [likeOperator]: pattern } }
    ];
  }

  const [summarySource, upcoming, historyResult, commissionRules] = await Promise.all([
    ServicemanPayment.findAll({
      where: { companyId: resolvedCompanyId },
      attributes: ['amount', 'commissionAmount', 'commissionRate', 'status', 'dueDate', 'paidAt'],
      raw: true
    }),
    ServicemanPayment.findAll({
      where: {
        companyId: resolvedCompanyId,
        status: { [Op.in]: ['scheduled', 'pending', 'approved'] }
      },
      include: PAYMENT_INCLUDE,
      order: [
        ['dueDate', 'ASC'],
        ['createdAt', 'DESC']
      ],
      limit: 6
    }),
    ServicemanPayment.findAndCountAll({
      where: historyWhere,
      include: PAYMENT_INCLUDE,
      order: [
        ['dueDate', 'DESC'],
        ['createdAt', 'DESC']
      ],
      limit: pageSize,
      offset: pageOffset,
      distinct: true
    }),
    ServicemanCommissionRule.findAll({
      where: { companyId: resolvedCompanyId },
      order: [
        ['isDefault', 'DESC'],
        ['approvalStatus', 'ASC'],
        ['updatedAt', 'DESC']
      ]
    })
  ]);

  const summary = finaliseSummary(computeSummary(summarySource));
  const upcomingPayments = upcoming.map((payment) => serialisePayment(payment));

  const historyItems = historyResult.rows.map((payment) => serialisePayment(payment));
  const total = Array.isArray(historyResult.count)
    ? historyResult.count.length
    : historyResult.count;

  const rules = commissionRules.map((rule) => serialiseCommissionRule(rule));
  const activeRules = rules.filter((rule) => rule && rule.approvalStatus === 'approved').length;
  const defaultRuleId = rules.find((rule) => rule && rule.isDefault)?.id ?? null;

  return {
    companyId: resolvedCompanyId,
    summary,
    upcoming: upcomingPayments,
    history: {
      items: historyItems,
      total,
      limit: pageSize,
      offset: pageOffset
    },
    commissions: {
      rules,
      activeRules,
      defaultRuleId
    }
  };
}

export async function createServicemanPayment(payload = {}, { companyId, actor } = {}) {
  const resolvedCompanyId = await resolveCompanyAccess(companyId, actor);
  const amount = toCurrency(payload.amount, 'Payment amount');
  const currency = sanitiseCurrency(payload.currency);
  const status = payload.status && SERVICEMAN_PAYMENT_STATUSES.includes(payload.status)
    ? payload.status
    : 'scheduled';
  const dueDate = coerceDate(payload.dueDate);
  const paidAt = coerceDate(payload.paidAt);
  const resolvedPaidAt = status === 'paid' ? paidAt || new Date() : null;

  return sequelize.transaction(async (transaction) => {
    const servicemanContext = await resolveServicemanContext({
      servicemanId: payload.servicemanId,
      servicemanName: payload.servicemanName,
      servicemanRole: payload.servicemanRole,
      companyId: resolvedCompanyId
    });

    const bookingContext = await resolveBookingContext({
      bookingId: payload.bookingId,
      bookingReference: payload.bookingReference || payload.bookingId,
      companyId: resolvedCompanyId
    });

    const servicemanRole = servicemanContext.servicemanRole || servicemanContext.contact?.role || null;
    const serviceCategory = bookingContext.booking?.meta?.category || null;

    const rule = await findApplicableRule({
      transaction,
      companyId: resolvedCompanyId,
      explicitRuleId: payload.commissionRuleId,
      servicemanRole,
      serviceCategory,
      amount
    });

    const commissionRate = payload.commissionRate != null ? toRate(payload.commissionRate) : null;
    const commissionAmount = payload.commissionAmount != null ? toCurrency(payload.commissionAmount, 'Commission amount') : null;

    const commission = applyCommissionRule({
      rule,
      amount,
      commissionRate,
      commissionAmount
    });

    const metadata = mergeMetadata(
      payload.metadata,
      servicemanContext.metadata,
      bookingContext.metadata,
      rule ? { commissionRuleName: rule.name, commissionAutoApplied: !payload.commissionRuleId } : null
    );

    const payment = await ServicemanPayment.create(
      {
        companyId: resolvedCompanyId,
        servicemanId: servicemanContext.servicemanId,
        servicemanName: servicemanContext.servicemanName,
        servicemanRole: servicemanContext.servicemanRole,
        servicemanSnapshot: servicemanContext.snapshot,
        bookingId: bookingContext.bookingId,
        bookingReference: bookingContext.bookingReference,
        bookingServiceName: bookingContext.bookingServiceName,
        bookingSnapshot: bookingContext.snapshot,
        commissionRuleId: commission.ruleId,
        amount,
        currency,
        status,
        commissionRate: commission.appliedRate,
        commissionAmount: commission.appliedAmount,
        dueDate,
        paidAt: resolvedPaidAt,
        notes: payload.notes || null,
        metadata,
        createdBy: actor?.id || null,
        updatedBy: actor?.id || null
      },
      { transaction }
    );

    await payment.reload({ include: PAYMENT_INCLUDE, transaction });
    return serialisePayment(payment);
  });
}

export async function updateServicemanPayment(paymentId, payload = {}, { companyId, actor } = {}) {
  if (!paymentId) {
    throw createServiceError('Payment identifier required', 400);
  }

  const resolvedCompanyId = await resolveCompanyAccess(companyId, actor);

  return sequelize.transaction(async (transaction) => {
    const payment = await ServicemanPayment.findOne({
      where: { id: paymentId, companyId: resolvedCompanyId },
      include: PAYMENT_INCLUDE,
      transaction
    });

    if (!payment) {
      throw createServiceError('Payment not found', 404);
    }

    const amount = payload.amount != null ? toCurrency(payload.amount, 'Payment amount') : toNumber(payment.amount);
    const currency = payload.currency ? sanitiseCurrency(payload.currency) : payment.currency;
    const status =
      payload.status && SERVICEMAN_PAYMENT_STATUSES.includes(payload.status)
        ? payload.status
        : payment.status;
    const dueDate = payload.dueDate !== undefined ? coerceDate(payload.dueDate) : payment.dueDate;
    const paidAt =
      payload.paidAt !== undefined
        ? coerceDate(payload.paidAt)
        : payment.paidAt;
    const effectivePaidAt = status === 'paid' ? paidAt || new Date() : paidAt;

    const servicemanContext = await resolveServicemanContext({
      servicemanId: payload.servicemanId ?? payment.servicemanId,
      servicemanName: payload.servicemanName ?? payment.servicemanName,
      servicemanRole: payload.servicemanRole ?? payment.servicemanRole,
      companyId: resolvedCompanyId
    });

    const bookingContext = await resolveBookingContext({
      bookingId: payload.bookingId ?? payment.bookingId,
      bookingReference:
        payload.bookingReference ?? payload.bookingId ?? payment.bookingReference ?? payment.bookingId,
      companyId: resolvedCompanyId
    });

    const commissionRate =
      payload.commissionRate !== undefined ? toRate(payload.commissionRate) : toNumber(payment.commissionRate);
    const commissionAmount =
      payload.commissionAmount !== undefined
        ? toCurrency(payload.commissionAmount, 'Commission amount')
        : toNumber(payment.commissionAmount);

    const rule = await findApplicableRule({
      transaction,
      companyId: resolvedCompanyId,
      explicitRuleId: payload.commissionRuleId ?? payment.commissionRuleId,
      servicemanRole: servicemanContext.servicemanRole,
      serviceCategory: bookingContext.booking?.meta?.category || null,
      amount
    });

    const commission = applyCommissionRule({
      rule,
      amount,
      commissionRate,
      commissionAmount
    });

    const metadata = mergeMetadata(
      payment.metadata,
      payload.metadata,
      servicemanContext.metadata,
      bookingContext.metadata,
      rule ? { commissionRuleName: rule.name, commissionAutoApplied: !payload.commissionRuleId && !payment.commissionRuleId } : null
    );

    await payment.update(
      {
        servicemanId: servicemanContext.servicemanId,
        servicemanName: servicemanContext.servicemanName,
        servicemanRole: servicemanContext.servicemanRole,
        servicemanSnapshot: servicemanContext.snapshot,
        bookingId: bookingContext.bookingId,
        bookingReference: bookingContext.bookingReference,
        bookingServiceName: bookingContext.bookingServiceName,
        bookingSnapshot: bookingContext.snapshot,
        commissionRuleId: commission.ruleId,
        amount,
        currency,
        status,
        commissionRate: commission.appliedRate,
        commissionAmount: commission.appliedAmount,
        dueDate,
        paidAt: status === 'paid' ? effectivePaidAt : null,
        notes: payload.notes !== undefined ? payload.notes || null : payment.notes,
        metadata,
        updatedBy: actor?.id || payment.updatedBy
      },
      { transaction }
    );

    await payment.reload({ include: PAYMENT_INCLUDE, transaction });
    return serialisePayment(payment);
  });
}

export async function deleteServicemanPayment(paymentId, { companyId, actor } = {}) {
  if (!paymentId) {
    throw createServiceError('Payment identifier required', 400);
  }
  const resolvedCompanyId = await resolveCompanyAccess(companyId, actor);
  const deleted = await ServicemanPayment.destroy({
    where: { id: paymentId, companyId: resolvedCompanyId }
  });
  if (!deleted) {
    throw createServiceError('Payment not found', 404);
  }
}

export async function listServicemanCommissionRules({ companyId, actor } = {}) {
  const resolvedCompanyId = await resolveCompanyAccess(companyId, actor);
  const rules = await ServicemanCommissionRule.findAll({
    where: { companyId: resolvedCompanyId },
    order: [
      ['isDefault', 'DESC'],
      ['approvalStatus', 'ASC'],
      ['updatedAt', 'DESC']
    ]
  });
  const serialised = rules.map((rule) => serialiseCommissionRule(rule));
  return {
    rules: serialised,
    activeRules: serialised.filter((rule) => rule.approvalStatus === 'approved').length,
    defaultRuleId: serialised.find((rule) => rule.isDefault)?.id ?? null
  };
}

function validateCommissionRulePayload(payload = {}) {
  if (!payload.name || !payload.name.trim()) {
    throw createServiceError('Commission rule name is required', 422);
  }

  const rateType = payload.rateType && SERVICEMAN_COMMISSION_RATE_TYPES.includes(payload.rateType)
    ? payload.rateType
    : 'percentage';

  const approvalStatus =
    payload.approvalStatus && SERVICEMAN_COMMISSION_APPROVAL_STATUSES.includes(payload.approvalStatus)
      ? payload.approvalStatus
      : 'draft';

  const rateValue = toNumber(payload.rateValue) ?? 0;
  if (rateValue < 0) {
    throw createServiceError('Commission rate value must be positive', 422);
  }

  const minimumBookingValue = payload.minimumBookingValue != null ? toCurrency(payload.minimumBookingValue, 'Minimum booking value') : null;
  const maximumCommissionValue = payload.maximumCommissionValue != null ? toCurrency(payload.maximumCommissionValue, 'Maximum commission value') : null;

  return {
    name: payload.name.trim(),
    description: payload.description?.trim() || null,
    appliesToRole: payload.appliesToRole?.trim() || null,
    serviceCategory: payload.serviceCategory?.trim() || null,
    rateType,
    rateValue,
    minimumBookingValue,
    maximumCommissionValue,
    autoApply: Boolean(payload.autoApply),
    isDefault: Boolean(payload.isDefault),
    approvalStatus,
    effectiveFrom: coerceDate(payload.effectiveFrom),
    effectiveTo: coerceDate(payload.effectiveTo),
    metadata: payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {}
  };
}

async function persistRule(rule, updates, { transaction, actorId }) {
  await rule.update(
    {
      ...updates,
      updatedBy: actorId ?? rule.updatedBy
    },
    { transaction }
  );

  if (updates.isDefault) {
    await ServicemanCommissionRule.update(
      { isDefault: false },
      {
        where: {
          companyId: rule.companyId,
          id: { [Op.ne]: rule.id }
        },
        transaction
      }
    );
  }

  await rule.reload({ transaction });
  return serialiseCommissionRule(rule);
}

export async function createServicemanCommissionRule(payload = {}, { companyId, actor } = {}) {
  const resolvedCompanyId = await resolveCompanyAccess(companyId, actor);
  const data = validateCommissionRulePayload(payload);

  return sequelize.transaction(async (transaction) => {
    const rule = await ServicemanCommissionRule.create(
      {
        companyId: resolvedCompanyId,
        ...data,
        createdBy: actor?.id || null,
        updatedBy: actor?.id || null
      },
      { transaction }
    );

    if (data.isDefault) {
      await ServicemanCommissionRule.update(
        { isDefault: false },
        {
          where: {
            companyId: resolvedCompanyId,
            id: { [Op.ne]: rule.id }
          },
          transaction
        }
      );
    }

    await rule.reload({ transaction });
    return serialiseCommissionRule(rule);
  });
}

export async function updateServicemanCommissionRule(ruleId, payload = {}, { companyId, actor } = {}) {
  if (!ruleId) {
    throw createServiceError('Commission rule identifier required', 400);
  }

  const resolvedCompanyId = await resolveCompanyAccess(companyId, actor);
  const rule = await ServicemanCommissionRule.findOne({
    where: { id: ruleId, companyId: resolvedCompanyId }
  });

  if (!rule) {
    throw createServiceError('Commission rule not found', 404);
  }

  const data = validateCommissionRulePayload({ ...rule.get({ plain: true }), ...payload });

  return sequelize.transaction(async (transaction) =>
    persistRule(rule, data, { transaction, actorId: actor?.id })
  );
}

export async function archiveServicemanCommissionRule(ruleId, { companyId, actor } = {}) {
  if (!ruleId) {
    throw createServiceError('Commission rule identifier required', 400);
  }

  const resolvedCompanyId = await resolveCompanyAccess(companyId, actor);
  const rule = await ServicemanCommissionRule.findOne({
    where: { id: ruleId, companyId: resolvedCompanyId }
  });

  if (!rule) {
    throw createServiceError('Commission rule not found', 404);
  }

  return sequelize.transaction(async (transaction) =>
    persistRule(
      rule,
      {
        approvalStatus: 'archived',
        isDefault: false,
        archivedAt: new Date()
      },
      { transaction, actorId: actor?.id }
    )
  );
}
