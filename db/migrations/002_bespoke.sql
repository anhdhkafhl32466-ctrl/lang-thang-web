-- ===========================================================================
--  Migration 002 — Yêu cầu đặt làm sản phẩm ĐỘC BẢN (đồng sáng tạo cùng AI)
--  Chạy được trên CẢ PostgreSQL (Neon / Supabase / Postgres tự vận hành)
--  và SQLite. Ứng dụng tự chạy câu lệnh tương đương khi khởi động
--  (xem lib/server/schema.ts) — file này dành cho người vận hành muốn tạo
--  bảng bằng tay (ví dụ: psql "$DATABASE_URL" -f db/migrations/002_bespoke.sql).
--
--  LƯU Ý: nội dung phải luôn khớp với lib/server/schema.ts.
--  Toàn bộ câu lệnh đều "IF NOT EXISTS": chạy trên cơ sở dữ liệu đã có
--  KHÔNG xoá sản phẩm, đơn hàng hay cửa hàng hiện có.
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- Một yêu cầu = một bản thiết kế hoa văn do khách và AI cùng phác, gửi tới
-- nghệ nhân của làng nghề tương ứng để báo giá và chế tác.
-- Hoa văn lưu ngay trong bản ghi (spec_json + svg) nên nghệ nhân luôn xem lại
-- được đúng phiên bản khách đã duyệt.
-- Trạng thái: cho-bao-gia | da-bao-gia | dang-che-tac | hoan-thanh | tu-choi | da-huy.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bespoke_requests (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  customer_email TEXT,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  store_id TEXT NOT NULL,
  store_name TEXT NOT NULL,
  village_slug TEXT,
  village_name TEXT,
  blank_id TEXT NOT NULL,
  blank_name TEXT NOT NULL,
  size_id TEXT,
  size_label TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  prompt TEXT NOT NULL,
  pattern_title TEXT NOT NULL,
  pattern_story TEXT,
  pattern_layout TEXT,
  pattern_density INTEGER,
  pattern_motifs TEXT,
  palette TEXT,
  background TEXT,
  spec_json TEXT,
  svg TEXT,
  note TEXT,
  budget_vnd INTEGER,
  status TEXT NOT NULL,
  quote_price_vnd INTEGER,
  quote_days INTEGER,
  quote_note TEXT,
  quoted_at TEXT,
  decided_at TEXT,
  completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bespoke_store ON bespoke_requests (store_id, created_at);
CREATE INDEX IF NOT EXISTS idx_bespoke_customer ON bespoke_requests (customer_email, created_at);
CREATE INDEX IF NOT EXISTS idx_bespoke_status ON bespoke_requests (status);
