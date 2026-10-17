/**
 * Giải mã ngược (reverse geocode) toạ độ làng nghề để biết ĐIỂM ĐÓ THẬT RA NẰM Ở ĐÂU.
 *
 * Vì sao cần: tìm kiếm theo tên có thể khớp nhầm vào trường học / tuyến đường trùng tên.
 * Giải mã ngược thì khách quan — nó trả lời đúng câu hỏi "ghim này đang cắm ở chỗ nào?".
 *
 * Chạy: node scripts/reverse-check-village-coords.mjs [duong-dan-toa-do.json]
 *   - Không truyền tham số: đọc toạ độ hiện có trong data/craftVillages.ts
 *   - Truyền file JSON dạng [{ slug, lat, lng }]: kiểm tra bộ toạ độ đề xuất
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const DATA_FILE = path.join(ROOT, 'data', 'craftVillages.ts');
const UA = 'LangThang-HanoiCraftVillages/1.0 (reverse coordinate check; contact: admin@langthang.local)';

/**
 * Địa danh mà ghim PHẢI nằm trong đó.
 *
 * Sau cuộc sáp nhập đơn vị hành chính năm 2025, nhiều xã/phường mang tên mới, nên mỗi
 * làng nhận cả tên cũ (để đối chiếu với dữ liệu của dự án) lẫn tên đơn vị hành chính mới
 * (để đối chiếu với bản đồ đang hiển thị cho người dùng).
 * Không đưa tên một địa danh khác vào đây chỉ để cho bài kiểm tra đạt. */
const EXPECT = {
  'bat-trang': ['bát tràng'],
  'van-phuc': ['vạn phúc', 'hà đông'],
  'phu-vinh': ['phú vinh', 'phú nghĩa'],
  'chuong': ['chuông', 'thanh oai'],
  'kieu-ky': ['kiêu kỵ', 'gia lâm'],
  'dao-thuc': ['đào thục', 'thụy lâm', 'thư lâm'],
  'tay-tuu': ['tây tựu'],
  'xuan-la': ['xuân la', 'phượng dực'],
  'quang-phu-cau': ['quảng phú cầu', 'ứng thiên'],
  'chuyen-my': ['chuôn ngọ', 'chuyên mỹ'],
  'ha-thai': ['hạ thái', 'duyên thái', 'nam phù', 'hồng vân'],
  'son-dong': ['sơn đồng'],
  'trach-xa': ['trạch xá', 'hòa lâm', 'hoà lâm', 'ứng hòa', 'ứng hoà'],
  'thach-xa': ['thạch xá', 'tây phương'],
  'chang-son': ['chàng sơn', 'tây phương', 'thạch thất'],
  'me-tri': ['mễ trì'],
};

function parseVillages(source) {
  const villages = [];
  const blockRe = /\{\s*\r?\n\s*id:\s*'([^']+)',\s*\r?\n\s*slug:\s*'([^']+)',[\s\S]*?\r?\n\s*name:\s*'([^']+)',/g;
  const coordRe = /coordinates:\s*\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\]/;

  const starts = [];
  let m;
  while ((m = blockRe.exec(source)) !== null) {
    starts.push({ index: m.index, slug: m[2], name: m[3] });
  }
  starts.forEach((start, i) => {
    const end = i + 1 < starts.length ? starts[i + 1].index : source.length;
    const chunk = source.slice(start.index, end);
    const coord = coordRe.exec(chunk);
    if (!coord) return;
    villages.push({ slug: start.slug, name: start.name, lat: Number(coord[1]), lng: Number(coord[2]) });
  });
  return villages;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function reverse(lat, lng, attempt = 1) {
  const url =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&addressdetails=1&lat=${lat}&lon=${lng}`;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
    const data = await res.json();
    return data && data.display_name ? { label: data.display_name, address: data.address ?? {} } : null;
  } catch (error) {
    if (attempt < 4) {
      await sleep(5000 * attempt);
      return reverse(lat, lng, attempt + 1);
    }
    throw error;
  }
}

async function main() {
  const argPath = process.argv[2];
  let villages;
  if (argPath) {
    const raw = JSON.parse(await readFile(path.resolve(argPath), 'utf8'));
    villages = raw.map((row) => ({
      slug: row.slug,
      name: row.name ?? row.slug,
      lat: Number(row.lat),
      lng: Number(row.lng),
    }));
    console.log(`Kiểm tra bộ toạ độ đề xuất: ${argPath}\n`);
  } else {
    villages = parseVillages(await readFile(DATA_FILE, 'utf8'));
    console.log(`Kiểm tra toạ độ hiện có trong data/craftVillages.ts\n`);
  }

  let matched = 0;

  for (const village of villages) {
    await sleep(1200);
    let hit = null;
    try {
      hit = await reverse(village.lat, village.lng);
    } catch (error) {
      console.log(`${village.slug}\tLỖI: ${error.message}`);
      continue;
    }

    const expected = EXPECT[village.slug] ?? [];
    const haystack = hit
      ? `${hit.label} ${Object.values(hit.address).join(' ')}`.toLowerCase()
      : '';
    const ok = expected.length === 0 ? Boolean(hit) : expected.some((needle) => haystack.includes(needle));
    if (ok) matched += 1;

    console.log(
      [
        ok ? 'ĐÚNG' : 'SAI ',
        village.slug.padEnd(15),
        `${village.lat}, ${village.lng}`.padEnd(22),
        hit ? hit.label.split(',').slice(0, 4).join(',') : '(không có địa chỉ)',
      ].join('  ')
    );
  }

  console.log(`\n${matched}/${villages.length} ghim nằm đúng địa danh mong đợi.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
