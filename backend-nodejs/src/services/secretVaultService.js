import config from '../config/index.js';
import { resolveSecret, clearSecretCache } from '../config/secretLoader.js';

const cache = new Map();

async function loadSecret(cacheKey, resolver) {
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const value = await resolver();
  if (typeof value !== 'string') {
    throw new Error(`Secret loader for ${cacheKey} returned a non-string value`);
  }

  const trimmed = value.trim();
  cache.set(cacheKey, trimmed);
  return trimmed;
}

function directOrNull(value) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return null;
}

export async function getJwtSigningSecret() {
  return loadSecret('jwtSigningSecret', async () => {
    const directValue = directOrNull(config.jwt.secret);
    if (directValue) {
      return directValue;
    }

    return resolveSecret({
      envKey: 'JWT_SECRET',
      secretIdKey: 'JWT_SECRET_SECRET_ID',
      allowEmpty: false
    });
  });
}

export async function getAdminSecurityToken() {
  return loadSecret('adminSecurityToken', async () => {
    const directValue = directOrNull(config.auth.admin.securityToken);
    if (directValue) {
      return directValue;
    }

    return resolveSecret({
      envKey: 'ADMIN_SECURITY_TOKEN',
      secretIdKey: 'ADMIN_SECURITY_TOKEN_SECRET_ID',
      defaultValue: '',
      allowEmpty: true
    });
  });
}

export async function getDatabasePassword() {
  return loadSecret('databasePassword', async () => {
    const directValue = directOrNull(config.database.password);
    if (directValue !== null) {
      return directValue;
    }

    return resolveSecret({
      envKey: 'DB_PASSWORD',
      secretIdKey: 'DB_PASSWORD_SECRET_ID',
      defaultValue: '',
      allowEmpty: true
    });
  });
}

export function clearSecretVaultCache() {
  cache.clear();
  clearSecretCache();
}
