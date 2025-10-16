import crypto from 'node:crypto';
import isEmail from 'validator/lib/isEmail.js';

const ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12;
const AUTH_TAG_LENGTH_BYTES = 16;

function requireEnvBuffer(envKey, expectedLength) {
  const secret = process.env[envKey];
  if (!secret) {
    throw new Error(
      `${envKey} must be configured with a base64 encoded value to encrypt and decrypt sensitive data.`
    );
  }

  let buffer;
  try {
    buffer = Buffer.from(secret, 'base64');
  } catch (error) {
    throw new Error(`${envKey} must be base64 encoded: ${error.message}`);
  }

  if (buffer.length !== expectedLength) {
    throw new Error(
      `${envKey} must decode to exactly ${expectedLength} bytes. Received ${buffer.length} bytes.`
    );
  }

  return buffer;
}

function getEncryptionKey() {
  return requireEnvBuffer('PII_ENCRYPTION_KEY', 32);
}

function getHashKey() {
  return requireEnvBuffer('PII_HASH_KEY', 32);
}

export function encryptString(value, context = 'pii') {
  if (typeof value !== 'string') {
    throw new TypeError(`Cannot encrypt non-string value for ${context}.`);
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error(`Cannot encrypt empty value for ${context}.`);
  }

  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const cipher = crypto.createCipheriv(ENCRYPTION_ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH_BYTES
  });

  const ciphertext = Buffer.concat([cipher.update(trimmed, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const payload = Buffer.concat([iv, authTag, ciphertext]);
  return payload.toString('base64');
}

export function decryptString(payload, context = 'pii') {
  if (typeof payload !== 'string' || payload.trim() === '') {
    return null;
  }

  const buffer = Buffer.from(payload, 'base64');
  if (buffer.length <= IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES) {
    throw new Error(`Encrypted payload for ${context} is malformed.`);
  }

  const iv = buffer.subarray(0, IV_LENGTH_BYTES);
  const authTag = buffer.subarray(IV_LENGTH_BYTES, IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES);
  const ciphertext = buffer.subarray(IV_LENGTH_BYTES + AUTH_TAG_LENGTH_BYTES);
  const key = getEncryptionKey();
  const decipher = crypto.createDecipheriv(ENCRYPTION_ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH_BYTES
  });
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}

export function stableHash(value, context = 'pii-hash') {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Cannot hash empty value for ${context}.`);
  }

  const key = getHashKey();
  return crypto.createHmac('sha512', key).update(value).digest('hex');
}

export function normaliseEmail(value) {
  if (typeof value !== 'string') {
    throw new TypeError('Email value must be a string.');
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('Email value cannot be empty.');
  }

  return trimmed.toLowerCase();
}

function assertValidEmail(value) {
  if (!isEmail(value, { allow_utf8_local_part: true, require_tld: true })) {
    const error = new Error('Email value must be a valid email address.');
    error.code = 'INVALID_EMAIL_FORMAT';
    throw error;
  }
}

export function protectEmail(value) {
  if (typeof value !== 'string') {
    throw new TypeError('Email value must be a string.');
  }

  const trimmed = value.trim();
  if (!trimmed) {
    throw new Error('Email value cannot be empty.');
  }

  assertValidEmail(trimmed);
  const normalised = normaliseEmail(trimmed);

  return {
    encrypted: encryptString(trimmed, 'user:email'),
    hash: stableHash(normalised, 'user:email-hash'),
    normalised
  };
}

export function redactSensitiveUser(modelValues) {
  const clone = { ...modelValues };
  delete clone.emailHash;
  delete clone.passwordHash;
  delete clone.password_hash;
  delete clone.firstName;
  delete clone.lastName;
  delete clone.address;
  delete clone.email;
  return clone;
}
