/**
 * Kiểm tra dữ liệu sản phẩm do NGƯỜI BÁN gửi lên.
 *
 * Vì sao tách riêng: cùng một bộ kiểm tra được dùng cho cả "đăng sản phẩm mới" và "sửa sản phẩm", nên
 * không thể có chuyện đường này chặt còn đường kia lỏng. Mọi giá trị ở đây do máy chủ quyết định —
 * giá là số nguyên VNĐ, danh mục và làng nghề phải khớp dữ liệu làng nghề của website.
 *
 * KHÔNG nhận `storeId` từ thân yêu cầu: chủ sở hữu do tầng API xác định từ phiên đăng nhập người bán.
 */

import { CRAFT_VILLAGES } from '@/data/craftVillages';
import { HttpError } from './http';
import { isAcceptableImageUrl } from './storage';
import type { ProductWriteInput } from './catalog';

const MIN_PRICE = 1_000;
const MAX_PRICE = 500_000_000;
const MAX_STOCK = 100_000;
const MAX_NAME = 200;
const MAX_DESCRIPTION = 3_000;

export interface ParsedProductInput extends ProductWriteInput {
  villageId: string;
  villageName: string;
}

function textField(value: unknown, field: string, maxLength: number, required = false): string | null {
  if (value === undefined || value === null) {
    if (required) throw new HttpError(`Thiếu thông tin bắt buộc: ${field}.`, 400, 'missing_field', { field });
    return null;
  }
  const trimmed = String(value).trim();
  if (trimmed === '') {
    if (required) throw new HttpError(`Thiếu thông tin bắt buộc: ${field}.`, 400, 'missing_field', { field });
    return null;
  }
  if (trimmed.length > maxLength) {
    throw new HttpError(`${field} quá dài (tối đa ${maxLength} ký tự).`, 400, 'field_too_long', { field });
  }
  return trimmed;
}

function integerField(
  value: unknown,
  field: string,
  min: number,
  max: number,
  required = false
): number | null {
  if (value === undefined || value === null || value === '') {
    if (required) throw new HttpError(`Thiếu thông tin bắt buộc: ${field}.`, 400, 'missing_field', { field });
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    throw new HttpError(`${field} phải là số nguyên.`, 400, 'invalid_number', { field });
  }
  if (parsed < min || parsed > max) {
    throw new HttpError(`${field} phải nằm trong khoảng ${min} – ${max}.`, 400, 'out_of_range', { field });
  }
  return parsed;
}

/**
 * Phân tích dữ liệu sản phẩm.
 * `partial = true` dùng cho cập nhật: trường không gửi lên sẽ giữ nguyên giá trị cũ ở tầng dữ liệu.
 */
export function parseProductInput(body: any, options: { partial?: boolean } = {}): Partial<ParsedProductInput> {
  const partial = options.partial === true;
  const result: Partial<ParsedProductInput> = {};

  const name = textField(body?.name, 'tên sản phẩm', MAX_NAME, !partial);
  if (name !== null) result.name = name;

  const description = textField(body?.description, 'mô tả sản phẩm', MAX_DESCRIPTION);
  if (description !== null) result.description = description;

  const price = integerField(body?.price, 'giá bán', MIN_PRICE, MAX_PRICE, !partial);
  if (price !== null) result.price = price;

  const stock = integerField(body?.stock, 'số lượng tồn kho', 0, MAX_STOCK, !partial);
  if (stock !== null) result.stock = stock;

  // Danh mục lấy theo làng nghề đã chọn (nếu client gửi) — tránh danh mục rác không có thật trên sàn.
  const villageIdRaw = textField(body?.villageId, 'làng nghề', 80, !partial);
  if (villageIdRaw !== null) {
    const village = CRAFT_VILLAGES.find((item) => item.id === villageIdRaw || item.slug === villageIdRaw);
    if (!village) {
      throw new HttpError(
        `Làng nghề "${villageIdRaw}" không có trong danh mục làng nghề của sàn.`,
        400,
        'unknown_village',
        { villageId: villageIdRaw }
      );
    }
    result.villageId = village.id;
    result.villageName = village.name;
    result.category = body?.category ? String(body.category).trim().slice(0, 100) : village.category;
  } else if (body?.category !== undefined && body?.category !== null && String(body.category).trim() !== '') {
    result.category = String(body.category).trim().slice(0, 100);
  }

  const image = textField(body?.image, 'ảnh sản phẩm', 500, !partial);
  if (image !== null) {
    if (!isAcceptableImageUrl(image)) {
      throw new HttpError(
        'Ảnh sản phẩm phải là ảnh đã tải lên hệ thống hoặc một đường dẫn http(s) hợp lệ.',
        400,
        'invalid_image'
      );
    }
    result.image = image;
  }

  const material = textField(body?.material, 'chất liệu', 120);
  if (material !== null) result.material = material;

  const dimensions = textField(body?.dimensions, 'kích thước', 120);
  if (dimensions !== null) result.dimensions = dimensions;

  const artisanName = textField(body?.artisanName, 'nghệ nhân', 120);
  if (artisanName !== null) result.artisanName = artisanName;

  const weightG = integerField(body?.weightG, 'khối lượng (gram)', 1, 500_000);
  if (weightG !== null) result.weightG = weightG;

  const preparationDays = integerField(body?.preparationDays, 'thời gian chuẩn bị (ngày)', 0, 120);
  if (preparationDays !== null) result.preparationDays = preparationDays;

  if (body?.active !== undefined) {
    result.active = Boolean(body.active);
  }

  if (partial && Object.keys(result).length === 0) {
    throw new HttpError('Không có thay đổi nào để cập nhật.', 400, 'empty_update');
  }

  return result;
}
