import { Booking, BookingAssignment, BookingBid, BookingBidComment, sequelize } from '../models/index.js';
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

function normaliseChecklist(items = []) {
  if (!Array.isArray(items)) {
    return undefined;
  }

  const entries = items
    .map((item, index) => {
      if (!item) return null;
      const id = typeof item.id === 'string' && item.id.trim() ? item.id.trim() : `item-${index + 1}`;
      const label = typeof item.label === 'string' ? item.label.trim() : '';
      if (!label) {
        return null;
      }
      return {
        id,
        label,
        mandatory: item.mandatory === true
      };
    })
    .filter(Boolean);

  return entries;
}

function normaliseAttachments(items = []) {
  if (!Array.isArray(items)) {
    return undefined;
  }

  const entries = items
    .map((item) => {
      if (!item) return null;
      const label = typeof item.label === 'string' ? item.label.trim() : '';
      const url = typeof item.url === 'string' ? item.url.trim() : '';
      if (!label || !url) {
        return null;
      }
      return {
        label,
        url,
        type:
          typeof item.type === 'string' && item.type.trim() ? item.type.trim().toLowerCase() : 'document'
      };
    })
    .filter(Boolean);

  return entries;
}

function invalidBooking(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
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
  const where = {};
  if (filters.zoneId) {
    where.zoneId = filters.zoneId;
  }
  if (filters.status) {
    where.status = filters.status;
  }
  if (filters.companyId) {
    where.companyId = filters.companyId;
  }

  return Booking.findAll({ where, order: [['createdAt', 'DESC']] });
}

export async function getBookingById(id) {
  return Booking.findByPk(id, {
    include: [BookingAssignment, BookingBid]
  });
}

export async function updateBookingSchedule(bookingId, schedule = {}, context = {}) {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  const startProvided = Object.hasOwn(schedule, 'scheduledStart');
  const endProvided = Object.hasOwn(schedule, 'scheduledEnd');
  const slaProvided = Object.hasOwn(schedule, 'slaExpiresAt');

  const nextStart = startProvided
    ? schedule.scheduledStart
      ? ensureDate(schedule.scheduledStart, 'scheduledStart')
      : null
    : booking.scheduledStart;
  const nextEnd = endProvided
    ? schedule.scheduledEnd
      ? ensureDate(schedule.scheduledEnd, 'scheduledEnd')
      : null
    : booking.scheduledEnd;
  const nextSla = slaProvided
    ? schedule.slaExpiresAt
      ? ensureDate(schedule.slaExpiresAt, 'slaExpiresAt')
      : null
    : booking.slaExpiresAt;

  if (booking.type === 'scheduled') {
    if (!nextStart || !nextEnd || nextEnd <= nextStart) {
      throw invalidBooking('Scheduled bookings require a valid start and end window');
    }
  } else if (startProvided || endProvided) {
    throw invalidBooking('On-demand bookings cannot include scheduled windows');
  }

  const payload = {};
  if (startProvided) {
    payload.scheduledStart = nextStart;
  }
  if (endProvided) {
    payload.scheduledEnd = nextEnd;
  }
  if (slaProvided) {
    payload.slaExpiresAt = nextSla ?? booking.slaExpiresAt;
  }

  const meta = {
    ...booking.meta,
    schedule: {
      ...(booking.meta?.schedule || {}),
      updatedAt: new Date().toISOString(),
      updatedBy: context.actorId || null
    }
  };

  if (nextStart) {
    meta.schedule.start = nextStart.toISOString();
  }
  if (nextEnd) {
    meta.schedule.end = nextEnd.toISOString();
  }
  if (nextSla) {
    meta.schedule.slaExpiresAt = nextSla.toISOString();
  }

  await booking.update({ ...payload, meta });
  return booking.reload();
}

export async function updateBookingMetadata(bookingId, updates = {}, context = {}) {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  const meta = { ...booking.meta };
  const nextMeta = { ...meta };

  if (Object.hasOwn(updates, 'title')) {
    nextMeta.title =
      typeof updates.title === 'string' && updates.title.trim() ? updates.title.trim() : null;
  }

  if (Object.hasOwn(updates, 'summary')) {
    nextMeta.summary =
      typeof updates.summary === 'string' && updates.summary.trim() ? updates.summary.trim() : null;
  }

  if (Object.hasOwn(updates, 'instructions')) {
    nextMeta.instructions =
      typeof updates.instructions === 'string' && updates.instructions.trim()
        ? updates.instructions.trim()
        : null;
  }

  if (Object.hasOwn(updates, 'notes')) {
    nextMeta.notes =
      typeof updates.notes === 'string' && updates.notes.trim() ? updates.notes.trim() : null;
  }

  if (Object.hasOwn(updates, 'ownerName')) {
    nextMeta.ownerName =
      typeof updates.ownerName === 'string' && updates.ownerName.trim()
        ? updates.ownerName.trim()
        : null;
  }

  if (Object.hasOwn(updates, 'templateId')) {
    nextMeta.templateId = updates.templateId || null;
  }

  if (Object.hasOwn(updates, 'heroImageUrl')) {
    nextMeta.heroImageUrl =
      typeof updates.heroImageUrl === 'string' && updates.heroImageUrl.trim()
        ? updates.heroImageUrl.trim()
        : null;
  }

  if (Object.hasOwn(updates, 'images')) {
    nextMeta.images = Array.isArray(updates.images)
      ? updates.images
          .map((entry) => (typeof entry === 'string' ? entry.trim() : null))
          .filter(Boolean)
      : [];
  }

  const checklist = normaliseChecklist(updates.checklist);
  if (checklist !== undefined) {
    nextMeta.checklist = checklist;
  }

  const attachments = normaliseAttachments(updates.attachments);
  if (attachments !== undefined) {
    nextMeta.attachments = attachments;
  }

  if (Object.hasOwn(updates, 'demandLevel')) {
    if (typeof updates.demandLevel === 'string' && updates.demandLevel.trim()) {
      nextMeta.demandLevel = updates.demandLevel.trim().toLowerCase();
    }
  }

  if (Object.hasOwn(updates, 'tags')) {
    nextMeta.tags = Array.isArray(updates.tags)
      ? updates.tags
          .map((tag) => (typeof tag === 'string' ? tag.trim() : null))
          .filter(Boolean)
      : [];
  }

  if (Object.hasOwn(updates, 'autoAssignEnabled')) {
    nextMeta.autoAssignEnabled = Boolean(updates.autoAssignEnabled);
  }

  if (Object.hasOwn(updates, 'allowCustomerEdits')) {
    nextMeta.allowCustomerEdits = Boolean(updates.allowCustomerEdits);
  }

  if (updates.extraMetadata && typeof updates.extraMetadata === 'object' && !Array.isArray(updates.extraMetadata)) {
    nextMeta.extraMetadata = { ...(nextMeta.extraMetadata || {}), ...updates.extraMetadata };
  }

  nextMeta.lastEdited = {
    actorId: context.actorId || null,
    updatedAt: new Date().toISOString()
  };

  await booking.update({ meta: nextMeta });
  return booking.reload();
}
