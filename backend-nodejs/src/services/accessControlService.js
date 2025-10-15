import crypto from 'crypto';
import config from '../config/index.js';

export const Permissions = Object.freeze({
  ADMIN_DASHBOARD: 'admin:dashboard',
  ADMIN_FEATURE_READ: 'admin:feature-toggle:read',
  ADMIN_FEATURE_WRITE: 'admin:feature-toggle:write',
  ADMIN_PLATFORM_READ: 'admin:platform-settings:read',
  ADMIN_PLATFORM_WRITE: 'admin:platform-settings:write',
  ADMIN_AFFILIATE_READ: 'admin:affiliate:read',
  ADMIN_AFFILIATE_WRITE: 'admin:affiliate:write',
  AFFILIATE_DASHBOARD: 'affiliate:dashboard:view',
  AFFILIATE_REFERRALS: 'affiliate:referrals:view',
  FEED_VIEW: 'feed:live:view',
  FEED_POST: 'feed:live:post',
  FEED_BID: 'feed:live:bid',
  FEED_MESSAGE: 'feed:live:message',
  INVENTORY_READ: 'inventory:read',
  INVENTORY_WRITE: 'inventory:write',
  MATERIALS_VIEW: 'materials:showcase:view',
  PANEL_PROVIDER: 'panel:provider:view',
  PANEL_ENTERPRISE: 'panel:enterprise:view',
  PANEL_STOREFRONT: 'panel:storefront:view',
  SERVICES_MANAGE: 'services:manage',
  SERVICES_BOOK: 'services:book',
  ZONES_MATCH: 'zones:match',
  ZONES_PREVIEW: 'zones:preview'
});

export const CanonicalRoles = Object.freeze({
  GUEST: 'guest',
  USER: 'user',
  SERVICEMAN: 'serviceman',
  PROVIDER: 'provider',
  ENTERPRISE: 'enterprise',
  PROVIDER_ADMIN: 'provider_admin',
  OPERATIONS: 'operations',
  ADMIN: 'admin'
});

const ROLE_ALIASES = new Map(
  Object.entries({
    guest: CanonicalRoles.GUEST,
    user: CanonicalRoles.USER,
    servicemen: CanonicalRoles.SERVICEMAN,
    serviceman: CanonicalRoles.SERVICEMAN,
    technician: CanonicalRoles.SERVICEMAN,
    company: CanonicalRoles.PROVIDER,
    provider: CanonicalRoles.PROVIDER,
    enterprise: CanonicalRoles.ENTERPRISE,
    provider_admin: CanonicalRoles.PROVIDER_ADMIN,
    operations_admin: CanonicalRoles.OPERATIONS,
    operations: CanonicalRoles.OPERATIONS,
    admin: CanonicalRoles.ADMIN,
    superadmin: CanonicalRoles.ADMIN,
    root: CanonicalRoles.ADMIN
  })
);

const ROLE_PERMISSIONS = new Map();

function seedRole(role, permissions) {
  ROLE_PERMISSIONS.set(role, new Set(permissions));
}

seedRole(CanonicalRoles.GUEST, []);
seedRole(CanonicalRoles.USER, [
  Permissions.FEED_VIEW,
  Permissions.FEED_MESSAGE,
  Permissions.FEED_POST,
  Permissions.AFFILIATE_DASHBOARD,
  Permissions.AFFILIATE_REFERRALS,
  Permissions.SERVICES_BOOK
]);

seedRole(CanonicalRoles.SERVICEMAN, [
  ...ROLE_PERMISSIONS.get(CanonicalRoles.USER),
  Permissions.FEED_BID,
  Permissions.MATERIALS_VIEW,
  Permissions.SERVICES_MANAGE
]);

seedRole(CanonicalRoles.PROVIDER, [
  ...ROLE_PERMISSIONS.get(CanonicalRoles.SERVICEMAN),
  Permissions.INVENTORY_READ,
  Permissions.INVENTORY_WRITE,
  Permissions.PANEL_PROVIDER,
  Permissions.PANEL_STOREFRONT,
  Permissions.AFFILIATE_DASHBOARD,
  Permissions.AFFILIATE_REFERRALS
]);

seedRole(CanonicalRoles.ENTERPRISE, [
  ...ROLE_PERMISSIONS.get(CanonicalRoles.PROVIDER),
  Permissions.PANEL_ENTERPRISE
]);

seedRole(CanonicalRoles.PROVIDER_ADMIN, [
  ...ROLE_PERMISSIONS.get(CanonicalRoles.PROVIDER),
  Permissions.ADMIN_AFFILIATE_READ
]);

seedRole(CanonicalRoles.OPERATIONS, [
  ...ROLE_PERMISSIONS.get(CanonicalRoles.PROVIDER_ADMIN),
  Permissions.ZONES_MATCH,
  Permissions.ZONES_PREVIEW,
  Permissions.ADMIN_AFFILIATE_WRITE
]);

seedRole(CanonicalRoles.ADMIN, [
  ...ROLE_PERMISSIONS.get(CanonicalRoles.OPERATIONS),
  Permissions.ADMIN_DASHBOARD,
  Permissions.ADMIN_FEATURE_READ,
  Permissions.ADMIN_FEATURE_WRITE,
  Permissions.ADMIN_PLATFORM_READ,
  Permissions.ADMIN_PLATFORM_WRITE,
  Permissions.PANEL_PROVIDER,
  Permissions.PANEL_ENTERPRISE,
  Permissions.PANEL_STOREFRONT,
  Permissions.MATERIALS_VIEW,
  Permissions.SERVICES_MANAGE,
  Permissions.SERVICES_BOOK
]);

const PUBLIC_PERMISSIONS = new Set([Permissions.SERVICES_BOOK]);

function normalise(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function resolvePersona(headers = {}) {
  const persona = normalise(headers['x-fixnado-persona']);
  if (!persona) {
    return null;
  }
  if (ROLE_ALIASES.has(persona)) {
    return ROLE_ALIASES.get(persona);
  }
  return persona;
}

export function resolveCanonicalRole(user, headers = {}) {
  if (!user) {
    return CanonicalRoles.GUEST;
  }

  const headerRole = normalise(headers['x-fixnado-role']);
  if (headerRole && ROLE_ALIASES.has(headerRole)) {
    return ROLE_ALIASES.get(headerRole);
  }

  const personaRole = resolvePersona(headers);
  if (personaRole && ROLE_ALIASES.has(personaRole)) {
    return ROLE_ALIASES.get(personaRole);
  }

  const rawType = normalise(user.type);
  if (ROLE_ALIASES.has(rawType)) {
    return ROLE_ALIASES.get(rawType);
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
  const canonical = ROLE_ALIASES.get(normalise(role)) ?? role;
  const set = ROLE_PERMISSIONS.get(canonical);
  return Array.from(set ?? []);
}

export default {
  Permissions,
  CanonicalRoles,
  evaluateAccess,
  canRoleSatisfy,
  resolveActorContext,
  resolveCanonicalRole,
  listPermissionsForRole
};
