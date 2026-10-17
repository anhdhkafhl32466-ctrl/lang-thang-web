/**
 * SÀNG LỌC: đối chiếu toạ độ làng nghề với dữ liệu Google Maps.
 *
 * Vì sao cần: bản đồ trong ứng dụng dùng dữ liệu OpenStreetMap, còn người dùng đối chiếu bằng
 * Google Maps. Hai nguồn có thể chọn điểm mốc khác nhau cho cùng một làng (tâm làng, đình, cổng
 * làng, nhà văn hoá — thậm chí là con đê gần đó), nên cần một cách nhìn nhanh xem làng nào đang
 * bị lệch nhiều để còn xác minh.
 *
 * GIỚI HẠN — đọc kỹ trước khi tin kết quả:
 * Endpoint nhúng bản đồ của Google (https://maps.google.com/maps?q=...&output=embed) KHÔNG phải
 * máy geocode. Nó trả về vị trí khung nhìn mà Google chọn cho truy vấn (có thể nới rộng để chứa
 * nhiều kết quả) cùng danh sách điểm gợi ý (doanh nghiệp, tuyến đường trùng tên…). Vì vậy:
 *   - "tâm khung nhìn" chỉ là tín hiệu sàng lọc;
 *   - "điểm có tên" gần nhất mới đáng tin hơn, nhưng vẫn phải mở trình duyệt xác minh.
 * Một làng bị đánh dấu ở đây KHÔNG có nghĩa toạ độ sai — xem `npm run test:coords` (giải mã
 * ngược OpenStreetMap) và nút "Đối chiếu Google Maps" ngay trên bản đồ để kết luận.
 *
 * Chạy: node scripts/compare-google-coords.mjs
 */

import { readFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(process.cwd());
const DATA_FILE = path.join(ROOT, 'data', 'craftVillages.ts');
const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';

/** Truy vấn rõ nghĩa cho những làng dễ trùng tên trên Google Maps. */
const QUERY_OVERRIDES = {
  'quang-phu-cau': 'Quảng Phú Cầu Ứng Hòa Hà Nội',
  'xuan-la': 'Xuân La Phượng Dực Phú Xuyên Hà Nội',
  'chuyen-my': 'Chuôn Ngọ Chuyên Mỹ Phú Xuyên Hà Nội',
  'trach-xa': 'Trạch Xá Hòa Lâm Ứng Hòa Hà Nội',
  'thach-xa': 'Thạch Xá Thạch Thất Hà Nội',
  'chang-son': 'Chàng Sơn Thạch Thất Hà Nội',
  'son-dong': 'Sơn Đồng Hoài Đức Hà Nội',
  'me-tri': 'Mễ Trì Nam Từ Liêm Hà Nội',
  'ha-thai': 'Hạ Thái Thường Tín Hà Nội',
  'phu-vinh': 'Phú Vinh Chương Mỹ Hà Nội',
  chuong: 'Làng Chuông Thanh Oai Hà Nội',
  'tay-tuu': 'Tây Tựu Bắc Từ Liêm Hà Nội',
  'kieu-ky': 'Kiêu Kỵ Gia Lâm Hà Nội',
  'bat-trang': 'Bát Tràng Gia Lâm Hà Nội',
  'van-phuc': 'Vạn Phúc Hà Đông Hà Nội',
  'dao-thuc': 'Đào Thục Thụy Lâm Đông Anh Hà Nội',
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

function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Vị trí khung nhìn Google chọn cho truy vấn: bộ ba [<số vô nghĩa>, <kinh độ>, <vĩ độ>]. */
function extractViewCenter(html) {
  const center = html.match(/\[[-\d.]+,\s*(10[4-6]\.\d+),\s*(2[01]\.\d+)\]/);
  return center ? { lat: Number(center[2]), lng: Number(center[1]) } : null;
}

/** Các địa điểm có tên trong payload: toạ độ mã hoá ×10^7 kèm loại đối tượng của Google. */
function extractNamedPlaces(html) {
  const places = [];
  const re =
    /\[\["\d+","\d+"\],"(?:\/g\/[^"]+)",[^[]*\[(\d{8,9}),(\d{9,10})\][^[]*?"gcid:([a-z_]+)"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const lat = Number(m[1]) / 1e7;
    const lng = Number(m[2]) / 1e7;
    if (lat > 20 && lat < 22 && lng > 104 && lng < 107) places.push({ lat, lng, type: m[3] });
  }
  return places;
}

async function googleLookup(query, attempt = 1) {
  const url = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed&z=15&hl=vi`;
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'vi,en' } });
  if (!res.ok) {
    if (attempt < 3) {
      await sleep(3000 * attempt);
      return googleLookup(query, attempt + 1);
    }
    throw new Error(`Google HTTP ${res.status}`);
  }
  const html = await res.text();
  return { center: extractViewCenter(html), places: extractNamedPlaces(html) };
}

async function main() {
  const villages = parseVillages(await readFile(DATA_FILE, 'utf8'));
  console.log('Sàng lọc toạ độ làng nghề theo dữ liệu Google Maps');
  console.log('(tín hiệu sàng lọc — kết luận cuối cùng phải xác minh trong trình duyệt)\\n');
  console.log('Làng'.padEnd(16), 'Ghim hiện tại'.padEnd(24), 'Tâm khung nhìn Google'.padEnd(24), 'Lệch');

  let flagged = 0;

  for (const village of villages) {
    const query = QUERY_OVERRIDES[village.slug] ?? `${village.name} Hà Nội`;
    await sleep(1300);

    let result;
    try {
      result = await googleLookup(query);
    } catch (error) {
      console.log(village.slug.padEnd(16), 'LỖI:', error.message);
      continue;
    }

    if (!result.center) {
      console.log(village.slug.padEnd(16), `${village.lat}, ${village.lng}`.padEnd(24), '(không có kết quả)');
      continue;
    }

    const distance = haversineMeters(village, result.center);
    if (distance > 300) flagged += 1;

    const nearestNearby = result.places
      .map((place) => ({ ...place, distance: haversineMeters(village, place) }))
      .sort((a, b) => a.distance - b.distance)[0];

    console.log(
      village.slug.padEnd(16),
      `${village.lat}, ${village.lng}`.padEnd(24),
      `${result.center.lat.toFixed(6)}, ${result.center.lng.toFixed(6)}`.padEnd(24),
      `${Math.round(distance)} m`,
      nearestNearby
        ? `• điểm có tên gần nhất: ${nearestNearby.type} @ ${Math.round(nearestNearby.distance)} m`
        : '• không có điểm có tên lân cận'
    );
  }

  console.log(
    `\n${flagged}/${villages.length} làng có tâm khung nhìn Google cách ghim hơn 300 m — cần xác minh trong trình duyệt.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
