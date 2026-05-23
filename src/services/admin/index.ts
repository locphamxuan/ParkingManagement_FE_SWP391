import { getApiAdminDataset } from '@/services/admin/apiAdapter';
import type { AdminDataset } from '@/services/admin/types';

export async function getAdminDataset(token: string): Promise<AdminDataset> {
  return getApiAdminDataset(token);
}

export type { AdminDataset } from '@/services/admin/types';
