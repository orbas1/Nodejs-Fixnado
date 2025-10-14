import { resolvePermissions, describeRole } from './rbac/permissionSet.js';

export function buildSecurityContext(user) {
  if (!user) {
    const permissions = resolvePermissions('anonymous');
    return {
      actorId: null,
      actorRole: 'anonymous',
      permissions,
      metadata: describeRole('anonymous')
    };
  }

  const role = String(user.type || 'user').toLowerCase();
  const permissions = resolvePermissions(role);

  return {
    actorId: user.id,
    actorRole: role,
    permissions,
    metadata: describeRole(role),
    attributes: {
      email: user.email ?? null,
      companyId: user.Company?.id ?? null
    }
  };
}

export function attachSecurityContext(req, user) {
  const context = buildSecurityContext(user);
  req.auth = {
    ...context,
    user: user ? user.toSafeJSON?.() ?? user : null
  };
  return context;
}

export function getSecurityContext(req) {
  if (req?.auth) {
    return req.auth;
  }
  return buildSecurityContext(null);
}
