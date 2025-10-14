import RBAC_MATRIX from './policyMatrix.js';

function collectPermissions(role, visited = new Set()) {
  if (!role || visited.has(role)) {
    return [];
  }

  visited.add(role);
  const definition = RBAC_MATRIX[role];
  if (!definition) {
    return [];
  }

  const inherited = Array.isArray(definition.inherits)
    ? definition.inherits.flatMap((parent) => collectPermissions(parent, visited))
    : [];

  return [...new Set([...inherited, ...(definition.grants ?? [])])];
}

export function resolvePermissions(role) {
  const normalised = String(role || 'anonymous').toLowerCase();
  if (!RBAC_MATRIX[normalised]) {
    return new Set(RBAC_MATRIX.anonymous.grants);
  }

  const collected = collectPermissions(normalised);
  return new Set(collected);
}

export function hasPermission(permissionSet, required) {
  if (!permissionSet || !(permissionSet instanceof Set)) {
    return false;
  }

  if (permissionSet.has('*')) {
    return true;
  }

  if (Array.isArray(required)) {
    return required.some((permission) => hasPermission(permissionSet, permission));
  }

  return permissionSet.has(required);
}

export function ensureAllPermissions(permissionSet, required) {
  if (!Array.isArray(required)) {
    return hasPermission(permissionSet, required);
  }

  return required.every((permission) => hasPermission(permissionSet, permission));
}

export function describeRole(role) {
  const definition = RBAC_MATRIX[role];
  if (!definition) {
    return RBAC_MATRIX.anonymous.metadata;
  }

  return definition.metadata;
}

export default RBAC_MATRIX;
