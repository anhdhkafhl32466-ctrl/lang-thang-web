#!/usr/bin/env node
/**
 * add-gallery-entries.mjs
 * ------------------------------------------------------------------
 * Đọc scripts/photo-manifest.json (kết quả tải ảnh từ Wikimedia Commons)
 * và chèn thêm entry vào mảng `gallery` của từng làng trong
 * data/craftVillages.ts — kèm caption tiếng Việt và credit (tác giả/giấy phép).
 *
 * Chỉ chèn ảnh CHƯA xuất hiện trong file. Chạy lại nhiều lần vẫn an toàn.
 *
 *   node scripts/add-gallery-entries.mjs            # ghi thật
 *   node scripts/add-gallery-entries.mjs --dry-run  # chỉ in ra
 */

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const DATA = path.join(ROOT, 'data', 'craftVillages.ts');
const MANIFEST = path.join(ROOT, 'scripts', 'photo-manifest.json');
const DRY = process.argv.includes('--dry-run');

/** caption tiếng Việt cho từng ảnh mới — key: "<slug>/<file>" */
const CAPTIONS = {
  'bat-trang/handcrafting_1.jpg': 'Nghệ nhân Bát Tràng nặn và chuốt gốm thủ công tại xưởng bên tả ngạn sông Hồng',
  'bat-trang/handcrafting_2.jpg': 'Tạo hình gốm trên bàn xoay – công đoạn đòi hỏi độ dẻo tay và kinh nghiệm lâu năm',
  'bat-trang/transport_2.jpg': 'Vận chuyển gốm mộc quanh làng Bát Tràng bằng xe thồ',
  'bat-trang/ceramics_display.jpg': 'Gian trưng bày gốm sứ Bát Tràng với nhiều dáng bình, lọ men rạn và men lam',
  'bat-trang/drying_coal.jpg': 'Phơi than theo cách truyền thống để chuẩn bị cho lò nung gốm Bát Tràng',
  'bat-trang/ceramics_shop.jpg': 'Cửa hàng chuyên bán đồ gốm sứ Bát Tràng trên đường làng',
  'bat-trang/street_2.jpg': 'Đường làng Bát Tràng – khu dân cư gắn liền với các lò gốm gia đình',

  'van-phuc/silk_weaving_7.jpg': 'Máy dệt lụa tại làng Vạn Phúc (Hà Đông), ảnh chụp năm 2003',
  'van-phuc/silk_weaving_11.jpg': 'Khung dệt lụa truyền thống ở làng Vạn Phúc, Hà Đông',
  'van-phuc/silk_weaving_15.jpg': 'Xưởng dệt lụa Vạn Phúc với các khung cửi hoạt động liên tục',
  'van-phuc/jacquard_weaver.jpg': 'Thợ dệt đứng bên máy dệt lụa Jacquard tại một xưởng ở làng Vạn Phúc',
  'van-phuc/jacquard_weaver_sitting.jpg': 'Thợ vận hành máy dệt Jacquard – công đoạn dệt nên những tấm lụa vân hoa',
  'van-phuc/loom_punch_cards.jpg': 'Thẻ đục lỗ điều khiển hoa văn trên máy dệt Jacquard – di sản kỹ thuật dệt lụa',
  'van-phuc/lua_van_phuc.jpg': 'Vải lụa dệt tại làng Vạn Phúc, Hà Đông, Hà Nội',

  'phu-vinh/products_3.jpg': 'Sản phẩm mây tre đan thủ công của làng Phú Vinh (Chương Mỹ, Hà Nội)',
  'phu-vinh/basket_museum.jpg': 'Rổ mây tre đan bóng (Bảo tàng Mỹ thuật Việt Nam, Hà Nội)',
  'phu-vinh/basket_giarai.jpg': 'Rổ tre mây của người Gia Rai (Bảo tàng Lịch sử Việt Nam, TP.HCM)',
  'phu-vinh/basket_boat.jpg': 'Thuyền thúng bằng tre và rừng tre – hình ảnh gắn bó với nghề tre của người Việt',
  'phu-vinh/bamboo_fishing_baskets.jpg': 'Những chiếc giỏ tre xếp cao trên một con phố Hà Nội',
  'phu-vinh/bamboo_thai_weaving.jpg': 'Đan lát tre của người Thái (bản Diềm, Con Cuông, Nghệ An) – minh họa nghề đan tre Việt Nam',

  'chuong/conical_hat_making.jpg': 'Chằm nón lá (ảnh chụp tại vùng quê miền Trung) – kỹ thuật chung của nghề nón Việt Nam',
  'chuong/hatter_vietnam.jpg': 'Nghệ nhân làm nón lá tại đồng bằng sông Cửu Long',
  'chuong/hat_display_ethnology.jpg': 'Trưng bày nghề làm nón tại Bảo tàng Dân tộc học Việt Nam (Hà Nội)',
  'chuong/non_la_ao_dai.jpg': 'Áo dài và nón lá – hai biểu tượng tạo nên hình ảnh người Việt',
  'chuong/non_la_toy.jpg': 'Nón lá cỡ nhỏ làm đồ chơi, lưu niệm cho trẻ em',

  'kieu-ky/gold_foil_oc_eo_1.jpg': 'Vàng lá khai quật từ di chỉ văn hóa Óc Eo (Bảo tàng Lịch sử Việt Nam, Hà Nội)',
  'kieu-ky/gold_foil_oc_eo_2.jpg': 'Vàng lá thời Óc Eo – minh chứng cho kỹ thuật dát vàng lâu đời ở Việt Nam',
  'kieu-ky/cat_tien_gold_leaf.jpg': 'Lá vàng dát hình nữ thần Lakshmi (Bảo tàng Cát Tiên)',
  'kieu-ky/gold_malleability.jpg': 'Một khối vàng nhỏ cỡ 5 mm có thể dát thành lá vàng phủ nửa mét vuông – cơ sở của nghề quỳ vàng',
  'kieu-ky/cutting_gold_leaf_workshop.jpg': 'Cắt lá vàng tại một xưởng dát vàng ở Mandalay, Myanmar – kỹ thuật dát vàng lưu truyền ở châu Á',
  'kieu-ky/gold_factory_kanazawa.jpg': 'Xưởng chế tác vàng tại Kanazawa, Nhật Bản',

  'dao-thuc/thang_long_theatre.jpg': 'Nhà hát múa rối nước Thăng Long – sân khấu rối nước lâu đời giữa lòng Hà Nội',
  'dao-thuc/thang_long_entrance.jpg': 'Nhà hát múa rối nước Thăng Long, Hà Nội',
  'dao-thuc/water_puppet_musician.jpg': 'Nhạc công trong dàn nhạc đệm của một buổi múa rối nước',
  'dao-thuc/water_puppet_turtle.jpg': 'Con rối nước hình rùa vàng – tích vua Lê trả gươm gắn với Hồ Hoàn Kiếm',
  'dao-thuc/water_puppeteers_2017.jpg': 'Nghệ nhân múa rối nước Phan Tranh Liêm và vợ, Hà Nội, 2017',
  'dao-thuc/marionnettes_eau.jpg': 'Buổi diễn rối nước với các con rối gỗ di chuyển trên mặt nước',

  'tay-tuu/flower_hawker.jpg': 'Người bán hoa rong trên phố Hà Nội',
  'tay-tuu/flower_market_bus.jpg': 'Cảnh chợ hoa Hà Nội cuối buổi chiều',
  'tay-tuu/flower_nursery.jpg': 'Vườn ươm cây hoa tại Vườn Bách Thảo Hà Nội',
  'tay-tuu/chrysanthemum.jpg': 'Hoa cúc vàng – loài hoa chủ lực của các vườn hoa ngoại thành Hà Nội',
  'tay-tuu/hanoi_flower_garden.jpg': 'Vườn hoa tại Hà Nội – minh họa không gian trồng hoa vùng ven đô',

  'xuan-la/to_he_2.jpg': 'Những con tò he nặn bằng bột gạo với đủ sắc màu',
  'xuan-la/to_he_3.jpg': 'Tò he – đồ chơi dân gian nặn tay của trẻ em Việt Nam',
  'xuan-la/o_an_quan.jpg': 'Trò chơi ô ăn quan – trò chơi dân gian Việt Nam',
  'xuan-la/o_an_quan_truong_sa.jpg': 'Trẻ em chơi ô ăn quan trên đảo Trường Sa Lớn',
  'xuan-la/bit_mat_dap_nieu.jpg': 'Trò chơi dân gian bịt mắt đập niêu trong lễ hội',

  'quang-phu-cau/drying_incense_04.jpg': 'Những bó hương mới xếp phơi dưới nắng tại một làng hương ở Hà Nội',
  'quang-phu-cau/drying_incense_40.jpg': 'Người lao động ngồi giữa rừng tăm hương đang phơi – công việc quen thuộc ở làng hương Quảng Phú Cầu',
  'quang-phu-cau/drying_incense_49.jpg': 'Tăm hương xếp tỏa tròn như những bông hoa khổng lồ',
  'quang-phu-cau/drying_incense_55.jpg': 'Thu gom hương sau khi phơi khô',
  'quang-phu-cau/drying_incense_74.jpg': 'Toàn cảnh sân phơi hương của một làng nghề ở Hà Nội',
  'quang-phu-cau/incense_making.jpg': 'Se hương – quấn lớp bột hương quanh tăm tre, công đoạn chính của nghề làm hương',

  'chuyen-my/inlay_boxes.jpg': 'Hộp gỗ khảm trai thời Nguyễn (Bảo tàng Lịch sử Quốc gia, Hà Nội)',
  'chuyen-my/inlay_dragon_panel.jpg': 'Ván chạm rồng sơn son kết hợp khảm trai thời Nguyễn',
  'chuyen-my/inlay_picture_1890.jpg': 'Tranh gỗ khảm trai năm 1890 (Bảo tàng Lịch sử Quốc gia, Hà Nội)',
  'chuyen-my/inlay_tray.jpg': 'Khay gỗ khảm xà cừ đầu thế kỷ XX (Bảo tàng Lịch sử Việt Nam, TP.HCM)',
  'chuyen-my/inlay_altar_cabinet.jpg': 'Tủ thờ gỗ khảm xà cừ – đồ nội thất cao cấp gắn với nghề khảm trai',
  'chuyen-my/inlay_bed_cabinet.jpg': 'Sập và tủ chè khảm xà cừ',

  'ha-thai/lacquer_painting_nguyen_gia_tri.jpg': 'Bình phong sơn mài “Thiếu nữ và phong cảnh” của danh họa Nguyễn Gia Trí',
  'ha-thai/lacquer_box3.jpg': 'Hộp sơn mài (Bảo tàng Mỹ thuật Việt Nam)',
  'ha-thai/lacquer_stirring_tool.jpg': 'Dụng cụ quấy sơn ta – công cụ đặc trưng của nghề sơn mài',
  'ha-thai/lacquer_wood_1.jpg': 'Tượng gỗ sơn mài Việt Nam (Bảo tàng Mỹ thuật TP.HCM)',
  'ha-thai/lacquer_gift_box.jpg': 'Hộp quà sơn mài dùng trong lễ hỏi, Hà Nội đầu thế kỷ XX',

  'son-dong/peacock_wood_statue.jpg': 'Tượng gỗ chim công Việt Nam (Bảo tàng Lịch sử Việt Nam)',
  'son-dong/buddha_wood_statue.jpg': 'Tượng Phật gỗ đứng trên tòa sen (Bảo tàng Mỹ thuật Việt Nam)',
  'son-dong/boy_buddha_wood.jpg': 'Tượng Phật đồng tử gỗ sơn son thếp vàng, thời Trần – Hồ (Bảo tàng Lịch sử Quốc gia)',
  'son-dong/wood_sculpture_1.jpg': 'Tượng gỗ Việt Nam (Bảo tàng Mỹ thuật TP.HCM)',
  'son-dong/wood_sculpture_2.jpg': 'Tác phẩm điêu khắc gỗ Việt Nam (Bảo tàng Mỹ thuật TP.HCM)',

  'trach-xa/ao_dai_modern.jpg': 'Áo dài cách tân trong đời sống đương đại',
  'trach-xa/ao_dai_modern_2.jpg': 'Áo dài truyền thống tôn lên vẻ thanh lịch của người phụ nữ Việt',
  'trach-xa/ao_dai_van_mieu.jpg': 'Áo dài trong khuôn viên Văn Miếu – Quốc Tử Giám (Hà Nội)',
  'trach-xa/ao_dai_nghe.jpg': 'Áo dài tại một lễ hội nghề ở Hà Nội',
  'trach-xa/ao_tu_than.jpg': 'Áo tứ thân – tiền thân của áo dài năm thân',

  'thach-xa/bamboo_dragonfly.jpg': 'Chuồn chuồn tre – đồ chơi thủ công quay nhờ hai cánh tre cân bằng',
  'thach-xa/bamboo_copter.jpg': 'Bộ sưu tập chuồn chuồn tre (taketombo) – đồ chơi tre phổ biến ở châu Á',
  'thach-xa/tay_phuong_pagoda.jpg': 'Chùa Tây Phương – ngôi chùa cổ trên vùng đất Thạch Thất, Hà Nội',
  'thach-xa/tay_phuong_statues.jpg': 'Hệ thống tượng gỗ cổ tại chùa Tây Phương',
  'thach-xa/la_han_18.jpg': 'Một trong 18 tượng La Hán tại chùa Tây Phương, Thạch Thất',

  'chang-son/hang_quat_altars.jpg': 'Phố Hàng Quạt – con phố chuyên bán quạt giấy, đồ thờ và tượng Phật của Hà Nội xưa',
  'chang-son/fan_old_quarter.jpg': 'Cụ bà cầm quạt giấy trong khu phố cổ Hà Nội',
  'chang-son/fan_dancer_van_mieu.jpg': 'Vũ nữ cầm quạt trong một buổi biểu diễn tại Văn Miếu (Hà Nội)',
  'chang-son/asian_fan_dance.jpg': 'Điệu múa quạt truyền thống châu Á',
  'chang-son/woven_palm_fan.jpg': 'Quạt lá cọ đan thủ công – minh họa các loại quạt thủ công truyền thống',
  'chang-son/fan_archaeology_note.jpg': 'Tư liệu khảo cổ 1958 ghi nhận quạt giấy trong mộ hợp chất Hoàng Đức (Thanh Hóa)',

  'me-tri/com_lang_vong.jpg': 'Cốm làng Vòng – hạt cốm xanh dẹt làm từ nếp non, đặc sản mùa thu Hà Nội',
  'me-tri/com.jpg': 'Cốm tươi gói trong lá',
  'me-tri/banh_com_2.png': 'Bánh cốm – bánh làm từ cốm với nhân đậu xanh',
  'me-tri/banh_com_3.jpg': 'Bánh cốm Hà Nội, thức quà mùa thu',
  'me-tri/co_trung_thu.jpg': 'Mâm cỗ Trung thu – dịp cốm và bánh cốm được dùng nhiều nhất',
  'me-tri/do_le_an_hoi.jpg': 'Tráp lễ ăn hỏi truyền thống – bánh cốm thường có trong tráp',
};

function creditFor(entry) {
  const author = (entry.author || '').trim();
  const license = (entry.license || '').trim() || 'xem trang gốc';
  if (!author || author === 'Không rõ' || /^https?:/i.test(author)) {
    return `Ảnh: Wikimedia Commons (${license})`;
  }
  const short = author.length > 46 ? `${author.slice(0, 43)}…` : author;
  return `Ảnh: ${short} / Wikimedia Commons (${license})`;
}

const esc = (s) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const main = async () => {
  const data = await readFile(DATA, 'utf8');
  const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'));
  let out = data;
  let added = 0;

  for (const [slug, entries] of Object.entries(manifest)) {
    if (!entries?.length) continue;
    const slugIdx = out.indexOf(`slug: '${slug}'`);
    if (slugIdx === -1) {
      console.warn(`! không thấy làng: ${slug}`);
      continue;
    }
    const blockEnd = out.indexOf('\n  {', slugIdx);
    const block = blockEnd === -1 ? out.slice(slugIdx) : out.slice(slugIdx, blockEnd);

    const galStart = block.indexOf('gallery: [');
    if (galStart === -1) {
      console.warn(`! loàng ${slug} không có gallery`);
      continue;
    }
    const galClose = block.indexOf('\n    ],', galStart);
    if (galClose === -1) {
      console.warn(`! không thấy cuối gallery của ${slug}`);
      continue;
    }
    const gallery = block.slice(galStart, galClose);

    const newEntries = [];
    for (const e of entries) {
      if (!e.file) continue;
      const url = `/images/villages/${slug}/${e.file}`;
      // đã có trong file (bất kỳ làng nào) -> bỏ qua
      if (out.includes(`'${url}'`)) continue;
      const caption = CAPTIONS[`${slug}/${e.file}`];
      if (!caption) {
        console.warn(`! thiếu caption cho ${slug}/${e.file} — bỏ qua`);
        continue;
      }
      newEntries.push(
        `      {\n        url: '${url}',\n        caption: '${esc(caption)}',\n        credit: '${esc(creditFor(e))}'\n      }`,
      );
    }
    if (!newEntries.length) continue;

    const insertAt = slugIdx + galClose; // trỏ đúng vào "\n    ]," đóng gallery
    out = `${out.slice(0, insertAt)},\n${newEntries.join(',\n')}${out.slice(insertAt)}`;
    added += newEntries.length;
    console.log(`  + ${slug}: ${newEntries.length} ảnh`);
  }

  if (DRY) {
    console.log(`\n[dry-run] sẽ thêm ${added} entry`);
    return;
  }
  await writeFile(DATA, out, 'utf8');
  console.log(`\nĐã thêm ${added} entry vào ${path.relative(ROOT, DATA)}`);
};

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
