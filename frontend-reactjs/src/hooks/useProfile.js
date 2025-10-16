import { useCallback, useEffect, useState } from 'react';
import { readProfile, writeProfile, resetProfile, DEFAULT_PROFILE } from '../utils/profileStorage.js';

const noop = () => {};

export function useProfile() {
  const [profile, setProfile] = useState(() => readProfile());

  const refresh = useCallback(() => {
    setProfile(readProfile());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return noop;
    }

    const handleStorage = (event) => {
      if (!event.key || event.key === 'fixnado:profile') {
        refresh();
      }
    };

    const handleProfileUpdate = (event) => {
      if (event?.detail) {
        setProfile(event.detail);
      } else {
        refresh();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('fixnado:profile:update', handleProfileUpdate);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('fixnado:profile:update', handleProfileUpdate);
    };
  }, [refresh]);

  const updateProfile = useCallback((patch) => {
    const next = writeProfile(patch);
    setProfile(next);
    return next;
  }, []);

  const clearProfile = useCallback(() => {
    const next = resetProfile();
    setProfile(next);
    return next;
  }, []);

  return {
    profile,
    updateProfile,
    refresh,
    clearProfile,
    defaults: DEFAULT_PROFILE
  };
}

export default useProfile;
