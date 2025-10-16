export const DEFAULT_PROFILE = Object.freeze({
  firstName: '',
  lastName: '',
  email: '',
  phoneNumber: '',
  profileImageUrl: ''
});

export const DEFAULT_PREFERENCES = Object.freeze({
  timezone: 'Europe/London',
  locale: 'en-GB',
  defaultCurrency: 'GBP',
  weeklySummaryEnabled: true,
  dispatchAlertsEnabled: true,
  escrowAlertsEnabled: true,
  conciergeAlertsEnabled: true,
  quietHoursStart: '',
  quietHoursEnd: ''
});

export const DEFAULT_SECURITY = Object.freeze({ twoFactorApp: false, twoFactorEmail: false });

export const DEFAULT_CATALOGS = Object.freeze({
  timezones: ['Europe/London', 'UTC'],
  locales: ['en-GB'],
  currencies: ['GBP'],
  channels: ['email', 'sms', 'slack', 'webhook'],
  roles: ['viewer', 'approver', 'finance', 'admin']
});

export const EMPTY_ALERTS = Object.freeze({
  profile: null,
  preferences: null,
  security: null,
  recipients: null
});

export const RECIPIENT_TEMPLATE = Object.freeze({
  label: '',
  channel: 'email',
  target: '',
  role: 'viewer',
  enabled: true
});
