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
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function listToMultilineText(list) {
  return Array.isArray(list) ? list.join('\n') : '';
}

export function multilineTextToList(value) {
  if (typeof value !== 'string') {
    return [];
  }
  return value
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function slugify(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function normaliseTier(tier) {
  return {
    id: tier?.id ?? '',
    label: tier?.label ?? '',
    description: tier?.description ?? '',
    featuresText: listToText(tier?.features ?? [])
  };
}

export function buildPlatformFormState(settings) {
  return {
    commissions: {
      enabled: settings?.commissions?.enabled !== false,
      baseRatePercent:
        settings?.commissions?.baseRate !== undefined
          ? percentFromRate(settings.commissions.baseRate)
          : 2.5,
      customRates: Object.entries(settings?.commissions?.customRates ?? {}).map(([key, value]) => ({
        key,
        ratePercent: percentFromRate(value)
      }))
    },
    subscriptions: {
      enabled: settings?.subscriptions?.enabled !== false,
      enforceFeatures: settings?.subscriptions?.enforceFeatures !== false,
      defaultTier: settings?.subscriptions?.defaultTier || 'standard',
      restrictedFeaturesText: listToText(settings?.subscriptions?.restrictedFeatures ?? []),
      tiers: (settings?.subscriptions?.tiers ?? []).map(normaliseTier)
    },
    integrations: {
      stripe: { ...(settings?.integrations?.stripe ?? {}) },
      escrow: { ...(settings?.integrations?.escrow ?? {}) },
      smtp: { ...(settings?.integrations?.smtp ?? {}) },
      cloudflareR2: { ...(settings?.integrations?.cloudflareR2 ?? {}) },
      app: { ...(settings?.integrations?.app ?? {}) },
      database: { ...(settings?.integrations?.database ?? {}) }
    }
  };
}

export function tierOptions(tiers) {
  return tiers.map((tier) => ({ value: tier.id || slugify(tier.label), label: tier.label || tier.id || 'Tier' }));
}

export function buildMetaSnapshot(settings) {
  if (!settings) return [];
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

export function normaliseAffiliateResource(resource = {}) {
  return {
    id: resource.id ?? '',
    label: resource.label ?? '',
    url: resource.url ?? '',
    type: resource.type ?? 'link',
    description: resource.description ?? '',
    rolesText: listToText(resource.roles ?? []),
    openInNewTab: resource.openInNewTab !== false
  };
}

export function normaliseAffiliateAsset(asset = {}) {
  return {
    id: asset.id ?? '',
    label: asset.label ?? '',
    type: asset.type ?? 'image',
    url: asset.url ?? '',
    previewUrl: asset.previewUrl ?? '',
    description: asset.description ?? ''
  };
}

export function normaliseAffiliateTier(tier = {}) {
  return {
    id: tier.id ?? '',
    label: tier.label ?? '',
    headline: tier.headline ?? '',
    description: tier.description ?? '',
    requirement: tier.requirement ?? '',
    badgeColor: tier.badgeColor ?? '#1445E0',
    imageUrl: tier.imageUrl ?? '',
    benefitsText: listToMultilineText(tier.benefits ?? [])
  };
}

export function buildAffiliateFormState(settings = {}) {
  return {
    programmeName: settings.programmeName ?? 'Fixnado Affiliate Program',
    programmeTagline: settings.programmeTagline ?? '',
    contactEmail: settings.contactEmail ?? '',
    partnerPortalUrl: settings.partnerPortalUrl ?? '',
    landingPageUrl: settings.landingPageUrl ?? '',
    onboardingGuideUrl: settings.onboardingGuideUrl ?? '',
    welcomeEmailSubject: settings.welcomeEmailSubject ?? '',
    welcomeEmailBody: settings.welcomeEmailBody ?? '',
    disclosureUrl: settings.disclosureUrl ?? '',
    heroImageUrl: settings.heroImageUrl ?? '',
    logoUrl: settings.logoUrl ?? '',
    brandColor: settings.brandColor ?? '#1445E0',
    autoApproveReferrals: settings.autoApproveReferrals !== false,
    payoutCadenceDays: settings.payoutCadenceDays ?? 30,
    minimumPayoutAmount: settings.minimumPayoutAmount ?? 0,
    referralAttributionWindowDays: settings.referralAttributionWindowDays ?? 30,
    resources: (settings.resources ?? []).map(normaliseAffiliateResource),
    assetLibrary: (settings.assetLibrary ?? []).map(normaliseAffiliateAsset),
    tiers: (settings.tiers ?? []).map(normaliseAffiliateTier)
  };
}

export function buildAffiliateMetaSnapshot(settings, rules = []) {
  if (!settings) {
    return [];
  }
  const activeRules = rules.filter((rule) => rule.isActive).length;
  return [
    {
      label: 'Affiliate payouts',
      value: `Every ${settings.payoutCadenceDays} days`,
      caption: settings.autoApproveReferrals ? 'Auto approval enabled for trusted partners.' : 'Manual approval workflow active.'
    },
    {
      label: 'Active commission tiers',
      value: activeRules.toString(),
      caption: 'Live rules influencing referral earnings.'
    }
  ];
}

export function buildRuleDraft(rule) {
  if (!rule) {
    return {
      id: null,
      name: '',
      tierLabel: '',
      commissionRate: '',
      minTransactionValue: '',
      maxTransactionValue: '',
      recurrenceType: 'one_time',
      recurrenceLimit: '',
      priority: '100',
      currency: 'USD',
      isActive: true,
      metadata: {
        summary: '',
        badgeColor: '#1445E0',
        badgeIcon: '',
        landingPageUrl: '',
        perksText: ''
      }
    };
  }

  return {
    id: rule.id,
    name: rule.name ?? '',
    tierLabel: rule.tierLabel ?? '',
    commissionRate:
      rule.commissionRate != null && rule.commissionRate !== ''
        ? Number.parseFloat(rule.commissionRate).toString()
        : '',
    minTransactionValue:
      rule.minTransactionValue != null && rule.minTransactionValue !== ''
        ? Number.parseFloat(rule.minTransactionValue).toString()
        : '',
    maxTransactionValue:
      rule.maxTransactionValue != null && rule.maxTransactionValue !== ''
        ? Number.parseFloat(rule.maxTransactionValue).toString()
        : '',
    recurrenceType: rule.recurrenceType ?? 'one_time',
    recurrenceLimit:
      rule.recurrenceLimit != null && rule.recurrenceLimit !== ''
        ? Number.parseInt(rule.recurrenceLimit, 10).toString()
        : '',
    priority:
      rule.priority != null && rule.priority !== ''
        ? Number.parseInt(rule.priority, 10).toString()
        : '100',
    currency: rule.currency ?? 'USD',
    isActive: rule.isActive !== false,
    metadata: {
      summary: rule.metadata?.summary ?? '',
      badgeColor: rule.metadata?.badgeColor ?? '#1445E0',
      badgeIcon: rule.metadata?.badgeIcon ?? '',
      landingPageUrl: rule.metadata?.landingPageUrl ?? '',
      perksText: listToMultilineText(rule.metadata?.perks ?? [])
    }
  };
}
