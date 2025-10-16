export function nowIsoLocal() {
  const now = new Date();
  now.setMilliseconds(0);
  return now.toISOString().slice(0, 16);
}

export function buildEmptyEvidence() {
  return {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `evidence-${Date.now()}`,
    name: '',
    requirement: '',
    dueAt: '',
    owner: '',
    status: 'pending',
    evidenceUrl: '',
    notes: ''
  };
}

export function buildEmptyException() {
  return {
    id:
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `exception-${Date.now()}`,
    summary: '',
    owner: '',
    status: 'open',
    expiresAt: '',
    notes: ''
  };
}

export function toDateInput(value) {
  if (!value) return '';
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toISOString().slice(0, 16);
  } catch (error) {
    return '';
  }
}

export function toIsoOrNull(value) {
  if (!value) return null;
  try {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch (error) {
    return null;
  }
}

export function normaliseListValue(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }
  return [];
}

export function formatSummaryValue(value) {
  return new Intl.NumberFormat('en-GB').format(Number.parseInt(value ?? 0, 10) || 0);
}
