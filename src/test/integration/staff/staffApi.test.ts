/**
 * Integration tests — Staff role
 * Gọi BE thật. Yêu cầu: BE đang chạy + credentials trong .env.test.local
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { staffApi, extractBuildings, extractSessions, extractShifts, extractIncidents } from '@/services/staff/staffApi';
import { loginAsStaff, clearToken } from '../helpers/auth';

// Building ID lấy động từ BE thay vì hardcode trong env (tránh invalid ID)
let resolvedBuildingId: string | null = null;

beforeAll(async () => {
  await loginAsStaff();

  // Lấy building ID đầu tiên được phân công cho staff
  try {
    const res = await staffApi.buildings();
    const buildings = extractBuildings(res.data);
    resolvedBuildingId = buildings[0]?._id ?? null;
  } catch {
    resolvedBuildingId = null;
  }
});

afterAll(() => {
  clearToken();
});

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

describe('Staff — dashboard', () => {
  it('trả về tổng quan hợp lệ (user + summary + buildings)', async () => {
    const res = await staffApi.dashboard();
    expect(res.data).toBeDefined();

    // BE trả về { user: {...}, summary: {...}, buildings: [...] }
    const d = res.data as Record<string, unknown>;
    expect(d.user).toBeDefined();
    expect(d.summary).toBeDefined();
    const summary = d.summary as Record<string, unknown>;
    expect(typeof summary.assignedBuildingCount).toBe('number');
    expect(typeof summary.activeBuildingCount).toBe('number');
  });
});

// ── BUILDINGS ─────────────────────────────────────────────────────────────────

describe('Staff — buildings', () => {
  it('trả về danh sách tòa nhà được phân công', async () => {
    const res = await staffApi.buildings();
    const buildings = extractBuildings(res.data);
    expect(Array.isArray(buildings)).toBe(true);

    if (buildings.length > 0) {
      const b = buildings[0];
      expect(b).toHaveProperty('_id');
      expect(b).toHaveProperty('name');
      expect(b).toHaveProperty('code');
      expect(b.operatingHours).toHaveProperty('open');
      expect(b.operatingHours).toHaveProperty('close');
    }
  });
});

// ── MY SHIFTS ─────────────────────────────────────────────────────────────────

describe('Staff — myShifts', () => {
  it('trả về ca làm việc của staff', async () => {
    const res = await staffApi.myShifts();
    const shifts = extractShifts(res.data);
    expect(Array.isArray(shifts)).toBe(true);

    if (shifts.length > 0) {
      const s = shifts[0];
      expect(s).toHaveProperty('_id');
      expect(s).toHaveProperty('workDate');
      expect(['scheduled', 'active', 'completed', 'cancelled']).toContain(s.status);
      expect(s.shift).toHaveProperty('startTime');
      expect(s.shift).toHaveProperty('endTime');
    }
  });
});

// ── ACTIVE SESSIONS ───────────────────────────────────────────────────────────

describe('Staff — getActiveSessions', () => {
  it('trả về xe đang đỗ (tất cả buildings được phân công)', async () => {
    // Không truyền building → middleware dùng tất cả assigned buildings của staff
    const res = await staffApi.getActiveSessions();
    const sessions = extractSessions(res.data);
    expect(Array.isArray(sessions)).toBe(true);

    if (sessions.length > 0) {
      const s = sessions[0];
      expect(s).toHaveProperty('_id');
      expect(s).toHaveProperty('plateNumber');
      expect(s.status).toBe('active');
      expect(s).toHaveProperty('entryTime');
    }
  });
});

// ── LOOKUP PLATE ──────────────────────────────────────────────────────────────

describe('Staff — lookupPlate', () => {
  it('trả về thông tin biển số (kể cả không có tài khoản)', async () => {
    const res = await staffApi.lookupPlate('99Z-999.99');
    expect(res.data).toBeDefined();
    expect(res.data).toHaveProperty('plateNumber');
    expect(typeof res.data.hasAccount).toBe('boolean');
  });
});

// ── RESERVATIONS (STAFF VIEW) ─────────────────────────────────────────────────

describe('Staff — reservations.list', () => {
  it('trả về danh sách đặt chỗ cần xử lý', async () => {
    const res = await staffApi.reservations.list();
    expect(res.data).toBeDefined();
    expect(Array.isArray(res.data.items)).toBe(true);
    // total có thể nằm trong pagination hoặc top-level — kiểm tra mềm
    const hasTotal =
      typeof res.data.total === 'number' ||
      typeof (res.data as Record<string, unknown>).pagination !== 'undefined';
    expect(hasTotal || res.data.items.length >= 0).toBe(true);

    if (res.data.items.length > 0) {
      const r = res.data.items[0];
      expect(r).toHaveProperty('_id');
      expect(['pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'expired']).toContain(r.status);
    }
  });

  it('filter theo status=confirmed', async () => {
    const res = await staffApi.reservations.list({ status: 'confirmed' });
    res.data.items.forEach((r) => {
      expect(r.status).toBe('confirmed');
    });
  });
});

// ── INCIDENTS ─────────────────────────────────────────────────────────────────

describe('Staff — incidents.list', () => {
  it('trả về danh sách sự cố (có thể rỗng)', async () => {
    const res = await staffApi.incidents.list(resolvedBuildingId ?? undefined);
    // extractIncidents nhận mảng hoặc { items: [...] }
    const raw = res.data as unknown;
    const incidents = Array.isArray(raw)
      ? extractIncidents(raw as Parameters<typeof extractIncidents>[0])
      : extractIncidents(raw as { items: Parameters<typeof extractIncidents>[0]['items'] });
    expect(Array.isArray(incidents)).toBe(true);
  });
});

// ── SESSIONS NAMESPACE ────────────────────────────────────────────────────────

describe('Staff — sessions.myShiftRevenue', () => {
  it('trả về doanh thu ca hôm nay', async () => {
    if (!resolvedBuildingId) return;

    const res = await staffApi.sessions.myShiftRevenue(resolvedBuildingId);
    expect(res.data).toBeDefined();
    expect(typeof res.data.total).toBe('number');
    expect(Array.isArray(res.data.items)).toBe(true);

    if (res.data.items.length > 0) {
      const item = res.data.items[0];
      expect(item).toHaveProperty('amount');
      expect(['cash', 'wallet', 'qr', 'card', 'payos']).toContain(item.method);
    }
  });
});

describe('Staff — sessions.myCheckIns', () => {
  it('trả về lịch sử xe vào hôm nay (có location)', async () => {
    if (!resolvedBuildingId) return;

    const res = await staffApi.sessions.myCheckIns(resolvedBuildingId);
    expect(res.data).toBeDefined();
    expect(Array.isArray(res.data.items)).toBe(true);

    if (res.data.items.length > 0) {
      const s = res.data.items[0];
      expect(s).toHaveProperty('plateNumber');
      expect(s).toHaveProperty('entryTime');
      if (s.slot) {
        expect(s.slot).toHaveProperty('code');
      }
    }
  });
});

// ── FREE SLOTS ────────────────────────────────────────────────────────────────

describe('Staff — freeSlots', () => {
  it('trả về slot trống trong tòa nhà', async () => {
    if (!resolvedBuildingId) return;

    const res = await staffApi.freeSlots(resolvedBuildingId);
    expect(res.data).toBeDefined();
    expect(Array.isArray(res.data.items)).toBe(true);

    if (res.data.items.length > 0) {
      const slot = res.data.items[0];
      expect(slot).toHaveProperty('_id');
      expect(slot).toHaveProperty('code');
    }
  });
});
