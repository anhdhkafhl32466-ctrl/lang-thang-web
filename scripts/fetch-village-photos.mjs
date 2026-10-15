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
  'bat-trang': [
    'Bát Tràng', 'Bat Trang pottery', 'Bat Trang ceramic', 'Vietnamese ceramics',
    'gốm sứ Việt Nam', 'Vietnam pottery kiln', 'Nguyễn dynasty ceramic vase', 'blue and white porcelain Vietnam',
  ],
  'van-phuc': [
    'Vạn Phúc silk', 'Van Phuc silk weaving', 'Hà Đông silk', 'silk weaving Vietnam',
    'Vietnamese silk', 'silk loom Vietnam', 'áo dài lụa', 'Vietnamese textile weaving',
  ],
  'phu-vinh': [
    'Phú Vinh bamboo', 'bamboo and rattan weaving Vietnam', 'mây tre đan',
    'bamboo basket Vietnam', 'rattan handicraft', 'bamboo weaving', 'Chương Mỹ',
  ],
  'chuong': [
    'nón lá Vietnam', 'conical hat Vietnam', 'làng Chuông nón', 'nón quai thao',
    'conical hat making', 'Thanh Oai', 'palm leaf hat Vietnam', 'nón chóp',
  ],
  'kieu-ky': [
    'gold leaf Vietnam', 'Kiêu Kỵ', 'dát vàng quỳ', 'goldbeating',
    'gold leaf craftsman', 'quỳ vàng', 'gold foil', 'Gia Lâm',
  ],
  'dao-thuc': [
    'water puppetry Vietnam', 'múa rối nước', 'water puppet theatre',
    'water puppet Hanoi', 'Thăng Long water puppet', 'rối nước', 'water puppet show',
  ],
  'tay-tuu': [
    'Tây Tựu flower', 'flower field Hanoi', 'flower village Vietnam', 'hoa Tây Tựu',
    'gladiolus field', 'daisy field Vietnam', 'flower market Hanoi', 'rose farm Vietnam',
  ],
  'xuan-la': [
    'tò he', 'toy figurine dough Vietnam', 'Phú Xuyên', 'đồ chơi dân gian',
    'Vietnamese folk toy', 'dough figurine', 'to he',
  ],
  'quang-phu-cau': [
    'Quảng Phú Cầu incense', 'incense sticks Vietnam', 'làng hương', 'hương trầm',
    'incense drying Vietnam', 'Ứng Hòa', 'incense maker', 'drying incense',
  ],
  'chuyen-my': [
    'khảm trai', 'mother of pearl inlay Vietnam', 'Chuôn Ngọ', 'xà cừ',
    'inlay furniture Vietnam', 'mother-of-pearl', 'Nguyễn dynasty inlay', 'khảm xà cừ',
  ],
  'ha-thai': [
    'sơn mài', 'Vietnamese lacquerware', 'lacquer painting Vietnam', 'lacquerware Vietnam',
    'Vietnamese lacquer', 'lacquered wood Vietnam', 'sơn mài Việt Nam', 'lacquer box Vietnam',
  ],
  'son-dong': [
    'Sơn Đồng wood carving', 'wood carving Buddhist Vietnam', 'tạc tượng', 'tượng gỗ Việt Nam',
    'Vietnamese wood sculpture', 'Buddhist statue Vietnam wood', 'La Hán wood',
  ],
  'trach-xa': [
    'áo dài', 'ao dai Vietnam', 'Vietnamese traditional dress', 'áo tứ thân',
    'Vietnamese woman ao dai', 'Vietnam tailoring', 'traditional Vietnamese clothing',
  ],
  'thach-xa': [
    'chuồn chuồn tre', 'bamboo dragonfly', 'Thạch Xá', 'đồ chơi tre',
    'Chùa Tây Phương', 'Tây Phương pagoda', 'bamboo dragonfly toy',
  ],
  'chang-son': [
    'quạt giấy', 'hand fan Vietnam', 'Chàng Sơn fan', 'folding fan',
    'Hàng Quạt', 'paper fan Vietnam', 'quạt Chàng Sơn',
  ],
  'me-tri': [
    'cốm', 'green rice flakes Vietnam', 'cốm Hà Nội', 'bánh cốm',
    'Làng Vòng cốm', 'Vietnamese cốm', 'green rice Vietnam', 'rice flake',
  ],
};

// Đã xem xét & tuyển chọn thủ công từ Commons: tiêu đề gốc -> tên file lưu cục bộ.
const PINS = {
  'bat-trang': [
    ['Đường phố xã Bát Tràng, Gia Lâm, Hà Nội.jpg', 'street_view.jpg'],
    ['Bat-Trang-Ceramic-Village8.jpg', 'handcrafting_1.jpg'],
    ['Bat-Trang-Ceramic-Village12.jpg', 'handcrafting_2.jpg'],
    ['Bat-Trang-Ceramic-Village2.jpg', 'transport_2.jpg'],
    ['Bát Tràng DSC 0091.JPG', 'ceramics_display.jpg'],
    ['Bát Tràng, tường than.JPG', 'drying_coal.jpg'],
    ['Ceramics shop in Bát Tràng, Hanoi (1 March 2018) 12.jpg', 'ceramics_shop.jpg'],
    ['Strato en Bát Tràng 01.jpg', 'street_2.jpg'],
  ],
  'van-phuc': [
    ['Silk weaving, 2003 Ha Dong.jpg', 'silk_weaving_1.jpg'],
    ['Silk weaving, 2003 Ha Dong 3.jpg', 'silk_weaving_2.jpg'],
    ['Silk weaving, 2003 Ha Dong 9.jpg', 'silk_weaving_3.jpg'],
    ['Silk weaving, 2003 Ha Dong 7.jpg', 'silk_weaving_7.jpg'],
    ['Silk weaving, 2003 Ha Dong 11.jpg', 'silk_weaving_11.jpg'],
    ['Silk weaving, 2003 Ha Dong 15.jpg', 'silk_weaving_15.jpg'],
    ['Van Phuc weaver at Jacquard loom.jpg', 'jacquard_weaver.jpg'],
    ['Van Phuc weaver sitting.jpg', 'jacquard_weaver_sitting.jpg'],
    ['Van Phuc loom punch cards 02.jpg', 'loom_punch_cards.jpg'],
    ['LụaVạnPhúc-2198867187 a0d4cdce3b o.jpg', 'lua_van_phuc.jpg'],
  ],
  'phu-vinh': [
    ['Bamboo and rattan village Phu Vinh,Chuong My,Ha Noi,Viet Nam.jpg', 'village.jpg'],
    ['Handicraft products in Phu Vinh bamboo and rattan village,VietNam.jpg', 'products_1.jpg'],
    ['Handicraft products in Phu Vinh bamboo and rattan village, Ha Noi, Viet Nam.jpg', 'products_2.jpg'],
    ['Handicraft products in Phu Vinh bamboo and rattan village, Viet Nam.jpg', 'products_3.jpg'],
    ['Basket made of varnished and closely-fitted bamboo, Nam Dinh province - Vietnam National Museum of Fine Arts - Hanoi, Vietnam - DSC05247.JPG', 'basket_museum.jpg'],
    ['Basket, Giarai people, bamboo, rattan - Museum of Vietnamese History - Ho Chi Minh City - DSC05771.JPG', 'basket_giarai.jpg'],
    ['Basket Boat and the Bamboo forest (Unsplash).jpg', 'basket_boat.jpg'],
    ['Bamboo Fishing Baskets.jpg', 'bamboo_fishing_baskets.jpg'],
    ['Bamboo weaving of the Thai ethnic group (photographed in Diềm Village, Châu Khe Commune, Con Cuông District).jpg', 'bamboo_thai_weaving.jpg'],
  ],
  'chuong': [
    ['Conical hat, Viet, Thanh Oai, Hanoi, 1999, palm leaves with bamboo frame - Vietnamese Women\u0027s Museum - Hanoi, Vietnam - DSC03996.JPG', 'thanh_oai_museum.jpg'],
    ['Nón quai thao.jpg', 'non_quai_thao.jpg'],
    ['Vietnamese conical hat nonla.jpg', 'non_la_vietnam.jpg'],
    ['Making conical hats - Hue countryside.jpg', 'conical_hat_making.jpg'],
    ['Hatter Vietnam.jpg', 'hatter_vietnam.jpg'],
    ['Hat-making display - Vietnam Museum of Ethnology - Hanoi, Vietnam - DSC02609.JPG', 'hat_display_ethnology.jpg'],
    ['The symbol of Vietnamese.jpg', 'non_la_ao_dai.jpg'],
    ['Nón lá đồ chơi.jpg', 'non_la_toy.jpg'],
  ],
  'kieu-ky': [
    ['Hammering Gold Leaf.jpg', 'gold_leaf_hammering.jpg'],
    ['Gold Leaf Close Up.jpg', 'gold_leaf_closeup.jpg'],
    ['Oc Eo Culture Gold Foil 1.jpg', 'gold_foil_oc_eo_1.jpg'],
    ['Oc Eo Culture Gold Foil 2.jpg', 'gold_foil_oc_eo_2.jpg'],
    ['Cat Tien gold.jpg', 'cat_tien_gold_leaf.jpg'],
    ['Small gold nugget 5mm dia and corresponding foil surface of half sq meter.jpg', 'gold_malleability.jpg'],
    ['Cutting Gold Leaf - Golden Rose Workshop - Mandalay - Myanmar (Burma) (11962913425).jpg', 'cutting_gold_leaf_workshop.jpg'],
    ['Kanazawa Gold Factory.jpg', 'gold_factory_kanazawa.jpg'],
  ],
  'dao-thuc': [
    ['Water-Puppet-Show5.jpg', 'puppet_show2.jpg'],
    ['Performers-of-Water-Puppet-Show.jpg', 'performers.jpg'],
    ['Nguoi chan trau trong mua roi nuoc.jpg', 'buffalo_puppet.jpg'],
    ['Thang Long Water Puppet Theatre2.JPG', 'thang_long_theatre.jpg'],
    ['Hanoi Vietnam Thang-Long-Water-Puppet-Theatre-01.jpg', 'thang_long_entrance.jpg'],
    ['Water-Puppet-Show-Musician.jpg', 'water_puppet_musician.jpg'],
    ['Water-Puppet-turtle.jpg', 'water_puppet_turtle.jpg'],
    ['Water puppeteers Phan Tranh Liem and his wife, Hanoi, 2017.jpg', 'water_puppeteers_2017.jpg'],
    ["Marionnettes sur l'eau (21717834799).jpg", 'marionnettes_eau.jpg'],
  ],
  'tay-tuu': [
    ['Flower market - Hanoi, Vietnam - DSC03681.JPG', 'flower_market_hanoi.jpg'],
    ['Flower vender, Hanoi (37608462635).jpg', 'flower_vendor.jpg'],
    ['Flower display - Hanoi, Vietnam - DSC03494.JPG', 'flower_display.jpg'],
    ['Flower hawker (Unsplash).jpg', 'flower_hawker.jpg'],
    ['Flower market from bus.jpg', 'flower_market_bus.jpg'],
    ['Flower trunks - Hanoi Botanical Garden - Hanoi, Vietnam - DSC03574.JPG', 'flower_nursery.jpg'],
    ['Yellow Chrysanthemum in Vietnam.jpg', 'chrysanthemum.jpg'],
    ['Vườn hoa Quốc Tử Giám, Hà Nội 003.JPG', 'hanoi_flower_garden.jpg'],
  ],
  'xuan-la': [
    ['To he Vietnam.jpg', 'to_he_vietnam.jpg'],
    ['Making a "tò he".JPG', 'making_to_he.jpg'],
    ['Tò he 1.JPG', 'to_he_1.jpg'],
    ['To he.JPG', 'to_he_2.jpg'],
    ['Tò he.JPG', 'to_he_3.jpg'],
    ['Newone - ô ăn quan.jpg', 'o_an_quan.jpg'],
    ['Chơi ô ăn quan (Trường Sa).jpg', 'o_an_quan_truong_sa.jpg'],
    ['Bịt mắt đập niêu.JPG', 'bit_mat_dap_nieu.jpg'],
  ],
  'quang-phu-cau': [
    ['Incense in Vietnam.jpg', 'incense_vietnam.jpg'],
    ['Drying incense 26.jpg', 'drying_incense_2.jpg'],
    ['Drying incense 33.jpg', 'drying_incense_3.jpg'],
    ['Drying incense 04.jpg', 'drying_incense_04.jpg'],
    ['Drying incense 40.jpg', 'drying_incense_40.jpg'],
    ['Drying incense 49.jpg', 'drying_incense_49.jpg'],
    ['Drying incense 55.jpg', 'drying_incense_55.jpg'],
    ['Drying incense 74.jpg', 'drying_incense_74.jpg'],
    ['Incense making (2637231356).jpg', 'incense_making.jpg'],
  ],
  'chuyen-my': [
    ['Screen, Nguyen dynasty, 1890, wood with mother of pearl inlay, view 1 - National Museum of Vietnamese History - Hanoi, Vietnam - DSC05606.JPG', 'inlay_screen_1890.jpg'],
    ['Picture, Nguyen dynasty, 19th to early 20th century, wood with mother of pearl inlay - National Museum of Vietnamese History - Hanoi, Vietnam - DSC05615.JPG', 'inlay_picture_museum.jpg'],
    ['Sập khảm trai.jpg', 'sap_kham_trai.jpg'],
    ['Boxes, Nguyen dynasty, 19th to early 20th century, wood with mother of pearl inlay - National Museum of Vietnamese History - Hanoi, Vietnam - DSC05617.JPG', 'inlay_boxes.jpg'],
    ['Panel with dragon decoration, Nguyen dynasty, 19th century, crimson and gilded wood, mother of pearl inlay - National Museum of Vietnamese History - Hanoi, Vietnam - DSC05622.JPG', 'inlay_dragon_panel.jpg'],
    ['Picture, Nguyen dynasty, 1890, wood with mother of pearl inlay - National Museum of Vietnamese History - Hanoi, Vietnam - DSC05612.JPG', 'inlay_picture_1890.jpg'],
    ['Tray, early 20th century, carved wood with mother-of-pearl inlay - Museum of Vietnamese History - Ho Chi Minh City - DSC05968.JPG', 'inlay_tray.jpg'],
    ['Tủ thờ khảm xà cừ..jpg', 'inlay_altar_cabinet.jpg'],
    ['Sập và tủ chè khảm xà cừ.JPG', 'inlay_bed_cabinet.jpg'],
  ],
  'ha-thai': [
    ['Lacquered box - Vietnam National Museum of Fine Arts - Hanoi, Vietnam - DSC05256.JPG', 'lacquer_box2.jpg'],
    ['Roc kings, Kien Xuong district, Thai Binh province, 18th century AD, lacquered wood - Vietnam National Museum of Fine Arts - Hanoi, Vietnam - DSC05096.JPG', 'lacquer_roc.jpg'],
    ['Case containing royal ordinance, Nguyen dynasty, late 19th to early 20th century, lacquered wood - Museum of Vietnamese History - Ho Chi Minh City - DSC05950.JPG', 'lacquer_case.jpg'],
    ['Painting Thieu nu va phong canh of Nguyen Gia Tri (front side).jpg', 'lacquer_painting_nguyen_gia_tri.jpg'],
    ['Lacquered box - Vietnam National Museum of Fine Arts - Hanoi, Vietnam - DSC05246.JPG', 'lacquer_box3.jpg'],
    ['Instrument for stirring lacquer, Viet - Vietnam Museum of Ethnology - Hanoi, Vietnam - DSC02595.JPG', 'lacquer_stirring_tool.jpg'],
    ['Vietnamese Lacquered Wood (9997427095).jpg', 'lacquer_wood_1.jpg'],
    ['Vietnamese Women\u0027s Museum, Gift Box.jpg', 'lacquer_gift_box.jpg'],
  ],
  'son-dong': [
    ['Statue of Shakyamuni on the snowy mountain, Tây Phương Pagoda, Hà Tây Province (1794), Vietnam National Museum of Fine Arts, Hanoi, Vietnam - 20131030.JPG', 'tay_phuong_statue.jpg'],
    ['Attendant to Buddha, wood - Vietnam National Museum of Fine Arts - Hanoi, Vietnam - DSC04879.JPG', 'attendant_buddha.jpg'],
    ['La Hán chùa Tây Phương.JPG', 'la_han_tay_phuong.jpg'],
    ['Tượng gỗ chim công Việt Nam tại Bảo tàng lịch sử Việt Nam năm 2017 (16).jpg', 'peacock_wood_statue.jpg'],
    ['Buddha standing on a lotus throne, wood - Vietnam National Museum of Fine Arts - Hanoi, Vietnam - DSC04890.JPG', 'buddha_wood_statue.jpg'],
    ['The boy Buddha rising up from lotus, Tran-Ho dynasty, 14th-15th century AD, crimson and gilded wood - National Museum of Vietnamese History - Hanoi, Vietnam - DSC05511.JPG', 'boy_buddha_wood.jpg'],
    ['Vietnamese Wood Sculpture (9997563953).jpg', 'wood_sculpture_1.jpg'],
    ['Vietnamese Wood Sculpture (9997484046).jpg', 'wood_sculpture_2.jpg'],
  ],
  'trach-xa': [
    ['Vietnamese girl wearing ao dai.jpg', 'ao_dai_3.jpg'],
    ['Áo dài trắng 2015-01-26.jpg', 'ao_dai_trang.jpg'],
    ['Áo dài dancers.jpg', 'ao_dai_dancers.jpg'],
    ['Modern ao dai.jpg', 'ao_dai_modern.jpg'],
    ['Ao Dai (modern).jpg', 'ao_dai_modern_2.jpg'],
    ['Temple of Literature - Ao Dai.jpg', 'ao_dai_van_mieu.jpg'],
    ['Aodai Nghe 2018.jpg', 'ao_dai_nghe.jpg'],
    ['Áo tứ thân.jpg', 'ao_tu_than.jpg'],
  ],
  'thach-xa': [
    ['Chùa Tây Phương 2.JPG', 'pagoda_2.jpg'],
    ['Tây Phương Pagoda - 03.jpg', 'pagoda_3.jpg'],
    ['Thập Bát La Hán - Chùa tây Phương - La Hán Cười.jpg', 'la_han.jpg'],
    ['Montmoreau 16 Libellule bambou 2012.jpg', 'bamboo_dragonfly.jpg'],
    ['Taketombo.jpg', 'bamboo_copter.jpg'],
    ['Chùa Tây Phương.JPG', 'tay_phuong_pagoda.jpg'],
    ['Tây Phương Pagoda - 06.jpg', 'tay_phuong_statues.jpg'],
    ['1 trong 18 La Hán chùa Tây Phương.jpg', 'la_han_18.jpg'],
  ],
  'chang-son': [
    ['Hanoï - Promenade du Dragon, rue des Éventails.jpg', 'hanoi_fan_street.jpg'],
    ['Temple on Hàng Quạt Street.jpg', 'hang_quat_temple.jpg'],
    ['Hang Quat street of Buddhist altars & statues (3695174688).jpg', 'hang_quat_altars.jpg'],
    ['Elderly Woman with Fan - Old Quarter - Hanoi - Vietnam (48072281137).jpg', 'fan_old_quarter.jpg'],
    ['Danseuse dans le Temple de la Littérature (Hanoi).jpg', 'fan_dancer_van_mieu.jpg'],
    ['Asian fan dance2.jpg', 'asian_fan_dance.jpg'],
    ['Woven palm leaf fan.jpg', 'woven_palm_fan.jpg'],
    ['Ghi chép về hiện vật khảo cổ ở mộ hợp chất Hoàng Đức - Thanh Hoá 1958.jpg', 'fan_archaeology_note.jpg'],
  ],
  'me-tri': [
    ['Banh com (Vietnam).JPG', 'banh_com_vietnam.jpg'],
    ['Com-lang-vong.jpg', 'com_lang_vong.jpg'],
    ['Com.JPG', 'com.jpg'],
    ['Banh com.png', 'banh_com_2.png'],
    ['Bánh cốm.jpg', 'banh_com_3.jpg'],
    ['Cỗ trung thu.JPG', 'co_trung_thu.jpg'],
    ['Do le an hoi.JPG', 'do_le_an_hoi.jpg'],
  ],
};

const OK_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const STOP = new Set(['la', 'vietnam', 'viet', 'nam', 'the', 'and', 'of', 'in', 'at', 'village', 'lang', 'xa', 'huyen']);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Wikimedia yêu cầu User-Agent mô tả rõ mục đích + liên hệ khi tải số lượng lớn.
const UA = 'HanoiCraftVillages/1.0 (educational GIS project; https://github.com/hanoi-craft-villages) node-fetch';

/** Tải 1 URL ảnh với backoff lũy tiến khi gặp 429/quá tải. */
async function fetchImage(url, { retries = 6, base = 3000 } = {}) {
  let last = '';
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'image/*' } });
    if (res.status === 429 || res.status === 503) {
      last = `HTTP ${res.status}`;
      await sleep(base * 2 ** attempt + Math.floor(Math.random() * 900));
      continue;
    }
    if (!res.ok) throw new Error(String(res.status));
    return Buffer.from(await res.arrayBuffer());
  }
  throw new Error(`quá tải (${last}) sau ${retries} lần thử`);
}

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
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (res.status === 429 || res.status === 503) {
      await sleep(3000 * 2 ** attempt + Math.floor(Math.random() * 900));
      continue;
    }
    if (!res.ok) throw new Error(`Commons API ${res.status}`);
    return res.json();
  }
  throw new Error('Commons API 429 (hết lượt thử lại)');
}

async function search(query, limit = 25) {
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
      const buf = await fetchImage(img.thumburl);
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

/** Liệt kê file trong một Commons category (hiệu quả hơn search rất nhiều). */
async function categoryFiles(name, limit = 60) {
  const title = name.startsWith('Category:') ? name : `Category:${name}`;
  const data = await api({
    action: 'query',
    generator: 'categorymembers',
    gcmtitle: title,
    gcmtype: 'file',
    gcmlimit: String(limit),
    prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata',
    iiurlwidth: '1600',
    format: 'json',
  });
  const pages = data?.query?.pages;
  if (!pages) return [];
  const clean = (s) => (s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  return Object.values(pages)
    .map((p) => {
      const info = p.imageinfo?.[0];
      if (!info) return null;
      const meta = info.extmetadata || {};
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
    for (const [rawTitle, file] of pins) {
      const title = rawTitle;
      // `pins` chạy lại chỉ tải file còn thiếu, trừ khi FORCE=1
      if (!process.env.FORCE && existsSync(path.join(dir, file))) {
        continue;
      }
      try {
        const img = await infoByTitle(title);
        if (!img) throw new Error('không tìm thấy trên Commons');
        const buf = await fetchImage(img.thumburl);
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
  if (mode === 'cat' || mode === 'cat-x') {
    const cats = mode === 'cat' ? Object.keys(CATEGORIES) : [only];
    for (const name of cats) {
      console.log(`\n### ${name}`);
      let files = [];
      try {
        files = await categoryFiles(name);
      } catch (e) {
        console.log(`  ! lỗi: ${e.message}`);
        continue;
      }
      for (const c of files) {
        console.log(`  • ${c.title}  [${c.width}x${c.height}]  ${c.license}  — ${c.author}`);
      }
      await sleep(1200);
    }
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
        console.log(`      ${c.description.replace(/\s+/g, ' ').slice(0, 150)}`);
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
