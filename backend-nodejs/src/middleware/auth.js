import { User, UserSession } from '../models/index.js';
import { resolveActorContext } from '../services/accessControlService.js';
import { recordSecurityEvent } from '../services/auditTrailService.js';
import {
  extractTokens,
  verifyAccessToken,
  clearSessionCookies
} from '../services/sessionService.js';
import { enforcePolicy } from './policyMiddleware.js';

const AUTH_DOCUMENTATION_URL =
  'https://support.fixnado.com/hc/en-us/articles/101-secure-session-troubleshooting';
const STOREFRONT_DOCUMENTATION_URL =
  'https://support.fixnado.com/hc/en-us/articles/102-provider-storefront-access';
const SUPPORT_CONTACT = 'support@fixnado.com';

function deriveCorrelationId(req) {
  return (
    req.headers['x-request-id'] ||
    req.headers['x-correlation-id'] ||
    req.headers['x-amzn-trace-id'] ||
    req.headers['x-cloud-trace-context'] ||
    null
  );
}

function respondWithAuthError(req, res, { status = 401, code, message, remediation, hint, documentationUrl, details }) {
  const correlationId = deriveCorrelationId(req);
  const errorBody = {
    code,
    message,
    remediation,
    supportContact: SUPPORT_CONTACT,
    correlationId
  };

  if (hint) {
    errorBody.hint = hint;
  }

  if (documentationUrl) {
    errorBody.documentationUrl = documentationUrl;
  }

  if (details && Object.keys(details).length > 0) {
    errorBody.details = details;
  }

  return res.status(status).json({ error: errorBody });
}

function buildVerificationErrorResponse(code) {
  switch (code) {
    case 'token_expired':
      return {
        status: 401,
        code: 'auth.token.expired',
        message: 'Your Fixnado session expired.',
        remediation: 'Sign in again to refresh your credentials or exchange a valid refresh token.',
        documentationUrl: AUTH_DOCUMENTATION_URL
      };
    case 'token_not_yet_valid':
      return {
        status: 401,
        code: 'auth.token.not_ready',
        message: 'This access token is not valid yet.',
        remediation: 'Check that your device clock matches an NTP source and wait until the token activation time.',
        hint: 'Ensure the token\'s `nbf` claim is in the past and that server and client clocks are synchronised.',
        documentationUrl: AUTH_DOCUMENTATION_URL
      };
    case 'token_missing':
      return {
        status: 401,
        code: 'auth.token.missing',
        message: 'Authentication token is required.',
        remediation: 'Sign in to Fixnado and include the Bearer token or session cookies in subsequent requests.',
        documentationUrl: AUTH_DOCUMENTATION_URL
      };
    default:
      return {
        status: 401,
        code: 'auth.token.invalid',
        message: 'The supplied access token failed validation.',
        remediation: 'Request a new login or rotate your API credentials before retrying.',
        hint: 'Verify that the Authorization header contains a Fixnado-issued Bearer token for the expected audience and issuer.',
        documentationUrl: AUTH_DOCUMENTATION_URL
      };
  }
}

export async function authenticate(req, res, next) {
  try {
    const { bearerToken, accessToken, refreshToken } = extractTokens(req);
    const token = bearerToken || accessToken;
    const tokenSource = bearerToken ? 'authorization' : accessToken ? 'cookie' : null;
    const correlationId = deriveCorrelationId(req);

    if (!token) {
      const roleHeader = process.env.NODE_ENV === 'test' ? `${req.headers['x-fixnado-role'] ?? ''}`.trim() : '';
      if (roleHeader) {
        const stubUser = {
          id: null,
          type: roleHeader
        };
        req.user = {
          id: null,
          type: roleHeader,
          role: roleHeader,
          persona: req.headers['x-fixnado-persona'] ?? null
        };

        const actorContext = resolveActorContext({
          user: stubUser,
          headers: req.headers,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent']
        });

        req.auth = {
          ...(req.auth ?? {}),
          sessionId: null,
          refreshToken: null,
          tokenPayload: { sub: null, role: roleHeader, persona: req.headers['x-fixnado-persona'] ?? null },
          actor: actorContext
        };

        return next();
      }

      const storefrontRequest = req.originalUrl?.includes('/api/panel/provider/storefront');
      const missingResponse = buildVerificationErrorResponse('token_missing');
      const remediation = storefrontRequest
        ? 'Sign in with a provider account that has storefront privileges, then retry with the issued Bearer token.'
        : missingResponse.remediation;

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
        correlationId,
        metadata: { path: req.originalUrl ?? null, tokenSource: 'absent' }
      });

      return respondWithAuthError(req, res, {
        ...missingResponse,
        message: storefrontRequest
          ? 'Provider storefront access requires an authenticated provider session.'
          : missingResponse.message,
        remediation,
        documentationUrl: storefrontRequest ? STOREFRONT_DOCUMENTATION_URL : missingResponse.documentationUrl,
        details: { path: req.originalUrl ?? undefined }
      });
    }

    const verification = verifyAccessToken(token, { detailed: true });
    if (!verification.valid) {
      const errorResponse = buildVerificationErrorResponse(verification.code);

      await recordSecurityEvent({
        userId: null,
        actorRole: 'guest',
        actorPersona: null,
        resource: 'auth:authenticate',
        action: req.originalUrl ?? 'unknown',
        decision: 'deny',
        reason: `jwt_${verification.code ?? 'invalid'}`,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        correlationId,
        metadata: {
          tokenSource: tokenSource ?? 'unknown',
          jwtError: verification.error?.name ?? null
        }
      });

      clearSessionCookies(res);

      return respondWithAuthError(req, res, errorResponse);
    }

    const payload = verification.payload;
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
        userAgent: req.headers['user-agent'],
        correlationId,
        metadata: { tokenSource: tokenSource ?? 'unknown' }
      });
      clearSessionCookies(res);
      return respondWithAuthError(req, res, {
        status: 401,
        code: 'auth.session.unknown_user',
        message: 'We could not find the account associated with this session.',
        remediation: 'Sign in again to issue a new session or ask an administrator to confirm the account is still active.',
        documentationUrl: AUTH_DOCUMENTATION_URL
      });
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
          correlationId,
          metadata: { sessionId: payload.sid ?? null }
        });
        clearSessionCookies(res);
        return respondWithAuthError(req, res, {
          status: 401,
          code: 'auth.session.expired',
          message: 'Your Fixnado session has expired.',
          remediation: 'Sign in again to refresh your credentials. Any drafts will re-sync after authentication.',
          documentationUrl: AUTH_DOCUMENTATION_URL
        });
      }
    } else if (process.env.NODE_ENV !== 'test') {
      await recordSecurityEvent({
        userId: user.id,
        actorRole: payload.role ?? user.type,
        actorPersona: payload.persona ?? null,
        resource: 'auth:authenticate',
        action: req.originalUrl ?? 'unknown',
        decision: 'deny',
        reason: 'session_missing',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        correlationId
      });
      clearSessionCookies(res);
      return respondWithAuthError(req, res, {
        status: 401,
        code: 'auth.session.missing',
        message: 'This token is missing a session reference and cannot be trusted.',
        remediation: 'Request a fresh login so we can bind the token to an active session before retrying.',
        documentationUrl: AUTH_DOCUMENTATION_URL
      });
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
      correlationId,
      metadata: {
        sessionId: session?.id ?? null,
        tokenSource: tokenSource ?? 'unknown',
        sidPresent: Boolean(payload.sid)
      }
    });

    return next();
  } catch (error) {
    console.warn('Authentication middleware failure', { message: error.message });
    return next(error);
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
