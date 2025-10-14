const SECURITY_STORAGE_KEY = 'fixnado:security.preferences';
const LEGACY_TWO_FACTOR_KEY = 'fx-two-factor-enabled';
const SECURITY_EVENT = 'fixnado:security:update';

const DEFAULT_PREFERENCES = Object.freeze({
  twoFactorEnabled: false,
  methods: Object.freeze([]),
  lastUpdated: null
});

const sanitiseMethods = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  const unique = new Set();
  value.forEach((entry) => {
    if (typeof entry !== 'string') {
      return;
    }
    const trimmed = entry.trim();
    if (!trimmed || unique.has(trimmed)) {
      return;
    }
    unique.add(trimmed);
  });

  return Array.from(unique);
};

const buildPreferences = (input = {}) => {
  if (!input || typeof input !== 'object') {
    return { ...DEFAULT_PREFERENCES };
  }

  const twoFactorEnabled = Boolean(
    input.twoFactorEnabled || input.twoFactorApp || input.twoFactorEmail
  );

  return {
    twoFactorEnabled,
    methods: sanitiseMethods(input.methods ?? input.availableMethods ?? []),
    lastUpdated: typeof input.lastUpdated === 'string' ? input.lastUpdated : null
  };
};

export const readSecurityPreferences = () => {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_PREFERENCES };
  }

  const merged = buildPreferences(window.__FIXNADO_SESSION__?.security);

  try {
    const stored = window.localStorage?.getItem(SECURITY_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      const normalised = buildPreferences(parsed);
      merged.twoFactorEnabled = normalised.twoFactorEnabled;
      merged.methods = normalised.methods;
      merged.lastUpdated = normalised.lastUpdated;
      return merged;
    }

    const legacy = window.localStorage?.getItem(LEGACY_TWO_FACTOR_KEY);
    if (legacy != null) {
      merged.twoFactorEnabled = legacy === 'true';
    }
  } catch (error) {
    console.warn('[securityPreferences] Unable to read stored preferences', error);
  }

  return merged;
};

export const writeSecurityPreferences = (preferences) => {
  if (typeof window === 'undefined') {
    return buildPreferences(preferences);
  }

  const payload = buildPreferences(preferences);
  payload.lastUpdated = new Date().toISOString();

  try {
    window.localStorage?.setItem(SECURITY_STORAGE_KEY, JSON.stringify(payload));
    window.localStorage?.removeItem(LEGACY_TWO_FACTOR_KEY);
  } catch (error) {
    console.warn('[securityPreferences] Unable to persist preferences', error);
  }

  try {
    window.dispatchEvent(new CustomEvent(SECURITY_EVENT, { detail: payload }));
  } catch (error) {
    window.dispatchEvent(new Event(SECURITY_EVENT));
  }

  return payload;
};

export const commitSecurityPreferences = (updater) => {
  const current = readSecurityPreferences();
  const next = typeof updater === 'function' ? updater(current) : updater;
  return writeSecurityPreferences(next);
};

export { SECURITY_STORAGE_KEY, LEGACY_TWO_FACTOR_KEY, SECURITY_EVENT };
