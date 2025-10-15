import { User, UserSession } from '../models/index.js';
import { evaluateAccess, Permissions, resolveActorContext } from '../services/accessControlService.js';
import { recordSecurityEvent } from '../services/auditTrailService.js';
import {
  extractTokens,
  verifyAccessToken,
  clearSessionCookies
} from '../services/sessionService.js';

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
      return res.status(401).json({ message: 'Authentication required' });
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

    const session = payload.sid ? await UserSession.findByPk(payload.sid) : null;
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
      sessionId: session.id,
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
      metadata: { sessionId: session.id }
    });

    next();
  } catch (error) {
    console.warn('Authentication middleware failure', { message: error.message });
    next(error);
  }
}

export function authorize(requirements = []) {
  const expected = Array.isArray(requirements) ? requirements : [requirements];
  return async (req, res, next) => {
    try {
      const decision = evaluateAccess({
        user: req.user ? { id: req.user.id, type: req.user.type } : null,
        headers: req.headers,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        requirements: expected
      });

      await recordSecurityEvent({
        userId: decision.actorId,
        actorRole: decision.role,
        actorPersona: decision.persona,
        resource: req.baseUrl ? `${req.baseUrl}${req.route?.path ?? ''}` : req.originalUrl ?? 'unknown',
        action: `${req.method} ${req.route?.path ?? req.originalUrl ?? 'unknown'}`,
        decision: decision.allowed ? 'allow' : 'deny',
        reason: decision.allowed ? null : `missing_permissions`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        metadata: { granted: decision.granted, missing: decision.missing, requirements: expected }
      });

      if (!decision.allowed) {
        const status = req.user ? 403 : 401;
        return res.status(status).json({ message: 'Forbidden' });
      }

      req.auth = {
        ...(req.auth ?? {}),
        actor: decision,
        grantedPermissions: decision.granted
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}

export function requireStorefrontRole(req, res, next) {
  const personaHeader = `${req.headers['x-fixnado-persona'] ?? ''}`.toLowerCase();
  if (personaHeader && !['provider', 'admin', 'operations'].includes(personaHeader)) {
    return res.status(403).json({ message: 'Persona not authorised for storefront operations' });
  }

  return authorize([Permissions.PANEL_STOREFRONT])(req, res, next);
}
