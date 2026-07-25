import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getAdminDataset, type AdminDataset } from '@/services/admin';

interface UseAdminDatasetResult {
  data: AdminDataset | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAdminDataset(): UseAdminDatasetResult {
  const { session } = useAuth();
  const [data, setData] = useState<AdminDataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!session) {
      setData(null);
      setError('You are not signed in to an admin session.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const result = await getAdminDataset();
      setData(result);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load admin data';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
