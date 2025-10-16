export const SHIFT_STATUS_CLASSES = {
  available: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  booked: 'border-primary/20 bg-primary/5 text-primary',
  standby: 'border-amber-200 bg-amber-50 text-amber-700',
  travel: 'border-sky-200 bg-sky-50 text-sky-700',
  off: 'border-slate-200 bg-slate-100 text-slate-500'
};

export const CERTIFICATION_STATUS_CLASSES = {
  valid: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  expiring: 'border-amber-200 bg-amber-50 text-amber-700',
  expired: 'border-rose-200 bg-rose-50 text-rose-700',
  revoked: 'border-slate-300 bg-slate-100 text-slate-600'
};

export const formatLabel = (value) => {
  if (!value) return '';
  return value
    .toString()
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const formatSummaryKey = (key) => key.replace(/([A-Z])/g, ' $1').toLowerCase();

export const toInputValue = (value) => (value == null ? '' : value);
