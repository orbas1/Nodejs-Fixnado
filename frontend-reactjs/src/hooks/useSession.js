import { useCallback, useEffect, useMemo, useState } from 'react';
import { isRolePermitted, normaliseRole } from '../constants/accessControl.js';

const SESSION_STORAGE_KEY = 'fx.session';
const TOKEN_STORAGE_KEY = 'fixnado:accessToken';

const FALLBACK_SESSION = Object.freeze({
  tenantId: 'fixnado-demo',
  role: 'guest',
  userId: null,
  locale: 'en-GB',
  dashboards: Object.freeze([]),
  scopes: Object.freeze([]),
  features: Object.freeze([]),
  permissions: Object.freeze([]),
  token: null,
  isAuthenticated: false
});

const ROLE_DASHBOARD_MAP = {
  admin: ['admin', 'user'],
  company: ['provider', 'enterprise', 'user'],
  enterprise: ['enterprise', 'user'],
  provider: ['provider', 'user'],
  servicemen: ['serviceman', 'user'],
  serviceman: ['serviceman', 'user'],
  user: ['user']
};

const normaliseArray = (value) => {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set();
  const result = [];

  value.forEach((entry) => {
    if (typeof entry !== 'string') {
      return;
    }
    const trimmed = entry.trim();
    if (!trimmed || seen.has(trimmed)) {
      return;
    }
    seen.add(trimmed);
    result.push(trimmed);
  });

  return result;
};

const sanitiseString = (value, fallback = null) => {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return fallback;
};

const resolveSessionFromWindow = () => {
  if (typeof window === 'undefined') {
    return FALLBACK_SESSION;
  }

  const base = {
    tenantId: FALLBACK_SESSION.tenantId,
    role: FALLBACK_SESSION.role,
    userId: FALLBACK_SESSION.userId,
    locale: FALLBACK_SESSION.locale,
    dashboards: [],
    scopes: [],
    features: [],
    permissions: []
  };

  const globalSession = window.__FIXNADO_SESSION__;
  if (globalSession && typeof globalSession === 'object') {
    base.tenantId = sanitiseString(globalSession.tenantId, base.tenantId);
    base.role = sanitiseString(globalSession.role, base.role);
    base.userId = sanitiseString(globalSession.userId, base.userId);
    base.locale = sanitiseString(globalSession.locale, base.locale);
    base.dashboards = normaliseArray(globalSession.dashboards);
    base.scopes = normaliseArray(globalSession.scopes);
    base.features = normaliseArray(globalSession.features);
    base.permissions = normaliseArray(globalSession.permissions);
  }

  try {
    const stored = window.localStorage?.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      base.tenantId = sanitiseString(parsed.tenantId, base.tenantId);
      base.role = sanitiseString(parsed.role, base.role);
      base.userId = sanitiseString(parsed.userId, base.userId);
      base.locale = sanitiseString(parsed.locale, base.locale);
      if (Array.isArray(parsed.dashboards)) {
        base.dashboards = normaliseArray(parsed.dashboards);
      }
      if (Array.isArray(parsed.scopes)) {
        base.scopes = normaliseArray(parsed.scopes);
      }
      if (Array.isArray(parsed.features)) {
        base.features = normaliseArray(parsed.features);
      }
      if (Array.isArray(parsed.permissions)) {
        base.permissions = normaliseArray(parsed.permissions);
      }
    }
  } catch (error) {
    console.warn('[useSession] Unable to parse stored session context', error);
  }

  const accessToken = (() => {
    try {
      return window.localStorage?.getItem(TOKEN_STORAGE_KEY) ?? null;
    } catch (error) {
      console.warn('[useSession] Unable to read access token', error);
      return null;
    }
  })();

  const resolvedRole = normaliseRole(base.role) || FALLBACK_SESSION.role;
  const dashboards = base.dashboards.length ? base.dashboards : ROLE_DASHBOARD_MAP[resolvedRole] ?? [];

  return {
    tenantId: base.tenantId,
    role: resolvedRole,
    userId: base.userId,
    locale: base.locale,
    dashboards: Object.freeze(dashboards),
    scopes: Object.freeze(base.scopes),
    features: Object.freeze(base.features),
    permissions: Object.freeze(base.permissions),
    token: accessToken,
    isAuthenticated: Boolean(accessToken || base.userId)
  };
};

export const readSessionSnapshot = () => resolveSessionFromWindow();

export function useSession() {
  const [session, setSession] = useState(() => resolveSessionFromWindow());

  const stableSession = useMemo(
    () => ({
      ...session,
      dashboards: session.dashboards ?? [],
      scopes: session.scopes ?? [],
      features: session.features ?? [],
      permissions: session.permissions ?? []
    }),
    [session]
  );

  const hasRole = useCallback(
    (roles) => {
      if (!roles || (Array.isArray(roles) && roles.length === 0)) {
        return true;
      }

      return isRolePermitted(stableSession.role, roles);
    },
    [stableSession.role]
  );

  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const refresh = () => {
      setSession(resolveSessionFromWindow());
    };

    const handleStorage = (event) => {
      if (event?.key && ![SESSION_STORAGE_KEY, TOKEN_STORAGE_KEY].includes(event.key)) {
        return;
      }
      refresh();
    };

    refresh();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', refresh);
    window.addEventListener('fixnado:session:update', refresh);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', refresh);
      window.removeEventListener('fixnado:session:update', refresh);
    };
  }, []);

  return {
    ...stableSession,
    hasRole
  };
}

export default useSession;
