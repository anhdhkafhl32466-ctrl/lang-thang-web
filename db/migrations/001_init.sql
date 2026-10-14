-- ===========================================================================
--  Migration 001 — Sàn thương mại Lang Thang
--  Chạy được trên CẢ PostgreSQL (Neon / Supabase / Postgres tự vận hành)
--  và SQLite. Ứng dụng tự chạy các câu lệnh tương đương khi khởi động
--  (xem lib/server/schema.ts) — file này dành cho người vận hành muốn tạo
--  schema bằng tay (ví dụ: psql "$DATABASE_URL" -f db/migrations/001_init.sql).
--
--  LƯU Ý: nội dung phải luôn khớp với lib/server/schema.ts.
-- ===========================================================================

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
  note TEXT,
  actor_type TEXT NOT NULL,
  actor_id TEXT,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL
);

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

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  role TEXT NOT NULL,
  issued_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders (created_at);
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders (customer_email);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_events_order ON order_events (order_id);
CREATE INDEX IF NOT EXISTS idx_notifications_audience ON notifications (audience, created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_email ON notifications (user_email);
CREATE INDEX IF NOT EXISTS idx_email_log_order ON email_log (order_id);

-- Nạp danh mục sản phẩm lần đầu: ứng dụng tự thực hiện (lib/server/seed.ts) và
-- KHÔNG ghi đè giá/tồn kho nếu bản ghi đã tồn tại, để chỉnh sửa của người vận
-- hành không bị mất khi khởi động lại.
