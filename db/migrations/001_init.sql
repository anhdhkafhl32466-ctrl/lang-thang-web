-- ===========================================================================
--  Migration 001 — Sàn thương mại đa người bán Lang Thang
--  Chạy được trên CẢ PostgreSQL (Neon / Supabase / Postgres tự vận hành)
--  và SQLite. Ứng dụng tự chạy các câu lệnh tương đương khi khởi động
--  (xem lib/server/schema.ts) — file này dành cho người vận hành muốn tạo
--  schema bằng tay (ví dụ: psql "$DATABASE_URL" -f db/migrations/001_init.sql).
--
--  LƯU Ý: nội dung phải luôn khớp với lib/server/schema.ts.
--  Toàn bộ câu lệnh đều "IF NOT EXISTS" hoặc ALTER chạy lại an toàn:
--  chạy migration này trên cơ sở dữ liệu đã có KHÔNG xoá sản phẩm/đơn hàng cũ.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Cửa hàng (người bán). Mô hình ĐA NGƯỜI BÁN: mỗi tài khoản người bán sở hữu
-- đúng một cửa hàng; sàn cũng có cửa hàng của chính nó (owner_email = ADMIN_EMAIL)
-- để các sản phẩm gốc vẫn có chủ.
-- Trạng thái: pending (chờ duyệt) | active (đang bán) | suspended (tạm khoá) | rejected (từ chối).
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS stores (
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
);

CREATE TABLE IF NOT EXISTS products (
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
);

-- Cột phục vụ mô hình đa người bán (bảng ĐÃ tồn tại: thêm cột, không tạo lại).
-- Khi tạo mới hoàn toàn, các câu ALTER dưới đây báo "duplicate column" và được bỏ qua.
ALTER TABLE products ADD COLUMN store_id TEXT;
ALTER TABLE products ADD COLUMN description TEXT;
ALTER TABLE products ADD COLUMN weight_g INTEGER;
ALTER TABLE products ADD COLUMN preparation_days INTEGER;
ALTER TABLE products ADD COLUMN created_at TEXT;

-- ---------------------------------------------------------------------------
-- ĐƠN CON theo cửa hàng. Một đơn của khách (đơn cha trong bảng `orders`) có thể
-- gồm nhiều cửa hàng, khi đó mỗi cửa hàng có một đơn con RIÊNG: tiền hàng, phí
-- vận chuyển, trạng thái và mã vận đơn đều độc lập.
-- store_name / store_address là BẢN CHỤP tại thời điểm đặt: sửa hồ sơ cửa hàng
-- sau này không làm thay đổi đơn cũ.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS seller_orders (
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
);

CREATE TABLE IF NOT EXISTS orders (
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
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  village_name TEXT,
  image TEXT,
  unit_price INTEGER NOT NULL,
  quantity INTEGER NOT NULL,
  line_total INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS order_events (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  status TEXT NOT NULL,
  -- Trạng thái NGAY TRƯỚC lần chuyển này (NULL với sự kiện khởi tạo đơn) -> nhật ký kiểm toán ghi rõ
  -- "từ trạng thái nào sang trạng thái nào", không phải suy luận từ thứ tự bản ghi.
  from_status TEXT,
  note TEXT,
  actor_type TEXT NOT NULL,
  actor_id TEXT,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL
);

ALTER TABLE order_events ADD COLUMN seller_order_id TEXT;
ALTER TABLE order_items ADD COLUMN store_id TEXT;
ALTER TABLE order_items ADD COLUMN seller_order_id TEXT;

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  audience TEXT NOT NULL,
  user_email TEXT,
  order_id TEXT,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_email TEXT,
  user_agent TEXT,
  created_at TEXT NOT NULL,
  last_success_at TEXT,
  failure_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS email_log (
  id TEXT PRIMARY KEY,
  order_id TEXT,
  to_email TEXT NOT NULL,
  kind TEXT NOT NULL,
  provider TEXT NOT NULL,
  status TEXT NOT NULL,
  provider_id TEXT,
  error TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  avatar TEXT,
  role TEXT NOT NULL DEFAULT 'member',
  provider TEXT,
  created_at TEXT NOT NULL,
  last_login_at TEXT
);

-- Người bán đăng nhập bằng email + mật khẩu: mật khẩu chỉ lưu dạng băm (scrypt).
ALTER TABLE users ADD COLUMN password_hash TEXT;
ALTER TABLE users ADD COLUMN phone TEXT;

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  role TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  user_agent TEXT
);

-- ---------------------------------------------------------------------------
-- Chỉ mục
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders (customer_email);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_events (order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_audience ON notifications (audience, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_email ON notifications (user_email);
CREATE INDEX IF NOT EXISTS idx_email_log_order ON email_log (order_id);
CREATE INDEX IF NOT EXISTS idx_stores_owner ON stores (owner_email);
CREATE INDEX IF NOT EXISTS idx_stores_status ON stores (status);
CREATE INDEX IF NOT EXISTS idx_products_store ON products (store_id);
CREATE INDEX IF NOT EXISTS idx_seller_orders_store ON seller_orders (store_id, created_at);
CREATE INDEX IF NOT EXISTS idx_seller_orders_order ON seller_orders (order_id);
CREATE INDEX IF NOT EXISTS idx_seller_orders_status ON seller_orders (status);

-- Nạp danh mục sản phẩm lần đầu: ứng dụng tự thực hiện (lib/server/seed.ts) và
-- KHÔNG ghi đè giá/tồn kho nếu bản ghi đã tồn tại, để chỉnh sửa của người vận
-- hành không bị mất khi khởi động lại.
