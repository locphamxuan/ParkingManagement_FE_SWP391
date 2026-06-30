import { api, requestJson } from '@/services/client/apiClient';

export interface AdminBuilding {
  _id: string;
  name: string;
  code: string;
  totalFloors: number;
  status: 'active' | 'inactive' | 'maintenance';
  isActive: boolean;
  operatingHours: { open: string; close: string };
  pricing: { hourlyRate: number; dailyCap?: number | null; motorcycleMultiplier?: number };
  manager?: { _id: string; fullName: string; email: string } | string | null;
  address?: { fullAddress?: string };
  contactPhone?: string;
  createdAt?: string;
}

export interface AdminUser {
  _id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'manager' | 'staff' | 'user';
  phone?: string;
  isActive: boolean;
  lastLoginAt?: string | null;
  assignedBuildings?: string[];
  createdAt?: string;
}

export interface BuildingMembers {
  manager: AdminUser | null;
  staff: AdminUser[];
}

export interface AdminAuditLog {
  _id: string;
  actor: { _id: string; fullName: string; email: string; role: string } | null;
  action: string;
  targetTable: string;
  targetId?: string | null;
  severity: 'low' | 'medium' | 'high' | 'critical';
  building?: { _id: string; name: string; code: string } | null;
  description?: string;
  createdAt: string;
}

export interface AdminOverview {
  period?: 'today' | 'week' | 'month';
  counts: {
    buildings: number;
    managers: number;
    staff: number;
    users: number;
    activeSessions: number;
  };
  revenue: {
    /** Revenue over the selected period (backend field). */
    total: number;
    /** @deprecated legacy alias — backend now returns `total`. */
    today?: number;
    byMethod: Record<string, { amount: number; count: number }>;
  };
}

export interface AdminPricePolicy {
  _id: string;
  building: { _id: string; name: string; code: string } | string;
  vehicleType: { _id: string; code: string; name: string } | string;
  name: string;
  hourlyRate: number;
  dailyCap?: number | null;
  isActive: boolean;
  effectiveFrom: string;
  effectiveTo?: string | null;
}

/** Read-only view of a building's long-term (customer) package. */
export interface AdminBuildingPackage {
  _id: string;
  name: string;
  code: string;
  vehicleType?: { _id: string; code: string; name: string } | string | null;
  durationDays: number;
  price: number;
  isActive: boolean;
}

export interface RevenueReportRow {
  buildingId: string;
  buildingName?: string;
  buildingCode?: string;
  totalRevenue: number;
  sessionCount: number;
  cashAmount: number;
  walletAmount: number;
  qrAmount: number;
}

export interface RevenueReport {
  from: string;
  to: string;
  items: RevenueReportRow[];
  grandTotal: number;
}

interface ListResult<T> {
  items: T[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

interface Wrap<T> {
  data: T;
}

export const adminApi = {
  overview: (period?: 'today' | 'week' | 'month') =>
    api.get<Wrap<AdminOverview>>('/admin/dashboard', {
      query: period ? { period } : undefined,
    }),

  buildings: {
    list: (q?: Record<string, string | undefined>) =>
      api.get<Wrap<ListResult<AdminBuilding>>>('/admin/buildings', { query: q }),
    get: (id: string) =>
      api.get<Wrap<{ building: AdminBuilding }>>(`/admin/buildings/${id}`),
    create: (body: Partial<AdminBuilding>) =>
      api.post<Wrap<{ building: AdminBuilding }>>('/admin/buildings', body),
    update: (id: string, body: Partial<AdminBuilding>) =>
      api.put<Wrap<{ building: AdminBuilding }>>(`/admin/buildings/${id}`, body),
    updateStatus: (id: string, status: AdminBuilding['status']) =>
      api.patch<Wrap<{ building: AdminBuilding }>>(`/admin/buildings/${id}/status`, {
        status,
      }),
    remove: (id: string) => api.delete(`/admin/buildings/${id}`),
    assignManager: (buildingId: string, userId: string) =>
      api.post(`/admin/buildings/${buildingId}/assign-manager`, { userId }),
    revokeManager: (buildingId: string, userId: string) =>
      api.post(`/admin/buildings/${buildingId}/revoke-manager`, { userId }),
    assignStaff: (buildingId: string, userId: string) =>
      api.post(`/admin/buildings/${buildingId}/assign-staff`, { userId }),
    revokeStaff: (buildingId: string, userId: string) =>
      api.post(`/admin/buildings/${buildingId}/revoke-staff`, { userId }),
    getMembers: (buildingId: string) =>
      api.get<Wrap<BuildingMembers>>(`/admin/buildings/${buildingId}/members`),
    /** Read-only: a building's price policies. */
    listPricePolicies: (buildingId: string, q?: Record<string, string | undefined>) =>
      api.get<Wrap<{ items: AdminPricePolicy[] }>>(
        `/admin/buildings/${buildingId}/price-policies`,
        { query: q }
      ),
    /** Read-only: a building's long-term packages. */
    listPackages: (buildingId: string) =>
      api.get<Wrap<{ items: AdminBuildingPackage[] }>>(`/admin/buildings/${buildingId}/packages`),
  },

  users: {
    list: (q?: Record<string, string | undefined>) =>
      api.get<Wrap<ListResult<AdminUser>>>('/admin/users', { query: q }),
    get: (id: string) => api.get<Wrap<{ user: AdminUser }>>(`/admin/users/${id}`),
    create: (body: Partial<AdminUser> & { password: string }) =>
      api.post<Wrap<{ user: AdminUser }>>('/admin/users', body),
    update: (id: string, body: Partial<AdminUser>) =>
      api.put<Wrap<{ user: AdminUser }>>(`/admin/users/${id}`, body),
    updateStatus: (id: string, isActive: boolean) =>
      api.patch<Wrap<{ user: AdminUser }>>(`/admin/users/${id}/status`, { isActive }),
    remove: (id: string) => api.delete(`/admin/users/${id}`),
  },

  auditLogs: (q?: Record<string, string | undefined>) =>
    api.get<Wrap<ListResult<AdminAuditLog>>>('/admin/audit-logs', { query: q }),

  /** Revenue reports (shift-revenue aggregation). */
  revenue: {
    /** GET /admin/revenue?from=&to=&buildingId= */
    report: (q: { from: string; to: string; buildingId?: string }) =>
      api.get<Wrap<RevenueReport>>('/admin/revenue', { query: q }),
  },

  /** Read-only price policies across buildings (managers own pricing). */
  pricePolicies: {
    list: (q?: Record<string, string | undefined>) =>
      api.get<Wrap<{ items: AdminPricePolicy[] }>>('/admin/price-policies', { query: q }),
  },
};

// ─── CRUD helpers (legacy token-explicit pattern) ───────────────────────────

interface ApiEnvelope<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface CreateAdminUserInput {
  fullName: string;
  email: string;
  password: string;
  role: 'admin' | 'manager' | 'staff' | 'user';
  phone?: string;
  buildingId?: string;
}

export interface UpdateAdminUserInput {
  fullName?: string;
  role?: 'admin' | 'manager' | 'staff' | 'user';
  phone?: string;
}

export interface CreateBuildingInput {
  name: string;
  code: string;
  totalFloors: number;
  hourlyRate: number;
  fullAddress?: string;
}

export interface UpdateBuildingInput {
  name?: string;
  code?: string;
  totalFloors?: number;
  status?: 'active' | 'inactive' | 'maintenance';
  fullAddress?: string;
}

export async function createAdminUser(token: string, payload: CreateAdminUserInput): Promise<string> {
  const { buildingId, role, ...rest } = payload;
  const needsAssignment = role === 'staff' || role === 'manager';
  const res = await requestJson<ApiEnvelope<{ user: { _id: string } }>>({
    path: '/admin/users',
    method: 'POST',
    token,
    body: { ...rest, role },
  });
  const userId = res.data?.user?._id;
  if (userId && buildingId && needsAssignment) {
    const endpoint = role === 'staff' ? 'assign-staff' : 'assign-manager';
    await requestJson({
      path: `/admin/buildings/${buildingId}/${endpoint}`,
      method: 'POST',
      token,
      body: { userId },
    });
  }
  return userId ?? '';
}

export async function assignStaffToBuilding(token: string, buildingId: string, userId: string): Promise<void> {
  await requestJson({ path: `/admin/buildings/${buildingId}/assign-staff`, method: 'POST', token, body: { userId } });
}

export async function revokeStaffFromBuilding(token: string, buildingId: string, userId: string): Promise<void> {
  await requestJson({ path: `/admin/buildings/${buildingId}/revoke-staff`, method: 'POST', token, body: { userId } });
}

export async function revokeManagerFromBuilding(token: string, buildingId: string, userId: string): Promise<void> {
  await requestJson({ path: `/admin/buildings/${buildingId}/revoke-manager`, method: 'POST', token, body: { userId } });
}

export async function assignManagerToBuilding(token: string, buildingId: string, userId: string): Promise<void> {
  await requestJson({ path: `/admin/buildings/${buildingId}/assign-manager`, method: 'POST', token, body: { userId } });
}

export async function updateAdminUser(token: string, userId: string, payload: UpdateAdminUserInput): Promise<void> {
  await requestJson<ApiEnvelope<{ user: unknown }>>({ path: `/admin/users/${userId}`, method: 'PUT', token, body: payload });
}

export async function updateAdminUserStatus(token: string, userId: string, isActive: boolean): Promise<void> {
  await requestJson<ApiEnvelope<{ user: unknown }>>({ path: `/admin/users/${userId}/status`, method: 'PATCH', token, body: { isActive } });
}

export async function deleteAdminUser(token: string, userId: string): Promise<void> {
  await requestJson<ApiEnvelope<null>>({ path: `/admin/users/${userId}`, method: 'DELETE', token });
}

export async function createBuilding(token: string, payload: CreateBuildingInput): Promise<void> {
  await requestJson<ApiEnvelope<{ building: unknown }>>({
    path: '/admin/buildings',
    method: 'POST',
    token,
    body: {
      name: payload.name,
      code: payload.code,
      totalFloors: Number(payload.totalFloors),
      pricing: { hourlyRate: Number(payload.hourlyRate) },
      operatingHours: { open: '06:00', close: '22:00' },
      address: { fullAddress: payload.fullAddress || '' },
      status: 'active',
    },
  });
}

export async function updateBuilding(token: string, buildingId: string, payload: UpdateBuildingInput): Promise<void> {
  const body: Record<string, unknown> = {};
  if (payload.name !== undefined) body.name = payload.name;
  if (payload.code !== undefined) body.code = payload.code;
  if (payload.totalFloors !== undefined) body.totalFloors = Number(payload.totalFloors);
  if (payload.status !== undefined) body.status = payload.status;
  if (payload.fullAddress !== undefined) body.address = { fullAddress: payload.fullAddress };
  await requestJson<ApiEnvelope<{ building: unknown }>>({ path: `/admin/buildings/${buildingId}`, method: 'PUT', token, body });
}

export async function updateBuildingStatus(token: string, buildingId: string, status: 'active' | 'inactive' | 'maintenance'): Promise<void> {
  await requestJson<ApiEnvelope<{ building: unknown }>>({ path: `/admin/buildings/${buildingId}/status`, method: 'PATCH', token, body: { status } });
}

export async function deleteBuilding(token: string, buildingId: string): Promise<void> {
  await requestJson<ApiEnvelope<null>>({ path: `/admin/buildings/${buildingId}`, method: 'DELETE', token });
}
