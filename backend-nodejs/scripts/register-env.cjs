'use strict';

const fs = require('node:fs');
const path = require('node:path');

const dotenv = require('dotenv');

const DEFAULT_ENV_FILES = [
  process.env.DOTENV_CONFIG_PATH,
  path.resolve(process.cwd(), '.env.local'),
  path.resolve(process.cwd(), '.env')
].filter(Boolean);

function resolveExistingFile(candidatePath) {
  if (!candidatePath) {
    return null;
  }

  const resolved = path.resolve(candidatePath);

  try {
    const stat = fs.statSync(resolved);
    if (stat.isFile()) {
      return resolved;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('[env-loader] Unable to read %s: %s', resolved, error.message);
    }
  }

  return null;
}

function loadDotEnvConfig() {
  for (const candidate of DEFAULT_ENV_FILES) {
    const file = resolveExistingFile(candidate);
    if (!file) {
      continue;
    }

    const result = dotenv.config({ path: file, override: false });

    if (result.error) {
      console.warn('[env-loader] Failed to load %s: %s', file, result.error.message);
      continue;
    }

    if (process.env.NODE_ENV !== 'test') {
      console.info('[env-loader] Loaded environment variables from %s', file);
    }

    return;
  }

  if (process.env.NODE_ENV !== 'test') {
    console.info('[env-loader] No .env file detected; relying on process environment variables.');
  }
}

loadDotEnvConfig();

module.exports = {};
