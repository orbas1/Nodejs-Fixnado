#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function hashFile(filePath) {
  return fs.readFile(filePath).then((buffer) => {
    const hash = createHash('sha256');
    hash.update(buffer);
    return hash.digest('hex');
  });
}

async function fileStats(filePath) {
  const stats = await fs.stat(filePath);
  return { size: stats.size, modified: stats.mtime.toISOString() };
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

async function readPubspecVersion(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  const match = raw.match(/^version:\s*([^\s#]+)/m);
  return match ? match[1].trim() : 'unknown';
}

async function buildEntry({ name, artifactPath, versionSource, versionReader }) {
  const absoluteArtifactPath = path.resolve(artifactPath);
  const checksum = await hashFile(absoluteArtifactPath);
  const stats = await fileStats(absoluteArtifactPath);

  let version = 'unknown';
  try {
    version = await versionReader(versionSource);
  } catch (error) {
    console.warn(`Failed to read version for ${name} from ${versionSource}:`, error.message);
  }

  return {
    name,
    artifact: path.basename(artifactPath),
    sha256: checksum,
    sizeBytes: stats.size,
    modifiedAt: stats.modified,
    version,
  };
}

async function main() {
  const [outputPath, backendArtifact, frontendArtifact, flutterArtifact] = process.argv.slice(2);

  if (!outputPath || !backendArtifact || !frontendArtifact || !flutterArtifact) {
    console.error('Usage: node scripts/create-rollback-manifest.mjs <output> <backendArtifact> <frontendArtifact> <flutterArtifact>');
    process.exit(1);
  }

  const projectRoot = process.cwd();
  const manifest = {
    generatedAt: new Date().toISOString(),
    commit: process.env.GITHUB_SHA ?? null,
    artefacts: [],
  };

  const backendEntry = await buildEntry({
    name: 'backend-nodejs',
    artifactPath: backendArtifact,
    versionSource: path.join(projectRoot, 'backend-nodejs', 'package.json'),
    versionReader: readJson,
  });
  backendEntry.version = backendEntry.version.version ?? backendEntry.version;

  const frontendEntry = await buildEntry({
    name: 'frontend-reactjs',
    artifactPath: frontendArtifact,
    versionSource: path.join(projectRoot, 'frontend-reactjs', 'package.json'),
    versionReader: readJson,
  });
  frontendEntry.version = frontendEntry.version.version ?? frontendEntry.version;

  const flutterEntry = await buildEntry({
    name: 'flutter-phoneapp',
    artifactPath: flutterArtifact,
    versionSource: path.join(projectRoot, 'flutter-phoneapp', 'pubspec.yaml'),
    versionReader: readPubspecVersion,
  });

  manifest.artefacts.push(backendEntry, frontendEntry, flutterEntry);

  const rollbackSteps = [
    'Download the required artefact from the workflow run and verify the SHA-256 checksum matches this manifest.',
    'Restore the previous environment configuration using `scripts/environment-parity.mjs` to validate tfvars and feature toggles before redeploying.',
    'Redeploy backend artefact by extracting the tarball, running `npm ci --omit=dev`, and restarting the Node service with the stored process manager configuration.',
    'Deploy frontend artefact by publishing the bundled `dist/` directory to the CDN or static hosting bucket, ensuring cache invalidation via the release ticket.',
    'For the Flutter app, distribute the archived APK through the mobile release pipeline (Firebase App Distribution/TestFlight equivalent) and trigger rollback communications.',
    'Update the incident record with the manifest checksum, redeployed artefact version, and confirmation that automated smoke tests completed successfully.',
  ];

  manifest.rollbackPlaybook = rollbackSteps;

  await fs.writeFile(outputPath, JSON.stringify(manifest, null, 2));
  console.log(`Rollback manifest written to ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
