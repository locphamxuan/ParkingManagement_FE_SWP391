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

export interface BuildingSubscriptionStatus {
  active: boolean;
  endDate: string | null;
  startDate: string | null;
  daysRemaining: number;
  package: { _id: string; name: string; price: number; durationDays: number } | null;
  packageName: string | null;
}

export interface BuildingMembers {
  manager: AdminUser | null;
  staff: AdminUser[];
  subscription?: BuildingSubscriptionStatus;
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

export interface AdminSubscriptionPackage {
  _id: string;
  name: string;
  price: number;
  durationDays: number;
  description?: string;
  features?: string[];
  isActive: boolean;
  createdAt?: string;
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

export interface SubscriptionTransfer {
  _id: string;
  building: { _id: string; name: string; code: string } | null;
  performedBy?: { _id: string; fullName: string; email: string } | null;
  type: string;
  reason: string;
  amount: number;
  balanceAfter: number;
  createdAt: string;
}

export interface SubscriptionTransferReport {
  items: SubscriptionTransfer[];
  total: number;
  grandTotal: number;
  page: number;
  limit: number;
}

export interface SystemWallet {
  _id: string;
  balance: number;
  totalDistributed: number;
  updatedAt: string;
}

export interface WalletDistribution {
  _id: string;
  building: { _id: string; name: string; code: string };
  amount: number;
  periodStart?: string;
  periodEnd?: string;
  note?: string;
  createdAt: string;
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
    /** Grant/extend a building's admin subscription, no wallet charge. */
    grantSubscription: (buildingId: string, packageId: string) =>
      api.post<Wrap<{ subscription: unknown }>>(
        `/admin/buildings/${buildingId}/subscription/grant`,
        { packageId }
      ),
    /** Immediately revoke a building's subscription (locks its dashboard). */
    revokeSubscription: (buildingId: string) =>
      api.post<Wrap<{ subscription: unknown }>>(
        `/admin/buildings/${buildingId}/subscription/revoke`,
        {}
      ),
    /** Read-only: a building's price policies. */
    listPricePolicies: (buildingId: string, q?: Record<string, string | undefined>) =>
      api.get<Wrap<{ items: AdminPricePolicy[] }>>(
        `/admin/buildings/${buildingId}/price-policies`,
        { query: q }
      ),
    /** Read-only: a building's long-term packages. */
    listPackages: (buildingId: string) =>
      api.get<Wrap<{ items: unknown[] }>>(`/admin/buildings/${buildingId}/packages`),
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

  wallet: {
    get: () => api.get<Wrap<{ wallet: SystemWallet }>>('/admin/wallet'),
    /** Manually top up the system wallet (POST /admin/wallet/topup). */
    topup: (amount: number) =>
      api.post<Wrap<{ wallet: SystemWallet }>>('/admin/wallet/topup', { amount }),
    /** Distribute revenue from the system wallet to a building (POST /admin/wallet/distribute). */
    distribute: (body: {
      buildingId: string;
      amount: number;
      periodStart: string;
      periodEnd: string;
      note?: string;
    }) =>
      api.post<Wrap<{ wallet: SystemWallet; distribution: WalletDistribution }>>(
        '/admin/wallet/distribute',
        body
      ),
    distributions: (q?: Record<string, string | undefined>) =>
      api.get<Wrap<ListResult<WalletDistribution>>>('/admin/wallet/distributions', { query: q }),
  },

  /** Revenue reports (shift-revenue aggregation + subscription transfers). */
  revenue: {
    /** GET /admin/revenue?from=&to=&buildingId= */
    report: (q: { from: string; to: string; buildingId?: string }) =>
      api.get<Wrap<RevenueReport>>('/admin/revenue', { query: q }),
    /** GET /admin/revenue/subscriptions?from=&to=&buildingId= */
    subscriptions: (q?: { from?: string; to?: string; buildingId?: string }) =>
      api.get<Wrap<SubscriptionTransferReport>>('/admin/revenue/subscriptions', { query: q }),
  },

  /** Read-only price policies across buildings (managers own pricing). */
  pricePolicies: {
    list: (q?: Record<string, string | undefined>) =>
      api.get<Wrap<{ items: AdminPricePolicy[] }>>('/admin/price-policies', { query: q }),
  },

  /** Admin subscription packages (the plans managers buy) — full CRUD. */
  subscriptionPackages: {
    list: (q?: Record<string, string | undefined>) =>
      api.get<Wrap<{ items: AdminSubscriptionPackage[] }>>('/admin/subscription-packages', { query: q }),
    get: (id: string) =>
      api.get<Wrap<AdminSubscriptionPackage>>(`/admin/subscription-packages/${id}`),
    create: (body: {
      name: string;
      price: number;
      durationDays: number;
      description?: string;
      features?: string[];
      isActive?: boolean;
    }) => api.post<Wrap<AdminSubscriptionPackage>>('/admin/subscription-packages', body),
    update: (id: string, body: Partial<AdminSubscriptionPackage>) =>
      api.put<Wrap<AdminSubscriptionPackage>>(`/admin/subscription-packages/${id}`, body),
    remove: (id: string) => api.delete(`/admin/subscription-packages/${id}`),
  },
};
