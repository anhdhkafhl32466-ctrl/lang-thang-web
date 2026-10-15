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
| `stores` | **Cửa hàng (người bán)**: chủ sở hữu, địa chỉ xuất hàng, toạ độ, trạng thái `pending/active/suspended/rejected` |
| `products` | Danh mục + **giá** + **tồn kho** (nguồn duy nhất khi đặt hàng); mỗi sản phẩm thuộc một `store_id` |
| `orders` | Đơn hàng **tổng** của khách: người nhận, địa chỉ + toạ độ, tổng tiền, trạng thái tổng hợp, tuyến đường |
| `seller_orders` | **Đơn con theo cửa hàng**: tiền hàng, phí ship, trạng thái, mã vận đơn **riêng** cho từng người bán |
| `order_items` | Dòng hàng (giá chụp tại thời điểm đặt) + `store_id` / `seller_order_id` để biết hàng của ai |
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

**Đồng bộ trạng thái admin → khách**: trang theo dõi tự đọc lại trạng thái mới nhất khi mở trang, khi
quay lại tab (sự kiện `visibilitychange`/`focus`), định kỳ mỗi 30 giây, và qua nút **Làm mới**. Dòng
"Trạng thái đồng bộ lúc …" cho biết lần đọc thành công gần nhất. Nếu mất mạng, trang giữ nguyên dữ
liệu đang xem và hiện cảnh báo thay vì hiển thị trạng thái sai.

**Khách không đăng nhập**: đặt hàng vẫn không cần đăng nhập. Để tra cứu đơn về sau, khách dùng khối
"Tra cứu đơn hàng không cần đăng nhập" ở trang **/don-hang**: nhập **mã đơn + số điện thoại** đã dùng
khi đặt → `POST /api/orders/lookup`. Yêu cầu **cả hai** thông tin nên không ai xem được đơn người khác
chỉ bằng cách đoán mã đơn; tra cứu đúng sẽ cấp cookie truy cập đơn có chữ ký cho chính trình duyệt đó
(nên xem được cả khi dùng máy khác). Trình duyệt lạ chưa tra cứu sẽ nhận **403**.

### 4.3 Quản trị
**/admin/don-hang** (chỉ tài khoản quản trị đã xác minh ở server):
xem toàn bộ đơn, đánh dấu "đơn mới", tự làm mới mỗi 20 giây, và chuyển trạng thái theo đúng quy trình:

```
Chờ xác nhận → Đã xác nhận → Đang chuẩn bị hàng → Đã bàn giao vận chuyển
            → Đang vận chuyển → Đang giao đến khách → Đã giao thành công
Hủy: trước khi bàn giao vận chuyển. Giao thất bại: khi đang bàn giao/vận chuyển/giao.
```

Mọi bước nhảy sai đều bị chặn (HTTP 409). Không có nhánh nào cập nhật giao diện trước khi backend xác
nhận đã lưu; nếu lưu thất bại thì giữ trạng thái cũ và hiện lý do.

Mỗi lần đổi trạng thái đều ghi một bản ghi vào `order_events` gồm:

- **trạng thái cũ** → `from_status` (NULL với sự kiện khởi tạo đơn),
- **trạng thái mới** → `status`,
- **thời gian** → `created_at`,
- **người thực hiện** → `actor_type` / `actor_id`,
- **nguồn thao tác** → `source = MANUAL_ADMIN:TRANG_QUAN_TRI`.

Cột `from_status` được thêm bằng migration idempotent trong `lib/server/schema.ts` — CSDL đang chạy
**không bị xoá hay tạo lại**, sự kiện cũ trả về `fromStatus: null`. Lịch sử đầy đủ hiển thị ở cả trang
quản trị và trang khách theo dõi.

**Điều hướng**: quản trị viên đăng nhập thành công được đưa **thẳng** tới `/admin/don-hang` (không qua
trang chủ, không phải tự tìm menu). Người chưa đăng nhập vào `/admin/don-hang` bị chuyển tới
`/dang-nhap?next=/admin/don-hang` và quay lại đúng trang quản trị sau khi xác thực. Thành viên thường
nhận thông báo "không có quyền quản trị" (HTTP 403), không bị chuyển hướng vòng lặp.

---

### 4.4 Khởi tạo quyền quản trị an toàn (khi chưa có Google Client ID)
Quyền quản trị **chỉ** được cấp khi máy chủ tự xác minh được danh tính, qua một trong hai đường:

| Đường | Điều kiện cấp quyền | Ghi chú |
|---|---|---|
| `google` | ID token Google hợp lệ (chữ ký, `aud`, `email_verified`) **và** email = `ADMIN_EMAIL` | Cần `NEXT_PUBLIC_GOOGLE_CLIENT_ID` |
| `admin-key` | Chuỗi khớp `ADMIN_ACCESS_KEY` (≥ 24 ký tự, so sánh `timingSafeEqual`) | Dự phòng khi chưa cấu hình Google |
| `email-mx` | **Không bao giờ** được cấp quyền quản trị | Chỉ kiểm tra MX/DNS — không chứng minh sở hữu hộp thư |

Khoá dự phòng đặt ở mục **2** của `.env.example`:

```bash
# Sinh khoá mới (43 ký tự)
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
# Dán kết quả vào .env.local:  ADMIN_ACCESS_KEY=<khoá vừa sinh>
```

Sau đó vào **/dang-nhap → “Đăng nhập quản trị bằng khoá máy chủ”**, dán khoá → hệ thống thiết lập cookie
phiên httpOnly và đưa thẳng tới trang quản lý đơn hàng.

Quy tắc an toàn bắt buộc:
- Khoá **không** được gửi xuống trình duyệt, không lưu localStorage, không ghi log; chỉ so sánh ở server.
- Sai khoá 8 lần trong 15 phút sẽ bị tạm chặn (429) để chống dò khoá.
- Khoá **không** cho phép chọn email: máy chủ luôn cấp quyền cho đúng `ADMIN_EMAIL` đã cấu hình.
- Lưu khoá trong `.env.local` (đã bị gitignore). **Xoay khoá** bằng cách đổi giá trị rồi khởi động lại.
- Muốn thu hồi **mọi phiên đang đăng nhập**, xoay `SESSION_SECRET` (cookie cũ sẽ không còn hợp lệ).
- Chưa cấu hình khoá: endpoint trả **503** kèm tên biến còn thiếu; giao diện ghi rõ "đang tắt" — không
  bao giờ giả lập đăng nhập thành công.

---

## 5. Bảo mật

- **Quyền quản trị quyết định ở server**: cookie phiên ký HMAC (`SESSION_SECRET`), httpOnly.
  Vai trò `admin` chỉ được cấp khi máy chủ tự xác minh danh tính: ID token Google hợp lệ trùng
  `ADMIN_EMAIL`, **hoặc** khoá `ADMIN_ACCESS_KEY` khớp (xem 4.4).
  Đường đăng nhập bằng email (kiểm tra MX/DNS) **chỉ** có quyền thành viên — kể cả khi gõ đúng email
  quản trị, vì MX chỉ chứng minh tên miền có máy chủ thư chứ không chứng minh quyền sở hữu hộp thư.
  Một đường đăng nhập yếu hơn cũng **không** hạ quyền của tài khoản quản trị đã có (`users.role`).
- **Không lộ khoá AI**: khoá dùng chung (`GEMINI_API_KEY`) chỉ tồn tại ở server; `/api/config` chỉ trả về
  cờ `services.ai.configured` (true/false). Khách **không** cần dán khoá riêng để dùng trợ lý.
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
| Khoá cứu hộ quản trị | `ADMIN_ACCESS_KEY` | ✅ **Đã chạy thật**: đăng nhập bằng khoá → đi thẳng `/admin/don-hang`; sai khoá → 401; dò khoá → 429 |
| Trợ lý AI không cần khoá riêng | `GEMINI_API_KEY` | ⚠️ Code xong (khoá dùng chung ở server + ẩn yêu cầu dán khoá); **chưa có khoá thật** nên đang chạy Engine Chuyên gia nội bộ và ghi rõ nguồn là engine nội bộ |

---

# PHẦN MỞ RỘNG: SÀN ĐA NGƯỜI BÁN (MULTI-VENDOR)

## 8. Mô hình ba nhóm quyền

| Nhóm | Cách xác thực | Được làm gì | Không được làm gì |
|---|---|---|---|
| Khách hàng | Google / email MX (quyền `member`) hoặc không đăng nhập | Xem sản phẩm của **mọi cửa hàng đang hoạt động**, tìm/lọc, giỏ hàng, đặt hàng, theo dõi đơn của chính mình | Không chạm được API cửa hàng (403 `not_a_seller`) |
| Người bán | Email + mật khẩu (scrypt), phiên `role = 'seller'` | Quản lý **duy nhất** cửa hàng của mình: hồ sơ, sản phẩm, đơn con, trạng thái giao hàng, thống kê | Không đọc/ghi dữ liệu cửa hàng khác (404 ở tầng SQL), không vào API quản trị (403) |
| Quản trị viên sàn | Google đã xác minh trùng `ADMIN_EMAIL` **hoặc** `ADMIN_ACCESS_KEY` | Toàn sàn: duyệt/tạm khoá cửa hàng, xem mọi sản phẩm & đơn, đẩy trạng thái đơn con, xem thông báo vận hành | — |

Tài khoản người mua **không bao giờ** tự động có quyền người bán: `requireSeller()` đòi `role = 'seller'`
trong cookie phiên đã ký, rồi tra cửa hàng **từ email trong phiên** mỗi lần gọi API (xem
`lib/server/sellerAuth.ts`). Nhờ tra lại mỗi lần, quản trị viên **tạm khoá là có hiệu lực ngay**, người bán
không thể giữ quyền bằng phiên cũ.

## 9. Trạng thái tài khoản người bán

| Trạng thái | Nhãn | Đăng bán | Hiển thị trên sàn | Xử lý đơn |
|---|---|---|---|---|
| `pending` | Chờ xét duyệt | ❌ 403 `store_not_active` | ❌ | ❌ |
| `active` | Đang hoạt động | ✅ | ✅ | ✅ |
| `suspended` | Bị tạm khoá | ❌ | Sản phẩm bị ẩn, không đặt được | ❌ |
| `rejected` | Bị từ chối / ngừng hoạt động | ❌ | ❌ | ❌ |

Mặc định đăng ký → `pending` (quản trị viên duyệt). Muốn cho bán ngay sau đăng ký, đặt
`SELLER_AUTO_APPROVE=true` trong `.env.local`: hồ sơ được tạo ở trạng thái `active` và quản trị viên
vẫn nhận thông báo để biết ai vừa tham gia sàn.

## 10. Phân đơn theo cửa hàng (đơn cha – đơn con)

```
Khách bấm Đặt hàng
  └─ POST /api/orders
       ├─ đọc giá/tồn kho từ DB, kiểm tra tồn kho            (không tin giá client gửi)
       ├─ nhóm hàng theo store_id, tính RIÊNG từng chặng ship (địa chỉ xuất hàng của cửa hàng)
       └─ 1 giao dịch:
            ├─ trừ tồn kho có điều kiện (chống bán quá tồn)
            ├─ tạo `orders`            ← đơn TỔNG của khách, trạng thái tổng hợp
            └─ với mỗi cửa hàng: tạo `seller_orders` (đơn con) + `order_items` + `order_events`
  └─ sau giao dịch: thông báo trong website + email + Web Push
       • quản trị viên   → thông báo đơn mới
       • khách           → xác nhận đã nhận đơn
       • CHỈ những người bán có hàng trong đơn → thông báo "đơn mới" + email + push
```

Quy tắc bắt buộc đã được kiểm chứng:

- Khách mua 1 cửa hàng → **1 đơn con**; mua 3 cửa hàng → **3 đơn con** riêng, mỗi cửa hàng một mã
  (`LT26…-01`, `-02`, `-03`).
- Người bán chỉ đọc/ghi được đơn con của mình: mọi câu truy vấn đều kèm `store_id = <cửa hàng trong phiên>`;
  truy cập chéo trả **404** (không tiết lộ đơn có tồn tại hay không).
- **Không** gửi toàn bộ đơn cho mọi người bán; người bán không liên quan không nhận được thông báo nào.
- Trạng thái **đơn tổng được tổng hợp** từ các đơn con (`rollupParentStatus`): tất cả huỷ → huỷ; các đơn
  còn hiệu lực đều đã giao → đã giao; còn lại lấy đơn con **chậm nhất** trên tiến trình (đơn chỉ hoàn tất
  khi cửa hàng chậm nhất giao xong).
- Tiền: `tổng đơn = subtotal + phí ship`, và `Σ đơn con = đơn tổng` — đã kiểm tra khớp trong kiểm thử.

## 11. Quy trình xử lý & giao hàng của người bán

Người bán chỉ được chuyển sang **bước kế tiếp hợp lệ** của quy trình (bảng chuyển trạng thái sinh từ
`lib/orders/workflow.ts`, giao diện hiển thị đúng những nút mà máy chủ cho phép):

```
Đơn mới → Đã xác nhận → Đang chuẩn bị hàng → Đã chuẩn bị xong → Đã bàn giao vận chuyển
       → Đang vận chuyển → Đang giao đến khách → Đã giao thành công
Huỷ: trước khi bàn giao vận chuyển · Giao thất bại: khi đang bàn giao / vận chuyển / giao
```

- Nhảy bước (ví dụ người bán tự đánh dấu **đã giao** khi chưa bàn giao) bị chặn **409 `invalid_transition`**.
- Hai người thao tác cùng lúc không ghi đè nhau: cập nhật điều kiện `WHERE id = ? AND status = <trạng thái cũ>`,
  lệch trạng thái trả **409 `stale_status`**.
- Người bán có thể nhập **đơn vị vận chuyển + mã vận đơn** khi bàn giao. Đây là dữ liệu **do người bán xác
  nhận**, giao diện ghi rõ "(do người bán cập nhật)" — **không** phải tracking trực tiếp từ hãng vận chuyển,
  và hệ thống không giả lập GPS shipper.
- Mỗi lần đổi trạng thái ghi **2 sự kiện** (một ở đơn con, một ở đơn cha gắn nhãn cửa hàng) kèm thời gian,
  người thực hiện (`actor_type`/`actor_id`) và nguồn (`MANUAL_SELLER:<slug>`).

## 12. Thông báo cho từng người bán

| Kênh | Nội dung | Ghi chú |
|---|---|---|
| **Trong website (kênh chính)** | `notifications` (audience `seller`) + chuông ở thanh điều hướng và trang **Thông báo** | **Lưu vào DB trước**, không phụ thuộc email |
| **Thẻ nổi ngay trên trang** | Thông báo mới tự nổi ở góc phải trên (bấm “Xem chi tiết” là mở đúng đơn con), tự tắt sau 12 giây | Xem `components/orders/NotificationToasts.tsx`; **không cần** email, HTTPS hay VAPID |
| **Thông báo hệ điều hành** | Chỉ hiện khi tab đang ở phía sau **và** người dùng đã bấm “Bật” trong chuông (quyền `Notification`) | Không cần HTTPS; nếu bị chặn thì thẻ nổi vẫn hoạt động |
| **Số chưa đọc trên tiêu đề tab** | `(3) Trung tâm người bán…` khi tab ở phía sau, tự mất khi quay lại tab | Giúp người bán không bỏ lỡ đơn khi đang mở tab khác |
| Email | Email "đơn mới" tới **email chủ cửa hàng**, email cảnh báo khi đơn **huỷ / giao thất bại** | Gửi qua **Resend**; thiếu `RESEND_API_KEY` → ghi rõ `skipped_no_credentials`, đơn vẫn nguyên vẹn |
| Web Push | Push tới thiết bị đã đăng ký của **đúng người bán đó** | Cần VAPID + HTTPS |
| Quản trị viên | Thông báo tổng hợp + email đơn mới, email hồ sơ người bán cần duyệt | Gửi tới `ADMIN_EMAIL` |

Nguyên tắc: mọi bước gửi nằm **sau** giao dịch lưu đơn và đều được bọc `try/catch` — email/push lỗi
**không** làm mất cập nhật trạng thái hay đơn hàng (đã kiểm chứng ở mục 15).

## 13. Địa chỉ, GPS và kho xuất hàng

- Mỗi cửa hàng khai **địa chỉ xuất hàng + toạ độ** trong Hồ sơ cửa hàng.
- Đơn con lưu **bản chụp** `store_name` / `store_address` tại thời điểm đặt → sửa hồ sơ sau này **không**
  làm thay đổi đơn cũ.
- Phí vận chuyển tính **theo từng chặng** bằng tuyến đường bộ thật (OSRM/OpenStreetMap) từ địa chỉ xuất
  hàng của cửa hàng tới địa chỉ khách; tổng phí đơn = tổng các chặng.
- Cửa hàng **chưa khai toạ độ** thì dùng **kho mặc định của sàn** (Đại học FPT Hà Nội) và trạng thái chặng
  ghi rõ "đã tính bằng KHO MẶC ĐỊNH của sàn (cửa hàng chưa khai toạ độ xuất hàng)" — không im lặng coi như nhau.
- Phiếu trả trước khi đặt (`/api/shipping/quote?items=...`) và lúc tạo đơn dùng **cùng một hàm**, nên số tiền
  hiển thị khớp số tiền máy chủ tính.
- Không dùng GPS của người bán làm địa chỉ giao hàng của khách; không tự sinh toạ độ hay phí.

## 14. API của sàn đa người bán

| Nhóm | Endpoint | Quyền |
|---|---|---|
| Đăng ký/đăng nhập người bán | `POST /api/seller/register`, `GET/POST/DELETE /api/seller/session` | công khai (có giới hạn tần suất + chống CSRF) |
| Hồ sơ & thống kê cửa hàng | `GET/PATCH /api/seller/store`, `GET /api/seller/overview`, `GET /api/seller/stats` | người bán đang đăng nhập |
| Sản phẩm của tôi | `GET/POST /api/seller/products`, `GET/PATCH/DELETE /api/seller/products/[id]` | người bán (`active` để đăng bán) |
| Tải ảnh | `POST /api/seller/uploads`, `GET /api/uploads/[key]` | người bán |
| Đơn của cửa hàng | `GET /api/seller/orders`, `GET/PATCH /api/seller/orders/[id]` | người bán `active` |
| Quản trị cửa hàng | `GET /api/admin/stores`, `PATCH /api/admin/stores/[id]` | quản trị viên |
| Đơn toàn sàn | `GET /api/admin/orders`, `PATCH /api/admin/orders/[id]` | quản trị viên (đẩy trạng thái tới từng đơn con) |

## 15. Kiểm thử đầu-cuối (đã chạy thật)

Script: [`scripts/e2e-marketplace.mjs`](../scripts/e2e-marketplace.mjs) — gọi **đúng các HTTP API mà trình duyệt
gọi**, mỗi vai trò một "trình duyệt" với cookie phiên riêng.

```bash
# 1) chạy server trên CSDL kiểm thử riêng (KHÔNG dùng CSDL thật của khách)
cd lang-thang-web
npx next build                                                       # next start cần bản build trước
SQLITE_DB_FILE="$PWD/.data/e2e-marketplace.db" npx next start -p 3123

# 2) chạy kiểm thử
E2E_BASE_URL=http://127.0.0.1:3123 node scripts/e2e-marketplace.mjs
#   hoặc: npm run test:e2e
```

**Kết quả lần chạy gần nhất: 91/91 kiểm tra đạt, 0 lỗi máy chủ** — chạy lại trên **bản build production
(`npx next build` → `npx next start`)** của mã hiện tại với CSDL kiểm thử trống, đúng nhánh migration mới
nhất. Nhật ký đầy đủ: `.data/e2e-run.log`. Nội dung kiểm chứng:

| # | Kịch bản | Kết quả |
|---|---|---|
| 1 | Khách đăng ký người bán A/B/C → hồ sơ `pending`, mật khẩu không trả về client | ✅ |
| 2 | Cửa hàng chờ duyệt **không** đăng được sản phẩm (403 `store_not_active`) | ✅ |
| 3 | Tài khoản thành viên gọi API cửa hàng → 403 `not_a_seller` | ✅ |
| 4 | Quản trị viên đăng nhập bằng khoá → duyệt A/B/C sang `active` | ✅ |
| 5 | Người bán đăng nhập lại bằng email + mật khẩu; sai mật khẩu → 401 | ✅ |
| 6 | Đăng sản phẩm: `storeId` giả mạo từ client **bị bỏ qua**; làng nghề/giá sai bị 400 | ✅ |
| 7 | Sản phẩm xuất hiện trang mua hàng kèm tên cửa hàng + trạng thái | ✅ |
| 8 | Khách mua hàng của A → 1 đơn con, tồn kho trừ đúng, trình duyệt khác nhận 403 | ✅ |
| 9 | **Chỉ A** thấy đơn và nhận thông báo; B không thấy; quản trị viên có thông báo | ✅ |
| 10 | A đọc/ghi đơn của B bị chặn 404; người bán không vào được API quản trị | ✅ |
| 11 | Khách mua từ **ba cửa hàng** → **3 đơn con** riêng, tiền khớp đơn tổng | ✅ |
| 12 | A cập nhật trạng thái từng bước; khách thấy trạng thái mới; nhảy bước bị 409 | ✅ |
| 13 | Quản trị viên thấy đơn con theo cửa hàng và hoàn tất đơn; doanh thu A ghi nhận | ✅ |
| 14 | Tạm khoá B → B không đăng bán/không xử lý đơn, sản phẩm ẩn, khách không đặt được | ✅ |
| 15 | Tải lại trang: sản phẩm, trạng thái đơn và **thông báo vẫn còn** trong DB | ✅ |
| 16 | Toàn bộ trang văn hóa cũ (/, /lang-nghe, /san-pham, /gio-hang, /trai-nghiem, /ho-chieu, /ban-do, /du-lich, /thanh-toan) trả 200 | ✅ |

## 16. Những phần CHƯA thể kiểm chứng (cần bạn cấu hình)

| Hạng mục | Trạng thái |
|---|---|
| Gửi **email thật** (Resend) | Code hoàn chỉnh + ghi `email_log`; chưa gửi thật vì thiếu `RESEND_API_KEY`/`EMAIL_FROM`. Kiểm thử xác nhận **thông báo trong website vẫn được lưu** khi email không gửi được |
| **Web Push** thật | Code hoàn chỉnh + VAPID đã cấu hình; cần HTTPS và người dùng cấp quyền thông báo để xác thực giao thành công |
| **Xác minh email** người bán | Chưa có dịch vụ email xác minh nên đăng ký từ chối email đã tồn tại (không cho "nhận lại" tài khoản bằng cách đặt mật khẩu mới). Khi có Resend, có thể bật luồng gửi link xác minh |
| **PostgreSQL (Neon)** | Cùng bộ SQL, đã chạy trên SQLite; **nhánh Postgres chưa chạy thử** ở máy này |
| **API hãng vận chuyển** | Chưa tích hợp: trạng thái vận chuyển do **người bán cập nhật thủ công**, giao diện ghi rõ điều đó; không giả lập tracking/GPS |
| **Thanh toán trực tuyến** | Hiện là COD như trước; chưa nối cổng thanh toán |

## 17. Dữ liệu demo & tài khoản thử (để mở Trung tâm người bán có dữ liệu thật)

CSDL mặc định của `npm run dev` là `.data/lang-thang.db`. Sau khi chạy seed, CSDL này có **hai cửa hàng
thật** để trình diễn mô hình đa người bán:

| Cửa hàng | Trạng thái | Chủ sở hữu | Ghi chú |
|---|---|---|---|
| Lang Thang — Sàn di sản | `active` | email `ADMIN_EMAIL` | Gian hàng của sàn, chứa 18 sản phẩm văn hóa gốc |
| Cửa hàng Demo — Gốm Bát Tràng | `active` | `demo.nguoiban@langthang.test` | Do script seed tạo, có 2 sản phẩm + 1 đơn demo đã tách đơn con |

```bash
# Server đang chạy (npm run dev) rồi mới chạy seed. Đổi cổng cho đúng server của bạn:
# npm run dev mặc định ở 3000; ví dụ dưới đây dùng server đang chạy ở 3123.
E2E_BASE_URL=http://127.0.0.1:3123 node scripts/seed-demo-seller.mjs
```

Tài khoản tạo ra (chỉ để thử trong máy — **đổi mật khẩu nếu dùng ngoài máy cá nhân**):

| Vai trò | Đăng nhập tại | Tài khoản |
|---|---|---|
| Người bán demo | `/ban-hang/dang-nhap` | `demo.nguoiban@langthang.test` / `Demo123456!` |
| Quản trị viên sàn | `/dang-nhap` → ô “Đăng nhập quản trị bằng khoá máy chủ” | dán `ADMIN_ACCESS_KEY` |

Sau khi đăng nhập người bán, hệ thống đưa thẳng vào Trung tâm người bán với đơn demo `…-01` ở trạng thái
“Chờ xác nhận”. Đơn demo này có **hai đơn con** (một của cửa hàng gốm demo, một của gian hàng sàn) nên nhìn
được ngay việc tách đơn theo cửa hàng ở cả ba nơi: Trung tâm người bán, `/admin/don-hang` và trang khách.

**Cách tạo lại dữ liệu sạch:** đổi `SQLITE_DB_FILE` sang file khác rồi khởi động lại server (không cần xoá
tay bản ghi nào), hoặc xoá `.data/lang-thang.db*` khi server đã tắt. Việc tạo tài khoản quản trị viên và
duyệt người bán được mô tả ở mục 4.4 và mục 4.3.

### Ghi chú sửa lỗi giao diện (đã kiểm chứng lại trên trình duyệt)

- Khung kiểm tra phiên của Trung tâm người bán nằm **cùng layout** với trang đăng nhập người bán, nên sau
  khi đăng nhập nó không được dựng lại và hiển thị “Tài khoản này không phải tài khoản người bán” cho tới
  khi tải lại trang. Đã sửa: khung đọc lại phiên khi **đổi đường dẫn** và khi có sự kiện `auth_state_changed`
  (phát ra ngay sau khi đăng nhập/đăng xuất người bán trong `lib/client/sellerApi.ts`).
- Đăng nhập người bán giờ cập nhật luôn **danh tính hiển thị** trên thanh điều hướng theo tài khoản người
  bán (trước đó còn sót avatar/tên của tài khoản quản trị đã đăng nhập trước đó). Quyền hạn vẫn do phiên
  máy chủ quyết định — giá trị lưu ở trình duyệt chỉ để hiển thị.
