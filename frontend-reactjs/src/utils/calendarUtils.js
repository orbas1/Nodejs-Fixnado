export const statusBadgeClasses = {
  confirmed: 'border-emerald-200 bg-emerald-50 text-emerald-600',
  pending: 'border-amber-200 bg-amber-50 text-amber-700',
  risk: 'border-rose-200 bg-rose-50 text-rose-700',
  travel: 'border-sky-200 bg-sky-50 text-sky-700',
  standby: 'border-primary/20 bg-secondary text-primary/80'
};

export function getStatusBadgeClass(status) {
  if (!status) return statusBadgeClasses.standby;
  const key = status.toLowerCase().replace(/\s+/g, '-');
  return statusBadgeClasses[key] ?? statusBadgeClasses.standby;
}

export function normaliseStatusLabel(status) {
  if (!status) return 'Standby';
  const key = status.toLowerCase();
  if (key === 'confirmed') return 'Confirmed visit';
  if (key === 'pending') return 'Awaiting assignment';
  if (key === 'risk') return 'Escalation risk';
  if (key === 'travel') return 'Travel / prep';
  if (key === 'standby') return 'Standby';
  return status;
}
