#!/usr/bin/env node
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { readFile, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    ci: false,
    policyPath: path.join(repoRoot, 'governance', 'license-policy.json'),
    reportPath: null,
  };
  const unknown = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--ci') {
      options.ci = true;
    } else if (arg.startsWith('--policy=')) {
      const [, value] = arg.split('=');
      options.policyPath = path.resolve(repoRoot, value);
    } else if (arg.startsWith('--report=')) {
      const [, value] = arg.split('=');
      options.reportPath = path.resolve(repoRoot, value);
    } else {
      unknown.push(arg);
    }
  }
  if (unknown.length) {
    console.warn(`⚠️  Ignoring unsupported arguments: ${unknown.join(', ')}`);
  }
  return options;
}

function normaliseToken(value) {
  if (!value) {
    return null;
  }
  let token = String(value).trim();
  if (!token) {
    return null;
  }
  token = token.replace(/\(.*?\)/g, ' ');
  token = token.replace(/license/gi, '');
  token = token.replace(/\s+/g, '-');
  token = token.replace(/[^A-Za-z0-9.\-+]/g, '');
  token = token.replace(/-+/g, '-');
  token = token.toUpperCase();
  const aliases = {
    'APACHE-2-0': 'APACHE-2.0',
    'APACHE-2.0': 'APACHE-2.0',
    'APACHE-LICENSE-2-0': 'APACHE-2.0',
    'BSD-2-CLAUSE': 'BSD-2-CLAUSE',
    'BSD-3-CLAUSE': 'BSD-3-CLAUSE',
    'BSD-3-CLAUSE-NEW': 'BSD-3-CLAUSE',
    'BSD-3-CLAUSE"NEW"': 'BSD-3-CLAUSE',
    'GPL-2-0': 'GPL-2.0',
    'GPL-3-0': 'GPL-3.0',
    'LGPL-2-1': 'LGPL-2.1',
    'LGPL-3-0': 'LGPL-3.0',
    'MPL-2-0': 'MPL-2.0',
    'MIT': 'MIT',
    'ISC': 'ISC',
    'UNLICENSE': 'UNLICENSED',
    'UNLICENSED': 'UNLICENSED',
    'UNLICENCED': 'UNLICENSED',
    'SEE-LICENSE-IN': 'SEE-LICENSE-IN',
    'SEE-LICENCE-IN': 'SEE-LICENSE-IN',
    'NOASSERTION': 'UNKNOWN',
    'UNKNOWN': 'UNKNOWN',
    'ZLIB': 'ZLIB',
    'CC0-1-0': 'CC0-1.0',
  };
  return aliases[token] ?? token;
}

function extractLicenseTokens(raw) {
  if (!raw) {
    return [];
  }
  if (Array.isArray(raw)) {
    return raw.flatMap((value) => extractLicenseTokens(value));
  }
  if (typeof raw === 'object') {
    if (raw.type) {
      return extractLicenseTokens(raw.type);
    }
    if (raw.name) {
      return extractLicenseTokens(raw.name);
    }
    if (raw.license) {
      return extractLicenseTokens(raw.license);
    }
    return [];
  }
  const tokens = String(raw)
    .split(/\s+OR\s+|\s+AND\s+|[,/&+;]|WITH/gi)
    .map((token) => normaliseToken(token))
    .filter(Boolean);
  return tokens;
}

async function loadPolicy(policyPath) {
  let raw;
  try {
    raw = await readFile(policyPath, 'utf-8');
  } catch (error) {
    throw new Error(`Unable to read license policy at ${policyPath}: ${error.message}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`License policy is not valid JSON: ${error.message}`);
  }
  const allowed = new Set((parsed.allowed ?? []).map((value) => normaliseToken(value)).filter(Boolean));
  const review = new Map(
    Object.entries(parsed.review ?? {}).map(([key, value]) => [normaliseToken(key), value])
  );
  const forbidden = new Map(
    Object.entries(parsed.forbidden ?? {}).map(([key, value]) => [normaliseToken(key), value])
  );
  const overrides = new Map(Object.entries(parsed.packageOverrides ?? {}));
  return { allowed, review, forbidden, overrides, raw: parsed };
}

async function gatherNodeLicenses({ id, directory }) {
  let output;
  try {
    ({ stdout: output } = await execFileAsync('npm', ['ls', '--json', '--long'], {
      cwd: directory,
      maxBuffer: 32 * 1024 * 1024,
    }));
  } catch (error) {
    if (error.stdout) {
      output = error.stdout;
    } else {
      throw new Error(`npm ls failed for ${id}: ${error.message}`);
    }
  }
  let tree;
  try {
    tree = JSON.parse(output);
  } catch (error) {
    throw new Error(`npm ls output for ${id} was not valid JSON: ${error.message}`);
  }
  const results = [];
  const visited = new Set();
  function visit(node, depth) {
    if (!node || typeof node !== 'object') {
      return;
    }
    const name = node.name;
    const version = node.version;
    if (!name || !version) {
      return;
    }
    const key = `${id}:${name}@${version}`;
    if (!visited.has(key)) {
      results.push({
        workspace: id,
        ecosystem: 'node',
        name,
        version,
        license: node.license ?? node.licenses ?? null,
        depth,
      });
      visited.add(key);
    }
    const dependencies = node.dependencies ?? {};
    for (const child of Object.values(dependencies)) {
      visit(child, depth + 1);
    }
  }
  visit(tree, 0);
  return results;
}

async function gatherFlutterLicenses() {
  const flutterDir = path.join(repoRoot, 'flutter-phoneapp');
  const outputPath = path.join(flutterDir, 'build', 'license_audit.json');
  try {
    await execFileAsync('dart', ['run', 'tooling/license_snapshot.dart', outputPath], {
      cwd: flutterDir,
      maxBuffer: 32 * 1024 * 1024,
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('Dart SDK not found. Install Flutter/Dart before running the license scan.');
    }
    throw new Error(`Failed to generate Flutter license snapshot: ${error.message}`);
  }
  let raw;
  try {
    raw = await readFile(outputPath, 'utf-8');
  } catch (error) {
    throw new Error(`Unable to read Flutter license snapshot: ${error.message}`);
  }
  try {
    await rm(outputPath, { force: true });
  } catch (error) {
    console.warn(`⚠️  Unable to remove temporary Flutter license snapshot: ${error.message}`);
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`Flutter license snapshot is not valid JSON: ${error.message}`);
  }
  const packages = Array.isArray(parsed.packages) ? parsed.packages : [];
  return packages.map((pkg) => ({
    workspace: 'flutter',
    ecosystem: 'flutter',
    name: pkg.name,
    version: pkg.version,
    license: pkg.license,
    declared: pkg.declared,
    type: pkg.type,
    source: pkg.source,
  }));
}

function evaluatePackage(pkg, tokens, policy) {
  const packageKey = `${pkg.workspace}:${pkg.name}@${pkg.version}`;
  const nameKey = `${pkg.name}@${pkg.version}`;
  const simpleKey = pkg.name;
  const override =
    policy.overrides.get(packageKey) || policy.overrides.get(nameKey) || policy.overrides.get(simpleKey);
  if (override) {
    const decision = String(override.decision ?? override.status ?? override.action ?? 'review').toLowerCase();
    const note = override.reason ?? override.note ?? 'Policy override applied.';
    if (decision === 'allow' || decision === 'pass' || decision === 'approved') {
      return { status: 'compliant', tokens, reason: `Override: ${note}` };
    }
    if (decision === 'deny' || decision === 'block') {
      return { status: 'failed', tokens, reason: `Override denies usage: ${note}` };
    }
    return { status: 'review', tokens, reason: `Override requires review: ${note}` };
  }

  const uniqueTokens = tokens.length ? Array.from(new Set(tokens)) : ['UNKNOWN'];
  let hasForbidden = false;
  let hasReview = false;
  const reasons = [];

  uniqueTokens.forEach((token) => {
    if (policy.forbidden.has(token)) {
      hasForbidden = true;
      reasons.push(policy.forbidden.get(token) || `Forbidden license ${token}`);
      return;
    }
    if (policy.allowed.has(token)) {
      return;
    }
    if (policy.review.has(token)) {
      hasReview = true;
      reasons.push(policy.review.get(token) || `Manual review required for ${token}`);
      return;
    }
    if (token === 'SEE-LICENSE-IN') {
      hasReview = true;
      reasons.push('License requires manual inspection (SEE LICENSE IN).');
      return;
    }
    if (token === 'UNKNOWN') {
      hasReview = true;
      reasons.push('Dependency did not declare a license.');
      return;
    }
    hasReview = true;
    reasons.push(`License "${token}" is not in the allow list.`);
  });

  if (hasForbidden) {
    return { status: 'failed', tokens: uniqueTokens, reason: reasons.join(' ') };
  }
  if (hasReview) {
    return { status: 'review', tokens: uniqueTokens, reason: reasons.join(' ') };
  }
  return { status: 'compliant', tokens: uniqueTokens, reason: 'All licenses match allow list.' };
}

function formatPackage(pkg) {
  return `${pkg.name}@${pkg.version} (${pkg.workspace})`;
}

async function main() {
  const options = parseArgs();
  const policy = await loadPolicy(options.policyPath);

  const nodeWorkspaces = [
    { id: 'backend', directory: path.join(repoRoot, 'backend-nodejs') },
    { id: 'frontend', directory: path.join(repoRoot, 'frontend-reactjs') },
  ];

  const packages = [];
  for (const workspace of nodeWorkspaces) {
    if (!existsSync(workspace.directory)) {
      continue;
    }
    const entries = await gatherNodeLicenses(workspace);
    packages.push(...entries);
  }

  if (existsSync(path.join(repoRoot, 'flutter-phoneapp', 'pubspec.lock'))) {
    try {
      const flutterEntries = await gatherFlutterLicenses();
      packages.push(...flutterEntries);
    } catch (error) {
      throw error;
    }
  }

  const evaluations = packages.map((pkg) => {
    const tokens = extractLicenseTokens(pkg.license);
    const evaluation = evaluatePackage(pkg, tokens, policy);
    return { ...pkg, ...evaluation };
  });

  const compliant = evaluations.filter((item) => item.status === 'compliant');
  const review = evaluations.filter((item) => item.status === 'review');
  const failed = evaluations.filter((item) => item.status === 'failed');

  console.log('\nLicense compliance summary');
  console.log('---------------------------');
  console.log(`Total packages analysed: ${evaluations.length}`);
  console.log(`Compliant: ${compliant.length}`);
  console.log(`Review required: ${review.length}`);
  console.log(`Blocked: ${failed.length}`);

  if (failed.length) {
    console.log('\n❌ Blocked dependencies:');
    failed.forEach((item) => {
      console.log(` • ${formatPackage(item)} → ${item.reason}`);
    });
  }

  if (review.length) {
    console.log('\n⚠️  Dependencies requiring review:');
    review.slice(0, 20).forEach((item) => {
      console.log(` • ${formatPackage(item)} → ${item.reason}`);
    });
    if (review.length > 20) {
      console.log(`   …and ${review.length - 20} more.`);
    }
  }

  if (options.reportPath) {
    const report = {
      generatedAt: new Date().toISOString(),
      policy: options.policyPath,
      summary: {
        total: evaluations.length,
        compliant: compliant.length,
        review: review.length,
        failed: failed.length,
      },
      packages: evaluations.map((item) => ({
        workspace: item.workspace,
        ecosystem: item.ecosystem,
        name: item.name,
        version: item.version,
        licenses: item.tokens,
        status: item.status,
        reason: item.reason,
      })),
    };
    await writeFile(options.reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf-8');
    console.log(`\n📄 Wrote machine-readable report to ${options.reportPath}`);
  }

  if (failed.length > 0) {
    process.exit(1);
  }
  if (review.length > 0 && options.ci) {
    console.error('\n❌ License review items detected under --ci.');
    process.exit(2);
  }
}

main().catch((error) => {
  console.error(`\n❌ License scan failed: ${error.message}`);
  process.exit(1);
});
