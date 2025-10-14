import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import config from '../src/config/index.js';
import {
  clearSecretVaultCache,
  getAdminSecurityToken,
  getDatabasePassword,
  getJwtSigningSecret
} from '../src/services/secretVaultService.js';
import { SecretsManagerClient } from '@aws-sdk/client-secrets-manager';

const ORIGINALS = {
  jwtSecret: config.jwt.secret,
  adminToken: config.auth.admin.securityToken,
  dbPassword: config.database.password
};

function resetEnvironment() {
  config.jwt.secret = ORIGINALS.jwtSecret;
  config.auth.admin.securityToken = ORIGINALS.adminToken;
  config.database.password = ORIGINALS.dbPassword;
  process.env.JWT_SECRET = ORIGINALS.jwtSecret;
  process.env.ADMIN_SECURITY_TOKEN = ORIGINALS.adminToken;
  process.env.DB_PASSWORD = ORIGINALS.dbPassword;
  delete process.env.JWT_SECRET_SECRET_ID;
  delete process.env.ADMIN_SECURITY_TOKEN_SECRET_ID;
  delete process.env.DB_PASSWORD_SECRET_ID;
}

describe('secretVaultService', () => {
  beforeEach(() => {
    resetEnvironment();
    clearSecretVaultCache();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    clearSecretVaultCache();
  });

  it('returns the JWT signing secret from local configuration without contacting the vault', async () => {
    const sendSpy = vi.spyOn(SecretsManagerClient.prototype, 'send');

    const secret = await getJwtSigningSecret();

    expect(secret).toBe(config.jwt.secret);
    expect(sendSpy).not.toHaveBeenCalled();
  });

  it('reads JWT secrets from AWS Secrets Manager when not present locally', async () => {
    config.jwt.secret = '';
    process.env.JWT_SECRET = '';
    process.env.JWT_SECRET_SECRET_ID = 'arn:aws:secretsmanager:region:account:secret:jwt';

    const sendSpy = vi
      .spyOn(SecretsManagerClient.prototype, 'send')
      .mockResolvedValueOnce({ SecretString: 'remote-jwt-secret' });

    const secret = await getJwtSigningSecret();

    expect(secret).toBe('remote-jwt-secret');
    expect(sendSpy).toHaveBeenCalledTimes(1);
    expect(sendSpy.mock.calls[0][0].input.SecretId).toBe(process.env.JWT_SECRET_SECRET_ID);
  });

  it('caches resolved secrets but allows cache clearing for rotations', async () => {
    config.jwt.secret = '';
    process.env.JWT_SECRET = '';
    process.env.JWT_SECRET_SECRET_ID = 'arn:aws:secretsmanager:region:account:secret:jwt';

    const sendSpy = vi
      .spyOn(SecretsManagerClient.prototype, 'send')
      .mockResolvedValue({ SecretString: 'rotating-secret-v1' });

    const first = await getJwtSigningSecret();
    expect(first).toBe('rotating-secret-v1');
    expect(sendSpy).toHaveBeenCalledTimes(1);

    sendSpy.mockResolvedValue({ SecretString: 'rotating-secret-v2' });
    const second = await getJwtSigningSecret();
    expect(second).toBe('rotating-secret-v1');
    expect(sendSpy).toHaveBeenCalledTimes(1);

    clearSecretVaultCache();

    const third = await getJwtSigningSecret();
    expect(third).toBe('rotating-secret-v2');
    expect(sendSpy).toHaveBeenCalledTimes(2);
  });

  it('provides empty strings for optional secrets such as admin token and database password', async () => {
    config.auth.admin.securityToken = '';
    process.env.ADMIN_SECURITY_TOKEN = '';
    config.database.password = '';
    process.env.DB_PASSWORD = '';

    const adminToken = await getAdminSecurityToken();
    const dbPassword = await getDatabasePassword();

    expect(adminToken).toBe('');
    expect(dbPassword).toBe('');
  });
});
