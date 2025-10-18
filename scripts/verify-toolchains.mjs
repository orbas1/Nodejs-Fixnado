#!/usr/bin/env node
import { execFile } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import path from 'node:path';
import process from 'node:process';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

const argv = process.argv.slice(2);
const flagSet = new Set(argv.filter((arg) => arg.startsWith('--') && !arg.includes('=')));
const isCI = flagSet.has('--ci');

function normaliseVersion(version) {
  if (!version) {
    throw new Error('Received empty version string while verifying toolchains.');
  }
  return String(version).trim().replace(/^v/, '').split('-')[0];
}

function parseSemver(version) {
  const [major = '0', minor = '0', patch = '0'] = normaliseVersion(version).split('.');
  const parts = [Number.parseInt(major, 10), Number.parseInt(minor, 10), Number.parseInt(patch, 10)];
  if (parts.some((part) => Number.isNaN(part))) {
    throw new Error(`Unable to parse semantic version from "${version}".`);
  }
  return parts;
}

function compareVersions(a, b) {
  const parsedA = Array.isArray(a) ? a : parseSemver(a);
  const parsedB = Array.isArray(b) ? b : parseSemver(b);
  for (let index = 0; index < 3; index += 1) {
    const diff = (parsedA[index] ?? 0) - (parsedB[index] ?? 0);
    if (diff > 0) {
      return 1;
    }
    if (diff < 0) {
      return -1;
    }
  }
  return 0;
}

function satisfiesRange(range, version, label) {
  const comparators = String(range)
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  if (!comparators.length) {
    throw new Error(`No comparators found in range "${range}" for ${label}.`);
  }

  for (const comparator of comparators) {
    const match = comparator.match(/^(>=|<=|>|<|=)?\s*v?(.*)$/);
    if (!match) {
      throw new Error(`Unsupported comparator "${comparator}" in range "${range}" for ${label}.`);
    }
    const [, operator = '>=', comparatorVersion] = match;
    const comparison = compareVersions(version, comparatorVersion);
    switch (operator) {
      case '>':
        if (!(comparison > 0)) {
          return false;
        }
        break;
      case '>=':
        if (!(comparison >= 0)) {
          return false;
        }
        break;
      case '<':
        if (!(comparison < 0)) {
          return false;
        }
        break;
      case '<=':
        if (!(comparison <= 0)) {
          return false;
        }
        break;
      case '=':
        if (comparison !== 0) {
          return false;
        }
        break;
      default:
        throw new Error(`Comparator operator "${operator}" is not supported for ${label}.`);
    }
  }

  return true;
}

async function resolveNpmVersion() {
  const { stdout } = await execFileAsync('npm', ['--version']);
  return normaliseVersion(stdout);
}

async function resolveFlutterVersion() {
  try {
    const { stdout } = await execFileAsync('flutter', ['--version', '--machine'], { maxBuffer: 10 * 1024 * 1024 });
    const parsed = JSON.parse(stdout);
    return normaliseVersion(parsed.frameworkVersion ?? parsed.flutterVersion ?? '');
  } catch (error) {
    if (isCI) {
      throw new Error(`Failed to read Flutter SDK version${error?.message ? `: ${error.message}` : ''}`);
    }
    console.warn('Warning: Flutter SDK not detected; skipping Flutter version verification.');
    return null;
  }
}

async function verifyNodeWorkspaces(npmVersion) {
  const workspaces = [
    { name: 'Backend API', directory: path.join(PROJECT_ROOT, 'backend-nodejs') },
    { name: 'Frontend web', directory: path.join(PROJECT_ROOT, 'frontend-reactjs') }
  ];

  const currentNodeVersion = normaliseVersion(process.version);

  for (const workspace of workspaces) {
    const manifestPath = path.join(workspace.directory, 'package.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

    if (!manifest.engines || !manifest.engines.node) {
      throw new Error(`${workspace.name} is missing an engines.node constraint.`);
    }
    if (!manifest.engines.npm) {
      throw new Error(`${workspace.name} is missing an engines.npm constraint.`);
    }
    if (!manifest.packageManager || !manifest.packageManager.startsWith('npm@')) {
      throw new Error(`${workspace.name} must declare a packageManager field that pins npm.`);
    }

    if (!satisfiesRange(manifest.engines.node, currentNodeVersion, `${workspace.name} Node version`)) {
      throw new Error(
        `${workspace.name} requires Node ${manifest.engines.node}, but current process is ${currentNodeVersion}.`
      );
    }

    if (!satisfiesRange(manifest.engines.npm, npmVersion, `${workspace.name} npm version`)) {
      throw new Error(`${workspace.name} requires npm ${manifest.engines.npm}, but resolved npm is ${npmVersion}.`);
    }
  }

  console.log(`Node toolchain verified: Node ${currentNodeVersion}, npm ${npmVersion}.`);
}

function extractFlutterEnvironment(pubspecContents) {
  const lines = pubspecContents.split(/\r?\n/);
  let inEnvironment = false;
  let environmentIndent = 0;
  const env = {};

  for (const line of lines) {
    if (!inEnvironment) {
      if (line.trim().startsWith('environment:')) {
        inEnvironment = true;
        environmentIndent = (line.match(/^\s*/) ?? [''])[0].length;
      }
      continue;
    }

    const indent = (line.match(/^\s*/) ?? [''])[0].length;
    if (line.trim().length === 0) {
      continue;
    }
    if (indent <= environmentIndent) {
      break;
    }
    const trimmed = line.trim();
    if (trimmed.startsWith('#')) {
      continue;
    }
    const [key, rawValue] = trimmed.split(':');
    if (key && rawValue !== undefined) {
      env[key.trim()] = rawValue.trim().replace(/^['"]|['"]$/g, '');
    }
  }

  return env;
}

async function verifyFlutterWorkspace(flutterVersion) {
  const pubspecPath = path.join(PROJECT_ROOT, 'flutter-phoneapp', 'pubspec.yaml');
  const pubspecRaw = await readFile(pubspecPath, 'utf8');
  const environment = extractFlutterEnvironment(pubspecRaw);

  if (!environment.sdk) {
    throw new Error('Flutter pubspec is missing a Dart SDK constraint under environment.sdk.');
  }
  if (!environment.flutter) {
    throw new Error('Flutter pubspec must declare environment.flutter to lock the framework range.');
  }

  if (flutterVersion && !satisfiesRange(environment.flutter, flutterVersion, 'Flutter SDK')) {
    throw new Error(`Flutter workspace requires Flutter ${environment.flutter}, but ${flutterVersion} is installed.`);
  }

  console.log(`Flutter toolchain verified: Flutter ${flutterVersion ?? 'not installed'}, Dart constraint ${environment.sdk}.`);
}

async function verifyMobilePlatformManifest() {
  const platformManifestPath = path.join(PROJECT_ROOT, 'flutter-phoneapp', 'tooling', 'platform-versions.json');
  const raw = await readFile(platformManifestPath, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Failed to parse platform-versions.json: ${error.message}`);
  }

  if (!parsed.android || typeof parsed.android !== 'object') {
    throw new Error('platform-versions.json must define an "android" object.');
  }
  if (!parsed.ios || typeof parsed.ios !== 'object') {
    throw new Error('platform-versions.json must define an "ios" object.');
  }

  const androidRequirements = ['minSdk', 'targetSdk', 'compileSdk'];
  for (const key of androidRequirements) {
    if (parsed.android[key] === undefined) {
      throw new Error(`Android platform requirements must include "${key}".`);
    }
  }

  if (!parsed.ios.deploymentTarget) {
    throw new Error('iOS platform requirements must include a deploymentTarget.');
  }

  console.log(
    `Mobile platform baselines verified: Android minSdk ${parsed.android.minSdk}, targetSdk ${parsed.android.targetSdk}, iOS ${parsed.ios.deploymentTarget}.`
  );
}

async function main() {
  const npmVersion = await resolveNpmVersion();
  await verifyNodeWorkspaces(npmVersion);
  const flutterVersion = await resolveFlutterVersion();
  await verifyFlutterWorkspace(flutterVersion);
  await verifyMobilePlatformManifest();
  console.log('Toolchain verification completed successfully.');
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
