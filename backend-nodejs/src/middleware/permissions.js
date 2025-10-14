import { ensureAllPermissions, hasPermission } from '../security/rbac/permissionSet.js';
import { getSecurityContext } from '../security/securityContext.js';
import { auditAccessAttempt } from '../services/securityAuditService.js';

function normaliseRequired(required) {
  if (Array.isArray(required)) {
    return required.filter(Boolean);
  }
  if (typeof required === 'string' && required.trim()) {
    return [required.trim()];
  }
  throw new Error('Permission guard requires at least one permission.');
}

function describeAction(required, action) {
  if (action) {
    return action;
  }
  if (Array.isArray(required)) {
    return `permission:${required.join('|')}`;
  }
  return `permission:${required}`;
}

export function requirePermissions(required, options = {}) {
  const requiredList = normaliseRequired(required);
  const { mode = 'all', action, subjectType, subjectId } = options;

  return async function permissionMiddleware(req, res, next) {
    const context = getSecurityContext(req);
    const permissionSet = context.permissions;
    const granted =
      mode === 'any'
        ? hasPermission(permissionSet, requiredList)
        : ensureAllPermissions(permissionSet, requiredList);

    const auditPayload = {
      req,
      action: describeAction(requiredList, action),
      subjectType,
      subjectId,
      metadata: { required: requiredList }
    };

    if (!granted) {
      await auditAccessAttempt({ ...auditPayload, status: 'denied' });
      return res.status(403).json({
        message: 'You do not have permission to perform this action.',
        code: 'RBAC_DENIED',
        required: requiredList
      });
    }

    res.on('finish', () => {
      if (res.statusCode < 400) {
        auditAccessAttempt({ ...auditPayload, status: 'granted' }).catch(() => {});
      }
    });

    return next();
  };
}

export function requireAnyPermission(required, options = {}) {
  return requirePermissions(required, { ...options, mode: 'any' });
}
