import { Booking, BookingAssignment, BookingBid, BookingBidComment, BookingNote, User, sequelize } from '../models/index.js';
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

const ATTACHMENT_LIMIT = 10;
const ASSIGNMENT_ROLES = ['lead', 'support'];
const ASSIGNMENT_STATUSES = ['pending', 'accepted', 'declined', 'withdrawn'];

const assignmentInclude = [
  {
    model: User,
    as: 'provider',
    attributes: ['id', 'firstName', 'lastName', 'email', 'type']
  }
];

const toAssignmentRole = (role) => {
  if (!role) {
    return null;
  }
  const normalised = String(role).trim().toLowerCase();
  if (!ASSIGNMENT_ROLES.includes(normalised)) {
    throw invalidBooking('Unsupported assignment role');
  }
  return normalised;
};

const toAssignmentStatus = (status) => {
  if (!status) {
    return null;
  }
  const normalised = String(status).trim().toLowerCase();
  if (!ASSIGNMENT_STATUSES.includes(normalised)) {
    throw invalidBooking('Unsupported assignment status');
  }
  return normalised;
};

const reloadAssignment = (assignment, transaction) =>
  assignment.reload({ transaction, include: assignmentInclude });

function normaliseIdentifier(value) {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (value && typeof value.toString === 'function') {
    return value.toString().trim();
  }

  return '';
}

function sanitiseString(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim();
}

function normaliseAttachments(attachments) {
  if (!Array.isArray(attachments)) {
    return [];
  }

  const normalised = attachments
    .map((attachment) => {
      if (!attachment || typeof attachment !== 'object') {
        return null;
      }

      const url = sanitiseString(attachment.url);
      if (!url) {
        return null;
      }

      const label = sanitiseString(attachment.label) || 'Attachment';
      const type = sanitiseString(attachment.type) || 'link';

      return { url, label, type };
    })
    .filter(Boolean);

  return normalised.slice(0, ATTACHMENT_LIMIT);
}

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
  title,
  location,
  instructions,
  attachments = [],
  metadata = {},
  actor = null
}, { transaction: externalTransaction } = {}) {
  const customerIdentifier = normaliseIdentifier(customerId);
  const companyIdentifier = normaliseIdentifier(companyId);
  const zoneIdentifier = normaliseIdentifier(zoneId);

  if (!customerIdentifier || !companyIdentifier || !zoneIdentifier) {
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

  const normalisedTitle = sanitiseString(title) || sanitiseString(metadata.title) || null;
  const normalisedLocation = sanitiseString(location) || sanitiseString(metadata.location) || null;
  const normalisedInstructions = sanitiseString(instructions) || sanitiseString(metadata.instructions) || null;
  const metaAttachments = normaliseAttachments(
    attachments && attachments.length ? attachments : metadata.attachments
  );

  if (bookingType === 'scheduled' && (!startAt || !endAt || endAt <= startAt)) {
    throw invalidBooking('Scheduled bookings require a valid start and end window');
  }

  if (bookingType === 'on_demand' && (startAt || endAt)) {
    throw invalidBooking('On-demand bookings cannot provide schedule windows');
  }

  const execute = async (transaction) => {
    const booking = await Booking.create(
      {
        customerId: customerIdentifier,
        companyId: companyIdentifier,
        zoneId: zoneIdentifier,
        title: normalisedTitle,
        location: normalisedLocation,
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
        instructions: normalisedInstructions,
        meta: {
          ...metadata,
          title: normalisedTitle ?? undefined,
          location: normalisedLocation ?? undefined,
          instructions: normalisedInstructions ?? undefined,
          attachments: metaAttachments,
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
        tenantId: companyIdentifier,
        occurredAt: now,
        metadata: {
          bookingId: booking.id,
          companyId: companyIdentifier,
          zoneId: zoneIdentifier,
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

export async function updateBooking(bookingId, updates = {}) {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  const {
    status,
    actorId,
    statusReason,
    metadata,
    attachments,
    scheduledStart,
    scheduledEnd,
    title,
    location,
    instructions,
    demandLevel,
    zoneId
  } = updates;

  const patch = {};
  let meta = { ...booking.meta };
  let statusChanged = false;
  let metaChanged = false;

  if (title !== undefined) {
    const normalisedTitle = sanitiseString(title);
    patch.title = normalisedTitle || null;
    meta = { ...meta, title: normalisedTitle || undefined };
    metaChanged = true;
  }

  if (location !== undefined) {
    const normalisedLocation = sanitiseString(location);
    patch.location = normalisedLocation || null;
    meta = { ...meta, location: normalisedLocation || undefined };
    metaChanged = true;
  }

  if (instructions !== undefined) {
    const normalisedInstructions = sanitiseString(instructions);
    patch.instructions = normalisedInstructions || null;
    meta = { ...meta, instructions: normalisedInstructions || undefined };
    metaChanged = true;
  }

  if (scheduledStart !== undefined) {
    patch.scheduledStart = ensureDate(scheduledStart, 'scheduledStart');
  }

  if (scheduledEnd !== undefined) {
    patch.scheduledEnd = ensureDate(scheduledEnd, 'scheduledEnd');
  }

  if (Array.isArray(attachments)) {
    meta = { ...meta, attachments: normaliseAttachments(attachments) };
    metaChanged = true;
  }

  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    meta = { ...meta, ...metadata };
    metaChanged = true;
  }

  if (demandLevel) {
    meta = { ...meta, demandLevel: sanitiseString(demandLevel) || meta.demandLevel };
    metaChanged = true;
  }

  if (zoneId !== undefined) {
    const nextZoneId = normaliseIdentifier(zoneId);
    if (!nextZoneId) {
      throw invalidBooking('Zone is required');
    }
    patch.zoneId = nextZoneId;
  }

  const now = new Date();

  if (status && status !== booking.status) {
    assertTransition(booking.status, status);
    patch.status = status;
    patch.lastStatusTransitionAt = now;
    statusChanged = true;
    meta = {
      ...meta,
      lastStatusContext: {
        actorId: actorId || null,
        reason: sanitiseString(statusReason),
        updatedAt: now.toISOString()
      }
    };
    metaChanged = true;
  }

  if (Object.keys(patch).length === 0 && !statusChanged && !metaChanged) {
    return booking;
  }

  if (metaChanged || statusChanged) {
    patch.meta = meta;
  }

  const result = await sequelize.transaction(async (transaction) => {
    await booking.update(patch, { transaction });
    const reloaded = await booking.reload({ transaction });

    if (statusChanged) {
      await recordAnalyticsEvent(
        {
          name: 'booking.status_transition',
          entityId: reloaded.id,
          actor: actorId ? { id: actorId, type: 'user' } : null,
          tenantId: reloaded.companyId,
          occurredAt: now,
          metadata: {
            bookingId: reloaded.id,
            companyId: reloaded.companyId,
            fromStatus: booking.status,
            toStatus: status,
            reason: sanitiseString(statusReason) || null,
            zoneId: reloaded.zoneId,
            type: reloaded.type
          }
        },
        { transaction }
      );
    }

    return reloaded;
  });

  return result;
}

export async function listBookingNotes(bookingId) {
  return BookingNote.findAll({
    where: { bookingId },
    order: [
      ['isPinned', 'DESC'],
      ['createdAt', 'DESC']
    ]
  });
}

export async function createBookingNote(bookingId, payload = {}) {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  const body = sanitiseString(payload.body);
  if (!body) {
    throw invalidBooking('Note body is required');
  }

  const attachments = normaliseAttachments(payload.attachments);

  return BookingNote.create({
    bookingId,
    authorId: payload.authorId || null,
    authorType: sanitiseString(payload.authorType) || null,
    body,
    attachments,
    isPinned: Boolean(payload.isPinned)
  });
}

export async function updateBookingNote(bookingId, noteId, updates = {}) {
  const note = await BookingNote.findOne({ where: { id: noteId, bookingId } });
  if (!note) {
    const error = new Error('Booking note not found');
    error.statusCode = 404;
    throw error;
  }

  const patch = {};

  if (updates.body !== undefined) {
    const body = sanitiseString(updates.body);
    if (!body) {
      throw invalidBooking('Note body cannot be empty');
    }
    patch.body = body;
  }

  if (updates.attachments !== undefined) {
    patch.attachments = normaliseAttachments(updates.attachments);
  }

  if (updates.isPinned !== undefined) {
    patch.isPinned = Boolean(updates.isPinned);
  }

  if (updates.authorType !== undefined) {
    patch.authorType = sanitiseString(updates.authorType) || null;
  }

  if (Object.keys(patch).length === 0) {
    return note;
  }

  await note.update(patch);
  return note.reload();
}

export async function deleteBookingNote(bookingId, noteId) {
  const note = await BookingNote.findOne({ where: { id: noteId, bookingId } });
  if (!note) {
    const error = new Error('Booking note not found');
    error.statusCode = 404;
    throw error;
  }

  await note.destroy();
  return { id: noteId };
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

      const role = toAssignmentRole(assignment.role) || 'support';
      const providerId = assignment.providerId;

      const existing = await BookingAssignment.findOne({
        where: { bookingId, providerId },
        transaction,
        lock: transaction.LOCK.UPDATE
      });

      if (existing) {
        results.push(await reloadAssignment(existing, transaction));
        continue;
      }

      const created = await BookingAssignment.create(
        {
          bookingId,
          providerId,
          role,
          status: 'pending',
          assignedAt: now,
          acknowledgedAt: null
        },
        { transaction }
      );
      const hydrated = await reloadAssignment(created, transaction);
      results.push(hydrated);

      assignmentEvents.push({
        name: 'booking.assignment.created',
        entityId: hydrated.id,
        actor: actorId ? { id: actorId, type: 'user' } : null,
        tenantId: booking.companyId,
        occurredAt: hydrated.assignedAt || now,
        metadata: {
          assignmentId: hydrated.id,
          bookingId,
          companyId: booking.companyId,
          providerId,
          role: hydrated.role,
          status: hydrated.status
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

export async function listBookingAssignments(bookingId) {
  const booking = await Booking.findByPk(bookingId);
  if (!booking) {
    const error = new Error('Booking not found');
    error.statusCode = 404;
    throw error;
  }

  return BookingAssignment.findAll({
    where: { bookingId },
    include: assignmentInclude,
    order: [['assignedAt', 'ASC']]
  });
}

export async function updateBookingAssignment(bookingId, assignmentId, updates = {}, actorId) {
  if (!updates || (updates.role === undefined && updates.status === undefined)) {
    throw invalidBooking('An assignment update must include a role or status');
  }

  return sequelize.transaction(async (transaction) => {
    const assignment = await BookingAssignment.findOne({
      where: { id: assignmentId, bookingId },
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

    const patch = {};
    const now = new Date();
    let statusChanged = false;

    if (updates.role !== undefined) {
      const nextRole = toAssignmentRole(updates.role);
      if (nextRole && nextRole !== assignment.role) {
        patch.role = nextRole;
      }
    }

    if (updates.status !== undefined) {
      const nextStatus = toAssignmentStatus(updates.status);
      if (nextStatus && nextStatus !== assignment.status) {
        patch.status = nextStatus;
        patch.acknowledgedAt = nextStatus === 'accepted' ? now : assignment.acknowledgedAt;
        statusChanged = true;
      }
    }

    if (Object.keys(patch).length === 0) {
      return reloadAssignment(assignment, transaction);
    }

    await assignment.update(patch, { transaction });

    if (statusChanged && patch.status === 'accepted') {
      await refreshBookingAfterAcceptance(booking, transaction, { providerId: assignment.providerId });
    }

    await recordAnalyticsEvent(
      {
        name: 'booking.assignment.updated',
        entityId: assignment.id,
        actor: actorId ? { id: actorId, type: 'user' } : null,
        tenantId: booking.companyId,
        occurredAt: now,
        metadata: {
          assignmentId: assignment.id,
          bookingId,
          companyId: booking.companyId,
          ...(patch.role ? { role: patch.role } : {}),
          ...(patch.status ? { status: patch.status } : {})
        }
      },
      { transaction }
    );

    return reloadAssignment(assignment, transaction);
  });
}

export async function removeBookingAssignment(bookingId, assignmentId, actorId) {
  return sequelize.transaction(async (transaction) => {
    const assignment = await BookingAssignment.findOne({
      where: { id: assignmentId, bookingId },
      transaction,
      lock: transaction.LOCK.UPDATE,
      include: assignmentInclude
    });

    if (!assignment) {
      const error = new Error('Assignment not found');
      error.statusCode = 404;
      throw error;
    }

    const booking = await Booking.findByPk(bookingId, { transaction });
    if (!booking) {
      const error = new Error('Booking not found');
      error.statusCode = 404;
      throw error;
    }

    await assignment.destroy({ transaction });

    await recordAnalyticsEvent(
      {
        name: 'booking.assignment.removed',
        entityId: assignmentId,
        actor: actorId ? { id: actorId, type: 'user' } : null,
        tenantId: booking.companyId,
        occurredAt: new Date(),
        metadata: {
          assignmentId,
          bookingId,
          companyId: booking.companyId,
          providerId: assignment.providerId,
          role: assignment.role,
          status: assignment.status
        }
      },
      { transaction }
    );

    return { id: assignmentId };
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

    const refreshedAssignment = await reloadAssignment(assignment, transaction);
    const refreshedBooking = await booking.reload({
      transaction,
      include: [{ model: BookingAssignment, include: assignmentInclude }]
    });

    return { assignment: refreshedAssignment, booking: refreshedBooking };
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
    include: [
      { model: BookingAssignment, include: assignmentInclude },
      BookingBid
    ]
  });
}
