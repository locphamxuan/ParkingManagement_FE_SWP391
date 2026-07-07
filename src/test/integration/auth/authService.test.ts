/**
 * Integration tests — Auth service
 * Gọi BE thật. Yêu cầu: BE đang chạy + credentials trong .env.test.local
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { TestContext } from 'vitest';
import { loginWithBackend, fetchCurrentUser, type AuthSession } from '@/services/authService';
import { setStoredToken } from '@/services/client/apiClient';

// Login một lần trong beforeAll, chia sẻ session cho các test — tránh rate-limit
let staffSession: AuthSession | null = null;
let managerSession: AuthSession | null = null;
let isReady = false;

beforeAll(async () => {
  try {
    [staffSession, managerSession] = await Promise.all([
      loginWithBackend({
        email: import.meta.env.VITE_TEST_STAFF_EMAIL as string,
        password: import.meta.env.VITE_TEST_STAFF_PASSWORD as string,
      }),
      loginWithBackend({
        email: import.meta.env.VITE_TEST_MANAGER_EMAIL as string,
        password: import.meta.env.VITE_TEST_MANAGER_PASSWORD as string,
      }),
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
    expect(staffSession).not.toBeNull();
    expect(staffSession!.token).toBeTruthy();
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
    // Dùng token đã có từ beforeAll — không login lại
    const token = staffSession!.token;
    const meSession = await fetchCurrentUser(token);

    expect(meSession.token).toBe(token);
    expect(meSession.email).toBe(staffSession!.email);
    expect(meSession.role).toBe(staffSession!.role);
    expect(meSession.userId).toBe(staffSession!.userId);
  });

  it('token không hợp lệ → throw', async () => {
    await expect(fetchCurrentUser('invalid.token.xyz')).rejects.toThrow();
  });
});
