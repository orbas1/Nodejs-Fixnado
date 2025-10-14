#!/usr/bin/env node
const fs = require('fs/promises');
const path = require('path');

async function main() {
  const root = path.resolve(__dirname, '..');
  const source = path.join(root, 'legal', 'uk_terms.json');
  const targets = [
    path.join(root, 'frontend-reactjs', 'src', 'data', 'legal', 'uk_terms.json'),
    path.join(root, 'flutter-phoneapp', 'assets', 'legal', 'uk_terms.json')
  ];

  const payload = await fs.readFile(source, 'utf8');
  await Promise.all(
    targets.map(async (targetPath) => {
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      await fs.writeFile(targetPath, payload, 'utf8');
    })
  );
  console.log(`Synced legal content to ${targets.length} target(s).`);
}

main().catch((error) => {
  console.error('Failed to synchronise legal content:', error);
  process.exitCode = 1;
});
