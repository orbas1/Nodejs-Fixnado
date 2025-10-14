import { useEffect, useMemo, useState } from 'react';
import { resolveSessionTelemetryContext } from '../utils/telemetry.js';

const normaliseRole = (value) => {
  if (typeof value !== 'string') return 'guest';
  return value.trim().toLowerCase();
};

const readRoleFromWindow = () => {
  try {
    if (typeof window === 'undefined') {
      return 'guest';
    }

    if (typeof window.__FIXNADO_SESSION__ === 'object' && window.__FIXNADO_SESSION__ !== null) {
      const { role } = window.__FIXNADO_SESSION__;
      if (typeof role === 'string' && role.trim() !== '') {
        return normaliseRole(role);
      }
    }

    if (typeof window.sessionStorage !== 'undefined') {
      const stored = window.sessionStorage.getItem('fx.session');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (typeof parsed?.role === 'string' && parsed.role.trim() !== '') {
          return normaliseRole(parsed.role);
        }
      }
    }
  } catch (error) {
    console.warn('Failed to read role from session context', error);
  }

  const context = resolveSessionTelemetryContext();
  return normaliseRole(context.role);
};

export function useRoleAccess(requiredRoles, { allowFallbackRoles = [] } = {}) {
  const [role, setRole] = useState(() => readRoleFromWindow());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const handler = (event) => {
      if (event?.detail?.role) {
        setRole(normaliseRole(event.detail.role));
      }
    };

    window.addEventListener('fixnado:session-change', handler);
    window.addEventListener('fixnado:theme-change', handler);

    return () => {
      window.removeEventListener('fixnado:session-change', handler);
      window.removeEventListener('fixnado:theme-change', handler);
    };
  }, []);

  return useMemo(() => {
    const required = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
    const allowList = new Set(required.map(normaliseRole));
    allowFallbackRoles.forEach((value) => allowList.add(normaliseRole(value)));

    const hasAccess = allowList.has(role);

    return { role, hasAccess };
  }, [role, requiredRoles, allowFallbackRoles]);
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

const STORAGE_KEY = 'fixnado:activeRole';

const ROLE_ALIASES = {
  provider: 'company',
  providers: 'company',
  operations: 'company',
  company: 'company',
  companies: 'company',
  serviceman: 'servicemen',
  servicemen: 'servicemen',
  crew: 'servicemen',
  technician: 'servicemen',
  technicians: 'servicemen',
  field: 'servicemen',
  admin: 'admin',
  administrator: 'admin'
};

const normaliseRole = (value) => {
  if (!value) return null;
  const normalised = String(value).trim().toLowerCase();
  return ROLE_ALIASES[normalised] ?? normalised;
};

function readStoredRole() {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return normaliseRole(window.localStorage?.getItem(STORAGE_KEY));
  } catch (error) {
    console.warn('Unable to read stored role', error);
    return null;
  }
}

function persistRole(role) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    if (role) {
      window.localStorage?.setItem(STORAGE_KEY, role);
    } else {
      window.localStorage?.removeItem(STORAGE_KEY);
    }
  } catch (error) {
    console.warn('Unable to persist active role', error);
  }
}

export function useRoleAccess({ allowedRoles = [], defaultRole = null } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const initialRole = useMemo(() => {
    const fromQuery = normaliseRole(searchParams.get('role'));
    if (fromQuery) {
      persistRole(fromQuery);
      return { role: fromQuery, source: 'query' };
    }

    const stored = readStoredRole();
    if (stored) {
      return { role: stored, source: 'storage' };
    }

    const fallback = normaliseRole(defaultRole);
    if (fallback) {
      persistRole(fallback);
      return { role: fallback, source: 'default' };
    }

    return { role: null, source: 'unknown' };
  }, [defaultRole, searchParams]);

  const [role, setRoleState] = useState(initialRole.role);
  const [source, setSource] = useState(initialRole.source);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }
    const handleStorage = (event) => {
      if (event.key !== STORAGE_KEY) {
        return;
      }
      const nextRole = normaliseRole(event.newValue);
      setRoleState((current) => {
        if (current === nextRole) {
          return current;
        }
        setSource('storage');
        return nextRole;
      });
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const paramRole = normaliseRole(searchParams.get('role'));
    if (!paramRole) {
      return;
    }
    if (paramRole === role) {
      return;
    }
    setRoleState(paramRole);
    setSource('query');
    persistRole(paramRole);
  }, [searchParams, role]);

  const allowedSet = useMemo(
    () => allowedRoles.map(normaliseRole).filter((value) => value != null),
    [allowedRoles]
  );

  const allowed = useMemo(() => {
    if (!allowedSet.length) {
      return true;
    }
    if (!role) {
      return false;
    }
    return allowedSet.includes(normaliseRole(role));
  }, [allowedSet, role]);

  const deniedReason = useMemo(() => {
    if (allowed) {
      return null;
    }
    if (!role) {
      return 'role-missing';
    }
    return 'role-not-permitted';
  }, [allowed, role]);

  const updateRole = useCallback(
    (nextRole, { persist = true, updateQuery = false } = {}) => {
      const normalised = normaliseRole(nextRole);
      setRoleState(normalised);
      setSource('manual');
      if (persist) {
        persistRole(normalised);
      }
      if (updateQuery) {
        setSearchParams((current) => {
          const params = new URLSearchParams(current);
          if (normalised) {
            params.set('role', normalised);
          } else {
            params.delete('role');
          }
          return params;
        });
      }
    },
    [setSearchParams]
  );

  const refresh = useCallback(() => {
    const stored = readStoredRole();
    if (stored && stored !== role) {
      setRoleState(stored);
      setSource('storage');
    }
  }, [role]);

  return {
    role,
    allowed,
    status: allowed ? 'allowed' : 'denied',
    source,
    allowedRoles: allowedSet,
    deniedReason,
    setRole: updateRole,
    refresh
  };
}

export default useRoleAccess;
