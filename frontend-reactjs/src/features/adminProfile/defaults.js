export const NOTIFICATION_DEFAULTS = {
  securityAlerts: true,
  incidentEscalations: true,
  weeklyDigest: true,
  productUpdates: false,
  smsAlerts: false
};

export const SECURITY_DEFAULTS = {
  requireMfa: true,
  loginAlerts: true,
  allowSessionShare: false,
  sessionTimeoutMinutes: 60
};

export const WORKING_HOURS_DEFAULTS = { start: '09:00', end: '17:30' };

export const THEME_OPTIONS = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' }
];

export const ESCALATION_METHOD_OPTIONS = [
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'phone', label: 'Phone' },
  { value: 'slack', label: 'Slack' },
  { value: 'pagerduty', label: 'PagerDuty' }
];

export const ESCALATION_PRIORITY_OPTIONS = [
  { value: 'p0', label: 'P0 • Critical' },
  { value: 'p1', label: 'P1 • High' },
  { value: 'p2', label: 'P2 • Normal' },
  { value: 'p3', label: 'P3 • Low' }
];

export const MAX_ESCALATION_CONTACTS = 6;
export const MAX_DELEGATES = 5;
export const MAX_RESOURCE_LINKS = 8;
