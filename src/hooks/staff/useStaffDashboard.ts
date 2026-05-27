import { useState, useEffect } from 'react';
import { staffApi, type Dashboard } from '@/services/staff/staffApi';
import { ApiError } from '@/services/apiClient';

interface UseStaffDashboardReturn {
  dashboard: Dashboard | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useStaffDashboard(): UseStaffDashboardReturn {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await staffApi.dashboard();
      setDashboard(response.data);
    } catch (err) {
      const message = err instanceof ApiError
        ? `Lỗi ${err.status}: ${JSON.stringify(err.payload)}`
        : err instanceof Error
        ? err.message
        : 'Lỗi không xác định';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return {
    dashboard,
    loading,
    error,
    refresh,
  };
}
