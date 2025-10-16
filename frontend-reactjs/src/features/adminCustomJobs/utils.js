export function formatCurrency(amount, currency = 'GBP') {
  if (amount === null || amount === undefined || amount === '') {
    return '—';
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2
    }).format(Number(amount));
  } catch (error) {
    console.warn('Failed to format currency', error);
    return `${amount} ${currency}`;
  }
}

export function toLocalDateTimeInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const tzOffset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - tzOffset * 60000);
  return local.toISOString().slice(0, 16);
}

export function buildMeta(summary = {}) {
  return [
    {
      label: 'Open jobs',
      value: (summary.openCount ?? 0).toLocaleString()
    },
    {
      label: 'Assigned',
      value: (summary.assignedCount ?? 0).toLocaleString()
    },
    {
      label: 'Completed',
      value: (summary.completedCount ?? 0).toLocaleString()
    },
    {
      label: 'Active bids',
      value: (summary.activeBidCount ?? 0).toLocaleString(),
      caption: summary.refreshedAt ? `Refreshed ${new Date(summary.refreshedAt).toLocaleTimeString()}` : undefined
    }
  ];
}

export function formatRelativeTime(timestamp) {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return '—';
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.round(diffMs / 60000);
  if (minutes < 1) return 'moments ago';
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function parseImages(text) {
  if (typeof text !== 'string') {
    return [];
  }
  return text
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function createAttachmentDraft() {
  return {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    label: '',
    url: ''
  };
}

export function buildUpdatePayload(form) {
  const images = parseImages(form.imagesText);
  const payload = {
    title: form.title,
    description: form.description,
    budgetAmount: form.budgetAmount === '' ? undefined : Number(form.budgetAmount),
    budgetCurrency: form.budgetCurrency,
    budgetLabel: form.budgetLabel,
    zoneId: form.zoneId || undefined,
    allowOutOfZone: form.allowOutOfZone,
    bidDeadline: form.bidDeadline || undefined,
    location: form.location,
    images,
    internalNotes: form.internalNotes,
    status: form.status
  };

  if (form.customerEmail || form.customerId) {
    payload.customer = {
      id: form.customerId || undefined,
      email: form.customerEmail || undefined,
      firstName: form.customerFirstName || undefined,
      lastName: form.customerLastName || undefined
    };
  }

  return payload;
}

export function createInitialEditForm(job) {
  if (!job) {
    return null;
  }
  return {
    title: job.title ?? '',
    description: job.description ?? '',
    budgetAmount: job.budgetAmount ?? '',
    budgetCurrency: job.budgetCurrency ?? 'GBP',
    budgetLabel: job.budget ?? '',
    zoneId: job.zone?.id ?? '',
    allowOutOfZone: Boolean(job.allowOutOfZone),
    bidDeadline: job.bidDeadline ? toLocalDateTimeInput(job.bidDeadline) : '',
    location: job.location ?? '',
    imagesText: Array.isArray(job.images) ? job.images.join('\n') : '',
    internalNotes: job.internalNotes ?? '',
    status: job.status ?? 'open',
    customerId: job.customer?.id ?? '',
    customerEmail: job.customer?.email ?? '',
    customerFirstName: job.customer?.firstName ?? '',
    customerLastName: job.customer?.lastName ?? ''
  };
}
