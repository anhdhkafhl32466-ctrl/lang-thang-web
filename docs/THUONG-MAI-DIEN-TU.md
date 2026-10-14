# Sàn thương mại điện tử Lang Thang — hướng dẫn triển khai

Tài liệu này mô tả kiến trúc, cách cấu hình và cách kiểm thử phần sàn thương mại được bổ sung
vào website làng nghề. Giao diện, nội dung văn hóa và các tính năng cũ (bản đồ, hộ chiếu làng nghề,
mini-game, trợ lý AI) **giữ nguyên**.

---

## 1. Kiến trúc

| Thành phần | Công nghệ | Ghi chú |
|---|---|---|
| Giao diện | Next.js 14 App Router + Tailwind | Dùng lại đúng phong cách sẵn có |
| API nghiệp vụ | Next.js Route Handlers (`app/api/**`) | Toàn bộ giá/tồn kho/tổng tiền tính ở server |
| Cơ sở dữ liệu | PostgreSQL (khuyến nghị **Neon**) hoặc SQLite nhúng (`node:sqlite`) | Chọn tự động theo `DATABASE_URL` |
| Bản đồ / GPS / định tuyến | OpenStreetMap: Leaflet, Nominatim, OSRM, Overpass | Không cần API key, đúng stack sẵn có của dự án |
| Email giao dịch | **Resend** | Kết quả gửi lấy từ phản hồi API, lưu vào `email_log` |
| Thông báo đẩy | Web Push + VAPID + Service Worker (`public/sw.js`) | Cần HTTPS khi chạy thật |

### Vì sao chọn Postgres (Neon) + Resend
Hai dịch vụ này được chọn trong danh mục Gravity Index của nền tảng: **Neon** (serverless Postgres,
phù hợp Vercel, có gói miễn phí) và **Resend** (email giao dịch, API key đơn giản, đúng yêu cầu
"Resend / SendGrid / SMTP"). Lớp truy cập dữ liệu chỉ dùng tập con SQL tương thích cả Postgres và
SQLite nên cùng một schema chạy được ở cả hai.

---

## 2. Bảng dữ liệu

| Bảng | Vai trò |
|---|---|
| `products` | Danh mục + **giá** + **tồn kho** (nguồn duy nhất khi đặt hàng) |
| `orders` | Đơn hàng: người nhận, địa chỉ + toạ độ, tổng tiền, trạng thái, tuyến đường |
| `order_items` | Dòng hàng (giá chụp tại thời điểm đặt) |
| `order_events` | **Lịch sử trạng thái**: thời gian, người/hệ thống thực hiện, nguồn cập nhật |
| `notifications` | Thông báo trong website (chưa đọc / đã đọc, link tới đơn) |
| `push_subscriptions` | Đăng ký Web Push của từng thiết bị |
| `email_log` | Kết quả gửi email thật (`sent` / `failed` / `skipped_no_credentials`) |
| `users`, `sessions` | Tài khoản và nhật ký phiên phía máy chủ |

Schema đầy đủ: [`db/migrations/001_init.sql`](../db/migrations/001_init.sql) và
[`lib/server/schema.ts`](../lib/server/schema.ts) (ứng dụng tự tạo schema khi khởi động, chạy lại an toàn).

---

## 3. Biến môi trường

Xem đầy đủ trong [`.env.example`](../.env.example). Tóm tắt:

| Biến | Bắt buộc | Mục đích |
|---|---|---|
| `ADMIN_EMAIL` | ✅ | Email nhận thông báo đơn. Mặc định `anhdhkafhl32466@gmail.com` |
| `SESSION_SECRET` | ✅ (production) | Khoá ký cookie phiên + cookie truy cập đơn của khách |
| `DATABASE_URL` | ⬜ (khuyến nghị) | Có → dùng Postgres; không → dùng SQLite tại `.data/lang-thang.db` |
| `RESEND_API_KEY` | ⬜ | Gửi email. Thiếu → hệ thống ghi rõ "chưa gửi", KHÔNG báo thành công giả |
| `EMAIL_FROM` | ⬜ | Địa chỉ người gửi đã xác minh trong Resend |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT` | ⬜ | Web Push (`npx web-push generate-vapid-keys`) |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | ✅ (để đăng nhập Google & cấp quyền quản trị) | Xác minh ID token Google ở server |
| `WAREHOUSE_ADDRESS` / `WAREHOUSE_LAT` / `WAREHOUSE_LNG` | ⬜ | Chỉ khai báo khi muốn đổi kho xuất hàng |

### Tạo khoá nhanh

```bash
# SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Cặp khoá VAPID cho Web Push
npx web-push generate-vapid-keys
```

### Lấy `DATABASE_URL` (Neon)
1. Tạo project tại <https://console.neon.tech>
2. **Connection Details** → copy connection string (nên dùng host có `-pooler` cho serverless)
3. Dán vào `DATABASE_URL` trong `.env.local` (và trong biến môi trường của Vercel)

Sau khi có `DATABASE_URL`, không cần chạy migration thủ công: lần gọi API đầu tiên sẽ tự tạo schema.
Nếu muốn chủ động: `psql "$DATABASE_URL" -f db/migrations/001_init.sql`.

### Lấy `RESEND_API_KEY`
1. Tạo API key tại <https://resend.com/api-keys>
2. Xác minh tên miền gửi, rồi đặt `EMAIL_FROM="Lang Thang <donhang@tenmien.vn>"`

---

## 4. Luồng nghiệp vụ

### 4.1 Đặt hàng
1. Khách chọn sản phẩm → giỏ hàng (bản nháp trong trình duyệt).
2. Trang **/thanh-toan**:
   - Bấm **Lấy vị trí GPS của tôi** → `Geolocation API` trả toạ độ **thật** của thiết bị.
   - Hoặc tìm địa chỉ (Nominatim) / bấm & kéo marker trên bản đồ → **Xác nhận điểm đã chọn**.
   - Hệ thống gọi `/api/geo/directions` để vẽ **tuyến đường bộ thật** từ kho tới điểm nhận hàng và
     `/api/shipping/quote` để tính phí.
3. `POST /api/orders`:
   - Máy chủ **đọc lại giá và tồn kho từ cơ sở dữ liệu**, bỏ qua giá do client gửi.
   - Trừ tồn kho và tạo đơn trong **cùng một giao dịch** (chống bán quá tồn).
   - Tạo **sự kiện** `pending_confirmation`, **thông báo** cho quản trị và cho khách.
   - Gửi **email** cho quản trị và cho khách (nếu có email) — kết quả thật được trả về và hiển thị.
   - Gửi **Web Push** nếu thiết bị đã đăng ký.
   - Phát cookie có chữ ký cho phép chính trình duyệt đó xem lại đơn dù chưa đăng nhập.

### 4.2 Theo dõi đơn
Khách xem **/don-hang** (cần đăng nhập) hoặc **/don-hang/[id]** (chủ đơn / quản trị / trình duyệt đã đặt).
Trang hiển thị thanh tiến trình 7 bước, tuyến đường, toạ độ đã chọn và **lịch sử trạng thái** kèm
nguồn cập nhật. Không hiển thị "Đang giao" nếu chưa có sự kiện tương ứng.

### 4.3 Quản trị
**/admin/don-hang** (chỉ `ADMIN_EMAIL` + phiên Google đã xác minh):
xem toàn bộ đơn, đánh dấu "đơn mới", tự làm mới mỗi 20 giây, và chuyển trạng thái theo đúng quy trình:

```
Chờ xác nhận → Đã xác nhận → Đang chuẩn bị hàng → Đã bàn giao vận chuyển
            → Đang vận chuyển → Đang giao đến khách → Đã giao thành công
Hủy: trước khi bàn giao vận chuyển. Giao thất bại: khi đang bàn giao/vận chuyển/giao.
```

Mọi bước nhảy sai đều bị chặn (HTTP 409). Người cập nhật chỉ có thể là quản trị viên đã đăng nhập,
và được ghi lại trong `order_events` (`actor_type`, `actor_id`, `source = MANUAL_ADMIN:TRANG_QUAN_TRI`).

---

## 5. Bảo mật

- **Quyền quản trị quyết định ở server**: cookie phiên ký HMAC (`SESSION_SECRET`), httpOnly.
  Vai trò `admin` chỉ được cấp khi ID token Google được xác minh ở server **và** email trùng `ADMIN_EMAIL`.
  Đường đăng nhập bằng email (kiểm tra MX/DNS) **chỉ** có quyền thành viên.
- **Không truyền email quản trị hay khoá bí mật ra trình duyệt**: email chỉ nằm trong cấu hình server.
- **Chống CSRF**: mọi thao tác ghi yêu cầu `Origin`/`Referer` cùng nguồn.
- **Chống IDOR**: chi tiết đơn chỉ mở cho chủ đơn, quản trị viên, hoặc cookie truy cập đơn có chữ ký.
- **Không có mật khẩu mặc định**; không lưu mật khẩu hay API key trong mã nguồn.

---

## 6. Kiểm thử

```bash
npm run lint
npx tsc --noEmit
npm run build
npm run dev      # rồi kiểm thử thủ công tại http://localhost:3000
```

Đã kiểm chứng trong quá trình triển khai (xem báo cáo gửi kèm): tạo đơn thật trong DB, trừ tồn kho,
chặn bán quá tồn (409), chặn cross-origin (403), quyền xem đơn của khách có/không có cookie chữ ký,
phân quyền quản trị (401/403), chuyển trạng thái hợp lệ/lỗi, tuyến đường thật từ kho, và kết quả
email/push được báo đúng sự thật.

---

## 7. Những phần cần bạn cấu hình để chạy thật

| Tính năng | Cần gì | Trạng thái code |
|---|---|---|
| Lưu đơn bền vững trên Vercel | `DATABASE_URL` (Neon) | ✅ Đã viết, đã chạy với SQLite; **nhánh Postgres chưa chạy thử** (máy này không có Postgres) |
| Gửi email thật | `RESEND_API_KEY`, `EMAIL_FROM` | ✅ Đã viết; **chưa gửi thật** vì thiếu key |
| Web Push thật | HTTPS + cặp VAPID | ✅ Đã viết; subscribe/send đã chạy tới bước dịch vụ push, **chưa xác thực được giao thành công** vì môi trường kiểm thử chặn quyền thông báo |
| Đăng nhập Google | `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | ✅ Đã viết; **chưa đăng nhập Google thật** vì thiếu Client ID |
