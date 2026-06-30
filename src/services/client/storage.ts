const STORAGE_KEYS = {
  token: 'pbms.token',
  user: 'pbms.user',
  forgotEmailPending: 'pbms.forgotEmail_pending',
} as const;

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
