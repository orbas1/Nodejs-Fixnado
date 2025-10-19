import { normaliseRole } from '../constants/accessControl.js';
import { recordPersonaAnalytics } from './personaAnalytics.js';

export const PERSONA_ACCESS_KEY = 'fixnado:personaAccess';
export const ACTIVE_PERSONA_KEY = 'fixnado:activePersona';

const DEFAULT_ALLOWED = Object.freeze(['user', 'finance']);
const MAX_ALLOWED = 12;

function sanitisePersona(value) {
  const role = normaliseRole(value);
  return role || null;
}

function sanitisePersonaList(list, { fallback = DEFAULT_ALLOWED } = {}) {
  const set = new Set();
  if (Array.isArray(list)) {
    list.forEach((entry) => {
      const persona = sanitisePersona(entry);
      if (persona) {
        set.add(persona);
      }
    });
  }

  if (set.size === 0 && Array.isArray(fallback)) {
    fallback.forEach((entry) => {
      const persona = sanitisePersona(entry);
      if (persona) {
        set.add(persona);
      }
    });
  }

  return Array.from(set).slice(0, MAX_ALLOWED);
}

function nowIsoString() {
  return new Date().toISOString();
}

function arraysEqual(a = [], b = []) {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((value, index) => value === b[index]);
}

function emitPersonaEvents(state) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.dispatchEvent(
      new CustomEvent('fixnado:persona:change', {
        detail: {
          allowed: state.allowed,
          active: state.active,
          source: state.source,
          version: state.version,
          syncedAt: state.syncedAt
        }
      })
    );
    window.dispatchEvent(new Event('fixnado:session:update'));
  } catch (error) {
    console.warn('[personaStorage] unable to dispatch persona events', error);
  }
}

function persistState(state, { emit = true } = {}) {
  if (typeof window === 'undefined') {
    return state;
  }

  const payload = {
    allowed: state.allowed,
    active: state.active,
    version: state.version ?? null,
    source: state.source ?? 'unknown',
    syncedAt: state.syncedAt ?? nowIsoString()
  };

  try {
    window.localStorage?.setItem(PERSONA_ACCESS_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('[personaStorage] unable to persist persona state', error);
  }

  try {
    if (payload.active) {
      window.localStorage?.setItem(ACTIVE_PERSONA_KEY, payload.active);
    } else {
      window.localStorage?.removeItem(ACTIVE_PERSONA_KEY);
    }
  } catch (error) {
    console.warn('[personaStorage] unable to persist active persona', error);
  }

  if (emit) {
    emitPersonaEvents(payload);
  }

  return payload;
}

function buildDefaultState() {
  return {
    allowed: Array.from(DEFAULT_ALLOWED),
    active: DEFAULT_ALLOWED[0],
    version: null,
    source: 'default',
    syncedAt: nowIsoString()
  };
}

export function readPersonaState() {
  if (typeof window === 'undefined') {
    return buildDefaultState();
  }

  try {
    const raw = window.localStorage?.getItem(PERSONA_ACCESS_KEY);
    const baseState = raw ? JSON.parse(raw) : {};
    const allowed = sanitisePersonaList(baseState.allowed ?? baseState);
    const storedActive = sanitisePersona(baseState.active);
    const storedActiveFallback = sanitisePersona(window.localStorage?.getItem(ACTIVE_PERSONA_KEY));
    const active = allowed.includes(storedActive)
      ? storedActive
      : allowed.includes(storedActiveFallback)
        ? storedActiveFallback
        : allowed[0] ?? null;

    return {
      allowed,
      active,
      version: typeof baseState.version === 'string' ? baseState.version : null,
      source: typeof baseState.source === 'string' ? baseState.source : 'unknown',
      syncedAt:
        typeof baseState.syncedAt === 'string' && baseState.syncedAt.trim()
          ? baseState.syncedAt
          : nowIsoString()
    };
  } catch (error) {
    console.warn('[personaStorage] unable to read persona state', error);
    return buildDefaultState();
  }
}

export function synchronisePersonaStateFromSession(session = {}, { source = 'session-bootstrap', analyticsContext } = {}) {
  const current = readPersonaState();
  const allowed = sanitisePersonaList(session.allowedPersonas, { fallback: current.allowed });
  const rolePersona = sanitisePersona(session.role);
  if (rolePersona && !allowed.includes(rolePersona)) {
    allowed.unshift(rolePersona);
  }
  if (allowed.length === 0) {
    allowed.push(...DEFAULT_ALLOWED);
  }

  const sessionActive = sanitisePersona(session.activePersona);
  const active = allowed.includes(sessionActive)
    ? sessionActive
    : allowed.includes(rolePersona)
      ? rolePersona
      : allowed[0] ?? null;

  const nextState = {
    allowed,
    active,
    version: typeof session.personaVersion === 'string' ? session.personaVersion : current.version,
    source,
    syncedAt: session.lastSyncedAt || nowIsoString()
  };

  const changed =
    !arraysEqual(current.allowed, nextState.allowed) || current.active !== nextState.active || current.version !== nextState.version;

  if (changed) {
    persistState(nextState);
    recordPersonaAnalytics('persona.bootstrap', {
      persona: nextState.active,
      source,
      outcome: 'synced',
      allowed: nextState.allowed,
      analyticsContext,
      metadata: {
        personaVersion: nextState.version || undefined
      }
    });
  }

  return nextState;
}

export function setActivePersona(persona, { source = 'manual', analyticsContext } = {}) {
  const current = readPersonaState();
  const candidate = sanitisePersona(persona);

  if (!candidate) {
    return { ...current, updated: false };
  }

  if (!current.allowed.includes(candidate)) {
    recordPersonaAnalytics('persona.blocked', {
      persona: candidate,
      outcome: 'denied',
      reason: 'not_allowed',
      source,
      allowed: current.allowed,
      analyticsContext
    });
    return { ...current, updated: false, blocked: true };
  }

  if (current.active === candidate) {
    return { ...current, updated: false };
  }

  const nextState = {
    ...current,
    active: candidate,
    source,
    syncedAt: nowIsoString()
  };

  persistState(nextState);

  recordPersonaAnalytics('persona.switch', {
    persona: candidate,
    outcome: 'granted',
    source,
    allowed: nextState.allowed,
    analyticsContext
  });

  return { ...nextState, updated: true };
}

export function resetPersonaAccess({ reason = 'reset', analyticsContext } = {}) {
  const nextState = buildDefaultState();
  nextState.source = reason;
  persistState(nextState);
  recordPersonaAnalytics('persona.reset', {
    persona: nextState.active,
    outcome: 'reset',
    source: reason,
    allowed: nextState.allowed,
    analyticsContext
  });
  return nextState.allowed;
}

export function readPersonaAccess() {
  return readPersonaState().allowed;
}

export function readActivePersona() {
  return readPersonaState().active;
}

export function getDefaultAllowedPersonas() {
  return Array.from(DEFAULT_ALLOWED);
}

export default {
  PERSONA_ACCESS_KEY,
  ACTIVE_PERSONA_KEY,
  readPersonaState,
  synchronisePersonaStateFromSession,
  setActivePersona,
  resetPersonaAccess,
  readPersonaAccess,
  readActivePersona,
  getDefaultAllowedPersonas
};
