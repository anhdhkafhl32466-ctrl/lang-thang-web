import { getCurrentUser } from '@/lib/authStorage';

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
  type: 'pottery' | 'hat' | 'silk';
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
    id: 'badge-silk',
    name: 'Bậc Thầy Canh Cửi Vạn Phúc',
    icon: '🧵',
    description: 'Tự tay dệt nên tấm lụa gấm hoa Vạn Phúc óng ả với nhịp thoi đưa cổ truyền.',
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

const LEGACY_STORAGE_KEY = 'hanoi_craft_passport_v1';
const GUEST_STORAGE_KEY = 'hanoi_craft_passport_guest_v2';

/**
 * Lấy địa chỉ email của tài khoản đang đăng nhập hiện tại
 */
export function getActiveUserEmail(): string | null {
  if (typeof window === 'undefined') return null;
  const user = getCurrentUser();
  return user?.email ? user.email.toLowerCase().trim() : null;
}

/**
 * Trả về key lưu trữ trong localStorage riêng biệt theo từng tài khoản Gmail
 */
export function getStorageKey(email?: string | null): string {
  const activeEmail = email !== undefined ? email : getActiveUserEmail();
  if (activeEmail) {
    return `hanoi_craft_passport_user_${encodeURIComponent(activeEmail.toLowerCase().trim())}`;
  }
  return GUEST_STORAGE_KEY;
}

function getInitialPassport(): PassportData {
  return {
    visitedVillages: [],
    visitedDates: {},
    souvenirPhotos: [],
    badges: { 'badge-welcome': new Date().toISOString() },
    creations: [],
    points: 50
  };
}

/**
 * Lấy dữ liệu hộ chiếu của tài khoản hiện tại từ LocalStorage
 */
export function getPassport(email?: string | null): PassportData {
  if (typeof window === 'undefined') {
    return getInitialPassport();
  }

  const targetEmail = email !== undefined ? email : getActiveUserEmail();
  const key = getStorageKey(targetEmail);

  try {
    let raw = localStorage.getItem(key);

    // Xử lý di chuyển dữ liệu cũ (Migration) nếu có dữ liệu ở bản cũ
    if (!raw && targetEmail) {
      const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        localStorage.setItem(key, legacy);
        raw = legacy;
      }
    }

    if (!raw) {
      const initial = getInitialPassport();
      localStorage.setItem(key, JSON.stringify(initial));
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
    return getInitialPassport();
  }
}

/**
 * Lưu hộ chiếu của tài khoản hiện tại vào LocalStorage và đồng bộ ngầm lên Server Cloud
 */
export function savePassport(data: PassportData, email?: string | null): void {
  if (typeof window === 'undefined') return;

  const targetEmail = email !== undefined ? email : getActiveUserEmail();
  const key = getStorageKey(targetEmail);

  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new Event('passport_updated'));

    // Đồng bộ lên Server API nếu đang đăng nhập Gmail
    if (targetEmail) {
      fetch('/api/passport', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, passport: data })
      }).catch(err => {
        console.warn('Đồng bộ hộ chiếu lên máy chủ thất bại:', err);
      });
    }
  } catch (err) {
    console.error('Lỗi khi lưu dữ liệu hộ chiếu:', err);
  }
}

/**
 * Hợp nhất dữ liệu hộ chiếu từ 2 nguồn (Server và Local)
 */
function mergePassports(local: PassportData, server: any): PassportData {
  if (!server) return local;

  // Hợp nhất danh sách làng nghề đã tham quan
  const visitedSet = new Set<string>([...(server.visitedVillages || []), ...(local.visitedVillages || [])]);
  const visitedVillages = Array.from(visitedSet);

  // Hợp nhất ngày ghé thăm
  const visitedDates = {
    ...(server.visitedDates || {}),
    ...(local.visitedDates || {})
  };

  // Hợp nhất huy hiệu
  const badges = {
    ...(server.badges || {}),
    ...(local.badges || {})
  };

  // Hợp nhất ảnh lưu niệm theo ID
  const photoMap = new Map<string, SouvenirPhoto>();
  (server.souvenirPhotos || []).forEach((p: SouvenirPhoto) => photoMap.set(p.id, p));
  (local.souvenirPhotos || []).forEach((p: SouvenirPhoto) => photoMap.set(p.id, p));
  const souvenirPhotos = Array.from(photoMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Hợp nhất tác phẩm ảo theo ID
  const creationMap = new Map<string, VirtualCreation>();
  (server.creations || []).forEach((c: VirtualCreation) => creationMap.set(c.id, c));
  (local.creations || []).forEach((c: VirtualCreation) => creationMap.set(c.id, c));
  const creations = Array.from(creationMap.values()).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // Điểm tích lũy lấy giá trị lớn nhất
  const points = Math.max(local.points || 50, server.points || 50);

  return {
    visitedVillages,
    visitedDates,
    souvenirPhotos,
    badges,
    creations,
    points
  };
}

/**
 * Đồng bộ hai chiều Hộ Chiếu với máy chủ theo email Gmail (Hỗ trợ đa thiết bị)
 */
export async function syncPassportWithServer(email?: string | null): Promise<PassportData> {
  const targetEmail = email !== undefined ? email : getActiveUserEmail();
  const localData = getPassport(targetEmail);

  if (!targetEmail || typeof window === 'undefined') {
    return localData;
  }

  try {
    const res = await fetch(`/api/passport?email=${encodeURIComponent(targetEmail)}`);
    if (res.ok) {
      const json = await res.json();
      if (json.found && json.passport) {
        // Hợp nhất dữ liệu đám mây và cục bộ
        const merged = mergePassports(localData, json.passport);
        const key = getStorageKey(targetEmail);
        localStorage.setItem(key, JSON.stringify(merged));

        // Cập nhật lại bản hợp nhất lên máy chủ nếu có dữ liệu mới
        fetch('/api/passport', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail, passport: merged })
        }).catch(() => {});

        window.dispatchEvent(new Event('passport_updated'));
        return merged;
      } else {
        // Nếu trên server chưa có dữ liệu, đẩy dữ liệu hiện tại lên
        fetch('/api/passport', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: targetEmail, passport: localData })
        }).catch(() => {});
      }
    }
  } catch (err) {
    console.warn('Lỗi kết nối tới máy chủ khi đồng bộ hộ chiếu:', err);
  }

  return localData;
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

// Lắng nghe sự kiện đăng nhập / đăng xuất để tự động đổi hộ chiếu tương ứng với tài khoản
if (typeof window !== 'undefined') {
  // Khi ứng dụng khởi chạy lần đầu trên trình duyệt
  const currentUser = getCurrentUser();
  if (currentUser?.email) {
    syncPassportWithServer(currentUser.email);
  }

  // Khi có sự kiện đăng nhập hoặc đăng xuất
  window.addEventListener('auth_state_changed', ((e: CustomEvent) => {
    const user = e.detail?.user;
    if (user?.email) {
      // Đăng nhập tài khoản mới: Tải và đồng bộ hộ chiếu của tài khoản đó từ máy chủ
      syncPassportWithServer(user.email);
    } else {
      // Đăng xuất: Đổi trạng thái hiển thị về hộ chiếu khách (guest)
      window.dispatchEvent(new Event('passport_updated'));
    }
  }) as EventListener);
}
