import crypto from 'node:crypto';
import { DateTime } from 'luxon';
import {
  SecretsManagerClient,
  GetSecretValueCommand,
  PutSecretValueCommand
} from '@aws-sdk/client-secrets-manager';

import config from '../config/index.js';
import { loadSecretsIntoEnv } from '../config/secretManager.js';
import { sequelize } from '../models/index.js';

function buildSecretsClient() {
  const region =
    config.database.rotation.region || process.env.SECRETS_MANAGER_REGION || process.env.AWS_REGION || 'eu-west-2';
  return new SecretsManagerClient({ region, maxAttempts: 3 });
}

function parseSecret(secretValue) {
  if (!secretValue) {
    throw new Error('Secrets manager did not return a value for the configured secret.');
  }
  const raw = secretValue.SecretString ?? Buffer.from(secretValue.SecretBinary ?? '', 'base64').toString('utf8');
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Database credential secret is not valid JSON: ${error.message}`);
  }
  if (!payload || typeof payload !== 'object') {
    throw new Error('Database credential secret payload must be an object.');
  }
  if (typeof payload.username !== 'string' || !payload.username) {
    throw new Error('Database credential secret is missing a username.');
  }
  if (typeof payload.password !== 'string' || !payload.password) {
    throw new Error('Database credential secret is missing a password.');
  }
  return payload;
}

function rotationDue(payload) {
  const lastRotated = payload.rotated_at ? DateTime.fromISO(payload.rotated_at, { zone: 'utc' }) : null;
  if (!lastRotated?.isValid) {
    return true;
  }
  const intervalHours = Math.max(Number(config.database.rotation.intervalHours ?? 168), 1);
  return DateTime.utc().diff(lastRotated, 'hours').hours >= intervalHours;
}

function enforceCooldown(payload) {
  const lastRotated = payload.rotated_at ? DateTime.fromISO(payload.rotated_at, { zone: 'utc' }) : null;
  if (!lastRotated?.isValid) {
    return true;
  }
  const minIntervalHours = Math.max(Number(config.database.rotation.minIntervalHours ?? 24), 1);
  const diff = DateTime.utc().diff(lastRotated, 'hours').hours;
  return diff >= minIntervalHours;
}

function generatePassword() {
  return crypto.randomBytes(48).toString('base64url');
}

async function applyPasswordChange(username, password, logger) {
  const qi = sequelize.getQueryInterface();
  const quotedUser = qi.quoteIdentifier(username);
  const dialect = sequelize.getDialect();
  if (dialect === 'postgres') {
    await sequelize.query(`ALTER USER ${quotedUser} WITH PASSWORD :password`, {
      replacements: { password }
    });
    await sequelize.query(
      `SELECT pg_terminate_backend(pid)
         FROM pg_stat_activity
        WHERE usename = :username
          AND pid <> pg_backend_pid();`,
      { replacements: { username } }
    );
  } else if (dialect === 'mysql') {
    await sequelize.query(`ALTER USER ${quotedUser} IDENTIFIED BY :password`, {
      replacements: { password }
    });
  } else {
    logger?.warn?.(`Database credential rotation does not support dialect ${dialect}; skipping password change.`);
    return false;
  }
  return true;
}

async function updateSecret(secretArn, payload, logger) {
  const client = buildSecretsClient();
  const command = new PutSecretValueCommand({
    SecretId: secretArn,
    SecretString: JSON.stringify(payload)
  });
  await client.send(command);
  logger?.info?.(`Secrets manager secret ${secretArn} updated with new database credentials.`);
}

function updateSequelizePassword(newPassword) {
  if (sequelize.config) {
    sequelize.config.password = newPassword;
  }
  if (sequelize.options) {
    sequelize.options.password = newPassword;
  }
  if (sequelize.connectionManager?.config) {
    sequelize.connectionManager.config.password = newPassword;
  }
}

export async function maybeRotateDatabaseCredentials({ reason = 'scheduled', logger = console } = {}) {
  if (!config.database.rotation.enabled) {
    logger.debug?.('Database credential rotation disabled via configuration.');
    return { rotated: false, reason: 'disabled' };
  }
  if (!config.database.rotation.secretArn) {
    logger.warn?.('Database credential rotation skipped; no secret ARN configured.');
    return { rotated: false, reason: 'no_secret' };
  }
  if (config.database.rotation.requireTls && !config.database.ssl) {
    throw new Error('Database credential rotation blocked because TLS is not enabled. Enable DB_SSL to proceed.');
  }

  const client = buildSecretsClient();
  const secretResponse = await client.send(
    new GetSecretValueCommand({ SecretId: config.database.rotation.secretArn, VersionStage: 'AWSCURRENT' })
  );
  const payload = parseSecret(secretResponse);

  if (!rotationDue(payload)) {
    logger.debug?.('Database credential rotation not required yet.');
    return { rotated: false, reason: 'interval_not_met' };
  }
  if (!enforceCooldown(payload)) {
    logger.info?.('Database credential rotation skipped due to minimum interval cooldown.');
    return { rotated: false, reason: 'cooldown' };
  }

  const newPassword = generatePassword();
  let passwordChanged = false;

  try {
    passwordChanged = await applyPasswordChange(payload.username, newPassword, logger);
    if (!passwordChanged) {
      return { rotated: false, reason: 'dialect_not_supported' };
    }

    const rotatedAt = DateTime.utc().toISO();
    const updatedPayload = {
      ...payload,
      previous_password: payload.password,
      password: newPassword,
      rotated_at: rotatedAt,
      rotated_by: reason
    };

    await updateSecret(config.database.rotation.secretArn, updatedPayload, logger);
    await loadSecretsIntoEnv({ forceRefresh: true, stage: 'db-rotation', logger });
    updateSequelizePassword(newPassword);
    await sequelize.authenticate();

    logger.info?.(`Database credentials rotated successfully for user ${payload.username}.`);
    return { rotated: true, rotatedAt };
  } catch (error) {
    logger.error?.('Database credential rotation failed', error);
    if (passwordChanged) {
      try {
        await applyPasswordChange(payload.username, payload.password, logger);
        logger.warn?.('Database password reverted to previous value after rotation failure.');
      } catch (revertError) {
        logger.error?.('Failed to revert database password after rotation failure', revertError);
      }
    }
    throw error;
  }
}

export default maybeRotateDatabaseCredentials;
