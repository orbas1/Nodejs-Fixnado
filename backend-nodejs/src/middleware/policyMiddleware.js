import { evaluateAccess } from '../services/accessControlService.js';
import { recordSecurityEvent } from '../services/auditTrailService.js';
import { getRoutePolicy } from '../policies/routePolicies.js';

const MAX_STRING_LENGTH = 256;
const MAX_ARRAY_LENGTH = 12;

function coercePolicy(policyOrId, overrides = {}) {
  let basePolicy = null;

  if (typeof policyOrId === 'string') {
    basePolicy = getRoutePolicy(policyOrId);
    if (!basePolicy) {
      throw new Error(`Unknown policy definition: ${policyOrId}`);
    }
  } else if (policyOrId && typeof policyOrId === 'object') {
    basePolicy = { ...policyOrId };
    basePolicy.id = basePolicy.id || `inline:${Date.now()}`;
  } else {
    throw new Error('Policy definition is required for enforcement');
  }

  const merged = {
    ...basePolicy,
    ...overrides,
    metadata: overrides.metadata ?? basePolicy.metadata,
    requirements: overrides.requirements ?? basePolicy.requirements
  };

  if (!Array.isArray(merged.requirements) && typeof merged.requirements !== 'function') {
    merged.requirements = [];
  }

  return merged;
}

function sanitisePrimitive(value) {
  if (value == null) {
    return null;
  }

  if (typeof value === 'string') {
    return value.length > MAX_STRING_LENGTH ? `${value.slice(0, MAX_STRING_LENGTH)}…` : value;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value).slice(0, MAX_STRING_LENGTH);
}

function sanitiseMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') {
    return {};
  }

  const entries = Object.entries(metadata).slice(0, MAX_ARRAY_LENGTH);
  const sanitised = {};

  entries.forEach(([key, value]) => {
    if (value == null) {
      return;
    }

    if (Array.isArray(value)) {
      sanitised[key] = value.slice(0, MAX_ARRAY_LENGTH).map((item) => {
        if (item && typeof item === 'object') {
          return '[object]';
        }
        return sanitisePrimitive(item);
      });
      return;
    }

    if (value && typeof value === 'object') {
      sanitised[key] = '[object]';
      return;
    }

    sanitised[key] = sanitisePrimitive(value);
  });

  return sanitised;
}

function resolveRequirements(policy, req) {
  if (typeof policy.requirements === 'function') {
    try {
      const computed = policy.requirements(req);
      return Array.isArray(computed) ? computed : [];
    } catch (error) {
      console.error('[policy] Failed to resolve dynamic requirements', {
        policyId: policy.id,
        message: error.message
      });
      return [];
    }
  }

  return Array.isArray(policy.requirements) ? policy.requirements : [];
}

function resolveMetadata(policy, req, decision) {
  try {
    const dynamicMetadata =
      typeof policy.metadata === 'function' ? policy.metadata(req, decision) : policy.metadata;

    return sanitiseMetadata({
      ...dynamicMetadata,
      policyId: policy.id,
      policyVersion: policy.version ?? '1.0',
      decision: decision.allowed ? 'allow' : 'deny',
      granted: decision.granted,
      missing: decision.missing,
      tags: policy.tags ?? [],
      severity: policy.severity ?? 'medium'
    });
  } catch (error) {
    console.error('[policy] Failed to produce policy metadata', {
      policyId: policy.id,
      message: error.message
    });

    return sanitiseMetadata({
      policyId: policy.id,
      policyVersion: policy.version ?? '1.0',
      decision: decision.allowed ? 'allow' : 'deny',
      granted: decision.granted,
      missing: decision.missing,
      tags: policy.tags ?? [],
      severity: policy.severity ?? 'medium'
    });
  }
}

export function enforcePolicy(policyOrId, overrides = {}) {
  const policy = coercePolicy(policyOrId, overrides);

  return async function policyMiddleware(req, res, next) {
    try {
      const requirements = resolveRequirements(policy, req);
      const decision = evaluateAccess({
        user: req.user ? { id: req.user.id, type: req.user.type } : null,
        headers: req.headers,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requirements
      });

      const metadata = resolveMetadata(policy, req, decision);
      const resource = policy.resource ? `policy:${policy.resource}` : 'policy:unknown';
      const action = policy.action ?? `${req.method.toLowerCase()}:${req.baseUrl ?? req.originalUrl ?? 'unknown'}`;
      const correlationId =
        req.headers['x-request-id'] || req.headers['x-correlation-id'] || req.headers['x-amzn-trace-id'] || null;

      await recordSecurityEvent({
        userId: decision.actorId,
        actorRole: decision.role,
        actorPersona: decision.persona,
        resource,
        action,
        decision: decision.allowed ? 'allow' : 'deny',
        reason: decision.allowed ? null : policy.denyReason ?? 'missing_permissions',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        correlationId,
        metadata
      });

      if (!decision.allowed) {
        const status = decision.actorId ? 403 : 401;
        const errorPayload =
          typeof policy.errorResponse === 'function'
            ? policy.errorResponse(req, decision)
            : policy.errorResponse ?? {
                message: policy.errorMessage ?? 'Forbidden',
                missingPermissions: decision.missing
              };

        return res.status(status).json(errorPayload);
      }

      req.auth = {
        ...(req.auth ?? {}),
        actor: req.auth?.actor ?? decision,
        grantedPermissions: Array.from(
          new Set([...(req.auth?.grantedPermissions ?? []), ...(decision.granted ?? [])])
        ),
        policies: [...(req.auth?.policies ?? []), { id: policy.id, granted: decision.granted }]
      };

      return next();
    } catch (error) {
      return next(error);
    }
  };
}

export default {
  enforcePolicy
};
