import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// File path for server persistent storage
function getDbPath(): string {
  const isVercel = process.env.VERCEL === '1';
  if (isVercel) {
    return path.join('/tmp', 'user_passports.json');
  }
  return path.join(process.cwd(), 'data', 'user_passports.json');
}

// Global in-memory cache to ensure instant consistency across requests
const globalCache = (globalThis as any).__user_passports_cache || {};
(globalThis as any).__user_passports_cache = globalCache;

function loadDatabase(): Record<string, any> {
  if (Object.keys(globalCache).length > 0) {
    return globalCache;
  }

  const dbPath = getDbPath();
  try {
    if (fs.existsSync(dbPath)) {
      const raw = fs.readFileSync(dbPath, 'utf8');
      const data = JSON.parse(raw);
      Object.assign(globalCache, data);
      return globalCache;
    }
  } catch (err) {
    console.error('Lỗi khi đọc file database hộ chiếu:', err);
  }
  return globalCache;
}

function saveDatabase(data: Record<string, any>): void {
  Object.assign(globalCache, data);
  const dbPath = getDbPath();
  try {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Lỗi khi ghi file database hộ chiếu:', err);
  }
}

// GET /api/passport?email=...
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Thiếu tham số email' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const db = loadDatabase();
    const userPassport = db[normalizedEmail] || null;

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
      passport: userPassport,
      found: Boolean(userPassport)
    });
  } catch (error) {
    console.error('Lỗi GET /api/passport:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi khi lấy dữ liệu hộ chiếu' }, { status: 500 });
  }
}

// POST /api/passport
// Body: { email: string, passport: any }
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, passport } = body;

    if (!email || !passport) {
      return NextResponse.json({ error: 'Dữ liệu không hợp lệ' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const db = loadDatabase();

    // Ensure valid passport structure
    const sanitizedPassport = {
      visitedVillages: Array.isArray(passport.visitedVillages) ? passport.visitedVillages : [],
      visitedDates: passport.visitedDates && typeof passport.visitedDates === 'object' ? passport.visitedDates : {},
      souvenirPhotos: Array.isArray(passport.souvenirPhotos) ? passport.souvenirPhotos : [],
      badges: passport.badges && typeof passport.badges === 'object' ? passport.badges : {},
      creations: Array.isArray(passport.creations) ? passport.creations : [],
      points: typeof passport.points === 'number' ? passport.points : 50,
      updatedAt: new Date().toISOString()
    };

    db[normalizedEmail] = sanitizedPassport;
    saveDatabase(db);

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
      passport: sanitizedPassport,
      savedAt: sanitizedPassport.updatedAt
    });
  } catch (error) {
    console.error('Lỗi POST /api/passport:', error);
    return NextResponse.json({ error: 'Đã xảy ra lỗi khi lưu dữ liệu hộ chiếu' }, { status: 500 });
  }
}
