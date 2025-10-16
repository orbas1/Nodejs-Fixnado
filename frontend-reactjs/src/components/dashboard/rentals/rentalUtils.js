import PropTypes from 'prop-types';

export const ACTIVE_STATUSES = new Set([
  'in_use',
  'pickup_scheduled',
  'return_pending',
  'inspection_pending'
]);

export const statusTone = {
  requested: 'info',
  approved: 'info',
  pickup_scheduled: 'info',
  in_use: 'warning',
  return_pending: 'warning',
  inspection_pending: 'warning',
  settled: 'success',
  cancelled: 'neutral',
  disputed: 'danger'
};

export const depositTone = {
  pending: 'neutral',
  held: 'warning',
  released: 'success',
  partially_released: 'info',
  forfeited: 'danger'
};

export const depositStatusLabels = {
  pending: 'Pending release',
  held: 'Held',
  released: 'Released',
  partially_released: 'Partially released',
  forfeited: 'Forfeited'
};

export const inventoryStatusTone = {
  healthy: 'success',
  available: 'success',
  low: 'warning',
  limited: 'warning',
  low_stock: 'warning',
  maintenance: 'info',
  reserved: 'info',
  unavailable: 'danger',
  out_of_stock: 'danger',
  stockout: 'danger',
  critical: 'danger'
};

function toIso(value) {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normaliseMoney(value) {
  if (value === null || value === undefined) return null;
  const numeric = Number.parseFloat(value);
  return Number.isFinite(numeric) ? numeric : null;
}

export function normaliseRental(input = {}) {
  const timeline = Array.isArray(input.timeline)
    ? input.timeline.map((checkpoint) => ({
        id: checkpoint.id,
        type: checkpoint.type,
        description: checkpoint.description,
        recordedBy: checkpoint.recordedBy,
        recordedByRole: checkpoint.recordedByRole,
        occurredAt: toIso(checkpoint.occurredAt),
        payload: checkpoint.payload || {}
      }))
    : [];

  const inventory = input.item || input.InventoryItem || {};
  const booking = input.booking || input.Booking || {};

  return {
    id: input.id,
    rentalNumber: input.rentalNumber,
    status: (input.status || '').toLowerCase(),
    depositStatus: (input.depositStatus || '').toLowerCase(),
    quantity: input.quantity ?? 1,
    renterId: input.renterId || input.renter_id || input.meta?.createdBy || null,
    companyId: input.companyId || input.company_id || null,
    bookingId: input.bookingId || input.booking_id || booking.id || null,
    pickupAt: toIso(input.pickupAt || input.pickup_at),
    returnDueAt: toIso(input.returnDueAt || input.return_due_at),
    rentalStartAt: toIso(input.rentalStartAt || input.rental_start_at),
    rentalEndAt: toIso(input.rentalEndAt || input.rental_end_at),
    returnedAt: toIso(input.returnedAt || input.returned_at),
    lastStatusTransitionAt: toIso(input.lastStatusTransitionAt || input.last_status_transition_at),
    depositAmount: normaliseMoney(input.depositAmount || input.deposit_amount),
    depositCurrency: input.depositCurrency || input.deposit_currency || null,
    dailyRate: normaliseMoney(input.dailyRate || input.daily_rate),
    rateCurrency: input.rateCurrency || input.rate_currency || null,
    conditionOut: input.conditionOut || input.condition_out || {},
    conditionIn: input.conditionIn || input.condition_in || {},
    meta: input.meta || {},
    item: inventory
      ? {
          id: inventory.id || inventory.itemId,
          name: inventory.name || 'Asset',
          sku: inventory.sku || null,
          rentalRate: normaliseMoney(inventory.rentalRate || inventory.rental_rate),
          rentalRateCurrency: inventory.rentalRateCurrency || inventory.rental_rate_currency || null,
          depositAmount: normaliseMoney(inventory.depositAmount || inventory.deposit_amount),
          depositCurrency: inventory.depositCurrency || inventory.deposit_currency || null
        }
      : null,
    booking: booking?.id
      ? {
          id: booking.id,
          status: booking.status,
          reference: booking.meta?.reference || null,
          title: booking.meta?.title || null
        }
      : null,
    timeline
  };
}

export function formatDate(value, timezone) {
  if (!value) return '—';
  try {
    const formatter = new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: timezone
    });
    return formatter.format(new Date(value));
  } catch (error) {
    console.warn('Failed to format date', error);
    return new Date(value).toLocaleString();
  }
}

export function formatCurrency(amount, currency = 'GBP') {
  if (!Number.isFinite(amount)) return '—';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2
    }).format(amount);
  } catch (error) {
    console.warn('Failed to format currency', error);
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
}

export function computeMetrics(rentals, timezone) {
  if (!Array.isArray(rentals) || rentals.length === 0) {
    return [
      { id: 'active', label: 'Active rentals', value: 0 },
      { id: 'dueSoon', label: 'Due within 72h', value: 0 },
      { id: 'held', label: 'Deposits held', value: 0 },
      { id: 'released', label: 'Deposits released', value: 0 },
      { id: 'atRisk', label: 'Disputes or inspections', value: 0 }
    ];
  }

  const now = new Date();
  const effectiveNow = timezone
    ? new Date(new Date().toLocaleString('en-US', { timeZone: timezone }))
    : now;

  const dueSoon = rentals.filter((rental) => {
    if (!rental.returnDueAt) return false;
    const due = new Date(rental.returnDueAt);
    if (Number.isNaN(due.getTime())) return false;
    const diff = due.getTime() - effectiveNow.getTime();
    return diff >= 0 && diff <= 1000 * 60 * 60 * 24 * 3;
  }).length;

  const depositsHeld = rentals.filter((rental) => rental.depositStatus === 'held').length;
  const depositsReleased = rentals.filter((rental) =>
    ['released', 'partially_released'].includes(rental.depositStatus)
  ).length;
  const atRisk = rentals.filter((rental) => ['inspection_pending', 'disputed'].includes(rental.status)).length;
  const active = rentals.filter((rental) => ACTIVE_STATUSES.has(rental.status)).length;

  return [
    { id: 'active', label: 'Active rentals', value: active },
    { id: 'dueSoon', label: 'Due within 72h', value: dueSoon },
    { id: 'held', label: 'Deposits held', value: depositsHeld },
    { id: 'released', label: 'Deposits released', value: depositsReleased },
    { id: 'atRisk', label: 'Disputes or inspections', value: atRisk }
  ];
}

export function computeEscrowSummary(rentals) {
  const summary = {
    total: 0,
    pending: 0,
    held: 0,
    released: 0,
    partially_released: 0,
    forfeited: 0
  };

  rentals.forEach((rental) => {
    const amount = Number.parseFloat(rental.depositAmount ?? NaN);
    if (!Number.isFinite(amount) || amount <= 0) {
      return;
    }
    const key = summary[rental.depositStatus] !== undefined ? rental.depositStatus : 'pending';
    summary[key] += amount;
    summary.total += amount;
  });

  return summary;
}

export const rentalShape = PropTypes.shape({
  id: PropTypes.string.isRequired,
  rentalNumber: PropTypes.string,
  status: PropTypes.string,
  depositStatus: PropTypes.string,
  returnDueAt: PropTypes.string,
  quantity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  item: PropTypes.shape({ name: PropTypes.string })
});

