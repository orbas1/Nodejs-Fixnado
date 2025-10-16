export const STATUS_CONFIG = {
  open: { label: 'Open', tone: 'info' },
  assigned: { label: 'Assigned', tone: 'warning' },
  completed: { label: 'Completed', tone: 'success' },
  cancelled: { label: 'Cancelled', tone: 'danger' }
};

export const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

export const FILTER_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'all', label: 'All' }
];

export const defaultCreateForm = {
  title: '',
  description: '',
  budgetAmount: '',
  budgetCurrency: 'GBP',
  budgetLabel: '',
  zoneId: '',
  allowOutOfZone: false,
  bidDeadline: '',
  location: '',
  imagesText: '',
  customerEmail: '',
  customerFirstName: '',
  customerLastName: '',
  internalNotes: ''
};
