/**
 * Sổ địa chỉ của khách hàng (Nhiệm vụ 3.A — Marketplace đa người bán).
 *
 * Cho phép khách hàng lưu nhiều địa chỉ nhận hàng:
 *  - Nhãn: 'Nhà riêng', 'Trường học', 'Ký túc xá', 'Công ty', 'Khác'.
 *  - Mỗi địa chỉ có: Người nhận, SĐT, tỉnh/thành, phường/xã, địa chỉ chi tiết, ghi chú, toạ độ, cờ mặc định.
 *  - Phân quyền: Khách hàng chỉ xem/sửa được địa chỉ gắn với email của chính mình.
 */

import crypto from 'crypto';
import { execute, executeCount, query, queryOne, transaction } from './db';
import { HttpError, normalizeEmail, normalizePhone, requireString } from './http';
import type { CustomerAddress } from '@/lib/orders/types';

interface AddressRow {
  id: string;
  user_email: string;
  recipient_name: string;
  phone: string;
  province: string | null;
  ward: string | null;
  address_text: string;
  address_note: string | null;
  lat: number | null;
  lng: number | null;
  label: string;
  is_default: number;
  created_at: string;
  updated_at: string;
}

export function toCustomerAddress(row: AddressRow): CustomerAddress {
  return {
    id: row.id,
    userEmail: row.user_email,
    recipientName: row.recipient_name,
    phone: row.phone,
    province: row.province,
    ward: row.ward,
    addressText: row.address_text,
    addressNote: row.address_note,
    lat: row.lat == null ? null : Number(row.lat),
    lng: row.lng == null ? null : Number(row.lng),
    label: row.label || 'Nhà riêng',
    isDefault: Boolean(row.is_default),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Lấy tất cả địa chỉ của khách hàng (ưu tiên địa chỉ mặc định lên đầu). */
export async function listAddressesForUser(email: string): Promise<CustomerAddress[]> {
  const normEmail = normalizeEmail(email);
  if (!normEmail) return [];

  const rows = await query<AddressRow>(
    `SELECT * FROM customer_addresses WHERE lower(user_email) = ? ORDER BY is_default DESC, updated_at DESC`,
    [normEmail]
  );
  return rows.map(toCustomerAddress);
}

/** Lấy một địa chỉ của khách hàng. */
export async function getAddressById(id: string, email?: string): Promise<CustomerAddress | null> {
  const normEmail = email ? normalizeEmail(email) : null;
  const sql = normEmail
    ? `SELECT * FROM customer_addresses WHERE id = ? AND lower(user_email) = ?`
    : `SELECT * FROM customer_addresses WHERE id = ?`;
  const params = normEmail ? [id, normEmail] : [id];
  const row = await queryOne<AddressRow>(sql, params);
  return row ? toCustomerAddress(row) : null;
}

export interface CreateAddressInput {
  recipientName: string;
  phone: string;
  province?: string | null;
  ward?: string | null;
  addressText: string;
  addressNote?: string | null;
  lat?: number | null;
  lng?: number | null;
  label?: string;
  isDefault?: boolean;
}

/** Thêm địa chỉ mới cho khách hàng. */
export async function createCustomerAddress(email: string, input: CreateAddressInput): Promise<CustomerAddress> {
  const normEmail = normalizeEmail(email);
  if (!normEmail) throw new HttpError('Email không hợp lệ.', 400, 'invalid_email');

  const recipientName = requireString(input.recipientName, 'tên người nhận', 100);
  const rawPhone = requireString(input.phone, 'số điện thoại', 30);
  const phone = normalizePhone(rawPhone);
  if (!phone) throw new HttpError('Số điện thoại nhận hàng không hợp lệ.', 400, 'invalid_phone');

  const addressText = requireString(input.addressText, 'địa chỉ nhận hàng', 400);
  const id = `addr_${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const count = await executeCount(`SELECT COUNT(*) FROM customer_addresses WHERE lower(user_email) = ?`, [normEmail]);
  const isDefault = input.isDefault || count === 0;

  await transaction(async () => {
    if (isDefault) {
      await execute(`UPDATE customer_addresses SET is_default = 0, updated_at = ? WHERE lower(user_email) = ?`, [
        now,
        normEmail,
      ]);
    }

    await execute(
      `INSERT INTO customer_addresses (id, user_email, recipient_name, phone, province, ward, address_text, address_note, lat, lng, label, is_default, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        normEmail,
        recipientName,
        phone,
        input.province?.trim() || null,
        input.ward?.trim() || null,
        addressText,
        input.addressNote?.trim() || null,
        typeof input.lat === 'number' ? input.lat : null,
        typeof input.lng === 'number' ? input.lng : null,
        input.label?.trim() || 'Nhà riêng',
        isDefault ? 1 : 0,
        now,
        now,
      ]
    );
  });

  const created = await getAddressById(id, normEmail);
  if (!created) throw new Error('Không đọc lại được địa chỉ vừa tạo.');
  return created;
}

/** Cập nhật một địa chỉ của khách hàng. */
export async function updateCustomerAddress(
  id: string,
  email: string,
  patch: Partial<CreateAddressInput>
): Promise<CustomerAddress> {
  const normEmail = normalizeEmail(email);
  if (!normEmail) throw new HttpError('Email không hợp lệ.', 400, 'invalid_email');

  const address = await getAddressById(id, normEmail);
  if (!address) throw new HttpError('Không tìm thấy địa chỉ hoặc bạn không có quyền sửa.', 404, 'address_not_found');

  const now = new Date().toISOString();

  await transaction(async () => {
    if (patch.isDefault === true) {
      await execute(`UPDATE customer_addresses SET is_default = 0, updated_at = ? WHERE lower(user_email) = ?`, [
        now,
        normEmail,
      ]);
    }

    await execute(
      `UPDATE customer_addresses SET
         recipient_name = COALESCE(?, recipient_name),
         phone = COALESCE(?, phone),
         province = CASE WHEN ? THEN ? ELSE province END,
         ward = CASE WHEN ? THEN ? ELSE ward END,
         address_text = COALESCE(?, address_text),
         address_note = CASE WHEN ? THEN ? ELSE address_note END,
         lat = CASE WHEN ? THEN ? ELSE lat END,
         lng = CASE WHEN ? THEN ? ELSE lng END,
         label = COALESCE(?, label),
         is_default = CASE WHEN ? THEN ? ELSE is_default END,
         updated_at = ?
       WHERE id = ? AND lower(user_email) = ?`,
      [
        patch.recipientName?.trim() ?? null,
        patch.phone ? normalizePhone(patch.phone) : null,
        patch.province !== undefined ? 1 : 0,
        patch.province?.trim() || null,
        patch.ward !== undefined ? 1 : 0,
        patch.ward?.trim() || null,
        patch.addressText?.trim() ?? null,
        patch.addressNote !== undefined ? 1 : 0,
        patch.addressNote?.trim() || null,
        patch.lat !== undefined ? 1 : 0,
        patch.lat,
        patch.lng !== undefined ? 1 : 0,
        patch.lng,
        patch.label?.trim() ?? null,
        patch.isDefault !== undefined ? 1 : 0,
        patch.isDefault ? 1 : 0,
        now,
        id,
        normEmail,
      ]
    );
  });

  const updated = await getAddressById(id, normEmail);
  if (!updated) throw new Error('Không đọc lại được địa chỉ sau cập nhật.');
  return updated;
}

/** Đặt một địa chỉ làm mặc định. */
export async function setDefaultAddress(id: string, email: string): Promise<CustomerAddress> {
  return updateCustomerAddress(id, email, { isDefault: true });
}

/** Xoá một địa chỉ. */
export async function deleteCustomerAddress(id: string, email: string): Promise<void> {
  const normEmail = normalizeEmail(email);
  if (!normEmail) throw new HttpError('Email không hợp lệ.', 400, 'invalid_email');

  const address = await getAddressById(id, normEmail);
  if (!address) throw new HttpError('Không tìm thấy địa chỉ hoặc bạn không có quyền xóa.', 404, 'address_not_found');

  await execute(`DELETE FROM customer_addresses WHERE id = ? AND lower(user_email) = ?`, [id, normEmail]);

  // Nếu vừa xóa địa chỉ mặc định, tự động gán địa chỉ còn lại gần nhất làm mặc định
  if (address.isDefault) {
    const remaining = await queryOne<AddressRow>(
      `SELECT * FROM customer_addresses WHERE lower(user_email) = ? ORDER BY updated_at DESC LIMIT 1`,
      [normEmail]
    );
    if (remaining) {
      await execute(`UPDATE customer_addresses SET is_default = 1 WHERE id = ?`, [remaining.id]);
    }
  }
}
