import { Op, fn, col, where, literal } from 'sequelize';
import {
  RbacRole,
  RbacRolePermission,
  RbacRoleInheritance,
  RbacRoleAssignment,
  User,
  sequelize
} from '../models/index.js';
import { Permissions } from '../constants/permissions.js';
import { RBAC_MATRIX } from '../constants/rbacMatrix.js';
import { recordSecurityEvent } from './auditTrailService.js';
import { normaliseEmail, stableHash } from '../utils/security/fieldEncryption.js';

const permissionCatalog = Object.freeze(Object.values(Permissions).sort());

function buildDefaultCache() {
  const definitions = new Map();
  Object.entries(RBAC_MATRIX).forEach(([key, definition]) => {
    definitions.set(key, {
      role: key,
      key,
      label: definition.label,
      name: definition.label,
      description: definition.description ?? '',
      inherits: [...(definition.inherits ?? [])],
      permissions: [...(definition.permissions ?? [])],
      navigation: {
        allowedMenus: [...(definition.navigation?.allowedMenus ?? [])],
        deniedMenus: [...(definition.navigation?.deniedMenus ?? [])]
      },
      dataVisibility: { ...(definition.dataVisibility ?? {}) },
      metadata: {
        navigation: definition.navigation ?? {},
        dataVisibility: definition.dataVisibility ?? {}
      },
      isSystem: true,
      status: 'active'
    });
  });
  return definitions;
}

let roleDefinitionCache = buildDefaultCache();
const cacheListeners = new Set();
let refreshPromise = null;

function getRoleDefinitionsSnapshot() {
  return new Map(roleDefinitionCache);
}

function notifyCacheListeners() {
  const snapshot = getRoleDefinitionsSnapshot();
  cacheListeners.forEach((listener) => {
    try {
      listener(snapshot);
    } catch (error) {
      console.error('[rbac] Failed to notify cache listener', { message: error.message });
    }
  });
}

export function subscribeToRoleCache(listener) {
  if (typeof listener === 'function') {
    cacheListeners.add(listener);
    listener(getRoleDefinitionsSnapshot());
    return () => cacheListeners.delete(listener);
  }
  return () => {};
}

function normaliseRoleKey(value) {
  if (typeof value !== 'string') {
    return '';
  }
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normaliseStringArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry) => entry.length > 0);
}

function normaliseNavigation(source = {}) {
  return {
    allowedMenus: normaliseStringArray(source.allowedMenus ?? source.allowed ?? []),
    deniedMenus: normaliseStringArray(source.deniedMenus ?? source.denied ?? [])
  };
}

function normaliseDataVisibility(source = {}) {
  const entries = {};
  ['finance', 'messaging', 'inventory', 'analytics'].forEach((key) => {
    if (source[key] == null) {
      return;
    }
    const value = String(source[key]).trim();
    if (value) {
      entries[key] = value;
    }
  });
  return entries;
}

function sanitiseRolePayload(input = {}, { isUpdate = false } = {}) {
  const errors = [];
  const payload = {};

  if (!isUpdate) {
    const key = normaliseRoleKey(input.key ?? input.id ?? '');
    if (!key) {
      errors.push('Role key is required.');
    } else {
      payload.key = key;
    }
  }

  if (typeof input.name !== 'string' || !input.name.trim()) {
    errors.push('Role name is required.');
  } else {
    payload.name = input.name.trim();
  }

  if (input.description != null) {
    if (typeof input.description !== 'string') {
      errors.push('Description must be a string when provided.');
    } else {
      payload.description = input.description.trim();
    }
  }

  const inherits = Array.isArray(input.inherits) ? input.inherits : [];
  payload.inherits = inherits
    .map((entry) => normaliseRoleKey(entry))
    .filter((entry, index, self) => entry && self.indexOf(entry) === index);

  const permissions = Array.isArray(input.permissions) ? input.permissions : [];
  payload.permissions = permissions
    .map((entry) => (typeof entry === 'string' ? entry.trim() : ''))
    .filter((entry, index, self) => entry && self.indexOf(entry) === index);

  const metadata = typeof input.metadata === 'object' && input.metadata !== null ? { ...input.metadata } : {};
  const navigation = normaliseNavigation(input.navigation ?? metadata.navigation ?? {});
  const dataVisibility = normaliseDataVisibility(input.dataVisibility ?? metadata.dataVisibility ?? {});

  metadata.navigation = navigation;
  metadata.dataVisibility = dataVisibility;
  payload.metadata = metadata;

  if (errors.length > 0) {
    const error = new Error(errors.join(' '));
    error.name = 'ValidationError';
    error.details = errors;
    throw error;
  }

  return payload;
}

function mergeDefinitionFromRow(definitions, roleRow) {
  const base = definitions.get(roleRow.key) ?? {
    role: roleRow.key,
    key: roleRow.key,
    label: roleRow.name,
    name: roleRow.name,
    description: roleRow.description ?? '',
    inherits: [],
    permissions: [],
    navigation: { allowedMenus: [], deniedMenus: [] },
    dataVisibility: {},
    metadata: {},
    isSystem: roleRow.isSystem,
    status: roleRow.status
  };

  const inherits = new Set(base.inherits);
  (roleRow.inheritanceEntries ?? []).forEach((entry) => {
    if (entry.parentRoleKey) {
      inherits.add(entry.parentRoleKey);
    }
  });

  const permissions = new Set(base.permissions);
  (roleRow.permissionEntries ?? []).forEach((entry) => {
    if (entry.permission) {
      permissions.add(entry.permission);
    }
  });

  const mergedNavigation = {
    allowedMenus: Array.from(
      new Set([
        ...(base.navigation?.allowedMenus ?? []),
        ...normaliseStringArray(roleRow.metadata?.navigation?.allowedMenus)
      ])
    ),
    deniedMenus: Array.from(
      new Set([
        ...(base.navigation?.deniedMenus ?? []),
        ...normaliseStringArray(roleRow.metadata?.navigation?.deniedMenus)
      ])
    )
  };

  const mergedDataVisibility = {
    ...base.dataVisibility,
    ...normaliseDataVisibility(roleRow.metadata?.dataVisibility)
  };

  const metadata = {
    ...(base.metadata ?? {}),
    ...(roleRow.metadata ?? {})
  };
  metadata.navigation = mergedNavigation;
  metadata.dataVisibility = mergedDataVisibility;

  definitions.set(roleRow.key, {
    role: roleRow.key,
    key: roleRow.key,
    label: roleRow.name || base.label || roleRow.key,
    name: roleRow.name || base.label || roleRow.key,
    description: roleRow.description ?? base.description ?? '',
    inherits: Array.from(inherits),
    permissions: Array.from(permissions),
    navigation: mergedNavigation,
    dataVisibility: mergedDataVisibility,
    metadata,
    isSystem: roleRow.isSystem,
    status: roleRow.status
  });
}

export function listCachedRoleDefinitions() {
  return Array.from(roleDefinitionCache.values()).map((definition) => ({ ...definition }));
}

export function getCachedRoleDefinition(key) {
  return roleDefinitionCache.get(key) ?? null;
}

export async function refreshRoleCache(options = {}) {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const roles = await RbacRole.findAll({
        where: { status: 'active' },
        include: [
          { model: RbacRolePermission, as: 'permissionEntries', attributes: ['permission'] },
          { model: RbacRoleInheritance, as: 'inheritanceEntries', attributes: ['parentRoleKey'] }
        ],
        order: [['name', 'ASC']],
        transaction: options.transaction
      });

      const definitions = buildDefaultCache();
      roles.forEach((role) => mergeDefinitionFromRow(definitions, role));
      roleDefinitionCache = definitions;
      notifyCacheListeners();
      refreshPromise = null;
      return getRoleDefinitionsSnapshot();
    })().catch((error) => {
      refreshPromise = null;
      if (error.name === 'SequelizeDatabaseError' && /no such table/i.test(error.message)) {
        roleDefinitionCache = buildDefaultCache();
        notifyCacheListeners();
        return getRoleDefinitionsSnapshot();
      }
      throw error;
    });
  }

  return refreshPromise;
}

function serializeRole(roleRow, { includeDefinition = true } = {}) {
  const definition = includeDefinition ? getCachedRoleDefinition(roleRow.key) : null;
  const inherits = definition ? definition.inherits : (roleRow.inheritanceEntries ?? []).map((entry) => entry.parentRoleKey);
  const permissions = definition
    ? definition.permissions
    : (roleRow.permissionEntries ?? []).map((entry) => entry.permission).filter(Boolean);
  const navigation = definition?.navigation ?? normaliseNavigation(roleRow.metadata?.navigation ?? {});
  const dataVisibility = definition?.dataVisibility ?? normaliseDataVisibility(roleRow.metadata?.dataVisibility ?? {});

  return {
    id: roleRow.id,
    key: roleRow.key,
    name: definition?.label ?? roleRow.name,
    label: definition?.label ?? roleRow.name,
    description: definition?.description ?? roleRow.description ?? '',
    status: roleRow.status,
    isSystem: roleRow.isSystem,
    inherits,
    permissions,
    navigation,
    dataVisibility,
    metadata: definition?.metadata ?? roleRow.metadata ?? {},
    createdAt: roleRow.createdAt?.toISOString?.() ?? null,
    updatedAt: roleRow.updatedAt?.toISOString?.() ?? null
  };
}

async function countAssignmentsForRoles(roleIds) {
  if (!Array.isArray(roleIds) || roleIds.length === 0) {
    return new Map();
  }

  const [activeRows, totalRows] = await Promise.all([
    RbacRoleAssignment.findAll({
      attributes: ['roleId', [fn('COUNT', col('role_id')), 'count']],
      where: { roleId: { [Op.in]: roleIds }, revokedAt: null },
      group: ['role_id']
    }),
    RbacRoleAssignment.findAll({
      attributes: ['roleId', [fn('COUNT', col('role_id')), 'count']],
      where: { roleId: { [Op.in]: roleIds } },
      group: ['role_id']
    })
  ]);

  const activeMap = new Map(activeRows.map((row) => [row.roleId, Number.parseInt(row.get('count'), 10) || 0]));
  const totalMap = new Map(totalRows.map((row) => [row.roleId, Number.parseInt(row.get('count'), 10) || 0]));
  const counts = new Map();

  roleIds.forEach((roleId) => {
    counts.set(roleId, {
      active: activeMap.get(roleId) ?? 0,
      total: totalMap.get(roleId) ?? 0
    });
  });

  return counts;
}

export async function listRoles({ search, status = 'active' } = {}) {
  const whereClause = {};
  if (status === 'active') {
    whereClause.status = 'active';
  } else if (status === 'archived') {
    whereClause.status = 'archived';
  }

  if (search && typeof search === 'string' && search.trim()) {
    const term = search.trim().toLowerCase();
    whereClause[Op.or] = [
      where(fn('lower', col('rbac_roles.name')), { [Op.like]: `%${term}%` }),
      where(fn('lower', col('rbac_roles.key')), { [Op.like]: `%${term}%` })
    ];
  }

  const roles = await RbacRole.findAll({
    where: whereClause,
    include: [
      { model: RbacRolePermission, as: 'permissionEntries', attributes: ['permission'] },
      { model: RbacRoleInheritance, as: 'inheritanceEntries', attributes: ['parentRoleKey'] }
    ],
    order: [['name', 'ASC']]
  });

  const counts = await countAssignmentsForRoles(roles.map((role) => role.id));
  const roleMap = new Map(roles.map((role) => [role.key, role]));
  const list = roles.map((role) => ({
    ...serializeRole(role),
    assignmentCounts: counts.get(role.id) ?? { active: 0, total: 0 }
  }));

  if (status !== 'archived') {
    getRoleDefinitionsSnapshot().forEach((definition, key) => {
      if (!roleMap.has(key)) {
        list.push({
          id: null,
          key,
          name: definition.label,
          label: definition.label,
          description: definition.description ?? '',
          status: 'active',
          isSystem: true,
          inherits: definition.inherits,
          permissions: definition.permissions,
          navigation: definition.navigation,
          dataVisibility: definition.dataVisibility,
          metadata: definition.metadata,
          assignmentCounts: { active: 0, total: 0 },
          createdAt: null,
          updatedAt: null
        });
      }
    });
  }

  return list.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getRoleDetail(key) {
  const role = await RbacRole.findOne({
    where: { key },
    include: [
      { model: RbacRolePermission, as: 'permissionEntries', attributes: ['permission'] },
      { model: RbacRoleInheritance, as: 'inheritanceEntries', attributes: ['parentRoleKey'] }
    ]
  });

  if (!role) {
    const error = new Error(`Role ${key} not found`);
    error.statusCode = 404;
    throw error;
  }

  const assignments = await RbacRoleAssignment.findAll({
    where: { roleId: role.id },
    include: [
      { model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'type'] },
      { model: User, as: 'assignedByUser', attributes: ['id', 'firstName', 'lastName', 'email', 'type'] }
    ],
    order: [[literal('revoked_at IS NOT NULL'), 'ASC'], ['created_at', 'DESC']]
  });

  const activeAssignments = assignments.filter((assignment) => assignment.revokedAt == null);
  const revokedAssignments = assignments.filter((assignment) => assignment.revokedAt != null);

  const nextExpiryDate = activeAssignments.reduce((soonest, assignment) => {
    if (!assignment.expiresAt) {
      return soonest;
    }
    if (!soonest || assignment.expiresAt < soonest) {
      return assignment.expiresAt;
    }
    return soonest;
  }, null);

  const lastAssignedAtDate = assignments.reduce((latest, assignment) => {
    if (!assignment.createdAt) {
      return latest;
    }
    if (!latest || assignment.createdAt > latest) {
      return assignment.createdAt;
    }
    return latest;
  }, null);

  const lastRevokedAtDate = revokedAssignments.reduce((latest, assignment) => {
    if (!assignment.revokedAt) {
      return latest;
    }
    if (!latest || assignment.revokedAt > latest) {
      return assignment.revokedAt;
    }
    return latest;
  }, null);

  const activeTenants = new Set(
    activeAssignments.map((assignment) => assignment.tenantId).filter((tenantId) => Boolean(tenantId))
  );

  const serializedAssignments = assignments.map((assignment) => ({
    id: assignment.id,
    tenantId: assignment.tenantId ?? null,
    note: assignment.note ?? null,
    expiresAt: assignment.expiresAt?.toISOString?.() ?? null,
    revokedAt: assignment.revokedAt?.toISOString?.() ?? null,
    createdAt: assignment.createdAt?.toISOString?.() ?? null,
    updatedAt: assignment.updatedAt?.toISOString?.() ?? null,
    user: assignment.user
      ? {
          id: assignment.user.id,
          firstName: assignment.user.firstName ?? null,
          lastName: assignment.user.lastName ?? null,
          email: assignment.user.email ?? null,
          type: assignment.user.type ?? null
        }
      : null,
    assignedBy: assignment.assignedByUser
      ? {
          id: assignment.assignedByUser.id,
          firstName: assignment.assignedByUser.firstName ?? null,
          lastName: assignment.assignedByUser.lastName ?? null,
          email: assignment.assignedByUser.email ?? null,
          type: assignment.assignedByUser.type ?? null
        }
      : null
  }));

  return {
    role: serializeRole(role),
    assignments: serializedAssignments,
    stats: {
      activeAssignments: activeAssignments.length,
      totalAssignments: assignments.length,
      revokedAssignments: revokedAssignments.length,
      uniqueTenants: activeTenants.size,
      nextExpiry: nextExpiryDate?.toISOString?.() ?? null,
      lastAssignedAt: lastAssignedAtDate?.toISOString?.() ?? null,
      lastRevokedAt: lastRevokedAtDate?.toISOString?.() ?? null,
      lastUpdatedAt: role.updatedAt?.toISOString?.() ?? role.createdAt?.toISOString?.() ?? null
    },
    permissionsCatalog: permissionCatalog,
    availableRoles: listCachedRoleDefinitions().map((definition) => ({
      key: definition.key,
      label: definition.label,
      isSystem: definition.isSystem ?? false
    }))
  };
}

async function resolveInheritanceTargets(inherits, transaction) {
  if (!inherits || inherits.length === 0) {
    return [];
  }

  const roles = await RbacRole.findAll({ where: { key: inherits }, transaction });
  const map = new Map(roles.map((role) => [role.key, role.id]));
  return inherits.map((key) => ({ key, id: map.get(key) ?? null }));
}

export async function createRole(input, actorContext = {}) {
  const payload = sanitiseRolePayload(input);
  const existing = await RbacRole.findOne({ where: { key: payload.key } });
  if (existing) {
    const error = new Error(`Role ${payload.key} already exists`);
    error.statusCode = 409;
    throw error;
  }

  const transaction = await sequelize.transaction();
  try {
    const role = await RbacRole.create(
      {
        key: payload.key,
        name: payload.name,
        description: payload.description ?? '',
        isSystem: Boolean(input.isSystem),
        status: 'active',
        metadata: payload.metadata
      },
      { transaction }
    );

    const inherits = await resolveInheritanceTargets(payload.inherits, transaction);
    if (inherits.length > 0) {
      await RbacRoleInheritance.bulkCreate(
        inherits.map((entry) => ({
          roleId: role.id,
          parentRoleId: entry.id,
          parentRoleKey: entry.key
        })),
        { transaction }
      );
    }

    if (payload.permissions.length > 0) {
      await RbacRolePermission.bulkCreate(
        payload.permissions.map((permission) => ({ roleId: role.id, permission })),
        { transaction }
      );
    }

    await transaction.commit();
    await refreshRoleCache();

    await recordSecurityEvent({
      userId: actorContext.actorId ?? actorContext.userId ?? null,
      actorRole: actorContext.role ?? 'admin',
      actorPersona: actorContext.persona ?? null,
      resource: 'admin.rbac',
      action: 'admin.rbac:create-role',
      decision: 'allow',
      metadata: {
        roleKey: payload.key,
        inherits: payload.inherits,
        permissions: payload.permissions
      }
    });

    return getRoleDetail(payload.key);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function updateRole(key, input, actorContext = {}) {
  const payload = sanitiseRolePayload({ ...input, key }, { isUpdate: true });
  const role = await RbacRole.findOne({ where: { key } });
  if (!role) {
    const error = new Error(`Role ${key} not found`);
    error.statusCode = 404;
    throw error;
  }

  const transaction = await sequelize.transaction();
  try {
    role.name = payload.name;
    role.description = payload.description ?? '';
    role.metadata = payload.metadata;
    await role.save({ transaction });

    await RbacRoleInheritance.destroy({ where: { roleId: role.id }, transaction });
    const inherits = await resolveInheritanceTargets(payload.inherits, transaction);
    if (inherits.length > 0) {
      await RbacRoleInheritance.bulkCreate(
        inherits.map((entry) => ({
          roleId: role.id,
          parentRoleId: entry.id,
          parentRoleKey: entry.key
        })),
        { transaction }
      );
    }

    await RbacRolePermission.destroy({ where: { roleId: role.id }, transaction });
    if (payload.permissions.length > 0) {
      await RbacRolePermission.bulkCreate(
        payload.permissions.map((permission) => ({ roleId: role.id, permission })),
        { transaction }
      );
    }

    await transaction.commit();
    await refreshRoleCache();

    await recordSecurityEvent({
      userId: actorContext.actorId ?? actorContext.userId ?? null,
      actorRole: actorContext.role ?? 'admin',
      actorPersona: actorContext.persona ?? null,
      resource: 'admin.rbac',
      action: 'admin.rbac:update-role',
      decision: 'allow',
      metadata: {
        roleKey: key,
        inherits: payload.inherits,
        permissions: payload.permissions
      }
    });

    return getRoleDetail(key);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function archiveRole(key, actorContext = {}) {
  const role = await RbacRole.findOne({ where: { key } });
  if (!role) {
    const error = new Error(`Role ${key} not found`);
    error.statusCode = 404;
    throw error;
  }

  if (role.isSystem) {
    const error = new Error('System roles cannot be archived.');
    error.statusCode = 400;
    throw error;
  }

  role.status = 'archived';
  role.archivedAt = new Date();
  await role.save();
  await refreshRoleCache();

  await recordSecurityEvent({
    userId: actorContext.actorId ?? actorContext.userId ?? null,
    actorRole: actorContext.role ?? 'admin',
    actorPersona: actorContext.persona ?? null,
    resource: 'admin.rbac',
    action: 'admin.rbac:archive-role',
    decision: 'allow',
    metadata: { roleKey: key }
  });

  return serializeRole(role, { includeDefinition: false });
}

async function findUserByIdentifier({ userId, email }) {
  if (userId) {
    const user = await User.findByPk(userId);
    if (user) {
      return user;
    }
  }

  if (email) {
    const normalised = normaliseEmail(email);
    const hash = stableHash(normalised, 'user:email-query');
    const user = await User.findOne({ where: { emailHash: hash } });
    if (user) {
      return user;
    }
  }

  return null;
}

function sanitiseAssignmentInput(input = {}) {
  const payload = {};
  const errors = [];

  if (input.tenantId != null) {
    if (typeof input.tenantId !== 'string') {
      errors.push('tenantId must be a string when provided.');
    } else {
      payload.tenantId = input.tenantId.trim();
    }
  }

  if (input.note != null) {
    if (typeof input.note !== 'string') {
      errors.push('note must be a string when provided.');
    } else {
      payload.note = input.note.trim().slice(0, 2000);
    }
  }

  if (input.expiresAt) {
    const expires = new Date(input.expiresAt);
    if (Number.isNaN(expires.getTime())) {
      errors.push('expiresAt must be a valid date string.');
    } else {
      payload.expiresAt = expires;
    }
  }

  if (!input.userId && !input.email) {
    errors.push('Either userId or email must be provided to assign a role.');
  }

  if (errors.length > 0) {
    const error = new Error(errors.join(' '));
    error.name = 'ValidationError';
    error.details = errors;
    throw error;
  }

  payload.userId = input.userId ?? null;
  payload.email = input.email ?? null;

  return payload;
}

export async function assignRole(key, input, actorContext = {}) {
  const role = await RbacRole.findOne({ where: { key, status: 'active' } });
  if (!role) {
    const error = new Error(`Role ${key} not found`);
    error.statusCode = 404;
    throw error;
  }

  const payload = sanitiseAssignmentInput(input);
  const user = await findUserByIdentifier(payload);
  if (!user) {
    const error = new Error('User not found for assignment.');
    error.statusCode = 404;
    throw error;
  }

  const existing = await RbacRoleAssignment.findOne({
    where: { roleId: role.id, userId: user.id, revokedAt: null }
  });
  if (existing) {
    const error = new Error('User already holds this role.');
    error.statusCode = 409;
    throw error;
  }

  await RbacRoleAssignment.create({
    roleId: role.id,
    userId: user.id,
    tenantId: payload.tenantId ?? null,
    note: payload.note ?? null,
    expiresAt: payload.expiresAt ?? null,
    assignedBy: actorContext.actorId ?? actorContext.userId ?? null
  });

  await recordSecurityEvent({
    userId: actorContext.actorId ?? actorContext.userId ?? null,
    actorRole: actorContext.role ?? 'admin',
    actorPersona: actorContext.persona ?? null,
    resource: 'admin.rbac',
    action: 'admin.rbac:assign-role',
    decision: 'allow',
    metadata: { roleKey: key, targetUserId: user.id, tenantId: payload.tenantId ?? null }
  });

  return getRoleDetail(key);
}

export async function revokeAssignment(key, assignmentId, actorContext = {}) {
  const role = await RbacRole.findOne({ where: { key } });
  if (!role) {
    const error = new Error(`Role ${key} not found`);
    error.statusCode = 404;
    throw error;
  }

  const assignment = await RbacRoleAssignment.findOne({
    where: { id: assignmentId, roleId: role.id }
  });

  if (!assignment) {
    const error = new Error('Assignment not found.');
    error.statusCode = 404;
    throw error;
  }

  if (!assignment.revokedAt) {
    assignment.revokedAt = new Date();
    await assignment.save();
  }

  await recordSecurityEvent({
    userId: actorContext.actorId ?? actorContext.userId ?? null,
    actorRole: actorContext.role ?? 'admin',
    actorPersona: actorContext.persona ?? null,
    resource: 'admin.rbac',
    action: 'admin.rbac:revoke-assignment',
    decision: 'allow',
    metadata: { roleKey: key, assignmentId }
  });

  return getRoleDetail(key);
}

export default {
  listRoles,
  getRoleDetail,
  createRole,
  updateRole,
  archiveRole,
  assignRole,
  revokeAssignment,
  listCachedRoleDefinitions,
  getCachedRoleDefinition,
  refreshRoleCache,
  subscribeToRoleCache
};

