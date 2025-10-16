import { useCallback, useEffect, useState } from 'react';
import {
  readPersonaAccess,
  writePersonaAccess,
  addPersonaAccess,
  readActivePersona,
  writeActivePersona,
  getDefaultAllowedPersonas
} from '../utils/personaStorage.js';

export function usePersonaAccess() {
  const [allowed, setAllowed] = useState(() => readPersonaAccess());
  const [activePersona, setActivePersonaState] = useState(() => readActivePersona());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleStorage = (event) => {
      if (!event.key || event.key === 'fixnado:personaAccess' || event.key === 'fixnado:activePersona') {
        setAllowed(readPersonaAccess());
      }
    };

    const handlePersonaChange = (event) => {
      if (event?.detail?.allowed) {
        setAllowed(event.detail.allowed);
      } else {
        setAllowed(readPersonaAccess());
      }
      setActivePersonaState(readActivePersona());
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('fixnado:persona:change', handlePersonaChange);
    window.addEventListener('fixnado:session:update', handlePersonaChange);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('fixnado:persona:change', handlePersonaChange);
      window.removeEventListener('fixnado:session:update', handlePersonaChange);
    };
  }, []);

  const refresh = useCallback(() => {
    setAllowed(readPersonaAccess());
  }, []);

  const hasAccess = useCallback((persona) => {
    if (!persona) {
      return false;
    }
    return allowed.includes(persona);
  }, [allowed]);

  const grantAccess = useCallback((persona) => {
    const next = addPersonaAccess(persona);
    setAllowed(next);
    return next;
  }, []);

  const setActivePersona = useCallback((persona) => {
    writeActivePersona(persona);
    setAllowed(readPersonaAccess());
    setActivePersonaState(readActivePersona());
  }, []);

  const reset = useCallback(() => {
    const next = writePersonaAccess(getDefaultAllowedPersonas());
    setAllowed(next);
    setActivePersonaState(readActivePersona());
    return next;
  }, []);

  return { allowed, hasAccess, refresh, grantAccess, setActivePersona, reset, activePersona };
}

export default usePersonaAccess;
