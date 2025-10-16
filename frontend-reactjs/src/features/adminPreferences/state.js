export const THEME_OPTIONS = [
  { value: 'system', label: 'Match system' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' }
];

export const SECTION_LABELS = Object.freeze({
  general: 'Branding & locale',
  notifications: 'Notifications & escalations',
  security: 'Security posture',
  workspace: 'Workspace experience'
});

export function formatSectionList(sections) {
  if (!Array.isArray(sections) || sections.length === 0) {
    return 'No updates recorded';
  }
  return sections.map((section) => SECTION_LABELS[section] ?? section).join(', ');
}

export function normaliseMeta(meta = {}) {
  const changedSections = Array.isArray(meta.changedSections)
    ? meta.changedSections
        .map((section) => (typeof section === 'string' ? section.trim() : ''))
        .filter((section) => section.length > 0)
    : [];
  return {
    updatedAt: meta.updatedAt ?? null,
    updatedBy: meta.updatedBy ?? null,
    version: typeof meta.version === 'number' ? meta.version : null,
    changedSections
  };
}

export function cloneFormState(state) {
  if (!state) {
    return null;
  }
  return JSON.parse(JSON.stringify(state));
}

export function buildLinkId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `link-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function normaliseList(list = []) {
  if (!Array.isArray(list) || list.length === 0) {
    return [];
  }
  return list.map((item) => (typeof item === 'string' ? item : '')).filter((item) => item !== null && item !== undefined);
}

export function buildFormState(preferences) {
  const snapshot = preferences ?? {};
  const escalationEmails = normaliseList(snapshot.notifications?.escalationEmails);
  const ipAllowlist = normaliseList(snapshot.security?.ipAllowlist);
  const loginAlertEmails = normaliseList(snapshot.security?.loginAlertEmails);
  const allowedAdminRoles = normaliseList(snapshot.workspace?.allowedAdminRoles);

  return {
    general: {
      platformName: snapshot.general?.platformName ?? 'Fixnado',
      supportEmail: snapshot.general?.supportEmail ?? '',
      defaultLocale: snapshot.general?.defaultLocale ?? 'en-GB',
      defaultTimezone: snapshot.general?.defaultTimezone ?? 'Europe/London',
      brandColor: snapshot.general?.brandColor ?? '#1D4ED8',
      loginUrl: snapshot.general?.loginUrl ?? ''
    },
    notifications: {
      emailEnabled: snapshot.notifications?.emailEnabled !== false,
      smsEnabled: snapshot.notifications?.smsEnabled === true,
      pushEnabled: snapshot.notifications?.pushEnabled !== false,
      dailyDigestHour:
        typeof snapshot.notifications?.dailyDigestHour === 'number' ? snapshot.notifications.dailyDigestHour : 8,
      digestTimezone: snapshot.notifications?.digestTimezone ?? 'Europe/London',
      escalationEmails: escalationEmails.length > 0 ? escalationEmails : [''],
      incidentWebhookUrl: snapshot.notifications?.incidentWebhookUrl ?? ''
    },
    security: {
      requireMfa: snapshot.security?.requireMfa !== false,
      allowPasswordless: snapshot.security?.allowPasswordless === true,
      sessionTimeoutMinutes:
        typeof snapshot.security?.sessionTimeoutMinutes === 'number' ? snapshot.security.sessionTimeoutMinutes : 30,
      passwordRotationDays:
        typeof snapshot.security?.passwordRotationDays === 'number' ? snapshot.security.passwordRotationDays : 90,
      ipAllowlist: ipAllowlist.length > 0 ? ipAllowlist : [''],
      loginAlertEmails: loginAlertEmails.length > 0 ? loginAlertEmails : ['']
    },
    workspace: {
      maintenanceMode: snapshot.workspace?.maintenanceMode === true,
      maintenanceMessage: snapshot.workspace?.maintenanceMessage ?? '',
      defaultLandingPage: snapshot.workspace?.defaultLandingPage ?? '/admin/dashboard',
      theme: snapshot.workspace?.theme ?? 'system',
      enableBetaFeatures: snapshot.workspace?.enableBetaFeatures === true,
      allowedAdminRoles: allowedAdminRoles.length > 0 ? allowedAdminRoles : ['admin'],
      quickLinks: Array.isArray(snapshot.workspace?.quickLinks)
        ? snapshot.workspace.quickLinks.map((entry, index) => ({
            id: buildLinkId(),
            label: entry?.label ?? `Quick link ${index + 1}`,
            href: entry?.href ?? ''
          }))
        : []
    }
  };
}

export function buildPayload(form) {
  const payload = {
    general: {
      platformName: form.general.platformName.trim(),
      supportEmail: form.general.supportEmail.trim(),
      defaultLocale: form.general.defaultLocale.trim(),
      defaultTimezone: form.general.defaultTimezone.trim(),
      brandColor: form.general.brandColor.trim(),
      loginUrl: form.general.loginUrl.trim()
    },
    notifications: {
      emailEnabled: Boolean(form.notifications.emailEnabled),
      smsEnabled: Boolean(form.notifications.smsEnabled),
      pushEnabled: Boolean(form.notifications.pushEnabled),
      dailyDigestHour: Number.parseInt(form.notifications.dailyDigestHour, 10) || 0,
      digestTimezone: form.notifications.digestTimezone.trim(),
      escalationEmails: form.notifications.escalationEmails.map((email) => email.trim()).filter((email) => email.length > 0),
      incidentWebhookUrl: form.notifications.incidentWebhookUrl.trim()
    },
    security: {
      requireMfa: Boolean(form.security.requireMfa),
      allowPasswordless: Boolean(form.security.allowPasswordless),
      sessionTimeoutMinutes: Number.parseInt(form.security.sessionTimeoutMinutes, 10) || 0,
      passwordRotationDays: Number.parseInt(form.security.passwordRotationDays, 10) || 0,
      ipAllowlist: form.security.ipAllowlist.map((value) => value.trim()).filter((value) => value.length > 0),
      loginAlertEmails: form.security.loginAlertEmails.map((email) => email.trim()).filter((email) => email.length > 0)
    },
    workspace: {
      maintenanceMode: Boolean(form.workspace.maintenanceMode),
      maintenanceMessage: form.workspace.maintenanceMessage.trim(),
      defaultLandingPage: form.workspace.defaultLandingPage.trim() || '/admin/dashboard',
      theme: form.workspace.theme,
      enableBetaFeatures: Boolean(form.workspace.enableBetaFeatures),
      allowedAdminRoles: form.workspace.allowedAdminRoles.map((role) => role.trim()).filter((role) => role.length > 0),
      quickLinks: form.workspace.quickLinks
        .map((link) => ({ label: link.label.trim(), href: link.href.trim() }))
        .filter((link) => link.label && link.href)
    }
  };

  return payload;
}

export function ensureNonEmptyList(list, fallbackValue = '') {
  return list.length > 0 ? list : [fallbackValue];
}

export function buildMetaSummary(preferences, meta) {
  const security = preferences?.security ?? {};
  const notifications = preferences?.notifications ?? {};
  const workspace = preferences?.workspace ?? {};

  const updatedAt = meta?.updatedAt ? new Date(meta.updatedAt) : null;
  const updatedLabel = updatedAt ? updatedAt.toLocaleString() : 'No changes saved';
  const updatedCaption = meta?.updatedBy ? `Updated by ${meta.updatedBy}` : 'Ready for configuration';
  const changedSections = meta?.changedSections ?? [];
  const versionLabel = typeof meta?.version === 'number' ? `v${meta?.version}` : 'Not versioned';

  return [
    {
      label: 'MFA requirement',
      value: security.requireMfa ? 'Required for admins' : 'Optional',
      caption: security.requireMfa
        ? 'All admin sessions must pass MFA.'
        : 'Consider requiring MFA for elevated roles.'
    },
    {
      label: 'Escalation contacts',
      value: `${notifications.escalationEmails?.length ?? 0} email${
        (notifications.escalationEmails?.length ?? 0) === 1 ? '' : 's'
      }`,
      caption: 'Used for incidents, pager duty, and compliance notices.'
    },
    {
      label: 'Workspace mode',
      value: workspace.maintenanceMode ? 'Maintenance active' : 'Live',
      caption: workspace.maintenanceMode
        ? 'Administrators see maintenance messaging.'
        : 'Control centre is accessible to authorised roles.'
    },
    {
      label: 'Last updated',
      value: updatedLabel,
      caption: updatedCaption
    },
    {
      label: 'Recent updates',
      value: formatSectionList(changedSections),
      caption:
        changedSections.length > 0
          ? 'Latest saved sections awaiting verification.'
          : 'Save preferences to begin version history.'
    },
    {
      label: 'Configuration version',
      value: versionLabel,
      caption: 'Incremented each time preferences are saved.'
    }
  ];
}
