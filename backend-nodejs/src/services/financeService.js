import config from '../config/index.js';
import { getCachedPlatformSettings } from './platformSettingsService.js';

function normaliseCurrency(code) {
  return (code || '').toUpperCase();
}

function toNumber(value) {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  throw new Error('Invalid numeric value supplied to finance service');
}

function roundCurrency(value) {
  return Number.parseFloat(value.toFixed(2));
}

function resolveRate(map, candidates, defaultValue) {
  for (const key of candidates) {
    if (Object.hasOwn(map, key)) {
      return toNumber(map[key]);
    }
  }

  if (defaultValue !== undefined) {
    return toNumber(defaultValue);
  }

  throw new Error(`No configured rate for keys: ${candidates.join(', ')}`);
}

function convertCurrency(amount, fromCurrency, toCurrency) {
  const { exchangeRates } = config.finance;
  const from = normaliseCurrency(fromCurrency);
  const to = normaliseCurrency(toCurrency);

  if (from === to) {
    return roundCurrency(amount);
  }

  const fromRate = resolveRate(exchangeRates, [from], exchangeRates.default || 1);
  const toRate = resolveRate(exchangeRates, [to], exchangeRates.default || 1);

  return roundCurrency((amount / fromRate) * toRate);
}

export function calculateBookingTotals({
  baseAmount,
  currency,
  type,
  demandLevel,
  targetCurrency
}) {
  const amount = toNumber(baseAmount);
  const bookingType = type || 'on_demand';
  const demand = demandLevel || 'medium';
  const nativeCurrency = normaliseCurrency(currency || config.finance.defaultCurrency);
  const outputCurrency = normaliseCurrency(targetCurrency || nativeCurrency);

  const platformSettings = getCachedPlatformSettings();
  const commissionSettings = platformSettings.commissions ?? {};
  const commissionEnabled = commissionSettings.enabled !== false;
  const commissionRates = {
    ...(commissionSettings.customRates ?? {}),
    ...(config.finance.commissionRates ?? {})
  };
  const baseCommissionRate = commissionEnabled
    ? toNumber(commissionSettings.baseRate ?? commissionRates.default ?? 0)
    : 0;

  commissionRates.default = baseCommissionRate;

  const commissionRate = commissionEnabled
    ? resolveRate(commissionRates, [`${bookingType}:${demand}`, bookingType, demand, 'default'], baseCommissionRate)
    : 0;

  const taxRate = resolveRate(
    config.finance.taxRates,
    [outputCurrency, nativeCurrency, config.finance.defaultCurrency],
    0
  );

  const grossInNative = convertCurrency(amount, nativeCurrency, outputCurrency);
  const commissionAmount = roundCurrency(grossInNative * commissionRate);
  const taxableBase = grossInNative + commissionAmount;
  const taxAmount = roundCurrency(taxableBase * taxRate);
  const totalAmount = roundCurrency(taxableBase + taxAmount);

  return {
    currency: outputCurrency,
    commissionAmount,
    taxAmount,
    totalAmount,
    baseAmount: roundCurrency(grossInNative),
    commissionRate,
    taxRate
  };
}

export function resolveSlaExpiry(type) {
  const { slaTargetsMinutes } = config.finance;
  const key = type || 'on_demand';
  const minutes = resolveRate(slaTargetsMinutes, [key, 'default'], 180);
  const now = new Date();
  return new Date(now.getTime() + minutes * 60 * 1000);
}
