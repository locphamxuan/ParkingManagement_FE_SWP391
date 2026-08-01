import { setStoredToken } from '@/services/client/apiClient';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || 'http://localhost:5000/api';

// Lấy token bằng cách login thật vào BE
async function fetchToken(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/users/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    // clientType 'mobile' = client không dùng cookie được, BE mới trả token
    // trong body. Test gọi thẳng API nên đi đúng đường đó.
    body: JSON.stringify({ email, password, clientType: 'mobile' }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Login thất bại (${res.status}): ${(body as { message?: string }).message ?? 'unknown'}`);
  }

  const body = await res.json();
  const token: string | undefined = body?.data?.token;
  if (!token) throw new Error('BE không trả về token sau khi login');
  return token;
}

// Gọi trước mỗi suite để set token vào storage (api client đọc từ đây)
export async function loginAsUser(): Promise<void> {
  const token = await fetchToken(
    import.meta.env.VITE_TEST_USER_EMAIL as string,
    import.meta.env.VITE_TEST_USER_PASSWORD as string,
  );
  setStoredToken(token);
}

export async function loginAsStaff(): Promise<void> {
  const token = await fetchToken(
    import.meta.env.VITE_TEST_STAFF_EMAIL as string,
    import.meta.env.VITE_TEST_STAFF_PASSWORD as string,
  );
  setStoredToken(token);
}

export async function loginAsManager(): Promise<void> {
  const token = await fetchToken(
    import.meta.env.VITE_TEST_MANAGER_EMAIL as string,
    import.meta.env.VITE_TEST_MANAGER_PASSWORD as string,
  );
  setStoredToken(token);
}

export async function loginAsAdmin(): Promise<void> {
  const token = await fetchToken(
    import.meta.env.VITE_TEST_ADMIN_EMAIL as string,
    import.meta.env.VITE_TEST_ADMIN_PASSWORD as string,
  );
  setStoredToken(token);
}

export function clearToken(): void {
  setStoredToken(null);
}

export const TEST_BUILDING_ID = (import.meta.env.VITE_TEST_BUILDING_ID as string | undefined) || '';
