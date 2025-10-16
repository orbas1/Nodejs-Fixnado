const PROFILE_STORAGE_KEY = 'fixnado:profile';

export const DEFAULT_PROFILE = Object.freeze({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  organisation: '',
  timezone: 'UTC',
  communicationPreferences: {
    email: true,
    sms: false,
    push: false
  }
});

function cloneDefaultProfile() {
  return {
    ...DEFAULT_PROFILE,
    communicationPreferences: { ...DEFAULT_PROFILE.communicationPreferences }
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
    return {
      ...cloneDefaultProfile(),
      ...(parsed && typeof parsed === 'object' ? parsed : {}),
      communicationPreferences: {
        ...DEFAULT_PROFILE.communicationPreferences,
        ...(parsed?.communicationPreferences ?? {})
      }
    };
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
  const next = {
    ...current,
    ...(partialProfile && typeof partialProfile === 'object' ? partialProfile : {}),
    communicationPreferences: {
      ...current.communicationPreferences,
      ...(partialProfile?.communicationPreferences ?? {})
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
    organisation: user.companyName ?? current.organisation ?? '',
    phone: current.phone
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
