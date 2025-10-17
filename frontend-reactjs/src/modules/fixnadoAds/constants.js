export const CAMPAIGN_STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
];

export const CAMPAIGN_TYPE_OPTIONS = [
  { value: 'ppc', label: 'Pay-per-click' },
  { value: 'ppc_conversion', label: 'Pay-per-conversion' },
  { value: 'ppi', label: 'Pay-per-impression' },
  { value: 'awareness', label: 'Awareness' }
];

export const PACING_STRATEGY_OPTIONS = [
  { value: 'even', label: 'Even pacing' },
  { value: 'asap', label: 'Accelerated pacing' },
  { value: 'lifetime', label: 'Lifetime pacing' }
];

export const BID_STRATEGY_OPTIONS = [
  { value: 'cpc', label: 'Cost per click (CPC)' },
  { value: 'cpm', label: 'Cost per thousand impressions (CPM)' },
  { value: 'cpa', label: 'Cost per acquisition (CPA)' }
];

export const TARGETING_RULE_TYPES = [
  { value: 'zone', label: 'Service zone' },
  { value: 'category', label: 'Service category' },
  { value: 'language', label: 'Language' },
  { value: 'device', label: 'Device' },
  { value: 'audience', label: 'Audience segment' },
  { value: 'schedule', label: 'Schedule window' },
  { value: 'insured_only', label: 'Insured only' },
  { value: 'keyword', label: 'Keyword' }
];

export const TARGETING_OPERATORS = [
  { value: 'include', label: 'Include' },
  { value: 'exclude', label: 'Exclude' }
];

export const CREATIVE_FORMAT_OPTIONS = [
  { value: 'image', label: 'Image' },
  { value: 'video', label: 'Video' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'text', label: 'Text' },
  { value: 'interactive', label: 'Interactive' }
];

export const CREATIVE_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'in_review', label: 'In review' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'retired', label: 'Retired' }
];

export default {
  CAMPAIGN_STATUS_OPTIONS,
  CAMPAIGN_TYPE_OPTIONS,
  PACING_STRATEGY_OPTIONS,
  BID_STRATEGY_OPTIONS,
  TARGETING_RULE_TYPES,
  TARGETING_OPERATORS,
  CREATIVE_FORMAT_OPTIONS,
  CREATIVE_STATUS_OPTIONS
};
