import { useEffect, useState } from 'react';
import { getAdminDataset, type AdminDataset } from '@/services/admin';

interface UseAdminDatasetResult {
  data: AdminDataset | null;
  isLoading: boolean;
  error: string | null;
}

export function useAdminDataset(): UseAdminDatasetResult {
  const [data, setData] = useState<AdminDataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    getAdminDataset()
      .then((result) => {
        if (!mounted) return;
        setData(result);
        setError(null);
      })
      .catch((err: unknown) => {
        if (!mounted) return;
        const message = err instanceof Error ? err.message : 'Failed to load admin data';
        setError(message);
      })
      .finally(() => {
        if (!mounted) return;
        setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { data, isLoading, error };
}
