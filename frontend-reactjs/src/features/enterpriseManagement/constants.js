export const ACCOUNT_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'pilot', label: 'Pilot' },
  { value: 'paused', label: 'Paused' },
  { value: 'offboarding', label: 'Offboarding' },
  { value: 'prospect', label: 'Prospect' }
];

export const ACCOUNT_PRIORITY_OPTIONS = [
  { value: 'standard', label: 'Standard' },
  { value: 'priority', label: 'Priority' },
  { value: 'critical', label: 'Critical' }
];

export const SITE_STATUS_OPTIONS = [
  { value: 'operational', label: 'Operational' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'standby', label: 'Standby' },
  { value: 'offline', label: 'Offline' }
];

export const PLAYBOOK_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'approved', label: 'Approved' },
  { value: 'in_review', label: 'In review' },
  { value: 'retired', label: 'Retired' }
];

export const DEFAULT_SUMMARY = {
  total: 0,
  active: 0,
  pilot: 0,
  critical: 0,
  archived: 0,
  sites: 0,
  stakeholders: 0,
  playbooks: 0
};

export const DEFAULT_SITE = {
  name: '',
  code: '',
  status: 'operational',
  addressLine1: '',
  addressLine2: '',
  city: '',
  region: '',
  postalCode: '',
  country: '',
  timezone: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  capacityNotes: '',
  mapUrl: '',
  imageUrl: '',
  notes: ''
};

export const DEFAULT_STAKEHOLDER = {
  role: '',
  name: '',
  email: '',
  phone: '',
  escalationLevel: '',
  isPrimary: false,
  avatarUrl: '',
  notes: ''
};

export const DEFAULT_PLAYBOOK = {
  name: '',
  status: 'draft',
  owner: '',
  category: '',
  documentUrl: '',
  summary: '',
  lastReviewedAt: ''
};

export const READ_ONLY_MESSAGE =
  'Archived enterprise accounts are read-only. Restore the account before making changes.';
