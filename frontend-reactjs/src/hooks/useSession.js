import { useEffect, useMemo, useState } from 'react';

const SESSION_STORAGE_KEY = 'fx.session';
const TOKEN_STORAGE_KEY = 'fixnado:accessToken';

const FALLBACK_SESSION = Object.freeze({
  tenantId: 'fixnado-demo',
  role: 'guest',
  userId: null,
  dashboards: Object.freeze([]),
  scopes: Object.freeze([]),
  token: null,
  isAuthenticated: false
});

const ROLE_DASHBOARD_MAP = {
  admin: ['admin'],
  company: ['provider', 'enterprise'],
  enterprise: ['enterprise'],
  provider: ['provider'],
  servicemen: ['serviceman'],
  serviceman: ['serviceman'],
  user: ['user']
};

function sanitiseString(value, fallback = null) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return fallback;
}

function uniqueStrings(values = []) {
  const seen = new Set();
  const result = [];
  values.forEach((value) => {
    if (typeof value !== 'string') return;
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) return;
    seen.add(trimmed);
    result.push(trimmed);
  });
  return result;
}

function resolveSessionFromWindow() {
  if (typeof window === 'undefined') {
    return FALLBACK_SESSION;
  }

  const base = { ...FALLBACK_SESSION };
  const globalSession = window.__FIXNADO_SESSION__;

  if (globalSession && typeof globalSession === 'object') {
    base.tenantId = sanitiseString(globalSession.tenantId, base.tenantId);
    base.role = sanitiseString(globalSession.role, base.role);
    base.userId = sanitiseString(globalSession.userId, base.userId);
    if (Array.isArray(globalSession.dashboards)) {
      base.dashboards = uniqueStrings(globalSession.dashboards);
    }
    if (Array.isArray(globalSession.scopes)) {
      base.scopes = Object.freeze(uniqueStrings(globalSession.scopes));
    }
  }

  try {
    const stored = window.localStorage?.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      base.tenantId = sanitiseString(parsed.tenantId, base.tenantId);
      base.role = sanitiseString(parsed.role, base.role);
      base.userId = sanitiseString(parsed.userId, base.userId);
      if (Array.isArray(parsed.dashboards)) {
        base.dashboards = uniqueStrings(parsed.dashboards);
      }
      if (Array.isArray(parsed.scopes)) {
        base.scopes = Object.freeze(uniqueStrings(parsed.scopes));
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

  const dashboards = base.dashboards.length
    ? base.dashboards
    : ROLE_DASHBOARD_MAP[base.role] ?? ROLE_DASHBOARD_MAP[sanitiseString(base.role)] ?? [];

  return {
    tenantId: base.tenantId,
    role: base.role,
    userId: base.userId,
    dashboards: Object.freeze(dashboards),
    scopes: base.scopes,
    token: accessToken,
    isAuthenticated: Boolean(accessToken || base.userId)
  };
}

export function readSessionSnapshot() {
  return resolveSessionFromWindow();
}

export default function useSession() {
  const [session, setSession] = useState(() => resolveSessionFromWindow());

  const stableSession = useMemo(() => ({ ...session, dashboards: session.dashboards }), [session]);

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

    window.addEventListener('storage', handleStorage);
    window.addEventListener('fixnado:session-updated', refresh);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('fixnado:session-updated', refresh);
    };
  }, []);

  return stableSession;
}
