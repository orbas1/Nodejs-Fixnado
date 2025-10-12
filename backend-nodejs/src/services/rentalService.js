import {
  Booking,
  InventoryItem,
  RentalAgreement,
  RentalCheckpoint,
  sequelize
} from '../models/index.js';
import { recordInventoryAdjustment } from './inventoryService.js';
import { recordAnalyticsEvent } from './analyticsEventService.js';

const RENTAL_STATUS_TRANSITIONS = {
  requested: ['approved', 'cancelled'],
  approved: ['pickup_scheduled', 'in_use', 'cancelled'],
  pickup_scheduled: ['in_use', 'cancelled'],
  in_use: ['inspection_pending', 'disputed'],
  inspection_pending: ['settled', 'disputed'],
  settled: [],
  cancelled: [],
  disputed: []
};

function rentalError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function assertStatusTransition(current, next) {
  const allowed = RENTAL_STATUS_TRANSITIONS[current];
  if (!allowed || !allowed.includes(next)) {
    throw rentalError(`Rental status transition ${current} -> ${next} is not permitted`);
  }
}

function ensureDate(value, fieldName, { allowNull = false } = {}) {
  if (!value) {
    if (allowNull) {
      return null;
    }
    throw rentalError(`${fieldName} is required`);
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw rentalError(`Invalid date provided for ${fieldName}`);
  }
  return date;
}

function generateRentalNumber(companyId) {
  const shortCompany = (companyId || '').replace(/[^A-Z0-9]/gi, '').slice(0, 4).toUpperCase();
  return `RA-${shortCompany || 'FX'}-${Date.now().toString(36).toUpperCase()}`;
}

function resolveRentalActor(actorId, actorRole) {
  if (!actorId) {
    return actorRole ? { type: actorRole } : null;
  }

  return {
    id: actorId,
    type: actorRole || 'system'
  };
}

async function addCheckpoint(rental, { type, description, recordedBy, recordedByRole, payload = {} }, transaction) {
  return RentalCheckpoint.create(
    {
      rentalAgreementId: rental.id,
      type,
      description,
      recordedBy,
      recordedByRole,
      occurredAt: new Date(),
      payload
    },
    { transaction }
  );
}

async function emitRentalStatusTransition({
  rental,
  previousStatus,
  nextStatus,
  actorId,
  actorRole,
  reason = null,
  occurredAt = new Date(),
  metadata = {},
  transaction
}) {
  if (previousStatus === nextStatus) {
    return;
  }

  await recordAnalyticsEvent(
    {
      name: 'rental.status_transition',
      entityId: rental.id,
      actor: resolveRentalActor(actorId, actorRole),
      tenantId: rental.companyId,
      occurredAt,
      metadata: {
        rentalId: rental.id,
        companyId: rental.companyId,
        bookingId: rental.bookingId,
        itemId: rental.itemId,
        fromStatus: previousStatus,
        toStatus: nextStatus,
        reason,
        ...metadata
      }
    },
    { transaction }
  );
}

function calculateRentalDurationDays(start, end) {
  const startTime = start?.getTime();
  const endTime = end?.getTime();
  if (!startTime || !endTime || endTime <= startTime) {
    return 1;
  }
  const diff = endTime - startTime;
  return Math.max(1, Math.ceil(diff / (24 * 60 * 60 * 1000)));
}

function sumCharges(charges = []) {
  return charges.reduce(
    (acc, charge) => ({
      amount: acc.amount + (Number(charge.amount) || 0),
      currency: charge.currency || acc.currency || null
    }),
    { amount: 0, currency: null }
  );
}

export async function requestRentalAgreement({
  itemId,
  renterId,
  bookingId = null,
  marketplaceItemId = null,
  quantity = 1,
  rentalStart,
  rentalEnd,
  notes = null,
  actorId,
  actorRole = 'customer'
}) {
  if (!itemId || !renterId) {
    throw rentalError('itemId and renterId are required');
  }
  if (quantity <= 0) {
    throw rentalError('quantity must be a positive integer');
  }

  const startAt = rentalStart ? ensureDate(rentalStart, 'rentalStart', { allowNull: true }) : null;
  const endAt = rentalEnd ? ensureDate(rentalEnd, 'rentalEnd', { allowNull: true }) : null;
  if (startAt && endAt && endAt <= startAt) {
    throw rentalError('rentalEnd must be after rentalStart');
  }

  return sequelize.transaction(async (transaction) => {
    const item = await InventoryItem.findByPk(itemId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!item) {
      throw rentalError('Inventory item not found', 404);
    }

    const available = item.quantityOnHand - item.quantityReserved;
    if (available < quantity) {
      throw rentalError('Insufficient inventory available to rent', 409);
    }

    const rentalNumber = generateRentalNumber(item.companyId);
    const rental = await RentalAgreement.create(
      {
        rentalNumber,
        itemId: item.id,
        marketplaceItemId,
        companyId: item.companyId,
        renterId,
        bookingId,
        quantity,
        rentalStartAt: startAt,
        rentalEndAt: endAt,
        depositAmount: item.depositAmount,
        depositCurrency: item.depositCurrency,
        dailyRate: item.rentalRate,
        rateCurrency: item.rentalRateCurrency,
        meta: {
          notes: notes || null,
          createdBy: actorId || null,
          createdByRole: actorRole
        }
      },
      { transaction }
    );

    await recordAnalyticsEvent(
      {
        name: 'rental.requested',
        entityId: rental.id,
        actor: resolveRentalActor(actorId, actorRole),
        tenantId: item.companyId,
        occurredAt: rental.createdAt || new Date(),
        metadata: {
          rentalId: rental.id,
          companyId: item.companyId,
          itemId: item.id,
          bookingId,
          quantity,
          rentalStartAt: startAt ? startAt.toISOString() : null,
          rentalEndAt: endAt ? endAt.toISOString() : null,
          depositAmount: item.depositAmount ? Number(item.depositAmount) : 0,
          currency: item.rentalRateCurrency || item.depositCurrency || null
        }
      },
      { transaction }
    );

    await recordInventoryAdjustment(
      {
        itemId: item.id,
        quantity,
        type: 'reservation',
        actorId,
        source: 'system',
        reference: { id: rental.id, type: 'rental_agreement' },
        metadata: { action: 'reservation' }
      },
      transaction
    );

    await addCheckpoint(
      rental,
      {
        type: 'status_change',
        description: 'Rental requested',
        recordedBy: actorId || renterId,
        recordedByRole: actorRole,
        payload: { quantity, rentalStart: startAt, rentalEnd: endAt }
      },
      transaction
    );

    return rental.reload({ transaction });
  });
}

export async function approveRentalAgreement(rentalId, { actorId, actorRole = 'provider', approvalNotes = null }) {
  return sequelize.transaction(async (transaction) => {
    const rental = await RentalAgreement.findByPk(rentalId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!rental) {
      throw rentalError('Rental agreement not found', 404);
    }
    if (rental.status !== 'requested') {
      throw rentalError('Rental can only be approved from requested status', 409);
    }

    assertStatusTransition(rental.status, 'approved');

    const previousStatus = rental.status;
    const now = new Date();
    await rental.update(
      {
        status: 'approved',
        lastStatusTransitionAt: now,
        meta: {
          ...rental.meta,
          approvalNotes,
          approvedBy: actorId || null,
          approvedAt: now.toISOString()
        }
      },
      { transaction }
    );

    await emitRentalStatusTransition({
      rental,
      previousStatus,
      nextStatus: 'approved',
      actorId,
      actorRole,
      occurredAt: now,
      metadata: { approvalNotes },
      transaction
    });

    await addCheckpoint(
      rental,
      {
        type: 'status_change',
        description: 'Rental approved',
        recordedBy: actorId,
        recordedByRole: actorRole,
        payload: { notes: approvalNotes }
      },
      transaction
    );

    return rental;
  });
}

export async function scheduleRentalPickup(rentalId, { actorId, actorRole = 'provider', pickupAt, returnDueAt, logisticsNotes = null }) {
  const pickupDate = ensureDate(pickupAt, 'pickupAt');
  const dueDate = ensureDate(returnDueAt, 'returnDueAt');
  if (dueDate <= pickupDate) {
    throw rentalError('returnDueAt must be after pickupAt');
  }

  return sequelize.transaction(async (transaction) => {
    const rental = await RentalAgreement.findByPk(rentalId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!rental) {
      throw rentalError('Rental agreement not found', 404);
    }
    if (!['approved', 'pickup_scheduled'].includes(rental.status)) {
      throw rentalError('Pickup can only be scheduled for approved rentals', 409);
    }

    const nextStatus = 'pickup_scheduled';
    assertStatusTransition(rental.status, nextStatus);

    const previousStatus = rental.status;
    const now = new Date();

    await rental.update(
      {
        status: nextStatus,
        pickupAt: pickupDate,
        returnDueAt: dueDate,
        lastStatusTransitionAt: now,
        meta: {
          ...rental.meta,
          logisticsNotes,
          scheduledBy: actorId || null,
          scheduledAt: now.toISOString()
        }
      },
      { transaction }
    );

    await emitRentalStatusTransition({
      rental,
      previousStatus,
      nextStatus,
      actorId,
      actorRole,
      occurredAt: now,
      metadata: {
        pickupAt: pickupDate.toISOString(),
        returnDueAt: dueDate.toISOString()
      },
      transaction
    });

    await addCheckpoint(
      rental,
      {
        type: 'handover',
        description: 'Pickup scheduled',
        recordedBy: actorId,
        recordedByRole: actorRole,
        payload: { pickupAt: pickupDate, returnDueAt: dueDate, notes: logisticsNotes }
      },
      transaction
    );

    return rental;
  });
}

export async function recordRentalCheckout(rentalId, { actorId, actorRole = 'provider', conditionOut = {}, rentalStartAt = null, handoverNotes = null }) {
  return sequelize.transaction(async (transaction) => {
    const rental = await RentalAgreement.findByPk(rentalId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!rental) {
      throw rentalError('Rental agreement not found', 404);
    }
    if (!['approved', 'pickup_scheduled'].includes(rental.status)) {
      throw rentalError('Checkout can only occur from approved or pickup_scheduled status', 409);
    }

    const nextStatus = 'in_use';
    assertStatusTransition(rental.status, nextStatus);

    const startAt = rentalStartAt ? ensureDate(rentalStartAt, 'rentalStartAt') : rental.pickupAt || new Date();
    const previousStatus = rental.status;
    const now = new Date();

    await recordInventoryAdjustment(
      {
        itemId: rental.itemId,
        quantity: rental.quantity,
        type: 'checkout',
        actorId,
        source: 'system',
        reference: { id: rental.id, type: 'rental_agreement' },
        metadata: { action: 'checkout' }
      },
      transaction
    );

    const depositStatus = rental.depositAmount ? 'held' : rental.depositStatus;

    await rental.update(
      {
        status: nextStatus,
        rentalStartAt: startAt,
        depositStatus,
        conditionOut: { ...conditionOut },
        lastStatusTransitionAt: now,
        meta: {
          ...rental.meta,
          handoverNotes,
          checkedOutBy: actorId || null,
          checkedOutAt: now.toISOString()
        }
      },
      { transaction }
    );

    await emitRentalStatusTransition({
      rental,
      previousStatus,
      nextStatus,
      actorId,
      actorRole,
      occurredAt: now,
      metadata: {
        rentalStartAt: startAt.toISOString(),
        depositStatus
      },
      transaction
    });

    await addCheckpoint(
      rental,
      {
        type: 'handover',
        description: 'Rental checked out',
        recordedBy: actorId,
        recordedByRole: actorRole,
        payload: { conditionOut, startAt, notes: handoverNotes }
      },
      transaction
    );

    return rental;
  });
}

export async function markRentalReturned(rentalId, { actorId, actorRole = 'customer', conditionIn = {}, returnedAt = null, notes = null }) {
  return sequelize.transaction(async (transaction) => {
    const rental = await RentalAgreement.findByPk(rentalId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!rental) {
      throw rentalError('Rental agreement not found', 404);
    }
    if (rental.status !== 'in_use') {
      throw rentalError('Rental must be in use before it can be returned', 409);
    }

    const nextStatus = 'inspection_pending';
    assertStatusTransition(rental.status, nextStatus);

    const returnAt = returnedAt ? ensureDate(returnedAt, 'returnedAt') : new Date();
    const previousStatus = rental.status;

    await recordInventoryAdjustment(
      {
        itemId: rental.itemId,
        quantity: rental.quantity,
        type: 'return',
        actorId,
        source: 'system',
        reference: { id: rental.id, type: 'rental_agreement' },
        metadata: { action: 'return' }
      },
      transaction
    );

    await rental.update(
      {
        status: nextStatus,
        returnedAt: returnAt,
        conditionIn: { ...conditionIn },
        lastStatusTransitionAt: returnAt,
        meta: {
          ...rental.meta,
          returnNotes: notes,
          returnedBy: actorId || null,
          returnedAt: returnAt.toISOString()
        }
      },
      { transaction }
    );

    await emitRentalStatusTransition({
      rental,
      previousStatus,
      nextStatus,
      actorId,
      actorRole,
      occurredAt: returnAt,
      metadata: {
        returnedAt: returnAt.toISOString()
      },
      transaction
    });

    await addCheckpoint(
      rental,
      {
        type: 'return',
        description: 'Rental returned',
        recordedBy: actorId,
        recordedByRole: actorRole,
        payload: { conditionIn, returnedAt: returnAt, notes }
      },
      transaction
    );

    return rental;
  });
}

export async function completeRentalInspection(rentalId, { actorId, actorRole = 'provider', outcome = 'clear', charges = [], inspectionNotes = null }) {
  if (!['clear', 'damaged', 'partial'].includes(outcome)) {
    throw rentalError('Inspection outcome must be clear, damaged, or partial');
  }

  return sequelize.transaction(async (transaction) => {
    const rental = await RentalAgreement.findByPk(rentalId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!rental) {
      throw rentalError('Rental agreement not found', 404);
    }
    if (rental.status !== 'inspection_pending') {
      throw rentalError('Inspection can only be completed when rental is pending inspection', 409);
    }

    const nextStatus = 'settled';
    assertStatusTransition(rental.status, nextStatus);

    const rentalStart = rental.rentalStartAt ? new Date(rental.rentalStartAt) : rental.pickupAt ? new Date(rental.pickupAt) : new Date();
    const rentalEnd = rental.returnedAt ? new Date(rental.returnedAt) : new Date();
    const durationDays = calculateRentalDurationDays(rentalStart, rentalEnd);
    const dailyRate = Number(rental.dailyRate || 0);
    const baseCharge = dailyRate * durationDays;

    const aggregatedCharges = sumCharges(charges);
    const totalCharges = baseCharge + aggregatedCharges.amount;

    let depositStatus = rental.depositStatus;
    if (rental.depositAmount) {
      if (aggregatedCharges.amount <= 0) {
        depositStatus = 'released';
      } else if (aggregatedCharges.amount < Number(rental.depositAmount)) {
        depositStatus = 'partially_released';
      } else {
        depositStatus = 'forfeited';
      }
    }

    const previousStatus = rental.status;
    const now = new Date();

    await rental.update(
      {
        status: nextStatus,
        depositStatus,
        lastStatusTransitionAt: now,
        meta: {
          ...rental.meta,
          inspection: {
            outcome,
            inspectionNotes,
            inspectedBy: actorId || null,
            inspectedAt: now.toISOString()
          },
          charges: {
            baseCharge,
            additional: charges,
            durationDays,
            total: totalCharges,
            currency: rental.rateCurrency || aggregatedCharges.currency
          }
        }
      },
      { transaction }
    );

    await emitRentalStatusTransition({
      rental,
      previousStatus,
      nextStatus,
      actorId,
      actorRole,
      occurredAt: now,
      metadata: {
        inspectionOutcome: outcome,
        totalCharges,
        currency: rental.rateCurrency || aggregatedCharges.currency
      },
      transaction
    });

    await recordAnalyticsEvent(
      {
        name: 'rental.inspection.completed',
        entityId: rental.id,
        actor: resolveRentalActor(actorId, actorRole),
        tenantId: rental.companyId,
        occurredAt: now,
        metadata: {
          rentalId: rental.id,
          companyId: rental.companyId,
          outcome,
          totalCharges,
          currency: rental.rateCurrency || aggregatedCharges.currency,
          durationDays
        }
      },
      { transaction }
    );

    await addCheckpoint(
      rental,
      {
        type: 'inspection',
        description: 'Inspection completed',
        recordedBy: actorId,
        recordedByRole: actorRole,
        payload: {
          outcome,
          charges,
          durationDays,
          baseCharge,
          totalCharges,
          currency: rental.rateCurrency || aggregatedCharges.currency
        }
      },
      transaction
    );

    return rental;
  });
}

export async function cancelRentalAgreement(rentalId, { actorId, actorRole = 'provider', reason = null }) {
  return sequelize.transaction(async (transaction) => {
    const rental = await RentalAgreement.findByPk(rentalId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!rental) {
      throw rentalError('Rental agreement not found', 404);
    }
    if (!['requested', 'approved', 'pickup_scheduled'].includes(rental.status)) {
      throw rentalError('Rental can only be cancelled before checkout', 409);
    }

    assertStatusTransition(rental.status, 'cancelled');

    const previousStatus = rental.status;
    const now = new Date();

    if (rental.status !== 'cancelled') {
      await recordInventoryAdjustment(
        {
          itemId: rental.itemId,
          quantity: rental.quantity,
          type: 'reservation_release',
          actorId,
          source: 'system',
          reference: { id: rental.id, type: 'rental_agreement' },
          metadata: { action: 'cancel' }
        },
        transaction
      );
    }

    await rental.update(
      {
        status: 'cancelled',
        depositStatus: rental.depositAmount ? 'released' : rental.depositStatus,
        cancellationReason: reason,
        lastStatusTransitionAt: now,
        meta: {
          ...rental.meta,
          cancelledBy: actorId || null,
          cancelledAt: now.toISOString(),
          cancellationReason: reason
        }
      },
      { transaction }
    );

    await emitRentalStatusTransition({
      rental,
      previousStatus,
      nextStatus: 'cancelled',
      actorId,
      actorRole,
      occurredAt: now,
      metadata: { reason },
      transaction
    });

    await addCheckpoint(
      rental,
      {
        type: 'status_change',
        description: 'Rental cancelled',
        recordedBy: actorId,
        recordedByRole: actorRole,
        payload: { reason }
      },
      transaction
    );

    return rental;
  });
}

export function listRentalAgreements({ companyId, renterId, status, limit = 50, offset = 0 } = {}) {
  const where = {};
  if (companyId) {
    where.companyId = companyId;
  }
  if (renterId) {
    where.renterId = renterId;
  }
  if (status) {
    where.status = status;
  }

  return RentalAgreement.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    include: [
      InventoryItem,
      { model: Booking, required: false },
      { model: RentalCheckpoint, separate: true, order: [['occurredAt', 'ASC']] }
    ]
  });
}

export function getRentalAgreementById(rentalId) {
  return RentalAgreement.findByPk(rentalId, {
    include: [
      InventoryItem,
      { model: Booking, required: false },
      { model: RentalCheckpoint, separate: true, order: [['occurredAt', 'ASC']] }
    ]
  });
}

export async function appendRentalCheckpoint(rentalId, payload) {
  const rental = await RentalAgreement.findByPk(rentalId);
  if (!rental) {
    throw rentalError('Rental agreement not found', 404);
  }
  return addCheckpoint(rental, payload, undefined);
}
