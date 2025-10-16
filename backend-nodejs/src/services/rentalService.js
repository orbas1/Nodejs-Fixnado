import { Op } from 'sequelize';
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
  settled: ['disputed'],
  cancelled: [],
  disputed: []
};

const DEPOSIT_STATUSES = new Set(['pending', 'held', 'released', 'forfeited', 'partially_released']);
const RENTAL_DETAIL_INCLUDE = [
  {
    model: InventoryItem,
    attributes: [
      'id',
      'name',
      'sku',
      'rentalRate',
      'rentalRateCurrency',
      'depositAmount',
      'depositCurrency',
      'quantityOnHand',
      'quantityReserved',
      'safetyStock'
    ],
    required: false
  },
  { model: Booking, required: false },
  { model: RentalCheckpoint, separate: true, order: [['occurredAt', 'ASC']] }
];

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

    return rental.reload({ transaction, include: RENTAL_DETAIL_INCLUDE });
  });
}

function cloneMetadata(meta) {
  if (!meta || typeof meta !== 'object') {
    return {};
  }

  try {
    return JSON.parse(JSON.stringify(meta));
  } catch (_error) {
    return {};
  }
}

function toIsoOrNull(value) {
  if (!value) {
    return null;
  }

  try {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  } catch (_error) {
    return null;
  }
}

export async function updateRentalAgreementDetails(
  rentalId,
  {
    actorId,
    actorRole = 'admin',
    rentalStartAt,
    rentalEndAt,
    pickupAt,
    returnDueAt,
    depositAmount,
    depositCurrency,
    depositStatus,
    dailyRate,
    rateCurrency,
    notes,
    logisticsNotes,
    bookingId,
    marketplaceItemId,
    regionId,
    renterId,
    companyId,
    meta: metaOverrides
  }
) {
  return sequelize.transaction(async (transaction) => {
    const rental = await RentalAgreement.findByPk(rentalId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });

    if (!rental) {
      throw rentalError('Rental agreement not found', 404);
    }

    const updates = {};
    const changeLog = {};

    let nextRentalStart = rental.rentalStartAt ? new Date(rental.rentalStartAt) : null;
    if (rentalStartAt !== undefined) {
      nextRentalStart = rentalStartAt ? ensureDate(rentalStartAt, 'rentalStartAt', { allowNull: true }) : null;
      const previous = rental.rentalStartAt ? new Date(rental.rentalStartAt) : null;
      const previousIso = toIsoOrNull(previous);
      const nextIso = toIsoOrNull(nextRentalStart);
      if (previousIso !== nextIso) {
        updates.rentalStartAt = nextRentalStart;
        changeLog.rentalStartAt = { previous: previousIso, next: nextIso };
      }
    }

    let nextRentalEnd = rental.rentalEndAt ? new Date(rental.rentalEndAt) : null;
    if (rentalEndAt !== undefined) {
      nextRentalEnd = rentalEndAt ? ensureDate(rentalEndAt, 'rentalEndAt', { allowNull: true }) : null;
      const previous = rental.rentalEndAt ? new Date(rental.rentalEndAt) : null;
      const previousIso = toIsoOrNull(previous);
      const nextIso = toIsoOrNull(nextRentalEnd);
      if (previousIso !== nextIso) {
        updates.rentalEndAt = nextRentalEnd;
        changeLog.rentalEndAt = { previous: previousIso, next: nextIso };
      }
    }

    let nextPickupAt = rental.pickupAt ? new Date(rental.pickupAt) : null;
    if (pickupAt !== undefined) {
      nextPickupAt = pickupAt ? ensureDate(pickupAt, 'pickupAt', { allowNull: true }) : null;
      const previous = rental.pickupAt ? new Date(rental.pickupAt) : null;
      const previousIso = toIsoOrNull(previous);
      const nextIso = toIsoOrNull(nextPickupAt);
      if (previousIso !== nextIso) {
        updates.pickupAt = nextPickupAt;
        changeLog.pickupAt = { previous: previousIso, next: nextIso };
      }
    }

    let nextReturnDue = rental.returnDueAt ? new Date(rental.returnDueAt) : null;
    if (returnDueAt !== undefined) {
      nextReturnDue = returnDueAt ? ensureDate(returnDueAt, 'returnDueAt', { allowNull: true }) : null;
      const previous = rental.returnDueAt ? new Date(rental.returnDueAt) : null;
      const previousIso = toIsoOrNull(previous);
      const nextIso = toIsoOrNull(nextReturnDue);
      if (previousIso !== nextIso) {
        updates.returnDueAt = nextReturnDue;
        changeLog.returnDueAt = { previous: previousIso, next: nextIso };
      }
    }

    if (nextRentalStart && nextRentalEnd && nextRentalEnd <= nextRentalStart) {
      throw rentalError('rentalEndAt must be after rentalStartAt');
    }

    if (nextPickupAt && nextReturnDue && nextReturnDue <= nextPickupAt) {
      throw rentalError('returnDueAt must be after pickupAt');
    }

    if (depositAmount !== undefined) {
      const next = depositAmount === null || depositAmount === '' ? null : Number(depositAmount);
      if (next !== null && !Number.isFinite(next)) {
        throw rentalError('depositAmount must be a valid number');
      }
      const previous = rental.depositAmount != null ? Number(rental.depositAmount) : null;
      if (previous !== next) {
        updates.depositAmount = next;
        changeLog.depositAmount = { previous, next };
      }
    }

    if (dailyRate !== undefined) {
      const next = dailyRate === null || dailyRate === '' ? null : Number(dailyRate);
      if (next !== null && !Number.isFinite(next)) {
        throw rentalError('dailyRate must be a valid number');
      }
      const previous = rental.dailyRate != null ? Number(rental.dailyRate) : null;
      if (previous !== next) {
        updates.dailyRate = next;
        changeLog.dailyRate = { previous, next };
      }
    }

    if (depositCurrency !== undefined) {
      const next = depositCurrency ? String(depositCurrency).trim().toUpperCase() : null;
      if (next && next.length !== 3) {
        throw rentalError('depositCurrency must be a 3-letter ISO code');
      }
      const previous = rental.depositCurrency || null;
      if (previous !== next) {
        updates.depositCurrency = next;
        changeLog.depositCurrency = { previous, next };
      }
    }

    if (rateCurrency !== undefined) {
      const next = rateCurrency ? String(rateCurrency).trim().toUpperCase() : null;
      if (next && next.length !== 3) {
        throw rentalError('rateCurrency must be a 3-letter ISO code');
      }
      const previous = rental.rateCurrency || null;
      if (previous !== next) {
        updates.rateCurrency = next;
        changeLog.rateCurrency = { previous, next };
      }
    }

    if (depositStatus !== undefined) {
      const next = depositStatus ? String(depositStatus).trim().toLowerCase() : null;
      if (next && !DEPOSIT_STATUSES.has(next)) {
        throw rentalError('depositStatus is not recognised');
      }
      const previous = rental.depositStatus || null;
      if (previous !== next) {
        updates.depositStatus = next;
        changeLog.depositStatus = { previous, next };
      }
    }

    if (bookingId !== undefined) {
      const next = bookingId || null;
      const previous = rental.bookingId || null;
      if (previous !== next) {
        updates.bookingId = next;
        changeLog.bookingId = { previous, next };
      }
    }

    if (marketplaceItemId !== undefined) {
      const next = marketplaceItemId || null;
      const previous = rental.marketplaceItemId || null;
      if (previous !== next) {
        updates.marketplaceItemId = next;
        changeLog.marketplaceItemId = { previous, next };
      }
    }

    if (regionId !== undefined) {
      const next = regionId || null;
      const previous = rental.regionId || null;
      if (previous !== next) {
        updates.regionId = next;
        changeLog.regionId = { previous, next };
      }
    }

    if (renterId !== undefined) {
      const next = renterId || null;
      const previous = rental.renterId || null;
      if (previous !== next) {
        updates.renterId = next;
        changeLog.renterId = { previous, next };
      }
    }

    if (companyId !== undefined) {
      const next = companyId || null;
      const previous = rental.companyId || null;
      if (previous !== next) {
        updates.companyId = next;
        changeLog.companyId = { previous, next };
      }
    }

    const originalMeta = cloneMetadata(rental.meta);
    const nextMeta = cloneMetadata(rental.meta);
    let metaChanged = false;

    if (notes !== undefined) {
      const trimmed = typeof notes === 'string' ? notes.trim() : notes;
      const next = trimmed ? trimmed : null;
      const previous = originalMeta.notes ?? null;
      if (previous !== next) {
        nextMeta.notes = next;
        metaChanged = true;
        changeLog.notes = { previous, next };
      }
    }

    if (logisticsNotes !== undefined) {
      const trimmed = typeof logisticsNotes === 'string' ? logisticsNotes.trim() : logisticsNotes;
      const next = trimmed ? trimmed : null;
      const previous = originalMeta.logisticsNotes ?? null;
      if (previous !== next) {
        if (next === null) {
          delete nextMeta.logisticsNotes;
        } else {
          nextMeta.logisticsNotes = next;
        }
        metaChanged = true;
        changeLog.logisticsNotes = { previous, next };
      }
    }

    if (metaOverrides && typeof metaOverrides === 'object') {
      try {
        const overrideCopy = JSON.parse(JSON.stringify(metaOverrides));
        nextMeta.adminOverrides = {
          ...(nextMeta.adminOverrides || {}),
          ...overrideCopy
        };
        metaChanged = true;
        changeLog.metaOverrides = { previous: originalMeta.adminOverrides ?? null, next: nextMeta.adminOverrides };
      } catch (_error) {
        throw rentalError('meta must be a valid JSON object');
      }
    }

    if (metaChanged) {
      updates.meta = nextMeta;
    }

    if (Object.keys(updates).length === 0) {
      return rental.reload({
        transaction,
        include: [
          InventoryItem,
          { model: Booking, required: false },
          { model: RentalCheckpoint, separate: true, order: [['occurredAt', 'ASC']] }
        ]
      });
    }

    await rental.update(updates, { transaction });

    if (Object.keys(changeLog).length && actorId) {
      await addCheckpoint(
        rental,
        {
          type: 'note',
          description: 'Rental details updated',
          recordedBy: actorId,
          recordedByRole: actorRole,
          payload: { changes: changeLog }
        },
        transaction
      );
    }

    return rental.reload({
      transaction,
      include: [
        InventoryItem,
        { model: Booking, required: false },
        { model: RentalCheckpoint, separate: true, order: [['occurredAt', 'ASC']] }
      ]
    });
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

export async function updateRentalDepositStatus(
  rentalId,
  { actorId, actorRole = 'provider', status, reason = null, amountReleased = null }
) {
  const allowedStatuses = ['pending', 'held', 'released', 'partially_released', 'forfeited'];
  if (!status || !allowedStatuses.includes(status)) {
    throw rentalError('Deposit status must be pending, held, released, partially_released, or forfeited');
  }

  return sequelize.transaction(async (transaction) => {
    const rental = await RentalAgreement.findByPk(rentalId, { transaction, lock: transaction.LOCK.UPDATE });
    if (!rental) {
      throw rentalError('Rental agreement not found', 404);
    }

    const previousStatus = rental.depositStatus;
    const now = new Date();
    const numericAmount = Number.isFinite(Number(amountReleased)) ? Number(amountReleased) : null;

    await rental.update(
      {
        depositStatus: status,
        meta: {
          ...rental.meta,
          depositAdjustments: [
            ...((Array.isArray(rental.meta?.depositAdjustments) ? rental.meta.depositAdjustments : []).slice(-19)),
            {
              status,
              reason: reason || null,
              amountReleased: numericAmount,
              actorId: actorId || null,
              actorRole,
              occurredAt: now.toISOString()
            }
          ]
        }
      },
      { transaction }
    );

    await addCheckpoint(
      rental,
      {
        type: 'deposit',
        description: `Deposit ${status.replace(/_/g, ' ')}`,
        recordedBy: actorId || rental.renterId,
        recordedByRole: actorRole,
        payload: {
          status,
          reason: reason || null,
          amountReleased: numericAmount
        }
      },
      transaction
    );

    await recordAnalyticsEvent(
      {
        name: 'rental.deposit.updated',
        entityId: rental.id,
        actor: resolveRentalActor(actorId, actorRole),
        tenantId: rental.companyId,
        occurredAt: now,
        metadata: {
          rentalId: rental.id,
          companyId: rental.companyId,
          bookingId: rental.bookingId,
          previousStatus,
          nextStatus: status,
          amountReleased: numericAmount,
          depositAmount: rental.depositAmount ? Number(rental.depositAmount) : null,
          reason: reason || null
        }
      },
      { transaction }
    );

    return rental;
  });
}

export async function raiseRentalDispute(
  rentalId,
  { actorId, actorRole = 'customer', reason, evidenceUrl = null }
) {
  if (!reason || !reason.trim()) {
    throw rentalError('Reason is required to open a dispute');
  }

  const allowedStatuses = ['in_use', 'inspection_pending', 'settled'];

  return sequelize.transaction(async (transaction) => {
    const rental = await RentalAgreement.findByPk(rentalId, {
      transaction,
      lock: transaction.LOCK.UPDATE
    });
    if (!rental) {
      throw rentalError('Rental agreement not found', 404);
    }

    if (rental.status === 'disputed') {
      return rental.reload({ transaction, include: RENTAL_DETAIL_INCLUDE });
    }

    if (!allowedStatuses.includes(rental.status)) {
      throw rentalError('Rental can only be disputed while active or after return', 409);
    }

    assertStatusTransition(rental.status, 'disputed');

    const previousStatus = rental.status;
    const now = new Date();
    const depositStatus = rental.depositAmount ? 'held' : rental.depositStatus;
    const adjustments = Array.isArray(rental.meta?.depositAdjustments)
      ? rental.meta.depositAdjustments.slice(-19)
      : [];

    const trimmedReason = reason.trim();

    await rental.update(
      {
        status: 'disputed',
        depositStatus,
        lastStatusTransitionAt: now,
        meta: {
          ...rental.meta,
          dispute: {
            reason: trimmedReason,
            raisedBy: actorId || null,
            raisedAt: now.toISOString(),
            evidenceUrl: evidenceUrl || null,
            status: 'open'
          },
          depositAdjustments: [
            ...adjustments,
            {
              status: depositStatus,
              reason: `Dispute opened: ${trimmedReason}`,
              amountReleased: null,
              actorId: actorId || null,
              actorRole,
              occurredAt: now.toISOString()
            }
          ]
        }
      },
      { transaction }
    );

    await emitRentalStatusTransition({
      rental,
      previousStatus,
      nextStatus: 'disputed',
      actorId,
      actorRole,
      occurredAt: now,
      metadata: {
        reason: trimmedReason,
        depositStatus
      },
      transaction
    });

    await addCheckpoint(
      rental,
      {
        type: 'dispute',
        description: 'Dispute opened',
        recordedBy: actorId || rental.renterId,
        recordedByRole: actorRole,
        payload: {
          reason: trimmedReason,
          evidenceUrl: evidenceUrl || null
        }
      },
      transaction
    );

    await recordAnalyticsEvent(
      {
        name: 'rental.dispute.opened',
        entityId: rental.id,
        actor: resolveRentalActor(actorId, actorRole),
        tenantId: rental.companyId,
        occurredAt: now,
        metadata: {
          rentalId: rental.id,
          companyId: rental.companyId,
          bookingId: rental.bookingId,
          reason: trimmedReason,
          previousStatus,
          depositStatus
        }
      },
      { transaction }
    );

    return rental.reload({ transaction, include: RENTAL_DETAIL_INCLUDE });
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

export function listRentalAgreements({ companyId, renterId, status, search, limit = 50, offset = 0 } = {}) {
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

  const searchTerm = typeof search === 'string' ? search.trim() : '';
  if (searchTerm) {
    const pattern = `%${searchTerm.replace(/\s+/g, '%')}%`;
    where[Op.or] = [{ rentalNumber: { [Op.iLike]: pattern } }];
  }

  return RentalAgreement.findAll({
    where,
    order: [['createdAt', 'DESC']],
    limit,
    offset,
    include: RENTAL_DETAIL_INCLUDE
  });
}

export function getRentalAgreementById(rentalId) {
  return RentalAgreement.findByPk(rentalId, {
    include: RENTAL_DETAIL_INCLUDE
  });
}

export async function appendRentalCheckpoint(rentalId, payload) {
  const rental = await RentalAgreement.findByPk(rentalId);
  if (!rental) {
    throw rentalError('Rental agreement not found', 404);
  }
  return addCheckpoint(rental, payload, undefined);
}
