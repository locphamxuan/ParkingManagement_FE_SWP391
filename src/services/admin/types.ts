import type {
  AuditLog,
  Building,
  FraudAlert,
  MonitoringMetric,
  RevenuePoint,
  UserRecord,
} from '@/types';

export interface DashboardStat {
  key: string;
  label: string;
  value: string;
  delta: string;
}

export interface PaymentDistribution {
  name: string;
  /** Doanh thu của phương thức này trong kỳ (VND). */
  value: number;
  /** Tỷ trọng trên tổng doanh thu (%), làm tròn 1 chữ số thập phân. */
  share: number;
  /** Số giao dịch thành công của phương thức này. */
  count: number;
}

export interface TransactionItem {
  id: string;
  building: string;
  amount: number;
  method: string;
  status: string;
  time: string;
}

export interface AdminDataset {
  dashboardStats: readonly DashboardStat[];
  revenueTrend: RevenuePoint[];
  paymentMethodDistribution: PaymentDistribution[];
  buildings: Building[];
  users: UserRecord[];
  transactions: TransactionItem[];
  auditLogs: AuditLog[];
  fraudAlerts: FraudAlert[];
  monitoringMetrics: MonitoringMetric[];
  liveActivities: string[];
  operationalGuardrails: string[];
}
