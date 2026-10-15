/**
 * Nạp danh mục sản phẩm từ dữ liệu tĩnh của website vào cơ sở dữ liệu.
 *
 * Mục đích: các trang bán hàng đọc GIÁ và TỒN KHO từ cơ sở dữ liệu (nguồn duy nhất), còn
 * `data/products.ts` chỉ là dữ liệu khởi tạo ban đầu. Sau khi bản ghi đã tồn tại, hàm này KHÔNG
 * ghi đè giá/tồn kho để chỉnh sửa của người vận hành không bị mất.
 *
 * Mô hình đa người bán: mọi sản phẩm phải thuộc một cửa hàng. Bước nạp này tạo cửa hàng của SÀN
 * (chủ là ADMIN_EMAIL) và gán toàn bộ sản phẩm gốc vào đó — vì vậy dữ liệu sản phẩm cũ vẫn còn
 * nguyên chủ sở hữu hợp lệ, không phải xoá hay tạo lại bảng.
 *
 * Lưu ý kỹ thuật: hàm này chạy BÊN TRONG bước khởi tạo CSDL nên chỉ dùng `internal.*` (truy vấn thô,
 * không kích hoạt lại ensureDbReady) — nếu dùng lớp `query/execute` thông thường sẽ gây khoá chờ nhau.
 */

import crypto from 'crypto';
import { PRODUCTS } from '@/data/products';
import { getAdminEmail } from '@/lib/config/commerce';
import { internal } from './db';

/** Tồn kho khởi tạo cho mỗi sản phẩm khi lần đầu tạo bản ghi (có thể chỉnh sau trong DB). */
const DEFAULT_STOCK = Number(process.env.CATALOG_DEFAULT_STOCK || 20);

interface RawRow {
  [key: string]: unknown;
}

/** Tạo (hoặc tìm) cửa hàng của sàn — chủ sở hữu là email quản trị đã cấu hình. */
async function ensurePlatformStoreRow(): Promise<string> {
  const adminEmail = getAdminEmail();
  const rows = (await internal.rawQuery(`SELECT id, status FROM stores WHERE lower(owner_email) = ?`, [
    adminEmail,
  ])) as RawRow[];

  if (rows[0]) {
    const storeId = String(rows[0].id);
    // Cửa hàng của sàn luôn phải hoạt động, nếu không toàn bộ danh mục gốc sẽ biến mất khỏi sàn.
    if (rows[0].status !== 'active') {
      await internal.rawExecute(`UPDATE stores SET status = 'active', updated_at = ? WHERE id = ?`, [
        new Date().toISOString(),
        storeId,
      ]);
    }
    return storeId;
  }

  const id = `str_${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  await internal.rawExecute(
    `INSERT INTO stores (id, owner_email, name, slug, description, phone, contact_name, address_text,
      address_note, lat, lng, logo_url, categories, status, review_note, approved_at, approved_by,
      created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, NULL, ?, NULL, NULL, NULL, NULL, NULL, ?, 'active', NULL, ?, ?, ?, ?)`,
    [
      id,
      adminEmail,
      'Lang Thang — Sàn di sản',
      'lang-thang-san-di-san',
      'Danh mục sản phẩm tinh hoa do chính sàn Lang Thang tuyển chọn từ các làng nghề Hà Nội.',
      'Ban quản trị sàn Lang Thang',
      'Đặc sản làng nghề, Quà tặng di sản, Thủ công mỹ nghệ',
      now,
      adminEmail,
      now,
      now,
    ]
  );
  return id;
}

export async function seedCatalog(): Promise<void> {
  const now = new Date().toISOString();
  const platformStoreId = await ensurePlatformStoreRow();

  // Danh sách các xưởng thủ công mỹ nghệ thật tiêu biểu
  const AUTHENTIC_SHOPS = [
    {
      id: 'str_bat_trang_artisan',
      ownerEmail: 'artisan.gom.battrang@langthang.vn',
      name: 'Xưởng Gốm Bát Tràng — Tinh Hoa Men Rạn',
      slug: 'xuong-gom-bat-trang',
      description: 'Xưởng chế tác gốm vuốt tay thủ công và men rạn cổ truyền Bát Tràng, lưu giữ trọn vẹn nét tinh hoa gốm ngự Thăng Long thế kỷ XVII-XVIII.',
      phone: '0912456789',
      contactName: 'Nghệ nhân Phạm Anh Đạo',
      addressText: 'Số 28 xóm 2, thôn Bát Tràng, xã Bát Tràng, Gia Lâm, Hà Nội',
      logoUrl: '/images/villages/bat-trang/artisan_wheel.jpg',
      bannerUrl: '/images/villages/bat-trang/street_view.jpg',
      categories: 'Gốm sứ, Đồ thủ công mỹ nghệ, Trưng bày di sản',
      villageId: 'bat-trang',
    },
    {
      id: 'str_van_phuc_artisan',
      ownerEmail: 'artisan.lua.vanphuc@langthang.vn',
      name: 'Lụa Tơ Tằm Vạn Phúc — Xưởng Khung Cửi Cổ',
      slug: 'lua-to-tam-van-phuc',
      description: 'Nghề dệt lụa tơ tằm nguyên bản hơn 1.000 năm tuổi với kỹ nghệ dệt sa, dệt lụa Vân hoa cúc mềm mại, thấm hút và thoáng mát bốn mùa.',
      phone: '0983123456',
      contactName: 'Nghệ nhân Triệu Văn Mão',
      addressText: 'Số 12 phố Lụa, phường Vạn Phúc, quận Hà Đông, Hà Nội',
      logoUrl: '/images/villages/van-phuc/weaver.jpg',
      bannerUrl: '/images/villages/van-phuc/silk_weaving_1.jpg',
      categories: 'Lụa tơ tằm, Dệt may, Thời trang truyền thống',
      villageId: 'van-phuc',
    },
    {
      id: 'str_quang_phu_cau_artisan',
      ownerEmail: 'artisan.huong.quangphucau@langthang.vn',
      name: 'Hương Xưa Quảng Phú Cầu — Thảo Mộc Tự Nhiên',
      slug: 'huong-xua-quang-phu-cau',
      description: 'Hương trầm và hương thảo mộc tự nhiên từ vỏ quế, hoa hồi, trầm hương và thảo quả, se tay thủ công không sử dụng hóa chất độc hại.',
      phone: '0978987654',
      contactName: 'Xưởng hương cụ Nguyễn Văn Thành',
      addressText: 'Thôn Cầu Bầu, xã Quảng Phú Cầu, huyện Ứng Hòa, Hà Nội',
      logoUrl: '/images/villages/quang-phu-cau/incense_vietnam.jpg',
      bannerUrl: '/images/villages/quang-phu-cau/drying_incense_3.jpg',
      categories: 'Hương thảo mộc, Thủ công truyền thống',
      villageId: 'quang-phu-cau',
    },
    {
      id: 'str_phu_vinh_artisan',
      ownerEmail: 'artisan.maytre.phuvinh@langthang.vn',
      name: 'Mây Tre Đan Phú Vinh — Tinh Hoa Mây Giang',
      slug: 'may-tre-dan-phu-vinh',
      description: 'Kỹ nghệ đan mây giang hoa văn mắt cáo, nong đôi, nong mốt mượt mà, sáng tạo đèn thả mây tre và khay hộp thủ công xuất khẩu.',
      phone: '0965333888',
      contactName: 'Nghệ nhân Nguyễn Văn Trung',
      addressText: 'Thôn Phú Vinh, xã An Khánh, huyện Chương Mỹ, Hà Nội',
      logoUrl: '/images/villages/phu-vinh/products_2.jpg',
      bannerUrl: '/images/villages/phu-vinh/products_1.jpg',
      categories: 'Mây tre đan, Nội thất thủ công, Quà tặng di sản',
      villageId: 'phu-vinh',
    },
  ];

  // Nạp hoặc cập nhật cửa hàng thật chuẩn chỉ
  for (const shop of AUTHENTIC_SHOPS) {
    await internal.rawExecute(
      `INSERT INTO stores (id, owner_email, name, slug, description, phone, contact_name, address_text,
        logo_url, banner_url, categories, status, approval_status, approved_at, approved_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', 'approved', ?, ?, ?, ?)
       ON CONFLICT (id) DO UPDATE SET
        name = excluded.name,
        slug = excluded.slug,
        description = excluded.description,
        phone = excluded.phone,
        contact_name = excluded.contact_name,
        address_text = excluded.address_text,
        logo_url = excluded.logo_url,
        banner_url = excluded.banner_url,
        categories = excluded.categories,
        status = 'active',
        approval_status = 'approved'`,
      [
        shop.id,
        shop.ownerEmail,
        shop.name,
        shop.slug,
        shop.description,
        shop.phone,
        shop.contactName,
        shop.addressText,
        shop.logoUrl,
        shop.bannerUrl,
        shop.categories,
        now,
        'system',
        now,
        now,
      ]
    );
  }

  // Nạp 18 sản phẩm gốc từ dữ liệu tĩnh vào cơ sở dữ liệu
  for (const product of PRODUCTS) {
    // Tìm cửa hàng xưởng nghề tương ứng theo làng nghề, nếu không có thì thuộc Sàn Di Sản
    const matchedShop = AUTHENTIC_SHOPS.find((s) => s.villageId === product.villageId);
    const assignedStoreId = matchedShop ? matchedShop.id : platformStoreId;

    await internal.rawExecute(
      `INSERT INTO products
        (id, name, village_id, village_name, category, price, stock, image, artisan_name, material, dimensions,
         description, weight_g, preparation_days, store_id, active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, ?, 1, ?, ?)
       ON CONFLICT (id) DO UPDATE SET
        store_id = COALESCE(products.store_id, excluded.store_id)`,
      [
        product.id,
        product.name,
        product.villageId,
        product.villageName,
        product.category,
        product.price,
        Number.isFinite(DEFAULT_STOCK) && DEFAULT_STOCK >= 0 ? DEFAULT_STOCK : 20,
        product.image,
        product.artisanName,
        product.material || null,
        product.dimensions || null,
        product.description || null,
        assignedStoreId,
        now,
        now,
      ]
    );
  }

  // Gán sản phẩm về đúng xưởng làng nghề thực tế tương ứng
  for (const shop of AUTHENTIC_SHOPS) {
    if (shop.villageId) {
      await internal.rawExecute(
        `UPDATE products SET store_id = ? WHERE village_id = ?`,
        [shop.id, shop.villageId]
      );
    }
  }

  // Các sản phẩm còn lại (nón Chuông, khảm trai Chuyên Mỹ, tranh Kim Hoàng...) thuộc Sàn Di Sản
  await internal.rawExecute(`UPDATE products SET store_id = ? WHERE store_id IS NULL`, [platformStoreId]);
}
