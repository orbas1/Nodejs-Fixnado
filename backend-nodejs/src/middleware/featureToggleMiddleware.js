import { createHash } from 'node:crypto';
import config from '../config/index.js';
import { recordSecurityEvent } from '../services/auditTrailService.js';
import { getFeatureToggle } from '../services/featureToggleService.js';

const ACTIVE_STATES = new Set(['enabled', 'pilot', 'staging']);
const FEATURE_HEADER = 'X-Fixnado-Feature-Gate';

function normaliseAllowStates(input) {
  if (!input) {
    return new Set(ACTIVE_STATES);
  }

  if (input instanceof Set) {
    return new Set(Array.from(input, (state) => String(state).toLowerCase()));
  }

  if (Array.isArray(input)) {
    return new Set(input.map((state) => String(state).toLowerCase()));
  }

  return new Set([String(input).toLowerCase()]);
}

function deriveCorrelationId(req) {
  return (
    req.headers['x-request-id'] ||
    req.headers['x-correlation-id'] ||
    req.headers['x-amzn-trace-id'] ||
    req.headers['x-cloud-trace-context'] ||
    null
  );
}

function deriveRequestIdentity(req) {
  if (req?.auth?.sessionId) {
    return `session:${req.auth.sessionId}`;
  }
  if (req?.user?.id) {
    return `user:${req.user.id}`;
  }
  const roleHeader = req?.headers?.['x-fixnado-role'];
  if (roleHeader) {
    return `role:${roleHeader}`;
  }
  const persona = req?.user?.persona || req?.auth?.actor?.persona;
  if (persona) {
    return `persona:${persona}`;
  }
  const anonymousId = req?.headers?.['x-anonymous-id'] || req?.headers?.['x-device-id'];
  if (anonymousId) {
    return `anon:${anonymousId}`;
  }
  if (req?.ip) {
    return `ip:${req.ip}`;
  }
  return 'anonymous';
}

function normaliseRollout(value) {
  const numeric = Number.parseFloat(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.min(Math.max(numeric, 0), 1);
}

function computeCohort(identity, toggleKey) {
  const digest = createHash('sha256').update(`${toggleKey}:${identity}`).digest();
  const bucket = digest.readUInt32BE(0) / 0xffffffff;
  return bucket;
}

function evaluateToggle({ toggleKey, toggle, req, allowStates, allowWhenMissing }) {
  if (!toggle) {
    return {
      allowed: allowWhenMissing,
      state: 'missing',
      rollout: 0,
      reason: 'missing_toggle',
      identity: deriveRequestIdentity(req)
    };
  }

  const state = typeof toggle.state === 'string' ? toggle.state.toLowerCase() : 'disabled';
  const rollout = normaliseRollout(toggle.rollout);

  if (!allowStates.has(state)) {
    return {
      allowed: false,
      state,
      rollout,
      reason: `state_${state}`,
      identity: deriveRequestIdentity(req)
    };
  }

  if (state === 'enabled' || rollout >= 1) {
    return {
      allowed: true,
      state,
      rollout,
      reason: 'state_enabled',
      identity: deriveRequestIdentity(req)
    };
  }

  const identity = deriveRequestIdentity(req);
  const cohort = computeCohort(identity, toggleKey);

  if (cohort < rollout) {
    return {
      allowed: true,
      state,
      rollout,
      reason: 'cohort_allowed',
      identity,
      cohort
    };
  }

  return {
    allowed: false,
    state,
    rollout,
    reason: 'cohort_denied',
    identity,
    cohort
  };
}

export async function isFeatureToggleEnabled(toggleKey, { req = {}, allowStates, allowWhenMissing } = {}) {
  const allowStatesSet = normaliseAllowStates(allowStates);
  const resolvedAllowWhenMissing = allowWhenMissing ?? config.env !== 'production';
  const toggle = await getFeatureToggle(toggleKey);
  const evaluation = evaluateToggle({
    toggleKey,
    toggle,
    req,
    allowStates: allowStatesSet,
    allowWhenMissing: resolvedAllowWhenMissing
  });

  return {
    ...evaluation,
    toggle,
    allowStates: allowStatesSet,
    allowWhenMissing: resolvedAllowWhenMissing
  };
}

export function requireFeatureToggle(toggleKey, options = {}) {
  const allowStatesSet = normaliseAllowStates(options.allowStates);
  const allowWhenMissing = options.allowWhenMissing ?? config.env !== 'production';
  const fallbackStatus = options.fallbackStatus ?? 404;
  const denialMessage = options.message ?? 'This capability is not yet available for your account.';
  const denialRemediation =
    options.remediation ??
    `Request access from Fixnado operations and reference feature toggle "${toggleKey}".`;
  const auditResource = options.auditResource ?? `feature:${toggleKey}`;
  const failOpenOnError = options.failOpenOnError ?? config.env !== 'production';

  return async function featureToggleMiddleware(req, res, next) {
    let evaluation;
    try {
      evaluation = await isFeatureToggleEnabled(toggleKey, {
        req,
        allowStates: allowStatesSet,
        allowWhenMissing
      });
    } catch (error) {
      console.error('[featureToggle] Failed to resolve toggle', { toggleKey, message: error.message });
      res.set(FEATURE_HEADER, `${toggleKey};state=error`);
      if (failOpenOnError) {
        return next();
      }
      const correlationId = deriveCorrelationId(req);
      return res.status(503).json({
        error: {
          code: 'feature.toggle.unavailable',
          message: 'Feature availability could not be determined at this time.',
          remediation: 'Retry later or contact Fixnado support with the toggle key.',
          correlationId,
          toggle: { key: toggleKey }
        }
      });
    }

    const toggleState = evaluation.toggle?.state ?? evaluation.state;
    const toggleRollout = evaluation.toggle?.rollout ?? evaluation.rollout;
    res.set(FEATURE_HEADER, `${toggleKey};state=${toggleState};rollout=${toggleRollout}`);

    if (evaluation.allowed) {
      return next();
    }

    const correlationId = deriveCorrelationId(req);
    await recordSecurityEvent({
      userId: req.user?.id ?? null,
      actorRole: req.user?.role ?? req.user?.type ?? req.auth?.actor?.role ?? 'guest',
      actorPersona: req.user?.persona ?? req.auth?.actor?.persona ?? null,
      resource: auditResource,
      action: req.method ?? 'unknown',
      decision: 'deny',
      reason: `feature_toggle_${evaluation.reason}`,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      correlationId,
      metadata: {
        path: req.originalUrl ?? req.baseUrl ?? null,
        toggleKey,
        state: toggleState,
        rollout: toggleRollout,
        allowStates: Array.from(allowStatesSet),
        identity: evaluation.identity,
        cohort: evaluation.cohort ?? null
      }
    });

    if (typeof options.onDeny === 'function') {
      try {
        await options.onDeny({ req, res, evaluation });
      } catch (error) {
        console.error('[featureToggle] onDeny handler failed', {
          toggleKey,
          message: error.message
        });
      }
    }

    return res.status(fallbackStatus).json({
      error: {
        code: 'feature.toggle.inactive',
        message: denialMessage,
        remediation: denialRemediation,
        correlationId,
        toggle: {
          key: toggleKey,
          state: toggleState,
          rollout: toggleRollout,
          reason: evaluation.reason
        }
      }
    });
  };
}

export default {
  requireFeatureToggle,
  isFeatureToggleEnabled
};
