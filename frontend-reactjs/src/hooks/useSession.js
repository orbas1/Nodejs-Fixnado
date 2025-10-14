import { useCallback, useMemo } from 'react';
import { isRolePermitted, normaliseRole } from '../constants/accessControl.js';

const DEFAULT_SESSION = Object.freeze({
  role: 'guest',
  userId: null,
  tenantId: null,
  locale: 'en-GB',
  features: [],
  permissions: []
});

function sanitiseString(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitiseStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.filter((entry) => typeof entry === 'string' && entry.trim().length > 0).map((entry) => entry.trim());
}

function readSessionSnapshot() {
  if (typeof window === 'undefined') {
    return DEFAULT_SESSION;
  }

  try {
    const payload = window.__FIXNADO_SESSION__;
    if (!payload || typeof payload !== 'object') {
      return DEFAULT_SESSION;
    }

    const role = normaliseRole(payload.role) || DEFAULT_SESSION.role;
    const userId = sanitiseString(payload.userId);
    const tenantId = sanitiseString(payload.tenantId);
    const locale = sanitiseString(payload.locale) || DEFAULT_SESSION.locale;
    const features = sanitiseStringArray(payload.features);
    const permissions = sanitiseStringArray(payload.permissions);

    return Object.freeze({ role, userId, tenantId, locale, features, permissions });
  } catch (error) {
    console.warn('[useSession] Failed to read session payload', error);
    return DEFAULT_SESSION;
  }
}

export function useSession() {
  const snapshot = useMemo(() => readSessionSnapshot(), []);

  const hasRole = useCallback(
    (roles) => {
      if (!roles || (Array.isArray(roles) && roles.length === 0)) {
        return true;
      }

      return isRolePermitted(snapshot.role, roles);
    },
    [snapshot.role]
  );

  return {
    ...snapshot,
    isAuthenticated: Boolean(snapshot.userId),
    hasRole
  };
}

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
