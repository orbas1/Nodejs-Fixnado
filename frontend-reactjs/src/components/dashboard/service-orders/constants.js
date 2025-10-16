export const STATUS_COLUMNS = [
  {
    id: 'draft',
    label: 'Quotes & Drafts',
    helper: 'Capture requirements, budgets, and procurement tasks.',
    statuses: ['draft']
  },
  {
    id: 'funded',
    label: 'Escrow Funded',
    helper: 'Escrow is ready—lock schedules and assign crews.',
    statuses: ['funded']
  },
  {
    id: 'in-progress',
    label: 'In Delivery',
    helper: 'Live service orders with field activity and QA checks.',
    statuses: ['in_progress']
  },
  {
    id: 'completed',
    label: 'Wrap-up & Follow-up',
    helper: 'Completed or disputed orders awaiting close-out.',
    statuses: ['completed', 'disputed']
  }
];

export const STATUS_LABELS = {
  draft: 'Draft',
  funded: 'Escrow funded',
  in_progress: 'In delivery',
  completed: 'Completed',
  disputed: 'Disputed'
};

export const STATUS_TONES = {
  draft: 'info',
  funded: 'success',
  in_progress: 'warning',
  completed: 'success',
  disputed: 'danger'
};

export const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
];

export const APPROVAL_STATES = [
  { value: 'not_requested', label: 'Not requested' },
  { value: 'pending', label: 'Pending approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' }
];

export const ATTACHMENT_TYPES = [
  { value: 'link', label: 'Link' },
  { value: 'document', label: 'Document' },
  { value: 'image', label: 'Image' }
];

export const DEFAULT_FORM_STATE = {
  title: '',
  serviceId: '',
  status: 'draft',
  priority: 'medium',
  totalAmount: '',
  currency: 'GBP',
  scheduledFor: '',
  summary: '',
  siteAddress: '',
  contactName: '',
  contactPhone: '',
  poNumber: '',
  approvalStatus: 'not_requested',
  tagsInput: '',
  attachments: []
};
