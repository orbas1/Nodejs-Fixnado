export const USER_STATUS_LABELS = {
  active: 'Active',
  invited: 'Invited',
  suspended: 'Suspended',
  deactivated: 'Deactivated'
};

export const STATUS_BADGE_CLASSES = {
  active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  invited: 'border-sky-200 bg-sky-50 text-sky-700',
  suspended: 'border-amber-200 bg-amber-50 text-amber-700',
  deactivated: 'border-rose-200 bg-rose-50 text-rose-700'
};

export const ROLE_OPTIONS = [
  { value: 'all', label: 'All roles' },
  { value: 'admin', label: 'Platform admin' },
  { value: 'operations_admin', label: 'Operations admin' },
  { value: 'provider_admin', label: 'Provider admin' },
  { value: 'company', label: 'Provider manager' },
  { value: 'servicemen', label: 'Crew' },
  { value: 'user', label: 'Customer' }
];

export const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'invited', label: 'Invited' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'deactivated', label: 'Deactivated' }
];

export const PAGE_SIZE = 10;

export const CREATE_FORM_DEFAULTS = {
  firstName: '',
  lastName: '',
  email: '',
  role: 'user',
  status: 'invited',
  jobTitle: '',
  department: '',
  labels: '',
  notes: '',
  avatarUrl: '',
  temporaryPassword: ''
};
