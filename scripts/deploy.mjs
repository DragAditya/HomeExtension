import { execSync } from 'node:child_process';
import { cp, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();

console.log('Building the extension…');
execSync('npm run build', { cwd: root, stdio: 'inherit' });

const dist = join(root, 'dist');
const entries = await readdir(dist);
for (const entry of entries) {
  const from = join(dist, entry);
  const to = join(root, entry);
  await rm(to, { recursive: true, force: true });
  await cp(from, to, { recursive: true });
  console.log(`Deployed ${entry}`);
}

console.log('The unpacked extension root is ready. Reload it from chrome://extensions.');
