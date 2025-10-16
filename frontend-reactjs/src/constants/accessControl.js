export const COMMUNICATIONS_ALLOWED_ROLES = [
  'provider',
  'enterprise',
  'admin',
  'support',
  'operations'
];

export const BUSINESS_FRONT_ALLOWED_ROLES = ['enterprise', 'admin'];
export const PROVIDER_EXPERIENCE_ALLOWED_ROLES = ['provider', 'admin'];
export const PROVIDER_STOREFRONT_ALLOWED_ROLES = PROVIDER_EXPERIENCE_ALLOWED_ROLES;
export const CREATION_STUDIO_ALLOWED_ROLES = ['provider', 'enterprise', 'admin'];
export const SERVICEMAN_ALLOWED_ROLES = ['serviceman', 'servicemen', 'admin', 'operations', 'operations_admin'];

export const ROLE_DISPLAY_NAMES = {
  guest: 'Guest access',
  user: 'User Command Center',
  admin: 'Admin Control Tower',
  provider: 'Provider Operations Studio',
  serviceman: 'Crew Performance Cockpit',
  enterprise: 'Enterprise Performance Suite',
  support: 'Support Response Hub',
  operations: 'Operations Coordination Hub'
};

export const normaliseRole = (role) => {
  if (typeof role !== 'string') {
    return '';
  }

  return role.trim().toLowerCase();
};

export const hasCommunicationsAccess = (role) => {
  const resolved = normaliseRole(role);
  return resolved ? COMMUNICATIONS_ALLOWED_ROLES.includes(resolved) : false;
};

export const formatRoleLabel = (role) => {
  const resolved = normaliseRole(role);
  if (!resolved) {
    return 'Unknown';
  }

  return resolved
    .split(/[-_]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
};

export const isRolePermitted = (role, allowedRoles = []) => {
  const current = normaliseRole(role);
  if (!current) {
    return false;
  }

  const list = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (list.length === 0) {
    return true;
  }

  return list.some((candidate) => normaliseRole(candidate) === current);
};
