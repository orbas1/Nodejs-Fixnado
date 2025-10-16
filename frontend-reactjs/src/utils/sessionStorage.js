import { normaliseRole } from '../constants/accessControl.js';
import { SESSION_STORAGE_KEY, ROLE_DASHBOARD_MAP } from '../hooks/useSession.js';
import { addPersonaAccess, writePersonaAccess, writeActivePersona, getDefaultAllowedPersonas } from './personaStorage.js';
import { mergeProfileFromUser } from './profileStorage.js';

const FALLBACK_LOCALE = 'en-GB';
const FALLBACK_TENANT = 'fixnado-demo';

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

function toStoredSession({
  tenantId = FALLBACK_TENANT,
  role = 'guest',
  userId = null,
  locale = FALLBACK_LOCALE,
  dashboards,
  scopes = [],
  features = [],
  permissions = []
} = {}) {
  const resolvedRole = normaliseRole(role) || 'guest';
  const resolvedDashboards = Array.isArray(dashboards) && dashboards.length > 0
    ? dashboards
    : ROLE_DASHBOARD_MAP[resolvedRole] ?? [];

  return {
    tenantId,
    role: resolvedRole,
    userId,
    locale,
    dashboards: resolvedDashboards,
    scopes,
    features,
    permissions
  };
}

export function persistSessionContext(sessionPayload = {}, { persona } = {}) {
  if (typeof window === 'undefined') {
    return toStoredSession(sessionPayload);
  }

  const stored = toStoredSession(sessionPayload);

  try {
    window.localStorage?.setItem(SESSION_STORAGE_KEY, JSON.stringify(stored));
  } catch (error) {
    console.warn('[sessionStorage] unable to persist session context', error);
  }

  const resolvedPersona = normaliseRole(persona) || stored.role;
  const personaAccess = PERSONA_ACCESS_BY_ROLE[stored.role] ?? getDefaultAllowedPersonas();
  writePersonaAccess(personaAccess);
  writeActivePersona(resolvedPersona);

  try {
    window.dispatchEvent(new CustomEvent('fixnado:session-change', { detail: { role: stored.role } }));
    window.dispatchEvent(new Event('fixnado:session:update'));
  } catch (error) {
    console.warn('[sessionStorage] unable to dispatch session events', error);
  }

  return stored;
}

export function initialiseSessionFromLogin(payload = {}) {
  if (!payload || typeof payload !== 'object') {
    return null;
  }

  const user = payload.user ?? {};
  const session = payload.session ?? {};

  const role = normaliseRole(session.role || user.type || 'user');
  const persona = normaliseRole(session.persona) || role;
  const tenantId = session.tenantId || user.tenantId || FALLBACK_TENANT;
  const userId = user.id ?? user.email ?? null;
  const locale = user.locale || FALLBACK_LOCALE;
  const dashboards = Array.isArray(session.dashboards) && session.dashboards.length > 0
    ? session.dashboards
    : ROLE_DASHBOARD_MAP[role] ?? [];

  mergeProfileFromUser(user);

  return persistSessionContext(
    {
      tenantId,
      role,
      userId: userId ? String(userId) : null,
      locale,
      dashboards,
      scopes: session.scopes ?? [],
      features: session.features ?? [],
      permissions: session.permissions ?? []
    },
    { persona }
  );
}

export function clearSessionContext() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage?.removeItem(SESSION_STORAGE_KEY);
  } catch (error) {
    console.warn('[sessionStorage] unable to clear session context', error);
  }

  writePersonaAccess(getDefaultAllowedPersonas());
  writeActivePersona(null);

  try {
    window.dispatchEvent(new CustomEvent('fixnado:session-change', { detail: { role: 'guest' } }));
    window.dispatchEvent(new Event('fixnado:session:update'));
  } catch (error) {
    console.warn('[sessionStorage] unable to dispatch session reset event', error);
  }
}

export function grantPersonaForRole(role) {
  const resolved = normaliseRole(role);
  if (!resolved) {
    return addPersonaAccess(role);
  }
  const personas = PERSONA_ACCESS_BY_ROLE[resolved];
  if (personas) {
    writePersonaAccess(personas);
  }
  return addPersonaAccess(resolved);
}

export default {
  persistSessionContext,
  initialiseSessionFromLogin,
  clearSessionContext,
  grantPersonaForRole
};
