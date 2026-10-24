import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const root = process.cwd();
const index = join(root, 'index.html');
const template = join(root, 'index.source.html');

const current = await readFile(index, 'utf8').catch(() => null);
const source = await readFile(template, 'utf8').catch(() => null);

if (!current) {
  if (!source) {
    console.error('Missing both index.html and index.source.html.');
    process.exit(1);
  }
  await writeFile(index, source);
  console.log('Created index.html from index.source.html.');
} else if (current.includes('/src/main.tsx')) {
  // Keep the canonical copy current when the development entry is edited.
  if (current !== source) {
    await writeFile(template, current);
    console.log('Updated index.source.html from the development entry.');
  }
} else {
  if (!source) {
    console.error('index.html is a production build and index.source.html is missing.');
    process.exit(1);
  }
  await writeFile(index, source);
  console.log('Restored the development index.html from index.source.html.');
}
