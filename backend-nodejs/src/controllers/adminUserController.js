import { body, param, query, validationResult } from 'express-validator';
import {
  createAdminUser,
  listAdminUsers,
  resetUserMfa,
  revokeUserSessions,
  updateAdminUser,
  updateAdminUserProfile
} from '../services/adminUserService.js';
import { ADMIN_USER_STATUSES } from '../models/adminUserProfile.js';
import { recordSecurityEvent } from '../services/auditTrailService.js';

function validateLabels(value) {
  if (value === undefined) {
    return true;
  }
  if (Array.isArray(value)) {
    return value.every((entry) => typeof entry === 'string');
  }
  if (typeof value === 'string') {
    return true;
  }
  throw new Error('Labels must be provided as an array of strings or a comma separated string.');
}

function handleValidation(req) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const [{ msg }] = errors.array();
    const error = new Error(msg || 'Invalid request');
    error.status = 400;
    throw error;
  }
}

function resolveActorContext(req) {
  const actor = req.auth?.actor ?? {};
  return {
    userId: req.user?.id ?? null,
    actorRole: actor.role ?? req.user?.type ?? 'guest',
    actorPersona: actor.persona ?? req.user?.persona ?? null,
    ipAddress: req.ip ?? null,
    userAgent: req.headers['user-agent'] ?? null
  };
}

async function recordAdminUserAudit(req, action, decision, metadata = {}, reason) {
  try {
    const actor = resolveActorContext(req);
    await recordSecurityEvent({
      userId: actor.userId,
      actorRole: actor.actorRole,
      actorPersona: actor.actorPersona,
      resource: 'admin:user-management',
      action,
      decision,
      reason,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
      metadata
    });
  } catch (auditError) {
    console.warn('[adminUserController] Failed to record admin user audit', {
      action,
      decision,
      message: auditError.message
    });
  }
}

export const listAdminUsersValidators = [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('search').optional().isString().trim(),
  query('role').optional().isString().trim(),
  query('status').optional().isIn(ADMIN_USER_STATUSES)
];

export async function listAdminUsersHandler(req, res, next) {
  try {
    handleValidation(req);
    const { page, pageSize, search, role, status } = req.query;
    const payload = await listAdminUsers({ page, pageSize, search, role, status });
    res.json(payload);
  } catch (error) {
    next(error);
  }
}

export const createAdminUserValidators = [
  body('firstName').isString().trim().notEmpty().withMessage('First name is required'),
  body('lastName').isString().trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('A valid email is required'),
  body('role').optional().isString().trim(),
  body('status').optional().isIn(ADMIN_USER_STATUSES),
  body('temporaryPassword').optional().isString().isLength({ min: 10 }),
  body('labels').optional().custom(validateLabels),
  body('jobTitle').optional().isString().trim(),
  body('department').optional().isString().trim(),
  body('avatarUrl').optional().isString().trim(),
  body('notes').optional().isString().trim()
];

export async function createAdminUserHandler(req, res, next) {
  try {
    handleValidation(req);
    const created = await createAdminUser(req.body);
    const { provisionedPassword, ...user } = created;
    await recordAdminUserAudit(req, 'admin.users.create', 'allow', {
      targetUserId: user.id,
      role: user.role,
      status: user.status
    });
    res.status(201).json({ user, provisionedPassword });
  } catch (error) {
    await recordAdminUserAudit(
      req,
      'admin.users.create',
      'deny',
      {
        attemptedEmail: req.body?.email ?? null,
        attemptedRole: req.body?.role ?? null
      },
      error.message
    );
    next(error);
  }
}

export const updateAdminUserValidators = [
  param('id').isUUID().withMessage('User id must be a valid UUID'),
  body('firstName').optional().isString().trim().notEmpty(),
  body('lastName').optional().isString().trim().notEmpty(),
  body('email').optional().isEmail().withMessage('Email must be valid'),
  body('role').optional().isString().trim(),
  body('type').optional().isString().trim(),
  body('twoFactorEmail').optional().isBoolean(),
  body('twoFactorApp').optional().isBoolean()
];

export async function updateAdminUserHandler(req, res, next) {
  try {
    handleValidation(req);
    const payload = { ...req.body };
    if (payload.role && !payload.type) {
      payload.type = payload.role;
      delete payload.role;
    }
    const user = await updateAdminUser(req.params.id, payload);
    await recordAdminUserAudit(req, 'admin.users.update', 'allow', {
      targetUserId: req.params.id,
      fields: Object.keys(payload)
    });
    res.json({ user });
  } catch (error) {
    await recordAdminUserAudit(
      req,
      'admin.users.update',
      'deny',
      { targetUserId: req.params.id, fields: Object.keys(req.body ?? {}) },
      error.message
    );
    next(error);
  }
}

export const updateAdminUserProfileValidators = [
  param('id').isUUID().withMessage('User id must be a valid UUID'),
  body('status').optional().isIn(ADMIN_USER_STATUSES),
  body('labels').optional().custom(validateLabels),
  body('jobTitle').optional().isString().trim(),
  body('department').optional().isString().trim(),
  body('avatarUrl').optional().isString().trim(),
  body('notes').optional().isString().trim()
];

export async function updateAdminUserProfileHandler(req, res, next) {
  try {
    handleValidation(req);
    const user = await updateAdminUserProfile(req.params.id, req.body);
    await recordAdminUserAudit(req, 'admin.users.profile.update', 'allow', {
      targetUserId: req.params.id,
      fields: Object.keys(req.body ?? {})
    });
    res.json({ user });
  } catch (error) {
    await recordAdminUserAudit(
      req,
      'admin.users.profile.update',
      'deny',
      { targetUserId: req.params.id, fields: Object.keys(req.body ?? {}) },
      error.message
    );
    next(error);
  }
}

export const resetAdminUserMfaValidators = [param('id').isUUID().withMessage('User id must be a valid UUID')];

export async function resetAdminUserMfaHandler(req, res, next) {
  try {
    handleValidation(req);
    const updated = await resetUserMfa(req.params.id);
    await recordAdminUserAudit(req, 'admin.users.reset-mfa', 'allow', {
      targetUserId: req.params.id
    });
    res.json({ updated: Boolean(updated) });
  } catch (error) {
    await recordAdminUserAudit(
      req,
      'admin.users.reset-mfa',
      'deny',
      { targetUserId: req.params.id },
      error.message
    );
    next(error);
  }
}

export const revokeAdminUserSessionsValidators = [param('id').isUUID().withMessage('User id must be a valid UUID')];

export async function revokeAdminUserSessionsHandler(req, res, next) {
  try {
    handleValidation(req);
    const revoked = await revokeUserSessions(req.params.id);
    await recordAdminUserAudit(req, 'admin.users.revoke-sessions', 'allow', {
      targetUserId: req.params.id,
      revoked
    });
    res.json({ revoked });
  } catch (error) {
    await recordAdminUserAudit(
      req,
      'admin.users.revoke-sessions',
      'deny',
      { targetUserId: req.params.id },
      error.message
    );
    next(error);
  }
}
