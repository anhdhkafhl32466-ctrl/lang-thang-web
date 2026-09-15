export interface PassportBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  unlockedAt?: string;
  category: 'Trải nghiệm' | 'Khám phá' | 'Đặc biệt';
}

export interface VirtualCreation {
  id: string;
  type: 'pottery' | 'hat';
  title: string;
  villageName: string;
  date: string;
  previewColor?: string;
  details: Record<string, any>;
}

export interface PassportData {
  visitedVillages: string[];
  badges: Record<string, string>; // badgeId -> ISO date string
  creations: VirtualCreation[];
  points: number;
}

export const ALL_BADGES: PassportBadge[] = [
  {
    id: 'badge-welcome',
    name: 'Người Khởi Hành Di Sản',
    icon: '🧭',
    description: 'Bắt đầu hành trình khám phá các làng nghề ngàn năm của Hà Nội.',
    category: 'Khám phá'
  },
  {
    id: 'badge-pottery',
    name: 'Bậc Thầy Bàn Xoay Bát Tràng',
    icon: '🏺',
    description: 'Tự tay vuốt dáng, phủ men và nung chín bình gốm trên bàn xoay ảo.',
    category: 'Trải nghiệm'
  },
  {
    id: 'badge-hat',
    name: 'Người Đan Nón Xứ Đoài',
    icon: '👒',
    description: 'Khâu hoàn thiện chiếc nón lá bài thơ làng Chuông thanh lịch.',
    category: 'Trải nghiệm'
  },
  {
    id: 'badge-explorer-3',
    name: 'Lữ Khách Đam Mê',
    icon: '🗺️',
    description: 'Đã tìm hiểu chi tiết lịch sử và quy trình của ít nhất 3 làng nghề.',
    category: 'Khám phá'
  },
  {
    id: 'badge-ai-matched',
    name: 'Người Tìm Thấy Điểm Hẹn',
    icon: '✨',
    description: 'Hoàn thành bài trắc nghiệm AI tìm làng nghề phù hợp nhất cho riêng bạn.',
    category: 'Đặc biệt'
  },
  {
    id: 'badge-contributor',
    name: 'Đại Sứ Làng Nghề',
    icon: '📜',
    description: 'Đóng góp câu chuyện hoặc chia sẻ thông tin về một làng nghề truyền thống.',
    category: 'Đặc biệt'
  }
];

const STORAGE_KEY = 'hanoi_craft_passport_v1';

export function getPassport(): PassportData {
  if (typeof window === 'undefined') {
    return {
      visitedVillages: [],
      badges: { 'badge-welcome': new Date().toISOString() },
      creations: [],
      points: 50
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const initial: PassportData = {
        visitedVillages: [],
        badges: { 'badge-welcome': new Date().toISOString() },
        creations: [],
        points: 50
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return {
      visitedVillages: [],
      badges: { 'badge-welcome': new Date().toISOString() },
      creations: [],
      points: 50
    };
  }
}

export function savePassport(data: PassportData): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new Event('passport_updated'));
  } catch (err) {
    console.error('Error saving passport data', err);
  }
}

export function recordVillageVisit(slug: string): { isNew: boolean; newBadge?: PassportBadge } {
  const passport = getPassport();
  let isNew = false;
  let newBadge: PassportBadge | undefined;

  if (!passport.visitedVillages.includes(slug)) {
    passport.visitedVillages.push(slug);
    passport.points += 20;
    isNew = true;

    if (passport.visitedVillages.length >= 3 && !passport.badges['badge-explorer-3']) {
      passport.badges['badge-explorer-3'] = new Date().toISOString();
      passport.points += 50;
      newBadge = ALL_BADGES.find(b => b.id === 'badge-explorer-3');
    }

    savePassport(passport);
  }

  return { isNew, newBadge };
}

export function unlockBadge(badgeId: string): PassportBadge | null {
  const passport = getPassport();
  if (passport.badges[badgeId]) return null;

  passport.badges[badgeId] = new Date().toISOString();
  passport.points += 50;
  savePassport(passport);

  return ALL_BADGES.find(b => b.id === badgeId) || null;
}

export function saveCreation(creation: VirtualCreation): void {
  const passport = getPassport();
  passport.creations.unshift(creation);
  passport.points += 30;
  savePassport(passport);
}
