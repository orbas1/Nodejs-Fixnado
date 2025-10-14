import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const cache = new Map();
let sharedClient;

function getClient() {
  if (!sharedClient) {
    sharedClient = new SecretsManagerClient({});
  }
  return sharedClient;
}

async function fetchSecretValue(secretId) {
  if (cache.has(secretId)) {
    return cache.get(secretId);
  }

  const client = getClient();
  const command = new GetSecretValueCommand({ SecretId: secretId });
  const response = await client.send(command);

  const secretString = response.SecretString
    ? response.SecretString
    : Buffer.from(response.SecretBinary).toString('utf8');

  cache.set(secretId, secretString);
  return secretString;
}

export function clearSecretCache() {
  cache.clear();
}

export async function resolveSecret({
  envKey,
  secretIdKey,
  jsonKey,
  defaultValue,
  allowEmpty = false
}) {
  const directValue = process.env[envKey];
  if (typeof directValue === 'string' && directValue.trim()) {
    return directValue.trim();
  }

  const secretId = process.env[secretIdKey];
  if (secretId) {
    const payload = await fetchSecretValue(secretId);
    if (jsonKey) {
      try {
        const parsed = JSON.parse(payload);
        if (parsed?.[jsonKey]) {
          return parsed[jsonKey];
        }
        throw new Error(`Key ${jsonKey} not found in secret ${secretId}`);
      } catch (error) {
        throw new Error(`Failed to parse JSON secret for ${jsonKey}: ${error.message}`);
      }
    }
    return payload;
  }

  if (defaultValue !== undefined) {
    return defaultValue;
  }

  if (allowEmpty) {
    return '';
  }

  throw new Error(`Secret ${envKey} is required. Provide ${envKey} or ${secretIdKey}.`);
}
