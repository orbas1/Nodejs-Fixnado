import { describe, expect, it } from 'vitest';
import accessControlService, {
  CanonicalRoles,
  Permissions,
  describeRole,
  evaluateAccess,
  listPermissionsForRole,
  resolveCanonicalRole
} from '../src/services/accessControlService.js';
import { ROLE_ALIASES } from '../src/constants/permissions.js';

const headersForRole = (role) => ({
  'x-fixnado-role': role,
  'user-agent': 'vitest'
});

describe('accessControlService RBAC matrix', () => {
  it('extends user permissions across hierarchy', () => {
    const userPermissions = new Set(listPermissionsForRole(CanonicalRoles.USER));
    expect(userPermissions.has(Permissions.SERVICES_BOOK)).toBe(true);
    expect(userPermissions.has(Permissions.FEED_VIEW)).toBe(true);
    expect(userPermissions.has(Permissions.SERVICES_MANAGE)).toBe(false);

    const providerPermissions = new Set(listPermissionsForRole(CanonicalRoles.PROVIDER));
    expect(providerPermissions.has(Permissions.SERVICES_BOOK)).toBe(true);
    expect(providerPermissions.has(Permissions.FEED_VIEW)).toBe(true);
    expect(providerPermissions.has(Permissions.SERVICES_MANAGE)).toBe(true);
    expect(providerPermissions.has(Permissions.PANEL_PROVIDER)).toBe(true);
  });

  it('describes roles with merged metadata', () => {
    const descriptor = describeRole(CanonicalRoles.OPERATIONS);
    expect(descriptor).toMatchObject({
      role: CanonicalRoles.OPERATIONS,
      label: 'Operations Control'
    });
    expect(descriptor.permissions).toContain(Permissions.ZONES_MATCH);
    expect(descriptor.permissions).toContain(Permissions.COMPLIANCE_EXPORT);
    expect(descriptor.navigation.allowedMenus).toContain('dashboard.operations');
  });

  it('evaluates permissions based on canonical inheritance', () => {
    const result = evaluateAccess({
      user: { id: 'user-1', type: CanonicalRoles.PROVIDER },
      headers: headersForRole('provider'),
      requirements: [Permissions.PANEL_PROVIDER, Permissions.PANEL_STOREFRONT]
    });

    expect(result.allowed).toBe(true);
    expect(result.granted).toEqual(expect.arrayContaining([Permissions.PANEL_PROVIDER, Permissions.PANEL_STOREFRONT]));
  });

  it('blocks access when requirements exceed role grants', () => {
    const result = evaluateAccess({
      user: { id: 'user-1', type: CanonicalRoles.USER },
      headers: headersForRole('user'),
      requirements: [Permissions.PANEL_PROVIDER]
    });

    expect(result.allowed).toBe(false);
    expect(result.missing).toContain(Permissions.PANEL_PROVIDER);
  });

  it('resolves aliases to canonical roles', () => {
    for (const [alias, canonical] of ROLE_ALIASES.entries()) {
      const resolved = resolveCanonicalRole({ type: alias }, headersForRole(alias));
      expect(resolved).toBe(canonical);
    }
  });

  it('exposes canonical role metadata through default export', () => {
    expect(accessControlService.describeRole(CanonicalRoles.ADMIN).permissions).toContain(Permissions.ADMIN_PLATFORM_WRITE);
  });
});
