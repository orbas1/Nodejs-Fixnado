export const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'ideation', label: 'Ideation' },
  { value: 'discovery', label: 'Discovery' },
  { value: 'pilot', label: 'Pilot' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'live', label: 'Live' },
  { value: 'on_hold', label: 'On hold' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'sunset', label: 'Sunset' }
];

export const STAGE_OPTIONS = [
  { value: 'backlog', label: 'Backlog' },
  { value: 'validation', label: 'Validation' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'stabilisation', label: 'Stabilisation' },
  { value: 'scale', label: 'Scale' }
];

export const PRIORITY_OPTIONS = [
  { value: 'all', label: 'All priorities' },
  { value: 'now', label: 'Now' },
  { value: 'next', label: 'Next' },
  { value: 'later', label: 'Later' }
];

export const PRIORITY_SEGMENTS = PRIORITY_OPTIONS.map((option) => ({
  label: option.label,
  value: option.value
}));

export const RISK_OPTIONS = [
  { value: 'low', label: 'Low risk' },
  { value: 'medium', label: 'Medium risk' },
  { value: 'high', label: 'High risk' }
];

export const ROLE_OPTIONS = [
  { value: 'admin', label: 'Platform admin' },
  { value: 'operations', label: 'Operations control' },
  { value: 'provider_admin', label: 'Provider admin' },
  { value: 'enterprise', label: 'Enterprise lead' }
];

export const SECTION_HEADER_CLASS = 'mb-6 space-y-2';
export const SECTION_TITLE_CLASS = 'text-2xl font-semibold text-primary';
export const SECTION_DESCRIPTION_CLASS = 'text-sm text-slate-600 max-w-2xl';

export const CARD_GRID_CLASS = 'grid gap-6 lg:grid-cols-2 xl:grid-cols-3';
export const CARD_CLASS =
  'rounded-3xl border border-accent/10 bg-white/95 p-6 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg';

export const DEFAULT_FORM_STATE = {
  id: null,
  name: '',
  summary: '',
  status: 'ideation',
  stage: 'backlog',
  category: '',
  automationType: '',
  owner: '',
  sponsor: '',
  squad: '',
  readinessScore: 0,
  priority: 'next',
  riskLevel: 'medium',
  targetMetric: '',
  baselineMetric: '',
  forecastMetric: '',
  estimatedSavings: '',
  savingsCurrency: 'GBP',
  expectedLaunchAt: '',
  nextMilestoneOn: '',
  lastReviewedAt: '',
  notes: '',
  allowedRoles: ['admin'],
  dependencies: [],
  blockers: [],
  attachments: [],
  images: [],
  metadata: {}
};
