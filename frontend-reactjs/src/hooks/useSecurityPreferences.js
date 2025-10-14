import { useCallback, useEffect, useState } from 'react';
import {
  SECURITY_EVENT,
  SECURITY_STORAGE_KEY,
  LEGACY_TWO_FACTOR_KEY,
  commitSecurityPreferences,
  readSecurityPreferences
} from '../utils/securityPreferences.js';

const noop = () => {};

export function useSecurityPreferences() {
  const [preferences, setPreferences] = useState(() => readSecurityPreferences());

  const refresh = useCallback(() => {
    setPreferences(readSecurityPreferences());
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return noop;
    }

    const handleStorage = (event) => {
      if (!event?.key || [SECURITY_STORAGE_KEY, LEGACY_TWO_FACTOR_KEY].includes(event.key)) {
        refresh();
      }
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener(SECURITY_EVENT, refresh);
    window.addEventListener('fixnado:session:update', refresh);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener(SECURITY_EVENT, refresh);
      window.removeEventListener('fixnado:session:update', refresh);
    };
  }, [refresh]);

  const commit = useCallback((updater) => {
    const result = commitSecurityPreferences(updater);
    setPreferences(result);
    return result;
  }, []);

  const setTwoFactorEnabled = useCallback((value) => {
    return commit((current) => ({
      ...current,
      twoFactorEnabled: Boolean(value)
    }));
  }, [commit]);

  const enableTwoFactor = useCallback(() => setTwoFactorEnabled(true), [setTwoFactorEnabled]);

  const disableTwoFactor = useCallback(() => setTwoFactorEnabled(false), [setTwoFactorEnabled]);

  const updateMethods = useCallback(
    (methodsOrUpdater) =>
      commit((current) => {
        const nextMethods =
          typeof methodsOrUpdater === 'function'
            ? methodsOrUpdater(current.methods ?? [])
            : methodsOrUpdater;
        return {
          ...current,
          methods: Array.isArray(nextMethods) ? nextMethods : []
        };
      }),
    [commit]
  );

  return {
    ...preferences,
    refresh,
    setTwoFactorEnabled,
    enableTwoFactor,
    disableTwoFactor,
    updateMethods
  };
}

export default useSecurityPreferences;
