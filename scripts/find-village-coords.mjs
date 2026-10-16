/**
 * Tìm toạ độ chuẩn cho từng làng nghề và IN RA 5 kết quả đầu để người đọc tự đối chiếu.
 *
 * Vì sao in nhiều kết quả: Nominatim có thể khớp nhầm vào trường học / tuyến đường trùng tên.
 * Kết quả đúng phải là một LÀNG / THÔN / địa danh mang đúng tên làng nghề.
 *
 * Chạy: node scripts/find-village-coords.mjs [slug ...]
 */

import path from 'node:path';

const UA = 'LangThang-HanoiCraftVillages/1.0 (coordinate research; contact: admin@langthang.local)';

const QUERIES = {
  'phu-vinh': ['Làng mây tre đan Phú Vinh', 'Phú Vinh, Phú Nghĩa, Chương Mỹ, Hà Nội', 'Phú Vinh, Chương Mỹ'],
  'chuong': ['Làng Chuông, Thanh Oai', 'Chuông, Phương Trung, Thanh Oai', 'Chợ phiên Nón Làng Chuông'],
  'dao-thuc': ['Đào Thục, Đông Anh', 'Thủy đình Đào Thục', 'Đào Thục, Thụy Lâm'],
  'xuan-la': ['Xuân La, Phượng Dực, Phú Xuyên', 'Làng tò he Xuân La', 'Xuân La, Phú Xuyên'],
  'quang-phu-cau': ['Quảng Phú Cầu, Ứng Hòa', 'Quảng Phú Cầu, Hà Nội', 'Chợ Quảng Phú Cầu'],
  'ha-thai': ['Hạ Thái, Thường Tín', 'Hạ Thái, Duyên Thái', 'Làng sơn mài Hạ Thái'],
  'trach-xa': ['Trạch Xá, Ứng Hòa', 'Trạch Xá, Hà Nội', 'Làng áo dài Trạch Xá'],
  'thach-xa': ['Thạch Xá, Thạch Thất', 'Thạch Xá, Hà Nội', 'Chuồn chuồn tre Thạch Xá'],
  'chang-son': ['Chàng Sơn, Thạch Thất', 'Chàng Sơn, Hà Nội', 'Quạt Chàng Sơn'],
  'me-tri': ['Mễ Trì, Hà Nội', 'Làng cốm Mễ Trì', 'Mễ Trì Thượng'],
  'tay-tuu': ['Tây Tựu, Hà Nội', 'Làng hoa Tây Tựu', 'Tây Tựu, Bắc Từ Liêm'],
  'chuyen-my': ['Chuôn Ngọ, Chuyên Mỹ', 'Chuôn Ngọ, Phú Xuyên', 'Khảm trai Chuôn Ngọ'],
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(query, limit = 5) {
  const url =
    'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=' +
    limit +
    '&countrycodes=vn&q=' +
    encodeURIComponent(query);
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Nominatim HTTP ${res.status}`);
  return res.json();
}

function localityOf(row) {
  const a = row.address ?? {};
  return [a.village, a.hamlet, a.suburb, a.quarter, a.ward, a.city_district, a.town, a.county]
    .filter(Boolean)
    .join(' · ');
}

async function main() {
  const only = process.argv.slice(2);
  const slugs = only.length > 0 ? only : Object.keys(QUERIES);

  for (const slug of slugs) {
    const queries = QUERIES[slug];
    if (!queries) {
      console.log(`\n=== ${slug}: chưa có truy vấn ===`);
      continue;
    }
    console.log(`\n=== ${slug} ===`);
    for (const query of queries) {
      await sleep(1200);
      let rows = [];
      try {
        rows = await search(query);
      } catch (error) {
        console.log(`  [${query}] LỖI ${error.message}`);
        continue;
      }
      console.log(`  [${query}] → ${rows.length} kết quả`);
      rows.forEach((row, i) => {
        const name = String(row.name || row.display_name.split(',')[0]).slice(0, 42);
        console.log(
          `    ${i + 1}. ${name.padEnd(44)} ${Number(row.lat).toFixed(5)}, ${Number(row.lon).toFixed(5)}  ${row.class}/${row.type}  ${localityOf(row)}`
        );
      });
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
