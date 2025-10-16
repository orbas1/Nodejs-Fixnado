import {
  Order,
  Service,
  Company,
  Escrow,
  Dispute,
  Booking,
  ServiceZone,
  FinanceTransactionHistory,
  sequelize
} from '../models/index.js';
import { purchaseServiceOffering } from './serviceOrchestrationService.js';
import { updateBookingStatus, triggerDispute } from './bookingService.js';
import { getOrderFinanceTimeline } from './paymentOrchestrationService.js';

function managementError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function sanitizeBooking(booking) {
  if (!booking) return null;
  const plain = booking.get ? booking.get({ plain: true }) : booking;
  return {
    id: plain.id,
    status: plain.status,
    type: plain.type,
    zoneId: plain.zoneId,
    scheduledStart: plain.scheduledStart,
    scheduledEnd: plain.scheduledEnd,
    demandLevel: plain.meta?.demandLevel ?? null,
    metadata: plain.meta ?? {},
    lastStatusTransitionAt: plain.lastStatusTransitionAt
  };
}

function sanitizeEscrow(escrow) {
  if (!escrow) return null;
  const plain = escrow.get ? escrow.get({ plain: true }) : escrow;
  return {
    id: plain.id,
    status: plain.status,
    fundedAt: plain.fundedAt,
    releasedAt: plain.releasedAt,
    regionId: plain.regionId,
    disputes: Array.isArray(plain.Disputes)
      ? plain.Disputes.map((dispute) => ({
          id: dispute.id,
          status: dispute.status,
          reason: dispute.reason,
          openedBy: dispute.openedBy,
          createdAt: dispute.createdAt,
          updatedAt: dispute.updatedAt
        }))
      : []
  };
}

function sanitizeService(service) {
  if (!service) return null;
  const plain = service.get ? service.get({ plain: true }) : service;
  return {
    id: plain.id,
    title: plain.title,
    category: plain.category,
    price: plain.price ? Number.parseFloat(plain.price) : null,
    currency: plain.currency,
    companyId: plain.companyId,
    companyName: plain.Company?.contactName ?? plain.Company?.legalStructure ?? null
  };
}

function sanitizeOrder(order, bookingMap = new Map()) {
  const plain = order.get ? order.get({ plain: true }) : order;
  const booking = bookingMap.get(plain.id) ?? null;
  const escrow = plain.Escrow ? sanitizeEscrow(plain.Escrow) : null;
  return {
    id: plain.id,
    status: plain.status,
    totalAmount: plain.totalAmount ? Number.parseFloat(plain.totalAmount) : null,
    currency: plain.currency,
    scheduledFor: plain.scheduledFor,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
    service: plain.Service ? sanitizeService(plain.Service) : null,
    escrow,
    booking: sanitizeBooking(booking),
    metrics: {
      disputesOpen: escrow ? escrow.disputes.filter((d) => d.status === 'open' || d.status === 'under_review').length : 0,
      escrowStatus: escrow?.status ?? 'pending'
    }
  };
}

function sanitizeCatalogueService(service) {
  return {
    id: service.id,
    title: service.title,
    category: service.category,
    price: service.price ? Number.parseFloat(service.price) : null,
    currency: service.currency,
    companyId: service.companyId,
    companyName: service.Company?.contactName ?? service.Company?.legalStructure ?? null
  };
}

function sanitizeZone(zone) {
  return {
    id: zone.id,
    name: zone.name,
    companyId: zone.companyId,
    demandLevel: zone.demandLevel,
    metadata: zone.metadata ?? {}
  };
}

async function hydrateBookings(customerId, orderIds, transaction) {
  if (!orderIds.length) {
    return new Map();
  }

  const bookings = await Booking.findAll({
    where: { customerId },
    transaction
  });

  const map = new Map();
  bookings.forEach((booking) => {
    const orderId = booking.meta?.orderId;
    if (orderId && orderIds.includes(orderId)) {
      map.set(orderId, booking);
    }
  });
  return map;
}

export async function listCustomerServiceManagement({ customerId, limit = 50 } = {}) {
  if (!customerId) {
    throw managementError('customerId is required to load services', 401);
  }

  const cappedLimit = Math.min(Math.max(limit, 1), 100);

  const orders = await Order.findAll({
    where: { buyerId: customerId },
    include: [
      {
        model: Service,
        include: [{ model: Company, attributes: ['id', 'contactName', 'legalStructure'], required: false }]
      },
      {
        model: Escrow,
        include: [{ model: Dispute }]
      }
    ],
    order: [
      ['status', 'ASC'],
      ['createdAt', 'DESC']
    ],
    limit: cappedLimit
  });

  const orderIds = orders.map((order) => order.id);
  const bookingMap = await hydrateBookings(customerId, orderIds);

  const sanitizedOrders = orders.map((order) => sanitizeOrder(order, bookingMap));

  const metrics = sanitizedOrders.reduce(
    (acc, order) => {
      acc.totalOrders += 1;
      if (order.status === 'funded' || order.status === 'in_progress') {
        acc.activeOrders += 1;
      }
      if (order.escrow?.status === 'funded') {
        acc.fundedEscrows += 1;
      }
      if (order.status === 'disputed' || (order.escrow?.disputes ?? []).length > 0) {
        acc.disputedOrders += 1;
      }
      acc.totalSpend += Number.isFinite(order.totalAmount) ? order.totalAmount : 0;
      return acc;
    },
    { activeOrders: 0, fundedEscrows: 0, disputedOrders: 0, totalOrders: 0, totalSpend: 0 }
  );

  const catalogueServices = await Service.findAll({
    attributes: ['id', 'title', 'category', 'price', 'currency', 'companyId'],
    include: [{ model: Company, attributes: ['id', 'contactName', 'legalStructure'], required: false }],
    order: [['createdAt', 'DESC']],
    limit: 25
  });

  const zones = await ServiceZone.findAll({
    attributes: ['id', 'name', 'companyId', 'demandLevel', 'metadata'],
    order: [['createdAt', 'DESC']],
    limit: 25
  });

  return {
    metrics,
    orders: sanitizedOrders,
    catalogue: {
      services: catalogueServices.map(sanitizeCatalogueService),
      zones: zones.map(sanitizeZone)
    }
  };
}

export async function createCustomerServiceOrder({
  customerId,
  serviceId,
  zoneId,
  bookingType,
  scheduledStart,
  scheduledEnd,
  baseAmount,
  currency,
  demandLevel = 'medium',
  notes = ''
}) {
  if (!customerId) {
    throw managementError('customerId is required', 401);
  }
  if (!serviceId) {
    throw managementError('serviceId is required');
  }
  if (!zoneId) {
    throw managementError('zoneId is required');
  }

  const result = await purchaseServiceOffering({
    serviceId,
    buyerId: customerId,
    zoneId,
    bookingType,
    scheduledStart,
    scheduledEnd,
    demandLevel,
    baseAmount,
    currency,
    metadata: notes ? { notes } : {}
  });

  const bookingMap = new Map();
  bookingMap.set(result.order.id, await Booking.findByPk(result.booking.id));

  const order = await Order.findByPk(result.order.id, {
    include: [
      {
        model: Service,
        include: [{ model: Company, attributes: ['id', 'contactName', 'legalStructure'], required: false }]
      },
      {
        model: Escrow,
        include: [{ model: Dispute }]
      }
    ]
  });

  return sanitizeOrder(order, bookingMap);
}

async function resolveOrderForCustomer(orderId, customerId, options = {}) {
  const order = await Order.findByPk(orderId, {
    include: [
      {
        model: Service,
        include: [{ model: Company, attributes: ['id', 'contactName', 'legalStructure'], required: false }]
      },
      {
        model: Escrow,
        include: [{ model: Dispute }]
      }
    ],
    ...options
  });

  if (!order || order.buyerId !== customerId) {
    throw managementError('Order not found', 404);
  }

  return order;
}

export async function updateCustomerOrderSchedule({
  customerId,
  orderId,
  scheduledStart,
  scheduledEnd
}) {
  if (!customerId) {
    throw managementError('customerId is required', 401);
  }

  if (!orderId) {
    throw managementError('orderId is required');
  }

  const start = scheduledStart ? new Date(scheduledStart) : null;
  const end = scheduledEnd ? new Date(scheduledEnd) : null;
  if (!start || Number.isNaN(start.getTime())) {
    throw managementError('scheduledStart must be a valid ISO date');
  }
  if (!end || Number.isNaN(end.getTime())) {
    throw managementError('scheduledEnd must be a valid ISO date');
  }
  if (end <= start) {
    throw managementError('scheduledEnd must be later than scheduledStart');
  }

  return sequelize.transaction(async (transaction) => {
    const order = await resolveOrderForCustomer(orderId, customerId, { transaction, lock: transaction.LOCK.UPDATE });
    const bookingMap = await hydrateBookings(customerId, [order.id], transaction);
    const booking = bookingMap.get(order.id);

    if (!booking) {
      throw managementError('Associated booking not found for this order', 404);
    }

    await booking.update(
      {
        scheduledStart: start,
        scheduledEnd: end,
        meta: {
          ...booking.meta,
          lastScheduleChange: new Date().toISOString()
        }
      },
      { transaction }
    );

    await order.update({ scheduledFor: start }, { transaction });

    const updated = await resolveOrderForCustomer(orderId, customerId, { transaction });
    const refreshedBooking = await Booking.findByPk(booking.id, { transaction });
    const refreshedMap = new Map([[order.id, refreshedBooking]]);
    return sanitizeOrder(updated, refreshedMap);
  });
}

export async function requestEscrowRelease({ customerId, orderId }) {
  if (!customerId) {
    throw managementError('customerId is required', 401);
  }
  if (!orderId) {
    throw managementError('orderId is required');
  }

  return sequelize.transaction(async (transaction) => {
    const order = await resolveOrderForCustomer(orderId, customerId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!order.Escrow) {
      throw managementError('Escrow not initialised for this order', 409);
    }

    if (order.Escrow.status === 'released') {
      return sanitizeOrder(order);
    }

    const bookingMap = await hydrateBookings(customerId, [order.id], transaction);
    const booking = bookingMap.get(order.id);

    if (!booking) {
      throw managementError('Associated booking not found for this order', 404);
    }

    if (!['in_progress', 'completed'].includes(booking.status)) {
      if (booking.status === 'scheduled') {
        await updateBookingStatus(booking.id, 'in_progress', { actorId: customerId, reason: 'customer_release', transaction });
      } else {
        throw managementError('Booking must be in progress before escrow release');
      }
    }

    if (booking.status !== 'completed') {
      await updateBookingStatus(booking.id, 'completed', { actorId: customerId, reason: 'customer_release', transaction });
    }

    await order.Escrow.update(
      {
        status: 'released',
        releasedAt: new Date()
      },
      { transaction }
    );

    if (order.status !== 'completed') {
      await order.update({ status: 'completed' }, { transaction });
    }

    await FinanceTransactionHistory.create(
      {
        orderId: order.id,
        escrowId: order.Escrow.id,
        eventType: 'escrow.release.requested',
        actorId: customerId,
        occurredAt: new Date(),
        snapshot: {
          orderStatus: 'completed',
          escrowStatus: 'released'
        }
      },
      { transaction }
    );

    const refreshed = await resolveOrderForCustomer(orderId, customerId, { transaction });
    const refreshedBooking = await Booking.findByPk(booking.id, { transaction });
    const refreshedMap = new Map([[order.id, refreshedBooking]]);
    return sanitizeOrder(refreshed, refreshedMap);
  });
}

export async function startCustomerDispute({ customerId, orderId, reason, regionId = null }) {
  if (!customerId) {
    throw managementError('customerId is required', 401);
  }
  if (!orderId) {
    throw managementError('orderId is required');
  }

  return sequelize.transaction(async (transaction) => {
    const order = await resolveOrderForCustomer(orderId, customerId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!order.Escrow) {
      throw managementError('Escrow not initialised for this order', 409);
    }

    const existingDispute = (order.Escrow.Disputes || []).find((dispute) =>
      ['open', 'under_review'].includes(dispute.status)
    );
    if (existingDispute) {
      throw managementError('An active dispute already exists for this order', 409);
    }

    const bookingMap = await hydrateBookings(customerId, [order.id], transaction);
    const booking = bookingMap.get(order.id);
    if (!booking) {
      throw managementError('Associated booking not found for this order', 404);
    }

    await triggerDispute({ bookingId: booking.id, reason, actorId: customerId });

    const dispute = await Dispute.create(
      {
        escrowId: order.Escrow.id,
        openedBy: customerId,
        reason: reason || 'Customer initiated dispute',
        status: 'open',
        regionId
      },
      { transaction }
    );

    await order.Escrow.update({ status: 'disputed' }, { transaction });
    await order.update({ status: 'disputed' }, { transaction });

    await FinanceTransactionHistory.create(
      {
        orderId: order.id,
        escrowId: order.Escrow.id,
        disputeId: dispute.id,
        eventType: 'dispute.started',
        actorId: customerId,
        occurredAt: new Date(),
        snapshot: {
          reason,
          bookingId: booking.id
        }
      },
      { transaction }
    );

    const refreshed = await resolveOrderForCustomer(orderId, customerId, { transaction });
    refreshed.Escrow.Disputes = [...(refreshed.Escrow.Disputes ?? []), dispute];
    const refreshedMap = new Map([[order.id, booking]]);
    return sanitizeOrder(refreshed, refreshedMap);
  });
}

export async function getCustomerOrderDetail({ customerId, orderId }) {
  if (!customerId) {
    throw managementError('customerId is required', 401);
  }
  if (!orderId) {
    throw managementError('orderId is required');
  }

  const order = await resolveOrderForCustomer(orderId, customerId);
  const bookingMap = await hydrateBookings(customerId, [order.id]);
  const sanitized = sanitizeOrder(order, bookingMap);
  const timeline = await getOrderFinanceTimeline(orderId);
  return {
    order: sanitized,
    finance: {
      totals: timeline.totals ?? {},
      payments: timeline.payments ?? [],
      payouts: timeline.payouts ?? [],
      invoices: timeline.invoices ?? [],
      disputes: timeline.disputes ?? [],
      history: timeline.history ?? []
    }
  };
}

export default {
  listCustomerServiceManagement,
  createCustomerServiceOrder,
  updateCustomerOrderSchedule,
  requestEscrowRelease,
  startCustomerDispute,
  getCustomerOrderDetail
};
