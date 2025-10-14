import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePersonaContext } from '../providers/PersonaProvider.jsx';

export function usePersona(options = {}) {
  const { persona, setPersona, availablePersonas, subscribe, isAllowed, lastSyncedAt } = usePersonaContext();
  const [status, setStatus] = useState({ allowed: true, evaluatedAt: null });

  useEffect(() => {
    if (!options?.allowedPersonas || options.allowedPersonas.length === 0) {
      setStatus({ allowed: true, evaluatedAt: new Date().toISOString() });
      return;
    }

    setStatus({
      allowed: isAllowed(options.allowedPersonas),
      evaluatedAt: new Date().toISOString()
    });
  }, [options?.allowedPersonas, isAllowed, persona]);

  useEffect(() => {
    if (!options?.onPersonaChange) {
      return;
    }

    const unsubscribe = subscribe((nextPersona) => {
      options.onPersonaChange(nextPersona);
    });

    return () => unsubscribe();
  }, [options, subscribe]);

  const selectPersona = useCallback(
    (nextPersona) => {
      setPersona(nextPersona);
    },
    [setPersona]
  );

  return useMemo(
    () => ({
      persona,
      setPersona: selectPersona,
      availablePersonas,
      status,
      lastSyncedAt
    }),
    [persona, selectPersona, availablePersonas, status, lastSyncedAt]
  );
}

export default usePersona;

