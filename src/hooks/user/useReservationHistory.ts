import { useState, useEffect, useCallback } from 'react';
import { userApi } from '@/services/user/userApi';
import type { Reservation } from '@/services/user/userApi';

export function useReservationHistory() {
  const [items, setItems] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  useEffect(() => {
    load(1, statusFilter);
  }, [load, statusFilter]);

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

  const refresh = () => load(page, statusFilter);

  return {
    items, loading, error, page, totalPages, cancellingId,
    statusFilter, setStatusFilter, load, handleCancel, refresh,
  };
}
