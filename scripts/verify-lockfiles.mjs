#!/usr/bin/env node
import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import path from 'node:path';
import process from 'node:process';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

const ALL_WORKSPACES = {
  backend: {
    label: 'Backend API',
    lockfile: path.join(PROJECT_ROOT, 'backend-nodejs', 'package-lock.json')
  },
  frontend: {
    label: 'Frontend web',
    lockfile: path.join(PROJECT_ROOT, 'frontend-reactjs', 'package-lock.json')
  },
  flutter: {
    label: 'Flutter mobile app',
    lockfile: path.join(PROJECT_ROOT, 'flutter-phoneapp', 'pubspec.lock')
  }
};

function parseArguments(args) {
  const workspaces = [];
  for (const arg of args) {
    if (!arg.startsWith('--workspace=')) {
      throw new Error(`Unsupported flag "${arg}". Use --workspace=<backend|frontend|flutter>.`);
    }
    const value = arg.split('=')[1];
    if (!value || !ALL_WORKSPACES[value]) {
      throw new Error(`Unknown workspace "${value}" supplied to verify-lockfiles script.`);
    }
    workspaces.push(value);
  }
  return workspaces.length ? Array.from(new Set(workspaces)) : Object.keys(ALL_WORKSPACES);
}

async function ensureTracked(filePath, label) {
  try {
    await access(filePath, constants.F_OK);
  } catch (error) {
    throw new Error(`${label} lockfile missing at ${path.relative(PROJECT_ROOT, filePath)}.`);
  }
}

async function ensureClean(paths) {
  if (!paths.length) {
    return;
  }
  const { stdout } = await execFileAsync('git', ['status', '--short', '--', ...paths]);
  const diff = stdout.trim();
  if (diff.length > 0) {
    throw new Error(`Lockfile verification failed. Staged or unstaged changes detected:\n${diff}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const selected = parseArguments(args);
  const lockfilePaths = [];

  for (const key of selected) {
    const workspace = ALL_WORKSPACES[key];
    await ensureTracked(workspace.lockfile, workspace.label);
    lockfilePaths.push(path.relative(PROJECT_ROOT, workspace.lockfile));
  }

  await ensureClean(lockfilePaths);
  console.log(`Lockfile verification passed for: ${selected.map((key) => ALL_WORKSPACES[key].label).join(', ')}.`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
