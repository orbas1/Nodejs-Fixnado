#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomBytes, createHash } from 'node:crypto';
import process from 'node:process';

const execFileAsync = promisify(execFile);

const SECRET_MAP = {
  staging: {
    'app-config': 'fixnado/staging/app-config',
    database: 'fixnado/staging/database'
  },
  production: {
    'app-config': 'fixnado/production/app-config',
    database: 'fixnado/production/database'
  }
};

function usage() {
  console.log(`Usage: node scripts/rotate-secrets.mjs --environment <staging|production> [--targets app-config,database] [--dry-run]\n` +
    'Rotates Fixnado runtime secrets stored in AWS Secrets Manager.');
}

function parseArgs(argv) {
  const args = { environment: null, targets: null, dryRun: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--environment') {
      args.environment = argv[++i];
    } else if (arg.startsWith('--environment=')) {
      args.environment = arg.split('=')[1];
    } else if (arg === '--targets') {
      args.targets = argv[++i];
    } else if (arg.startsWith('--targets=')) {
      args.targets = arg.split('=')[1];
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--help' || arg === '-h') {
      usage();
      process.exit(0);
    } else {
      throw new Error(`Unrecognised argument: ${arg}`);
    }
  }

  if (!args.environment) {
    throw new Error('Missing required --environment argument.');
  }
  if (!SECRET_MAP[args.environment]) {
    throw new Error(`Unsupported environment: ${args.environment}`);
  }
  if (!args.targets) {
    args.targets = Object.keys(SECRET_MAP[args.environment]).join(',');
  }
  const targets = Array.from(new Set(args.targets.split(',').map((target) => target.trim()).filter(Boolean)));
  for (const target of targets) {
    if (!SECRET_MAP[args.environment][target]) {
      throw new Error(`Unsupported target "${target}" for environment ${args.environment}.`);
    }
  }
  return { ...args, targets };
}

async function execAws(args) {
  try {
    const { stdout } = await execFileAsync('aws', args, { env: process.env });
    return stdout.trim();
  } catch (error) {
    throw new Error(`AWS CLI command failed (${args.join(' ')}): ${error.stderr || error.message}`);
  }
}

function randomSecret(bytes = 48) {
  return randomBytes(bytes).toString('base64url');
}

function withAuditEnvelope(payload, actor) {
  return {
    ...payload,
    rotatedBy: actor,
    rotatedAt: new Date().toISOString()
  };
}

async function fetchSecret(secretId) {
  const output = await execAws([
    'secretsmanager',
    'get-secret-value',
    '--secret-id',
    secretId,
    '--query',
    'SecretString',
    '--output',
    'text'
  ]);

  if (!output) {
    return {};
  }

  try {
    return JSON.parse(output);
  } catch (error) {
    throw new Error(`Secret ${secretId} is not JSON serialisable: ${error.message}`);
  }
}

async function putSecret(secretId, payload, dryRun) {
  const secretString = JSON.stringify(payload, null, 2);
  if (dryRun) {
    console.log(`[dry-run] Would update ${secretId} with:`);
    console.log(secretString);
    return;
  }
  await execAws([
    'secretsmanager',
    'put-secret-value',
    '--secret-id',
    secretId,
    '--secret-string',
    secretString
  ]);
}

function rotateAppConfig(current, actor) {
  const updated = {
    ...current,
    JWT_SECRET: randomSecret(48),
    ENCRYPTION_KEY: randomSecret(32),
    TOKEN_ROTATION_DAYS: current.TOKEN_ROTATION_DAYS ?? 7,
    FEATURE_TOGGLE_SECRET_ARN: current.FEATURE_TOGGLE_SECRET_ARN
  };
  return withAuditEnvelope(updated, actor);
}

function rotateDatabaseSecret(current, actor) {
  const newPassword = randomSecret(40);
  const checksum = current.password
    ? createHash('sha256').update(current.password).digest('hex')
    : undefined;

  const updated = {
    ...current,
    password: newPassword,
    previousPasswordChecksum: checksum
  };
  if (!updated.username && current.username) {
    updated.username = current.username;
  }
  return withAuditEnvelope(updated, actor);
}

async function main() {
  const { environment, targets, dryRun } = parseArgs(process.argv.slice(2));
  const actor = process.env.AWS_USER_ARN || process.env.GITHUB_ACTOR || process.env.USER || 'unknown';
  const results = [];

  for (const target of targets) {
    const secretId = SECRET_MAP[environment][target];
    const current = await fetchSecret(secretId);

    let updated;
    if (target === 'app-config') {
      updated = rotateAppConfig(current, actor);
    } else if (target === 'database') {
      if (!current.username) {
        throw new Error(`Database secret ${secretId} must contain a username field.`);
      }
      updated = rotateDatabaseSecret(current, actor);
    } else {
      throw new Error(`No rotation strategy registered for ${target}.`);
    }

    await putSecret(secretId, updated, dryRun);
    results.push({ target, secretId, checksum: updated.previousPasswordChecksum, rotatedAt: updated.rotatedAt });
  }

  console.log('Rotation summary:');
  for (const result of results) {
    const line = [
      `- ${result.target} → ${result.secretId}`,
      `at ${result.rotatedAt}`
    ];
    if (result.checksum) {
      line.push(`previous checksum ${result.checksum}`);
    }
    console.log(line.join(' | '));
  }
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
