export const DEFAULT_API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ||
  'http://localhost:5000/api';

export function normalizeApiBase(value: string = DEFAULT_API_BASE): string {
  return String(value).trim().replace(/\/$/, '');
}

interface RequestJsonOptions {
  apiBase?: string;
  path: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  token?: string;
  body?: unknown;
}

export async function requestJson<T = unknown>({
  apiBase = DEFAULT_API_BASE,
  path,
  method = 'GET',
  token,
  body,
}: RequestJsonOptions): Promise<T> {
  const response = await fetch(`${normalizeApiBase(apiBase)}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const message =
      typeof payload === 'object' && payload !== null && 'message' in payload
        ? String((payload as { message?: unknown }).message || 'Khong the xu ly yeu cau')
        : 'Khong the xu ly yeu cau';
    throw new Error(message);
  }

  return payload as T;
}
