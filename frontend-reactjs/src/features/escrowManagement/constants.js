export const STATUS_FILTER_OPTIONS = [
  { label: 'All statuses', value: 'all' },
  { label: 'Pending', value: 'pending' },
  { label: 'Funded', value: 'funded' },
  { label: 'Released', value: 'released' },
  { label: 'Disputed', value: 'disputed' }
];

export const STATUS_SELECT_OPTIONS = STATUS_FILTER_OPTIONS.filter((option) => option.value !== 'all');

export const HOLD_OPTIONS = [
  { label: 'All', value: 'all' },
  { label: 'On hold', value: 'true' },
  { label: 'Not on hold', value: 'false' }
];

export function createEmptyEscrowForm() {
  return {
    orderId: '',
    amount: '',
    currency: 'GBP',
    policyId: '',
    requiresDualApproval: false,
    autoReleaseAt: '',
    note: '',
    pinNote: false,
    milestones: [createEmptyMilestone()]
  };
}

export function createEmptyMilestone() {
  return { id: null, label: '', status: 'pending', amount: '', dueAt: '' };
}
