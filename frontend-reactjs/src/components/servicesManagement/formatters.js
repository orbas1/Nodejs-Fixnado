import { formatCurrency } from '../../utils/numberFormatters.js';

export const formatDateTime = (value) => {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not scheduled';
  return date.toLocaleString();
};

export const formatMoney = (amount, currency) => {
  if (amount == null) return '—';
  const numeric = Number.parseFloat(amount);
  if (!Number.isFinite(numeric)) {
    return '—';
  }
  return formatCurrency(numeric, currency || 'GBP');
};

export const formatNumber = (value) => {
  const numeric = Number.parseFloat(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  return new Intl.NumberFormat().format(numeric);
};
