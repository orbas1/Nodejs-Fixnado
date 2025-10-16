import crypto from 'crypto';
import { Op, fn, col, where as sequelizeWhere } from 'sequelize';
import { DateTime } from 'luxon';
import { Order, Service, Region, Escrow, OrderNote, User, sequelize } from '../models/index.js';

const ORDER_STATUSES = ['draft', 'funded', 'in_progress', 'completed', 'disputed'];
const PRIORITIES = ['low', 'medium', 'high', 'urgent'];
const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 200;

function serviceOrderError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normaliseString(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

function normaliseCurrency(value, fallback = 'GBP') {
  const currency = normaliseString(value).toUpperCase();
  if (currency.length === 3) {
    return currency;
  }
  return fallback;
}

function parseAmount(value) {
  if (value == null || value === '') {
    return null;
  }
  const number = Number.parseFloat(value);
  if (!Number.isFinite(number) || number < 0) {
    throw serviceOrderError('totalAmount must be a positive number');
  }
  return Number.parseFloat(number.toFixed(2));
}

function parseDate(value) {
  if (!value) {
    return null;
  }
  const parsed = DateTime.fromISO(value, { zone: 'utc' });
  if (!parsed.isValid) {
    throw serviceOrderError('scheduledFor must be a valid ISO-8601 date');
  }
  return parsed.toJSDate();
}

function normalisePriority(priority) {
  const normalised = normaliseString(priority).toLowerCase();
  return PRIORITIES.includes(normalised) ? normalised : 'medium';
}

function normaliseStatus(status) {
  const normalised = normaliseString(status).toLowerCase();
  if (!normalised) {
    return 'draft';
  }
  if (!ORDER_STATUSES.includes(normalised)) {
    throw serviceOrderError('status must be one of draft, funded, in_progress, completed, or disputed');
  }
  return normalised;
}

function normaliseTags(tags) {
  if (!Array.isArray(tags)) {
    return [];
  }
  const unique = new Set();
  tags.forEach((tag) => {
    if (typeof tag === 'string') {
      const trimmed = tag.trim();
      if (trimmed) {
        unique.add(trimmed);
      }
    }
  });
  return Array.from(unique);
}

function normaliseAttachment(payload) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }
  const url = normaliseString(payload.url);
  if (!url) {
    return null;
  }
  const label = normaliseString(payload.label) || url;
  const type = normaliseString(payload.type);
  return {
    id: normaliseString(payload.id) || crypto.randomUUID(),
    url,
    label,
    type: ['image', 'document', 'link'].includes(type) ? type : 'link',
    uploadedAt: payload.uploadedAt ? new Date(payload.uploadedAt).toISOString() : new Date().toISOString()
  };
}

function normaliseAttachments(attachments) {
  if (!Array.isArray(attachments)) {
    return [];
  }
  return attachments
    .map((attachment) => {
      try {
        return normaliseAttachment(attachment);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function buildAuthor(author) {
  if (!author) {
    return null;
  }
  const name = [author.firstName, author.lastName].filter(Boolean).join(' ').trim();
  return {
    id: author.id,
    name: name || author.email || null,
    email: author.email || null
  };
}

function serialiseNote(note) {
  if (!note) {
    return null;
  }
  return {
    id: note.id,
    body: note.body,
    attachments: Array.isArray(note.attachments) ? note.attachments : [],
    createdAt: note.createdAt instanceof Date ? note.createdAt.toISOString() : new Date(note.createdAt).toISOString(),
    updatedAt: note.updatedAt instanceof Date ? note.updatedAt.toISOString() : new Date(note.updatedAt).toISOString(),
    author: buildAuthor(note.author)
  };
}

function serialiseOrder(order, { includeNotes = false } = {}) {
  if (!order) {
    return null;
  }
  const service = order.Service;
  const region = order.region || order.Region;
  const escrow = order.Escrow;
  const payload = {
    id: order.id,
    serviceId: order.serviceId,
    title: order.title || service?.title || `Order ${order.id.slice(0, 6).toUpperCase()}`,
    summary: order.summary || null,
    status: order.status,
    priority: order.priority || 'medium',
    totalAmount: order.totalAmount != null ? Number.parseFloat(order.totalAmount) : null,
    currency: order.currency || service?.currency || 'GBP',
    scheduledFor: order.scheduledFor instanceof Date ? order.scheduledFor.toISOString() : order.scheduledFor,
    region: region
      ? {
          id: region.id,
          code: region.code,
          name: region.name
        }
      : null,
    service: service
      ? {
          id: service.id,
          title: service.title,
          category: service.category,
          currency: service.currency
        }
      : null,
    tags: Array.isArray(order.tags) ? order.tags : [],
    attachments: Array.isArray(order.attachments) ? order.attachments : [],
    metadata: order.metadata && typeof order.metadata === 'object' ? order.metadata : {},
    escrow: escrow
      ? {
          id: escrow.id,
          status: escrow.status,
          fundedAt: escrow.fundedAt instanceof Date ? escrow.fundedAt.toISOString() : escrow.fundedAt,
          releasedAt: escrow.releasedAt instanceof Date ? escrow.releasedAt.toISOString() : escrow.releasedAt
        }
      : null,
    createdAt: order.createdAt instanceof Date ? order.createdAt.toISOString() : new Date(order.createdAt).toISOString(),
    updatedAt: order.updatedAt instanceof Date ? order.updatedAt.toISOString() : new Date(order.updatedAt).toISOString(),
    noteCount: Array.isArray(order.notes) ? order.notes.length : order.get?.('noteCount') ?? 0
  };

  if (includeNotes) {
    payload.notes = Array.isArray(order.notes) ? order.notes.map((note) => serialiseNote(note)).filter(Boolean) : [];
  } else if (Array.isArray(order.notes) && order.notes.length > 0) {
    payload.latestNote = serialiseNote(order.notes[0]);
  }

  return payload;
}

function buildSearchClause(term) {
  const query = normaliseString(term);
  if (!query) {
    return null;
  }

  const escaped = query.replace(/[%_]/g, (char) => `\\${char}`);
  const isPostgres = sequelize.getDialect() === 'postgres';

  if (isPostgres) {
    const pattern = `%${escaped}%`;
    return {
      [Op.or]: [
        { title: { [Op.iLike]: pattern } },
        { summary: { [Op.iLike]: pattern } },
        sequelizeWhere(col('Service.title'), { [Op.iLike]: pattern }),
        sequelizeWhere(col('Service.category'), { [Op.iLike]: pattern })
      ]
    };
  }

  const lowerPattern = `%${escaped.toLowerCase()}%`;
  return {
    [Op.or]: [
      sequelizeWhere(fn('LOWER', col('Order.title')), { [Op.like]: lowerPattern }),
      sequelizeWhere(fn('LOWER', col('Order.summary')), { [Op.like]: lowerPattern }),
      sequelizeWhere(fn('LOWER', col('Service.title')), { [Op.like]: lowerPattern }),
      sequelizeWhere(fn('LOWER', col('Service.category')), { [Op.like]: lowerPattern })
    ]
  };
}

export async function listServiceOrders({ userId, query = {} }) {
  if (!userId) {
    throw serviceOrderError('Authenticated user context is required', 401);
  }

  const limit = Math.min(Number.parseInt(query.limit ?? DEFAULT_LIMIT, 10) || DEFAULT_LIMIT, MAX_LIMIT);
  const offset = Math.max(Number.parseInt(query.offset ?? '0', 10) || 0, 0);
  const status = normaliseString(query.status);
  const priorityFilter = normaliseString(query.priority);
  const where = { buyerId: userId };

  if (status && status !== 'all') {
    if (!ORDER_STATUSES.includes(status)) {
      throw serviceOrderError('status filter is invalid');
    }
    where.status = status;
  }

  if (priorityFilter && priorityFilter !== 'all') {
    if (!PRIORITIES.includes(priorityFilter)) {
      throw serviceOrderError('priority filter is invalid');
    }
    where.priority = priorityFilter;
  }

  const searchClause = buildSearchClause(query.search);
  const orderClause = [[query.sort === 'scheduledFor' ? 'scheduledFor' : 'createdAt', query.direction === 'asc' ? 'ASC' : 'DESC']];

  const filteredWhere = searchClause ? { ...where, ...searchClause } : where;
  const orders = await Order.findAll({
    where: filteredWhere,
    include: [
      { model: Service, attributes: ['id', 'title', 'category', 'currency'] },
      { model: Region, as: 'region', attributes: ['id', 'code', 'name'] },
      { model: Escrow, attributes: ['id', 'status', 'fundedAt', 'releasedAt'] },
      {
        model: OrderNote,
        as: 'notes',
        separate: true,
        limit: 1,
        order: [['createdAt', 'DESC']],
        include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] }]
      }
    ],
    order: orderClause,
    limit,
    offset
  });

  const countInclude = searchClause
    ? [{ model: Service, attributes: [], required: false }]
    : [];
  const total = await Order.count({
    where: filteredWhere,
    include: countInclude,
    distinct: true,
    col: 'id'
  });
  const statusRows = await Order.findAll({
    attributes: ['status', [fn('COUNT', col('Order.id')), 'count']],
    where: filteredWhere,
    include: countInclude,
    group: ['Order.status'],
    raw: true
  });
  const statusCounts = ORDER_STATUSES.reduce((acc, item) => {
    acc[item] = 0;
    return acc;
  }, {});
  statusRows.forEach((row) => {
    statusCounts[row.status] = Number.parseInt(row.count, 10) || 0;
  });

  return {
    orders: orders.map((order) => serialiseOrder(order)),
    meta: {
      total,
      limit,
      offset,
      statusCounts
    }
  };
}

export async function getServiceOrder(orderId, { userId }) {
  if (!orderId) {
    throw serviceOrderError('orderId is required');
  }
  if (!userId) {
    throw serviceOrderError('Authenticated user context is required', 401);
  }

  const order = await Order.findOne({
    where: { id: orderId, buyerId: userId },
    include: [
      { model: Service, attributes: ['id', 'title', 'category', 'currency'] },
      { model: Region, as: 'region', attributes: ['id', 'code', 'name'] },
      { model: Escrow, attributes: ['id', 'status', 'fundedAt', 'releasedAt'] },
      {
        model: OrderNote,
        as: 'notes',
        separate: true,
        order: [['createdAt', 'DESC']],
        include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] }]
      }
    ]
  });

  if (!order) {
    throw serviceOrderError('Service order not found', 404);
  }

  return serialiseOrder(order, { includeNotes: true });
}

export async function createServiceOrder({ userId, payload }) {
  if (!userId) {
    throw serviceOrderError('Authenticated user context is required', 401);
  }
  if (!payload) {
    throw serviceOrderError('Request payload is required');
  }

  const serviceId = normaliseString(payload.serviceId);
  if (!serviceId) {
    throw serviceOrderError('serviceId is required');
  }

  const service = await Service.findByPk(serviceId);
  if (!service) {
    throw serviceOrderError('Referenced service could not be found', 404);
  }

  const title = normaliseString(payload.title);
  if (title.length < 3) {
    throw serviceOrderError('A title of at least 3 characters is required');
  }

  const summary = normaliseString(payload.summary);
  const status = payload.status ? normaliseStatus(payload.status) : 'draft';
  const priority = normalisePriority(payload.priority);
  const totalAmount = parseAmount(payload.totalAmount);
  const currency = normaliseCurrency(payload.currency, service.currency || 'GBP');
  const scheduledFor = parseDate(payload.scheduledFor);
  const regionId = payload.regionId ? normaliseString(payload.regionId) : null;
  const tags = normaliseTags(payload.tags);
  const attachments = normaliseAttachments(payload.attachments);
  const metadata = payload.metadata && typeof payload.metadata === 'object' ? payload.metadata : {};

  const order = await Order.create({
    buyerId: userId,
    serviceId,
    regionId: regionId || null,
    title,
    summary: summary || null,
    status,
    priority,
    totalAmount: totalAmount ?? service.price ?? 0,
    currency,
    scheduledFor,
    tags,
    attachments,
    metadata: {
      ...metadata,
      createdBy: 'customer_dashboard'
    }
  });

  return getServiceOrder(order.id, { userId });
}

export async function updateServiceOrder(orderId, { userId, payload }) {
  if (!orderId) {
    throw serviceOrderError('orderId is required');
  }
  if (!userId) {
    throw serviceOrderError('Authenticated user context is required', 401);
  }
  if (!payload) {
    throw serviceOrderError('Request payload is required');
  }

  const order = await Order.findOne({ where: { id: orderId, buyerId: userId } });
  if (!order) {
    throw serviceOrderError('Service order not found', 404);
  }

  const updates = {};

  if (payload.title !== undefined) {
    const title = normaliseString(payload.title);
    if (title.length < 3) {
      throw serviceOrderError('A title of at least 3 characters is required');
    }
    updates.title = title;
  }

  if (payload.summary !== undefined) {
    updates.summary = normaliseString(payload.summary) || null;
  }

  if (payload.priority !== undefined) {
    updates.priority = normalisePriority(payload.priority);
  }

  if (payload.status !== undefined) {
    updates.status = normaliseStatus(payload.status);
  }

  if (payload.totalAmount !== undefined) {
    updates.totalAmount = parseAmount(payload.totalAmount);
  }

  if (payload.currency !== undefined) {
    updates.currency = normaliseCurrency(payload.currency, order.currency || 'GBP');
  }

  if (payload.scheduledFor !== undefined) {
    updates.scheduledFor = parseDate(payload.scheduledFor);
  }

  if (payload.regionId !== undefined) {
    updates.regionId = payload.regionId ? normaliseString(payload.regionId) : null;
  }

  if (payload.tags !== undefined) {
    updates.tags = normaliseTags(payload.tags);
  }

  if (payload.attachments !== undefined) {
    updates.attachments = normaliseAttachments(payload.attachments);
  }

  if (payload.metadata !== undefined) {
    updates.metadata = payload.metadata && typeof payload.metadata === 'object'
      ? { ...order.metadata, ...payload.metadata }
      : order.metadata;
  }

  if (payload.serviceId !== undefined) {
    const nextServiceId = normaliseString(payload.serviceId);
    if (!nextServiceId) {
      throw serviceOrderError('serviceId must be provided when updating the service reference');
    }
    const service = await Service.findByPk(nextServiceId);
    if (!service) {
      throw serviceOrderError('Referenced service could not be found', 404);
    }
    updates.serviceId = nextServiceId;
  }

  await order.update(updates);
  return getServiceOrder(order.id, { userId });
}

export async function updateServiceOrderStatus(orderId, { userId, status }) {
  if (!orderId) {
    throw serviceOrderError('orderId is required');
  }
  if (!userId) {
    throw serviceOrderError('Authenticated user context is required', 401);
  }
  const nextStatus = normaliseStatus(status);

  const order = await Order.findOne({ where: { id: orderId, buyerId: userId } });
  if (!order) {
    throw serviceOrderError('Service order not found', 404);
  }

  await order.update({ status: nextStatus });
  return getServiceOrder(order.id, { userId });
}

export async function addServiceOrderNote(orderId, { userId, payload }) {
  if (!orderId) {
    throw serviceOrderError('orderId is required');
  }
  if (!userId) {
    throw serviceOrderError('Authenticated user context is required', 401);
  }
  if (!payload) {
    throw serviceOrderError('Request payload is required');
  }

  const order = await Order.findOne({ where: { id: orderId, buyerId: userId } });
  if (!order) {
    throw serviceOrderError('Service order not found', 404);
  }

  const body = normaliseString(payload.body);
  if (!body) {
    throw serviceOrderError('A note body is required');
  }

  const note = await OrderNote.create({
    orderId,
    authorId: userId,
    body,
    attachments: normaliseAttachments(payload.attachments)
  });

  const hydrated = await OrderNote.findByPk(note.id, {
    include: [{ model: User, as: 'author', attributes: ['id', 'firstName', 'lastName', 'email'] }]
  });

  return serialiseNote(hydrated);
}

export async function deleteServiceOrderNote(orderId, noteId, { userId }) {
  if (!orderId || !noteId) {
    throw serviceOrderError('orderId and noteId are required');
  }
  if (!userId) {
    throw serviceOrderError('Authenticated user context is required', 401);
  }

  const note = await OrderNote.findOne({ where: { id: noteId, orderId }, include: [{ model: Order, as: 'order' }] });
  if (!note) {
    throw serviceOrderError('Note not found', 404);
  }

  if (note.order?.buyerId !== userId && note.authorId !== userId) {
    throw serviceOrderError('You are not authorised to delete this note', 403);
  }

  await note.destroy();
  return { id: noteId, deleted: true };
}
