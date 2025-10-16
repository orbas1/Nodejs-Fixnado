export const CATEGORY_OPTIONS = [
  { value: 'all', label: 'All categories' },
  { value: 'pipeline', label: 'Pipelines' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'dispute', label: 'Disputes' },
  { value: 'security', label: 'Security' },
  { value: 'governance', label: 'Governance' },
  { value: 'product', label: 'Product' },
  { value: 'other', label: 'Other' }
];

export const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'cancelled', label: 'Cancelled' }
];

export const TIMEFRAME_OPTIONS = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' }
];

export const CATEGORY_LABELS = CATEGORY_OPTIONS.filter((item) => item.value !== 'all').reduce(
  (acc, option) => ({ ...acc, [option.value]: option.label }),
  {}
);

export const STATUS_LABELS = {
  scheduled: { label: 'Scheduled', tone: 'info' },
  in_progress: { label: 'In progress', tone: 'warning' },
  completed: { label: 'Completed', tone: 'success' },
  blocked: { label: 'Blocked', tone: 'danger' },
  cancelled: { label: 'Cancelled', tone: 'neutral' }
};
