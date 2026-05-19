import type { AdminDataset } from '@/services/admin/types';

export async function getApiAdminDataset(): Promise<AdminDataset> {
  // Backend contract reference:
  // BE/src/routes/admin/README.md
  // This adapter is the only place to connect real backend later.
  // Replace endpoint URLs and mapping here without touching UI pages.
  const response = await fetch('/api/admin/dashboard');

  if (!response.ok) {
    throw new Error('Failed to load admin dataset from API');
  }

  const payload = (await response.json()) as AdminDataset;
  return payload;
}
