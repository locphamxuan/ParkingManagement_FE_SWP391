const STORAGE_KEYS = {
  apiBase: 'pbms.apiBase',
  token: 'pbms.token',
  user: 'pbms.user',
};

export function loadJson(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (_error) {
    return null;
  }
}

export function loadApiBase(defaultValue) {
  return localStorage.getItem(STORAGE_KEYS.apiBase) || defaultValue;
}

export function saveApiBase(apiBase) {
  localStorage.setItem(STORAGE_KEYS.apiBase, apiBase);
}

export function loadSession() {
  const token = localStorage.getItem(STORAGE_KEYS.token) || '';
  const user = loadJson(STORAGE_KEYS.user);

  return { token, user };
}

export function saveSession(session) {
  if (session?.token) {
    localStorage.setItem(STORAGE_KEYS.token, session.token);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(session.user || null));
    return;
  }

  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.user);
}