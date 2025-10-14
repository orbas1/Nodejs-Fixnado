import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const sourcePath = resolve(root, 'shared/privacy/privacy_policy_content.json');
const targets = [
  resolve(root, 'frontend-reactjs/src/content/privacy_policy_content.json'),
  resolve(root, 'flutter-phoneapp/assets/legal/privacy_policy_content.json')
];

async function sync() {
  const payload = await readFile(sourcePath, 'utf8');
  const parsed = JSON.parse(payload);

  if (!parsed.meta || !Array.isArray(parsed.sections)) {
    throw new Error('Privacy policy content must include meta and sections');
  }

  await Promise.all(
    targets.map(async (target) => {
      await writeFile(target, `${payload}\n`, 'utf8');
      console.log(`Synced privacy policy to ${target}`);
    })
  );
}

sync().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
