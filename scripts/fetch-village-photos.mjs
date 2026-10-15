#!/usr/bin/env node
/**
 * fetch-village-photos.mjs
 * ------------------------------------------------------------------
 * Tìm và tải ảnh THẬT (giấy phép tự do) từ Wikimedia Commons cho từng
 * làng nghề, lưu vào public/images/villages/<slug>/ và in ra manifest
 * (tiêu đề, tác giả, giấy phép, URL gốc) để ghi nguồn vào data.
 *
 * Cách dùng:
 *   node scripts/fetch-village-photos.mjs search              # chỉ liệt kê ứng viên theo từ khoá
 *   node scripts/fetch-village-photos.mjs pins                # tải danh sách ảnh đã tuyển chọn (PINS)
 *   node scripts/fetch-village-photos.mjs pins bat-trang      # chỉ tải cho 1 làng
 *   node scripts/fetch-village-photos.mjs search-x <từ khoá>  # tra cứu nhanh 1 từ khoá
 *
 * Không dùng ảnh do AI tạo — chỉ ảnh chụp thật có giấy phép CC/Public Domain.
 */

import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT_ROOT = path.join(ROOT, 'public', 'images', 'villages');
const MANIFEST = path.join(ROOT, 'scripts', 'photo-manifest.json');
const API = 'https://commons.wikimedia.org/w/api.php';

// slug làng nghề -> danh sách từ khoá tìm kiếm (ưu tiên tiếng Việt + tiếng Anh)
const VILLAGES = {
  'bat-trang': ['Bát Tràng ceramic', 'Bat Trang pottery', 'Bat Trang ceramic village'],
  'van-phuc': ['Vạn Phúc silk', 'Van Phuc silk weaving', 'Hà Đông silk'],
  'phu-vinh': ['Phú Vinh bamboo', 'bamboo and rattan weaving Vietnam', 'mây tre đan'],
  'chuong': ['nón lá Vietnam', 'conical hat Vietnam', 'làng Chuông nón', 'nón quai thao'],
  'kieu-ky': ['gold leaf Vietnam', 'Kiêu Kỵ', 'dát vàng quỳ', 'goldbeating'],
  'dao-thuc': ['water puppetry Vietnam', 'múa rối nước', 'water puppet theatre'],
  'tay-tuu': ['Tây Tựu flower', 'flower field Hanoi', 'flower village Vietnam'],
  'xuan-la': ['tò he', 'toy figurine dough Vietnam', 'Phú Xuyên'],
  'quang-phu-cau': ['Quảng Phú Cầu incense', 'incense sticks Vietnam', 'làng hương'],
  'chuyen-my': ['khảm trai', 'mother of pearl inlay Vietnam', 'Chuôn Ngọ', 'xà cừ'],
  'ha-thai': ['sơn mài', 'Vietnamese lacquerware', 'lacquer painting Vietnam'],
  'son-dong': ['Sơn Đồng wood carving', 'wood carving Buddhist Vietnam', 'tạc tượng'],
  'trach-xa': ['áo dài', 'ao dai Vietnam', 'Vietnamese traditional dress'],
  'thach-xa': ['chuồn chuồn tre', 'bamboo dragonfly', 'Thạch Xá'],
  'chang-son': ['quạt giấy', 'hand fan Vietnam', 'Chàng Sơn fan'],
  'me-tri': ['cốm', 'green rice flakes Vietnam', 'cốm Hà Nội'],
};

// Đã xem xét & tuyển chọn thủ công từ Commons: tiêu đề gốc -> tên file lưu cục bộ.
const PINS = {
  'bat-trang': [['Đường phố xã Bát Tràng, Gia Lâm, Hà Nội.jpg', 'street_view.jpg']],
  'van-phuc': [
    ['Silk weaving, 2003 Ha Dong.jpg', 'silk_weaving_1.jpg'],
    ['Silk weaving, 2003 Ha Dong 3.jpg', 'silk_weaving_2.jpg'],
    ['Silk weaving, 2003 Ha Dong 9.jpg', 'silk_weaving_3.jpg'],
  ],
  'phu-vinh': [
    ['Bamboo and rattan village Phu Vinh,Chuong My,Ha Noi,Viet Nam.jpg', 'village.jpg'],
    ['Handicraft products in Phu Vinh bamboo and rattan village,VietNam.jpg', 'products_1.jpg'],
    ['Handicraft products in Phu Vinh bamboo and rattan village, Ha Noi, Viet Nam.jpg', 'products_2.jpg'],
  ],
  'chuong': [
    ['Conical hat, Viet, Thanh Oai, Hanoi, 1999, palm leaves with bamboo frame - Vietnamese Women\u0027s Museum - Hanoi, Vietnam - DSC03996.JPG', 'thanh_oai_museum.jpg'],
    ['Nón quai thao.jpg', 'non_quai_thao.jpg'],
    ['Vietnamese conical hat nonla.jpg', 'non_la_vietnam.jpg'],
  ],
  'kieu-ky': [
    ['Hammering Gold Leaf.jpg', 'gold_leaf_hammering.jpg'],
    ['Gold Leaf Close Up.jpg', 'gold_leaf_closeup.jpg'],
  ],
  'dao-thuc': [
    ['Water-Puppet-Show5.jpg', 'puppet_show2.jpg'],
    ['Performers-of-Water-Puppet-Show.jpg', 'performers.jpg'],
    ['Nguoi chan trau trong mua roi nuoc.jpg', 'buffalo_puppet.jpg'],
  ],
  'tay-tuu': [
    ['Flower market - Hanoi, Vietnam - DSC03681.JPG', 'flower_market_hanoi.jpg'],
    ['Flower vender, Hanoi (37608462635).jpg', 'flower_vendor.jpg'],
    ['Flower display - Hanoi, Vietnam - DSC03494.JPG', 'flower_display.jpg'],
  ],
  'xuan-la': [
    ['To he Vietnam.jpg', 'to_he_vietnam.jpg'],
    ['Making a "tò he".JPG', 'making_to_he.jpg'],
    ['Tò he 1.JPG', 'to_he_1.jpg'],
  ],
  'quang-phu-cau': [
    ['Incense in Vietnam.jpg', 'incense_vietnam.jpg'],
    ['Drying incense 26.jpg', 'drying_incense_2.jpg'],
    ['Drying incense 33.jpg', 'drying_incense_3.jpg'],
  ],
  'chuyen-my': [
    ['Screen, Nguyen dynasty, 1890, wood with mother of pearl inlay, view 1 - National Museum of Vietnamese History - Hanoi, Vietnam - DSC05606.JPG', 'inlay_screen_1890.jpg'],
    ['Picture, Nguyen dynasty, 19th to early 20th century, wood with mother of pearl inlay - National Museum of Vietnamese History - Hanoi, Vietnam - DSC05615.JPG', 'inlay_picture_museum.jpg'],
    ['Sập khảm trai.jpg', 'sap_kham_trai.jpg'],
  ],
  'ha-thai': [
    ['Lacquered box - Vietnam National Museum of Fine Arts - Hanoi, Vietnam - DSC05256.JPG', 'lacquer_box2.jpg'],
    ['Roc kings, Kien Xuong district, Thai Binh province, 18th century AD, lacquered wood - Vietnam National Museum of Fine Arts - Hanoi, Vietnam - DSC05096.JPG', 'lacquer_roc.jpg'],
    ['Case containing royal ordinance, Nguyen dynasty, late 19th to early 20th century, lacquered wood - Museum of Vietnamese History - Ho Chi Minh City - DSC05950.JPG', 'lacquer_case.jpg'],
  ],
  'son-dong': [
    ['Statue of Shakyamuni on the snowy mountain, Tây Phương Pagoda, Hà Tây Province (1794), Vietnam National Museum of Fine Arts, Hanoi, Vietnam - 20131030.JPG', 'tay_phuong_statue.jpg'],
    ['Attendant to Buddha, wood - Vietnam National Museum of Fine Arts - Hanoi, Vietnam - DSC04879.JPG', 'attendant_buddha.jpg'],
    ['La Hán chùa Tây Phương.JPG', 'la_han_tay_phuong.jpg'],
  ],
  'trach-xa': [
    ['Vietnamese girl wearing ao dai.jpg', 'ao_dai_3.jpg'],
    ['Áo dài trắng 2015-01-26.jpg', 'ao_dai_trang.jpg'],
    ['Áo dài dancers.jpg', 'ao_dai_dancers.jpg'],
  ],
  'thach-xa': [
    ['Chùa Tây Phương 2.JPG', 'pagoda_2.jpg'],
    ['Tây Phương Pagoda - 03.jpg', 'pagoda_3.jpg'],
    ['Thập Bát La Hán - Chùa tây Phương - La Hán Cười.jpg', 'la_han.jpg'],
  ],
  'chang-son': [
    ['Hanoï - Promenade du Dragon, rue des Éventails.jpg', 'hanoi_fan_street.jpg'],
    ['Temple on Hàng Quạt Street.jpg', 'hang_quat_temple.jpg'],
  ],
  'me-tri': [['Banh com (Vietnam).JPG', 'banh_com_vietnam.jpg']],
};

const OK_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const STOP = new Set(['la', 'vietnam', 'viet', 'nam', 'the', 'and', 'of', 'in', 'at', 'village', 'lang', 'xa', 'huyen']);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function fold(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\u0111/g, 'd');
}

/** Ảnh chỉ được nhận nếu tiêu đề/mô tả thực sự chứa một từ khoá đáng kể của truy vấn. */
function isRelevant(img, query) {
  const hay = fold(`${img.title} ${img.description}`);
  const keys = fold(query)
    .split(/\s+/)
    .map((w) => w.replace(/[^a-z0-9]/g, ''))
    .filter((w) => w.length >= 4 && !STOP.has(w));
  return keys.some((k) => hay.includes(k));
}

async function api(params) {
  const url = new URL(API);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  for (let attempt = 0; attempt < 5; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': 'HanoiCraftVillages/1.0 (educational project)' } });
    if (res.status === 429) {
      await sleep(2500 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new Error(`Commons API ${res.status}`);
    return res.json();
  }
  throw new Error('Commons API 429 (hết lượt thử lại)');
}

async function search(query, limit = 12) {
  const data = await api({
    action: 'query',
    generator: 'search',
    gsrsearch: query,
    gsrnamespace: '6',
    gsrlimit: String(limit),
    prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata',
    iiurlwidth: '1600',
    format: 'json',
  });
  const pages = data?.query?.pages;
  if (!pages) return [];
  return Object.values(pages)
    .map((p) => {
      const info = p.imageinfo?.[0];
      if (!info) return null;
      const meta = info.extmetadata || {};
      const clean = (s) => (s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      return {
        title: p.title.replace(/^File:/, ''),
        width: info.width,
        height: info.height,
        mime: info.mime,
        thumburl: info.thumburl,
        descriptionurl: info.descriptionurl,
        author: clean(meta.Artist?.value) || 'Không rõ',
        license: clean(meta.LicenseShortName?.value) || 'Xem trang gốc',
        description: clean(meta.ImageDescription?.value).slice(0, 220),
      };
    })
    .filter(Boolean);
}

function isUsable(img) {
  if (!OK_MIME.has(img.mime)) return false;
  if (!img.width || !img.height) return false;
  if (img.width < 900) return false;
  const ratio = img.width / img.height;
  return ratio > 0.6 && ratio < 2.1; // bỏ ảnh quá dài/dọc
}

function sanitize(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'photo';
}

async function collect(slug) {
  const seen = new Map();
  for (const q of VILLAGES[slug]) {
    let results = [];
    try {
      results = await search(q);
    } catch (e) {
      console.error(`  ! lỗi tìm "${q}": ${e.message}`);
      continue;
    }
    for (const img of results) {
      if (!isUsable(img)) continue;
      if (!isRelevant(img, q)) continue;
      if (!seen.has(img.title)) seen.set(img.title, { ...img, query: q });
    }
    await sleep(1300);
  }
  return [...seen.values()];
}

async function download(slug, candidates) {
  const dir = path.join(OUT_ROOT, slug);
  await mkdir(dir, { recursive: true });
  const existing = new Set();
  if (existsSync(MANIFEST)) {
    try {
      const prev = JSON.parse(await readFile(MANIFEST, 'utf8'));
      for (const e of prev[slug] || []) if (e.file) existing.add(e.file);
    } catch {}
  }
  const saved = [];
  for (const img of candidates) {
    let file = sanitize(img.title) + (img.mime === 'image/png' ? '.png' : '.jpg');
    if (existing.has(file)) {
      saved.push({ ...img, file, skipped: true });
      continue;
    }
    try {
      let buf;
      for (let attempt = 0; attempt < 4; attempt++) {
        const res = await fetch(img.thumburl, { headers: { 'User-Agent': 'HanoiCraftVillages/1.0' } });
        if (res.status === 429) { await sleep(2500 * (attempt + 1)); continue; }
        if (!res.ok) throw new Error(String(res.status));
        buf = Buffer.from(await res.arrayBuffer());
        break;
      }
      if (!buf) throw new Error('429 khi tải ảnh');
      if (buf.length < 8000) throw new Error('ảnh quá nhỏ');
      await writeFile(path.join(dir, file), buf);
      saved.push({ ...img, file, bytes: buf.length });
      console.log(`  + ${slug}/${file} (${Math.round(buf.length / 1024)} KB) — ${img.license}`);
    } catch (e) {
      console.error(`  ! bỏ qua ${img.title}: ${e.message}`);
    }
    await sleep(900);
  }
  return saved;
}

async function infoByTitle(title) {
  const data = await api({
    action: 'query',
    titles: `File:${title}`,
    prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata',
    iiurlwidth: '1600',
    format: 'json',
  });
  const page = Object.values(data?.query?.pages || {})[0];
  if (!page || page.missing !== undefined || !page.imageinfo?.[0]) return null;
  const info = page.imageinfo[0];
  const meta = info.extmetadata || {};
  const clean = (s) => (s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return {
    title: page.title.replace(/^File:/, ''),
    width: info.width,
    height: info.height,
    mime: info.mime,
    thumburl: info.thumburl,
    descriptionurl: info.descriptionurl,
    author: clean(meta.Artist?.value) || 'Không rõ',
    license: clean(meta.LicenseShortName?.value) || 'Xem trang gốc',
    description: clean(meta.ImageDescription?.value).slice(0, 220),
  };
}

async function runPins(only, manifest) {
  const slugs = only ? [only] : Object.keys(PINS);
  for (const slug of slugs) {
    const pins = PINS[slug];
    if (!pins) throw new Error(`Không có ảnh tuyển chọn cho: ${slug}`);
    console.log(`\n=== ${slug} ===`);
    const dir = path.join(OUT_ROOT, slug);
    await mkdir(dir, { recursive: true });
    manifest[slug] = manifest[slug] || [];
    for (const [title, file] of pins) {
      try {
        const img = await infoByTitle(title);
        if (!img) throw new Error('không tìm thấy trên Commons');
        let buf;
        for (let attempt = 0; attempt < 4; attempt++) {
          const res = await fetch(img.thumburl, { headers: { 'User-Agent': 'HanoiCraftVillages/1.0' } });
          if (res.status === 429) { await sleep(2500 * (attempt + 1)); continue; }
          if (!res.ok) throw new Error(String(res.status));
          buf = Buffer.from(await res.arrayBuffer());
          break;
        }
        if (!buf) throw new Error('429 khi tải ảnh');
        if (buf.length < 8000) throw new Error('ảnh quá nhỏ');
        await writeFile(path.join(dir, file), buf);
        manifest[slug] = manifest[slug].filter((e) => e.file !== file);
        manifest[slug].push({ ...img, file, bytes: buf.length });
        console.log(`  + ${file} (${Math.round(buf.length / 1024)} KB) — ${img.license} — ${img.author}`);
      } catch (e) {
        console.error(`  ! ${file}: ${e.message}`);
      }
      await sleep(900);
    }
  }
  return manifest;
}

async function main() {
  const mode = process.argv[2] || 'search';
  const only = process.argv[3];
  if (mode === 'search-x') {
    const results = await search(only, 20);
    for (const c of results) console.log(`• ${c.title}  [${c.width}x${c.height}]  ${c.license}  — ${c.author}`);
    return;
  }
  let pinsManifest = {};
  if (existsSync(MANIFEST)) {
    try { pinsManifest = JSON.parse(await readFile(MANIFEST, 'utf8')); } catch {}
  }
  if (mode === 'pins') {
    pinsManifest = await runPins(only, pinsManifest);
    await writeFile(MANIFEST, JSON.stringify(pinsManifest, null, 2));
    console.log(`\nManifest: ${path.relative(ROOT, MANIFEST)}`);
    return;
  }
  const slugs = only ? [only] : Object.keys(VILLAGES);
  let manifest = {};
  if (existsSync(MANIFEST)) {
    try { manifest = JSON.parse(await readFile(MANIFEST, 'utf8')); } catch {}
  }
  for (const slug of slugs) {
    if (!VILLAGES[slug]) throw new Error(`Không biết làng nghề: ${slug}`);
    console.log(`\n=== ${slug} ===`);
    const candidates = await collect(slug);
    console.log(`  ${candidates.length} ảnh đạt chuẩn`);
    if (mode === 'search') {
      for (const c of candidates) {
        console.log(`  • ${c.title}  [${c.width}x${c.height}]  ${c.license}  — ${c.author}`);
      }
      continue;
    }
    manifest[slug] = await download(slug, candidates);
  }
  if (mode !== 'search') {
    await writeFile(MANIFEST, JSON.stringify(manifest, null, 2));
    console.log(`\nManifest: ${path.relative(ROOT, MANIFEST)}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
