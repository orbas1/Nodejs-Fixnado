import {
  appendRentalCheckpoint,
  approveRentalAgreement,
  cancelRentalAgreement,
  completeRentalInspection,
  getRentalAgreementById,
  listRentalAgreements,
  markRentalReturned,
  recordRentalCheckout,
  requestRentalAgreement,
  scheduleRentalPickup,
  updateRentalAgreementDetails
} from '../services/rentalService.js';

const ACTIVE_STATUSES = new Set([
  'requested',
  'approved',
  'pickup_scheduled',
  'in_use',
  'return_pending',
  'inspection_pending',
  'disputed'
]);

function toIso(value) {
  if (!value) {
    return null;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function toNumber(value) {
  if (value == null) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function serialiseCheckpoint(checkpoint) {
  if (!checkpoint) {
    return null;
  }

  const payload = typeof checkpoint.toJSON === 'function' ? checkpoint.toJSON() : checkpoint;
  return {
    id: payload.id,
    type: payload.type,
    description: payload.description,
    recordedBy: payload.recordedBy,
    recordedByRole: payload.recordedByRole,
    occurredAt: toIso(payload.occurredAt),
    payload: payload.payload ?? {}
  };
}

function serialiseRental(rental, { includeTimeline = false } = {}) {
  if (!rental) {
    return null;
  }

  const json = typeof rental.toJSON === 'function' ? rental.toJSON() : rental;
  const { RentalCheckpoints, InventoryItem, Booking, ...rest } = json;
  const timeline = Array.isArray(RentalCheckpoints)
    ? RentalCheckpoints.map(serialiseCheckpoint).filter(Boolean)
    : [];

  const base = {
    id: rest.id,
    rentalNumber: rest.rentalNumber,
    status: rest.status,
    depositStatus: rest.depositStatus,
    quantity: rest.quantity,
    rentalStartAt: toIso(rest.rentalStartAt),
    rentalEndAt: toIso(rest.rentalEndAt),
    pickupAt: toIso(rest.pickupAt),
    returnDueAt: toIso(rest.returnDueAt),
    returnedAt: toIso(rest.returnedAt),
    dailyRate: toNumber(rest.dailyRate),
    rateCurrency: rest.rateCurrency,
    depositAmount: toNumber(rest.depositAmount),
    depositCurrency: rest.depositCurrency,
    companyId: rest.companyId,
    renterId: rest.renterId,
    bookingId: rest.bookingId,
    marketplaceItemId: rest.marketplaceItemId,
    regionId: rest.regionId ?? null,
    meta: rest.meta ?? {},
    cancellationReason: rest.cancellationReason ?? null,
    lastStatusTransitionAt: toIso(rest.lastStatusTransitionAt),
    createdAt: toIso(rest.createdAt),
    updatedAt: toIso(rest.updatedAt),
    timelineCount: timeline.length,
    latestCheckpoint: timeline.length ? timeline[timeline.length - 1] : null,
    item: InventoryItem
      ? {
          id: InventoryItem.id,
          name: InventoryItem.name,
          sku: InventoryItem.sku,
          category: InventoryItem.category,
          rentalRate: toNumber(InventoryItem.rentalRate),
          rentalRateCurrency: InventoryItem.rentalRateCurrency,
          depositAmount: toNumber(InventoryItem.depositAmount),
          depositCurrency: InventoryItem.depositCurrency,
          metadata: InventoryItem.metadata ?? {}
        }
      : null,
    booking: Booking
      ? {
          id: Booking.id,
          status: Booking.status,
          scheduledStart: toIso(Booking.scheduledStart),
          scheduledEnd: toIso(Booking.scheduledEnd),
          totalAmount: toNumber(Booking.totalAmount),
          currency: Booking.currency,
          reference: Booking.meta?.reference ?? null
        }
      : null
  };

  if (includeTimeline) {
    base.timeline = timeline;
  } else if (timeline.length) {
    base.timelinePreview = timeline.slice(-3);
  }

  return base;
}

function handleServiceError(res, next, error) {
  if (error && error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  return next(error);
}

function actorFromRequest(req, fallbackRole = 'admin') {
  const authActor = req.auth?.actor ?? {};
  const actorId = authActor.actorId ?? req.user?.id ?? null;
  const actorRole = authActor.role ?? req.user?.role ?? req.user?.type ?? fallbackRole;
  return {
    actorId,
    actorRole: actorRole || fallbackRole
  };
}

async function respondWithRental(res, rentalId, { statusCode = 200 } = {}) {
  const rental = await getRentalAgreementById(rentalId);
  if (!rental) {
    res.status(404).json({ message: 'Rental agreement not found' });
    return;
  }
  res.status(statusCode).json({ data: serialiseRental(rental, { includeTimeline: true }) });
}

export async function listAdminRentals(req, res, next) {
  try {
    const { status, companyId, renterId, limit, offset, search } = req.query;
    const rentals = await listRentalAgreements({
      status: status && status !== 'all' ? status : undefined,
      companyId,
      renterId,
      search,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
      offset: offset ? Number.parseInt(offset, 10) : undefined
    });
    const serialised = rentals.map((entry) => serialiseRental(entry));

    const meta = serialised.reduce(
      (acc, rental) => {
        acc.total += 1;
        acc.byStatus[rental.status] = (acc.byStatus[rental.status] ?? 0) + 1;
        if (ACTIVE_STATUSES.has(rental.status)) {
          acc.active += 1;
        }
        if (rental.depositStatus) {
          acc.deposits[rental.depositStatus] = (acc.deposits[rental.depositStatus] ?? 0) + 1;
        }
        return acc;
      },
      { total: 0, active: 0, byStatus: {}, deposits: {} }
    );

    res.json({
      data: serialised,
      meta: {
        total: meta.total,
        active: meta.active,
        byStatus: meta.byStatus,
        depositSummary: meta.deposits,
        limit: limit ? Number.parseInt(limit, 10) : undefined,
        offset: offset ? Number.parseInt(offset, 10) : undefined
      }
    });
  } catch (error) {
    next(error);
  }
}

export async function getAdminRental(req, res, next) {
  try {
    const rental = await getRentalAgreementById(req.params.rentalId);
    if (!rental) {
      res.status(404).json({ message: 'Rental agreement not found' });
      return;
    }
    res.json({ data: serialiseRental(rental, { includeTimeline: true }) });
  } catch (error) {
    next(error);
  }
}

export async function createAdminRental(req, res, next) {
  try {
    const { actorId, actorRole } = actorFromRequest(req);
    const payload = {
      ...req.body,
      quantity: req.body?.quantity != null ? Number.parseInt(req.body.quantity, 10) : undefined,
      actorId,
      actorRole
    };
    const rental = await requestRentalAgreement(payload);
    await respondWithRental(res, rental.id, { statusCode: 201 });
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function approveAdminRental(req, res, next) {
  try {
    const { actorId, actorRole } = actorFromRequest(req);
    const rental = await approveRentalAgreement(req.params.rentalId, {
      ...req.body,
      actorId,
      actorRole
    });
    await respondWithRental(res, rental.id);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function scheduleAdminRentalPickup(req, res, next) {
  try {
    const { actorId, actorRole } = actorFromRequest(req);
    const rental = await scheduleRentalPickup(req.params.rentalId, {
      ...req.body,
      actorId,
      actorRole
    });
    await respondWithRental(res, rental.id);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function checkoutAdminRental(req, res, next) {
  try {
    const { actorId, actorRole } = actorFromRequest(req);
    const rental = await recordRentalCheckout(req.params.rentalId, {
      ...req.body,
      actorId,
      actorRole
    });
    await respondWithRental(res, rental.id);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function markAdminRentalReturned(req, res, next) {
  try {
    const { actorId, actorRole } = actorFromRequest(req);
    const rental = await markRentalReturned(req.params.rentalId, {
      ...req.body,
      actorId,
      actorRole
    });
    await respondWithRental(res, rental.id);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function inspectAdminRental(req, res, next) {
  try {
    const { actorId, actorRole } = actorFromRequest(req);
    const charges = Array.isArray(req.body?.charges)
      ? req.body.charges.map((charge) => ({
          label: charge?.label || undefined,
          description: charge?.description || undefined,
          amount: charge?.amount != null ? Number(charge.amount) : undefined,
          currency: charge?.currency || undefined
        }))
      : undefined;

    const rental = await completeRentalInspection(req.params.rentalId, {
      ...req.body,
      charges,
      actorId,
      actorRole
    });
    await respondWithRental(res, rental.id);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function cancelAdminRental(req, res, next) {
  try {
    const { actorId, actorRole } = actorFromRequest(req);
    const rental = await cancelRentalAgreement(req.params.rentalId, {
      ...req.body,
      actorId,
      actorRole
    });
    await respondWithRental(res, rental.id);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function addAdminRentalCheckpoint(req, res, next) {
  try {
    const { actorId, actorRole } = actorFromRequest(req);
    const checkpointPayload = {
      type: req.body?.type || 'note',
      description: req.body?.description || 'Manual update recorded',
      recordedBy: actorId,
      recordedByRole: actorRole,
      payload: req.body?.payload ?? {}
    };

    if (!checkpointPayload.recordedBy) {
      res.status(400).json({ message: 'Authenticated actor required to record checkpoint' });
      return;
    }

    await appendRentalCheckpoint(req.params.rentalId, checkpointPayload);
    await respondWithRental(res, req.params.rentalId, { statusCode: 201 });
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export async function updateAdminRental(req, res, next) {
  try {
    const { actorId, actorRole } = actorFromRequest(req);
    const rental = await updateRentalAgreementDetails(req.params.rentalId, {
      ...req.body,
      actorId,
      actorRole
    });
    await respondWithRental(res, rental.id);
  } catch (error) {
    handleServiceError(res, next, error);
  }
}

export default {
  listAdminRentals,
  getAdminRental,
  createAdminRental,
  approveAdminRental,
  scheduleAdminRentalPickup,
  checkoutAdminRental,
  markAdminRentalReturned,
  inspectAdminRental,
  cancelAdminRental,
  addAdminRentalCheckpoint,
  updateAdminRental
};
