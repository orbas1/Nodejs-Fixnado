import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import {
  DEFAULT_PREFERENCES,
  PERSONALISATION_OPTIONS,
  STORAGE_KEY,
  THEME_PRESETS
} from '../theme/config.js';
import { buildPreferenceTelemetryPayload } from '../utils/telemetry.js';

const ThemeContext = createContext(null);

function resolveSystemTheme() {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'standard';
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'standard';
}

function readStoredPreferences() {
  if (typeof window === 'undefined') {
    return DEFAULT_PREFERENCES;
  }

  const stored = window.localStorage.getItem(STORAGE_KEY);

  if (!stored) {
    const fallbackTheme = resolveSystemTheme();
    return { ...DEFAULT_PREFERENCES, theme: fallbackTheme };
  }

  try {
    const parsed = JSON.parse(stored);
    return { ...DEFAULT_PREFERENCES, ...parsed };
  } catch (error) {
    console.warn('Failed to parse theme preferences; falling back to defaults.', error);
    return DEFAULT_PREFERENCES;
  }
}

function writeStoredPreferences(preferences) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
}

function sendBeaconWithFallback(payload) {
  if (typeof window === 'undefined') {
    return;
  }

  const body = JSON.stringify(payload);
  const blob = new Blob([body], { type: 'application/json' });

  let dispatched = false;

  const endpoint = '/api/telemetry/ui-preferences';

  if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
    dispatched = navigator.sendBeacon(endpoint, blob);
  }

  if (!dispatched && typeof fetch === 'function') {
    void fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
      credentials: 'include'
    }).catch((error) => {
      console.warn('Telemetry fetch fallback failed', error);
    });
  }
}

function broadcastPreferenceChange(preferences) {
  if (typeof window === 'undefined') {
    return;
  }

  const payload = buildPreferenceTelemetryPayload(preferences);
  const detail = {
    ...preferences,
    tenantId: payload.tenantId,
    role: payload.role,
    marketingVariant: preferences.marketingVariant,
    timestamp: payload.timestamp,
    correlationId: payload.correlationId
  };

  window.dispatchEvent(new CustomEvent('fixnado:theme-change', { detail }));

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: 'theme_change', ...payload });
  }

  sendBeaconWithFallback(payload);
}

function applyDocumentAttributes(preferences) {
  if (typeof document === 'undefined') {
    return;
  }

  const { theme, density, contrast } = preferences;
  const root = document.documentElement;

  root.dataset.theme = theme;
  root.dataset.density = density;
  root.dataset.contrast = contrast;
}

export function ThemeProvider({ children }) {
  const [preferences, setPreferences] = useState(() => readStoredPreferences());

  useEffect(() => {
    applyDocumentAttributes(preferences);
    writeStoredPreferences(preferences);
    broadcastPreferenceChange(preferences);
  }, [preferences]);

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = (event) => {
        setPreferences((prev) => {
          if (prev.theme === 'standard' || prev.theme === 'dark') {
            return prev;
          }

          return { ...prev, theme: event.matches ? 'dark' : 'standard' };
        });
      };

      media.addEventListener('change', listener);

      return () => media.removeEventListener('change', listener);
    }

    return undefined;
  }, []);

  const setTheme = useCallback((theme) => {
    setPreferences((prev) => ({ ...prev, theme }));
  }, []);

  const setDensity = useCallback((density) => {
    setPreferences((prev) => ({ ...prev, density }));
  }, []);

  const setContrast = useCallback((contrast) => {
    setPreferences((prev) => ({ ...prev, contrast }));
  }, []);

  const setMarketingVariant = useCallback((marketingVariant) => {
    setPreferences((prev) => ({ ...prev, marketingVariant }));
  }, []);

  const contextValue = useMemo(
    () => ({
      preferences,
      resolvedTheme: preferences.theme,
      themes: THEME_PRESETS,
      personalisationOptions: PERSONALISATION_OPTIONS,
      setTheme,
      setDensity,
      setContrast,
      setMarketingVariant
    }),
    [preferences, setContrast, setDensity, setMarketingVariant, setTheme]
  );

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
}

ThemeProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
}

