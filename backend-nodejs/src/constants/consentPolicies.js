import config from '../config/index.js';

const FALLBACK_POLICIES = config.consent?.policies || {};

function mapPolicyEntry([key, value]) {
  return {
    key,
    title: value.title || key,
    version: value.version,
    required: Boolean(value.required),
    region: value.region,
    url: value.url,
    description: value.description,
    retentionYears: value.retentionYears,
    preferenceKey: value.preferenceKey || null
  };
}

export function getConsentPolicies() {
  return Object.entries(FALLBACK_POLICIES).map(mapPolicyEntry);
}

export function getPolicyByKey(policyKey) {
  if (!policyKey) {
    return null;
  }
  const normalisedKey = policyKey.toLowerCase();
  const entry = Object.entries(FALLBACK_POLICIES).find(([key]) => key === normalisedKey);
  if (!entry) {
    return null;
  }
  return mapPolicyEntry(entry);
}

export function getRequiredPolicies() {
  return getConsentPolicies().filter((policy) => policy.required);
}

export default {
  getConsentPolicies,
  getRequiredPolicies,
  getPolicyByKey
};
