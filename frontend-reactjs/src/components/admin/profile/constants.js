export const DEFAULT_FORM = {
  profile: {
    firstName: '',
    lastName: '',
    email: '',
    jobTitle: '',
    department: '',
    phoneNumber: '',
    avatarUrl: '',
    timezone: 'UTC'
  },
  address: {
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: ''
  },
  notifications: {
    email: true,
    sms: false,
    push: false,
    slack: false,
    pagerDuty: false,
    weeklyDigest: true
  },
  notificationEmails: []
};

export const TIMEZONE_OPTIONS = [
  'UTC',
  'Europe/London',
  'Europe/Paris',
  'America/New_York',
  'America/Los_Angeles',
  'America/Chicago',
  'Asia/Singapore',
  'Asia/Kolkata',
  'Australia/Sydney'
];

export const NOTIFICATION_ITEMS = [
  {
    id: 'email',
    label: 'Email alerts',
    description: 'Booking updates, approvals, and compliance reminders.'
  },
  {
    id: 'sms',
    label: 'SMS alerts',
    description: 'Urgent escalations routed directly to your handset.'
  },
  {
    id: 'push',
    label: 'Push notifications',
    description: 'Mobile push alerts for live incidents and dispatch changes.'
  },
  {
    id: 'slack',
    label: 'Slack webhook',
    description: 'Send notifications to the Fixnado #control-tower channel.'
  },
  {
    id: 'pagerDuty',
    label: 'PagerDuty integration',
    description: 'Escalate Sev0 events to the on-call rota.'
  },
  {
    id: 'weeklyDigest',
    label: 'Weekly digest email',
    description: 'Summary of activity, approvals, and outstanding tasks.'
  }
];

export const DELEGATE_STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' }
];

export function buildForm(data) {
  if (!data) {
    return { ...DEFAULT_FORM, notifications: { ...DEFAULT_FORM.notifications } };
  }

  return {
    profile: { ...DEFAULT_FORM.profile, ...(data.profile ?? {}) },
    address: { ...DEFAULT_FORM.address, ...(data.address ?? {}) },
    notifications: { ...DEFAULT_FORM.notifications, ...(data.notifications ?? {}) },
    notificationEmails: Array.isArray(data.notificationEmails) ? data.notificationEmails.slice() : []
  };
}

export function createEmptyDelegateForm() {
  return {
    id: '',
    name: '',
    email: '',
    role: '',
    avatarUrl: '',
    status: 'active',
    permissionsText: ''
  };
}

export function formatUpdatedAt(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}
