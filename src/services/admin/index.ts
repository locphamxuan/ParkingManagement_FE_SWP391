import { getApiAdminDataset } from '@/services/admin/apiAdapter';
import { getMockAdminDataset } from '@/services/admin/mockAdapter';
import type { AdminDataset } from '@/services/admin/types';

const useMockData = import.meta.env.VITE_USE_MOCK_DATA !== 'false';

export async function getAdminDataset(): Promise<AdminDataset> {
  if (useMockData) {
    return getMockAdminDataset();
  }

  return getApiAdminDataset();
}

export type { AdminDataset } from '@/services/admin/types';
