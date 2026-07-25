import { getApiAdminDataset } from '@/services/admin/apiAdapter';
import type { AdminDataset } from '@/services/admin/types';

export async function getAdminDataset(): Promise<AdminDataset> {
  return getApiAdminDataset();
}

export type { AdminDataset } from '@/services/admin/types';
