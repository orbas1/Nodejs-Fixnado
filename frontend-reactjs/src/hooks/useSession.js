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

