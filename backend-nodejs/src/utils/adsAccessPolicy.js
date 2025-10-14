const NORMALISED_LEVELS = ['view', 'manage'];

const ADS_ACCESS_MATRIX = {
  provider: {
    available: true,
    level: 'manage',
    label: 'Provider Ads Manager',
    features: ['campaigns', 'billing', 'guardrails', 'targeting']
  },
  enterprise: {
    available: true,
    level: 'view',
    label: 'Enterprise Ads Performance',
    features: ['campaigns', 'billing', 'guardrails']
  },
  admin: {
    available: true,
    level: 'view',
    label: 'Control Tower Read-only',
    features: ['campaigns', 'billing']
  }
};

export const normaliseAccessLevel = (value) => {
  if (!value) return 'view';
  const lower = String(value).toLowerCase();
  return NORMALISED_LEVELS.includes(lower) ? lower : 'view';
};

export const getAdsAccessPolicy = (persona) => {
  if (!persona) {
    return {
      available: false,
      level: 'view',
      label: 'Unavailable',
      features: []
    };
  }

  const policy = ADS_ACCESS_MATRIX[persona.toLowerCase()];
  if (!policy) {
    return {
      available: false,
      level: 'view',
      label: 'Unavailable',
      features: []
    };
  }

  return {
    ...policy,
    level: normaliseAccessLevel(policy.level)
  };
};

export const canPersonaAccessAds = (persona) => Boolean(getAdsAccessPolicy(persona).available);

export const annotateAdsSection = (persona, section = {}) => {
  const policy = getAdsAccessPolicy(persona);
  if (!policy.available) {
    return null;
  }

  return {
    ...section,
    access: {
      level: policy.level,
      label: policy.label,
      features: policy.features
    }
  };
};

export const buildAdsFeatureMetadata = (persona) => {
  const policy = getAdsAccessPolicy(persona);
  return {
    available: policy.available,
    level: policy.level,
    label: policy.label,
    features: policy.features
  };
};

export default {
  getAdsAccessPolicy,
  canPersonaAccessAds,
  annotateAdsSection,
  buildAdsFeatureMetadata,
  normaliseAccessLevel
};
