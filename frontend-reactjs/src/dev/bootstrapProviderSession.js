import { persistSessionContext, readStoredSessionContext } from '../utils/sessionStorage.js';
import { ROLE_DASHBOARD_MAP } from '../constants/session.js';

const PROVIDER_DASHBOARDS = ROLE_DASHBOARD_MAP.provider ?? ['provider'];
const DEFAULT_ALLOWED_PERSONAS = ['provider', 'finance', 'user'];

export function ensureProviderDevSession() {
  if (typeof window === 'undefined') {
    return null;
  }

  const snapshot = readStoredSessionContext();
  const hasProviderDashboard = snapshot.isAuthenticated && snapshot.dashboards.includes('provider');

  if (hasProviderDashboard) {
    return snapshot;
  }

  const now = new Date().toISOString();

  return persistSessionContext(
    {
      tenantId: snapshot.tenantId || 'fixnado-demo',
      role: 'provider',
      userId: snapshot.userId || 'dev-provider',
      locale: snapshot.locale || 'en-GB',
      dashboards: PROVIDER_DASHBOARDS,
      scopes: snapshot.scopes || [],
      features: snapshot.features || [],
      permissions: snapshot.permissions || [],
      allowedPersonas: DEFAULT_ALLOWED_PERSONAS,
      personaAssignments: snapshot.personaAssignments || [],
      activePersona: 'provider',
      personaVersion: snapshot.personaVersion || now,
      lastSyncedAt: now,
      sessionId: snapshot.sessionId || 'dev-provider-session',
      expiresAt: snapshot.expiresAt || null,
      isAuthenticated: true
    },
    { personaSource: 'dev-provider-bootstrap' }
  );
}

export default ensureProviderDevSession;
