export const defaultProfile = {
  preferredName: '',
  companyName: '',
  jobTitle: '',
  primaryEmail: '',
  primaryPhone: '',
  preferredContactMethod: '',
  billingEmail: '',
  timezone: '',
  locale: '',
  defaultCurrency: '',
  avatarUrl: '',
  coverImageUrl: '',
  supportNotes: '',
  escalationWindowMinutes: 120,
  marketingOptIn: false,
  notificationsEmailOptIn: true,
  notificationsSmsOptIn: false
};

export const contactTemplate = {
  id: null,
  name: '',
  role: '',
  email: '',
  phone: '',
  contactType: 'operations',
  isPrimary: false,
  notes: '',
  avatarUrl: ''
};

export const locationTemplate = {
  id: null,
  label: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  region: '',
  postalCode: '',
  country: '',
  accessNotes: '',
  isPrimary: false
};

export const disputeCaseTemplate = {
  id: null,
  caseNumber: '',
  disputeId: '',
  title: '',
  category: 'billing',
  status: 'draft',
  severity: 'medium',
  summary: '',
  nextStep: '',
  assignedTeam: '',
  assignedOwner: '',
  resolutionNotes: '',
  externalReference: '',
  amountDisputed: '',
  currency: 'GBP',
  openedAt: '',
  dueAt: '',
  resolvedAt: '',
  slaDueAt: '',
  requiresFollowUp: false,
  lastReviewedAt: '',
  tasks: [],
  notes: [],
  evidence: []
};

export const disputeTaskTemplate = {
  id: null,
  disputeCaseId: null,
  label: '',
  status: 'pending',
  dueAt: '',
  assignedTo: '',
  instructions: '',
  completedAt: ''
};

export const disputeNoteTemplate = {
  id: null,
  disputeCaseId: null,
  noteType: 'update',
  visibility: 'customer',
  body: '',
  nextSteps: '',
  pinned: false
};

export const disputeEvidenceTemplate = {
  id: null,
  disputeCaseId: null,
  label: '',
  fileUrl: '',
  fileType: '',
  thumbnailUrl: '',
  notes: ''
};

export const contactTypeOptions = [
  { value: 'operations', label: 'Operations lead' },
  { value: 'finance', label: 'Finance / billing' },
  { value: 'support', label: 'Support & escalation' },
  { value: 'billing', label: 'Accounts payable' },
  { value: 'executive', label: 'Executive stakeholder' },
  { value: 'other', label: 'Other' }
];

export const disputeStatusOptions = [
  { value: 'draft', label: 'Draft' },
  { value: 'open', label: 'Open' },
  { value: 'under_review', label: 'Under review' },
  { value: 'awaiting_customer', label: 'Awaiting customer' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' }
];

export const disputeSeverityOptions = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' }
];

export const disputeCategoryOptions = [
  { value: 'billing', label: 'Billing & payouts' },
  { value: 'service_quality', label: 'Service quality' },
  { value: 'damage', label: 'Damage & liability' },
  { value: 'timeline', label: 'Timeline & scheduling' },
  { value: 'compliance', label: 'Compliance & policy' },
  { value: 'other', label: 'Other' }
];

export const disputeTaskStatusOptions = [
  { value: 'pending', label: 'Pending' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

export const disputeNoteTypeOptions = [
  { value: 'update', label: 'Update' },
  { value: 'call', label: 'Call log' },
  { value: 'decision', label: 'Decision' },
  { value: 'escalation', label: 'Escalation' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'other', label: 'Other' }
];

export const disputeNoteVisibilityOptions = [
  { value: 'customer', label: 'Customer & Fixnado' },
  { value: 'internal', label: 'Internal only' },
  { value: 'provider', label: 'Provider visible' },
  { value: 'finance', label: 'Finance team' },
  { value: 'compliance', label: 'Compliance team' }
];
