export const STATUS_FILTERS = [
  { value: 'all', label: 'All statuses' },
  { value: 'requested', label: 'Requested' },
  { value: 'approved', label: 'Approved' },
  { value: 'pickup_scheduled', label: 'Pickup scheduled' },
  { value: 'in_use', label: 'In field' },
  { value: 'inspection_pending', label: 'Inspection pending' },
  { value: 'settled', label: 'Settled' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'disputed', label: 'Disputed' }
];

export const RENTAL_STATUS_TONE = {
  requested: 'info',
  approved: 'info',
  pickup_scheduled: 'warning',
  in_use: 'warning',
  return_pending: 'warning',
  inspection_pending: 'warning',
  settled: 'success',
  cancelled: 'neutral',
  disputed: 'danger'
};

export const DEPOSIT_STATUS_TONE = {
  pending: 'info',
  held: 'warning',
  released: 'success',
  partially_released: 'warning',
  forfeited: 'danger'
};

export const DEPOSIT_STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'held', label: 'Held' },
  { value: 'released', label: 'Released' },
  { value: 'partially_released', label: 'Partially released' },
  { value: 'forfeited', label: 'Forfeited' }
];

export const INSPECTION_OUTCOMES = [
  { value: 'clear', label: 'Clear' },
  { value: 'partial', label: 'Partial release' },
  { value: 'damaged', label: 'Damage recorded' }
];

export const CHECKPOINT_TYPES = [
  { value: 'note', label: 'Note' },
  { value: 'status_change', label: 'Status change' },
  { value: 'handover', label: 'Handover' },
  { value: 'return', label: 'Return' },
  { value: 'inspection', label: 'Inspection' },
  { value: 'deposit', label: 'Deposit' }
];
