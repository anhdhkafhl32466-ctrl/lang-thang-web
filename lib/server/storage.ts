/**
 * Lưu trữ ảnh sản phẩm / logo cửa hàng — CHỈ chạy phía máy chủ.
 *
 * Vì sao không lưu ảnh trong cơ sở dữ liệu: ảnh là dữ liệu nhị phân lớn, để trong bảng sẽ làm chậm
 * mọi truy vấn đơn hàng và không có CDN. Vì sao không lưu base64 trong localStorage: trình duyệt khác
 * sẽ không thấy ảnh, và ảnh sẽ biến mất khi người bán xóa dữ liệu trình duyệt.
 *
 * HIỆN TẠI (driver 'local'): ảnh lưu ở thư mục `.data/uploads` (đã bị .gitignore) và được phục vụ qua
 * `/api/uploads/<key>`. Cách này chạy tốt khi tự vận hành máy chủ, NHƯNG ổ đĩa của môi trường
 * serverless (Vercel) không bền vững — ảnh có thể mất sau khi triển khai lại.
 *
 * KHI LÊN PRODUCTION: thay phần `saveImageUpload` bằng một dịch vụ lưu trữ đối tượng (Cloudflare R2,
 * S3, Supabase Storage...) và trả về URL CDN. Toàn bộ phần còn lại của hệ thống chỉ dùng `url` nên
 * không phải sửa gì thêm. `describeStorage()` báo rõ cấu hình đang dùng để người vận hành biết.
 */

import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export type StorageDriver = 'local' | 'external-url';

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB

/** Định dạng ảnh được chấp nhận, kèm chữ ký nhị phân để xác thực nội dung thật sự là ảnh. */
const IMAGE_TYPES: { mime: string; ext: string; matches: (buffer: Buffer) => boolean }[] = [
  { mime: 'image/jpeg', ext: 'jpg', matches: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  {
    mime: 'image/png',
    ext: 'png',
    matches: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47,
  },
  {
    mime: 'image/gif',
    ext: 'gif',
    matches: (b) => b.slice(0, 4).toString('ascii') === 'GIF8',
  },
  {
    mime: 'image/webp',
    ext: 'webp',
    matches: (b) => b.slice(0, 4).toString('ascii') === 'RIFF' && b.slice(8, 12).toString('ascii') === 'WEBP',
  },
];

function uploadsDir(): string {
  const configured = process.env.STORAGE_DIR?.trim();
  if (configured) return configured;
  if (process.env.VERCEL === '1') return path.join('/tmp', 'lang-thang-uploads');
  return path.join(process.cwd(), '.data', 'uploads');
}

export function describeStorage(): {
  driver: StorageDriver;
  directory: string | null;
  durable: boolean;
  note: string;
} {
  const external = process.env.PUBLIC_MEDIA_BASE_URL?.trim();
  return {
    driver: external ? 'external-url' : 'local',
    directory: external ? null : uploadsDir(),
    durable: Boolean(external) && process.env.VERCEL !== '1',
    note: external
      ? `Ảnh trả về theo tiền tố ${external} (dịch vụ lưu trữ ngoài).`
      : 'Ảnh lưu trên ổ đĩa máy chủ tại .data/uploads và phục vụ qua /api/uploads/<key>. Trên môi trường serverless, hãy chuyển sang dịch vụ lưu trữ đối tượng để ảnh không bị mất.',
  };
}

/** Nhận diện định dạng ảnh từ chữ ký nhị phân — KHÔNG tin `Content-Type` hay tên tệp do client gửi. */
export function detectImageType(buffer: Buffer): { mime: string; ext: string } | null {
  if (buffer.length < 12) return null;
  const found = IMAGE_TYPES.find((type) => type.matches(buffer));
  return found ? { mime: found.mime, ext: found.ext } : null;
}

export interface SavedImage {
  key: string;
  url: string;
  bytes: number;
  contentType: string;
  driver: StorageDriver;
}

/** Lưu một ảnh đã tải lên. Trả về URL công khai để gán vào sản phẩm/logo cửa hàng. */
export async function saveImageUpload(params: { data: Buffer }): Promise<SavedImage> {
  const type = detectImageType(params.data);
  if (!type) {
    throw new Error('Tệp tải lên không phải ảnh hợp lệ (chỉ nhận JPEG, PNG, GIF, WEBP).');
  }
  if (params.data.length > MAX_UPLOAD_BYTES) {
    throw new Error(`Ảnh vượt quá ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`);
  }

  const key = `${crypto.randomUUID()}.${type.ext}`;
  const directory = uploadsDir();
  await fs.mkdir(directory, { recursive: true });
  // Tên tệp do máy chủ sinh (UUID) nên không thể ghi đè tệp khác hay thoát khỏi thư mục.
  await fs.writeFile(path.join(directory, key), params.data);

  const base = process.env.PUBLIC_MEDIA_BASE_URL?.trim();
  return {
    key,
    url: base ? `${base.replace(/\/$/, '')}/${key}` : `/api/uploads/${key}`,
    bytes: params.data.length,
    contentType: type.mime,
    driver: base ? 'external-url' : 'local',
  };
}

const KEY_PATTERN = /^[a-f0-9-]{8,64}\.(jpg|png|gif|webp)$/;

/** Đọc lại ảnh đã lưu để phục vụ qua HTTP. Khoá không hợp lệ trả về null (không dò được tệp khác). */
export async function readUpload(key: string): Promise<{ data: Buffer; contentType: string } | null> {
  if (!KEY_PATTERN.test(key)) return null;
  try {
    const data = await fs.readFile(path.join(uploadsDir(), key));
    const type = detectImageType(data);
    if (!type) return null;
    return { data, contentType: type.mime };
  } catch {
    return null;
  }
}

/**
 * Kiểm tra URL ảnh do người dùng dán vào: chỉ chấp nhận http(s) hoặc đường dẫn ảnh của chính hệ thống.
 * Chặn `javascript:` / `data:` để không tạo lỗ hổng XSS khi ảnh được nhúng vào thẻ <img>.
 */
export function isAcceptableImageUrl(value: string): boolean {
  const trimmed = value.trim();
  if (trimmed === '') return false;
  if (trimmed.startsWith('/api/uploads/') || trimmed.startsWith('/')) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}
