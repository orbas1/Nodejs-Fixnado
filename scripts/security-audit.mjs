#!/usr/bin/env node
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const execFileAsync = promisify(execFile);

const argv = process.argv.slice(2);
const flagSet = new Set(argv.filter((arg) => arg.startsWith("--") && !arg.includes("=")));

const SEVERITY_ORDER = ["critical", "high", "moderate", "low", "info"];

const failOnFlag = argv.find((arg) => arg.startsWith("--fail-on="));
let failOnSeverity = "high";
if (failOnFlag) {
  failOnSeverity = failOnFlag.split("=")[1]?.toLowerCase?.() ?? "high";
} else if (flagSet.has("--ci")) {
  failOnSeverity = "moderate";
}

if (!SEVERITY_ORDER.includes(failOnSeverity)) {
  throw new Error(`Unsupported --fail-on value "${failOnSeverity}". Expected one of ${SEVERITY_ORDER.join(", ")}.`);
}

const isCI = flagSet.has("--ci");

async function runCommand(command, args, options) {
  try {
    const { stdout } = await execFileAsync(command, args, options);
    return { stdout };
  } catch (error) {
    if (error.stdout) {
      return { stdout: error.stdout, stderr: error.stderr ?? "", exitCode: error.code ?? 1 };
    }
    throw error;
  }
}

function summariseNpmAudit(report) {
  const metadata = report?.metadata ?? {};
  const vulnerabilities = metadata.vulnerabilities ?? {};
  const advisories = Object.values(report?.vulnerabilities ?? {});
  const bySeverity = Object.fromEntries(
    SEVERITY_ORDER.map((level) => [level, Number(vulnerabilities[level] ?? 0)])
  );

  return {
    bySeverity,
    advisories: advisories
      .filter((advisory) => advisory?.severity && SEVERITY_ORDER.includes(advisory.severity))
      .map((advisory) => ({
        name: advisory.name,
        severity: advisory.severity,
        title: advisory.title,
        module: advisory.module_name,
        vulnerableVersions: advisory.vulnerable_versions,
        patchedVersions: advisory.patched_versions,
        url: advisory.url,
      })),
  };
}

function reportNpmFindings(label, summary) {
  const header = `\n${label} dependency audit results:`;
  console.log(header);
  console.log("-".repeat(header.length - 1));
  SEVERITY_ORDER.forEach((level) => {
    console.log(`${level.padEnd(9)}: ${summary.bySeverity[level] ?? 0}`);
  });

  if (summary.advisories.length) {
    console.log("\nTop advisories:");
    summary.advisories.slice(0, 5).forEach((advisory) => {
      console.log(` • [${advisory.severity.toUpperCase()}] ${advisory.name} ${advisory.vulnerableVersions}`);
      console.log(`   ↳ ${advisory.title}`);
      if (advisory.patchedVersions) {
        console.log(`   ↳ Patched in: ${advisory.patchedVersions}`);
      }
      if (advisory.url) {
        console.log(`   ↳ Advisory: ${advisory.url}`);
      }
    });
  } else {
    console.log("No advisories reported by npm audit.");
  }
}

async function runNpmAudit(label, directory) {
  const auditArgs = ["audit", "--json", "--omit=dev"];
  const { stdout } = await runCommand("npm", auditArgs, { cwd: directory, maxBuffer: 8 * 1024 * 1024 });
  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch (error) {
    console.error(`Failed to parse npm audit output for ${label}. Raw output follows:`);
    console.error(stdout);
    throw error;
  }
  const summary = summariseNpmAudit(parsed);
  reportNpmFindings(label, summary);
  return summary;
}

async function commandExists(binary) {
  try {
    await execFileAsync("which", [binary]);
    return true;
  } catch (error) {
    return false;
  }
}

function summariseFlutterOutdated(report) {
  const vulnerablePackages = [];
  const packages = Array.isArray(report.packages) ? report.packages : [];

  packages.forEach((pkg) => {
    const isVulnerable = Boolean(pkg?.vulnerable) || Boolean(pkg?.current?.vulnerable);
    const vulnerabilityEntries = Array.isArray(pkg?.vulnerabilities) ? pkg.vulnerabilities : [];

    if (isVulnerable || vulnerabilityEntries.length) {
      vulnerablePackages.push({
        package: pkg.package || pkg.name,
        current: pkg.current?.version ?? pkg?.current ?? "unknown",
        latest: pkg.latest?.version ?? pkg?.latest ?? "unknown",
        advisories: vulnerabilityEntries,
      });
    }
  });

  const reportVulnerabilities = Array.isArray(report?.vulnerabilities)
    ? report.vulnerabilities.map((v) => ({
        package: v.package,
        advisoryUrl: v.url,
        affectedRanges: v.versions,
      }))
    : [];

  return { vulnerablePackages, reportVulnerabilities };
}

function reportFlutterFindings(summary) {
  console.log("\nFlutter package security posture:");
  console.log("-------------------------------");
  if (!summary.vulnerablePackages.length && !summary.reportVulnerabilities.length) {
    console.log("No known vulnerabilities reported by pub.dev for direct dependencies.");
    return;
  }

  summary.vulnerablePackages.forEach((pkg) => {
    console.log(` • ${pkg.package} ${pkg.current} (latest ${pkg.latest}) flagged as vulnerable.`);
    if (pkg.advisories?.length) {
      pkg.advisories.forEach((advisory) => {
        if (typeof advisory === "string") {
          console.log(`   ↳ ${advisory}`);
        } else {
          if (advisory.title) {
            console.log(`   ↳ ${advisory.title}`);
          }
          if (advisory.url) {
            console.log(`   ↳ Advisory: ${advisory.url}`);
          }
        }
      });
    }
  });

  summary.reportVulnerabilities.forEach((entry) => {
    console.log(` • ${entry.package} impacted in ranges: ${entry.affectedRanges?.join?.(", ") ?? "unknown"}`);
    if (entry.advisoryUrl) {
      console.log(`   ↳ Advisory: ${entry.advisoryUrl}`);
    }
  });
}

async function runFlutterAudit(directory) {
  const flutterAvailable = await commandExists("flutter");
  if (!flutterAvailable) {
    const message = "Flutter SDK not available — install Flutter before running dependency audits.";
    if (isCI) {
      throw new Error(message);
    }
    console.warn(message);
    return { skipped: true };
  }

  const args = ["pub", "outdated", "--json", "--mode=null-safety", "--no-dev-dependencies"];
  const { stdout } = await runCommand("flutter", args, { cwd: directory, maxBuffer: 16 * 1024 * 1024 });

  let parsed;
  try {
    parsed = JSON.parse(stdout);
  } catch (error) {
    console.error("Failed to parse Flutter outdated --json output. Raw output follows:");
    console.error(stdout);
    throw error;
  }

  const summary = summariseFlutterOutdated(parsed);
  reportFlutterFindings(summary);
  return summary;
}

function hasBlockingVulnerabilities(results, threshold) {
  const thresholdIndex = SEVERITY_ORDER.indexOf(threshold);
  return results.some((summary) => {
    if (!summary || !summary.bySeverity) {
      return false;
    }
    return SEVERITY_ORDER.some((level, index) => {
      if (index > thresholdIndex) {
        return false;
      }
      return (summary.bySeverity[level] ?? 0) > 0;
    });
  });
}

async function main() {
  const projectRoot = process.cwd();
  const backendDir = path.join(projectRoot, "backend-nodejs");
  const frontendDir = path.join(projectRoot, "frontend-reactjs");
  const flutterDir = path.join(projectRoot, "flutter-phoneapp");

  const npmSummaries = [];
  npmSummaries.push(await runNpmAudit("Backend", backendDir));
  npmSummaries.push(await runNpmAudit("Frontend", frontendDir));

  const flutterSummary = await runFlutterAudit(flutterDir);

  const hasFailingSeverity = hasBlockingVulnerabilities(npmSummaries, failOnSeverity);
  const hasFlutterIssues = flutterSummary.skipped ? false : (flutterSummary.vulnerablePackages?.length ?? 0) > 0 || (flutterSummary.reportVulnerabilities?.length ?? 0) > 0;

  if (hasFailingSeverity || hasFlutterIssues) {
    console.error(`\nSecurity audit detected vulnerabilities at or above the ${failOnSeverity.toUpperCase()} threshold. See details above.`);
    process.exit(1);
  }

  console.log(`\nSecurity audit completed with no ${failOnSeverity.toUpperCase()} (or higher) issues detected.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
