import { useCallback, useMemo } from 'react';
import { useCustomerProfileSettings } from './useCustomerProfileSettings.js';

const normaliseMethods = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }
  const next = [];
  const seen = new Set();
  value.forEach((entry) => {
    if (typeof entry !== 'string') {
      return;
    }
    const trimmed = entry.trim();
    if (!trimmed || seen.has(trimmed)) {
      return;
    }
    seen.add(trimmed);
    next.push(trimmed);
  });
  return next;
};

export function useSecurityPreferences() {
  const {
    data,
    loading,
    error,
    saving,
    refresh,
    saveSecurity
  } = useCustomerProfileSettings();

  const security = data?.security?.twoFactor ?? {};

  const state = useMemo(
    () => ({
      app: Boolean(security.app),
      email: Boolean(security.email),
      enabled: Boolean(security.enabled ?? security.app ?? security.email),
      methods: normaliseMethods(security.methods),
      lastUpdated: security.lastUpdated ?? null
    }),
    [security]
  );

  const persist = useCallback(
    async (updates = {}) => {
      const payload = {
        twoFactorApp: updates.twoFactorApp ?? state.app,
        twoFactorEmail: updates.twoFactorEmail ?? state.email,
        methods: normaliseMethods(updates.methods ?? state.methods)
      };
      const result = await saveSecurity(payload);
      return result?.security?.twoFactor ?? payload;
    },
    [saveSecurity, state.app, state.email, state.methods]
  );

  const setTwoFactorEnabled = useCallback(
    async (value) => {
      const nextEnabled = Boolean(value);
      const nextState = nextEnabled
        ? {
            twoFactorApp: true,
            twoFactorEmail: state.email
          }
        : {
            twoFactorApp: false,
            twoFactorEmail: false
          };
      return persist(nextState);
    },
    [persist, state.email]
  );

  const enableTwoFactor = useCallback(() => setTwoFactorEnabled(true), [setTwoFactorEnabled]);

  const disableTwoFactor = useCallback(() => setTwoFactorEnabled(false), [setTwoFactorEnabled]);

  const updateMethods = useCallback(
    async (methodsOrUpdater) => {
      const candidate =
        typeof methodsOrUpdater === 'function'
          ? methodsOrUpdater([...state.methods])
          : methodsOrUpdater;
      return persist({ methods: candidate });
    },
    [persist, state.methods]
  );

  return {
    twoFactorEnabled: state.enabled,
    methods: state.methods,
    lastUpdated: state.lastUpdated,
    loading,
    saving: saving.security,
    error,
    refresh,
    setTwoFactorEnabled,
    enableTwoFactor,
    disableTwoFactor,
    updateMethods
  };
}

export default useSecurityPreferences;
