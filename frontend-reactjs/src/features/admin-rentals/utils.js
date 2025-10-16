const currencyFormatterCache = new Map();

export function formatCurrency(amount, currency = 'GBP') {
  if (amount == null || Number.isNaN(Number(amount))) {
    return '—';
  }

  const key = `${currency}-standard`;
  if (!currencyFormatterCache.has(key)) {
    currencyFormatterCache.set(
      key,
      new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 2 })
    );
  }
  return currencyFormatterCache.get(key).format(Number(amount));
}

export function formatDateTime(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatRelative(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.round(diffMs / 60000);
  if (diffMinutes < 1) return 'moments ago';
  if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

export function toLocalInputValue(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

export function parseList(value) {
  if (typeof value !== 'string') {
    return [];
  }
  return value
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function toFriendlyLabel(value) {
  if (!value) return '—';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (token) => token.toUpperCase());
}

export function rentalMatchesSearch(rental, searchTerm) {
  if (!searchTerm) return true;
  const lower = searchTerm.toLowerCase();
  return (
    rental.rentalNumber?.toLowerCase().includes(lower) ||
    rental.item?.name?.toLowerCase().includes(lower) ||
    rental.item?.sku?.toLowerCase().includes(lower)
  );
}
