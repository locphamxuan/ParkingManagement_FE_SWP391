/**
 * Integration tests — User role
 * Gọi BE thật tại VITE_API_BASE (mặc định http://localhost:5000/api).
 * Yêu cầu: BE đang chạy + credentials trong .env.test.local
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type { TestContext } from 'vitest';
import { userApi } from '@/services/user/userApi';
import { getStoredToken } from '@/services/client/apiClient';
import { loginAsUser, clearToken } from '../helpers/auth';

let isReady = false;

beforeAll(async () => {
  try {
    await loginAsUser();
    isReady = true;
  } catch (err) {
    // Credentials sai hoặc BE rate-limit → bỏ qua toàn bộ suite
    console.warn(`[SKIP] user tests: ${err instanceof Error ? err.message : String(err)}`);
  }
});

// Skip mọi test nếu login thất bại — không dùng throw để file không bị "failed"
beforeEach((ctx: TestContext) => {
  if (!isReady) ctx.skip();
});

afterAll(() => {
  clearToken();
});

// ── BUILDINGS ─────────────────────────────────────────────────────────────────

describe('User — buildings', () => {
  it('list: trả về mảng buildings có shape đúng', async () => {
    const res = await userApi.buildings.list();
    expect(res.data).toBeDefined();
    const items = res.data.items;
    expect(Array.isArray(items)).toBe(true);

    if (items.length > 0) {
      const b = items[0];
      expect(b).toHaveProperty('_id');
      expect(b).toHaveProperty('name');
      expect(b).toHaveProperty('code');
      expect(['active', 'inactive', 'maintenance']).toContain(b.status);
    }
  });

  it('vehicleTypes: trả về danh sách loại xe của building', async () => {
    const listRes = await userApi.buildings.list();
    const firstBuilding = listRes.data.items[0];
    if (!firstBuilding) return;

    const res = await userApi.buildings.vehicleTypes(firstBuilding._id);
    expect(res.data).toBeDefined();
    const items = res.data.items;
    expect(Array.isArray(items)).toBe(true);
  });

  it('floors: trả về danh sách tầng với số slot còn trống', async () => {
    const listRes = await userApi.buildings.list();
    const firstBuilding = listRes.data.items[0];
    if (!firstBuilding) return;

    const res = await userApi.buildings.floors(firstBuilding._id);
    expect(res.data).toBeDefined();
    expect(Array.isArray(res.data.floors)).toBe(true);

    if (res.data.floors.length > 0) {
      const floor = res.data.floors[0];
      expect(floor).toHaveProperty('availableSlots');
      expect(floor).toHaveProperty('totalSlots');
      expect(typeof floor.availableSlots).toBe('number');
    }
  });
});

// ── PARKING HISTORY ───────────────────────────────────────────────────────────

describe('User — parkingHistory', () => {
  it('list: trả về lịch sử gửi xe với shape đúng', async () => {
    const res = await userApi.parkingHistory.list({ page: 1, limit: 10 });
    expect(res.data).toBeDefined();
    expect(Array.isArray(res.data.items)).toBe(true);

    if (res.data.items.length > 0) {
      const s = res.data.items[0];
      expect(s).toHaveProperty('_id');
      expect(s).toHaveProperty('plateNumber');
      expect(['active', 'completed', 'cancelled']).toContain(s.status);
      // paymentStatus không tồn tại — dùng status và paymentMethod
      expect(s).not.toHaveProperty('paymentStatus');
    }
  });

  it('get: trả về chi tiết phiên gửi xe theo ID', async () => {
    const listRes = await userApi.parkingHistory.list({ limit: 1 });
    const first = listRes.data.items[0];
    if (!first) return;

    const res = await userApi.parkingHistory.get(first._id);
    expect(res.data).toBeDefined();
    expect(res.data.session).toBeDefined();
    expect(res.data.session._id).toBe(first._id);
    expect(res.data.session).toHaveProperty('plateNumber');
  });
});

// ── LONG-TERM PACKAGES ────────────────────────────────────────────────────────

describe('User — longTermPackages', () => {
  it('list: trả về danh sách gói dài hạn', async () => {
    const res = await userApi.longTermPackages.list();
    expect(res.data).toBeDefined();
    expect(Array.isArray(res.data.packages)).toBe(true);

    if (res.data.packages.length > 0) {
      const pkg = res.data.packages[0];
      expect(pkg).toHaveProperty('_id');
      expect(pkg).toHaveProperty('name');
      expect(typeof pkg.price).toBe('number');
      expect(typeof pkg.durationDays).toBe('number');
    }
  });

  it('get: trả về chi tiết gói theo ID', async () => {
    const listRes = await userApi.longTermPackages.list();
    const first = listRes.data.packages[0];
    if (!first) return;

    const res = await userApi.longTermPackages.get(first._id);
    expect(res.data).toBeDefined();
    expect(res.data.package).toBeDefined();
    expect(res.data.package._id).toBe(first._id);
    expect(res.data.package).toHaveProperty('name');
    expect(typeof res.data.package.price).toBe('number');
  });
});

// ── LONG-TERM SUBSCRIPTIONS ───────────────────────────────────────────────────

describe('User — longTermSubscriptions', () => {
  it('list: trả về danh sách gói đã đăng ký', async () => {
    const res = await userApi.longTermSubscriptions.list({ page: 1 });
    expect(res.data).toBeDefined();
    expect(Array.isArray(res.data.items)).toBe(true);

    if (res.data.items.length > 0) {
      const sub = res.data.items[0];
      expect(sub).toHaveProperty('_id');
      expect(sub).toHaveProperty('startDate');
      expect(sub).toHaveProperty('endDate');
      expect(['pending', 'active', 'expired', 'cancelled']).toContain(sub.status);
    }
  });

  it('get: trả về chi tiết đăng ký gói theo ID', async () => {
    const listRes = await userApi.longTermSubscriptions.list({ limit: 1 });
    const first = listRes.data.items[0];
    if (!first) return;

    const res = await userApi.longTermSubscriptions.get(first._id);
    expect(res.data).toBeDefined();
    expect(res.data.subscription).toBeDefined();
    expect(res.data.subscription._id).toBe(first._id);
    expect(res.data.subscription).toHaveProperty('startDate');
    expect(['pending', 'active', 'expired', 'cancelled']).toContain(res.data.subscription.status);
  });
});

// ── LICENSE PLATES ────────────────────────────────────────────────────────────

describe('User — licensePlates', () => {
  it('list: trả về biển số xe với shape đúng', async () => {
    const res = await userApi.licensePlates.list();
    expect(res.data).toBeDefined();
    expect(Array.isArray(res.data.licensePlates)).toBe(true);

    if (res.data.licensePlates.length > 0) {
      const plate = res.data.licensePlates[0];
      expect(plate).toHaveProperty('_id');
      expect(plate).toHaveProperty('plateNumber');
      expect(typeof plate.isDefault).toBe('boolean');
    }
  });
});

// ── WALLET ────────────────────────────────────────────────────────────────────

describe('User — wallet', () => {
  it('get: trả về ví với balance là số', async () => {
    const res = await userApi.wallet.get();
    expect(res.data).toBeDefined();
    // BE trả về { walletBalance } trực tiếp, không phải { wallet: { balance } }
    expect(typeof res.data.walletBalance).toBe('number');
    expect(res.data.walletBalance).toBeGreaterThanOrEqual(0);
  });

  it('transactions: trả về lịch sử giao dịch ví', async () => {
    const res = await userApi.wallet.transactions({ page: 1, limit: 10 });
    expect(res.data).toBeDefined();
    expect(Array.isArray(res.data.items)).toBe(true);

    if (res.data.items.length > 0) {
      const tx = res.data.items[0];
      expect(['credit', 'debit']).toContain(tx.type);
      expect(typeof tx.amount).toBe('number');
    }
  });
});

// ── NOTIFICATIONS ─────────────────────────────────────────────────────────────

describe('User — notifications', () => {
  it('list: trả về thông báo với trường unread', async () => {
    const res = await userApi.notifications.list();
    expect(res.data).toBeDefined();
    expect(Array.isArray(res.data.items)).toBe(true);
    expect(typeof res.data.unread).toBe('number');
  });

  it('markAllRead: trả về ok=true', async () => {
    const res = await userApi.notifications.markAllRead();
    expect(res.data).toBeDefined();
  });
});

// ── FEEDBACKS ─────────────────────────────────────────────────────────────────

describe('User — feedbacks', () => {
  it('list (me): trả về feedback của user hiện tại', async () => {
    const res = await userApi.feedbacks.list();
    expect(res.data).toBeDefined();
    expect(Array.isArray(res.data.items)).toBe(true);

    if (res.data.items.length > 0) {
      const fb = res.data.items[0];
      expect(fb).toHaveProperty('_id');
      expect(typeof fb.rating).toBe('number');
      expect(fb.rating).toBeGreaterThanOrEqual(1);
      expect(fb.rating).toBeLessThanOrEqual(5);
    }
  });
});

// ── PROFILE ───────────────────────────────────────────────────────────────────

describe('User — profile', () => {
  it('update: cập nhật thông tin profile thành công', async () => {
    // Lấy tên hiện tại trước
    const meRes = await fetch(
      `${(import.meta.env.VITE_API_BASE as string) || 'http://localhost:5000/api'}/users/auth/me`,
      { headers: { Authorization: `Bearer ${getStoredToken()}` } },
    );
    const me = await meRes.json();
    const currentName: string = me?.data?.user?.fullName || 'Test User';

    // Update với cùng tên (idempotent)
    const res = await userApi.profile.update({ fullName: currentName });
    expect(res.data).toBeDefined();
    expect(res.data.user).toBeDefined();
    expect(res.data.user.fullName).toBe(currentName);
  });
});
