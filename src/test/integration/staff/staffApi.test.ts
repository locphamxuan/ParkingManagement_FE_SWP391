/**
 * Integration tests — Staff role
 * Gọi BE thật. Yêu cầu: BE đang chạy + credentials trong .env.test.local
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import type { TestContext } from 'vitest';
import { staffApi, extractBuildings, extractSessions, extractShifts, extractIncidents, type StaffIncident } from '@/services/staff/staffApi';
import { loginAsStaff, clearToken } from '../helpers/auth';

// Building ID lấy động từ BE thay vì hardcode trong env (tránh invalid ID)
let resolvedBuildingId: string | null = null;
let isReady = false;

beforeAll(async () => {
  try {
    await loginAsStaff();
    isReady = true;

    // Lấy building ID đầu tiên được phân công cho staff
    const res = await staffApi.buildings();
    const buildings = extractBuildings(res.data);
    resolvedBuildingId = buildings[0]?._id ?? null;
  } catch (err) {
    console.warn(`[SKIP] staff tests: ${err instanceof Error ? err.message : String(err)}`);
  }
});

afterAll(() => {
  clearToken();
});

beforeEach((ctx: TestContext) => {
  if (!isReady) ctx.skip();
});

// ── DASHBOARD ─────────────────────────────────────────────────────────────────

describe('Staff — dashboard', () => {
  it('trả về tổng quan hợp lệ (user + summary + buildings)', async () => {
    const res = await staffApi.dashboard();
    expect(res.data).toBeDefined();

    // BE trả về { user: {...}, summary: {...}, buildings: [...] }
    // Dashboard interface có shape cứng → phải cast qua unknown để TypeScript không complain
    const d = res.data as unknown as Record<string, unknown>;
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
    // extractShifts nhận Wrap<...> (toàn bộ response), không phải chỉ res.data
    const shifts = extractShifts(res);
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
    // `building` là bắt buộc — thiếu là BE trả 400 BUILDING_REQUIRED.
    if (!resolvedBuildingId) return;

    const res = await staffApi.lookupPlate('99Z-999.99', resolvedBuildingId);
    expect(res.data).toBeDefined();
    expect(res.data).toHaveProperty('plateNumber');
    expect(typeof res.data.hasAccount).toBe('boolean');
  });
});

// ── INCIDENTS ─────────────────────────────────────────────────────────────────

describe('Staff — incidents.list', () => {
  it('trả về danh sách sự cố (có thể rỗng)', async () => {
    const res = await staffApi.incidents.list(resolvedBuildingId ?? undefined);
    // cast qua unknown vì BE có thể trả về array hoặc { items: [...] }
    const incidents = extractIncidents(
      res.data as unknown as StaffIncident[] | { items: StaffIncident[] },
    );
    expect(Array.isArray(incidents)).toBe(true);
  });
});

// ── SESSIONS NAMESPACE ────────────────────────────────────────────────────────

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
