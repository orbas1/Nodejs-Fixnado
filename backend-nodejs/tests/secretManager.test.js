import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest';
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';
import { getSecretSyncMetadata, loadSecretsIntoEnv, resetSecretCache } from '../src/config/secretManager.js';

const originalEnv = { ...process.env };

function resetEnv() {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) {
      delete process.env[key];
    }
  }
  for (const [key, value] of Object.entries(originalEnv)) {
    process.env[key] = value;
  }
}

describe('secretManager', () => {
  beforeEach(() => {
    resetEnv();
    resetSecretCache();
    process.env.SECRETS_MANAGER_ENABLED = 'true';
    process.env.SECRETS_MANAGER_SECRET_IDS = 'secret-1';
    process.env.AWS_REGION = 'eu-west-2';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    resetSecretCache();
    resetEnv();
  });

  test('loads secrets from AWS and applies them to process.env', async () => {
    const sendSpy = vi
      .spyOn(SecretsManagerClient.prototype, 'send')
      .mockImplementation(async (command) => {
        expect(command).toBeInstanceOf(GetSecretValueCommand);
        return {
          SecretString: JSON.stringify({ JWT_SECRET: 'from-secret', DB_PASSWORD: 'vault-value' }),
          VersionId: 'v1'
        };
      });

    const logger = { debug: vi.fn(), error: vi.fn() };
    process.env.JWT_SECRET = 'local-value';
    const result = await loadSecretsIntoEnv({ logger, forceRefresh: true });

    expect(result.applied).toEqual(expect.arrayContaining(['JWT_SECRET', 'DB_PASSWORD']));
    expect(process.env.JWT_SECRET).toBe('from-secret');
    expect(process.env.DB_PASSWORD).toBe('vault-value');
    expect(getSecretSyncMetadata().versions['secret-1']).toBe('v1');
    expect(sendSpy).toHaveBeenCalledTimes(1);
  });

  test('respects prefer local override flag', async () => {
    vi.spyOn(SecretsManagerClient.prototype, 'send').mockResolvedValue({
      SecretString: JSON.stringify({ JWT_SECRET: 'remote-secret' }),
      VersionId: 'v2'
    });

    process.env.SECRETS_MANAGER_PREFER_LOCAL = 'true';
    process.env.JWT_SECRET = 'keep-this';

    const result = await loadSecretsIntoEnv({ logger: { debug: () => {}, error: () => {} }, forceRefresh: true });

    expect(result.applied).not.toContain('JWT_SECRET');
    expect(process.env.JWT_SECRET).toBe('keep-this');
  });

  test('skips loading when secret IDs are missing', async () => {
    delete process.env.SECRETS_MANAGER_SECRET_IDS;
    const result = await loadSecretsIntoEnv({ logger: { debug: () => {}, error: () => {} } });
    expect(result.skipped).toBe(true);
    expect(result.reason).toBe('no_secret_ids');
  });
});
