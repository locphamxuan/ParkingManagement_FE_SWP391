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
    const token = session?.token;
    if (!token) {
      setData(null);
      setError('Bạn chưa đăng nhập phiên quản trị.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const result = await getAdminDataset(token);
      setData(result);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load admin data';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [session?.token]);

  useEffect(() => {
    let mounted = true;

    refresh().catch(() => undefined);

    return () => {
      mounted = false;
    };
  }, [refresh]);

  return { data, isLoading, error, refresh };
}
