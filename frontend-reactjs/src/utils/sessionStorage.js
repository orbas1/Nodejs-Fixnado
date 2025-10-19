import { normaliseRole } from '../constants/accessControl.js';
import {
  SESSION_STORAGE_KEY,
  ROLE_DASHBOARD_MAP,
  DEFAULT_LOCALE,
  DEFAULT_TENANT_ID
} from '../constants/session.js';
import {
  synchronisePersonaStateFromSession,
  resetPersonaAccess,
  getDefaultAllowedPersonas
} from './personaStorage.js';
import { mergeProfileFromUser } from './profileStorage.js';

const PERSONA_ACCESS_BY_ROLE = {
  guest: ['user'],
  user: ['user', 'finance'],
  finance: ['finance', 'user'],
  provider: ['provider', 'serviceman', 'finance', 'user'],
  company: ['provider', 'enterprise', 'finance', 'user'],
  serviceman: ['serviceman', 'user'],
  servicemen: ['serviceman', 'user'],
  enterprise: ['enterprise', 'provider', 'finance', 'user'],
  admin: ['admin', 'enterprise', 'provider', 'serviceman', 'finance', 'user']
};

const MIN_WRITE_INTERVAL_MS = 1500;

let latestSnapshot = null;
let writeTimeoutId = null;
let lastWriteAt = 0;

function sanitiseString(value, fallback) {
  if (typeof value !== 'string') {
    return fallback;
  }
  const trimmed = value.trim();
  return trimmed || fallback;
}

function sanitiseStringList(values, fallback = []) {
  if (!Array.isArray(values)) {
    return Array.from(fallback);
  }
  const unique = new Set();
  values.forEach((entry) => {
    if (typeof entry === 'string') {
      const trimmed = entry.trim();
      if (trimmed) {
        unique.add(trimmed);
      }
    }
  });
  return Array.from(unique);
}

function sanitisePersonaAssignments(assignments) {
  if (!Array.isArray(assignments)) {
    return [];
  }
  return assignments
    .filter((entry) => entry && typeof entry === 'object')
    .map((entry) => ({
      role: normaliseRole(entry.role) || null,
      allowCreate: Boolean(entry.allowCreate),
      dashboards: sanitiseStringList(entry.dashboards).slice(0, 12),
      notes: typeof entry.notes === 'string' ? entry.notes.slice(0, 160) : null
    }))
    .filter((entry) => entry.role);
}

function normaliseTimestamp(value, fallback = null) {
  if (!value) {
    return fallback;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }
  return date.toISOString();
}

function toStoredSession(payload = {}) {
  const role = normaliseRole(payload.role) || 'guest';
  const dashboardsInput = sanitiseStringList(payload.dashboards, ROLE_DASHBOARD_MAP[role] ?? []);
  const scopes = sanitiseStringList(payload.scopes);
  const features = sanitiseStringList(payload.features);
  const permissions = sanitiseStringList(payload.permissions);

  const allowedSet = new Set();
  const allowedInput = Array.isArray(payload.allowedPersonas) ? payload.allowedPersonas : [];
  allowedInput.forEach((entry) => {
    const persona = normaliseRole(entry);
    if (persona) {
      allowedSet.add(persona);
    }
  });
  allowedSet.add(role);

  const allowedPersonas = Array.from(allowedSet);
  const assignments = sanitisePersonaAssignments(payload.personaAssignments);

  const activeCandidate = normaliseRole(payload.activePersona);
  const activePersona = allowedPersonas.includes(activeCandidate)
    ? activeCandidate
    : allowedPersonas[0] ?? role;

  const lastSyncedAt = normaliseTimestamp(payload.lastSyncedAt, new Date().toISOString());
  const personaVersion = typeof payload.personaVersion === 'string' ? payload.personaVersion : null;

  return {
    tenantId: sanitiseString(payload.tenantId, DEFAULT_TENANT_ID),
    role,
    userId: payload.userId ? String(payload.userId) : null,
    locale: sanitiseString(payload.locale, DEFAULT_LOCALE),
    dashboards: dashboardsInput,
    scopes,
    features,
    permissions,
    allowedPersonas,
    personaAssignments: assignments,
    activePersona,
    personaVersion,
    lastSyncedAt,
    sessionId: payload.sessionId ? String(payload.sessionId) : null,
    expiresAt: normaliseTimestamp(payload.expiresAt),
    token: null,
    isAuthenticated: Boolean(payload.isAuthenticated ?? payload.userId)
  };
}

function writeSnapshot(snapshot) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage?.setItem(SESSION_STORAGE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.warn('[sessionStorage] unable to persist session context', error);
  }
}

function scheduleWrite(snapshot) {
  if (typeof window === 'undefined') {
    return;
  }

  latestSnapshot = snapshot;
  const now = Date.now();

  const writeImmediately = now - lastWriteAt >= MIN_WRITE_INTERVAL_MS;
  if (writeImmediately) {
    writeSnapshot(snapshot);
    lastWriteAt = now;
    if (writeTimeoutId) {
      clearTimeout(writeTimeoutId);
      writeTimeoutId = null;
    }
    return;
  }

  if (writeTimeoutId) {
    return;
  }

  const delay = MIN_WRITE_INTERVAL_MS - (now - lastWriteAt);
  writeTimeoutId = setTimeout(() => {
    if (latestSnapshot) {
      writeSnapshot(latestSnapshot);
      lastWriteAt = Date.now();
    }
    writeTimeoutId = null;
  }, Math.max(delay, 100));
}

function emitSessionEvents(snapshot) {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.dispatchEvent(new CustomEvent('fixnado:session-change', { detail: { role: snapshot.role } }));
    window.dispatchEvent(new Event('fixnado:session:update'));
  } catch (error) {
    console.warn('[sessionStorage] unable to dispatch session events', error);
  }
}

export function persistSessionContext(sessionPayload = {}, options = {}) {
  const stored = toStoredSession(sessionPayload);

  if (typeof window !== 'undefined') {
    scheduleWrite(stored);
  }

  synchronisePersonaStateFromSession(stored, {
    source: options.personaSource ?? 'session-sync',
    analyticsContext: {
      tenantId: stored.tenantId,
      userId: stored.userId,
      role: stored.role,
      sessionId: stored.sessionId,
      locale: stored.locale
    }
  });

  emitSessionEvents(stored);
  return stored;
}

export function readStoredSessionContext() {
  if (typeof window === 'undefined') {
    return toStoredSession();
  }

  try {
    const raw = window.localStorage?.getItem(SESSION_STORAGE_KEY);
    if (!raw) {
      return toStoredSession();
    }
    const parsed = JSON.parse(raw);
    return toStoredSession(parsed);
  } catch (error) {
    console.warn('[sessionStorage] unable to read stored session', error);
    return toStoredSession();
  }
}

export function initialiseSessionFromLogin(payload = {}) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const user = payload.user ?? {};
  const session = payload.session ?? {};

  const role = normaliseRole(session.role || user.type || 'user');
  const persona = normaliseRole(session.persona) || role;
  const tenantId = session.tenantId || user.tenantId || DEFAULT_TENANT_ID;
  const userId = user.id ?? user.email ?? null;
  const locale = user.locale || DEFAULT_LOCALE;
  const dashboards = Array.isArray(session.dashboards) && session.dashboards.length > 0
    ? session.dashboards
    : ROLE_DASHBOARD_MAP[role] ?? [];
  const allowed = PERSONA_ACCESS_BY_ROLE[role] ?? getDefaultAllowedPersonas();

  mergeProfileFromUser({ ...user, roleAssignments: user.roleAssignments ?? session.roleAssignments });

  const snapshot = persistSessionContext(
    {
      tenantId,
      role,
      userId: userId ? String(userId) : null,
      locale,
      dashboards,
      scopes: session.scopes ?? [],
      features: session.features ?? [],
      permissions: session.permissions ?? [],
      allowedPersonas: allowed,
      activePersona: persona,
      personaVersion: session.personaVersion ?? null,
      sessionId: session.id ?? null,
      expiresAt: session.expiresAt ?? null,
      isAuthenticated: true
    },
    { personaSource: 'login' }
  );

  return snapshot;
}

export function clearSessionContext() {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage?.removeItem(SESSION_STORAGE_KEY);
    } catch (error) {
      console.warn('[sessionStorage] unable to clear session context', error);
    }
  }

  latestSnapshot = null;
  lastWriteAt = 0;
  if (writeTimeoutId) {
    clearTimeout(writeTimeoutId);
    writeTimeoutId = null;
  }

  resetPersonaAccess({ reason: 'session-reset' });
  emitSessionEvents(toStoredSession());
}

export default {
  persistSessionContext,
  initialiseSessionFromLogin,
  clearSessionContext,
  readStoredSessionContext
};
