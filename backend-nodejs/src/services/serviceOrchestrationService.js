import { Op } from 'sequelize';
import {
  Service,
  Company,
  Order,
  Escrow,
  ServiceZone,
  User,
  sequelize
} from '../models/index.js';
import { calculateBookingTotals } from './financeService.js';
import { createBooking } from './bookingService.js';

function serviceError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normaliseCurrency(code, fallback = 'USD') {
  const trimmed = (code || fallback || '').toString().trim().toUpperCase();
  if (!trimmed || trimmed.length !== 3) {
    throw serviceError('currency must be a 3-letter ISO code');
  }
  return trimmed;
}

function toNumber(value, fieldName) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  throw serviceError(`${fieldName} must be a numeric value`);
}

function assertPositive(value, fieldName) {
  const numeric = toNumber(value, fieldName);
  if (numeric === null || numeric <= 0) {
    throw serviceError(`${fieldName} must be greater than zero`);
  }
  return numeric;
}

async function resolveProviderCompany(providerId, explicitCompanyId, transaction) {
  if (!providerId) {
    throw serviceError('providerId is required to manage services');
  }

  const where = explicitCompanyId
    ? { id: explicitCompanyId }
    : { userId: providerId };

  const company = await Company.findOne({ where, transaction });
  if (!company) {
    throw serviceError('Provider must belong to a verified company before creating services', 403);
  }

  if (company.verified === false) {
    throw serviceError('Company verification is required before publishing services', 409);
  }

  return company;
}

function deriveAvailability(orders = []) {
  if (!orders.length) {
    return {
      status: 'open',
      label: 'Accepting bookings',
      detail: 'No active orders or escrow holds.'
    };
  }

  const activeOrders = orders.filter((order) =>
    ['funded', 'in_progress', 'scheduled'].includes(order.status)
  );

  if (!activeOrders.length) {
    return {
      status: 'open',
      label: 'Accepting bookings',
      detail: 'All previous engagements completed.'
    };
  }

  const inProgress = activeOrders.some((order) => order.status === 'in_progress');
  const escrowHolds = activeOrders.filter((order) =>
    order.Escrow && ['funded', 'disputed'].includes(order.Escrow.status)
  ).length;

  if (inProgress) {
    return {
      status: 'committed',
      label: 'In delivery',
      detail: 'Active crews are deployed — new bookings will queue behind current work.'
    };
  }

  if (escrowHolds) {
    return {
      status: 'reserved',
      label: 'Escrow funded',
      detail: 'Upcoming bookings are funded in escrow and awaiting kickoff.'
    };
  }

  return {
    status: 'open',
    label: 'Accepting bookings',
    detail: 'Capacity available for the next window.'
  };
}

function sanitiseService(service) {
  const plain = service.get ? service.get({ plain: true }) : service;
  const orders = (plain.Orders || []).map((order) => ({
    id: order.id,
    status: order.status,
    totalAmount: order.totalAmount ? Number.parseFloat(order.totalAmount) : null,
    currency: order.currency,
    escrowStatus: order.Escrow ? order.Escrow.status : null
  }));

  const availability = deriveAvailability(plain.Orders || []);
  const metrics = {
    activeOrders: orders.filter((order) =>
      ['funded', 'in_progress', 'scheduled'].includes(order.status)
    ).length,
    openEscrows: orders.filter((order) => order.escrowStatus === 'funded').length,
    completedOrders: orders.filter((order) => order.status === 'completed').length
  };

  return {
    id: plain.id,
    providerId: plain.providerId,
    companyId: plain.companyId,
    title: plain.title,
    description: plain.description,
    category: plain.category,
    price: plain.price ? Number.parseFloat(plain.price) : null,
    currency: plain.currency,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    availability,
    metrics,
    provider: plain.provider
      ? {
          id: plain.provider.id,
          firstName: plain.provider.firstName,
          lastName: plain.provider.lastName
        }
      : null,
    company: plain.Company
      ? {
          id: plain.Company.id,
          verified: plain.Company.verified,
          serviceRegions: plain.Company.serviceRegions || null
        }
      : null,
    orders
  };
}

export async function listServiceCatalogue({
  limit = 50,
  offset = 0,
  companyId = null,
  providerId = null,
  includeCompleted = false
} = {}) {
  const where = {};

  if (companyId) {
    where.companyId = companyId;
  }

  if (providerId) {
    where.providerId = providerId;
  }

  const orderWhere = includeCompleted
    ? undefined
    : {
        status: {
          [Op.in]: ['draft', 'funded', 'scheduled', 'in_progress', 'awaiting_payment']
        }
      };

  const services = await Service.findAll({
    where,
    include: [
      { model: Company, attributes: ['id', 'verified', 'serviceRegions'] },
      { model: User, as: 'provider', attributes: ['id', 'firstName', 'lastName'], required: false },
      {
        model: Order,
        where: orderWhere,
        required: false,
        include: [{ model: Escrow, attributes: ['status'] }]
      }
    ],
    order: [['createdAt', 'DESC']],
    limit: Math.min(limit, 100),
    offset
  });

  return services.map((service) => sanitiseService(service));
}

export async function createServiceOffering({
  providerId,
  companyId,
  title,
  description,
  category,
  price,
  currency
}) {
  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    throw serviceError('A service title of at least 3 characters is required');
  }

  const numericPrice = assertPositive(price ?? 0, 'price');
  const currencyCode = normaliseCurrency(currency);

  return sequelize.transaction(async (transaction) => {
    const company = await resolveProviderCompany(providerId, companyId, transaction);

    const created = await Service.create(
      {
        providerId,
        companyId: company.id,
        title: title.trim(),
        description: description?.trim() || null,
        category: category?.trim() || null,
        price: numericPrice,
        currency: currencyCode
      },
      { transaction }
    );

    return sanitiseService(created);
  });
}

function normaliseSchedule({ bookingType, scheduledStart, scheduledEnd }) {
  const type = bookingType === 'scheduled' ? 'scheduled' : 'on_demand';

  const start = scheduledStart ? new Date(scheduledStart) : null;
  const end = scheduledEnd ? new Date(scheduledEnd) : null;

  if (scheduledStart && Number.isNaN(start.getTime())) {
    throw serviceError('scheduledStart must be a valid ISO-8601 date');
  }

  if (scheduledEnd && Number.isNaN(end.getTime())) {
    throw serviceError('scheduledEnd must be a valid ISO-8601 date');
  }

  if (type === 'scheduled') {
    if (!start || !end) {
      throw serviceError('Scheduled bookings require both scheduledStart and scheduledEnd');
    }

    if (end <= start) {
      throw serviceError('scheduledEnd must be later than scheduledStart');
    }
  }

  if (type === 'on_demand' && (start || end)) {
    throw serviceError('On-demand bookings cannot include scheduledStart or scheduledEnd');
  }

  return { type, start, end };
}

export async function purchaseServiceOffering({
  serviceId,
  buyerId,
  zoneId,
  bookingType,
  scheduledStart,
  scheduledEnd,
  demandLevel = 'medium',
  baseAmount,
  currency,
  metadata = {}
}) {
  if (!serviceId) {
    throw serviceError('serviceId is required');
  }
  if (!buyerId) {
    throw serviceError('buyerId is required');
  }
  if (!zoneId) {
    throw serviceError('zoneId is required to secure a booking window');
  }

  return sequelize.transaction(async (transaction) => {
    const service = await Service.findByPk(serviceId, {
      include: [{ model: Company }],
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!service) {
      throw serviceError('Service not found', 404);
    }

    if (!service.companyId) {
      throw serviceError('Service does not have an associated company for fulfilment', 409);
    }

    if (service.providerId === buyerId) {
      throw serviceError('Providers cannot purchase their own services', 403);
    }

    const company = service.Company;
    if (!company || company.verified === false) {
      throw serviceError('Service provider must maintain a verified company profile', 409);
    }

    const zone = await ServiceZone.findByPk(zoneId, { transaction });
    if (!zone) {
      throw serviceError('zoneId does not reference a known service zone', 404);
    }

    if (zone.companyId !== service.companyId) {
      throw serviceError('Service zone must belong to the service company', 403);
    }

    const schedule = normaliseSchedule({ bookingType, scheduledStart, scheduledEnd });

    const resolvedCurrency = normaliseCurrency(currency || service.currency);
    const resolvedBaseAmount = baseAmount
      ? assertPositive(baseAmount, 'baseAmount')
      : assertPositive(service.price, 'service price');

    const totals = calculateBookingTotals({
      baseAmount: resolvedBaseAmount,
      currency: resolvedCurrency,
      targetCurrency: resolvedCurrency,
      type: schedule.type,
      demandLevel
    });

    const scheduledFor = schedule.start || new Date();

    const order = await Order.create(
      {
        buyerId,
        serviceId: service.id,
        status: 'funded',
        totalAmount: totals.totalAmount,
        currency: totals.currency,
        scheduledFor
      },
      { transaction }
    );

    const escrow = await Escrow.create(
      {
        orderId: order.id,
        status: 'funded',
        fundedAt: new Date()
      },
      { transaction }
    );

    const booking = await createBooking(
      {
        customerId: buyerId,
        companyId: service.companyId,
        zoneId,
        type: schedule.type,
        demandLevel,
        baseAmount: resolvedBaseAmount,
        currency: resolvedCurrency,
        targetCurrency: totals.currency,
        scheduledStart: schedule.start ? schedule.start.toISOString() : null,
        scheduledEnd: schedule.end ? schedule.end.toISOString() : null,
        metadata: {
          ...metadata,
          serviceId: service.id,
          orderId: order.id,
          escrowId: escrow.id,
          serviceTitle: service.title,
          serviceCategory: service.category,
          serviceCurrency: service.currency,
          pricing: {
            baseAmount: resolvedBaseAmount,
            currency: totals.currency,
            commissionAmount: totals.commissionAmount,
            taxAmount: totals.taxAmount,
            totalAmount: totals.totalAmount
          }
        },
        actor: { id: buyerId, type: 'user' }
      },
      { transaction }
    );

    return {
      order: order.get({ plain: true }),
      escrow: escrow.get({ plain: true }),
      booking: booking.get({ plain: true }),
      totals
    };
  });
}

