#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const frontendDir = path.join(repoRoot, 'frontend-reactjs');
const distDir = path.join(frontendDir, 'dist-analyze');
const statsFile = path.join(distDir, 'bundle-stats.json');

async function runAnalysis() {
  await fs.rm(distDir, { recursive: true, force: true });

  await new Promise((resolve, reject) => {
    const child = spawn(
      'npm',
      ['run', 'build', '--', '--mode', 'production', '--config', 'vite.analyze.config.js'],
      {
        cwd: frontendDir,
        env: { ...process.env, ANALYZE_BUNDLE: 'true', ANALYZE_OUT_DIR: 'dist-analyze' },
        stdio: 'inherit'
      }
    );

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`npm run build exited with status ${code}`));
      }
    });
  });

  const statsRaw = await fs.readFile(statsFile, 'utf8');
  const stats = JSON.parse(statsRaw);

  const chunks = Array.isArray(stats?.chunks) ? stats.chunks : [];
  const entryChunks = chunks.filter((chunk) => chunk.isEntry);
  const maplibreInEntries = entryChunks.filter((chunk) => {
    const modules = chunk.modules || {};
    return Object.keys(modules).some((id) => id.includes('node_modules/maplibre-gl'));
  });

  if (maplibreInEntries.length > 0) {
    const files = maplibreInEntries.map((chunk) => chunk.file || chunk.id).join(', ');
    throw new Error(`MapLibre must be isolated from entry bundles but was found in: ${files}`);
  }

  const bannedPatterns = ['@mapbox/mapbox-gl-draw', '@turf/'];
  const bannedMatches = new Set();

  chunks.forEach((chunk) => {
    const modules = chunk.modules || {};
    Object.keys(modules).forEach((id) => {
      if (bannedPatterns.some((pattern) => id.includes(pattern))) {
        bannedMatches.add(id);
      }
    });
  });

  if (bannedMatches.size > 0) {
    throw new Error(
      `Deprecated geospatial packages detected in the bundle: ${Array.from(bannedMatches).join(', ')}`
    );
  }

  console.log('Bundle analysis complete: MapLibre isolated and legacy geospatial packages removed.');
}

runAnalysis().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
