// Hỗ trợ cả hai tên biến môi trường từng dùng (VITE_API_BASE và VITE_API_BASE_URL)
// để giữ tương thích sau khi hợp nhất 2 HTTP client về một.
const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) ||
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ||
  'http://localhost:5000/api';

// Auth chính dùng httpOnly cookie (BE set + đọc, xem utils/authCookie.js phía BE)
// — trình duyệt tự đính kèm cookie này nhờ `credentials: 'include'` bên dưới,
// KHÔNG lưu token vào localStorage. Biến in-memory dưới đây chỉ tồn tại trong
// vòng đời tab hiện tại (mất khi reload) và chỉ thực sự cần cho test helpers
// gọi thẳng API không qua trình duyệt (xem test/integration/helpers/auth.ts);
// app thật không cần gọi setStoredToken vì cookie đã tự lo việc xác thực.
let inMemoryToken: string | null = null;

export function setStoredToken(token: string | null): void {
  inMemoryToken = token;
}

export function getStoredToken(): string | null {
  return inMemoryToken;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface ApiOptions {
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
  /** Ghi đè token (nếu không truyền sẽ lấy từ localStorage). */
  token?: string;
}

function buildQuery(query?: ApiOptions['query']): string {
  if (!query) return '';
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    params.set(key, String(value));
  });
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

export async function apiRequest<T = unknown>(
  method: Method,
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const token = options.token ?? getStoredToken();
  const url = `${API_BASE}${path}${buildQuery(options.query)}`;

  const res = await fetch(url, {
    method,
    credentials: 'include', // gửi kèm httpOnly auth cookie (cross-origin FE/BE)
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  if (!res.ok) {
    const message =
      (payload && typeof payload === 'object' && 'message' in payload
        ? String((payload as { message?: unknown }).message)
        : null) || `Request failed (${res.status})`;
    if (res.status === 401) {
      setStoredToken(null);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth-unauthorized'));
      }
    }
    throw new ApiError(message, res.status, payload);
  }

  return payload as T;
}

export const api = {
  get: <T = unknown>(path: string, options?: ApiOptions) =>
    apiRequest<T>('GET', path, options),
  post: <T = unknown>(path: string, body?: unknown, options?: ApiOptions) =>
    apiRequest<T>('POST', path, { ...options, body }),
  put: <T = unknown>(path: string, body?: unknown, options?: ApiOptions) =>
    apiRequest<T>('PUT', path, { ...options, body }),
  patch: <T = unknown>(path: string, body?: unknown, options?: ApiOptions) =>
    apiRequest<T>('PATCH', path, { ...options, body }),
  delete: <T = unknown>(path: string, options?: ApiOptions) =>
    apiRequest<T>('DELETE', path, options),
};

export const API_BASE_URL = API_BASE;

// ── Adapter tương thích (thay cho services/client/pbmsApi cũ) ────────────────
// Giữ nguyên chữ ký `requestJson` để các caller (auth, admin) không phải đổi,
// nhưng nội bộ dùng chung `apiRequest` → chỉ còn MỘT triển khai HTTP.
export const DEFAULT_API_BASE = API_BASE;

export function normalizeApiBase(value: string = DEFAULT_API_BASE): string {
  return String(value).trim().replace(/\/$/, '');
}

interface RequestJsonOptions {
  /** Không còn dùng (mọi call đi qua API_BASE chung); giữ để tương thích chữ ký. */
  apiBase?: string;
  path: string;
  method?: Method;
  token?: string;
  body?: unknown;
}

export function requestJson<T = unknown>({
  path,
  method = 'GET',
  token,
  body,
}: RequestJsonOptions): Promise<T> {
  return apiRequest<T>(method, path, { body, token });
}
