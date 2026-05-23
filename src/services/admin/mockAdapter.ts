import {
  auditLogs,
  buildings,
  dashboardStats,
  fraudAlerts,
  liveActivities,
  monitoringMetrics,
  operationalGuardrails,
  paymentMethodDistribution,
  revenueTrend,
  transactions,
  users,
} from '@/mock/data';
import type { AdminDataset } from '@/services/admin/types';

export async function getMockAdminDataset(): Promise<AdminDataset> {
  await new Promise((resolve) => setTimeout(resolve, 180));

  return {
    dashboardStats,
    revenueTrend,
    paymentMethodDistribution,
    buildings,
    users,
    transactions,
    auditLogs,
    fraudAlerts,
    monitoringMetrics,
    liveActivities,
    operationalGuardrails,
  };
}
