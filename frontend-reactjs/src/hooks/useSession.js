import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { isRolePermitted, normaliseRole } from '../constants/accessControl.js';
import { SESSION_STORAGE_KEY, ROLE_DASHBOARD_MAP, DEFAULT_LOCALE, DEFAULT_TENANT_ID } from '../constants/session.js';
import { fetchProfile } from '../api/profileClient.js';
import { readStoredSessionContext, persistSessionContext, clearSessionContext } from '../utils/sessionStorage.js';
import { mergeProfileFromUser } from '../utils/profileStorage.js';

const FOCUS_REVALIDATE_INTERVAL_MS = 5 * 60 * 1000;

function uniqueStringList(values = []) {
  const set = new Set();
  values.forEach((value) => {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed) {
        set.add(trimmed);
      }
    }
  });
  return Array.from(set);
}

function normaliseAssignments(assignments = []) {
  if (!Array.isArray(assignments)) {
    return [];
  }
  return assignments
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => {
      const role = normaliseRole(entry.role);
      if (!role) {
        return null;
      }
      return {
        role,
        allowCreate: Boolean(entry.allowCreate),
        dashboards: Object.freeze(uniqueStringList(entry.dashboards ?? []).slice(0, 12)),
        notes: typeof entry.notes === 'string' ? entry.notes : null
      };
    })
    .filter(Boolean);
}

function normaliseSnapshot(raw = {}) {
  const role = normaliseRole(raw.role) || 'guest';
  const dashboards = uniqueStringList(raw.dashboards ?? ROLE_DASHBOARD_MAP[role] ?? []);
  const scopes = uniqueStringList(raw.scopes ?? []);
  const features = uniqueStringList(raw.features ?? []);
  const permissions = uniqueStringList(raw.permissions ?? []);

  const allowed = uniqueStringList((raw.allowedPersonas ?? []).map((persona) => normaliseRole(persona) || persona));
  if (!allowed.includes(role)) {
    allowed.push(role);
  }

  const assignments = normaliseAssignments(raw.personaAssignments);

  const activeCandidate = normaliseRole(raw.activePersona);
  const activePersona = allowed.includes(activeCandidate) ? activeCandidate : allowed[0] ?? role;

  return Object.freeze({
    tenantId: raw.tenantId || DEFAULT_TENANT_ID,
    role,
    userId: raw.userId ?? null,
    locale: raw.locale || DEFAULT_LOCALE,
    dashboards: Object.freeze(dashboards),
    scopes: Object.freeze(scopes),
    features: Object.freeze(features),
    permissions: Object.freeze(permissions),
    allowedPersonas: Object.freeze(allowed),
    personaAssignments: Object.freeze(assignments),
    activePersona,
    personaVersion: raw.personaVersion ?? null,
    lastSyncedAt: raw.lastSyncedAt ?? null,
    sessionId: raw.sessionId ?? null,
    expiresAt: raw.expiresAt ?? null,
    token: null,
    isAuthenticated: Boolean(raw.isAuthenticated)
  });
}

function publishGlobalSession(snapshot) {
  if (typeof window === 'undefined') {
    return;
  }

  window.__FIXNADO_SESSION__ = {
    tenantId: snapshot.tenantId,
    role: snapshot.role,
    userId: snapshot.userId,
    locale: snapshot.locale,
    dashboards: Array.from(snapshot.dashboards),
    scopes: Array.from(snapshot.scopes),
    features: Array.from(snapshot.features),
    permissions: Array.from(snapshot.permissions),
    allowedPersonas: Array.from(snapshot.allowedPersonas),
    activePersona: snapshot.activePersona,
    personaVersion: snapshot.personaVersion,
    lastSyncedAt: snapshot.lastSyncedAt
  };
}

function buildSessionPayloadFromProfile(profile = {}, currentSession = {}) {
  const role = normaliseRole(profile.type) || currentSession.role || 'user';
  const assignments = Array.isArray(profile.roleAssignments)
    ? profile.roleAssignments
    : profile.preferences?.roleAssignments ?? [];

  const allowedSet = new Set();
  assignments.forEach((assignment) => {
    const persona = normaliseRole(assignment?.role);
    if (persona) {
      allowedSet.add(persona);
    }
  });
  allowedSet.add(role);

  const allowedPersonas = Array.from(allowedSet);

  const dashboardsSet = new Set();
  assignments.forEach((assignment) => {
    const dashboards = Array.isArray(assignment?.dashboards) ? assignment.dashboards : [];
    dashboards.forEach((dashboard) => {
      if (typeof dashboard === 'string' && dashboard.trim()) {
        dashboardsSet.add(dashboard.trim());
      }
    });
  });
  if (dashboardsSet.size === 0) {
    (ROLE_DASHBOARD_MAP[role] ?? []).forEach((dashboard) => dashboardsSet.add(dashboard));
  }

  const activeCandidate = normaliseRole(profile.activePersona ?? profile.persona);
  const activePersona = allowedPersonas.includes(activeCandidate)
    ? activeCandidate
    : allowedPersonas[0] ?? role;

  return {
    tenantId: profile.tenantId || profile.company?.tenantId || currentSession.tenantId || DEFAULT_TENANT_ID,
    role,
    userId: profile.id ? String(profile.id) : currentSession.userId ?? null,
    locale: profile.locale || profile.preferences?.locale || currentSession.locale || DEFAULT_LOCALE,
    dashboards: Array.from(dashboardsSet),
    scopes: profile.scopes ?? currentSession.scopes ?? [],
    features: profile.features ?? currentSession.features ?? [],
    permissions: profile.permissions ?? currentSession.permissions ?? [],
    allowedPersonas,
    personaAssignments: assignments,
    activePersona,
    personaVersion: profile.updatedAt || profile.preferences?.updatedAt || new Date().toISOString(),
    lastSyncedAt: new Date().toISOString(),
    sessionId: currentSession.sessionId ?? null,
    expiresAt: currentSession.expiresAt ?? null,
    isAuthenticated: true
  };
}

const initialSnapshot = normaliseSnapshot(readStoredSessionContext());
publishGlobalSession(initialSnapshot);
const initialState = {
  session: initialSnapshot,
  profile: null,
  status: initialSnapshot.isAuthenticated ? 'stale' : 'anonymous',
  error: null
};

export function useSession() {
  const [state, setState] = useState(initialState);
  const stateRef = useRef(initialState);
  const refreshPromiseRef = useRef(null);
  const abortControllerRef = useRef(null);
  const lastRefreshAtRef = useRef(initialSnapshot.lastSyncedAt ? Date.parse(initialSnapshot.lastSyncedAt) : 0);

  const updateState = useCallback((updater) => {
    setState((current) => {
      const next = typeof updater === 'function' ? updater(current) : updater;
      stateRef.current = next;
      return next;
    });
  }, []);

  const commitSession = useCallback(
    (snapshot, extras = {}) => {
      const nextSnapshot = normaliseSnapshot(snapshot);
      publishGlobalSession(nextSnapshot);
      updateState((current) => ({
        session: nextSnapshot,
        profile: extras.profile !== undefined ? extras.profile : current.profile,
        status: extras.status ?? current.status,
        error: extras.error !== undefined ? extras.error : current.error
      }));
      return nextSnapshot;
    },
    [updateState]
  );

  const refresh = useCallback(
    async ({ force = false, silent = false } = {}) => {
      if (!force && refreshPromiseRef.current) {
        return refreshPromiseRef.current;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      if (!silent) {
        updateState((current) => ({
          ...current,
          status: current.session.isAuthenticated ? 'refreshing' : 'loading',
          error: null
        }));
      }

      const request = (async () => {
        try {
          const profile = await fetchProfile({ signal: controller.signal });
          mergeProfileFromUser(profile);
          const payload = buildSessionPayloadFromProfile(profile, stateRef.current.session);
          const persisted = persistSessionContext(payload, { personaSource: 'profile' });
          const committed = commitSession(persisted, { profile, status: 'authenticated', error: null });
          lastRefreshAtRef.current = Date.now();
          return committed;
        } catch (error) {
          if (controller.signal.aborted) {
            throw error;
          }

          if (error?.status === 401 || error?.status === 419) {
            clearSessionContext();
            const cleared = normaliseSnapshot(readStoredSessionContext());
            commitSession(cleared, { profile: null, status: 'anonymous', error: null });
            lastRefreshAtRef.current = Date.now();
            return cleared;
          }

          console.warn('[useSession] failed to refresh session', error);
          updateState((current) => ({
            ...current,
            status: current.session.isAuthenticated ? 'error' : 'anonymous',
            error
          }));
          throw error;
        } finally {
          if (refreshPromiseRef.current === request) {
            refreshPromiseRef.current = null;
          }
          if (abortControllerRef.current === controller) {
            abortControllerRef.current = null;
          }
        }
      })();

      refreshPromiseRef.current = request;
      return request;
    },
    [commitSession, updateState]
  );

  useEffect(() => {
    refresh({ silent: true }).catch(() => {});

    return () => {
      abortControllerRef.current?.abort();
      refreshPromiseRef.current = null;
    };
  }, [refresh]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return () => {};
    }

    const handleExternalUpdate = (event) => {
      if (event && event.key && event.key !== SESSION_STORAGE_KEY) {
        return;
      }
      const snapshot = normaliseSnapshot(readStoredSessionContext());
      const status = snapshot.isAuthenticated ? stateRef.current.status : 'anonymous';
      commitSession(snapshot, { status });
    };

    const handleFocus = () => {
      if (document?.hidden) {
        return;
      }
      const last = lastRefreshAtRef.current;
      if (!last || Date.now() - last > FOCUS_REVALIDATE_INTERVAL_MS) {
        refresh({ silent: true }).catch(() => {});
      }
    };

    window.addEventListener('storage', handleExternalUpdate);
    window.addEventListener('fixnado:session:update', handleExternalUpdate);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('storage', handleExternalUpdate);
      window.removeEventListener('fixnado:session:update', handleExternalUpdate);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('visibilitychange', handleFocus);
    };
  }, [commitSession, refresh]);

  const hasRole = useCallback(
    (roles) => {
      if (!roles || (Array.isArray(roles) && roles.length === 0)) {
        return true;
      }
      return isRolePermitted(stateRef.current.session.role, roles);
    },
    []
  );

  const memoisedSession = useMemo(
    () => ({
      ...state.session,
      dashboards: state.session.dashboards ?? [],
      scopes: state.session.scopes ?? [],
      features: state.session.features ?? [],
      permissions: state.session.permissions ?? [],
      allowedPersonas: state.session.allowedPersonas ?? []
    }),
    [state.session]
  );

  return {
    ...memoisedSession,
    profile: state.profile,
    status: state.status,
    error: state.error,
    loading: state.status === 'loading' || state.status === 'refreshing',
    refresh,
    hasRole
  };
}

export default useSession;
