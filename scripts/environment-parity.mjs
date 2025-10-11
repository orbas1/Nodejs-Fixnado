#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

function parseTfvars(content) {
  const result = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const match = trimmed.match(/^(\w+)\s*=\s*(.+)$/);
    if (!match) {
      continue;
    }
    const [, key, rawValue] = match;
    let value = rawValue.trim();
    if (value.startsWith('[') || value.startsWith('{')) {
      try {
        result[key] = JSON.parse(value.replace(/'(\w+)'/g, '"$1"').replace(/'/g, '"'));
      } catch (error) {
        result[key] = value;
      }
      continue;
    }
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

async function loadJson(path) {
  const content = await readFile(path, 'utf8');
  return JSON.parse(content);
}

function diffKeys(label, a, b) {
  const missing = [...a.keys()].filter((key) => !b.has(key));
  const unexpected = [...b.keys()].filter((key) => !a.has(key));
  return { label, missing, unexpected };
}

function compareToggles(staging, production) {
  const stagingKeys = new Set(Object.keys(staging));
  const productionKeys = new Set(Object.keys(production));
  const { missing, unexpected } = diffKeys('feature toggles', stagingKeys, productionKeys);

  const rolloutDrift = [];
  for (const key of stagingKeys) {
    if (!production[key]) {
      continue;
    }
    const stagingState = staging[key].state;
    const productionState = production[key].state;
    const stagingRollout = Number.parseFloat(staging[key].rollout ?? 0);
    const productionRollout = Number.parseFloat(production[key].rollout ?? 0);
    if (Math.abs(stagingRollout - productionRollout) > 0.5) {
      rolloutDrift.push({ key, staging: stagingRollout, production: productionRollout });
    }
    if (stagingState === 'disabled' && productionState !== 'disabled') {
      rolloutDrift.push({ key, staging: stagingState, production: productionState });
    }
  }

  return { missing, unexpected, rolloutDrift };
}

async function main() {
  const root = resolve('infrastructure/terraform');
  const stagingTfvars = await readFile(resolve(root, 'environments/staging.tfvars'), 'utf8');
  const productionTfvars = await readFile(resolve(root, 'environments/production.tfvars'), 'utf8');

  const stagingConfig = parseTfvars(stagingTfvars);
  const productionConfig = parseTfvars(productionTfvars);

  const stagingToggles = await loadJson(resolve(root, 'runtime-config/feature_toggles/staging.json'));
  const productionToggles = await loadJson(resolve(root, 'runtime-config/feature_toggles/production.json'));

  const tfvarsDiff = diffKeys('tfvars', new Set(Object.keys(stagingConfig)), new Set(Object.keys(productionConfig)));
  const togglesDiff = compareToggles(stagingToggles, productionToggles);

  let hasIssue = false;

  if (tfvarsDiff.missing.length || tfvarsDiff.unexpected.length) {
    hasIssue = true;
    console.error('Environment parity failed for tfvars:');
    if (tfvarsDiff.missing.length) {
      console.error(`  Missing in production: ${tfvarsDiff.missing.join(', ')}`);
    }
    if (tfvarsDiff.unexpected.length) {
      console.error(`  Missing in staging: ${tfvarsDiff.unexpected.join(', ')}`);
    }
  }

  if (togglesDiff.missing.length || togglesDiff.unexpected.length) {
    hasIssue = true;
    console.error('Environment parity failed for feature toggles:');
    if (togglesDiff.missing.length) {
      console.error(`  Missing in production: ${togglesDiff.missing.join(', ')}`);
    }
    if (togglesDiff.unexpected.length) {
      console.error(`  Missing in staging: ${togglesDiff.unexpected.join(', ')}`);
    }
  }

  if (togglesDiff.rolloutDrift.length) {
    hasIssue = true;
    console.error('Rollout drift exceeds threshold for:');
    for (const diff of togglesDiff.rolloutDrift) {
      console.error(`  ${diff.key}: staging=${diff.staging} production=${diff.production}`);
    }
  }

  if (!hasIssue) {
    console.log('Staging and production environment inputs are aligned.');
  } else {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('Failed to validate environment parity', error);
  process.exitCode = 1;
});
