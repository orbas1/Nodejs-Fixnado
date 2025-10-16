import { User, UserSession } from '../models/index.js';
import { resolveActorContext } from '../services/accessControlService.js';
import { recordSecurityEvent } from '../services/auditTrailService.js';
import {
  extractTokens,
  verifyAccessToken,
  clearSessionCookies
} from '../services/sessionService.js';
import { enforcePolicy } from './policyMiddleware.js';

export async function authenticate(req, res, next) {
  try {
    const { bearerToken, accessToken, refreshToken } = extractTokens(req);
    const token = bearerToken || accessToken;
    if (!token) {
      await recordSecurityEvent({
        userId: null,
        actorRole: 'guest',
        actorPersona: null,
        resource: 'auth:authenticate',
        action: req.originalUrl ?? 'unknown',
        decision: 'deny',
        reason: 'missing_token',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { path: req.originalUrl }
      });
      return res.status(401).json({ message: 'Missing authorization header' });
    }

    const payload = verifyAccessToken(token);
    if (!payload) {
      await recordSecurityEvent({
        userId: null,
        actorRole: 'guest',
        actorPersona: null,
        resource: 'auth:authenticate',
        action: req.originalUrl ?? 'unknown',
        decision: 'deny',
        reason: 'invalid_token',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { tokenSource: bearerToken ? 'authorization' : 'cookie' }
      });
      return res.status(401).json({ message: 'Invalid token' });
    }

    const user = await User.findByPk(payload.sub);
    if (!user) {
      await recordSecurityEvent({
        userId: payload.sub,
        actorRole: payload.role ?? 'guest',
        actorPersona: payload.persona ?? null,
        resource: 'auth:authenticate',
        action: req.originalUrl ?? 'unknown',
        decision: 'deny',
        reason: 'user_not_found',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
      clearSessionCookies(res);
      return res.status(401).json({ message: 'Session is no longer valid' });
    }

    let session = null;
    if (payload.sid) {
      session = await UserSession.findByPk(payload.sid);
      if (!session || !session.isActive()) {
        await recordSecurityEvent({
          userId: user.id,
          actorRole: payload.role ?? user.type,
          actorPersona: payload.persona ?? null,
          resource: 'auth:authenticate',
          action: req.originalUrl ?? 'unknown',
          decision: 'deny',
          reason: 'session_expired',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
          metadata: { sessionId: payload.sid ?? null }
        });
        clearSessionCookies(res);
        return res.status(401).json({ message: 'Session expired' });
      }
    }

    req.user = {
      id: user.id,
      type: user.type,
      role: payload.role ?? user.type,
      persona: payload.persona ?? null
    };

    const actorContext = resolveActorContext({
      user,
      headers: req.headers,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    req.auth = {
      ...(req.auth ?? {}),
      sessionId: session?.id ?? null,
      refreshToken,
      tokenPayload: payload,
      actor: actorContext
    };

    await recordSecurityEvent({
      userId: user.id,
      actorRole: actorContext.role,
      actorPersona: actorContext.persona,
      resource: 'auth:authenticate',
      action: req.originalUrl ?? 'unknown',
      decision: 'allow',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      metadata: {
        sessionId: session?.id ?? null,
        tokenSource: bearerToken ? 'authorization' : 'cookie',
        sidPresent: Boolean(payload.sid)
      }
    });

    next();
  } catch (error) {
    console.warn('Authentication middleware failure', { message: error.message });
    next(error);
  }
}

export async function maybeAuthenticate(req, res, next) {
  try {
    const { bearerToken, accessToken } = extractTokens(req);
    if (!bearerToken && !accessToken) {
      return next();
    }
    return authenticate(req, res, next);
  } catch (error) {
    return next(error);
  }
}

export function authorize(requirements = [], options = {}) {
  if (typeof requirements === 'string' && !Array.isArray(requirements)) {
    return enforcePolicy(requirements, options);
  }

  const requirementList = Array.isArray(requirements) ? requirements : [requirements];
  const inlinePolicy = {
    id: options.policyId ?? `inline:${requirementList.join('|') || 'none'}`,
    resource: options.resource ?? options.policyId ?? 'inline',
    action: options.action ?? 'inline:access',
    description: options.description ?? 'Inline permission guard',
    requirements: requirementList,
    tags: options.tags ?? ['inline'],
    severity: options.severity ?? 'medium',
    metadata: options.metadata
  };

  const overrides = { ...options };
  delete overrides.requirements;

  return enforcePolicy(inlinePolicy, overrides);
}

export function requireStorefrontRole(req, res, next) {
  const personaHeader = `${req.headers['x-fixnado-persona'] ?? ''}`.toLowerCase();
  const roleHeader = `${req.headers['x-fixnado-role'] ?? ''}`.toLowerCase();
  const context = personaHeader || roleHeader;

  if (!context) {
    return res.status(401).json({ message: 'Storefront access restricted to providers' });
  }

  const canonicalContext = context === 'company' ? 'provider' : context;
  const allowedContexts = new Set(['provider', 'provider_admin', 'admin', 'operations']);
  if (!allowedContexts.has(canonicalContext)) {
    return res.status(403).json({ message: 'Persona not authorised for storefront operations' });
  }

  return enforcePolicy('panel.storefront.manage', {
    metadata: (request) => ({
      persona: request.headers['x-fixnado-persona'] || null,
      policy: 'panel.storefront.manage'
    })
  })(req, res, next);
}
