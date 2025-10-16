import {
  NOTIFICATION_DEFAULTS,
  SECURITY_DEFAULTS,
  WORKING_HOURS_DEFAULTS
} from './defaults.js';

const ESCALATION_METHOD_LABELS = {
  email: 'Email',
  sms: 'SMS',
  phone: 'Phone',
  slack: 'Slack',
  pagerduty: 'PagerDuty'
};

export function toDateTimeInput(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const pad = (num) => String(num).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function fromDateTimeInput(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString();
}

export function getMethodLabel(method) {
  return ESCALATION_METHOD_LABELS[method] ?? method;
}

export function formatOutOfOfficeWindow(outOfOffice) {
  if (!outOfOffice?.handoverStart && !outOfOffice?.handoverEnd) {
    return 'No coverage window set';
  }

  const formatter = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  });

  const startLabel = outOfOffice?.handoverStart ? formatter.format(new Date(outOfOffice.handoverStart)) : null;
  const endLabel = outOfOffice?.handoverEnd ? formatter.format(new Date(outOfOffice.handoverEnd)) : null;

  if (startLabel && endLabel) {
    return `${startLabel} → ${endLabel}`;
  }

  return startLabel || endLabel || 'No coverage window set';
}

export function normaliseProfile(payload = {}) {
  return {
    firstName: payload.firstName ?? '',
    lastName: payload.lastName ?? '',
    displayName: payload.displayName ?? '',
    jobTitle: payload.jobTitle ?? '',
    department: payload.department ?? '',
    pronouns: payload.pronouns ?? '',
    bio: payload.bio ?? '',
    avatarUrl: payload.avatarUrl ?? '',
    contactEmail: payload.contactEmail ?? '',
    backupEmail: payload.backupEmail ?? '',
    contactPhone: payload.contactPhone ?? '',
    location: payload.location ?? '',
    timezone: payload.timezone ?? 'UTC',
    language: payload.language ?? 'en',
    workingHours: {
      start: payload.workingHours?.start ?? WORKING_HOURS_DEFAULTS.start,
      end: payload.workingHours?.end ?? WORKING_HOURS_DEFAULTS.end
    },
    theme: payload.theme ?? 'system',
    notifications: { ...NOTIFICATION_DEFAULTS, ...(payload.notifications ?? {}) },
    security: {
      ...SECURITY_DEFAULTS,
      ...(payload.security ?? {}),
      sessionTimeoutMinutes: String(payload.security?.sessionTimeoutMinutes ?? SECURITY_DEFAULTS.sessionTimeoutMinutes)
    },
    delegates: Array.isArray(payload.delegates)
      ? payload.delegates.map((delegate) => ({
          name: delegate?.name ?? '',
          email: delegate?.email ?? '',
          role: delegate?.role ?? ''
        }))
      : [],
    escalationContacts: Array.isArray(payload.escalationContacts)
      ? payload.escalationContacts.map((contact) => ({
          method: contact?.method ?? 'email',
          label: contact?.label ?? '',
          destination: contact?.destination ?? '',
          priority: contact?.priority ?? 'p1'
        }))
      : [],
    outOfOffice: {
      enabled: Boolean(payload.outOfOffice?.enabled),
      message: payload.outOfOffice?.message ?? '',
      handoverStart: toDateTimeInput(payload.outOfOffice?.handoverStart),
      handoverEnd: toDateTimeInput(payload.outOfOffice?.handoverEnd),
      delegateEmail: payload.outOfOffice?.delegateEmail ?? ''
    },
    resourceLinks: Array.isArray(payload.resourceLinks)
      ? payload.resourceLinks.map((link) => ({
          label: link?.label ?? '',
          url: link?.url ?? ''
        }))
      : [],
    updatedAt: payload.updatedAt ?? null
  };
}

export function buildMeta(profile) {
  const sessionTimeout = Number.parseInt(profile.security.sessionTimeoutMinutes, 10);
  const timeoutLabel = Number.isFinite(sessionTimeout) ? `${sessionTimeout} minutes` : '60 minutes';
  const escalationCount = Array.isArray(profile.escalationContacts) ? profile.escalationContacts.length : 0;
  const primaryChannel = escalationCount > 0 ? getMethodLabel(profile.escalationContacts[0].method) : null;
  const delegateCount = Array.isArray(profile.delegates) ? profile.delegates.length : 0;

  return [
    {
      label: 'Primary email',
      value: profile.contactEmail || 'Not configured',
      caption: profile.backupEmail ? `Backup: ${profile.backupEmail}` : 'Add a backup address for emergencies.'
    },
    {
      label: 'Multi-factor auth',
      value: profile.security.requireMfa ? 'Required' : 'Optional',
      caption: profile.security.requireMfa
        ? 'Admins must complete multi-factor prompts on every login.'
        : 'Enable MFA to harden administrator access.'
    },
    {
      label: 'Working hours',
      value: `${profile.workingHours.start} – ${profile.workingHours.end}`,
      caption: `Timezone • ${profile.timezone}`
    },
    {
      label: 'Session timeout',
      value: timeoutLabel,
      caption: profile.security.loginAlerts ? 'Login alerts enabled' : 'Login alerts disabled'
    },
    {
      label: 'Escalation coverage',
      value: `${escalationCount} channel${escalationCount === 1 ? '' : 's'}`,
      caption:
        escalationCount > 0 ? `Primary channel • ${primaryChannel}` : 'Add channels for urgent notifications'
    },
    {
      label: 'Delegates configured',
      value: `${delegateCount} delegate${delegateCount === 1 ? '' : 's'}`,
      caption: delegateCount > 0 ? 'Delegates receive mirrored escalations' : 'Provision trusted teammates for coverage'
    },
    {
      label: 'Out of office',
      value: profile.outOfOffice.enabled ? 'Enabled' : 'Inactive',
      caption: profile.outOfOffice.enabled
        ? formatOutOfOfficeWindow(profile.outOfOffice)
        : 'Set a coverage window before stepping away'
    }
  ];
}

function cleanseString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function serialiseProfile(profile) {
  const workingHours = {
    start: profile.workingHours?.start || WORKING_HOURS_DEFAULTS.start,
    end: profile.workingHours?.end || WORKING_HOURS_DEFAULTS.end
  };

  const notifications = Object.entries({ ...NOTIFICATION_DEFAULTS, ...(profile.notifications ?? {}) }).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: Boolean(value)
    }),
    {}
  );

  const sessionTimeout = Number.parseInt(profile.security?.sessionTimeoutMinutes, 10);

  const payload = {
    firstName: cleanseString(profile.firstName),
    lastName: cleanseString(profile.lastName),
    displayName: cleanseString(profile.displayName),
    jobTitle: cleanseString(profile.jobTitle),
    department: cleanseString(profile.department),
    pronouns: cleanseString(profile.pronouns),
    bio: cleanseString(profile.bio),
    avatarUrl: cleanseString(profile.avatarUrl),
    contactEmail: cleanseString(profile.contactEmail),
    backupEmail: cleanseString(profile.backupEmail),
    contactPhone: cleanseString(profile.contactPhone),
    location: cleanseString(profile.location),
    timezone: cleanseString(profile.timezone) || 'UTC',
    language: cleanseString(profile.language) || 'en',
    theme: profile.theme || 'system',
    workingHours,
    notifications,
    security: {
      requireMfa: Boolean(profile.security?.requireMfa),
      loginAlerts: Boolean(profile.security?.loginAlerts),
      allowSessionShare: Boolean(profile.security?.allowSessionShare),
      sessionTimeoutMinutes: Number.isFinite(sessionTimeout) ? sessionTimeout : SECURITY_DEFAULTS.sessionTimeoutMinutes
    },
    delegates: (profile.delegates ?? [])
      .filter((delegate) => cleanseString(delegate.email))
      .map((delegate) => ({
        name: cleanseString(delegate.name),
        email: cleanseString(delegate.email),
        role: cleanseString(delegate.role)
      })),
    escalationContacts: (profile.escalationContacts ?? [])
      .filter((contact) => cleanseString(contact.destination))
      .map((contact) => ({
        method: (contact.method || 'email').toLowerCase(),
        label: cleanseString(contact.label),
        destination: cleanseString(contact.destination),
        priority: (contact.priority || 'p1').toLowerCase()
      })),
    outOfOffice: {
      enabled: Boolean(profile.outOfOffice?.enabled),
      message: cleanseString(profile.outOfOffice?.message),
      handoverStart: profile.outOfOffice?.enabled ? fromDateTimeInput(profile.outOfOffice?.handoverStart) : null,
      handoverEnd: profile.outOfOffice?.enabled ? fromDateTimeInput(profile.outOfOffice?.handoverEnd) : null,
      delegateEmail: profile.outOfOffice?.enabled ? cleanseString(profile.outOfOffice?.delegateEmail) : ''
    },
    resourceLinks: (profile.resourceLinks ?? [])
      .filter((link) => cleanseString(link.url) || cleanseString(link.label))
      .map((link) => ({
        label: cleanseString(link.label),
        url: cleanseString(link.url)
      }))
  };

  if (!payload.outOfOffice.enabled) {
    payload.outOfOffice.message = '';
    payload.outOfOffice.delegateEmail = '';
    payload.outOfOffice.handoverStart = null;
    payload.outOfOffice.handoverEnd = null;
  }

  return payload;
}
