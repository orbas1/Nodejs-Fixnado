import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { Op, fn, col, literal } from 'sequelize';
import sequelize from '../config/database.js';
import { AdminUserProfile, Region, User, UserSession } from '../models/index.js';
import { toCanonicalRole } from '../constants/permissions.js';
import { ADMIN_USER_STATUSES } from '../models/adminUserProfile.js';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const USER_ROLE_VALUES = Array.isArray(User.rawAttributes?.type?.values)
  ? User.rawAttributes.type.values
  : ['user'];
const ASSIGNABLE_ROLES = new Set(USER_ROLE_VALUES);

function resolveAssignableRole(role) {
  const candidate = normaliseRoleCandidate(role);
  if (!candidate) {
    return '';
  }

  const canonical = toCanonicalRole(candidate);
  if (canonical && ASSIGNABLE_ROLES.has(canonical)) {
    return canonical;
  }

  if (canonical) {
    const match = USER_ROLE_VALUES.find((value) => toCanonicalRole(value) === canonical);
    if (match) {
      return match;
    }
  }

  if (ASSIGNABLE_ROLES.has(candidate)) {
    return candidate;
  }

  return '';
}

function clampPageSize(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return Math.min(parsed, MAX_PAGE_SIZE);
  }
  return DEFAULT_PAGE_SIZE;
}

function normalisePage(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return 1;
}

function normaliseLabels(labels) {
  if (!Array.isArray(labels)) {
    if (typeof labels === 'string' && labels.trim()) {
      return labels
        .split(',')
        .map((label) => label.trim())
        .filter(Boolean)
        .slice(0, 10);
    }
    return [];
  }

  return labels
    .map((label) => (typeof label === 'string' ? label.trim() : ''))
    .filter(Boolean)
    .slice(0, 10);
}

function normaliseRoleCandidate(role) {
  if (typeof role !== 'string') {
    return '';
  }
  return role.trim().toLowerCase();
}

function assertRoleAssignable(role) {
  const assignable = resolveAssignableRole(role);
  if (!assignable) {
    throw new Error('Invalid role supplied');
  }
  return assignable;
}

function buildDisplayName(user) {
  return `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || user.email || 'User';
}

function buildSearchTerms(user, profile = {}) {
  const tokens = [
    user.firstName,
    user.lastName,
    user.email,
    profile.jobTitle,
    profile.department,
    ...(Array.isArray(profile.labels) ? profile.labels : [])
  ];
  return tokens
    .filter(Boolean)
    .map((token) => token.toString().toLowerCase())
    .join(' ');
}

async function ensureAdminProfiles() {
  const missingUsers = await User.findAll({
    attributes: ['id', 'firstName', 'lastName', 'email'],
    include: [
      {
        model: AdminUserProfile,
        as: 'adminUserProfile',
        attributes: ['id'],
        required: false
      }
    ],
    where: { '$adminUserProfile.id$': null },
    limit: 250
  });

  if (!missingUsers.length) {
    return;
  }

  await AdminUserProfile.bulkCreate(
    missingUsers.map((user) => ({
      userId: user.id,
      status: 'active',
      labels: [],
      jobTitle: null,
      department: null,
      avatarUrl: null,
      notes: null,
      displayName: buildDisplayName(user),
      searchTerms: buildSearchTerms(user)
    })),
    { ignoreDuplicates: true }
  );
}

async function loadSessionMetrics(userIds = []) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return new Map();
  }

  const rows = await UserSession.findAll({
    attributes: [
      'userId',
      [fn('MAX', col('last_used_at')), 'lastUsedAt'],
      [
        fn('SUM',
          literal('CASE WHEN "revoked_at" IS NULL AND "expires_at" > NOW() THEN 1 ELSE 0 END')
        ),
        'activeSessions'
      ]
    ],
    where: { userId: { [Op.in]: userIds } },
    group: ['user_id'],
    raw: true
  });

  return new Map(
    rows.map((row) => [
      row.userId,
      {
        lastUsedAt: row.lastUsedAt ? new Date(row.lastUsedAt).toISOString() : null,
        activeSessions: Number.parseInt(row.activeSessions, 10) || 0
      }
    ])
  );
}

function presentUser(user, sessionMetrics) {
  const profile = user.adminUserProfile;
  const sessions = sessionMetrics.get(user.id) ?? { lastUsedAt: null, activeSessions: 0 };
  const safeUser = user.toSafeJSON();

  return {
    ...safeUser,
    role: user.type,
    status: profile?.status ?? 'active',
    labels: profile?.labels ?? [],
    jobTitle: profile?.jobTitle ?? null,
    department: profile?.department ?? null,
    avatarUrl: profile?.avatarUrl ?? null,
    notes: profile?.notes ?? null,
    displayName: profile?.displayName ?? buildDisplayName(user),
    searchTerms: profile?.searchTerms ?? buildSearchTerms(user, profile ?? {}),
    lastActiveAt: sessions.lastUsedAt,
    activeSessions: sessions.activeSessions,
    region: user.region
      ? {
          id: user.region.id,
          name: user.region.name
        }
      : null,
    twoFactor: {
      email: Boolean(user.twoFactorEmail),
      app: Boolean(user.twoFactorApp)
    }
  };
}

export async function listAdminUsers({ search, status, role, page, pageSize } = {}) {
  await ensureAdminProfiles();

  const resolvedPageSize = clampPageSize(pageSize);
  const requestedPage = normalisePage(page);
  let resolvedPage = requestedPage;
  let offset = (resolvedPage - 1) * resolvedPageSize;

  const whereClause = {};
  if (role) {
    const resolvedRole = assertRoleAssignable(role);
    whereClause.type = resolvedRole;
  }

  const profileWhere = {};
  if (status) {
    profileWhere.status = status;
  }

  const includeProfile = {
    model: AdminUserProfile,
    as: 'adminUserProfile',
    required: Boolean(status),
    where: Object.keys(profileWhere).length ? profileWhere : undefined
  };

  const searchValue = typeof search === 'string' ? search.trim().toLowerCase() : '';
  if (searchValue) {
    const wildcard = `%${searchValue}%`;
    whereClause[Op.or] = [
      sequelize.where(fn('LOWER', col('User.email')), { [Op.like]: wildcard }),
      sequelize.where(fn('LOWER', col('User.first_name')), { [Op.like]: wildcard }),
      sequelize.where(fn('LOWER', col('User.last_name')), { [Op.like]: wildcard }),
      sequelize.where(fn('LOWER', col('adminUserProfile.display_name')), { [Op.like]: wildcard }),
      sequelize.where(fn('LOWER', col('adminUserProfile.search_terms')), { [Op.like]: wildcard }),
      sequelize.where(fn('LOWER', col('adminUserProfile.job_title')), { [Op.like]: wildcard }),
      sequelize.where(fn('LOWER', col('adminUserProfile.department')), { [Op.like]: wildcard }),
      sequelize.where(
        fn(
          'LOWER',
          fn('COALESCE', fn('array_to_string', col('adminUserProfile.labels'), ' '), '')
        ),
        { [Op.like]: wildcard }
      )
    ];
    includeProfile.required = false;
  }

  const baseQuery = {
    where: whereClause,
    include: [includeProfile, { model: Region, as: 'region', attributes: ['id', 'name'] }],
    limit: resolvedPageSize,
    offset,
    distinct: true,
    order: [['createdAt', 'DESC']]
  };

  let { rows, count } = await User.findAndCountAll(baseQuery);

  const totalPages = Math.max(Math.ceil(count / resolvedPageSize), 1);
  if (resolvedPage > totalPages) {
    resolvedPage = totalPages;
    offset = (resolvedPage - 1) * resolvedPageSize;
    const adjustedQuery = { ...baseQuery, offset };
    rows = await User.findAll(adjustedQuery);
  }

  if (!status && !searchValue) {
    const missingProfiles = rows.filter((user) => !user.adminUserProfile);
    if (missingProfiles.length) {
      await AdminUserProfile.bulkCreate(
        missingProfiles.map((user) => ({
          userId: user.id,
          status: 'active',
          labels: [],
          jobTitle: null,
          department: null,
          avatarUrl: null,
          notes: null,
          displayName: buildDisplayName(user),
          searchTerms: buildSearchTerms(user)
        })),
        { ignoreDuplicates: true }
      );

      await Promise.all(
        missingProfiles.map((user) => user.reload({ include: [{ model: AdminUserProfile, as: 'adminUserProfile' }] }))
      );
    }
  }

  const userIds = rows.map((user) => user.id);
  const sessionMetrics = await loadSessionMetrics(userIds);

  const items = rows.map((user) => presentUser(user, sessionMetrics));

  const [statusSummaryRows, mfaEnabled, totalUsers, activeSessionCount] = await Promise.all([
    AdminUserProfile.findAll({
      attributes: ['status', [fn('COUNT', col('status')), 'count']],
      group: ['status'],
      raw: true
    }),
    User.count({
      where: {
        [Op.or]: [{ twoFactorApp: true }, { twoFactorEmail: true }]
      }
    }),
    User.count(),
    UserSession.count({
      where: {
        revokedAt: null,
        expiresAt: { [Op.gt]: new Date() }
      }
    })
  ]);

  const statusSummary = ADMIN_USER_STATUSES.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});
  statusSummaryRows.forEach((row) => {
    statusSummary[row.status] = Number.parseInt(row.count, 10) || 0;
  });

  return {
    items,
    pagination: {
      page: resolvedPage,
      pageSize: resolvedPageSize,
      total: count,
      totalPages,
      requestedPage
    },
    summary: {
      total: totalUsers,
      statuses: statusSummary,
      twoFactorEnabled: mfaEnabled,
      activeSessions: activeSessionCount,
      generatedAt: new Date().toISOString()
    }
  };
}

export async function createAdminUser({
  firstName,
  lastName,
  email,
  role = 'user',
  status = 'invited',
  temporaryPassword = null,
  labels,
  jobTitle,
  department,
  avatarUrl,
  notes
}) {
  const trimmedEmail = typeof email === 'string' ? email.trim() : '';
  if (!trimmedEmail) {
    throw new Error('Email is required');
  }

  const existing = await User.findOne({ where: { email: trimmedEmail } });
  if (existing) {
    throw new Error('An account with this email already exists');
  }

  if (!ADMIN_USER_STATUSES.includes(status)) {
    throw new Error('Invalid status supplied');
  }

  const preparedLabels = normaliseLabels(labels);
  const resolvedRole = assertRoleAssignable(role);
  const password = temporaryPassword && temporaryPassword.length >= 10
    ? temporaryPassword
    : crypto.randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);

  const transaction = await sequelize.transaction();
  try {
    const user = await User.create(
      {
        firstName,
        lastName,
        email: trimmedEmail,
        passwordHash,
        type: resolvedRole,
        twoFactorApp: false,
        twoFactorEmail: false
      },
      { transaction }
    );

    const profilePayload = {
      userId: user.id,
      status,
      labels: preparedLabels,
      jobTitle: jobTitle || null,
      department: department || null,
      avatarUrl: avatarUrl || null,
      notes: notes || null,
      displayName: buildDisplayName(user),
      searchTerms: buildSearchTerms(user, {
        jobTitle,
        department,
        labels: preparedLabels
      })
    };

    await AdminUserProfile.create(profilePayload, { transaction });
    await transaction.commit();

    const reloaded = await User.findByPk(user.id, {
      include: [
        { model: AdminUserProfile, as: 'adminUserProfile' },
        { model: Region, as: 'region', attributes: ['id', 'name'] }
      ]
    });

    const presented = presentUser(reloaded, new Map());
    return { ...presented, provisionedPassword: password };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function updateAdminUser(userId, updates = {}) {
  const user = await User.findByPk(userId, {
    include: [{ model: AdminUserProfile, as: 'adminUserProfile' }, { model: Region, as: 'region', attributes: ['id', 'name'] }]
  });

  if (!user) {
    throw new Error('User not found');
  }

  const transaction = await sequelize.transaction();
  try {
    const fields = ['firstName', 'lastName', 'email', 'type', 'twoFactorEmail', 'twoFactorApp'];
    if (Object.hasOwn(updates, 'type') && updates.type) {
      updates.type = assertRoleAssignable(updates.type);
    }
    fields.forEach((field) => {
      if (Object.hasOwn(updates, field) && updates[field] !== undefined) {
        user[field] = updates[field];
      }
    });

    await user.save({ transaction });

    const profile = await AdminUserProfile.findOne({ where: { userId: user.id }, transaction });
    if (profile) {
      profile.displayName = buildDisplayName(user);
      profile.searchTerms = buildSearchTerms(user, profile);
      await profile.save({ transaction });
    }

    await transaction.commit();

    await user.reload({
      include: [{ model: AdminUserProfile, as: 'adminUserProfile' }, { model: Region, as: 'region', attributes: ['id', 'name'] }]
    });

    return presentUser(user, await loadSessionMetrics([user.id]));
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function updateAdminUserProfile(userId, updates = {}) {
  const profile = await AdminUserProfile.findOne({ where: { userId } });
  if (!profile) {
    throw new Error('User profile not found');
  }

  if (updates.status && !ADMIN_USER_STATUSES.includes(updates.status)) {
    throw new Error('Invalid status supplied');
  }

  const transaction = await sequelize.transaction();
  try {
    if (Object.hasOwn(updates, 'status') && updates.status) {
      profile.status = updates.status;
    }
    if (Object.hasOwn(updates, 'jobTitle')) {
      profile.jobTitle = updates.jobTitle || null;
    }
    if (Object.hasOwn(updates, 'department')) {
      profile.department = updates.department || null;
    }
    if (Object.hasOwn(updates, 'avatarUrl')) {
      profile.avatarUrl = updates.avatarUrl || null;
    }
    if (Object.hasOwn(updates, 'notes')) {
      profile.notes = updates.notes || null;
    }
    if (Object.hasOwn(updates, 'labels')) {
      profile.labels = normaliseLabels(updates.labels);
    }

    const user = await User.findByPk(userId, { transaction });
    profile.displayName = buildDisplayName(user ?? {});
    profile.searchTerms = buildSearchTerms(user ?? {}, profile);

    await profile.save({ transaction });
    await transaction.commit();

    const refreshed = await User.findByPk(userId, {
      include: [{ model: AdminUserProfile, as: 'adminUserProfile' }, { model: Region, as: 'region', attributes: ['id', 'name'] }]
    });

    return presentUser(refreshed, await loadSessionMetrics([userId]));
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function resetUserMfa(userId) {
  const [updated] = await User.update(
    { twoFactorApp: false, twoFactorEmail: false },
    { where: { id: userId } }
  );
  return updated;
}

export async function revokeUserSessions(userId) {
  const [updated] = await UserSession.update(
    { revokedAt: new Date() },
    { where: { userId } }
  );
  return updated;
}
