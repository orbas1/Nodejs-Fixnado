const PROFILE_STORAGE_KEY = 'fixnado:profile';

const DIGEST_OPTIONS = new Set(['never', 'daily', 'weekly']);

export const DEFAULT_PROFILE = Object.freeze({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  organisation: '',
  jobTitle: '',
  teamName: '',
  address: '',
  timezone: 'UTC',
  locale: 'en-GB',
  avatarUrl: '',
  signature: '',
  communicationPreferences: {
    emailAlerts: true,
    smsAlerts: false,
    pushAlerts: false,
    marketingOptIn: false,
    digestFrequency: 'weekly'
  },
  workspaceShortcuts: Object.freeze([]),
  roleAssignments: Object.freeze([]),
  notificationChannels: Object.freeze([]),
  security: {
    twoFactorEmail: false,
    twoFactorApp: false
  }
});

function cloneDefaultProfile() {
  return {
    ...DEFAULT_PROFILE,
    communicationPreferences: { ...DEFAULT_PROFILE.communicationPreferences },
    workspaceShortcuts: [],
    roleAssignments: [],
    notificationChannels: [],
    security: { ...DEFAULT_PROFILE.security }
  };
}

function toTrimmedString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function toOptionalString(value) {
  const trimmed = toTrimmedString(value);
  return trimmed || '';
}

function toUniqueStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  const result = [];
  const seen = new Set();
  value.forEach((entry) => {
    const trimmed = toTrimmedString(entry);
    if (!trimmed) {
      return;
    }
    const key = trimmed.toLowerCase();
    if (seen.has(key)) {
      return;
    }
    seen.add(key);
    result.push(trimmed);
  });
  return result;
}

function normaliseDigestFrequency(value) {
  const candidate = toTrimmedString(value).toLowerCase();
  if (DIGEST_OPTIONS.has(candidate)) {
    return candidate;
  }
  return DEFAULT_PROFILE.communicationPreferences.digestFrequency;
}

function normaliseCommunicationPreferences(preferences = {}) {
  const candidate = preferences && typeof preferences === 'object' ? preferences : {};
  return {
    emailAlerts: Boolean(candidate.emailAlerts ?? candidate.email),
    smsAlerts: Boolean(candidate.smsAlerts ?? candidate.sms),
    pushAlerts: Boolean(candidate.pushAlerts ?? candidate.push),
    marketingOptIn: Boolean(candidate.marketingOptIn ?? candidate.marketing),
    digestFrequency: normaliseDigestFrequency(candidate.digestFrequency)
  };
}

function normaliseSecurity(security = {}) {
  const candidate = security && typeof security === 'object' ? security : {};
  return {
    twoFactorEmail: Boolean(candidate.twoFactorEmail ?? candidate.email),
    twoFactorApp: Boolean(candidate.twoFactorApp ?? candidate.app)
  };
}

function normaliseRoleAssignments(assignments) {
  if (!Array.isArray(assignments)) {
    return [];
  }
  return assignments
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => ({
      id: toOptionalString(entry.id),
      role: toTrimmedString(entry.role) || null,
      allowCreate: Boolean(entry.allowCreate),
      dashboards: toUniqueStringArray(entry.dashboards),
      notes: toTrimmedString(entry.notes)
    }))
    .filter((entry) => Boolean(entry.role));
}

function normaliseNotificationChannels(channels) {
  if (!Array.isArray(channels)) {
    return [];
  }
  return channels
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => ({
      id: toOptionalString(entry.id),
      type: toTrimmedString(entry.type) || null,
      label: toTrimmedString(entry.label),
      value: toTrimmedString(entry.value)
    }))
    .filter((entry) => Boolean(entry.type) && Boolean(entry.value));
}

function mergeStoredProfile(parsed) {
  const defaults = cloneDefaultProfile();
  const source = parsed && typeof parsed === 'object' ? parsed : {};

  return {
    ...defaults,
    ...source,
    communicationPreferences: {
      ...defaults.communicationPreferences,
      ...normaliseCommunicationPreferences(source.communicationPreferences)
    },
    workspaceShortcuts: toUniqueStringArray(source.workspaceShortcuts ?? defaults.workspaceShortcuts),
    roleAssignments: normaliseRoleAssignments(source.roleAssignments ?? defaults.roleAssignments),
    notificationChannels: normaliseNotificationChannels(source.notificationChannels ?? defaults.notificationChannels),
    security: {
      ...defaults.security,
      ...normaliseSecurity(source.security)
    }
  };
}

export function readProfile() {
  if (typeof window === 'undefined') {
    return cloneDefaultProfile();
  }

  try {
    const stored = window.localStorage?.getItem(PROFILE_STORAGE_KEY);
    if (!stored) {
      return cloneDefaultProfile();
    }
    const parsed = JSON.parse(stored);
    return mergeStoredProfile(parsed);
  } catch (error) {
    console.warn('[profileStorage] unable to parse stored profile', error);
    return cloneDefaultProfile();
  }
}

function emitProfileUpdate(profile) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.dispatchEvent(new CustomEvent('fixnado:profile:update', { detail: profile }));
  } catch (error) {
    console.warn('[profileStorage] unable to dispatch profile update event', error);
  }
}

export function writeProfile(partialProfile) {
  if (typeof window === 'undefined') {
    return cloneDefaultProfile();
  }

  const current = readProfile();
  const source = partialProfile && typeof partialProfile === 'object' ? partialProfile : {};

  const next = {
    ...current,
    ...source,
    communicationPreferences: {
      ...current.communicationPreferences,
      ...normaliseCommunicationPreferences(source.communicationPreferences)
    },
    workspaceShortcuts: toUniqueStringArray(source.workspaceShortcuts ?? current.workspaceShortcuts),
    roleAssignments: normaliseRoleAssignments(source.roleAssignments ?? current.roleAssignments),
    notificationChannels: normaliseNotificationChannels(source.notificationChannels ?? current.notificationChannels),
    security: {
      ...current.security,
      ...normaliseSecurity(source.security)
    }
  };

  try {
    window.localStorage?.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn('[profileStorage] unable to persist profile', error);
  }

  emitProfileUpdate(next);
  return next;
}

export function mergeProfileFromUser(user = {}) {
  if (typeof window === 'undefined') {
    return cloneDefaultProfile();
  }

  const current = readProfile();
  const candidate = {
    firstName: user.firstName ?? current.firstName,
    lastName: user.lastName ?? current.lastName,
    email: user.email ?? current.email,
    phone: user.phone ?? user.primaryPhone ?? current.phone,
    organisation:
      user.organisation ?? user.company?.legalStructure ?? user.company?.contactName ?? current.organisation,
    jobTitle: user.jobTitle ?? current.jobTitle,
    teamName: user.teamName ?? current.teamName,
    address: user.address ?? current.address,
    timezone: user.timezone ?? user.preferences?.timezone ?? current.timezone,
    locale: user.locale ?? user.preferences?.locale ?? current.locale,
    avatarUrl: user.avatarUrl ?? current.avatarUrl,
    signature: user.signature ?? current.signature,
    communicationPreferences:
      user.communicationPreferences ?? user.preferences?.communicationPreferences ?? current.communicationPreferences,
    workspaceShortcuts:
      user.workspaceShortcuts ?? user.preferences?.workspaceShortcuts ?? current.workspaceShortcuts,
    roleAssignments: user.roleAssignments ?? user.preferences?.roleAssignments ?? current.roleAssignments,
    notificationChannels:
      user.notificationChannels ?? user.preferences?.notificationChannels ?? current.notificationChannels,
    security: user.security ?? current.security
  };

  return writeProfile(candidate);
}

export function resetProfile() {
  if (typeof window === 'undefined') {
    return cloneDefaultProfile();
  }

  try {
    window.localStorage?.removeItem(PROFILE_STORAGE_KEY);
  } catch (error) {
    console.warn('[profileStorage] unable to reset profile', error);
  }

  const profile = cloneDefaultProfile();
  emitProfileUpdate(profile);
  return profile;
}

export { PROFILE_STORAGE_KEY };
