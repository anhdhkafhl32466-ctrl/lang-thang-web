/**
 * Cấu hình thương mại của sàn Lang Thang.
 *
 * Nguyên tắc:
 *  - Mọi giá trị có thể thay đổi trong tương lai (email quản trị, địa chỉ kho, phí vận chuyển)
 *    đều nằm ở ĐÂY và có thể ghi đè bằng biến môi trường -> không hard-code rải rác trong mã.
 *  - Toạ độ kho KHÔNG được tự bịa. Giá trị mặc định dưới đây là kết quả tra cứu THẬT từ dịch vụ
 *    bản đồ (Nominatim / OpenStreetMap) cho địa chỉ Đại học FPT Hà Nội, kèm metadata nguồn gốc.
 */

export interface WarehouseLocation {
  id: string;
  name: string;
  /** Địa chỉ văn bản đầy đủ dùng để hiển thị và để tra cứu lại trên bản đồ. */
  address: string;
  lat: number;
  lng: number;
  /** Nguồn gốc toạ độ: kết quả tra cứu bản đồ hay do người vận hành cấu hình. */
  source: 'map-lookup' | 'env-override';
  /** Nhà cung cấp dịch vụ bản đồ đã trả về toạ độ này (chỉ có khi source = map-lookup). */
  provider?: string;
  /** Truy vấn đã dùng để tra cứu (chỉ có khi source = map-lookup). */
  query?: string;
  /** Mô tả địa điểm theo dữ liệu OpenStreetMap, ví dụ "Trường Đại học FPT, Đường N16...". */
  resolvedLabel?: string;
  resolvedAt?: string;
}

const DEFAULT_WAREHOUSE: WarehouseLocation = {
  id: 'kho-hoa-lac-fpt',
  name: 'Kho xuất hàng Lang Thang — Đại học FPT Hà Nội',
  address:
    'Đại học FPT Hà Nội, Khu Giáo dục và Đào tạo, Khu Công nghệ cao Hòa Lạc, Km29 Đại lộ Thăng Long, Thạch Thất, Hà Nội',
  // Tra cứu thật 14/10/2026 qua Nominatim: "FPT University Hanoi" ->
  // "Trường Đại học FPT, Đường N16, Khu Công nghệ cao Hòa Lạc, Xã Hòa Lạc, Hà Nội, 13117, Việt Nam"
  lat: 21.0135277,
  lng: 105.5252615,
  source: 'map-lookup',
  provider: 'Nominatim / OpenStreetMap',
  query: 'FPT University Hanoi',
  resolvedLabel:
    'Trường Đại học FPT, Đường N16, Khu Công nghệ cao Hòa Lạc, Xã Hòa Lạc, Hà Nội, 13117, Việt Nam',
  resolvedAt: '2026-10-14',
};

function readEnvCoordinate(key: string): number | null {
  const raw = process.env[key];
  if (raw === undefined || raw.trim() === '') return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

/** Kho xuất hàng đang hoạt động (cho phép ghi đè bằng biến môi trường). */
export function getWarehouse(): WarehouseLocation {
  const envLat = readEnvCoordinate('WAREHOUSE_LAT');
  const envLng = readEnvCoordinate('WAREHOUSE_LNG');
  const envAddress = process.env.WAREHOUSE_ADDRESS?.trim();

  if (envLat === null || envLng === null) {
    return envAddress ? { ...DEFAULT_WAREHOUSE, address: envAddress } : DEFAULT_WAREHOUSE;
  }

  return {
    ...DEFAULT_WAREHOUSE,
    address: envAddress || DEFAULT_WAREHOUSE.address,
    lat: envLat,
    lng: envLng,
    source: 'env-override',
    provider: 'Cấu hình qua biến môi trường WAREHOUSE_LAT / WAREHOUSE_LNG',
    query: undefined,
    resolvedLabel: undefined,
    resolvedAt: undefined,
  };
}

export const WAREHOUSE_LOOKUP_QUERY = 'Đại học FPT Hà Nội, Khu Công nghệ cao Hòa Lạc, Thạch Thất, Hà Nội';

/** Email nhận thông báo đơn hàng. Chỉ là ĐỊA CHỈ NHẬN THÔNG BÁO, không tự sinh quyền quản trị. */
export function getAdminEmail(): string {
  const raw = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  return raw || 'anhdhkafhl32466@gmail.com';
}

export interface ShippingConfig {
  /** Miễn phí vận chuyển khi tạm tính đạt mức này. */
  freeShippingThreshold: number;
  /** Phí cơ bản cho mọi đơn chưa đạt mức miễn phí. */
  baseFee: number;
  /** Phụ phí mỗi km vượt quá ngưỡng cơ bản. */
  perKmFee: number;
  /** Số km đã bao gồm trong phí cơ bản. */
  includedKm: number;
  /** Trần phí để tránh phát sinh vô lý. */
  maxFee: number;
}

export const SHIPPING: ShippingConfig = {
  freeShippingThreshold: 1_500_000,
  baseFee: 25_000,
  perKmFee: 6_000,
  includedKm: 10,
  maxFee: 250_000,
};

export const STORE_INFO = {
  name: 'Lang Thang — Làng Nghề Hà Nội',
  shortName: 'Lang Thang',
  hotline: '1900 0000',
  supportEmail: 'anhdhkafhl32466@gmail.com',
  website: 'https://lang-thang-web.vercel.app',
  currency: 'VND',
};

/** Ảnh bìa mặc định cho email khi sản phẩm không có ảnh công khai. */
export const EMAIL_BRAND_COLOR = '#b45309';
