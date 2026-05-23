import { api } from '@/services/apiClient';

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
  counts: {
    buildings: number;
    managers: number;
    staff: number;
    users: number;
    activeSessions: number;
  };
  revenue: {
    today: number;
    byMethod: Record<string, { amount: number; count: number }>;
  };
}

interface ListResult<T> {
  items: T[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

interface Wrap<T> {
  data: T;
}

export const adminApi = {
  overview: () => api.get<Wrap<AdminOverview>>('/admin/dashboard'),

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
};
