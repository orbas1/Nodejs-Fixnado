import { formatCurrency } from '../../utils/numberFormatters.js';

export const COMMISSION_PERCENT_PRECISION = 100;

export function percentFromRate(rate) {
  const numeric = Number.parseFloat(rate ?? 0);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.round(numeric * 100 * COMMISSION_PERCENT_PRECISION) / COMMISSION_PERCENT_PRECISION;
}

export function rateFromPercent(percent) {
  const numeric = Number.parseFloat(percent ?? 0);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  const ratio = numeric / 100;
  if (ratio < 0) return 0;
  if (ratio > 1) return 1;
  return Math.round(ratio * COMMISSION_PERCENT_PRECISION) / COMMISSION_PERCENT_PRECISION;
}

export function listToText(list) {
  return Array.isArray(list) ? list.join(', ') : '';
}

export function textToList(value) {
  if (typeof value !== 'string') {
    return [];
  }
  return value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function ensureCurrency(value, fallback = 'GBP') {
  if (typeof value !== 'string') {
    return fallback;
  }
  const next = value.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(next) ? next : fallback;
}

export function slugify(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export function normaliseStructure(structure, fallbackPercent = 2.5) {
  const rateType = structure?.rateType === 'flat' ? 'flat' : 'percentage';
  const rateValue = Number.parseFloat(structure?.rateValue ?? structure?.rate ?? 0) || 0;
  return {
    id: structure?.id ?? '',
    name: structure?.name ?? '',
    description: structure?.description ?? '',
    rateType,
    ratePercent: rateType === 'percentage' ? percentFromRate(rateValue) || fallbackPercent : fallbackPercent,
    flatAmount: rateType === 'flat' ? rateValue : 0,
    currency: ensureCurrency(structure?.currency, 'GBP'),
    appliesToText: listToText(structure?.appliesTo ?? []),
    payoutDelayDays: structure?.payoutDelayDays ?? 0,
    minBookingValue: structure?.minBookingValue ?? '',
    maxBookingValue: structure?.maxBookingValue ?? '',
    active: structure?.active !== false,
    imageUrl: structure?.imageUrl ?? ''
  };
}

export function normalisePackage(tier) {
  const intervalRaw = tier?.billingInterval ?? tier?.billing?.interval ?? 'month';
  const interval = typeof intervalRaw === 'string' ? intervalRaw.toLowerCase() : 'month';
  return {
    id: tier?.id ?? '',
    label: tier?.label ?? '',
    description: tier?.description ?? '',
    priceAmount:
      typeof tier?.price?.amount === 'number'
        ? tier.price.amount
        : Number.parseFloat(tier?.priceAmount ?? tier?.price?.amount ?? 0) || 0,
    priceCurrency: ensureCurrency(tier?.price?.currency ?? tier?.priceCurrency ?? 'GBP', 'GBP'),
    billingInterval: ['week', 'month', 'year'].includes(interval) ? interval : 'month',
    billingFrequency: Number.parseInt(tier?.billingFrequency ?? tier?.billing?.intervalCount ?? 1, 10) || 1,
    trialDays: Number.parseInt(tier?.trialDays ?? 0, 10) || 0,
    badge: tier?.badge ?? '',
    imageUrl: tier?.imageUrl ?? '',
    featuresText: listToText(tier?.features ?? []),
    roleAccessText: listToText(tier?.roleAccess ?? []),
    highlight: tier?.highlight === true,
    supportUrl: tier?.supportUrl ?? ''
  };
}

export function derivePackageId(pkg) {
  return pkg?.id || slugify(pkg?.label ?? '');
}

export function deriveStructureId(structure) {
  return structure?.id || slugify(structure?.name ?? '');
}

export function packageOptions(packages) {
  return packages.map((tier) => ({ value: tier.id || slugify(tier.label), label: tier.label || tier.id || 'Package' }));
}

export function formatPercent(value) {
  const numeric = Number.parseFloat(value ?? 0) || 0;
  return numeric.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function describeStructureRate(structure) {
  if (structure.rateType === 'flat') {
    return `${formatCurrency(Number.parseFloat(structure.flatAmount) || 0, structure.currency)} per booking`;
  }
  return `${formatPercent(structure.ratePercent ?? 0)}% platform share`;
}

export function describeBillingSummary(pkg) {
  const price = Number.parseFloat(pkg.priceAmount ?? 0) || 0;
  const currency = ensureCurrency(pkg.priceCurrency ?? 'GBP', 'GBP');
  const interval = pkg.billingInterval || 'month';
  const frequency = Number.parseInt(pkg.billingFrequency ?? 1, 10) || 1;
  const amountLabel = new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2
  }).format(price);
  if (frequency === 1) {
    return `${amountLabel} / ${interval}`;
  }
  return `${amountLabel} every ${frequency} ${interval}${frequency === 1 ? '' : 's'}`;
}

export function buildFormState(settings) {
  return {
    commissions: {
      enabled: settings.commissions?.enabled !== false,
      baseRatePercent:
        settings.commissions?.baseRate !== undefined ? percentFromRate(settings.commissions.baseRate) : 2.5,
      customRates: Object.entries(settings.commissions?.customRates ?? {}).map(([key, rate]) => ({
        key,
        ratePercent: percentFromRate(rate)
      })),
      structures: (settings.commissions?.structures ?? []).map((structure) =>
        normaliseStructure(structure, percentFromRate(settings.commissions?.baseRate ?? 0.025))
      )
    },
    subscriptions: {
      enabled: settings.subscriptions?.enabled !== false,
      enforceFeatures: settings.subscriptions?.enforceFeatures !== false,
      defaultTier: settings.subscriptions?.defaultTier ?? '',
      restrictedFeaturesText: listToText(settings.subscriptions?.restrictedFeatures ?? []),
      packages: (settings.subscriptions?.tiers ?? settings.subscriptions?.packages ?? []).map((tier) =>
        normalisePackage(tier)
      )
    },
    integrations: {
      stripe: { ...(settings.integrations?.stripe ?? {}) },
      escrow: { ...(settings.integrations?.escrow ?? {}) },
      smtp: { ...(settings.integrations?.smtp ?? {}) },
      cloudflareR2: { ...(settings.integrations?.cloudflareR2 ?? {}) },
      app: { ...(settings.integrations?.app ?? {}) },
      database: { ...(settings.integrations?.database ?? {}) }
    }
  };
}

export function buildMetaSnapshot(settings) {
  const commissionState = settings.commissions?.enabled === false ? 'Disabled' : 'Enabled';
  const commissionRate = (
    settings.commissions?.baseRate !== undefined
      ? percentFromRate(settings.commissions.baseRate)
      : 2.5
  ).toLocaleString(undefined, {
    maximumFractionDigits: 2
  });
  const subscriptionState = settings.subscriptions?.enabled === false ? 'Subscriptions disabled' : 'Subscriptions active';
  const enforced = settings.subscriptions?.enforceFeatures !== false ? 'Feature gating on' : 'Feature gating off';
  const stripeConfigured = settings.integrations?.stripe?.secretKey ? 'Connected' : 'Pending setup';

  return [
    {
      label: 'Commission status',
      value: `${commissionState} • ${commissionRate}%`,
      caption: 'Applied to new bookings and analytics rollups.'
    },
    {
      label: 'Subscription guardrails',
      value: `${subscriptionState}`,
      caption: enforced
    },
    {
      label: 'Stripe integration',
      value: stripeConfigured,
      caption: settings.integrations?.stripe?.publishableKey ? 'Keys present' : 'Missing publishable key'
    }
  ];
}
