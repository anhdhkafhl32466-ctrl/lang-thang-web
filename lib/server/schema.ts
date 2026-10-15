/**
 * Schema cơ sở dữ liệu của sàn thương mại Lang Thang.
 *
 * Câu lệnh ở đây được viết trong tập con SQL tương thích CẢ HAI:
 *  - SQLite (chạy sẵn không cần cài đặt, dùng cho phát triển & self-hosted)
 *  - PostgreSQL (Neon / Supabase / Postgres tự vận hành — dùng cho production serverless)
 *
 * Quy ước:
 *  - Khoá chính là TEXT do ứng dụng sinh (không dùng SERIAL / AUTOINCREMENT) -> chạy giống nhau
 *    trên mọi hệ quản trị.
 *  - Thời gian lưu dạng chuỗi ISO 8601 (TEXT) -> không phụ thuộc hàm NOW() của từng hệ.
 *  - Mọi câu lệnh đều `IF NOT EXISTS` để chạy lại an toàn (idempotent).
 *
 * Bản SQL tương ứng cho vận hành (chạy tay bằng psql) nằm ở db/migrations/001_init.sql.
 */

export const SCHEMA_STATEMENTS: string[] = [
  /*
   * Cửa hàng (người bán). Mô hình ĐA NGƯỜI BÁN: mỗi tài khoản người bán sở hữu đúng một cửa hàng;
   * sàn cũng có một cửa hàng của chính nó (owner_email = ADMIN_EMAIL) để 18 sản phẩm gốc vẫn có chủ.
   * Trạng thái: pending (chờ duyệt) | active (đang bán) | suspended (tạm khóa) | rejected (từ chối).
   */
  `CREATE TABLE IF NOT EXISTS stores (
    id TEXT PRIMARY KEY,
    owner_email TEXT NOT NULL,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    phone TEXT,
    contact_name TEXT,
    address_text TEXT,
    address_note TEXT,
    lat REAL,
    lng REAL,
    logo_url TEXT,
    categories TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    review_note TEXT,
    approved_at TEXT,
    approved_by TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    village_id TEXT NOT NULL,
    village_name TEXT NOT NULL,
    category TEXT NOT NULL,
    price INTEGER NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    image TEXT NOT NULL,
    artisan_name TEXT NOT NULL,
    material TEXT,
    dimensions TEXT,
    active INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL
  )`,

  /*
   * ĐƠN CON theo cửa hàng. Một đơn của khách (đơn cha trong bảng `orders`) có thể gồm nhiều cửa hàng,
   * khi đó mỗi cửa hàng có một đơn con RIÊNG: tiền hàng, phí vận chuyển, trạng thái và mã vận đơn
   * đều độc lập. Người bán CHỈ nhìn thấy đơn con của cửa hàng mình.
   * `store_name` / `store_address` là bản chụp tại thời điểm đặt — sửa hồ sơ cửa hàng sau này không
   * làm thay đổi đơn cũ.
   */
  `CREATE TABLE IF NOT EXISTS seller_orders (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    store_id TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    store_name TEXT NOT NULL,
    store_address TEXT,
    store_lat REAL,
    store_lng REAL,
    subtotal INTEGER NOT NULL,
    shipping_fee INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL,
    status TEXT NOT NULL,
    carrier TEXT,
    tracking_code TEXT,
    route_distance_m INTEGER,
    route_duration_s INTEGER,
    route_provider TEXT,
    route_status TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    user_email TEXT,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_email TEXT,
    address_text TEXT NOT NULL,
    address_note TEXT,
    lat REAL,
    lng REAL,
    address_source TEXT,
    place_id TEXT,
    subtotal INTEGER NOT NULL,
    shipping_fee INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL,
    status TEXT NOT NULL,
    payment_method TEXT NOT NULL DEFAULT 'cod',
    route_distance_m INTEGER,
    route_duration_s INTEGER,
    route_provider TEXT,
    route_status TEXT,
    warehouse_id TEXT,
    warehouse_address TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    name TEXT NOT NULL,
    village_name TEXT,
    image TEXT,
    unit_price INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    line_total INTEGER NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS order_events (
    id TEXT PRIMARY KEY,
    order_id TEXT NOT NULL,
    status TEXT NOT NULL,
    from_status TEXT,
    note TEXT,
    actor_type TEXT NOT NULL,
    actor_id TEXT,
    source TEXT NOT NULL,
    created_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    audience TEXT NOT NULL,
    user_email TEXT,
    order_id TEXT,
    title TEXT NOT NULL,
    body TEXT,
    link TEXT,
    read_at TEXT,
    created_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS push_subscriptions (
    id TEXT PRIMARY KEY,
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    user_email TEXT,
    user_agent TEXT,
    created_at TEXT NOT NULL,
    last_success_at TEXT,
    failure_count INTEGER NOT NULL DEFAULT 0
  )`,

  `CREATE TABLE IF NOT EXISTS email_log (
    id TEXT PRIMARY KEY,
    order_id TEXT,
    to_email TEXT NOT NULL,
    kind TEXT NOT NULL,
    provider TEXT NOT NULL,
    status TEXT NOT NULL,
    provider_id TEXT,
    error TEXT,
    created_at TEXT NOT NULL
  )`,

  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    avatar TEXT,
    role TEXT NOT NULL DEFAULT 'member',
    provider TEXT,
    created_at TEXT NOT NULL,
    last_login_at TEXT
  )`,

  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    role TEXT NOT NULL,
    issued_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    user_agent TEXT
  )`,

  /*
   * Kho hàng / Điểm xuất hàng của cửa hàng (Nhiệm vụ 3).
   * Mỗi shop có thể có nhiều kho (Kho chính, xưởng sản xuất, kho vệ tinh).
   * Mỗi sản phẩm có thể chọn xuất hàng từ một kho cụ thể hoặc kho mặc định của shop.
   */
  `CREATE TABLE IF NOT EXISTS warehouses (
    id TEXT PRIMARY KEY,
    store_id TEXT NOT NULL,
    name TEXT NOT NULL,
    address_text TEXT NOT NULL,
    address_note TEXT,
    lat REAL,
    lng REAL,
    contact_name TEXT,
    phone TEXT,
    is_default INTEGER NOT NULL DEFAULT 0,
    active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,

  /*
   * Sổ địa chỉ của khách hàng (Nhiệm vụ 3).
   * Khách hàng có thể lưu nhiều địa chỉ nhận hàng (Nhà riêng, Trường học, KTX, Công ty...).
   */
  `CREATE TABLE IF NOT EXISTS customer_addresses (
    id TEXT PRIMARY KEY,
    user_email TEXT NOT NULL,
    recipient_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    province TEXT,
    ward TEXT,
    address_text TEXT NOT NULL,
    address_note TEXT,
    lat REAL,
    lng REAL,
    label TEXT NOT NULL DEFAULT 'Nhà riêng',
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,

  `CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders (customer_email)`,
  `CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id)`,
  `CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_events (order_id)`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_audience ON notifications (audience, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_notifications_email ON notifications (user_email)`,
  `CREATE INDEX IF NOT EXISTS idx_email_log_order ON email_log (order_id)`,
  `CREATE INDEX IF NOT EXISTS idx_stores_owner ON stores (owner_email)`,
  `CREATE INDEX IF NOT EXISTS idx_stores_status ON stores (status)`,
  `CREATE INDEX IF NOT EXISTS idx_seller_orders_store ON seller_orders (store_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_seller_orders_order ON seller_orders (order_id)`,
  `CREATE INDEX IF NOT EXISTS idx_seller_orders_status ON seller_orders (status)`,
  `CREATE INDEX IF NOT EXISTS idx_warehouses_store ON warehouses (store_id)`,
  `CREATE INDEX IF NOT EXISTS idx_customer_addresses_email ON customer_addresses (user_email)`,
];

/**
 * Nâng cấp cấu trúc cho cơ sở dữ liệu ĐÃ TỒN TẠI (không xoá dữ liệu, không tạo lại bảng).
 *
 * Vì sao cần: `CREATE TABLE IF NOT EXISTS` không thêm được cột vào bảng đã có, nên mọi thay đổi
 * cột phải là câu ALTER chạy lại an toàn (idempotent). Lỗi "cột đã tồn tại" được bỏ qua có chủ đích
 * ở lib/server/db.ts — mọi lỗi khác vẫn phải nổi lên để không che giấu sự cố thật.
 */
export const SCHEMA_MIGRATIONS: string[] = [
  // "Trạng thái cũ" của mỗi lần chuyển trạng thái, để nhật ký kiểm toán ghi rõ từ đâu sang đâu.
  `ALTER TABLE order_events ADD COLUMN from_status TEXT`,
  // Cột phục vụ mô hình đa người bán (thêm vào bảng ĐÃ có, không xoá dữ liệu cũ).
  `ALTER TABLE products ADD COLUMN store_id TEXT`,
  `ALTER TABLE products ADD COLUMN description TEXT`,
  `ALTER TABLE products ADD COLUMN weight_g INTEGER`,
  `ALTER TABLE products ADD COLUMN preparation_days INTEGER`,
  `ALTER TABLE products ADD COLUMN created_at TEXT`,
  `ALTER TABLE order_items ADD COLUMN store_id TEXT`,
  `ALTER TABLE order_items ADD COLUMN seller_order_id TEXT`,
  `ALTER TABLE order_events ADD COLUMN seller_order_id TEXT`,
  `ALTER TABLE users ADD COLUMN password_hash TEXT`,
  `ALTER TABLE users ADD COLUMN phone TEXT`,

  // Cột kho hàng & thông tin cửa hàng mở rộng
  `ALTER TABLE products ADD COLUMN warehouse_id TEXT`,
  `ALTER TABLE seller_orders ADD COLUMN warehouse_id TEXT`,
  `ALTER TABLE seller_orders ADD COLUMN warehouse_name TEXT`,
  `ALTER TABLE stores ADD COLUMN shipping_policy TEXT`,
  `ALTER TABLE stores ADD COLUMN prep_time_days INTEGER DEFAULT 1`,
  `ALTER TABLE stores ADD COLUMN banner_url TEXT`,

  // Chỉ mục trên cột VỪA được thêm bằng ALTER ở trên: phải đặt SAU các câu ALTER, vì với cơ sở dữ
  // liệu mới tạo, `CREATE INDEX ... (store_id)` chạy trước khi cột tồn tại sẽ làm hỏng cả bước khởi
  // tạo schema (bảng products gốc chưa có cột store_id). Chạy lại an toàn nhờ "already exists".
  `CREATE INDEX IF NOT EXISTS idx_products_store ON products (store_id)`,
  `CREATE INDEX IF NOT EXISTS idx_products_warehouse ON products (warehouse_id)`,
];
