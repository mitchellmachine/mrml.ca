import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, existsSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const source = process.argv[2] ?? '../mrml';
const git = (...args) => execFileSync('git', ['-C', source, ...args]);
const revision = git('rev-parse', 'HEAD').toString().trim();
const isDocument = path => /^(README\.md|VALUES\.md|LICENSE)$/.test(path)
  || /^docs\/(?!.*\/probes\/)(?!machine\/)[a-z0-9_./-]+\.md$/i.test(path) && !path.split('/').includes('..');
const paths = git('ls-tree', '-r', '--name-only', '-z', revision, 'docs', 'README.md', 'VALUES.md', 'LICENSE')
  .toString().split('\0').filter(isDocument);
if (!paths.includes('docs/human/OVERVIEW.md') || !paths.includes('LICENSE')) {
  throw new Error('Expected the MRML documentation and license');
}

const manifest = 'content/snapshot.json';
if (existsSync(manifest)) {
  const previous = JSON.parse(readFileSync(manifest, 'utf8'));
  for (const path of previous.paths) {
    const output = join('content', path);
    if (isDocument(path) && !paths.includes(path) && existsSync(output)) unlinkSync(output);
  }
}
for (const path of paths) {
  const destination = join('content', path);
  mkdirSync(dirname(destination), { recursive: true });
  writeFileSync(destination, git('show', `${revision}:${path}`));
}
writeFileSync(manifest, JSON.stringify({ revision, paths }, null, 2) + '\n');
console.log(`Imported ${paths.length - 1} Markdown documents from ${revision}`);

