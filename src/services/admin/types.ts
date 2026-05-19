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
  value: number;
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
