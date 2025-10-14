import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';

const STORAGE_KEY = 'fixnado:active-persona';
const DEFAULT_PERSONA = 'customer';
const ALLOWED_PERSONAS = ['customer', 'provider', 'serviceman', 'enterprise', 'admin'];

function readStoredPersona(initialPersona) {
  if (typeof window === 'undefined') {
    return initialPersona ?? DEFAULT_PERSONA;
  }

  try {
    const persisted = window.localStorage?.getItem(STORAGE_KEY);
    if (persisted && ALLOWED_PERSONAS.includes(persisted)) {
      return persisted;
    }
  } catch (error) {
    console.warn('[PersonaProvider] Unable to read stored persona', error);
  }

  return initialPersona && ALLOWED_PERSONAS.includes(initialPersona)
    ? initialPersona
    : DEFAULT_PERSONA;
}

export const PersonaContext = createContext(null);

export function PersonaProvider({ children, initialPersona }) {
  const [persona, setPersona] = useState(() => readStoredPersona(initialPersona));
  const [lastSyncedAt, setLastSyncedAt] = useState(null);
  const listenersRef = useRef(new Set());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const handleStorage = (event) => {
      if (event.key !== STORAGE_KEY || !event.newValue) {
        return;
      }
      if (!ALLOWED_PERSONAS.includes(event.newValue)) {
        return;
      }
      setPersona(event.newValue);
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage?.setItem(STORAGE_KEY, persona);
      setLastSyncedAt(new Date().toISOString());
      listenersRef.current.forEach((listener) => {
        try {
          listener(persona);
        } catch (error) {
          console.warn('[PersonaProvider] Persona listener failed', error);
        }
      });
    } catch (error) {
      console.warn('[PersonaProvider] Unable to persist persona', error);
    }
  }, [persona]);

  const subscribe = useCallback((listener) => {
    if (typeof listener !== 'function') {
      return () => {};
    }
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  const value = useMemo(
    () => ({
      persona,
      setPersona,
      availablePersonas: ALLOWED_PERSONAS,
      lastSyncedAt,
      subscribe,
      isAllowed: (allowed) => {
        if (!allowed || allowed.length === 0) {
          return true;
        }
        if (typeof allowed === 'string') {
          return persona === allowed;
        }
        return allowed.includes(persona);
      }
    }),
    [persona, lastSyncedAt, subscribe]
  );

  return <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>;
}

PersonaProvider.propTypes = {
  children: PropTypes.node.isRequired,
  initialPersona: PropTypes.oneOf(ALLOWED_PERSONAS)
};

export function usePersonaContext() {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error('usePersonaContext must be used within a PersonaProvider');
  }
  return context;
}

