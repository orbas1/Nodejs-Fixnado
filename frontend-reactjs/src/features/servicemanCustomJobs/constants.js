export const defaultFilters = {
  status: 'open',
  zoneId: '',
  search: ''
};

export const defaultBidForm = {
  amount: '',
  currency: 'GBP',
  message: '',
  attachments: []
};

export const defaultMessageForm = {
  body: '',
  attachments: []
};

export function createAttachmentDraft() {
  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `att-${Math.random().toString(36).slice(2, 10)}`;
  return { id, url: '', label: '' };
}
