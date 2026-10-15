#!/usr/bin/env node
/** Kiểm tra: mọi file trong photo-manifest.json có thật trên đĩa, và mọi ảnh
 *  được tham chiếu trong data/craftVillages.ts đều tồn tại. */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const manifest = JSON.parse(readFileSync(path.join(ROOT, 'scripts', 'photo-manifest.json'), 'utf8'));
const data = readFileSync(path.join(ROOT, 'data', 'craftVillages.ts'), 'utf8');

let bad = 0;
let manifestCount = 0;
for (const [slug, entries] of Object.entries(manifest)) {
  for (const e of entries) {
    if (!e.file) continue;
    manifestCount++;
    const p = path.join(ROOT, 'public', 'images', 'villages', slug, e.file);
    if (!existsSync(p)) {
      console.log(`THIẾU (manifest): ${slug}/${e.file}`);
      bad++;
    }
  }
}

const refs = [...data.matchAll(/url: '(\/images\/[^']+)'/g)].map((m) => m[1]);
const galleryCounts = {};
const seen = new Set();
for (const r of refs) {
  if (seen.has(r)) continue;
  seen.add(r);
  const p = path.join(ROOT, 'public', r);
  if (!existsSync(p)) {
    console.log(`THIẾU (data): ${r}`);
    bad++;
  }
  const parts = r.split('/');
  const slug = parts[3];
  galleryCounts[slug] = (galleryCounts[slug] || 0) + 1;
}

console.log(`\nmanifest entries: ${manifestCount} | ảnh data tham chiếu (unique): ${seen.size} | lỗi: ${bad}`);
console.log('\nSố ảnh tham chiếu / làng:');
for (const [s, n] of Object.entries(galleryCounts).sort((a, b) => a[1] - b[1])) {
  const onDisk = readdirSync(path.join(ROOT, 'public', 'images', 'villages', s)).length;
  console.log(`  ${s.padEnd(16)} data=${String(n).padStart(2)}  onDisk=${onDisk}`);
}
process.exit(bad ? 1 : 0);
