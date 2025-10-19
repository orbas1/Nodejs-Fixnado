import crypto from 'crypto';
import config from '../config/index.js';
import * as permissionConstants from '../constants/permissions.js';
import { PUBLIC_PERMISSIONS } from '../constants/rbacMatrix.js';
import {
  getCachedRoleDefinition,
  listCachedRoleDefinitions,
  refreshRoleCache,
  subscribeToRoleCache
} from './rbacService.js';

const {
  CanonicalRoles,
  Permissions,
  ROLE_ALIASES,
  normaliseRole,
  toCanonicalRole
} = permissionConstants;

const EXPORTED_ROLES = CanonicalRoles;
const EXPORTED_PERMISSIONS = Permissions;

export { EXPORTED_ROLES as CanonicalRoles, EXPORTED_PERMISSIONS as Permissions };

const ROLE_PERMISSIONS = new Map();

function rebuildRolePermissionCache(snapshot) {
  const definitions =
    snapshot instanceof Map
      ? snapshot
      : new Map(listCachedRoleDefinitions().map((definition) => [definition.key, definition]));

  ROLE_PERMISSIONS.clear();

  function compose(role, visited = new Set()) {
    if (ROLE_PERMISSIONS.has(role)) {
      return ROLE_PERMISSIONS.get(role);
    }

    const definition = definitions.get(role);
    const aggregate = new Set();

    if (!definition) {
      ROLE_PERMISSIONS.set(role, aggregate);
      return aggregate;
    }

    if (visited.has(role)) {
      return ROLE_PERMISSIONS.get(role) ?? aggregate;
    }

    visited.add(role);

    (definition.inherits ?? []).forEach((parentRole) => {
      const inherited = compose(parentRole, visited);
      inherited.forEach((permission) => aggregate.add(permission));
    });

    (definition.permissions ?? []).forEach((permission) => aggregate.add(permission));

    ROLE_PERMISSIONS.set(role, aggregate);
    return aggregate;
  }

  definitions.forEach((_, role) => {
    compose(role);
  });
}

rebuildRolePermissionCache();
subscribeToRoleCache((snapshot) => {
  rebuildRolePermissionCache(snapshot);
});

refreshRoleCache().catch((error) => {
  console.error('[rbac] Failed to refresh role cache', { message: error.message });
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
  const definition = getCachedRoleDefinition(canonical);
  if (!definition) {
    return null;
  }

  return {
    role: canonical,
    label: definition.label,
    description: definition.description,
    inherits: [...(definition.inherits ?? [])],
    permissions: listPermissionsForRole(canonical),
    navigation: definition.navigation ?? {},
    dataVisibility: definition.dataVisibility ?? {}
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
