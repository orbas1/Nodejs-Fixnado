import crypto from 'crypto';
import config from '../config/index.js';
import {
  CanonicalRoles,
  Permissions,
  ROLE_ALIASES,
  normaliseRole,
  toCanonicalRole
} from '../constants/permissions.js';
import {
  PUBLIC_PERMISSIONS,
  RBAC_MATRIX,
  enumerateRoles,
  getRoleDefinition
} from '../constants/rbacMatrix.js';

export { CanonicalRoles, Permissions } from '../constants/permissions.js';

const ROLE_PERMISSIONS = new Map();

function composePermissions(role, visited = new Set()) {
  if (ROLE_PERMISSIONS.has(role)) {
    return ROLE_PERMISSIONS.get(role);
  }

  const definition = getRoleDefinition(role);
  const aggregate = new Set();

  if (!definition) {
    ROLE_PERMISSIONS.set(role, aggregate);
    return aggregate;
  }

  if (visited.has(role)) {
    // Circular dependency guard – return the aggregate captured so far.
    return ROLE_PERMISSIONS.get(role) ?? aggregate;
  }

  visited.add(role);

  (definition.inherits ?? []).forEach((parentRole) => {
    const inherited = composePermissions(parentRole, visited);
    inherited.forEach((permission) => aggregate.add(permission));
  });

  (definition.permissions ?? []).forEach((permission) => aggregate.add(permission));

  ROLE_PERMISSIONS.set(role, aggregate);
  return aggregate;
}

enumerateRoles().forEach((role) => {
  composePermissions(role);
});

function normalise(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function resolvePersona(headers = {}) {
  const persona = normaliseRole(headers['x-fixnado-persona']);
  if (!persona) {
    return null;
  }
  if (ROLE_ALIASES.has(persona)) {
    return ROLE_ALIASES.get(persona);
  }
  return persona;
}

export function resolveCanonicalRole(user, headers = {}) {
  const headerRole = toCanonicalRole(headers['x-fixnado-role']);
  if (headerRole) {
    return headerRole;
  }

  const personaRole = resolvePersona(headers);
  if (personaRole && ROLE_ALIASES.has(personaRole)) {
    return ROLE_ALIASES.get(personaRole);
  }

  if (!user) {
    return CanonicalRoles.GUEST;
  }

  const userRole = toCanonicalRole(user.type);
  if (userRole) {
    return userRole;
  }

  return CanonicalRoles.GUEST;
}

export function resolveActorContext({ user, headers = {}, ipAddress, userAgent }) {
  const role = resolveCanonicalRole(user, headers);
  const persona = resolvePersona(headers);
  const fallbackPersona = persona || (role !== CanonicalRoles.GUEST ? role : null);
  const tenantId = user?.tenantId ?? config?.tenant?.id ?? 'fixnado';
  const fingerprintSource = [user?.id ?? 'anonymous', role, headers['x-fixnado-session'] ?? '', userAgent ?? '']
    .filter(Boolean)
    .join(':');
  const fingerprint = crypto.createHash('sha256').update(fingerprintSource).digest('hex');

  return {
    actorId: user?.id ?? null,
    role,
    persona: fallbackPersona,
    tenantId,
    ipAddress: ipAddress || null,
    userAgent: userAgent || null,
    fingerprint
  };
}

function normaliseRequirement(requirement) {
  if (typeof requirement !== 'string') {
    return null;
  }
  const trimmed = requirement.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.includes(':')) {
    return { type: 'permission', value: trimmed.toLowerCase() };
  }
  return { type: 'role', value: normalise(trimmed) };
}

export function canRoleSatisfy(role, requirement) {
  const descriptor = normaliseRequirement(requirement);
  if (!descriptor) {
    return false;
  }

  if (descriptor.type === 'role') {
    if (descriptor.value === role) {
      return true;
    }

    if (role === CanonicalRoles.ADMIN) {
      return true;
    }

    if (role === CanonicalRoles.OPERATIONS && descriptor.value === CanonicalRoles.PROVIDER) {
      return true;
    }

    if (role === CanonicalRoles.PROVIDER_ADMIN && descriptor.value === CanonicalRoles.PROVIDER) {
      return true;
    }

    return false;
  }

  const permissionSet = ROLE_PERMISSIONS.get(role) ?? ROLE_PERMISSIONS.get(CanonicalRoles.GUEST);
  if (permissionSet?.has(descriptor.value)) {
    return true;
  }

  if (role === CanonicalRoles.ADMIN) {
    return true;
  }

  if (role === CanonicalRoles.OPERATIONS && permissionSet?.has(Permissions.ADMIN_AFFILIATE_WRITE)) {
    return ROLE_PERMISSIONS.get(CanonicalRoles.OPERATIONS)?.has(descriptor.value);
  }

  return false;
}

export function evaluateAccess({ user, headers, ipAddress, userAgent, requirements }) {
  const actor = resolveActorContext({ user, headers, ipAddress, userAgent });
  const normalizedRequirements = Array.isArray(requirements)
    ? requirements.map(normaliseRequirement).filter(Boolean)
    : [normaliseRequirement(requirements)].filter(Boolean);

  if (normalizedRequirements.length === 0) {
    return {
      ...actor,
      allowed: true,
      granted: [],
      missing: []
    };
  }

  const granted = [];
  const missing = [];

  normalizedRequirements.forEach((requirement) => {
    const key = requirement.type === 'permission' ? requirement.value : requirement.value;
    if (requirement.type === 'permission' && PUBLIC_PERMISSIONS.has(requirement.value)) {
      granted.push(key);
      return;
    }

    if (canRoleSatisfy(actor.role, requirement.type === 'permission' ? requirement.value : requirement.value)) {
      granted.push(key);
    } else {
      missing.push(key);
    }
  });

  return {
    ...actor,
    allowed: missing.length === 0,
    granted,
    missing
  };
}

export function listPermissionsForRole(role) {
  const canonical = ROLE_ALIASES.get(normaliseRole(role)) ?? role;
  const set = ROLE_PERMISSIONS.get(canonical);
  return Array.from(set ?? []);
}

export function describeRole(role) {
  const canonical = ROLE_ALIASES.get(normaliseRole(role)) ?? role;
  if (!RBAC_MATRIX[canonical]) {
    return null;
  }

  const definition = RBAC_MATRIX[canonical];

  return {
    role: canonical,
    label: definition.label,
    description: definition.description,
    inherits: [...(definition.inherits ?? [])],
    permissions: listPermissionsForRole(canonical),
    navigation: definition.navigation,
    dataVisibility: definition.dataVisibility
  };
}

export default {
  Permissions,
  CanonicalRoles,
  evaluateAccess,
  canRoleSatisfy,
  resolveActorContext,
  resolveCanonicalRole,
  listPermissionsForRole,
  describeRole
};
