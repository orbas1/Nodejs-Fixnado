export const ORDER_STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'awaiting_approval', label: 'Awaiting approval' },
  { value: 'approved', label: 'Approved' },
  { value: 'sent', label: 'Sent' },
  { value: 'partial', label: 'Partially received' },
  { value: 'received', label: 'Received' },
  { value: 'closed', label: 'Closed' },
  { value: 'cancelled', label: 'Cancelled' }
];

export const ORDER_STATUS_LABELS = {
  draft: 'Draft',
  awaiting_approval: 'Awaiting approval',
  approved: 'Approved',
  sent: 'Sent to supplier',
  partial: 'Partially received',
  received: 'Received',
  closed: 'Closed',
  cancelled: 'Cancelled'
};

export const STATUS_TONES = {
  draft: 'neutral',
  awaiting_approval: 'warning',
  approved: 'info',
  sent: 'info',
  partial: 'warning',
  received: 'success',
  closed: 'success',
  cancelled: 'danger'
};

export const STATUS_TRANSITIONS = {
  draft: ['awaiting_approval', 'approved', 'sent', 'cancelled'],
  awaiting_approval: ['approved', 'sent', 'draft', 'cancelled'],
  approved: ['sent', 'cancelled'],
  sent: ['partial', 'received', 'cancelled'],
  partial: ['received', 'cancelled'],
  received: ['closed'],
  closed: [],
  cancelled: ['draft']
};

export const SUPPLIER_STATUS_OPTIONS = [
  { value: 'all', label: 'All suppliers' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'inactive', label: 'Inactive' }
];

export const SUPPLIER_STATUS_TRANSITIONS = {
  active: [
    { value: 'on_hold', label: 'Place on hold' },
    { value: 'inactive', label: 'Deactivate' }
  ],
  on_hold: [
    { value: 'active', label: 'Reactivate' },
    { value: 'inactive', label: 'Deactivate' }
  ],
  inactive: [{ value: 'active', label: 'Activate' }]
};

export const SUPPLIER_STATUS_TONES = {
  active: 'success',
  on_hold: 'warning',
  inactive: 'danger'
};

export const BUDGET_TONE_CLASSES = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger: 'bg-rose-500',
  neutral: 'bg-slate-300'
};

export const createDefaultItem = () => ({
  id: null,
  itemName: '',
  description: '',
  sku: '',
  quantity: '1',
  unitCost: '0',
  taxRate: '20',
  expectedAt: '',
  imageUrl: '',
  receivedQuantity: '0'
});

export const createEmptyOrderForm = () => ({
  id: null,
  supplierId: '',
  supplierName: '',
  budgetId: '',
  currency: 'GBP',
  expectedAt: '',
  notes: '',
  approvalRequired: false,
  status: 'draft',
  reference: '',
  items: [createDefaultItem()],
  attachments: []
});

export const createEmptySupplierForm = () => ({
  id: null,
  name: '',
  contactEmail: '',
  contactPhone: '',
  website: '',
  tags: '',
  leadTimeDays: '',
  paymentTermsDays: '',
  status: 'active',
  notes: ''
});

export const createEmptyBudgetForm = () => ({
  id: null,
  category: '',
  fiscalYear: new Date().getFullYear().toString(),
  allocated: '',
  spent: '',
  committed: '',
  currency: 'GBP',
  owner: '',
  notes: ''
});
