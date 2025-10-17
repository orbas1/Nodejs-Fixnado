const numberFormatterCache = new Map();
const currencyFormatterCache = new Map();

function getNumberFormatter(options = {}) {
  const key = JSON.stringify(options);
  if (!numberFormatterCache.has(key)) {
    numberFormatterCache.set(key, new Intl.NumberFormat('en-GB', options));
  }
  return numberFormatterCache.get(key);
}

function getCurrencyFormatter(currency = 'GBP', options = {}) {
  const key = `${currency}:${JSON.stringify(options)}`;
  if (!currencyFormatterCache.has(key)) {
    currencyFormatterCache.set(
      key,
      new Intl.NumberFormat('en-GB', { style: 'currency', currency, ...options })
    );
  }
  return currencyFormatterCache.get(key);
}

export function formatNumber(value, options = {}) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }
  return getNumberFormatter(options).format(Number(value));
}

export function formatCurrency(value, currency = 'GBP', options = {}) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }
  return getCurrencyFormatter(currency, options).format(Number(value));
}

export function formatPercent(value, { multiplyBy100 = true, maximumFractionDigits = 2 } = {}) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return '—';
  }
  const numeric = Number(value);
  const percentValue = multiplyBy100 ? numeric * 100 : numeric;
  return `${formatNumber(percentValue, { maximumFractionDigits })}%`;
}

export function formatDate(value, options = { dateStyle: 'medium' }) {
  if (!value) {
    return '—';
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return new Intl.DateTimeFormat('en-GB', options).format(date);
}

export function formatStatus(status) {
  if (!status) {
    return 'Unknown';
  }
  const readable = String(status)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
  return readable;
}

export default {
  formatNumber,
  formatCurrency,
  formatPercent,
  formatDate,
  formatStatus
};
