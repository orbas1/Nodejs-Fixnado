export const ORDER_HISTORY_ENTRY_TYPES = [
  { value: 'note', label: 'Note' },
  { value: 'status_update', label: 'Status update' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'handoff', label: 'Handoff' },
  { value: 'document', label: 'Document' }
];

export const ORDER_HISTORY_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

export const ORDER_HISTORY_ACTOR_ROLES = [
  { value: 'customer', label: 'Customer' },
  { value: 'provider', label: 'Provider' },
  { value: 'operations', label: 'Operations' },
  { value: 'support', label: 'Support' },
  { value: 'finance', label: 'Finance' },
  { value: 'system', label: 'System' }
];

export const ORDER_HISTORY_ATTACHMENT_TYPES = ['image', 'document', 'link'];

export const BOOKING_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'awaiting_assignment', label: 'Awaiting assignment' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'disputed', label: 'Disputed' }
];

export const HISTORY_SORT_OPTIONS = [
  { value: 'desc', label: 'Newest first' },
  { value: 'asc', label: 'Oldest first' }
];
