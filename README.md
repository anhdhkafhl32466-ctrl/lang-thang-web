# LÀNG NGHỀ HÀ NỘI (HANOI CRAFT VILLAGES PLATFORM)
> **"Chạm vào truyền thống – Trải nghiệm tinh hoa"**

Nền tảng trải nghiệm văn hóa du lịch số và xúc tiến thương mại làng nghề truyền thống Hà Nội, kết nối 4 trụ cột cốt lõi:
**Discover (Khám phá)** → **Experience (Trải nghiệm làm nghề ảo)** → **Connect (Kết nối tour & nghệ nhân)** → **Commerce (Thương mại điện tử tinh hoa)**.

---

## 1. TỔNG QUAN TÍNH NĂNG VÀ CÁC ROUTE TRÊN HỆ THỐNG

| Tuyến đường (Route) | Mô tả tính năng |
| :--- | :--- |
| `/` | **Trang chủ:** Hero cinematic, Flash Cards tương tác, Storytelling 8 bước (Đất → Đôi tay → Nghệ nhân → Tác phẩm → Văn hóa → Trải nghiệm → Du lịch → Thương mại), Bản đồ thu nhỏ, Hệ sinh thái startup và Hộ chiếu làng nghề |
| `/lang-nghe` | **Danh mục làng nghề:** Tìm kiếm thông minh, bộ lọc danh mục (Gốm sứ, Lụa, Mây tre, Nón lá, Dát vàng, Dân gian...) |
| `/lang-nghe/[slug]` | **Chi tiết làng nghề:** Lịch sử & timeline, Quy trình chế tác step-by-step, Nghệ nhân tiêu biểu, Bộ sưu tập ảnh & Lightbox, Sản phẩm tinh hoa, Tour liên quan |
| `/ban-do` | **Bản đồ số Leaflet + OpenStreetMap:** Tọa độ vệ tinh chính xác 8 làng nghề tiêu biểu, marker phân loại tùy biến, popup preview, điều hướng trực tiếp |
| `/trai-nghiem` | **Trung tâm xưởng nghề ảo:** Danh sách các workshop trực tuyến tương tác 2D & Canvas |
| `/trai-nghiem/gom` | **Mini-game Làm gốm Bát Tràng:** Chọn đất sét, vuốt dáng bình gốm trên bàn xoay chuyển động, phủ men lam / men ngọc celadon, nung lò 1.250°C, nhận tác phẩm ảo & huy hiệu |
| `/trai-nghiem/dan-non` | **Mini-game Đan nón làng Chuông:** Ủi phẳng lá lụi, xếp 16 vành tre, lồng bài thơ lục bát xứ Đoài, khâu từng mũi cước viền nón |
| `/ai-goi-y` | **AI Recommendation:** Trắc nghiệm 4 bước tìm làng nghề phù hợp nhất theo sở thích, ngân sách, thời gian, sinh lịch trình và ẩm thực địa phương |
| `/du-lich` | **Du lịch trực tuyến & Thực tế:** 360 virtual hotspots, danh mục workshop làm nghề, tour nửa ngày & 1 ngày, form giữ chỗ trải nghiệm |
| `/san-pham` | **Sàn thương mại tinh hoa làng nghề:** Danh mục sản phẩm thủ công cao cấp OCOP, modal chi tiết kỹ nghệ và liên kết trực tiếp tới Shopee / TikTok Shop |
| `/chia-se-lang-nghe` | **Cổng tiếp nhận thông tin cộng đồng:** Dành cho nghệ nhân, người dân gửi thông tin làng nghề với preview hình ảnh và cam kết bản quyền |
| `/admin` | **Bảng quản trị Startup:** Thống kê lượt truy cập, tỷ lệ chơi game, doanh thu liên kết, quản lý làng nghề và duyệt bài nộp cộng đồng |
| Widget nổi | **Trợ lý Khám phá Làng nghề AI:** Chatbot tư vấn lịch trình, ẩm thực, ngân sách nổi ở góc màn hình |
| Modal nổi | **Hộ Chiếu Làng Nghề (Craft Passport):** Tích điểm, lưu trữ tác phẩm đã tạo và hệ thống huy hiệu di sản trong LocalStorage |

---

## 2. CẤU TRÚC THƯ MỤC DỰ ÁN

```text
hanoi-craft-villages/
├── app/
│   ├── layout.tsx                    # Root layout thiết lập metadata, SEO và font chữ
│   ├── page.tsx                      # Trang chủ Storytelling
│   ├── globals.css                   # Tailwind base, Leaflet styles và bảng màu văn hóa
│   ├── lang-nghe/
│   │   ├── page.tsx                  # Trang danh sách làng nghề
│   │   └── [slug]/page.tsx           # Trang chi tiết từng làng nghề
│   ├── ban-do/
│   │   └── page.tsx                  # Bản đồ tương tác Leaflet
│   ├── trai-nghiem/
│   │   ├── page.tsx                  # Hub workshop ảo
│   │   ├── gom/page.tsx              # Mini-game vuốt gốm Bát Tràng
│   │   └── dan-non/page.tsx          # Mini-game khâu nón làng Chuông
│   ├── ai-goi-y/
│   │   └── page.tsx                  # AI Recommendation Quiz
│   ├── du-lich/
│   │   └── page.tsx                  # Du lịch online & Tour thực tế
│   ├── san-pham/
│   │   └── page.tsx                  # Sàn thương mại tinh hoa làng nghề
│   ├── chia-se-lang-nghe/
│   │   └── page.tsx                  # Cổng gửi dữ liệu từ nghệ nhân / người dân
│   ├── admin/
│   │   └── page.tsx                  # Dashboard quản trị Startup
│   └── api/
│       ├── chat/route.ts             # API Chatbot 2 tầng (Gemini / OpenAI / Local Heuristic)
│       └── recommend/route.ts        # API tính điểm tương đồng khuyến nghị
├── components/
│   ├── ai/
│   │   └── ChatbotDrawer.tsx         # Chatbot nổi đa năng
│   ├── home/
│   │   ├── HeroSection.tsx           # Cinematic Hero
│   │   ├── FlashCards.tsx            # Flash cards tương tác có filter
│   │   ├── StorytellingTimeline.tsx  # Dòng chảy di sản 8 bước
│   │   └── EcosystemSection.tsx      # Hệ sinh thái khởi nghiệp 4 trụ cột
│   ├── layout/
│   │   ├── AppShell.tsx              # Shell điều phối trạng thái toàn ứng dụng
│   │   ├── Navbar.tsx                # Thanh điều hướng trên cùng
│   │   ├── MobileNav.tsx             # Thanh điều hướng dưới đáy thiết bị di động
│   │   ├── Footer.tsx                # Chân trang văn hóa
│   │   └── PassportModal.tsx         # Modal Hộ chiếu làng nghề & huy hiệu
│   └── map/
│       └── CraftMapLeaflet.tsx       # Dynamic Leaflet component
├── data/
│   ├── craftVillages.ts              # Dữ liệu chuẩn xác 8 làng nghề Hà Nội
│   ├── products.ts                   # Dữ liệu sản phẩm thủ công OCOP
│   └── tours.ts                      # Dữ liệu workshop & tour du lịch
├── lib/
│   ├── aiService.ts                  # Thuật toán AI matching & Knowledge Base
│   ├── passportStorage.ts            # Quản lý Hộ chiếu di sản LocalStorage
│   └── utils.ts                      # Tiện ích tiền tệ VND và CSS helper
└── tailwind.config.ts                # Palette màu Đất nung, Dó paper, Dát vàng, Tre trúc
```

---

## 3. HƯỚNG DẪN KHỞI CHẠY DỰ ÁN

### Yêu cầu môi trường
- **Node.js:** phiên bản `18.17.0` trở lên (Khuyến nghị Node.js 20 LTS)
- **Trình quản lý gói:** `npm`, `pnpm` hoặc `yarn`

### Các bước cài đặt và chạy
1. Mở terminal và chuyển đến thư mục dự án:
   ```bash
   cd C:\Users\Admin\.gemini\antigravity\scratch\hanoi-craft-villages
   ```

2. Cài đặt các thư viện phụ trợ (nếu bắt đầu từ mới):
   ```bash
   npm install
   ```

3. Chạy môi trường phát triển (Development):
   ```bash
   npm run dev
   ```
   Truy cập trình duyệt tại địa chỉ: `http://localhost:3000`

4. Biên dịch và chạy môi trường sản phẩm (Production):
   ```bash
   npm run build
   npm run start
   ```

---

## 4. CẤU HÌNH BIẾN MÔI TRƯỜNG & KHÓA API (TÙY CHỌN)

Dự án được thiết kế với **Kiến trúc 2 tầng (Two-layer architecture)**:
- **Tầng mặc định (Local Engine):** Hệ thống tích hợp sẵn kho tri thức phong phú và thuật toán ma trận tự động tính điểm match score % cực nhanh, **không bắt buộc phải có API key bên ngoài vẫn hoạt động trơn tru 100%**.
- **Tầng nâng cao (External LLM API):** Nếu muốn trợ lý ảo trả lời bằng Gemini Pro thật, chỉ cần tạo file `.env.local`:
  ```env
  GEMINI_API_KEY=your_gemini_api_key_here
  # hoặc
  OPENAI_API_KEY=your_openai_api_key_here
  ```
  Hệ thống sẽ tự động kích hoạt API mà không cần chỉnh sửa bất kỳ dòng mã nào.

---

## 5. CÁCH THAY THẾ DỮ LIỆU DEMO BẰNG DỮ LIỆU THỰC TẾ

- **Dữ liệu làng nghề:** Chỉnh sửa file `data/craftVillages.ts`. Bạn có thể thêm bất kỳ làng nghề mới nào bằng cách thêm một phần tử vào mảng `CRAFT_VILLAGES` với đầy đủ tọa độ `[lat, lng]`, các bước quy trình, nghệ nhân và hình ảnh. Làng nghề mới sẽ tự động xuất hiện trên Trang chủ, Danh mục và Bản đồ tương tác.
- **Dữ liệu sản phẩm:** Chỉnh sửa file `data/products.ts` để cập nhật ảnh sản phẩm thật, giá tiền, liên kết Shopee/TikTok Shop của hợp tác xã hoặc nghệ nhân.
- **Dữ liệu tour & workshop:** Chỉnh sửa file `data/tours.ts` để cập nhật lịch trình, giá vé và thông tin đón tiếp khách.

---

## 6. HƯỚNG DẪN TRIỂN KHAI PRODUCTION (DEPLOYMENT)

### Triển khai lên Vercel (Khuyến nghị hàng đầu)
1. Đẩy mã nguồn lên kho chứa GitHub / GitLab.
2. Đăng nhập vào [Vercel](https://vercel.com) và chọn **Import Project**.
3. Vercel tự động nhận diện framework **Next.js**. Thêm biến môi trường `GEMINI_API_KEY` (nếu có) trong mục **Environment Variables**.
4. Nhấn **Deploy**. Dự án sẽ trực tuyến toàn cầu sau chưa đầy 2 phút.

### Triển khai bằng Docker
Dự án có thể đóng gói dễ dàng với `Dockerfile` tiêu chuẩn của Next.js Standalone mode và chạy trên các máy chủ VPS (Ubuntu/Debian, AWS EC2, Google Cloud Run).
