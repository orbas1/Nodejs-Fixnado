const cache = new Map();

function getFormatter(currency) {
  const key = currency || 'GBP';
  if (cache.has(key)) {
    return cache.get(key);
  }
  const formatter = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: key,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  cache.set(key, formatter);
  return formatter;
}

export function formatCurrency(amount, currency = 'GBP') {
  const numeric = Number.isFinite(amount) ? amount : Number(amount) || 0;
  try {
    return getFormatter(currency).format(numeric);
  } catch {
    return `£${numeric.toFixed(2)}`;
  }
}

export default { formatCurrency };
