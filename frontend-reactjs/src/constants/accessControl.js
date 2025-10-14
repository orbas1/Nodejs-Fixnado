export const COMMUNICATIONS_ALLOWED_ROLES = [
  'provider',
  'enterprise',
  'admin',
  'support',
  'operations'
];

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
