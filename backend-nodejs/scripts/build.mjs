import { rm, mkdir, cp, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

const copyTargets = [
  { source: 'src', destination: 'src', recursive: true },
  { source: 'sql', destination: 'sql', recursive: true },
  { source: 'package.json', destination: 'package.json' },
  { source: 'package-lock.json', destination: 'package-lock.json' },
  { source: '.env.example', destination: '.env.example' },
  { source: 'README.md', destination: 'README.md' }
];

async function exists(targetPath) {
  try {
    await stat(targetPath);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') {
      return false;
    }
    throw error;
  }
}

async function ensureDist() {
  await rm(distDir, { recursive: true, force: true });
  await mkdir(distDir, { recursive: true });
}

async function copyAll() {
  for (const { source, destination, recursive } of copyTargets) {
    const from = path.join(projectRoot, source);
    const to = path.join(distDir, destination);

    if (!(await exists(from))) {
      console.warn(`[build] Skipping missing path: ${source}`);
      continue;
    }

    await cp(from, to, { recursive: recursive ?? false });
    console.log(`[build] Copied ${source} -> dist/${destination}`);
  }
}

async function main() {
  console.log('[build] Creating dist directory...');
  await ensureDist();
  await copyAll();
  console.log('[build] Backend build completed successfully.');
}

main().catch((error) => {
  console.error('[build] Failed to build backend project.');
  console.error(error);
  process.exitCode = 1;
});
