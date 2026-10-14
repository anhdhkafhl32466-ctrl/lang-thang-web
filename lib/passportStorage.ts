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

export interface SouvenirPhoto {
  id: string;
  villageSlug: string;
  villageName: string;
  url: string; // Base64 compressed image data URL
  caption?: string;
  date: string; // ISO string
}

export interface PassportData {
  visitedVillages: string[];
  visitedDates: Record<string, string>; // slug -> ISO date string
  souvenirPhotos: SouvenirPhoto[];
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
    id: 'badge-first-checkin',
    name: 'Dấu Chân Đầu Tiên',
    icon: '📍',
    description: 'Đã trực tiếp đánh dấu tham quan và đóng dấu mộc cho làng nghề đầu tiên.',
    category: 'Khám phá'
  },
  {
    id: 'badge-photographer',
    name: 'Nhiếp Ảnh Gia Di Sản',
    icon: '📸',
    description: 'Lưu giữ những khoảnh khắc đáng nhớ bằng ảnh lưu niệm khi đặt chân đến làng nghề.',
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
    description: 'Đã trực tiếp ghé thăm và đóng dấu mộc của ít nhất 3 làng nghề.',
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
      visitedDates: {},
      souvenirPhotos: [],
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
        visitedDates: {},
        souvenirPhotos: [],
        badges: { 'badge-welcome': new Date().toISOString() },
        creations: [],
        points: 50
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }

    const parsed = JSON.parse(raw);
    const sanitized: PassportData = {
      visitedVillages: Array.isArray(parsed.visitedVillages) ? parsed.visitedVillages : [],
      visitedDates: parsed.visitedDates && typeof parsed.visitedDates === 'object' ? parsed.visitedDates : {},
      souvenirPhotos: Array.isArray(parsed.souvenirPhotos) ? parsed.souvenirPhotos : [],
      badges: parsed.badges && typeof parsed.badges === 'object' ? parsed.badges : { 'badge-welcome': new Date().toISOString() },
      creations: Array.isArray(parsed.creations) ? parsed.creations : [],
      points: typeof parsed.points === 'number' ? parsed.points : 50
    };

    return sanitized;
  } catch {
    return {
      visitedVillages: [],
      visitedDates: {},
      souvenirPhotos: [],
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

/**
 * Ghi nhận người dùng đã trực tiếp bấm nút tham quan một làng nghề
 */
export function recordVillageVisit(slug: string): { isNew: boolean; newBadge?: PassportBadge } {
  const passport = getPassport();
  let isNew = false;
  let newBadge: PassportBadge | undefined;

  const nowIso = new Date().toISOString();

  if (!passport.visitedVillages.includes(slug)) {
    passport.visitedVillages.push(slug);
    passport.visitedDates[slug] = nowIso;
    passport.points += 20;
    isNew = true;

    // Check first check-in badge
    if (!passport.badges['badge-first-checkin']) {
      passport.badges['badge-first-checkin'] = nowIso;
      passport.points += 30;
      newBadge = ALL_BADGES.find(b => b.id === 'badge-first-checkin');
    }

    // Check 3 villages visit badge
    if (passport.visitedVillages.length >= 3 && !passport.badges['badge-explorer-3']) {
      passport.badges['badge-explorer-3'] = nowIso;
      passport.points += 50;
      newBadge = ALL_BADGES.find(b => b.id === 'badge-explorer-3');
    }

    savePassport(passport);
  }

  return { isNew, newBadge };
}

/**
 * Hủy ghi nhận tham quan (nếu người dùng bấm nhầm)
 */
export function removeVillageVisit(slug: string): void {
  const passport = getPassport();
  if (passport.visitedVillages.includes(slug)) {
    passport.visitedVillages = passport.visitedVillages.filter(s => s !== slug);
    delete passport.visitedDates[slug];
    // Không trừ điểm hoặc chỉ xóa trạng thái
    savePassport(passport);
  }
}

/**
 * Thêm ảnh lưu niệm cho một làng nghề cụ thể
 */
export function addSouvenirPhoto(photo: {
  villageSlug: string;
  villageName: string;
  url: string;
  caption?: string;
  date?: string;
}): { photo: SouvenirPhoto; newBadge?: PassportBadge } {
  const passport = getPassport();
  const nowIso = photo.date || new Date().toISOString();
  
  const newPhoto: SouvenirPhoto = {
    id: `souvenir_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    villageSlug: photo.villageSlug,
    villageName: photo.villageName,
    url: photo.url,
    caption: photo.caption?.trim() || '',
    date: nowIso
  };

  passport.souvenirPhotos.unshift(newPhoto);
  passport.points += 15; // Thưởng 15 điểm di sản khi lưu ảnh kỷ niệm

  let newBadge: PassportBadge | undefined;
  // Unlock badge photographer if first time
  if (!passport.badges['badge-photographer']) {
    passport.badges['badge-photographer'] = nowIso;
    passport.points += 50;
    newBadge = ALL_BADGES.find(b => b.id === 'badge-photographer');
  }

  savePassport(passport);
  return { photo: newPhoto, newBadge };
}

/**
 * Xóa một ảnh lưu niệm
 */
export function deleteSouvenirPhoto(photoId: string): void {
  const passport = getPassport();
  passport.souvenirPhotos = passport.souvenirPhotos.filter(p => p.id !== photoId);
  savePassport(passport);
}

/**
 * Cập nhật chú thích ảnh lưu niệm
 */
export function updateSouvenirCaption(photoId: string, caption: string): void {
  const passport = getPassport();
  const target = passport.souvenirPhotos.find(p => p.id === photoId);
  if (target) {
    target.caption = caption.trim();
    savePassport(passport);
  }
}

/**
 * Lấy danh sách ảnh lưu niệm của một làng nghề cụ thể
 */
export function getSouvenirPhotosByVillage(slug: string): SouvenirPhoto[] {
  const passport = getPassport();
  return passport.souvenirPhotos.filter(p => p.villageSlug === slug);
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

/**
 * Nén ảnh phía trình duyệt xuống kích thước vừa phải trước khi lưu Base64 vào localStorage
 * Tránh làm tràn bộ nhớ localStorage (5MB)
 */
export function compressImage(file: File, maxWidth = 1000, quality = 0.75): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.onerror = () => reject(new Error('Không thể đọc dữ liệu ảnh.'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Lỗi khi tải tệp ảnh.'));
    reader.readAsDataURL(file);
  });
}
