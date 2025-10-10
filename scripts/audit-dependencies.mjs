#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(ROOT, '..');
const isCI = process.argv.includes('--ci');

const workspaces = [
  {
    name: 'backend-nodejs',
    directory: path.join(PROJECT_ROOT, 'backend-nodejs'),
    type: 'node'
  },
  {
    name: 'frontend-reactjs',
    directory: path.join(PROJECT_ROOT, 'frontend-reactjs'),
    type: 'node'
  },
  {
    name: 'flutter-phoneapp',
    directory: path.join(PROJECT_ROOT, 'flutter-phoneapp'),
    type: 'flutter'
  }
];

const severityRank = ['info', 'low', 'moderate', 'high', 'critical'];

const pinnedMajorVersions = {
  react: 18,
  'react-dom': 18,
  'react-router-dom': 6,
  tailwindcss: 3,
  '@types/react': 18,
  '@types/react-dom': 18,
  'eslint-plugin-react-hooks': 5,
  vite: 6
};

function parseMajor(version) {
  if (!version) return undefined;
  const [major] = String(version).replace(/^v/, '').split('.');
  const parsed = Number.parseInt(major, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

async function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      ...options
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk) => {
      stdout += chunk;
    });

    child.stderr.on('data', (chunk) => {
      stderr += chunk;
    });

    child.on('error', (err) => {
      reject(err);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        const error = new Error(`${command} ${args.join(' ')} failed with exit code ${code}`);
        error.code = code;
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

async function auditNodeWorkspace(workspace) {
  const results = {
    workspace: workspace.name,
    type: 'node',
    vulnerabilities: [],
    outdated: {},
    suppressed: []
  };

  const pkgPath = path.join(workspace.directory, 'package.json');
  await readFile(pkgPath, 'utf8');

  try {
    const { stdout } = await run('npm', ['audit', '--json'], { cwd: workspace.directory });
    const audit = JSON.parse(stdout);
    const advisories = audit.vulnerabilities ?? audit.advisories ?? {};
    for (const [name, vulnerability] of Object.entries(advisories)) {
      const severity = vulnerability.severity ?? vulnerability.overview?.severity ?? 'info';
      const via = Array.isArray(vulnerability.via) ? vulnerability.via.map((v) => (typeof v === 'string' ? v : v.source)).filter(Boolean) : [];
      results.vulnerabilities.push({
        dependency: name,
        severity,
        title: vulnerability.title ?? vulnerability.overview ?? 'Unknown',
        via
      });
    }
  } catch (error) {
    if (error.code === 1 && error.stdout) {
      const audit = JSON.parse(error.stdout);
      const advisories = audit.vulnerabilities ?? audit.advisories ?? {};
      for (const [name, vulnerability] of Object.entries(advisories)) {
        const severity = vulnerability.severity ?? 'info';
        const via = Array.isArray(vulnerability.via) ? vulnerability.via.map((v) => (typeof v === 'string' ? v : v.source)).filter(Boolean) : [];
        results.vulnerabilities.push({ dependency: name, severity, title: vulnerability.title ?? 'Unknown', via });
      }
    } else {
      throw error;
    }
  }

  try {
    const { stdout } = await run('npm', ['outdated', '--json'], { cwd: workspace.directory });
    const outdated = JSON.parse(stdout);
    for (const [pkg, info] of Object.entries(outdated)) {
      const pinnedMajor = pinnedMajorVersions[pkg];
      const latestMajor = parseMajor(info.latest);
      const currentMajor = parseMajor(info.current);
      if (
        pinnedMajor &&
        typeof currentMajor === 'number' &&
        currentMajor === pinnedMajor &&
        typeof latestMajor === 'number' &&
        latestMajor > pinnedMajor
      ) {
        results.suppressed.push({
          package: pkg,
          current: info.current,
          latest: info.latest,
          reason: `Pinned to major ${pinnedMajor} pending compatibility review`
        });
        continue;
      }
      results.outdated[pkg] = info;
    }
  } catch (error) {
    if (error.code === 1 && error.stdout) {
      const outdated = JSON.parse(error.stdout);
      for (const [pkg, info] of Object.entries(outdated)) {
        const pinnedMajor = pinnedMajorVersions[pkg];
        const latestMajor = parseMajor(info.latest);
        const currentMajor = parseMajor(info.current);
        if (
          pinnedMajor &&
          typeof currentMajor === 'number' &&
          currentMajor === pinnedMajor &&
          typeof latestMajor === 'number' &&
          latestMajor > pinnedMajor
        ) {
          results.suppressed.push({
            package: pkg,
            current: info.current,
            latest: info.latest,
            reason: `Pinned to major ${pinnedMajor} pending compatibility review`
          });
          continue;
        }
        results.outdated[pkg] = info;
      }
    } else if (error.code === 0) {
      results.outdated = {};
    } else if (error.message.includes('No outdated packages')) {
      results.outdated = {};
    } else {
      throw error;
    }
  }

  return results;
}

async function auditFlutterWorkspace(workspace) {
  const results = {
    workspace: workspace.name,
    type: 'flutter',
    warnings: []
  };

  try {
    await run('flutter', ['--version']);
  } catch (error) {
    const message = 'Flutter SDK not available in PATH; install Flutter before running audits.';
    results.warnings.push(message);
    if (isCI) {
      throw new Error(message);
    }
    return results;
  }

  try {
    const { stdout } = await run('flutter', ['pub', 'outdated', '--json'], { cwd: workspace.directory });
    const payload = JSON.parse(stdout);
    results.outdated = payload.packages ?? [];
  } catch (error) {
    const message = `Failed to execute flutter pub outdated: ${error.stderr || error.message}`;
    results.warnings.push(message);
    if (isCI) {
      throw new Error(message);
    }
  }

  return results;
}

function printReport(reports) {
  console.log('Dependency Audit Summary\n==========================');
  for (const report of reports) {
    if (report.type === 'node') {
      const highOrCritical = report.vulnerabilities.filter((v) => severityRank.indexOf(v.severity) >= severityRank.indexOf('high'));
      console.log(`\n[${report.workspace}]`);
      if (report.vulnerabilities.length === 0) {
        console.log('  No known vulnerabilities.');
      } else {
        console.log(`  Vulnerabilities (${report.vulnerabilities.length})`);
        for (const vuln of report.vulnerabilities) {
          console.log(`   - ${vuln.severity.toUpperCase()}: ${vuln.dependency} – ${vuln.title}`);
          if (vuln.via?.length) {
            console.log(`       via: ${vuln.via.join(', ')}`);
          }
        }
      }

      const outdatedEntries = Object.entries(report.outdated ?? {});
      if (outdatedEntries.length === 0) {
        console.log('  Dependencies are up to date.');
      } else {
        console.log('  Outdated packages:');
        for (const [pkg, info] of outdatedEntries) {
          const wanted = info.wanted ?? info.latest;
          console.log(`   - ${pkg}: current ${info.current} → wanted ${wanted} (latest ${info.latest})`);
        }
      }

      if (report.suppressed?.length) {
        console.log('  Pinned major versions:');
        for (const pin of report.suppressed) {
          console.log(`   - ${pin.package}: current ${pin.current}, latest ${pin.latest} (${pin.reason})`);
        }
      }

      report.highOrCritical = highOrCritical.length;
    } else if (report.type === 'flutter') {
      console.log(`\n[${report.workspace}]`);
      if (report.warnings.length) {
        for (const warning of report.warnings) {
          console.warn(`  Warning: ${warning}`);
        }
      }
      if (report.outdated?.length) {
        console.log('  Outdated packages:');
        for (const pkg of report.outdated) {
          console.log(`   - ${pkg.package} ${pkg.current ?? 'unknown'} → ${pkg.upgrade?.latest ?? 'unknown'}`);
        }
      } else {
        console.log('  Dependencies are up to date.');
      }
    }
  }
}

async function main() {
  const reports = [];
  for (const workspace of workspaces) {
    if (workspace.type === 'node') {
      reports.push(await auditNodeWorkspace(workspace));
    } else if (workspace.type === 'flutter') {
      reports.push(await auditFlutterWorkspace(workspace));
    }
  }

  printReport(reports);

  if (isCI) {
    const blocking = reports.some((report) => report.highOrCritical && report.highOrCritical > 0);
    if (blocking) {
      console.error('\nHigh or critical vulnerabilities detected. Failing CI run.');
      process.exit(1);
    }
  }
}

main().catch((error) => {
  console.error(error.message);
  if (error.stdout) {
    console.error(error.stdout);
  }
  if (error.stderr) {
    console.error(error.stderr);
  }
  process.exit(1);
});
