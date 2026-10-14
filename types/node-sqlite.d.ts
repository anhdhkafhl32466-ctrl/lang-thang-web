/**
 * Khai báo kiểu tối thiểu cho module có sẵn của Node: `node:sqlite`.
 *
 * Node 22.5+ cung cấp SQLite nhúng (DatabaseSync). Gói @types/node của dự án (v20) chưa có
 * khai báo này, nên bổ sung tại đây để TypeScript hiểu đúng phần API mà lib/server/db.ts dùng.
 */

declare module 'node:sqlite' {
  export interface StatementSync {
    all(...params: unknown[]): Array<Record<string, unknown>>;
    get(...params: unknown[]): Record<string, unknown> | undefined;
    run(...params: unknown[]): { changes: number | bigint; lastInsertRowid: number | bigint };
  }

  export class DatabaseSync {
    constructor(location: string, options?: { open?: boolean; readOnly?: boolean });
    exec(sql: string): void;
    prepare(sql: string): StatementSync;
    close(): void;
  }
}
