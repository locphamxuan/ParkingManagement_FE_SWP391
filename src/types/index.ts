export type EntityStatus = 'active' | 'inactive' | 'maintenance' | 'warning' | 'critical';

export interface Building {
  id: string;
  backendId?: string;
  name: string;
  address: string;
  floors: number;
  occupancyRate: number;
  status: EntityStatus;
  manager: string;
  revenueToday: number;
}

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'staff' | 'user';
  status: 'active' | 'blocked' | 'pending';
  walletBalance: number;
  linkedPlates: string[];
  phone?: string;
}

export interface RevenuePoint {
  date: string;
  revenue: number;
  sessions: number;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  details: string;
  /** Tên tòa nhà liên quan (nếu hành động gắn với một tòa nhà cụ thể). */
  building?: string;
}

export interface FraudAlert {
  id: string;
  type: string;
  building: string;
  severity: 'medium' | 'high' | 'critical';
  timestamp: string;
  note: string;
}

export interface MonitoringMetric {
  id: string;
  label: string;
  value: string;
  trend: string;
  status: 'ok' | 'warning' | 'critical';
}
