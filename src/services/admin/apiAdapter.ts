import { api } from '@/services/client/apiClient';
import type { AdminDataset } from '@/services/admin/types';
import type {
  AuditLog,
  Building,
  MonitoringMetric,
  RevenuePoint,
  UserRecord,
} from '@/types';

interface ApiEnvelope<T> {
  data: T;
  message?: string;
  success: boolean;
}

interface AdminOverviewData {
  counts: {
    buildings: number;
    managers: number;
    staff: number;
    users: number;
    activeSessions: number;
  };
  revenue: {
    /** Revenue over the selected period (backend field). */
    total?: number;
    /** @deprecated legacy alias — backend now returns `total`. */
    today?: number;
    byMethod: Record<string, { amount: number; count: number }>;
    /** System-wide 7-day revenue trend (backend-aggregated). */
    weekly?: Array<{ date: string; revenue: number; sessions: number }>;
  };
  /** Per-building occupancy + today revenue (backend-aggregated, no N+1). */
  buildingStats?: Array<{ buildingId: string; occupancyRate: number; revenueToday: number }>;
}

interface Paginated<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ApiBuilding {
  _id: string;
  code?: string;
  name: string;
  address?: {
    fullAddress?: string;
  };
  totalFloors?: number;
  status?: 'active' | 'inactive' | 'maintenance';
  manager?: string | null | { fullName?: string; _id?: string };
}

interface ApiUser {
  _id: string;
  fullName: string;
  email: string;
  role: 'admin' | 'manager' | 'staff' | 'user';
  isActive?: boolean;
  walletBalance?: number;
  licensePlates?: Array<{ plateNumber?: string }>;
  phone?: string;
}

interface ApiAudit {
  _id: string;
  actor?: { email?: string; fullName?: string } | null;
  action: string;
  targetTable: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  building?: { name?: string; code?: string } | null;
  createdAt?: string;
}

const OPERATIONAL_GUARDRAILS = [
  'Online card codes must be linked to a verified user account and its associated license plate.',
  'Walk-in customers may only enter with a valid parking session and must pay before leaving the lot.',
  'Any change to pricing policy, account lockouts, or fee adjustments must be recorded in the audit log.',
];

const METHOD_LABELS: Record<string, string> = {
  wallet: 'App Wallet',
  qr: 'QR',
  cash: 'Cash',
  card: 'Bank Card',
};

const formatCompactCurrency = (amount: number): string =>
  `${(amount / 1_000_000).toFixed(1)}M VND`;

const formatChartDate = (dateValue: string): string => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return dateValue;
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};

const toBuilding = (
  item: ApiBuilding,
  managerNameById: Map<string, string>,
  stats?: { occupancyRate: number; revenueToday: number },
): Building => {
  // Handle manager field that can be a populated object, a string ID, or null
  let managerName = 'Unassigned';

  if (item.manager) {
    if (typeof item.manager === 'object' && 'fullName' in item.manager) {
      // Manager is a populated object with fullName
      managerName = item.manager.fullName || 'Unassigned';
    } else if (typeof item.manager === 'string') {
      // Manager is a string ID, look up in the map or show truncated ID
      managerName = managerNameById.get(item.manager) || `ID: ${item.manager.slice(0, 8)}`;
    }
  }

  return {
    id: item.code || item._id,
    backendId: item._id,
    name: item.name,
    address: item.address?.fullAddress || 'Address not updated',
    floors: item.totalFloors || 0,
    occupancyRate: Number(stats?.occupancyRate || 0),
    status: item.status || 'inactive',
    manager: managerName,
    revenueToday: Number(stats?.revenueToday ?? 0),
  };
};

const toUser = (item: ApiUser): UserRecord => {
  const backendPlates = (item.licensePlates || []).map((p) =>
    typeof p === 'string' ? p : p.plateNumber || ''
  ).filter(Boolean);

  return {
    id: item._id,
    name: item.fullName,
    email: item.email,
    role: item.role,
    status: item.isActive === false ? 'blocked' : 'active',
    walletBalance: item.walletBalance ?? 0,
    linkedPlates: backendPlates,
    phone: item.phone || '',
  };
};

const toAudit = (item: ApiAudit): AuditLog => ({
  id: item._id,
  actor: item.actor?.email || item.actor?.fullName || 'unknown',
  action: item.action,
  target: item.targetTable,
  severity: item.severity || 'low',
  timestamp: item.createdAt ? new Date(item.createdAt).toLocaleString('vi-VN') : '-',
  details: item.description || `${item.action} on ${item.targetTable}`,
  building: item.building
    ? [item.building.name, item.building.code ? `(${item.building.code})` : null]
        .filter(Boolean)
        .join(' ')
    : undefined,
});

export async function getApiAdminDataset(token: string): Promise<AdminDataset> {
  const [overviewRes, buildingsRes, usersRes, auditRes] = await Promise.all([
    api.get<ApiEnvelope<AdminOverviewData>>('/admin/dashboard', { token }),
    api.get<ApiEnvelope<Paginated<ApiBuilding>>>('/admin/buildings?limit=200', { token }),
    api.get<ApiEnvelope<Paginated<ApiUser>>>('/admin/users?limit=200', { token }),
    api.get<ApiEnvelope<Paginated<ApiAudit>>>('/admin/audit-logs?limit=200', { token }),
  ]);

  const buildingItems = buildingsRes.data.items || [];
  const userItems = usersRes.data.items || [];
  const auditItems = auditRes.data.items || [];

  const managerNameById = new Map(
    userItems
      .filter((user) => user.role === 'manager')
      .map((user) => [String(user._id), user.fullName]),
  );

  // Per-building occupancy + today revenue come pre-aggregated from the backend
  // (`buildingStats`) — no more one dashboard request per building (N+1 removed).
  const statsByBuilding = new Map(
    (overviewRes.data.buildingStats || []).map((s) => [String(s.buildingId), s]),
  );

  const buildings: Building[] = buildingItems.map((item) =>
    toBuilding(item, managerNameById, statsByBuilding.get(String(item._id))),
  );

  const users: UserRecord[] = userItems.map(toUser);
  const auditLogs: AuditLog[] = auditItems.map(toAudit);

  // System-wide 7-day revenue trend, also backend-aggregated.
  const avgOccupancy =
    buildings.length > 0
      ? buildings.reduce((sum, b) => sum + Number(b.occupancyRate || 0), 0) / buildings.length
      : 0;

  const revenueTrend: RevenuePoint[] = (overviewRes.data.revenue.weekly || [])
    .slice(-7)
    .map((point) => ({
      date: formatChartDate(point.date),
      revenue: Math.round(Number(point.revenue || 0)),
      occupancy: Math.round(avgOccupancy * 10) / 10,
      sessions: Number(point.sessions || 0),
    }));

  const paymentMethodDistribution = Object.entries(overviewRes.data.revenue.byMethod || {}).map(
    ([method, summary]) => ({
      name: METHOD_LABELS[method] || method,
      value: Number(summary.amount || 0),
    }),
  );

  const dashboardStats = [
    {
      key: 'buildings',
      label: 'Total Buildings',
      value: String(overviewRes.data.counts.buildings),
      delta: `${buildings.filter((b) => b.status === 'active').length} active`,
    },
    {
      key: 'sessions',
      label: 'Active Parking Sessions',
      value: overviewRes.data.counts.activeSessions.toLocaleString('vi-VN'),
      delta: `${overviewRes.data.counts.staff} operations staff`,
    },
    {
      key: 'revenue',
      label: 'Revenue Today',
      value: formatCompactCurrency(overviewRes.data.revenue.total ?? overviewRes.data.revenue.today ?? 0),
      delta: `${paymentMethodDistribution.length} payment methods`,
    },
    {
      key: 'users',
      label: 'System-wide Users',
      value: overviewRes.data.counts.users.toLocaleString('vi-VN'),
      delta: `${overviewRes.data.counts.managers} managers / ${overviewRes.data.counts.staff} staff`,
    },
  ];

  const monitoringMetrics: MonitoringMetric[] = [
    {
      id: 'active-buildings',
      label: 'Active Buildings',
      value: `${buildings.filter((b) => b.status === 'active').length}/${buildings.length}`,
      trend: 'Based on current status',
      status: buildings.some((b) => b.status === 'maintenance') ? 'warning' : 'ok',
    },
    {
      id: 'active-sessions',
      label: 'Active Sessions',
      value: overviewRes.data.counts.activeSessions.toLocaleString('vi-VN'),
      trend: 'Updated in real time',
      status: overviewRes.data.counts.activeSessions > 0 ? 'ok' : 'warning',
    },
    {
      id: 'ops-staff',
      label: 'Operations Staff',
      value: overviewRes.data.counts.staff.toLocaleString('vi-VN'),
      trend: `${overviewRes.data.counts.managers} managers`,
      status: overviewRes.data.counts.staff > 0 ? 'ok' : 'critical',
    },
  ];

  const liveActivities = auditLogs.slice(0, 5).map(
    (log) => `${log.action}: ${log.details}`,
  );

  return {
    dashboardStats,
    revenueTrend,
    paymentMethodDistribution,
    buildings,
    users,
    // BE chưa có endpoint transactions/fraudAlerts riêng cho admin — để mảng rỗng
    // có chủ đích (không phải thiếu sót) cho tới khi BE bổ sung API tương ứng.
    transactions: [],
    auditLogs,
    fraudAlerts: [],
    monitoringMetrics,
    liveActivities,
    operationalGuardrails: OPERATIONAL_GUARDRAILS,
  };
}
