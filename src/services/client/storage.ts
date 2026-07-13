// Giá trị key phải giữ nguyên vĩnh viễn — đổi là mất dữ liệu người dùng đã lưu.
export const STORAGE_KEYS = {
  token: 'pbms.token',
  user: 'pbms.user',
  forgotEmailPending: 'pbms.forgotEmail_pending',
  savedAccounts: 'pbms_saved_accounts',
  staffCameraDevices: 'pbms.staffCameraDevices',
  selectedVehicleType: 'pbms_selected_vehicle_type',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export interface LocalSession {
  token: string;
  user: Record<string, unknown> | null;
}

export function loadJson<T = unknown>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function saveJson(key: StorageKey, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage không khả dụng (private mode) — bỏ qua, không chặn UI
  }
}

export function loadString(key: StorageKey): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function saveString(key: StorageKey, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // localStorage không khả dụng — bỏ qua
  }
}

export function removeStored(key: StorageKey): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // localStorage không khả dụng — bỏ qua
  }
}

export function loadSession(): LocalSession {
  const token = localStorage.getItem(STORAGE_KEYS.token) || '';
  const user = loadJson<Record<string, unknown>>(STORAGE_KEYS.user);

  return { token, user };
}

export function saveSession(session: LocalSession): void {
  if (session?.token) {
    localStorage.setItem(STORAGE_KEYS.token, session.token);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(session.user || null));
    return;
  }

  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
}

export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
}

export function saveForgotEmail(email: string): void {
  localStorage.setItem(STORAGE_KEYS.forgotEmailPending, email);
}

export function loadForgotEmail(): string | null {
  return localStorage.getItem(STORAGE_KEYS.forgotEmailPending);
}

export function clearForgotEmail(): void {
  localStorage.removeItem(STORAGE_KEYS.forgotEmailPending);
}
