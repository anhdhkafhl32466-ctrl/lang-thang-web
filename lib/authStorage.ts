export interface UserAccount {
  id: string;
  email: string;
  name: string;
  avatar: string;
  provider: 'google';
  createdAt: string;
  lastLogin: string;
  role: 'member' | 'artisan' | 'admin';
  verifiedEmail: boolean;
  phone?: string;
  bio?: string;
}

export interface LoginHistoryItem {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  timestamp: string;      // ISO 8601
  formattedDate: string;  // "16/09/2026, 11:35:12"
  device: string;         // "Windows 11 PC", "iPhone", "Android"
  browser: string;        // "Google Chrome 128.0", "Safari"
  ip: string;             // Client IP address
  location: string;       // "Hà Nội, Việt Nam"
  method: string;         // "Google OAuth 2.0" | "Gmail One-Tap"
  status: 'active' | 'completed';
}

const USER_STORAGE_KEY = 'hanoi_craft_user_v1';
const HISTORY_STORAGE_KEY = 'hanoi_craft_login_history_v1';

export function parseDeviceInfo(userAgent?: string): { device: string; browser: string } {
  const ua = userAgent || (typeof window !== 'undefined' ? navigator.userAgent : '');

  // Detect Device / OS
  let device = 'Máy tính cá nhân';
  if (/Windows/i.test(ua)) device = 'Windows PC';
  else if (/iPhone/i.test(ua)) device = 'Apple iPhone';
  else if (/iPad/i.test(ua)) device = 'Apple iPad';
  else if (/Android/i.test(ua)) device = 'Thiết bị Android';
  else if (/Macintosh|Mac OS/i.test(ua)) device = 'Apple Mac';
  else if (/Linux/i.test(ua)) device = 'Hệ điều hành Linux';

  // Detect Browser
  let browser = 'Trình duyệt web';
  if (/Edg/i.test(ua)) browser = 'Microsoft Edge';
  else if (/Chrome/i.test(ua) && !/Edg/i.test(ua)) browser = 'Google Chrome';
  else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Apple Safari';
  else if (/Firefox/i.test(ua)) browser = 'Mozilla Firefox';

  return { device, browser };
}

export function getCurrentUser(): UserAccount | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function getLoginHistory(): LoginHistoryItem[] {
  if (typeof window === 'undefined') return [];

  try {
    const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export function recordLogin(
  userData: {
    id: string;
    email: string;
    name: string;
    avatar: string;
    phone?: string;
  },
  options?: {
    ip?: string;
    location?: string;
    method?: string;
  }
): { user: UserAccount; historyItem: LoginHistoryItem } {
  const now = new Date();
  const timestamp = now.toISOString();
  const formattedDate = now.toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const { device, browser } = parseDeviceInfo();

  const existingUser = getCurrentUser();
  const createdAt = existingUser?.createdAt || timestamp;

  const user: UserAccount = {
    id: userData.id,
    email: userData.email,
    name: userData.name || userData.email.split('@')[0],
    avatar: userData.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${userData.email}`,
    provider: 'google',
    createdAt,
    lastLogin: timestamp,
    role: 'member',
    verifiedEmail: true,
    phone: userData.phone
  };

  const historyItem: LoginHistoryItem = {
    id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    userId: user.id,
    userEmail: user.email,
    userName: user.name,
    timestamp,
    formattedDate,
    device,
    browser,
    ip: options?.ip || '127.0.0.1 (Localhost / Wi-Fi)',
    location: options?.location || 'Hà Nội, Việt Nam',
    method: options?.method || 'Google OAuth 2.0 (Gmail)',
    status: 'active'
  };

  if (typeof window !== 'undefined') {
    // Save user
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

    // Save history (prepend and limit to 50 entries)
    const existingHistory = getLoginHistory();
    // Mark previous active sessions as completed
    const updatedHistory = [
      historyItem,
      ...existingHistory.map(h => ({ ...h, status: 'completed' as const }))
    ].slice(0, 50);

    localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(updatedHistory));

    // Dispatch global event for reactive UI updates across all components
    window.dispatchEvent(new CustomEvent('auth_state_changed', { detail: { user, historyItem } }));
  }

  return { user, historyItem };
}

export function logout(): void {
  if (typeof window === 'undefined') return;

  // Mark latest session as completed
  try {
    const history = getLoginHistory();
    if (history.length > 0) {
      history[0].status = 'completed';
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    }
    localStorage.removeItem(USER_STORAGE_KEY);
  } catch (err) {
    console.error('Error during logout:', err);
  }

  window.dispatchEvent(new CustomEvent('auth_state_changed', { detail: { user: null } }));
}

export function clearLoginHistory(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(HISTORY_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent('auth_state_changed', { detail: { user: getCurrentUser() } }));
}

export function updateUserProfile(updates: Partial<UserAccount>): UserAccount | null {
  const current = getCurrentUser();
  if (!current) return null;

  const updated: UserAccount = {
    ...current,
    ...updates,
    id: current.id, // Immutable
    email: current.email // Immutable
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('auth_state_changed', { detail: { user: updated } }));
  }

  return updated;
}
