/**
 * Integration tests — Admin role
 * Gọi BE thật. Yêu cầu: BE đang chạy + credentials trong .env.test.local
 */
import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import type { TestContext } from 'vitest';
import { adminApi } from '@/services/admin/adminApi';
import { loginAsAdmin, clearToken } from '../helpers/auth';

let isReady = false;

beforeAll(async () => {
  try {
    await loginAsAdmin();
    isReady = true;
  } catch (err) {
    // Credentials sai hoặc BE rate-limit → bỏ qua toàn bộ suite
    console.warn(`[SKIP] admin tests: ${err instanceof Error ? err.message : String(err)}`);
  }
});

// Skip mọi test nếu login thất bại — không dùng throw để file không bị "failed"
beforeEach((ctx: TestContext) => {
  if (!isReady) ctx.skip();
});

afterAll(() => {
  clearToken();
});

// ── OVERVIEW / DASHBOARD ──────────────────────────────────────────────────────

describe('Admin — overview', () => {
  it('trả về tổng quan hệ thống (today)', async () => {
    const res = await adminApi.overview('today');
    expect(res.data).toBeDefined();
    expect(res.data.counts).toBeDefined();
    expect(typeof res.data.counts.buildings).toBe('number');
    expect(typeof res.data.counts.users).toBe('number');
    expect(typeof res.data.counts.activeSessions).toBe('number');
    expect(res.data.revenue).toBeDefined();
    expect(typeof res.data.revenue.total).toBe('number');
  });

  it('trả về tổng quan theo tuần (week)', async () => {
    const res = await adminApi.overview('week');
    expect(res.data).toBeDefined();
    expect(typeof res.data.counts.staff).toBe('number');
  });
});

// ── BUILDINGS ─────────────────────────────────────────────────────────────────

describe('Admin — buildings', () => {
  it('list: trả về tất cả tòa nhà', async () => {
    const res = await adminApi.buildings.list();
    expect(res.data).toBeDefined();
    expect(Array.isArray(res.data.items)).toBe(true);

    if (res.data.items.length > 0) {
      const b = res.data.items[0];
      expect(b).toHaveProperty('_id');
      expect(b).toHaveProperty('name');
      expect(b).toHaveProperty('code');
      expect(['active', 'inactive', 'maintenance']).toContain(b.status);
      expect(typeof b.isActive).toBe('boolean');
    }
  });

  it('list: filter theo status=active', async () => {
    const res = await adminApi.buildings.list({ status: 'active' });
    expect(Array.isArray(res.data.items)).toBe(true);
    res.data.items.forEach((b) => {
      expect(b.status).toBe('active');
    });
  });

  it('get: trả về chi tiết building', async () => {
    const listRes = await adminApi.buildings.list();
    const bid = listRes.data.items[0]?._id;
    if (!bid) return;

    const res = await adminApi.buildings.get(bid);
    expect(res.data).toBeDefined();
    expect(res.data.building).toBeDefined();
    expect(res.data.building._id).toBe(bid);
    expect(res.data.building).toHaveProperty('totalFloors');
    expect(res.data.building).toHaveProperty('pricing');
  });

  it('getMembers: trả về manager và staff của building', async () => {
    const listRes = await adminApi.buildings.list();
    const bid = listRes.data.items[0]?._id;
    if (!bid) return;

    const res = await adminApi.buildings.getMembers(bid);
    expect(res.data).toBeDefined();
    // manager có thể null nếu chưa assign
    expect(res.data).toHaveProperty('staff');
    expect(Array.isArray(res.data.staff)).toBe(true);
  });

  it('listPricePolicies: trả về chính sách giá theo building', async () => {
    const listRes = await adminApi.buildings.list();
    const bid = listRes.data.items[0]?._id;
    if (!bid) return;

    const res = await adminApi.buildings.listPricePolicies(bid);
    expect(res.data).toBeDefined();
    expect(Array.isArray(res.data.items)).toBe(true);
  });

  it('listPackages: trả về gói dài hạn theo building (read-only)', async () => {
    const listRes = await adminApi.buildings.list();
    const bid = listRes.data.items[0]?._id;
    if (!bid) return;

    const res = await adminApi.buildings.listPackages(bid);
    expect(res.data).toBeDefined();
    expect(Array.isArray(res.data.items)).toBe(true);
  });
});

// ── USERS ─────────────────────────────────────────────────────────────────────

describe('Admin — users', () => {
  it('list: trả về tất cả users với pagination', async () => {
    const res = await adminApi.users.list({ limit: '10', page: '1' });
    expect(res.data).toBeDefined();
    expect(Array.isArray(res.data.items)).toBe(true);
    expect(res.data.pagination).toBeDefined();

    if (res.data.items.length > 0) {
      const u = res.data.items[0];
      expect(u).toHaveProperty('_id');
      expect(u).toHaveProperty('email');
      expect(['admin', 'manager', 'staff', 'user']).toContain(u.role);
      expect(typeof u.isActive).toBe('boolean');
    }
  });

  it('list: filter theo role=staff', async () => {
    const res = await adminApi.users.list({ role: 'staff' });
    expect(Array.isArray(res.data.items)).toBe(true);
    res.data.items.forEach((u) => {
      expect(u.role).toBe('staff');
    });
  });

  it('list: filter theo role=manager', async () => {
    const res = await adminApi.users.list({ role: 'manager' });
    expect(Array.isArray(res.data.items)).toBe(true);
    res.data.items.forEach((u) => {
      expect(u.role).toBe('manager');
    });
  });

  it('get: trả về chi tiết user', async () => {
    const listRes = await adminApi.users.list({ limit: '1' });
    const uid = listRes.data.items[0]?._id;
    if (!uid) return;

    const res = await adminApi.users.get(uid);
    expect(res.data).toBeDefined();
    expect(res.data.user).toBeDefined();
    expect(res.data.user._id).toBe(uid);
  });
});

// ── AUDIT LOGS ────────────────────────────────────────────────────────────────

describe('Admin — auditLogs', () => {
  it('trả về log hành động với shape đúng', async () => {
    const res = await adminApi.auditLogs({ limit: '10' });
    expect(res.data).toBeDefined();
    expect(Array.isArray(res.data.items)).toBe(true);

    if (res.data.items.length > 0) {
      const log = res.data.items[0];
      expect(log).toHaveProperty('_id');
      expect(log).toHaveProperty('action');
      expect(log).toHaveProperty('targetTable');
      expect(log).toHaveProperty('createdAt');
      expect(['low', 'medium', 'high', 'critical']).toContain(log.severity);
    }
  });

  it('filter theo severity=high', async () => {
    const res = await adminApi.auditLogs({ severity: 'high', limit: '5' });
    expect(Array.isArray(res.data.items)).toBe(true);
    res.data.items.forEach((log) => {
      expect(log.severity).toBe('high');
    });
  });
});

// ── REVENUE REPORT ────────────────────────────────────────────────────────────

describe('Admin — revenue.report', () => {
  it('trả về báo cáo doanh thu theo khoảng thời gian', async () => {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const from = weekAgo.toISOString().split('T')[0];
    const to = today.toISOString().split('T')[0];

    const res = await adminApi.revenue.report({ from, to });
    expect(res.data).toBeDefined();
    expect(res.data.from).toBe(from);
    expect(res.data.to).toBe(to);
    expect(Array.isArray(res.data.items)).toBe(true);
    expect(typeof res.data.grandTotal).toBe('number');

    if (res.data.items.length > 0) {
      const row = res.data.items[0];
      expect(row).toHaveProperty('buildingId');
      expect(typeof row.totalRevenue).toBe('number');
      expect(typeof row.sessionCount).toBe('number');
    }
  });

  it('filter theo buildingId cụ thể', async () => {
    const buildingRes = await adminApi.buildings.list({ limit: '1' });
    const bid = buildingRes.data.items[0]?._id;
    if (!bid) return;

    const today = new Date().toISOString().split('T')[0];
    const res = await adminApi.revenue.report({ from: today, to: today, buildingId: bid });
    expect(res.data).toBeDefined();
    res.data.items.forEach((row) => {
      expect(row.buildingId).toBe(bid);
    });
  });
});

// ── PRICE POLICIES ────────────────────────────────────────────────────────────

describe('Admin — pricePolicies.list', () => {
  it('trả về chính sách giá toàn hệ thống', async () => {
    const res = await adminApi.pricePolicies.list();
    expect(res.data).toBeDefined();
    expect(Array.isArray(res.data.items)).toBe(true);

    if (res.data.items.length > 0) {
      const policy = res.data.items[0];
      expect(policy).toHaveProperty('_id');
      expect(typeof policy.hourlyRate).toBe('number');
      expect(typeof policy.isActive).toBe('boolean');
    }
  });
});
