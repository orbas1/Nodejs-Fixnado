import { randomUUID } from 'crypto';
import { SecretsManagerClient, GetSecretValueCommand, PutSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import config from '../config/index.js';
import { sequelize } from '../models/index.js';

const ALLOWED_STATES = new Set(['enabled', 'disabled', 'pilot', 'staging', 'sunset']);

let clientOverride;
let cachedSecret = { data: null, expiresAt: 0, versionId: null };
let sharedClient;

function resolveClient() {
  if (clientOverride) {
    return clientOverride;
  }
  if (!config.featureToggles.secretArn) {
    return null;
  }
  if (!sharedClient) {
    sharedClient = new SecretsManagerClient({});
  }
  return sharedClient;
}

function normaliseTogglePayload(toggle = {}) {
  const state = typeof toggle.state === 'string' ? toggle.state.toLowerCase() : 'disabled';
  const parsedRollout = Number.parseFloat(toggle.rollout);
  const rollout = Number.isFinite(parsedRollout) ? parsedRollout : 0;
  const clampedRollout = Math.min(Math.max(rollout, 0), 1);
  const nextState = ALLOWED_STATES.has(state) ? state : 'disabled';

  return {
    state: nextState,
    rollout: clampedRollout,
    description: typeof toggle.description === 'string' ? toggle.description.trim() : '',
    owner: typeof toggle.owner === 'string' ? toggle.owner.trim() : '',
    ticket: typeof toggle.ticket === 'string' ? toggle.ticket.trim() : '',
    lastModifiedAt: toggle.lastModifiedAt ?? null,
    lastModifiedBy: toggle.lastModifiedBy ?? null
  };
}

function normaliseSecret(rawSecret) {
  if (rawSecret == null) {
    return {};
  }

  if (typeof rawSecret === 'string') {
    try {
      return normaliseSecret(JSON.parse(rawSecret));
    } catch (error) {
      throw new Error(`Feature toggle secret is not valid JSON: ${error.message}`);
    }
  }

  if (Array.isArray(rawSecret)) {
    return rawSecret.reduce((acc, toggle) => {
      if (!toggle || typeof toggle !== 'object' || typeof toggle.key !== 'string') {
        return acc;
      }
      acc[toggle.key] = normaliseTogglePayload(toggle);
      return acc;
    }, {});
  }

  return Object.entries(rawSecret).reduce((acc, [key, value]) => {
    acc[key] = normaliseTogglePayload(value);
    return acc;
  }, {});
}

async function fetchSecret({ forceRefresh = false } = {}) {
  if (!config.featureToggles.secretArn) {
    cachedSecret = {
      data: normaliseSecret(config.featureToggles.overrides),
      expiresAt: Number.POSITIVE_INFINITY,
      versionId: 'env-overrides'
    };
    return cachedSecret;
  }

  const now = Date.now();
  if (!forceRefresh && cachedSecret.data && cachedSecret.expiresAt > now) {
    return cachedSecret;
  }

  const client = resolveClient();
  if (!client) {
    throw new Error('Secrets Manager client not configured for feature toggles');
  }

  const response = await client.send(
    new GetSecretValueCommand({
      SecretId: config.featureToggles.secretArn
    })
  );

  const payload = response.SecretString ?? Buffer.from(response.SecretBinary ?? '', 'base64').toString('utf8');
  const normalised = normaliseSecret(payload);
  cachedSecret = {
    data: normalised,
    expiresAt: now + config.featureToggles.cacheTtlSeconds * 1000,
    versionId: response.VersionId
  };
  return cachedSecret;
}

async function writeSecret(nextState) {
  const client = resolveClient();
  if (!client) {
    cachedSecret = {
      data: nextState,
      expiresAt: Number.POSITIVE_INFINITY,
      versionId: 'env-overrides'
    };
    return cachedSecret;
  }

  const response = await client.send(
    new PutSecretValueCommand({
      SecretId: config.featureToggles.secretArn,
      SecretString: JSON.stringify(nextState),
      ClientRequestToken: randomUUID()
    })
  );

  cachedSecret = {
    data: nextState,
    expiresAt: Date.now() + config.featureToggles.cacheTtlSeconds * 1000,
    versionId: response.VersionId
  };
  return cachedSecret;
}

async function recordAuditEvent(key, previous, next, actor) {
  if (!config.featureToggles.auditTrail) {
    return;
  }

  if (!/^[A-Za-z0-9_]+$/.test(config.featureToggles.auditTrail)) {
    throw new Error('Invalid feature toggle audit table name');
  }

  const payload = {
    toggle_key: key,
    previous_state: previous?.state ?? null,
    previous_rollout: previous?.rollout ?? null,
    next_state: next.state,
    next_rollout: next.rollout,
    actor,
    changed_at: new Date().toISOString(),
    description: next.description,
    ticket: next.ticket
  };

  const columns = Object.keys(payload)
    .map((column) => `"${column}"`)
    .join(', ');

  const values = Object.values(payload);

  const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

  await sequelize.query(
    `INSERT INTO "${config.featureToggles.auditTrail}" (${columns}) VALUES (${placeholders})`,
    { bind: values }
  );
}

export async function listFeatureToggles({ forceRefresh = false } = {}) {
  const secret = await fetchSecret({ forceRefresh });
  return Object.entries(secret.data).map(([key, value]) => ({ key, ...value }));
}

export async function getFeatureToggle(key) {
  const secret = await fetchSecret();
  const toggle = secret.data[key];
  if (!toggle) {
    return null;
  }
  return { key, ...toggle };
}

export async function upsertFeatureToggle(key, payload, actor) {
  if (typeof key !== 'string' || key.trim() === '') {
    throw new Error('Toggle key must be a non-empty string');
  }
  const secret = await fetchSecret();
  const normalisedKey = key.trim();
  const existing = secret.data[normalisedKey];
  const next = {
    ...normaliseTogglePayload(existing),
    ...normaliseTogglePayload(payload),
    lastModifiedAt: new Date().toISOString(),
    lastModifiedBy: actor ?? 'system'
  };

  const nextState = {
    ...secret.data,
    [normalisedKey]: next
  };

  await writeSecret(nextState);
  await recordAuditEvent(normalisedKey, existing, next, actor ?? 'system');

  return { key: normalisedKey, ...next };
}

export function resetFeatureToggleCache() {
  cachedSecret = { data: null, expiresAt: 0, versionId: null };
}

export function overrideSecretsManagerClient(mockClient) {
  clientOverride = mockClient;
  if (!mockClient) {
    sharedClient = undefined;
  }
}

export function getFeatureToggleCacheVersion() {
  return cachedSecret.versionId;
}
