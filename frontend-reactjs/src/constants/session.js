export const SESSION_STORAGE_KEY = 'fx.session';

export const DEFAULT_TENANT_ID = 'fixnado-demo';
export const DEFAULT_LOCALE = 'en-GB';

export const ROLE_DASHBOARD_MAP = {
  guest: [],
  admin: ['admin', 'provider', 'enterprise', 'finance', 'serviceman', 'user'],
  company: ['provider', 'enterprise', 'finance', 'user'],
  enterprise: ['enterprise', 'finance', 'user'],
  finance: ['finance', 'user'],
  provider: ['provider', 'finance', 'user'],
  servicemen: ['serviceman', 'user'],
  serviceman: ['serviceman', 'user'],
  user: ['user']
};

export default {
  SESSION_STORAGE_KEY,
  ROLE_DASHBOARD_MAP,
  DEFAULT_TENANT_ID,
  DEFAULT_LOCALE
};
