#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const performanceDir = path.join(repoRoot, 'performance');
const defaultProfile = path.join(performanceDir, 'profiles', 'baseline.json');
const scriptPath = path.join(performanceDir, 'k6', 'main.js');
const reportsDir = path.join(performanceDir, 'reports');

function parseArgs(argv) {
  const result = { profile: process.env.K6_PROFILE_PATH || defaultProfile, summary: null, extra: [] };
  const args = [...argv];
  while (args.length) {
    const current = args.shift();
    if (current === '--profile' && args.length) {
      result.profile = args.shift();
    } else if (current === '--summary' && args.length) {
      result.summary = args.shift();
    } else if (current === '--') {
      result.extra = args.slice();
      break;
    } else {
      result.extra.push(current);
    }
  }
  return result;
}

function ensureK6Binary() {
  const probe = spawnSync('k6', ['version'], { stdio: 'ignore' });
  if (probe.error) {
    console.error('\n❌ k6 binary not found. Install k6 (https://k6.io/docs/get-started/installation/) and ensure it is available on the PATH.');
    process.exit(1);
  }
}

function loadProfile(profilePath) {
  try {
    const raw = readFileSync(profilePath, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error(`\n❌ Unable to read k6 profile at ${profilePath}: ${error.message}`);
    process.exit(1);
  }
}

function validateEnv(requiredKeys) {
  const missing = requiredKeys.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.error(`\n❌ Missing required environment variables: ${missing.join(', ')}`);
    console.error('   Populate the variables listed above before running the load harness.');
    process.exit(1);
  }
}

function relativeToScript(targetPath) {
  const absolute = path.isAbsolute(targetPath) ? targetPath : path.resolve(targetPath);
  return path.relative(path.dirname(scriptPath), absolute) || '.';
}

function ensureReportPath(summaryPath) {
  if (!summaryPath) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return path.join(reportsDir, `summary-${timestamp}.json`);
  }
  const absolute = path.isAbsolute(summaryPath) ? summaryPath : path.resolve(summaryPath);
  const dir = path.dirname(absolute);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return absolute;
}

function runK6(profilePath, summaryPath, extraArgs) {
  const env = { ...process.env };
  env.K6_PROFILE_PATH = relativeToScript(profilePath);
  if (!existsSync(reportsDir)) {
    mkdirSync(reportsDir, { recursive: true });
  }

  const args = ['run'];
  if (summaryPath) {
    args.push('--summary-export', summaryPath);
  }
  args.push(scriptPath, ...extraArgs);

  console.log(`▶️  Executing k6 with profile: ${profilePath}`);
  if (summaryPath) {
    console.log(`📄 Summary export: ${summaryPath}`);
  }

  const child = spawn('k6', args, { stdio: 'inherit', env, cwd: repoRoot });
  child.on('exit', (code) => {
    if (code !== 0) {
      console.error(`\n❌ k6 exited with status ${code}. Review the output above for details.`);
      process.exit(code);
    }
    console.log('\n✅ Load harness completed successfully.');
  });
}

(function main() {
  const { profile, summary, extra } = parseArgs(process.argv.slice(2));
  ensureK6Binary();
  const profileData = loadProfile(profile);
  validateEnv(Array.isArray(profileData.requiredEnv) ? profileData.requiredEnv : []);
  const summaryPath = ensureReportPath(summary);
  runK6(profile, summaryPath, extra);
})();
