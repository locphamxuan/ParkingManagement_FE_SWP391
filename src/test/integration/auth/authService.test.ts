/**
 * Integration tests — Auth service
 * Gọi BE thật. Yêu cầu: BE đang chạy + credentials trong .env.test.local
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { TestContext } from 'vitest';
import { loginWithBackend, fetchCurrentUser, type AuthSession } from '@/services/authService';
import { setStoredToken } from '@/services/client/apiClient';

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined) || 'http://localhost:5000/api';

// Login trực tiếp qua fetch (không qua loginWithBackend) để lấy token thô —
// dùng cho test fetchCurrentUser(token), vì AuthSession phía FE không còn
// giữ token (xác thực trình duyệt dựa vào httpOnly cookie, không phải giá trị này).
async function fetchRawToken(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/users/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json();
  const token: string | undefined = body?.data?.token;
  if (!token) throw new Error('BE không trả về token sau khi login');
  return token;
}

// Login một lần trong beforeAll, chia sẻ session cho các test — tránh rate-limit
let staffSession: AuthSession | null = null;
let managerSession: AuthSession | null = null;
let staffToken = '';
let isReady = false;

beforeAll(async () => {
  try {
    [staffSession, managerSession, staffToken] = await Promise.all([
      loginWithBackend({
        email: import.meta.env.VITE_TEST_STAFF_EMAIL as string,
        password: import.meta.env.VITE_TEST_STAFF_PASSWORD as string,
      }),
      loginWithBackend({
        email: import.meta.env.VITE_TEST_MANAGER_EMAIL as string,
        password: import.meta.env.VITE_TEST_MANAGER_PASSWORD as string,
      }),
      fetchRawToken(
        import.meta.env.VITE_TEST_STAFF_EMAIL as string,
        import.meta.env.VITE_TEST_STAFF_PASSWORD as string,
      ),
    ]);
    isReady = true;
  } catch (err) {
    console.warn(`[SKIP] auth tests: ${err instanceof Error ? err.message : String(err)}`);
  }
});

afterAll(() => {
  setStoredToken(null);
});

beforeEach((ctx: TestContext) => {
  if (!isReady) ctx.skip();
});

// ── LOGIN ─────────────────────────────────────────────────────────────────────

describe('Auth — loginWithBackend', () => {
  it('login thành công → trả về AuthSession với đầy đủ trường', () => {
    // Kiểm tra session đã được tạo trong beforeAll — không login lại
    // (token không còn nằm trong AuthSession phía FE: BE set qua httpOnly cookie)
    expect(staffSession).not.toBeNull();
    expect(staffSession!.userId).toBeTruthy();
    expect(staffSession!.email).toBeTruthy();
    expect(staffSession!.displayName).toBeTruthy();
    expect(typeof staffSession!.role).toBe('string');
    expect(Array.isArray(staffSession!.assignedBuildingIds)).toBe(true);
    expect(Array.isArray(staffSession!.licensePlates)).toBe(true);
  });

  it('staff login → role = staff, có assignedBuildingIds', () => {
    expect(staffSession!.role).toBe('staff');
    expect(staffSession!.assignedBuildingIds.length).toBeGreaterThan(0);
  });

  it('manager login → role = manager', () => {
    expect(managerSession!.role).toBe('manager');
  });

  it('sai password → throw', async () => {
    await expect(
      loginWithBackend({
        email: import.meta.env.VITE_TEST_STAFF_EMAIL as string,
        password: 'wrong_password_xyz_abc',
      }),
    ).rejects.toThrow();
  });

  it('email không tồn tại → throw', async () => {
    await expect(
      loginWithBackend({ email: 'nonexistent_xyz_999@pbms.vn', password: 'any' }),
    ).rejects.toThrow();
  });
});

// ── FETCH CURRENT USER ────────────────────────────────────────────────────────

describe('Auth — fetchCurrentUser', () => {
  it('lấy được thông tin user từ token hiện tại', async () => {
    // Dùng token thô đã lấy trong beforeAll — không login lại
    const meSession = await fetchCurrentUser(staffToken);

    expect(meSession.email).toBe(staffSession!.email);
    expect(meSession.role).toBe(staffSession!.role);
    expect(meSession.userId).toBe(staffSession!.userId);
  });

  it('token không hợp lệ → throw', async () => {
    await expect(fetchCurrentUser('invalid.token.xyz')).rejects.toThrow();
  });
});
