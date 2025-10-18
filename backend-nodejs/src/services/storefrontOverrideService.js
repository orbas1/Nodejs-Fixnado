import { createHash, timingSafeEqual } from 'node:crypto';
import config from '../config/index.js';

function toLower(value) {
  return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

function canonicaliseRole(value) {
  const normalised = toLower(value);
  if (!normalised) {
    return '';
  }

  if (normalised === 'company') {
    return 'provider';
  }

  return normalised;
}

function uniqueLowercase(list, fallback = []) {
  const source = Array.isArray(list) && list.length > 0 ? list : fallback;
  const set = new Set();
  for (const value of source) {
    const normalised = toLower(value);
    if (normalised) {
      set.add(normalised);
    }
  }
  return Array.from(set);
}

function timingSafeMatch(rawProvided, candidate) {
  if (!rawProvided || !candidate) {
    return false;
  }

  if (candidate.startsWith('sha256:')) {
    const expected = candidate.slice(7).trim();
    if (!expected) {
      return false;
    }
    const providedDigest = createHash('sha256').update(rawProvided).digest();
    const candidateDigest = Buffer.from(expected, 'hex');
    if (candidateDigest.length !== providedDigest.length) {
      return false;
    }
    return timingSafeEqual(providedDigest, candidateDigest);
  }

  const providedBuffer = Buffer.from(rawProvided);
  const candidateBuffer = Buffer.from(candidate);
  if (providedBuffer.length !== candidateBuffer.length) {
    return false;
  }

  return timingSafeEqual(providedBuffer, candidateBuffer);
}

function selectSecrets(secretDefinitions) {
  if (!Array.isArray(secretDefinitions) || secretDefinitions.length === 0) {
    return [];
  }

  return secretDefinitions
    .map((definition) => {
      if (!definition) {
        return null;
      }
      const value = typeof definition.value === 'string' ? definition.value.trim() : '';
      if (!value) {
        return null;
      }
      const id = typeof definition.id === 'string' && definition.id.trim().length > 0 ? definition.id.trim() : null;
      return { id, value };
    })
    .filter(Boolean);
}

export function evaluateStorefrontOverride({ headers = {}, ipAddress = null, now = Date.now() } = {}) {
  const overrideConfig = config.security?.storefrontOverride ?? {};
  const requestedRole = canonicaliseRole(headers['x-fixnado-role']);
  const requestedPersonaRaw = headers['x-fixnado-persona'];
  const requestedPersona = toLower(requestedPersonaRaw);

  if (!requestedRole) {
    return {
      allowed: false,
      reason: 'missing_role',
      requestedRole: '',
      requestedPersona,
      tokenHeader: overrideConfig.tokenHeader
    };
  }

  if (!overrideConfig.enabled) {
    return {
      allowed: false,
      reason: 'override_disabled',
      requestedRole,
      requestedPersona,
      tokenHeader: overrideConfig.tokenHeader
    };
  }

  if (overrideConfig.requiresPersona && !requestedPersona) {
    return {
      allowed: false,
      reason: 'missing_persona',
      requestedRole,
      requestedPersona,
      tokenHeader: overrideConfig.tokenHeader
    };
  }

  const secrets = selectSecrets(overrideConfig.secrets);
  if (secrets.length === 0) {
    return {
      allowed: false,
      reason: 'no_secrets_configured',
      requestedRole,
      requestedPersona,
      tokenHeader: overrideConfig.tokenHeader
    };
  }

  const tokenHeaderName = overrideConfig.tokenHeader || 'x-fixnado-storefront-override-token';
  const tokenHeaderValue = headers[tokenHeaderName];
  const providedToken = Array.isArray(tokenHeaderValue)
    ? tokenHeaderValue[0]
    : typeof tokenHeaderValue === 'string'
      ? tokenHeaderValue.trim()
      : '';

  if (!providedToken) {
    return {
      allowed: false,
      reason: 'missing_token',
      requestedRole,
      requestedPersona,
      tokenHeader: tokenHeaderName
    };
  }

  let matchedSecretId = null;
  const tokenValid = secrets.some((secret) => {
    const matches = timingSafeMatch(providedToken, secret.value);
    if (matches) {
      matchedSecretId = secret.id;
    }
    return matches;
  });

  if (!tokenValid) {
    return {
      allowed: false,
      reason: 'invalid_token',
      requestedRole,
      requestedPersona,
      tokenHeader: tokenHeaderName
    };
  }

  const expiresHeaderName = overrideConfig.expiresHeader || 'x-fixnado-storefront-override-expires';
  const rawExpiry = headers[expiresHeaderName];
  const expiryValue = Array.isArray(rawExpiry)
    ? rawExpiry[0]
    : typeof rawExpiry === 'string'
      ? rawExpiry.trim()
      : '';

  if (expiryValue) {
    const parsedExpiry = Number.parseInt(expiryValue, 10);
    if (Number.isFinite(parsedExpiry) && parsedExpiry < now) {
      return {
        allowed: false,
        reason: 'override_expired',
        requestedRole,
        requestedPersona,
        tokenHeader: tokenHeaderName,
        matchedSecretId
      };
    }
  }

  const allowedRoles = uniqueLowercase(overrideConfig.allowlistedRoles, [
    'provider',
    'provider_admin',
    'operations',
    'admin'
  ]);
  if (allowedRoles.length > 0 && !allowedRoles.includes(requestedRole)) {
    return {
      allowed: false,
      reason: 'role_not_allowlisted',
      requestedRole,
      requestedPersona,
      tokenHeader: tokenHeaderName,
      matchedSecretId
    };
  }

  const effectivePersona = requestedPersona || requestedRole;
  const allowedPersonas = uniqueLowercase(
    overrideConfig.allowlistedPersonas,
    allowedRoles.length > 0 ? allowedRoles : [requestedRole]
  );

  if (allowedPersonas.length > 0 && !allowedPersonas.includes(effectivePersona)) {
    return {
      allowed: false,
      reason: 'persona_not_allowlisted',
      requestedRole,
      requestedPersona: effectivePersona,
      tokenHeader: tokenHeaderName,
      matchedSecretId
    };
  }

  return {
    allowed: true,
    reason: 'override_authorised',
    requestedRole,
    requestedPersona: effectivePersona,
    matchedSecretId,
    tokenHeader: tokenHeaderName,
    ipAddress
  };
}
