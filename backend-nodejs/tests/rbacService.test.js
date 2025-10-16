import { beforeEach, describe, expect, it } from 'vitest';
import { sequelize, User } from '../src/models/index.js';
import {
  listRoles,
  getRoleDetail,
  createRole,
  updateRole,
  assignRole,
  revokeAssignment,
  refreshRoleCache
} from '../src/services/rbacService.js';

async function createTestUser(overrides = {}) {
  return User.create({
    firstName: overrides.firstName ?? 'Alex',
    lastName: overrides.lastName ?? 'Admin',
    email: overrides.email ?? 'alex@example.com',
    passwordHash: overrides.passwordHash ?? 'hashed-password',
    type: overrides.type ?? 'admin'
  });
}

describe('rbacService', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true });
    await refreshRoleCache();
  });

  it('lists default role definitions', async () => {
    const roles = await listRoles();
    const adminRole = roles.find((role) => role.key === 'admin');
    expect(adminRole).toBeTruthy();
    expect(adminRole.permissions).toContain('admin:dashboard');
  });

  it('creates and retrieves a custom role definition', async () => {
    await createRole(
      {
        key: 'quality_manager',
        name: 'Quality Manager',
        description: 'Oversees QA workflows.',
        inherits: ['provider'],
        permissions: ['quality:audits:review'],
        navigation: { allowedMenus: ['dashboard.quality'] },
        dataVisibility: { analytics: 'quality_only' }
      },
      { role: 'admin', actorId: 'system' }
    );

    const detail = await getRoleDetail('quality_manager');
    expect(detail.role.label).toBe('Quality Manager');
    expect(detail.role.permissions).toContain('quality:audits:review');
    expect(detail.role.navigation.allowedMenus).toContain('dashboard.quality');
    expect(detail.stats.activeAssignments).toBe(0);
    expect(detail.stats.totalAssignments).toBe(0);
  });

  it('updates role permissions and metadata', async () => {
    await createRole(
      {
        key: 'quality_manager',
        name: 'Quality Manager',
        inherits: ['provider'],
        permissions: ['quality:audits:review'],
        navigation: { allowedMenus: ['dashboard.quality'] }
      },
      { role: 'admin', actorId: 'system' }
    );

    const updated = await updateRole(
      'quality_manager',
      {
        name: 'Quality Lead',
        permissions: ['quality:audits:review', 'quality:audits:assign'],
        navigation: { allowedMenus: ['dashboard.quality', 'dashboard.audit'] }
      },
      { role: 'admin', actorId: 'system' }
    );

    expect(updated.role.label).toBe('Quality Lead');
    expect(updated.role.permissions).toContain('quality:audits:assign');
    expect(updated.role.navigation.allowedMenus).toContain('dashboard.audit');
    expect(updated.stats.totalAssignments).toBe(0);
  });

  it('assigns and revokes role memberships', async () => {
    await createRole(
      {
        key: 'quality_manager',
        name: 'Quality Manager',
        inherits: ['provider'],
        permissions: ['quality:audits:review']
      },
      { role: 'admin', actorId: 'system' }
    );

    const user = await createTestUser({ email: 'qa@example.com' });

    const assigned = await assignRole(
      'quality_manager',
      { email: 'qa@example.com', note: 'Granted for pilot programme' },
      { role: 'admin', actorId: user.id }
    );

    const assignment = assigned.assignments.find((entry) => entry.user?.email === 'qa@example.com');
    expect(assignment).toBeTruthy();
    expect(assignment.note).toContain('pilot');
    expect(assigned.stats.activeAssignments).toBe(1);
    expect(assigned.stats.totalAssignments).toBe(1);

    const revoked = await revokeAssignment('quality_manager', assignment.id, {
      role: 'admin',
      actorId: user.id
    });

    const revokedEntry = revoked.assignments.find((entry) => entry.id === assignment.id);
    expect(revokedEntry.revokedAt).not.toBeNull();
    expect(revoked.stats.activeAssignments).toBe(0);
    expect(revoked.stats.revokedAssignments).toBe(1);
    expect(revoked.stats.lastRevokedAt === null || typeof revoked.stats.lastRevokedAt === 'string').toBe(true);
  });
});

