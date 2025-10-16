export const EVENT_TYPES = [
  { value: 'live_feed.post.created', label: 'Job posted' },
  { value: 'live_feed.bid.created', label: 'Bid submitted' },
  { value: 'live_feed.bid.message', label: 'Bid message' },
  { value: 'live_feed.assignment.updated', label: 'Assignment updated' },
  { value: 'live_feed.attachment.flagged', label: 'Attachment flagged' }
];

export const SEVERITY_OPTIONS = [
  { value: 'info', label: 'Info' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' }
];

export const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' }
];

export const TIMEFRAME_OPTIONS = [
  { value: '24h', label: '24 hours' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: 'custom', label: 'Custom range' }
];

export const SORT_FIELDS = [
  { value: 'occurredAt', label: 'Newest first' },
  { value: 'severity', label: 'Severity' },
  { value: 'status', label: 'Status' }
];

export const SORT_DIRECTIONS = [
  { value: 'DESC', label: 'Descending' },
  { value: 'ASC', label: 'Ascending' }
];

export const createEmptyAttachment = () => ({ url: '', label: '' });

export function buildDefaultFilters() {
  return {
    timeframe: '24h',
    eventTypes: [],
    statuses: [],
    severities: [],
    search: '',
    includeNotes: false,
    sortBy: 'occurredAt',
    sortDirection: 'DESC',
    customStart: '',
    customEnd: ''
  };
}

export function buildDefaultCreateForm() {
  return {
    eventType: EVENT_TYPES[0].value,
    summary: '',
    severity: 'medium',
    status: 'open',
    details: '',
    zoneId: '',
    postId: '',
    assigneeId: '',
    nextActionAt: '',
    tags: [],
    attachments: [createEmptyAttachment()],
    metadataText: ''
  };
}
