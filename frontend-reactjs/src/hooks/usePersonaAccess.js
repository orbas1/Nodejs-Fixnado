import { useCallback, useEffect, useState } from 'react';

const ACCESS_KEY = 'fixnado:personaAccess';
const ACTIVE_KEY = 'fixnado:activePersona';
const DEFAULT_ALLOWED = ['user', 'finance'];

function normaliseList(value) {
  if (!Array.isArray(value)) {
    return null;
  }
  const cleaned = value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : null))
    .filter((entry) => entry);
  return cleaned.length > 0 ? cleaned : null;
}

function readAllowedPersonas() {
  if (typeof window === 'undefined') {
    return DEFAULT_ALLOWED;
  }

  try {
    const storage = window.localStorage;
    if (!storage) {
      return DEFAULT_ALLOWED;
    }

    const stored = storage.getItem(ACCESS_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const normalised = normaliseList(parsed);
        if (normalised) {
          return normalised;
        }
      } catch (error) {
        console.warn('[personaAccess] failed to parse persona list', error);
      }
    }

    const active = storage.getItem(ACTIVE_KEY);
    if (typeof active === 'string' && active.trim()) {
      return [active.trim()];
    }
  } catch (error) {
    console.warn('[personaAccess] unable to read persona access metadata', error);
  }

  return DEFAULT_ALLOWED;
}

export function usePersonaAccess() {
  const [allowed, setAllowed] = useState(() => readAllowedPersonas());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleStorage = (event) => {
      if (!event.key || event.key === ACCESS_KEY || event.key === ACTIVE_KEY) {
        setAllowed(readAllowedPersonas());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const refresh = useCallback(() => {
    setAllowed(readAllowedPersonas());
  }, []);

  const hasAccess = useCallback((persona) => {
    if (!persona) {
      return false;
    }
    return allowed.includes(persona);
  }, [allowed]);

  return { allowed, hasAccess, refresh };
}

export default usePersonaAccess;
