export const BUSINESS_FRONT_ALLOWED_ROLES = ['enterprise', 'admin'];

export const ROLE_DISPLAY_NAMES = {
  guest: 'Guest access',
  user: 'User Command Center',
  admin: 'Admin Control Tower',
  provider: 'Provider Operations Studio',
  serviceman: 'Crew Performance Cockpit',
  enterprise: 'Enterprise Performance Suite'
};

export function normaliseRole(role) {
  if (typeof role !== 'string') {
    return '';
  }

  return role.trim().toLowerCase();
}

export function isRolePermitted(role, allowedRoles = []) {
  const current = normaliseRole(role);
  if (!current) {
    return false;
  }

  const list = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  if (list.length === 0) {
    return true;
  }

  return list.some((candidate) => normaliseRole(candidate) === current);
}
