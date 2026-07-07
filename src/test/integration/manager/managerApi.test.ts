/**
 * Integration tests — Manager role
 * Gọi BE thật. Yêu cầu: BE đang chạy + credentials trong .env.test.local
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { TestContext } from 'vitest';
import { managerApi, unwrapItems, type ManagerBuilding } from '@/services/manager/managerApi';
import { loginAsManager, clearToken, TEST_BUILDING_ID } from '../helpers/auth';

let isReady = false;

beforeAll(async () => {
  try {
    await loginAsManager();
    isReady = true;
  } catch (err) {
    console.warn(`[SKIP] manager tests: ${err instanceof Error ? err.message : String(err)}`);
  }
});

afterAll(() => {
  clearToken();
});

beforeEach((ctx: TestContext) => {
  if (!isReady) ctx.skip();
});

// Helper: lấy buildingId thật từ BE nếu không cấu hình sẵn
let buildingId = TEST_BUILDING_ID;

async function resolveBuilding(): Promise<string | null> {
  if (buildingId) return buildingId;
  const res = await managerApi.listAssignedBuildings();
  const items = Array.isArray(res.data) ? res.data : ((res.data as unknown as { items?: ManagerBuilding[] }).items ?? []);
  const first = Array.isArray(items) ? items[0] : null;
  if (first) buildingId = first._id;
  return buildingId || null;
}

// ── ASSIGNED BUILDINGS ────────────────────────────────────────────────────────

describe('Manager — listAssignedBuildings', () => {
  it('trả về tòa nhà được quản lý', async () => {
    const res = await managerApi.listAssignedBuildings();
    expect(res.data).toBeDefined();

    const items = Array.isArray(res.data)
      ? res.data
      : (res.data as { items?: unknown[] }).items ?? [];
    expect(Array.isArray(items)).toBe(true);

    if (items.length > 0) {
      const b = items[0] as Record<string, unknown>;
      expect(b).toHaveProperty('_id');
      expect(b).toHaveProperty('name');
    }
  });
});

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

describe('Manager — getDashboard', () => {
  it('trả về tổng quan building (slots, revenue, sessions)', async () => {
    const bid = await resolveBuilding();
    if (!bid) return;

    const res = await managerApi.getDashboard(bid);
    expect(res.data).toBeDefined();
    expect(res.data.slots).toBeDefined();
    expect(typeof res.data.slots.total).toBe('number');
    expect(typeof res.data.slots.occupancyRate).toBe('number');
    expect(res.data.revenue).toBeDefined();
    expect(typeof res.data.revenue.today).toBe('number');
  });
});

// ── VEHICLE TYPES ─────────────────────────────────────────────────────────────

describe('Manager — vehicleTypes', () => {
  it('list: trả về loại xe của building', async () => {
    const bid = await resolveBuilding();
    if (!bid) return;

    const res = await managerApi.vehicleTypes.list(bid);
    const items = unwrapItems(res);
    expect(Array.isArray(items)).toBe(true);

    if (items.length > 0) {
      expect(items[0]).toHaveProperty('_id');
      expect(items[0]).toHaveProperty('code');
      expect(typeof items[0].isActive).toBe('boolean');
    }
  });
});

// ── FLOORS ────────────────────────────────────────────────────────────────────

describe('Manager — floors', () => {
  it('list: trả về danh sách tầng', async () => {
    const bid = await resolveBuilding();
    if (!bid) return;

    const res = await managerApi.floors.list(bid);
    const items = unwrapItems(res);
    expect(Array.isArray(items)).toBe(true);

    if (items.length > 0) {
      const floor = items[0];
      expect(floor).toHaveProperty('_id');
      expect(floor).toHaveProperty('code');
      expect(typeof floor.capacity).toBe('number');
      expect(['active', 'inactive', 'maintenance']).toContain(floor.status);
    }
  });
});

// ── GATES ─────────────────────────────────────────────────────────────────────

describe('Manager — gates', () => {
  it('list: trả về danh sách cổng với direction', async () => {
    const bid = await resolveBuilding();
    if (!bid) return;

    const res = await managerApi.gates.list(bid);
    const items = unwrapItems(res);
    expect(Array.isArray(items)).toBe(true);

    if (items.length > 0) {
      const gate = items[0];
      expect(gate).toHaveProperty('_id');
      expect(gate).toHaveProperty('code');
      expect(['in', 'out', 'both']).toContain(gate.direction);
    }
  });
});

// ── ZONES ─────────────────────────────────────────────────────────────────────

describe('Manager — zones', () => {
  it('list: trả về danh sách khu vực đỗ xe', async () => {
    const bid = await resolveBuilding();
    if (!bid) return;

    const res = await managerApi.zones.list(bid);
    const items = unwrapItems(res);
    expect(Array.isArray(items)).toBe(true);

    if (items.length > 0) {
      const zone = items[0];
      expect(zone).toHaveProperty('_id');
      expect(zone).toHaveProperty('capacity');
      expect(['walk_in', 'registered', 'subscriber', 'reserved']).toContain(zone.usageType);
    }
  });
});

// ── SLOTS ─────────────────────────────────────────────────────────────────────

describe('Manager — slots', () => {
  it('list: trả về ô đỗ xe với status', async () => {
    const bid = await resolveBuilding();
    if (!bid) return;

    const res = await managerApi.slots.list(bid);
    const items = unwrapItems(res);
    expect(Array.isArray(items)).toBe(true);

    if (items.length > 0) {
      const slot = items[0];
      expect(slot).toHaveProperty('_id');
      expect(slot).toHaveProperty('code');
      expect(['available', 'occupied', 'reserved', 'maintenance']).toContain(slot.status);
      expect(typeof slot.reservable).toBe('boolean');
    }
  });
});

// ── PRICE POLICIES ────────────────────────────────────────────────────────────

describe('Manager — pricePolicies', () => {
  it('list: trả về chính sách giá của building', async () => {
    const bid = await resolveBuilding();
    if (!bid) return;

    const res = await managerApi.pricePolicies.list(bid);
    const items = unwrapItems(res);
    expect(Array.isArray(items)).toBe(true);

    if (items.length > 0) {
      const policy = items[0];
      expect(policy).toHaveProperty('_id');
      expect(typeof policy.hourlyRate).toBe('number');
      expect(['regular', 'peak']).toContain(policy.type);
    }
  });
});

// ── PACKAGES ─────────────────────────────────────────────────────────────────

describe('Manager — packages', () => {
  it('list: trả về gói dài hạn của building', async () => {
    const bid = await resolveBuilding();
    if (!bid) return;

    const res = await managerApi.packages.list(bid);
    const items = unwrapItems(res);
    expect(Array.isArray(items)).toBe(true);

    if (items.length > 0) {
      const pkg = items[0];
      expect(pkg).toHaveProperty('_id');
      expect(pkg).toHaveProperty('name');
      expect(typeof pkg.price).toBe('number');
      expect(typeof pkg.durationDays).toBe('number');
    }
  });

  it('subscriptions: trả về danh sách đăng ký gói', async () => {
    const bid = await resolveBuilding();
    if (!bid) return;

    const res = await managerApi.packages.subscriptions(bid);
    expect(res.data).toBeDefined();
    expect(Array.isArray(res.data.items)).toBe(true);

    if (res.data.items.length > 0) {
      const sub = res.data.items[0];
      expect(sub).toHaveProperty('_id');
      expect(sub).toHaveProperty('plateNumber');
      expect(sub.user).toHaveProperty('email');
      expect(['pending', 'active', 'expired', 'cancelled']).toContain(sub.status);
    }
  });
});

// ── RESERVATION POLICY ────────────────────────────────────────────────────────

describe('Manager — reservationPolicy', () => {
  it('get: trả về chính sách đặt chỗ của building', async () => {
    const bid = await resolveBuilding();
    if (!bid) return;

    const res = await managerApi.reservationPolicy.get(bid);
    expect(res.data).toBeDefined();
    expect(res.data.item).toBeDefined();

    const policy = res.data.item;
    expect(typeof policy.maxHoldMinutes).toBe('number');
    expect(typeof policy.refundPercent).toBe('number');
    expect(typeof policy.depositPercent).toBe('number');
    expect(typeof policy.cancellationCutoffHours).toBe('number');
  });
});

// ── SHIFTS ────────────────────────────────────────────────────────────────────

describe('Manager — shifts', () => {
  it('list: trả về danh sách ca làm việc', async () => {
    const bid = await resolveBuilding();
    if (!bid) return;

    const res = await managerApi.shifts.list(bid);
    const items = unwrapItems(res);
    expect(Array.isArray(items)).toBe(true);

    if (items.length > 0) {
      const shift = items[0];
      expect(shift).toHaveProperty('_id');
      expect(shift).toHaveProperty('startTime');
      expect(shift).toHaveProperty('endTime');
    }
  });

  it('listStaff: trả về nhân viên của building', async () => {
    const bid = await resolveBuilding();
    if (!bid) return;

    const res = await managerApi.shifts.listStaff(bid);
    const items = unwrapItems(res);
    expect(Array.isArray(items)).toBe(true);

    if (items.length > 0) {
      expect(items[0]).toHaveProperty('_id');
      expect(items[0]).toHaveProperty('email');
      expect(items[0].role).toBe('staff');
    }
  });

  it('listStaffShifts: trả về lịch phân ca nhân viên', async () => {
    const bid = await resolveBuilding();
    if (!bid) return;

    const res = await managerApi.shifts.listStaffShifts(bid);
    const items = unwrapItems(res);
    expect(Array.isArray(items)).toBe(true);

    if (items.length > 0) {
      const ss = items[0];
      expect(ss).toHaveProperty('workDate');
      expect(['scheduled', 'active', 'completed', 'cancelled']).toContain(ss.status);
      expect(ss.staff).toHaveProperty('email');
    }
  });
});

// ── WALLET ────────────────────────────────────────────────────────────────────

describe('Manager — wallet', () => {
  it('get: trả về ví tòa nhà với balance', async () => {
    const bid = await resolveBuilding();
    if (!bid) return;

    const res = await managerApi.wallet.get(bid);
    expect(res.data).toBeDefined();
    expect(res.data.wallet).toBeDefined();
    expect(typeof res.data.wallet.balance).toBe('number');
  });

  it('getDailyRevenue: trả về doanh thu ngày hôm nay', async () => {
    const bid = await resolveBuilding();
    if (!bid) return;

    const today = new Date().toISOString().split('T')[0];
    const res = await managerApi.wallet.getDailyRevenue(bid, today);
    expect(res.data).toBeDefined();
    expect(typeof res.data.totalRevenue).toBe('number');
    // settled là optional — một số BE version không trả về field này
    if ('settled' in res.data) {
      expect(typeof res.data.settled).toBe('boolean');
    }
  });

  it('listTransactions: trả về lịch sử giao dịch ví tòa nhà', async () => {
    const bid = await resolveBuilding();
    if (!bid) return;

    const res = await managerApi.wallet.listTransactions(bid);
    const items = unwrapItems(res as Parameters<typeof unwrapItems>[0]);
    expect(Array.isArray(items)).toBe(true);
  });
});

// ── FEEDBACKS ─────────────────────────────────────────────────────────────────

describe('Manager — feedbacks', () => {
  it('list: trả về feedback của building', async () => {
    const bid = await resolveBuilding();
    if (!bid) return;

    const res = await managerApi.feedbacks.list(bid);
    expect(res.data).toBeDefined();
    expect(Array.isArray(res.data.items)).toBe(true);

    if (res.data.items.length > 0) {
      const fb = res.data.items[0];
      expect(fb).toHaveProperty('_id');
      expect(typeof fb.rating).toBe('number');
      expect(['pending', 'resolved']).toContain(fb.status);
    }
  });
});
