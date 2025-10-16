export const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'monitoring', label: 'Monitoring' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'draft', label: 'Draft' },
  { value: 'retired', label: 'Retired' }
];

export const FREQUENCY_LABELS = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  semiannual: 'Semi-annual',
  annual: 'Annual',
  event_driven: 'Event driven'
};

export const STATUS_TONE = {
  active: 'success',
  monitoring: 'info',
  overdue: 'danger',
  draft: 'neutral',
  retired: 'neutral'
};

export const DUE_TONE = {
  'due-soon': 'warning',
  'due-today': 'danger',
  overdue: 'danger',
  'on-track': 'success',
  unscheduled: 'neutral'
};

export const CONTROL_TYPE_LABELS = {
  preventative: 'Preventative',
  detective: 'Detective',
  corrective: 'Corrective',
  compensating: 'Compensating'
};

export const CATEGORY_LABELS = {
  policy: 'Policy',
  procedure: 'Procedure',
  technical: 'Technical',
  vendor: 'Vendor',
  training: 'Training',
  other: 'Other'
};

export const DEFAULT_FORM_STATE = {
  id: null,
  title: '',
  category: 'policy',
  controlType: 'preventative',
  status: 'active',
  reviewFrequency: 'annual',
  ownerTeam: 'Compliance Ops',
  ownerEmail: '',
  nextReviewAt: '',
  lastReviewAt: '',
  documentationUrl: '',
  evidenceLocation: '',
  evidenceRequired: true,
  escalationPolicy: '',
  notes: '',
  tags: '',
  watchers: '',
  rolesAllowed: '',
  evidenceCheckpoints: [],
  exceptionReviews: []
};

export const DEFAULT_AUTOMATION_FORM = {
  autoReminders: true,
  reminderOffsetDays: 7,
  defaultOwnerTeam: 'Compliance Ops',
  escalateTo: '',
  evidenceGraceDays: 2
};
