import { useState, useEffect, useCallback } from 'react';
import { userApi } from '@/services/user/userApi';
import type { Reservation, LongTermSubscription } from '@/services/user/userApi';

export function useReservationHistory() {
  const [historyMode, setHistoryMode] = useState<'hourly' | 'package'>('hourly');

  // Hourly reservations
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Package subscriptions
  const [packageItems, setPackageItems] = useState<LongTermSubscription[]>([]);
  const [packageLoading, setPackageLoading] = useState(true);
  const [packageError, setPackageError] = useState<string | null>(null);
  const [packageFilter, setPackageFilter] = useState<string>('all');
  const [packagePage, setPackagePage] = useState(1);
  const [packageTotalPages, setPackageTotalPages] = useState(1);

  const load = useCallback(
    (p = 1, status = statusFilter) => {
      setLoading(true);
      setError(null);
      userApi.reservations
        .list({ page: p, limit: 10, status: status === 'all' ? undefined : status })
        .then((res) => {
          setItems(res.data?.items ?? []);
          setTotalPages(res.data?.pagination?.totalPages ?? 1);
          setPage(p);
        })
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load history'))
        .finally(() => setLoading(false));
    },
    [statusFilter],
  );

  const loadPackages = useCallback(
    (p = 1, status = packageFilter) => {
      setPackageLoading(true);
      setPackageError(null);
      userApi.longTermSubscriptions
        .list({ page: p, limit: 10, status: status === 'all' ? undefined : status })
        .then((res) => {
          setPackageItems(res.data?.items ?? []);
          setPackageTotalPages(res.data?.pagination?.totalPages ?? 1);
          setPackagePage(p);
        })
        .catch((err) =>
          setPackageError(err instanceof Error ? err.message : 'Failed to load long-term subscriptions'),
        )
        .finally(() => setPackageLoading(false));
    },
    [packageFilter],
  );

  useEffect(() => {
    if (historyMode === 'hourly') load(1, statusFilter);
  }, [load, statusFilter, historyMode]);

  useEffect(() => {
    if (historyMode === 'package') loadPackages(1, packageFilter);
  }, [loadPackages, packageFilter, historyMode]);

  const handleCancel = async (id: string) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    setCancellingId(id);
    try {
      await userApi.reservations.cancel(id);
      setItems((prev) => prev.map((r) => (r._id === id ? { ...r, status: 'cancelled' } : r)));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to cancel reservation.');
    } finally {
      setCancellingId(null);
    }
  };

  const refresh = () => {
    if (historyMode === 'hourly') load(page, statusFilter);
    else loadPackages(packagePage, packageFilter);
  };

  return {
    historyMode, setHistoryMode,
    items, loading, error, page, totalPages, cancellingId, statusFilter, setStatusFilter, load,
    packageItems, packageLoading, packageError, packageFilter, setPackageFilter, packagePage, packageTotalPages, loadPackages,
    handleCancel, refresh,
  };
}
