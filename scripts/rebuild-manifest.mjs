#!/usr/bin/env node
/**
 * rebuild-manifest.mjs
 * ------------------------------------------------------------------
 * Dựng lại scripts/photo-manifest.json từ hai nguồn:
 *   1) danh sách PINS trong scripts/fetch-village-photos.mjs (tiêu đề Commons -> file)
 *   2) các file ảnh thực có trên đĩa trong public/images/villages/<slug>/
 *
 * Nhờ vậy credit (tác giả + giấy phép) luôn khớp với ảnh đã tải, kể cả khi
 * manifest bị ghi đè. Tra cứu theo lô 40 tiêu đề/request để tránh bị 429.
 */

import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const SRC = path.join(ROOT, 'scripts', 'fetch-village-photos.mjs');
const MANIFEST = path.join(ROOT, 'scripts', 'photo-manifest.json');
const API = 'https://commons.wikimedia.org/w/api.php';
const UA = 'HanoiCraftVillages/1.0 (educational project; contact: local dev)';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const clean = (s) => (s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

async function apiBatch(titles) {
  const url = new URL(API);
  url.searchParams.set('action', 'query');
  url.searchParams.set('titles', titles.map((t) => `File:${t}`).join('|'));
  url.searchParams.set('prop', 'imageinfo');
  url.searchParams.set('iiprop', 'url|size|mime|extmetadata');
  url.searchParams.set('iiurlwidth', '1600');
  url.searchParams.set('format', 'json');
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.status === 429 || res.status === 503) {
      await sleep(3000 * 2 ** attempt);
      continue;
    }
    if (!res.ok) throw new Error(`Commons API ${res.status}`);
    return res.json();
  }
  throw new Error('Commons API: quá tải');
}

const main = async () => {
  const src = await readFile(SRC, 'utf8');
  const a = src.indexOf('const PINS = {');
  const b = src.indexOf('\nconst OK_MIME');
  const pinsText = src.slice(a + 'const PINS = '.length, b).replace(/;\s*$/, '');
  const PINS = eval(`(${pinsText})`);

  const manifest = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, 'utf8')) : {};
  let added = 0;

  for (const [slug, pins] of Object.entries(PINS)) {
    const dir = path.join(ROOT, 'public', 'images', 'villages', slug);
    const onDisk = new Set(existsSync(dir) ? await readdir(dir) : []);
    const have = new Set((manifest[slug] || []).map((e) => e.file));

    const todo = pins.filter(([, file]) => onDisk.has(file) && !have.has(file));
    if (!todo.length) continue;
    console.log(`\n=== ${slug} (${todo.length} file cần metadata) ===`);

    for (let i = 0; i < todo.length; i += 40) {
      const chunk = todo.slice(i, i + 40);
      let data;
      try {
        data = await apiBatch(chunk.map(([t]) => t));
      } catch (e) {
        console.error(`  ! lỗi tra cứu: ${e.message}`);
        continue;
      }
      const byTitle = new Map();
      for (const p of Object.values(data?.query?.pages || {})) {
        const info = p.imageinfo?.[0];
        if (!info) continue;
        byTitle.set(p.title.replace(/^File:/, ''), info);
      }
      manifest[slug] = manifest[slug] || [];
      for (const [title, file] of chunk) {
        const info = byTitle.get(title);
        if (!info) {
          console.error(`  ! không có metadata: ${title}`);
          continue;
        }
        const meta = info.extmetadata || {};
        manifest[slug] = manifest[slug].filter((e) => e.file !== file);
        manifest[slug].push({
          title,
          width: info.width,
          height: info.height,
          mime: info.mime,
          descriptionurl: info.descriptionurl,
          author: clean(meta.Artist?.value) || 'Không rõ',
          license: clean(meta.LicenseShortName?.value) || 'Xem trang gốc',
          description: clean(meta.ImageDescription?.value).slice(0, 220),
          file,
        });
        added++;
      }
      await sleep(1200);
    }
  }

  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2));
  console.log(`\nĐã bổ sung ${added} metadata vào ${path.relative(ROOT, MANIFEST)}`);
  for (const [k, v] of Object.entries(manifest)) console.log(`  ${k.padEnd(16)} ${v.length}`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
