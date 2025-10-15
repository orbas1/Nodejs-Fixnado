import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const SECRET_CACHE = {
  loadedAt: 0,
  appliedKeys: new Set(),
  sources: [],
  versionMap: new Map()
};

function parseBoolean(value, defaultValue = false) {
  if (typeof value !== 'string') {
    return defaultValue;
  }
  const normalised = value.trim().toLowerCase();
  if (['1', 'true', 'yes', 'y', 'on'].includes(normalised)) {
    return true;
  }
  if (['0', 'false', 'no', 'n', 'off'].includes(normalised)) {
    return false;
  }
  return defaultValue;
}

function parseList(value) {
  if (typeof value !== 'string' || value.trim() === '') {
    return [];
  }
  return value
    .split(',')
    .map((token) => token.trim())
    .filter(Boolean);
}

function parseSecretString(secretString) {
  const trimmed = secretString.trim();
  if (!trimmed) {
    return {};
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
      console.warn('Secrets manager payload was JSON but not an object. Ignoring.');
      return {};
    } catch (error) {
      console.error('Failed to parse secrets manager JSON payload:', error);
      throw new Error('Secrets manager payload is not valid JSON.');
    }
  }

  const accumulator = {};
  for (const line of trimmed.split('\n')) {
    if (!line || line.trim().startsWith('#')) {
      continue;
    }
    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }
    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();
    if (key) {
      accumulator[key] = value;
    }
  }
  return accumulator;
}

function decodeSecretValue(secretValue) {
  if (!secretValue) {
    return {};
  }

  if (typeof secretValue.SecretString === 'string') {
    return parseSecretString(secretValue.SecretString);
  }

  if (secretValue.SecretBinary) {
    const buffer = Buffer.from(secretValue.SecretBinary, 'base64');
    return parseSecretString(buffer.toString('utf8'));
  }

  return {};
}

function applySecretsToEnv(secretObject, options) {
  const { preferLocal, logger } = options;
  const applied = [];
  for (const [rawKey, rawValue] of Object.entries(secretObject)) {
    if (rawValue === undefined || rawValue === null) {
      continue;
    }
    const key = String(rawKey).trim();
    if (!key) {
      continue;
    }
    const value = typeof rawValue === 'string' ? rawValue : JSON.stringify(rawValue);
    if (preferLocal && typeof process.env[key] === 'string' && process.env[key].trim() !== '') {
      logger?.debug?.(`Secrets manager preserved existing value for ${key}.`);
      continue;
    }
    process.env[key] = value;
    applied.push(key);
    SECRET_CACHE.appliedKeys.add(key);
  }
  return applied;
}

function buildSecretsManagerClient(region) {
  return new SecretsManagerClient({
    region,
    maxAttempts: 3
  });
}

export async function loadSecretsIntoEnv(options = {}) {
  const {
    forceRefresh = false,
    logger = console,
    stage = 'bootstrap'
  } = options;

  const secretIds = parseList(process.env.SECRETS_MANAGER_SECRET_IDS || process.env.SECRETS_MANAGER_SECRET_ARNS);
  const enabled = parseBoolean(process.env.SECRETS_MANAGER_ENABLED, true) && secretIds.length > 0;

  if (!enabled) {
    logger?.debug?.('Secrets manager disabled or no secret identifiers configured.');
    return {
      applied: [],
      skipped: true,
      reason: secretIds.length === 0 ? 'no_secret_ids' : 'disabled'
    };
  }

  const refreshIntervalMs = Math.max(
    Number.parseInt(process.env.SECRETS_MANAGER_REFRESH_INTERVAL_SECONDS || '900', 10) * 1000,
    1000
  );
  const preferLocal = parseBoolean(process.env.SECRETS_MANAGER_PREFER_LOCAL, false);
  const failFast = parseBoolean(process.env.SECRETS_MANAGER_FAIL_FAST, true);
  const now = Date.now();

  if (!forceRefresh && SECRET_CACHE.loadedAt && now - SECRET_CACHE.loadedAt < refreshIntervalMs) {
    logger?.debug?.('Secrets manager cache still fresh; skipping reload.');
    return { applied: [], cached: true };
  }

  const region = process.env.SECRETS_MANAGER_REGION || process.env.AWS_REGION || 'eu-west-2';
  const client = buildSecretsManagerClient(region);

  const appliedKeys = [];
  const sources = [];

  for (const secretId of secretIds) {
    try {
      const command = new GetSecretValueCommand({ SecretId: secretId, VersionStage: 'AWSCURRENT' });
      const secretValue = await client.send(command);
      const payload = decodeSecretValue(secretValue);
      const justApplied = applySecretsToEnv(payload, { preferLocal, logger });
      appliedKeys.push(...justApplied);
      SECRET_CACHE.versionMap.set(secretId, secretValue.VersionId || 'unknown');
      sources.push({ id: secretId, appliedKeys: justApplied.length });
    } catch (error) {
      logger?.error?.(`Failed to load secret ${secretId} during ${stage}`, error);
      if (failFast) {
        throw error;
      }
    }
  }

  SECRET_CACHE.loadedAt = Date.now();
  SECRET_CACHE.sources = sources;

  return {
    applied: appliedKeys,
    cached: false,
    sources
  };
}

export function getSecretSyncMetadata() {
  return {
    loadedAt: SECRET_CACHE.loadedAt,
    appliedKeys: Array.from(SECRET_CACHE.appliedKeys),
    sources: SECRET_CACHE.sources,
    versions: Object.fromEntries(SECRET_CACHE.versionMap)
  };
}

export function resetSecretCache() {
  SECRET_CACHE.loadedAt = 0;
  SECRET_CACHE.appliedKeys.clear();
  SECRET_CACHE.sources = [];
  SECRET_CACHE.versionMap = new Map();
}
