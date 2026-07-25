// Giá trị key phải giữ nguyên vĩnh viễn — đổi là mất dữ liệu người dùng đã lưu.
// Lưu ý: KHÔNG có key nào cho auth token ở đây — token xác thực sống trong
// httpOnly cookie do BE quản lý; session (user) được khôi phục qua GET
// /users/auth/me mỗi lần tải lại trang, không cache trong localStorage.
export const STORAGE_KEYS = {
  forgotEmailPending: 'pbms.forgotEmail_pending',
  savedAccounts: 'pbms_saved_accounts',
  staffCameraDevices: 'pbms.staffCameraDevices',
  selectedVehicleType: 'pbms_selected_vehicle_type',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

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

export function saveForgotEmail(email: string): void {
  localStorage.setItem(STORAGE_KEYS.forgotEmailPending, email);
}

export function loadForgotEmail(): string | null {
  return localStorage.getItem(STORAGE_KEYS.forgotEmailPending);
}

export function clearForgotEmail(): void {
  localStorage.removeItem(STORAGE_KEYS.forgotEmailPending);
}
