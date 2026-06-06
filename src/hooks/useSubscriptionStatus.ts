import { useCallback, useEffect, useState } from 'react';
import { managerApi, type SubscriptionStatus } from '@/services/manager/managerApi';

/**
 * Fetches a building's admin-subscription status. Used to gate the manager
 * dashboard: an inactive subscription means the manager can only reach the
 * wallet (to buy a package) and profile pages.
 */
export function useSubscriptionStatus(buildingId: string | undefined) {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!buildingId) {
      setStatus(null);
      return;
    }
    setLoading(true);
    try {
      const res = await managerApi.getSubscriptionStatus(buildingId);
      setStatus((res as { data?: SubscriptionStatus })?.data ?? null);
    } catch {
      // On a transient error, leave status unknown — don't lock the manager out.
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { status, loading, refresh };
}
