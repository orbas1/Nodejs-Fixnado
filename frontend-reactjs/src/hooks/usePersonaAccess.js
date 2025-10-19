import { useCallback, useEffect, useState } from 'react';
import { normaliseRole } from '../constants/accessControl.js';
import {
  readPersonaState,
  setActivePersona as persistActivePersona,
  resetPersonaAccess,
  getDefaultAllowedPersonas
} from '../utils/personaStorage.js';

export function usePersonaAccess() {
  const [personaState, setPersonaState] = useState(() => {
    const initial = readPersonaState();
    return {
      allowed: initial.allowed,
      activePersona: initial.active,
      version: initial.version,
      source: initial.source,
      syncedAt: initial.syncedAt
    };
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const handleChange = (event) => {
      if (event?.detail) {
        setPersonaState((current) => ({
          allowed: event.detail.allowed ?? current.allowed,
          activePersona: event.detail.active ?? current.activePersona,
          version: event.detail.version ?? current.version,
          source: event.detail.source ?? current.source,
          syncedAt: event.detail.syncedAt ?? current.syncedAt
        }));
        return;
      }
      const snapshot = readPersonaState();
      setPersonaState({
        allowed: snapshot.allowed,
        activePersona: snapshot.active,
        version: snapshot.version,
        source: snapshot.source,
        syncedAt: snapshot.syncedAt
      });
    };

    window.addEventListener('fixnado:persona:change', handleChange);
    return () => window.removeEventListener('fixnado:persona:change', handleChange);
  }, []);

  const refresh = useCallback(() => {
    const snapshot = readPersonaState();
    setPersonaState({
      allowed: snapshot.allowed,
      activePersona: snapshot.active,
      version: snapshot.version,
      source: snapshot.source,
      syncedAt: snapshot.syncedAt
    });
    return snapshot.allowed;
  }, []);

  const hasAccess = useCallback(
    (persona) => {
      const candidate = normaliseRole(persona);
      if (!candidate) {
        return false;
      }
      return personaState.allowed.includes(candidate);
    },
    [personaState.allowed]
  );

  const setActivePersona = useCallback(
    (persona, { source = 'manual' } = {}) => {
      const result = persistActivePersona(persona, { source });
      setPersonaState((current) => ({
        allowed: result.allowed ?? current.allowed,
        activePersona: result.active ?? current.activePersona,
        version: result.version ?? current.version,
        source: result.source ?? current.source,
        syncedAt: result.syncedAt ?? current.syncedAt
      }));
      return result;
    },
    []
  );

  const grantAccess = useCallback(
    (persona, options = {}) => {
      const outcome = setActivePersona(persona, options);
      return {
        granted: Boolean(outcome.updated),
        blocked: Boolean(outcome.blocked),
        allowed: outcome.allowed ?? personaState.allowed
      };
    },
    [personaState.allowed, setActivePersona]
  );

  const reset = useCallback(() => {
    const allowed = resetPersonaAccess({ reason: 'manual-reset' });
    const snapshot = readPersonaState();
    setPersonaState({
      allowed: snapshot.allowed,
      activePersona: snapshot.active,
      version: snapshot.version,
      source: snapshot.source,
      syncedAt: snapshot.syncedAt
    });
    return allowed;
  }, []);

  return {
    allowed: personaState.allowed,
    activePersona: personaState.activePersona,
    version: personaState.version,
    source: personaState.source,
    syncedAt: personaState.syncedAt,
    hasAccess,
    refresh,
    grantAccess,
    setActivePersona,
    reset,
    getDefaultAllowedPersonas
  };
}

export default usePersonaAccess;
