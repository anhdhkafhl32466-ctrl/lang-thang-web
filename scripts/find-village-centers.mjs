/**
 * Tra tâm LÀNG THẬT từ OpenStreetMap qua Overpass API.
 *
 * Vì sao dùng Overpass thay vì tìm kiếm theo tên: Overpass trả về đúng đối tượng
 * địa lý (place=village|hamlet|neighbourhood), nên không bị khớp nhầm vào trường học,
 * tuyến đường hay trạm xăng trùng tên.
 *
 * Chạy: node scripts/find-village-centers.mjs
 */

import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const OVERPASS = 'https://overpass-api.de/api/interpreter';
const UA = 'LangThang-HanoiCraftVillages/1.0 (coordinate research; contact: admin@langthang.local)';

/** Khung bao vùng Hà Nội + vành đai (đủ rộng cho cả Đào Thục, Chàng Sơn, Phú Xuyên). */
const BBOX = '20.40,105.20,21.50,106.10';

/** Tên làng cần tra, kèm bí danh thường gặp trong dữ liệu bản đồ. */
const VILLAGES = [
  { slug: 'bat-trang', terms: ['Bát Tràng'] },
  { slug: 'van-phuc', terms: ['Vạn Phúc'] },
  { slug: 'phu-vinh', terms: ['Phú Vinh'] },
  { slug: 'chuong', terms: ['Chuông'] },
  { slug: 'kieu-ky', terms: ['Kiêu Kỵ'] },
  { slug: 'dao-thuc', terms: ['Đào Thục'] },
  { slug: 'tay-tuu', terms: ['Tây Tựu'] },
  { slug: 'xuan-la', terms: ['Xuân La'] },
  { slug: 'quang-phu-cau', terms: ['Quảng Phú Cầu'] },
  { slug: 'chuyen-my', terms: ['Chuôn Ngọ', 'Chuyên Mỹ'] },
  { slug: 'ha-thai', terms: ['Hạ Thái'] },
  { slug: 'son-dong', terms: ['Sơn Đồng'] },
  { slug: 'trach-xa', terms: ['Trạch Xá'] },
  { slug: 'thach-xa', terms: ['Thạch Xá'] },
  { slug: 'chang-son', terms: ['Chàng Sơn'] },
  { slug: 'me-tri', terms: ['Mễ Trì'] },
];

function buildQuery(terms) {
  // Khớp chính xác theo từng tên để tránh bắt nhầm các địa danh chứa cùng chuỗi.
  const nameRegex = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  const placeFilter = '^(village|hamlet|neighbourhood|quarter|suburb|isolated_dwelling|town)$';
  return `[out:json][timeout:90];
(
  node["place"~"${placeFilter}"]["name"~"^(${nameRegex})$"](${BBOX});
  way["place"~"${placeFilter}"]["name"~"^(${nameRegex})$"](${BBOX});
);
out center tags;`;
}

async function overpass(ql) {
  const res = await fetch(OVERPASS, {
    method: 'POST',
    headers: { 'User-Agent': UA, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'data=' + encodeURIComponent(ql),
  });
  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`);
  return res.json();
}

async function main() {
  const collected = {};

  for (const village of VILLAGES) {
    const ql = buildQuery(village.terms);
    let data;
    try {
      data = await overpass(ql);
    } catch (error) {
      console.log(`${village.slug}\tLỖI: ${error.message}`);
      continue;
    }

    const rows = (data.elements ?? []).map((el) => ({
      name: el.tags?.name,
      place: el.tags?.place,
      lat: el.lat ?? el.center?.lat,
      lng: el.lon ?? el.center?.lon,
      admin: el.tags?.['addr:district'] || el.tags?.['addr:city'] || '',
      type: el.type,
    }));

    collected[village.slug] = rows;

    console.log(`\n=== ${village.slug} (${village.terms.join(' / ')}) — ${rows.length} điểm ===`);
    rows.forEach((row) => {
      console.log(
        `   ${String(row.name).padEnd(22)} ${row.place.padEnd(15)} ${row.lat.toFixed(5)}, ${row.lng.toFixed(5)}  ${row.type}  ${row.admin}`
      );
    });
  }

  const out = path.resolve(process.cwd(), 'scripts', 'village-centers.json');
  await writeFile(out, JSON.stringify(collected, null, 2), 'utf8');
  console.log(`\nĐã ghi: ${out}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
