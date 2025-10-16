export const OWNER_OPTIONS = [
  { value: 'provider', label: 'Provider organisations' },
  { value: 'company', label: 'Company subsidiaries' },
  { value: 'customer', label: 'Customer wallets' },
  { value: 'affiliate', label: 'Affiliate partners' },
  { value: 'operations', label: 'Operations float' }
];

export const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
  { value: 'closed', label: 'Closed' }
];

export const TRANSACTION_TYPES = [
  { value: 'credit', label: 'Credit funds' },
  { value: 'debit', label: 'Debit funds' },
  { value: 'hold', label: 'Place hold' },
  { value: 'release', label: 'Release hold' },
  { value: 'refund', label: 'Refund customer' },
  { value: 'adjustment', label: 'Manual adjustment' }
];

export const DEFAULT_ACCOUNT_FORM = {
  displayName: '',
  ownerType: 'provider',
  ownerId: '',
  currency: 'GBP',
  status: 'active',
  metadataNote: ''
};

export const DEFAULT_TRANSACTION_FORM = {
  type: 'credit',
  amount: '',
  currency: 'GBP',
  description: '',
  referenceType: '',
  referenceId: ''
};

export const PAGE_SIZE = 10;

export const ACCOUNT_STATUS_OPTIONS = STATUS_FILTERS.filter((option) => option.value !== 'all');
