import { randomUUID } from 'node:crypto';
import { Op } from 'sequelize';
import { Booking, BookingAssignment, BookingBid, BookingBidComment, BookingHistoryEntry, sequelize } from '../models/index.js';
import { recordAnalyticsEvent, recordAnalyticsEvents } from './analyticsEventService.js';
import { calculateBookingTotals, resolveSlaExpiry } from './financeService.js';
import { applyScamDetection } from './scamDetectionService.js';

const ALLOWED_STATUS_TRANSITIONS = {
  pending: ['awaiting_assignment', 'cancelled'],
  awaiting_assignment: ['scheduled', 'in_progress', 'cancelled'],
  scheduled: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'disputed', 'cancelled'],
  completed: [],
  cancelled: [],
  disputed: ['in_progress']
};

const HISTORY_ENTRY_TYPES = ['note', 'status_update', 'milestone', 'handoff', 'document'];
const HISTORY_STATUSES = ['open', 'in_progress', 'blocked', 'completed', 'cancelled'];
const HISTORY_ACTOR_ROLES = ['customer', 'provider', 'operations', 'support', 'finance', 'system'];
const HISTORY_ATTACHMENT_TYPES = ['image', 'document', 'link'];

function assertTransition(current, next) {
  const allowed = ALLOWED_STATUS_TRANSITIONS[current] || [];
  if (!allowed.includes(next)) {
    const error = new Error(`Booking status transition ${current} -> ${next} is not permitted`);
    error.statusCode = 400;
    throw error;
  }
}

function ensureDate(value, fieldName) {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    const error = new Error(`Invalid date provided for ${fieldName}`);
    error.statusCode = 400;
    throw error;
  }

  return date;
}

function sanitiseString(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function coerceHistoryValue(value, allowed, fallback) {
  if (typeof value === 'string') {
    const normalised = value.trim();
    if (allowed.includes(normalised)) {
      return normalised;
    }
  }
  return fallback;
}

function normaliseHistoryAttachments(rawAttachments) {
  if (!Array.isArray(rawAttachments)) {
    return [];
  }

  return rawAttachments
    .map((attachment) => {
      if (!attachment || typeof attachment !== 'object') {
        return null;
      }

      const url = sanitiseString(attachment.url);
      if (!url) {
        return null;
      }

      const label = sanitiseString(attachment.label) || url;
      const type = coerceHistoryValue(attachment.type, HISTORY_ATTACHMENT_TYPES, 'link');
      const description = sanitiseString(attachment.description);
      const previewImage = sanitiseString(attachment.previewImage);

      return {
        id: sanitiseString(attachment.id ? String(attachment.id) : '') || randomUUID(),
        label,
        url,
        type,
        description: description || null,
        previewImage: previewImage || null
      };
    })
    .filter(Boolean);
}

function mergeHistoryMeta(baseMeta = {}, nextMeta = {}) {
  const result = {};

  if (baseMeta && typeof baseMeta === 'object' && !Array.isArray(baseMeta)) {
    Object.assign(result, baseMeta);
  }

  if (nextMeta && typeof nextMeta === 'object' && !Array.isArray(nextMeta)) {
    for (const [key, value] of Object.entries(nextMeta)) {
      if (value === undefined) {
        continue;
      }
      result[key] = value;
    }
  }

  return result;
}

function invalidBooking(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

async function assertBookingExists(bookingId) {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  return booking;
}

export async function createBooking({
  customerId,
  companyId,
  zoneId,
  type,
  demandLevel,
  baseAmount,
  currency,
  targetCurrency,
  scheduledStart,
  scheduledEnd,
  metadata = {},
  actor = null
}, { transaction: externalTransaction } = {}) {
  if (!customerId || !companyId || !zoneId) {
    throw invalidBooking('customerId, companyId, and zoneId are required');
  }

  const bookingType = type === 'scheduled' ? 'scheduled' : 'on_demand';
  const totals = calculateBookingTotals({
    baseAmount,
    currency,
    type: bookingType,
    demandLevel,
    targetCurrency
  });

  const now = new Date();
  const slaExpiresAt = resolveSlaExpiry(bookingType);

  const startAt = ensureDate(scheduledStart, 'scheduledStart');
  const endAt = ensureDate(scheduledEnd, 'scheduledEnd');

  if (bookingType === 'scheduled' && (!startAt || !endAt || endAt <= startAt)) {
    throw invalidBooking('Scheduled bookings require a valid start and end window');
  }

  if (bookingType === 'on_demand' && (startAt || endAt)) {
    throw invalidBooking('On-demand bookings cannot provide schedule windows');
  }

  const execute = async (transaction) => {
    const booking = await Booking.create(
      {
        customerId,
        companyId,
        zoneId,
        status: bookingType === 'on_demand' ? 'awaiting_assignment' : 'scheduled',
        type: bookingType,
        scheduledStart: startAt,
        scheduledEnd: endAt,
        slaExpiresAt,
        baseAmount: totals.baseAmount,
        currency: totals.currency,
        totalAmount: totals.totalAmount,
        commissionAmount: totals.commissionAmount,
        taxAmount: totals.taxAmount,
        meta: {
          ...metadata,
          quotedAmount: baseAmount,
          quotedCurrency: currency,
          commissionRate: totals.commissionRate,
          taxRate: totals.taxRate,
          demandLevel: demandLevel || 'medium'
        },
        lastStatusTransitionAt: now
      },
      { transaction }
    );

    await recordAnalyticsEvent(
      {
        name: 'booking.created',
        entityId: booking.id,
        actor,
        tenantId: companyId,
        occurredAt: now,
        metadata: {
          bookingId: booking.id,
          companyId,
          zoneId,
          type: bookingType,
          demandLevel: demandLevel || 'medium',
          currency: totals.currency,
          totalAmount: Number(totals.totalAmount),
          commissionAmount: Number(totals.commissionAmount),
          taxAmount: Number(totals.taxAmount),
          slaExpiresAt: slaExpiresAt.toISOString(),
          scheduledStart: startAt ? startAt.toISOString() : null,
          scheduledEnd: endAt ? endAt.toISOString() : null
        }
      },
      { transaction }
    );

    try {
      await applyScamDetection({ booking, actor, transaction });
    } catch (error) {
      console.error('Failed to run scam detection heuristic', error);
    }

    return booking;
  };

  if (externalTransaction) {
    return execute(externalTransaction);
  }

  return sequelize.transaction(execute);
}

export async function updateBookingStatus(bookingId, nextStatus, context = {}) {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  const targetStatus = nextStatus;
  if (booking.status === targetStatus) {
    return booking;
  }

  assertTransition(booking.status, targetStatus);

  const lastStatusTransitionAt = new Date();
  const previousStatus = booking.status;
  const updatedMeta = {
    ...booking.meta,
    lastStatusContext: {
      actorId: context.actorId || null,
      reason: context.reason || null,
      updatedAt: lastStatusTransitionAt.toISOString()
    }
  };

  await booking.update({ status: targetStatus, lastStatusTransitionAt, meta: updatedMeta });
  const reloaded = await booking.reload();

  await recordAnalyticsEvent({
    name: 'booking.status_transition',
    entityId: reloaded.id,
    actor: context.actorId
      ? { id: context.actorId, type: 'user' }
      : null,
    tenantId: reloaded.companyId,
    occurredAt: lastStatusTransitionAt,
    metadata: {
      bookingId: reloaded.id,
      companyId: reloaded.companyId,
      fromStatus: previousStatus,
      toStatus: targetStatus,
      reason: context.reason || null,
      zoneId: reloaded.zoneId,
      type: reloaded.type
    }
  });

  return reloaded;
}

export async function assignProviders(bookingId, assignments, actorId) {
  if (!Array.isArray(assignments) || assignments.length === 0) {
    throw invalidBooking('At least one assignment is required');
  }

  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  const now = new Date();

  return sequelize.transaction(async (transaction) => {
    const results = [];
    const assignmentEvents = [];
    for (const assignment of assignments) {
      if (!assignment.providerId) {
        throw invalidBooking('Assignment providerId is required');
      }

      const existing = await BookingAssignment.findOne({
        where: { bookingId, providerId: assignment.providerId },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (existing) {
        results.push(existing);
        continue;
      }

      const created = await BookingAssignment.create(
        {
          bookingId,
          providerId: assignment.providerId,
          role: assignment.role || 'support',
          status: 'pending',
          assignedAt: now,
          acknowledgedAt: null
        },
        { transaction }
      );
      results.push(created);

      assignmentEvents.push({
        name: 'booking.assignment.created',
        entityId: created.id,
        actor: actorId ? { id: actorId, type: 'user' } : null,
        tenantId: booking.companyId,
        occurredAt: created.assignedAt || now,
        metadata: {
          assignmentId: created.id,
          bookingId,
          companyId: booking.companyId,
          providerId: assignment.providerId,
          role: created.role,
          status: created.status
        }
      });
    }

    await booking.update(
      {
        meta: {
          ...booking.meta,
          lastAssignmentAt: now.toISOString(),
          assignedBy: actorId || null
        }
      },
      { transaction }
    );

    if (assignmentEvents.length > 0) {
      await recordAnalyticsEvents(assignmentEvents, { transaction });
    }

    return results;
  });
}

async function refreshBookingAfterAcceptance(booking, transaction, { providerId } = {}) {
  const firstAcceptance = booking.meta?.assignmentAcceptedAt;
  const now = new Date();
  const meta = {
    ...booking.meta,
    assignmentAcceptedAt: firstAcceptance || now.toISOString()
  };

  let nextStatus = booking.status;
  if (!firstAcceptance) {
    nextStatus = booking.type === 'on_demand' ? 'in_progress' : 'scheduled';
  }

  const previousStatus = booking.status;
  await booking.update({
    status: nextStatus,
    meta,
    lastStatusTransitionAt: now
  }, { transaction });

  if (nextStatus !== previousStatus) {
    await recordAnalyticsEvent(
      {
        name: 'booking.status_transition',
        entityId: booking.id,
        actor: providerId ? { id: providerId, type: 'provider' } : null,
        tenantId: booking.companyId,
        occurredAt: now,
        metadata: {
          bookingId: booking.id,
          companyId: booking.companyId,
          fromStatus: previousStatus,
          toStatus: nextStatus,
          reason: 'assignment_acceptance',
          providerId,
          type: booking.type
        }
      },
      { transaction }
    );
  }

  return booking;
}

export async function recordAssignmentResponse({ bookingId, providerId, status }) {
  const allowed = ['accepted', 'declined', 'withdrawn'];
  if (!allowed.includes(status)) {
    throw invalidBooking('Unsupported assignment status');
  }

  return sequelize.transaction(async (transaction) => {
    const assignment = await BookingAssignment.findOne({
      where: { bookingId, providerId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!assignment) {
      const error = new Error('Assignment not found');
      error.statusCode = 404;
      throw error;
    }

    const booking = await Booking.findByPk(bookingId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!booking) {
      const error = new Error('Booking not found');
      error.statusCode = 404;
      throw error;
    }

    await assignment.update(
      {
        status,
        acknowledgedAt: status === 'accepted' ? new Date() : assignment.acknowledgedAt
      },
      { transaction }
    );

    if (status === 'accepted') {
      await refreshBookingAfterAcceptance(booking, transaction, { providerId });
    }

    return { assignment, booking: await booking.reload({ transaction }) };
  });
}

export async function submitBid({ bookingId, providerId, amount, currency, message }) {
  if (!bookingId || !providerId) {
    throw invalidBooking('bookingId and providerId are required');
  }

  const now = new Date();
  return sequelize.transaction(async (transaction) => {
    const booking = await Booking.findByPk(bookingId, { transaction });
    if (!booking) {
      const error = new Error('Booking not found');
      error.statusCode = 404;
      throw error;
    }

    const revisionEntry = {
      amount,
      currency,
      message: message || null,
      createdAt: now.toISOString()
    };

    const auditEntry = {
      action: 'submit_bid',
      actor: providerId,
      at: now.toISOString(),
      payload: { amount, currency }
    };

    const existing = await BookingBid.findOne({
      where: { bookingId, providerId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (existing) {
      const updatedRevisions = [...existing.revisionHistory, revisionEntry];
      const updatedAudit = [...existing.auditLog, auditEntry];
      await existing.update(
        {
          amount,
          currency,
          revisionHistory: updatedRevisions,
          auditLog: updatedAudit,
          status: 'pending',
          updatedAt: now
        },
        { transaction }
      );
      return existing;
    }

    const bid = await BookingBid.create(
      {
        bookingId,
        providerId,
        amount,
        currency,
        status: 'pending',
        revisionHistory: [revisionEntry],
        auditLog: [auditEntry],
        submittedAt: now,
        updatedAt: now
      },
      { transaction }
    );

    if (message) {
      await BookingBidComment.create(
        {
          bidId: bid.id,
          authorId: providerId,
          authorType: 'provider',
          body: message
        },
        { transaction }
      );
    }

    return bid;
  });
}

export async function updateBidStatus({ bookingId, bidId, status, actorId }) {
  const allowedStatuses = ['accepted', 'declined', 'withdrawn'];
  if (!allowedStatuses.includes(status)) {
    throw invalidBooking('Unsupported bid status');
  }

  return sequelize.transaction(async (transaction) => {
    const bid = await BookingBid.findOne({
      where: { id: bidId, bookingId },
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!bid) {
      const error = new Error('Bid not found');
      error.statusCode = 404;
      throw error;
    }

    const now = new Date();
    const auditEntry = {
      action: `set_status_${status}`,
      actor: actorId || null,
      at: now.toISOString()
    };

    await bid.update(
      {
        status,
        auditLog: [...bid.auditLog, auditEntry],
        updatedAt: now
      },
      { transaction }
    );

    if (status === 'accepted') {
      const booking = await Booking.findByPk(bookingId, { transaction, lock: transaction.LOCK.UPDATE });
      if (booking) {
        booking.meta = {
          ...booking.meta,
          bidAcceptedAt: now.toISOString(),
          bidAcceptedBy: actorId || null
        };
        await booking.save({ transaction });
      }
    }

    return bid;
  });
}

export async function addBidComment({ bookingId, bidId, authorId, authorType, body }) {
  if (!body) {
    throw invalidBooking('Comment body is required');
  }

  const validTypes = ['customer', 'provider', 'admin'];
  if (!validTypes.includes(authorType)) {
    throw invalidBooking('Invalid author type');
  }

  const bid = await BookingBid.findOne({ where: { id: bidId, bookingId } });
  if (!bid) {
    const error = new Error('Bid not found');
    error.statusCode = 404;
    throw error;
  }

  const comment = await BookingBidComment.create({
    bidId,
    authorId,
    authorType,
    body
  });

  const now = new Date();
  await bid.update({
    auditLog: [
      ...bid.auditLog,
      {
        action: 'comment',
        actor: authorId,
        at: now.toISOString(),
        payload: { body: body.slice(0, 100) }
      }
    ],
    updatedAt: now
  });

  return comment;
}

export async function triggerDispute({ bookingId, reason, actorId }) {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  if (booking.status === 'disputed') {
    return booking;
  }

  assertTransition(booking.status, 'disputed');

  const now = new Date();
  const previousStatus = booking.status;
  const meta = {
    ...booking.meta,
    dispute: {
      reason: reason || 'unspecified',
      raisedBy: actorId || null,
      raisedAt: now.toISOString()
    }
  };

  await booking.update({
    status: 'disputed',
    lastStatusTransitionAt: now,
    meta
  });

  const updated = await booking.reload();

  await recordAnalyticsEvent({
    name: 'booking.dispute.raised',
    entityId: updated.id,
    actor: actorId ? { id: actorId, type: 'user' } : null,
    tenantId: updated.companyId,
    occurredAt: now,
    metadata: {
      bookingId: updated.id,
      companyId: updated.companyId,
      reason: reason || 'unspecified',
      fromStatus: previousStatus,
      toStatus: 'disputed'
    }
  });

  return updated;
}

export async function listBookings(filters = {}) {
  const clauses = [];

  if (filters.zoneId) {
    clauses.push({ zoneId: filters.zoneId });
  }

  if (filters.status) {
    clauses.push({ status: filters.status });
  }

  if (filters.companyId) {
    clauses.push({ companyId: filters.companyId });
  }

  if (filters.customerId) {
    clauses.push({ customerId: filters.customerId });
  }

  if (filters.search && typeof filters.search === 'string') {
    const lowered = `%${filters.search.trim().toLowerCase()}%`;
    if (lowered !== '%%') {
      const dialect = sequelize.getDialect();
      const idExpression =
        dialect === 'postgres'
          ? 'LOWER("Booking"."id"::text)'
          : 'LOWER("Booking"."id")';
      const jsonExpression = (path) => {
        if (dialect === 'postgres') {
          return `LOWER(meta->>'${path}')`;
        }
        return `LOWER(json_extract("Booking"."meta", '$.${path}'))`;
      };

      const metaFields = ['title', 'customerName', 'requester', 'service'];
      const searchExpressions = [
        sequelize.where(sequelize.literal(idExpression), { [Op.like]: lowered }),
        ...metaFields.map((field) =>
          sequelize.where(sequelize.literal(jsonExpression(field)), { [Op.like]: lowered })
        )
      ];

      clauses.push({ [Op.or]: searchExpressions });
    }
  }

  const where = clauses.length ? { [Op.and]: clauses } : undefined;

  const limit = filters.limit ? Math.min(Math.max(Number(filters.limit) || 0, 1), 100) : undefined;
  const offset = filters.offset ? Math.max(Number(filters.offset) || 0, 0) : undefined;
  const sortDirection = filters.sort === 'asc' ? 'ASC' : 'DESC';

  return Booking.findAll({
    where,
    order: [['createdAt', sortDirection]],
    ...(limit ? { limit } : {}),
    ...(offset ? { offset } : {})
  });
}

export async function getBookingById(id) {
  return Booking.findByPk(id, {
    include: [BookingAssignment, BookingBid]
  });
}

export async function listBookingHistory(bookingId, options = {}) {
  if (!bookingId) {
    throw invalidBooking('bookingId is required');
  }

  await assertBookingExists(bookingId);

  const limit = Math.min(Math.max(Number(options.limit) || 0, 1), 100);
  const offset = Math.max(Number(options.offset) || 0, 0);
  const sortDirection = options.sort === 'asc' ? 'ASC' : 'DESC';

  const where = { bookingId };
  if (options.status && options.status !== 'all' && HISTORY_STATUSES.includes(options.status)) {
    where.status = options.status;
  }

  const { count, rows } = await BookingHistoryEntry.findAndCountAll({
    where,
    order: [
      ['occurredAt', sortDirection],
      ['createdAt', sortDirection]
    ],
    limit,
    offset
  });

  return {
    total: count,
    entries: rows.map((entry) => entry.toJSON())
  };
}

export async function createBookingHistoryEntry(bookingId, payload = {}) {
  if (!bookingId) {
    throw invalidBooking('bookingId is required');
  }

  const title = sanitiseString(payload.title);
  if (!title) {
    throw invalidBooking('A title is required for history entries');
  }

  await assertBookingExists(bookingId);

  const occurredAt = ensureDate(payload.occurredAt, 'occurredAt') || new Date();
  const entryType = coerceHistoryValue(payload.entryType, HISTORY_ENTRY_TYPES, 'note');
  const status = coerceHistoryValue(payload.status, HISTORY_STATUSES, 'open');
  const actorRole = coerceHistoryValue(payload.actorRole, HISTORY_ACTOR_ROLES, 'customer');
  const summary = sanitiseString(payload.summary);
  const actorId = sanitiseString(payload.actorId ? String(payload.actorId) : '') || null;
  const attachments = normaliseHistoryAttachments(payload.attachments);
  const meta = mergeHistoryMeta({}, payload.meta);

  const entry = await BookingHistoryEntry.create({
    bookingId,
    title,
    entryType,
    status,
    summary,
    actorId,
    actorRole,
    occurredAt,
    attachments,
    meta
  });

  return entry.toJSON();
}

export async function updateBookingHistoryEntry(bookingId, entryId, payload = {}) {
  if (!bookingId || !entryId) {
    throw invalidBooking('bookingId and entryId are required');
  }

  await assertBookingExists(bookingId);

  const entry = await BookingHistoryEntry.findOne({ where: { id: entryId, bookingId } });
  if (!entry) {
    const error = new Error('History entry not found');
    error.statusCode = 404;
    throw error;
  }

  const updates = {};

  if (payload.title !== undefined) {
    const title = sanitiseString(payload.title);
    if (!title) {
      throw invalidBooking('History entry title cannot be empty');
    }
    updates.title = title;
  }

  if (payload.entryType !== undefined) {
    updates.entryType = coerceHistoryValue(payload.entryType, HISTORY_ENTRY_TYPES, entry.entryType);
  }

  if (payload.status !== undefined) {
    updates.status = coerceHistoryValue(payload.status, HISTORY_STATUSES, entry.status);
  }

  if (payload.actorRole !== undefined) {
    updates.actorRole = coerceHistoryValue(payload.actorRole, HISTORY_ACTOR_ROLES, entry.actorRole);
  }

  if (payload.summary !== undefined) {
    updates.summary = sanitiseString(payload.summary);
  }

  if (payload.actorId !== undefined) {
    updates.actorId = sanitiseString(payload.actorId ? String(payload.actorId) : '') || null;
  }

  if (payload.occurredAt !== undefined) {
    updates.occurredAt = ensureDate(payload.occurredAt, 'occurredAt') || entry.occurredAt;
  }

  if (payload.attachments !== undefined) {
    updates.attachments = normaliseHistoryAttachments(payload.attachments);
  }

  if (payload.meta !== undefined) {
    updates.meta = mergeHistoryMeta(entry.meta, payload.meta);
  }

  await entry.update(updates);
  return entry.toJSON();
}

export async function deleteBookingHistoryEntry(bookingId, entryId) {
  if (!bookingId || !entryId) {
    throw invalidBooking('bookingId and entryId are required');
  }

  await assertBookingExists(bookingId);

  const entry = await BookingHistoryEntry.findOne({ where: { id: entryId, bookingId } });
  if (!entry) {
    const error = new Error('History entry not found');
    error.statusCode = 404;
    throw error;
  }

  await entry.destroy();
  return { id: entryId };
}
