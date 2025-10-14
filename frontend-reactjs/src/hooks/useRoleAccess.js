import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { resolveSessionTelemetryContext } from '../utils/telemetry.js';

const SESSION_STORAGE_KEY = 'fx.session';
const ACTIVE_ROLE_STORAGE_KEY = 'fixnado:activeRole';

const normaliseSessionRole = (value) => {
  if (typeof value !== 'string' || !value.trim()) {
    return 'guest';
  }
  return value.trim().toLowerCase();
};

const readSessionRole = () => {
  if (typeof window === 'undefined') {
    return 'guest';
  }

  try {
    const globalSession = window.__FIXNADO_SESSION__;
    if (globalSession && typeof globalSession === 'object') {
      const candidate = normaliseSessionRole(globalSession.role);
      if (candidate) {
        return candidate;
      }
    }

    const stored = window.sessionStorage?.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed.role === 'string') {
        const candidate = normaliseSessionRole(parsed.role);
        if (candidate) {
          return candidate;
        }
      }
    }
  } catch (error) {
    console.warn('[useRoleAccess] Failed to read session context', error);
  }

  const telemetryContext = resolveSessionTelemetryContext();
  return normaliseSessionRole(telemetryContext.role);
};

const toRoleList = (roles) => {
  if (!roles) {
    return [];
  }
  if (Array.isArray(roles)) {
    return roles;
  }
  return [roles];
};

function legacyUseRoleAccess(requiredRoles, { allowFallbackRoles = [] } = {}) {
  const [role, setRole] = useState(() => readSessionRole());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const updateRole = (nextRole) => {
      setRole(normaliseSessionRole(nextRole));
    };

    const handleCustomEvent = (event) => {
      if (event?.detail?.role) {
        updateRole(event.detail.role);
      }
    };

    const handleStorage = (event) => {
      if (event.key !== SESSION_STORAGE_KEY) {
        return;
      }
      try {
        if (event.newValue) {
          const parsed = JSON.parse(event.newValue);
          updateRole(parsed?.role);
        }
      } catch (error) {
        console.warn('[useRoleAccess] Unable to parse session storage payload', error);
      }
    };

    window.addEventListener('fixnado:session-change', handleCustomEvent);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('fixnado:session-change', handleCustomEvent);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const required = useMemo(() => toRoleList(requiredRoles).map(normaliseSessionRole), [requiredRoles]);
  const fallback = useMemo(() => toRoleList(allowFallbackRoles).map(normaliseSessionRole), [allowFallbackRoles]);

  const allowList = useMemo(() => {
    const unique = new Set([...required, ...fallback].filter(Boolean));
    return unique;
  }, [required, fallback]);

  const hasAccess = allowList.size === 0 || allowList.has(role);

  return { role, hasAccess };
}

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

const normaliseSelectableRole = (value) => {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return null;
  }
  return ROLE_ALIASES[trimmed] ?? trimmed;
};

const readStoredRole = () => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return normaliseSelectableRole(window.localStorage?.getItem(ACTIVE_ROLE_STORAGE_KEY));
  } catch (error) {
    console.warn('[useRoleAccess] Unable to read stored active role', error);
    return null;
  }
};

const persistRole = (role) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    if (role) {
      window.localStorage?.setItem(ACTIVE_ROLE_STORAGE_KEY, role);
    } else {
      window.localStorage?.removeItem(ACTIVE_ROLE_STORAGE_KEY);
    }
  } catch (error) {
    console.warn('[useRoleAccess] Unable to persist active role', error);
  }
};

export function useRoleAccess({ allowedRoles = [], defaultRole = null, allowFallbackRoles = [] } = {}) {
  const [searchParams, setSearchParams] = useSearchParams();

  const initial = useMemo(() => {
    const fromQuery = normaliseSelectableRole(searchParams.get('role'));
    if (fromQuery) {
      persistRole(fromQuery);
      return { role: fromQuery, source: 'query' };
    }

    const stored = readStoredRole();
    if (stored) {
      return { role: stored, source: 'storage' };
    }

    const fallback = normaliseSelectableRole(defaultRole);
    if (fallback) {
      persistRole(fallback);
      return { role: fallback, source: 'default' };
    }

    return { role: null, source: 'unknown' };
  }, [defaultRole, searchParams]);

  const [role, setRole] = useState(initial.role);
  const [source, setSource] = useState(initial.source);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const handleStorage = (event) => {
      if (event.key !== ACTIVE_ROLE_STORAGE_KEY) {
        return;
      }
      const nextRole = normaliseSelectableRole(event.newValue);
      setRole((current) => {
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
    const paramRole = normaliseSelectableRole(searchParams.get('role'));
    if (!paramRole) {
      return;
    }
    if (paramRole === role) {
      return;
    }
    setRole(paramRole);
    setSource('query');
    persistRole(paramRole);
  }, [role, searchParams]);

  const allowedSet = useMemo(() => {
    const primary = allowedRoles.map(normaliseSelectableRole).filter((value) => value != null);
    const fallback = toRoleList(allowFallbackRoles).map(normaliseSelectableRole).filter((value) => value != null);
    return Array.from(new Set([...primary, ...fallback]));
  }, [allowFallbackRoles, allowedRoles]);

  const allowed = useMemo(() => {
    if (!allowedSet.length) {
      return true;
    }
    if (!role) {
      return false;
    }
    return allowedSet.includes(normaliseSelectableRole(role));
  }, [allowedSet, role]);

  const deniedReason = allowed
    ? null
    : role
      ? 'role-not-permitted'
      : 'role-not-selected';

  const refresh = useCallback(() => {
    const current = normaliseSelectableRole(searchParams.get('role'));
    if (current) {
      setSearchParams((params) => {
        if (params.get('role') === current) {
          return params;
        }
        const next = new URLSearchParams(params);
        next.set('role', current);
        return next;
      });
    } else if (role) {
      setSearchParams((params) => {
        if (!params.has('role')) {
          return params;
        }
        const next = new URLSearchParams(params);
        next.delete('role');
        return next;
      });
    }
  }, [role, searchParams, setSearchParams]);

  return {
    role,
    allowed,
    status: allowed ? 'allowed' : 'denied',
    deniedReason,
    refresh,
    source,
    allowedRoles: allowedSet
  };
}

export default legacyUseRoleAccess;
