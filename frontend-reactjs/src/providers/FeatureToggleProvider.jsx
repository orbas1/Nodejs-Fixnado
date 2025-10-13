import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { fetchFeatureToggles, hydrateToggleCache } from '../api/featureToggleClient.js';

const CACHE_KEY = 'fixnado:feature-toggles';
const CACHE_TTL_MS = 5 * 60 * 1000; // five minutes
const COHORT_STORAGE_PREFIX = 'fixnado:feature-toggle:cohort:';

function readCache() {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(CACHE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (!parsed?.expiresAt || parsed.expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(CACHE_KEY);
      return null;
    }

    return {
      toggles: hydrateToggleCache(parsed.toggles),
      fetchedAt: parsed.fetchedAt ?? Date.now(),
      version: parsed.version ?? null
    };
  } catch (error) {
    console.warn('Failed to read cached feature toggles', error);
    return null;
  }
}

function writeCache({ toggles, version }) {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return;
  }

  try {
    const payload = {
      toggles,
      version: version ?? null,
      fetchedAt: Date.now(),
      expiresAt: Date.now() + CACHE_TTL_MS
    };
    window.sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('Failed to persist feature toggle cache', error);
  }
}

function normaliseRollout(value) {
  const numeric = Number.parseFloat(value ?? 0);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  if (numeric < 0) return 0;
  if (numeric > 1) return 1;
  return numeric;
}

function resolveCohortValue(key, scope = 'global') {
  const storageKey = `${COHORT_STORAGE_PREFIX}${key}:${scope}`;
  const random = Math.random();

  if (typeof window === 'undefined' || !window.localStorage) {
    return random;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (raw != null) {
      const parsed = Number.parseFloat(raw);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }

    window.localStorage.setItem(storageKey, String(random));
    return random;
  } catch (error) {
    console.warn('Failed to resolve feature toggle cohort', error);
    return random;
  }
}

function evaluateToggle(toggles, key, { fallback = false, allowStaging = false, scope } = {}) {
  if (!toggles || !key) {
    return {
      enabled: fallback,
      reason: 'unavailable',
      toggle: null
    };
  }

  const toggle = toggles[key] ?? null;
  if (!toggle) {
    return {
      enabled: fallback,
      reason: 'missing',
      toggle: null
    };
  }

  const state = (toggle.state ?? 'disabled').toLowerCase();
  const rollout = normaliseRollout(toggle.rollout);

  if (state === 'enabled') {
    return { enabled: true, reason: 'enabled', toggle };
  }

  if (state === 'disabled' || state === 'sunset') {
    return { enabled: false, reason: state, toggle };
  }

  if (state === 'staging') {
    return {
      enabled: allowStaging,
      reason: allowStaging ? 'staging-allowed' : 'staging-blocked',
      toggle
    };
  }

  if (state === 'pilot') {
    const cohort = resolveCohortValue(key, scope ?? 'global');
    const enabled = cohort < rollout;
    return {
      enabled,
      reason: enabled ? 'pilot-included' : 'pilot-excluded',
      toggle,
      cohort
    };
  }

  return { enabled: fallback, reason: 'unknown', toggle };
}

export const FeatureToggleContext = createContext(null);

export function FeatureToggleProvider({ children }) {
  const cached = useMemo(() => readCache(), []);
  const [toggles, setToggles] = useState(cached?.toggles ?? null);
  const [version, setVersion] = useState(cached?.version ?? null);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState(null);
  const lastFetchedRef = useRef(cached?.fetchedAt ?? null);
  const abortRef = useRef();

  const synchronise = useCallback(
    async ({ force = false } = {}) => {
      if (abortRef.current) {
        abortRef.current.abort();
      }

      const controller = new AbortController();
      abortRef.current = controller;

      if (!force && toggles && lastFetchedRef.current && Date.now() - lastFetchedRef.current < CACHE_TTL_MS / 2) {
        abortRef.current = null;
        return { toggles, version };
      }

      setLoading(true);
      try {
        const result = await fetchFeatureToggles({ signal: controller.signal });
        setToggles(result.toggles);
        setVersion(result.version);
        lastFetchedRef.current = Date.now();
        writeCache({ toggles: result.toggles, version: result.version });
        setError(null);
        return result;
      } catch (caught) {
        if (caught.name === 'AbortError') {
          return null;
        }
        console.error('Failed to fetch feature toggles', caught);
        setError(caught);
        throw caught;
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [toggles, version]
  );

  useEffect(() => {
    if (!toggles) {
      synchronise().catch(() => {});
    }
    return () => abortRef.current?.abort();
  }, [toggles, synchronise]);

  const contextValue = useMemo(
    () => ({
      loading,
      error,
      toggles: toggles ?? {},
      version,
      lastFetchedAt: lastFetchedRef.current,
      refresh: synchronise,
      evaluate: (key, options) => evaluateToggle(toggles, key, options)
    }),
    [loading, error, toggles, version, synchronise]
  );

  return <FeatureToggleContext.Provider value={contextValue}>{children}</FeatureToggleContext.Provider>;
}

FeatureToggleProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useFeatureToggle(key, options = {}) {
  const context = useContext(FeatureToggleContext);
  if (!context) {
    throw new Error('useFeatureToggle must be used within a FeatureToggleProvider');
  }

  const { loading, error, toggles, evaluate, refresh, version, lastFetchedAt } = context;
  const { scope, fallback = null, allowStaging } = options;

  const evaluation = useMemo(() => {
    if (!evaluate) {
      return { enabled: fallback, reason: 'unavailable', toggle: null };
    }

    if (!toggles || Object.keys(toggles).length === 0) {
      return { enabled: fallback, reason: 'loading', toggle: null };
    }

    return evaluate(key, { fallback, allowStaging, scope });
  }, [evaluate, toggles, key, fallback, allowStaging, scope]);

  return {
    loading,
    error,
    toggle: evaluation.toggle,
    enabled: evaluation.enabled,
    reason: evaluation.reason,
    cohort: evaluation.cohort ?? null,
    refresh,
    version,
    lastFetchedAt
  };
}

export function useFeatureToggleContext() {
  const context = useContext(FeatureToggleContext);
  if (!context) {
    throw new Error('useFeatureToggleContext must be used within a FeatureToggleProvider');
  }
  return context;
}
