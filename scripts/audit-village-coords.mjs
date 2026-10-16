/**
 * Đối chiếu toạ độ 16 làng nghề đang hardcode trong data/craftVillages.ts
 * với dữ liệu địa lý chuẩn của OpenStreetMap (Nominatim).
 *
 * Vì sao cần: điểm đánh dấu trên bản đồ chỉ đúng khi toạ độ đúng. Script này
 * đo khoảng cách thật (mét) giữa toạ độ trong mã nguồn và vị trí mà bản đồ
 * chuẩn trả về, để không phải "đoán" bằng mắt.
 *
 * Chạy: node scripts/audit-village-coords.mjs [--json duong-dan.json]
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const DATA_FILE = path.join(ROOT, 'data', 'craftVillages.ts');
const UA = 'LangThang-HanoiCraftVillages/1.0 (coordinate audit; contact: admin@langthang.local)';

/** Truy vấn ưu tiên tên LÀNG/THÔN cụ thể thay vì tên xã, để tránh rơi vào trung tâm xã. */
const QUERIES = {
  'bat-trang': ['Bát Tràng, Gia Lâm, Hà Nội', 'Bát Tràng, Hà Nội'],
  'van-phuc': ['Vạn Phúc, Hà Đông, Hà Nội', 'làng lụa Vạn Phúc, Hà Nội'],
  'phu-vinh': ['Phú Vinh, Chương Mỹ, Hà Nội', 'Phú Vinh, Phú Nghĩa, Hà Nội'],
  'chuong': ['làng Chuông, Thanh Oai, Hà Nội', 'Phương Trung, Thanh Oai, Hà Nội'],
  'kieu-ky': ['Kiêu Kỵ, Gia Lâm, Hà Nội', 'Kiêu Kỵ, Hà Nội'],
  'dao-thuc': ['Đào Thục, Đông Anh, Hà Nội', 'Thụy Lâm, Đông Anh, Hà Nội'],
  'tay-tuu': ['Tây Tựu, Bắc Từ Liêm, Hà Nội', 'Tây Tựu, Hà Nội'],
  'xuan-la': ['Xuân La, Phú Xuyên, Hà Nội', 'Phượng Dực, Phú Xuyên, Hà Nội'],
  'quang-phu-cau': ['Quảng Phú Cầu, Ứng Hòa, Hà Nội', 'Quảng Phú Cầu, Hà Nội'],
  'chuyen-my': ['Chuôn Ngọ, Phú Xuyên, Hà Nội', 'Chuyên Mỹ, Phú Xuyên, Hà Nội'],
  'ha-thai': ['Hạ Thái, Thường Tín, Hà Nội', 'Duyên Thái, Thường Tín, Hà Nội'],
  'son-dong': ['Sơn Đồng, Hoài Đức, Hà Nội', 'Sơn Đồng, Hà Nội'],
  'trach-xa': ['Trạch Xá, Ứng Hòa, Hà Nội', 'Hòa Lâm, Ứng Hòa, Hà Nội'],
  'thach-xa': ['Thạch Xá, Thạch Thất, Hà Nội', 'Thạch Xá, Hà Nội'],
  'chang-son': ['Chàng Sơn, Thạch Thất, Hà Nội', 'Chàng Sơn, Hà Nội'],
  'me-tri': ['Mễ Trì, Nam Từ Liêm, Hà Nội', 'Mễ Trì, Hà Nội'],
};

/** Bóc slug / tên / địa chỉ / toạ độ của từng làng từ file dữ liệu TypeScript. */
function parseVillages(source) {
  const villages = [];
  const blockRe = /\{\s*\r?\n\s*id:\s*'([^']+)',\s*\r?\n\s*slug:\s*'([^']+)',[\s\S]*?\r?\n\s*name:\s*'([^']+)',/g;
  const coordRe = /coordinates:\s*\[\s*([\d.]+)\s*,\s*([\d.]+)\s*\]/;
  const districtRe = /district:\s*'([^']+)'/;

  const starts = [];
  let m;
  while ((m = blockRe.exec(source)) !== null) {
    starts.push({ index: m.index, id: m[1], slug: m[2], name: m[3] });
  }
  starts.forEach((start, i) => {
    const end = i + 1 < starts.length ? starts[i + 1].index : source.length;
    const chunk = source.slice(start.index, end);
    const coord = coordRe.exec(chunk);
    if (!coord) return;
    const district = districtRe.exec(chunk);
    villages.push({
      id: start.id,
      slug: start.slug,
      name: start.name,
      district: district ? district[1] : null,
      lat: Number(coord[1]),
      lng: Number(coord[2]),
    });
  });
  return villages;
}

function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function nominatim(query) {
  const url =
    'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=vn&addressdetails=0&q=' +
    encodeURIComponent(query);
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const top = data[0];
  return {
    label: top.display_name,
    lat: Number(top.lat),
    lng: Number(top.lon),
    type: `${top.class ?? '?'}/${top.type ?? '?'}`,
    query,
  };
}

async function main() {
  const source = await readFile(DATA_FILE, 'utf8');
  const villages = parseVillages(source);

  if (villages.length === 0) {
    console.error('Không bóc được làng nào từ', DATA_FILE);
    process.exitCode = 1;
    return;
  }

  console.log(`Đối chiếu ${villages.length} làng nghề với OpenStreetMap Nominatim\n`);
  console.log(
    ['làng', 'toạ độ trong mã', 'khoảng cách', 'kết quả OSM', 'loại'].join('\t')
  );

  const report = [];

  for (const village of villages) {
    const candidates = QUERIES[village.slug] ?? [village.name];
    let best = null;
    let bestDistance = Infinity;

    for (const query of candidates) {
      await sleep(1200);
      let hit = null;
      try {
        hit = await nominatim(query);
      } catch (error) {
        console.log(`${village.slug}\tLỖI: ${error.message}`);
        hit = null;
      }
      if (!hit) continue;
      const distance = haversineMeters(village, hit);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = hit;
      }
      // Truy vấn đầu tiên đã khớp sát (< 500 m) thì không cần thử tiếp.
      if (distance < 500) break;
    }

    const entry = {
      slug: village.slug,
      name: village.name,
      current: { lat: village.lat, lng: village.lng },
      osm: best ? { lat: best.lat, lng: best.lng, label: best.label, type: best.type, query: best.query } : null,
      distanceMeters: Number.isFinite(bestDistance) ? Math.round(bestDistance) : null,
    };
    report.push(entry);

    if (!best) {
      console.log(`${village.slug}\t${village.lat}, ${village.lng}\t(không có kết quả)\t—\t—`);
      continue;
    }
    console.log(
      [
        village.slug,
        `${village.lat}, ${village.lng}`,
        `${entry.distanceMeters} m`,
        best.label.split(',').slice(0, 3).join(','),
        best.type,
      ].join('\t')
    );
  }

  const jsonIndex = process.argv.indexOf('--json');
  if (jsonIndex !== -1 && process.argv[jsonIndex + 1]) {
    const outPath = path.resolve(process.argv[jsonIndex + 1]);
    await writeFile(outPath, JSON.stringify(report, null, 2), 'utf8');
    console.log(`\nĐã ghi báo cáo: ${outPath}`);
  }

  const suspicious = report.filter((r) => r.distanceMeters === null || r.distanceMeters > 1000);
  console.log(`\n${suspicious.length}/${report.length} làng lệch hơn 1 km so với dữ liệu chuẩn.`);
  for (const row of suspicious) {
    console.log(
      `  • ${row.slug}: ${row.distanceMeters === null ? 'không xác minh được' : row.distanceMeters + ' m'}`
    );
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
