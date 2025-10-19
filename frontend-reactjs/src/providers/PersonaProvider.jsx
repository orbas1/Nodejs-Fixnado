import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { normaliseRole } from '../constants/accessControl.js';
import { readPersonaState, setActivePersona as persistActivePersona } from '../utils/personaStorage.js';

export const PersonaContext = createContext(null);

export function PersonaProvider({ children, initialPersona }) {
  const initialState = useMemo(() => readPersonaState(), []);
  const [persona, setPersonaState] = useState(() => {
    const candidate = initialPersona ? persistActivePersona(initialPersona, { source: 'provider-init' }) : null;
    if (candidate && candidate.active) {
      return candidate.active;
    }
    return initialState.active ?? initialState.allowed[0] ?? 'customer';
  });
  const [allowedPersonas, setAllowedPersonas] = useState(initialState.allowed);
  const [lastSyncedAt, setLastSyncedAt] = useState(initialState.syncedAt);
  const listenersRef = useRef(new Set());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const handlePersonaChange = (event) => {
      if (event?.detail) {
        if (Array.isArray(event.detail.allowed)) {
          setAllowedPersonas(event.detail.allowed);
        }
        if (event.detail.active) {
          setPersonaState(event.detail.active);
        }
        if (event.detail.syncedAt) {
          setLastSyncedAt(event.detail.syncedAt);
        }
        return;
      }

      const snapshot = readPersonaState();
      setAllowedPersonas(snapshot.allowed);
      setPersonaState(snapshot.active ?? snapshot.allowed[0] ?? persona);
      setLastSyncedAt(snapshot.syncedAt);
    };

    window.addEventListener('fixnado:persona:change', handlePersonaChange);
    return () => window.removeEventListener('fixnado:persona:change', handlePersonaChange);
  }, [persona]);

  const setPersona = useCallback((nextPersona) => {
    const result = persistActivePersona(nextPersona, { source: 'provider' });
    if (result.allowed) {
      setAllowedPersonas(result.allowed);
    }
    if (result.active) {
      setPersonaState(result.active);
    }
    if (result.syncedAt) {
      setLastSyncedAt(result.syncedAt);
    }
  }, []);

  const subscribe = useCallback((listener) => {
    if (typeof listener !== 'function') {
      return () => {};
    }
    listenersRef.current.add(listener);
    return () => listenersRef.current.delete(listener);
  }, []);

  useEffect(() => {
    listenersRef.current.forEach((listener) => {
      try {
        listener(persona);
      } catch (error) {
        console.warn('[PersonaProvider] Persona listener failed', error);
      }
    });
  }, [persona]);

  const isAllowed = useCallback(
    (allowed) => {
      if (!allowed || allowed.length === 0) {
        return true;
      }
      if (typeof allowed === 'string') {
        return allowedPersonas.includes(normaliseRole(allowed));
      }
      return allowed.some((candidate) => allowedPersonas.includes(normaliseRole(candidate)));
    },
    [allowedPersonas]
  );

  const value = useMemo(
    () => ({
      persona,
      setPersona,
      availablePersonas: allowedPersonas,
      lastSyncedAt,
      subscribe,
      isAllowed
    }),
    [persona, setPersona, allowedPersonas, lastSyncedAt, subscribe, isAllowed]
  );

  return <PersonaContext.Provider value={value}>{children}</PersonaContext.Provider>;
}

PersonaProvider.propTypes = {
  children: PropTypes.node.isRequired,
  initialPersona: PropTypes.string
};

export function usePersonaContext() {
  const context = useContext(PersonaContext);
  if (!context) {
    throw new Error('usePersonaContext must be used within a PersonaProvider');
  }
  return context;
}
