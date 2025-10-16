import { useCallback, useEffect, useMemo, useState } from 'react';
import { fetchProfile, updateProfile as updateProfileRequest } from '../api/profileClient.js';
import {
  readProfile,
  writeProfile,
  resetProfile,
  DEFAULT_PROFILE,
  PROFILE_STORAGE_KEY
} from '../utils/profileStorage.js';

const noop = () => {};

function isBrowser() {
  return typeof window !== 'undefined';
}

export function useProfile() {
  const [profile, setProfile] = useState(() => readProfile());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  const syncFromStorage = useCallback(() => {
    const snapshot = readProfile();
    setProfile(snapshot);
    return snapshot;
  }, []);

  const refresh = useCallback(async ({ skipNetwork = false } = {}) => {
    if (skipNetwork) {
      return syncFromStorage();
    }

    setIsLoading(true);
    try {
      const payload = await fetchProfile();
      const merged = writeProfile(payload);
      setProfile(merged);
      setError(null);
      return merged;
    } catch (err) {
      console.warn('[useProfile] unable to refresh profile from API', err);
      setError(err);
      return syncFromStorage();
    } finally {
      setIsLoading(false);
    }
  }, [syncFromStorage]);

  const updateProfile = useCallback(
    async (nextProfile) => {
      setIsSaving(true);
      const previous = readProfile();
      const optimistic = writeProfile(nextProfile);
      setProfile(optimistic);

      try {
        const response = await updateProfileRequest(nextProfile);
        const merged = writeProfile(response);
        setProfile(merged);
        setError(null);
        return merged;
      } catch (err) {
        console.warn('[useProfile] profile update failed', err);
        setError(err);
        const reverted = writeProfile(previous);
        setProfile(reverted);
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    []
  );

  const clearProfile = useCallback(() => {
    const snapshot = resetProfile();
    setProfile(snapshot);
    return snapshot;
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!isBrowser()) {
      return noop;
    }

    const handleStorage = (event) => {
      if (!event.key || event.key === PROFILE_STORAGE_KEY) {
        syncFromStorage();
      }
    };

    const handleProfileUpdate = (event) => {
      if (event?.detail) {
        setProfile(event.detail);
      } else {
        syncFromStorage();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('fixnado:profile:update', handleProfileUpdate);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('fixnado:profile:update', handleProfileUpdate);
    };
  }, [syncFromStorage]);

  const defaults = useMemo(() => DEFAULT_PROFILE, []);

  return {
    profile,
    updateProfile,
    refresh,
    clearProfile,
    defaults,
    isLoading,
    isSaving,
    error
  };
}

export default useProfile;
