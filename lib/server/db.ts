/**
 * Tầng truy cập cơ sở dữ liệu — CHỈ chạy phía server.
 *
 * Chọn backend tự động:
 *  - Có DATABASE_URL  -> PostgreSQL (Neon / Supabase / Postgres tự vận hành) qua driver `pg`.
 *  - Không có         -> SQLite nhúng sẵn của Node (node:sqlite) lưu tại thư mục .data.
 *
 * Vì sao không dùng localStorage: dữ liệu đơn hàng phải tồn tại phía máy chủ, sống sót khi
 * tải lại trang và đồng bộ được giữa các thiết bị. SQLite ở đây là cơ sở dữ liệu thật (có
 * schema, khoá chính, chỉ mục) chứ không phải bộ nhớ tạm của trình duyệt.
 *
 * Câu lệnh SQL dùng dấu `?` làm tham số; lớp này tự chuyển sang `$1,$2...` khi gặp PostgreSQL.
 * Bên trong transaction(), mọi truy vấn đi qua đúng kết nối của giao dịch (AsyncLocalStorage)
 * để đảm bảo tính nguyên tử (ví dụ: tạo đơn + trừ tồn kho phải cùng thành công hoặc cùng hủy).
 */

import fs from 'fs';
import path from 'path';
import { AsyncLocalStorage } from 'node:async_hooks';
import { SCHEMA_MIGRATIONS, SCHEMA_STATEMENTS } from './schema';

export type SqlParam = string | number | boolean | null | undefined;
export type Row = Record<string, any>;

type Backend = 'postgres' | 'sqlite';

let backend: Backend | null = null;
let sqliteDb: any = null;
let pgPool: any = null;

let initPromise: Promise<void> | null = null;
let initDone = false;
let initializing = false;

/** Giữ kết nối của giao dịch hiện tại (chỉ dùng cho PostgreSQL). */
const txStore = new AsyncLocalStorage<{ client: any }>();

/** Hàng đợi tuần tự hoá giao dịch SQLite (một kết nối chia sẻ cho cả tiến trình). */
let sqliteTxChain: Promise<unknown> = Promise.resolve();

export function getDbBackend(): Backend {
  if (backend) return backend;
  backend = process.env.DATABASE_URL?.trim() ? 'postgres' : 'sqlite';
  return backend;
}

export function describeDbBackend(): { backend: Backend; target: string } {
  if (getDbBackend() === 'postgres') {
    const url = process.env.DATABASE_URL || '';
    const safe = url.replace(/:\/\/([^:@/]+):[^@]*@/, '://$1:***@');
    return { backend: 'postgres', target: safe };
  }
  return { backend: 'sqlite', target: sqliteFile() };
}

function sqliteFile(): string {
  if (process.env.SQLITE_DB_FILE?.trim()) return process.env.SQLITE_DB_FILE.trim();
  // Vercel chỉ cho ghi tạm ở /tmp (không bền -> production phải cấu hình DATABASE_URL).
  if (process.env.VERCEL === '1') return path.join('/tmp', 'lang-thang.db');
  return path.join(process.cwd(), '.data', 'lang-thang.db');
}

/** SQLite: node:sqlite chỉ nhận null/number/bigint/string/Uint8Array. */
function normalizeParam(value: SqlParam): any {
  if (value === undefined) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;
  return value;
}

/** Đổi `?` thành `$1, $2...` cho PostgreSQL (bỏ qua dấu ? nằm trong chuỗi literal). */
function toPgPlaceholders(sql: string): string {
  let index = 0;
  let inSingle = false;
  let out = '';
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    if (ch === "'") {
      inSingle = !inSingle;
      out += ch;
      continue;
    }
    if (ch === '?' && !inSingle) {
      index += 1;
      out += `$${index}`;
      continue;
    }
    out += ch;
  }
  return out;
}

async function getSqlite(): Promise<any> {
  if (sqliteDb) return sqliteDb;
  const { DatabaseSync } = await import('node:sqlite');
  const file = sqliteFile();
  const dir = path.dirname(file);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  sqliteDb = new DatabaseSync(file);
  sqliteDb.exec('PRAGMA journal_mode = WAL;');
  sqliteDb.exec('PRAGMA foreign_keys = ON;');
  sqliteDb.exec('PRAGMA busy_timeout = 10000;');
  return sqliteDb;
}

async function getPgPool(): Promise<any> {
  if (pgPool) return pgPool;
  const { Pool } = await import('pg');
  const url = process.env.DATABASE_URL || '';
  pgPool = new Pool({
    connectionString: url,
    max: 5,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
    ssl: /sslmode=disable/.test(url) || /@(localhost|127\.0\.0\.1)/.test(url)
      ? undefined
      : { rejectUnauthorized: false },
  });
  return pgPool;
}

/** Truy vấn ở tầng thấp, KHÔNG tự khởi tạo schema (dùng cho chính bước khởi tạo). */
async function rawQuery(sql: string, params: SqlParam[] = []): Promise<Row[]> {
  const values = params.map(normalizeParam);
  if (getDbBackend() === 'postgres') {
    const client = txStore.getStore()?.client ?? (await getPgPool());
    const result = await client.query(toPgPlaceholders(sql), values);
    return result.rows as Row[];
  }
  const db = await getSqlite();
  return db.prepare(sql).all(...values) as Row[];
}

async function rawExecute(sql: string, params: SqlParam[] = []): Promise<void> {
  const values = params.map(normalizeParam);
  if (getDbBackend() === 'postgres') {
    const client = txStore.getStore()?.client ?? (await getPgPool());
    await client.query(toPgPlaceholders(sql), values);
    return;
  }
  const db = await getSqlite();
  db.prepare(sql).run(...values);
}

/** Chạy câu lệnh ghi và trả về số bản ghi bị ảnh hưởng (dùng để kiểm tra tồn kho nguyên tử). */
async function rawExecuteCount(sql: string, params: SqlParam[] = []): Promise<number> {
  const values = params.map(normalizeParam);
  if (getDbBackend() === 'postgres') {
    const client = txStore.getStore()?.client ?? (await getPgPool());
    const result = await client.query(toPgPlaceholders(sql), values);
    return Number(result.rowCount ?? 0);
  }
  const db = await getSqlite();
  const result = db.prepare(sql).run(...values);
  return Number(result?.changes ?? 0);
}

async function ready(): Promise<void> {
  if (initDone) return;
  if (initPromise) return initPromise;
  await ensureDbReady();
}

/** Chạy câu lệnh SELECT, trả về danh sách bản ghi. */
export async function query<T extends Row = Row>(sql: string, params: SqlParam[] = []): Promise<T[]> {
  await ready();
  return (await rawQuery(sql, params)) as T[];
}

/** Chạy SELECT lấy một bản ghi đầu tiên (hoặc null). */
export async function queryOne<T extends Row = Row>(sql: string, params: SqlParam[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

/** Chạy câu lệnh ghi dữ liệu (INSERT/UPDATE/DELETE). */
export async function execute(sql: string, params: SqlParam[] = []): Promise<void> {
  await ready();
  await rawExecute(sql, params);
}

/** Như execute() nhưng trả về số dòng bị ảnh hưởng. */
export async function executeCount(sql: string, params: SqlParam[] = []): Promise<number> {
  await ready();
  return rawExecuteCount(sql, params);
}

/** Truy vấn thô dùng trong bước khởi tạo/seed (không kích hoạt lại ensureDbReady). */
export const internal = { rawQuery, rawExecute };

async function withSqliteTx<T>(fn: () => Promise<T>): Promise<T> {
  const db = await getSqlite();
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = await fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    try {
      db.exec('ROLLBACK');
    } catch {
      /* giao dịch đã bị hủy trước đó */
    }
    throw error;
  }
}

/**
 * Thực thi nhiều thao tác trong một giao dịch. Nếu một bước lỗi, toàn bộ thay đổi được hoàn tác.
 * Dùng cho bước tạo đơn hàng + trừ tồn kho.
 */
export async function transaction<T>(fn: () => Promise<T>): Promise<T> {
  await ready();

  if (getDbBackend() === 'postgres') {
    const pool = await getPgPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await txStore.run({ client }, fn);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      try {
        await client.query('ROLLBACK');
      } catch {
        /* bỏ qua */
      }
      throw error;
    } finally {
      client.release();
    }
  }

  // SQLite dùng chung một kết nối cho cả tiến trình -> tuần tự hoá để giao dịch không bị xen ngang.
  const run = sqliteTxChain.then(() => withSqliteTx(fn));
  sqliteTxChain = run.catch(() => undefined);
  return run;
}

/** Tạo schema nếu chưa có (idempotent) và nạp danh mục lần đầu. */
export async function ensureDbReady(): Promise<void> {
  if (initDone) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    initializing = true;
    try {
      for (const statement of SCHEMA_STATEMENTS) {
        if (getDbBackend() === 'postgres') {
          const pool = await getPgPool();
          await pool.query(statement);
        } else {
          const db = await getSqlite();
          db.exec(statement);
        }
      }

      // Nâng cấp cột cho CSDL đã tồn tại. Lỗi "cột/bảng đã tồn tại" là bình thường (đã nâng cấp rồi),
      // mọi lỗi khác vẫn ném ra để không che giấu sự cố thật.
      for (const migration of SCHEMA_MIGRATIONS) {
        try {
          if (getDbBackend() === 'postgres') {
            const pool = await getPgPool();
            await pool.query(migration);
          } else {
            const db = await getSqlite();
            db.exec(migration);
          }
        } catch (error: any) {
          const message = String(error?.message || '');
          if (!/duplicate column|already exists|duplicate_column/i.test(message)) {
            throw error;
          }
        }
      }

      const { seedCatalog } = await import('./seed');
      await seedCatalog();
    } finally {
      initializing = false;
    }
    initDone = true;
  })().catch((error) => {
    initPromise = null;
    throw error;
  });

  return initPromise;
}

/** Đang ở trong bước khởi tạo schema/seed (dùng để bỏ qua ready()). */
export function isInitializing(): boolean {
  return initializing;
}
