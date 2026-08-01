import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getAdminDataset, type AdminDataset } from '@/services/admin';

interface UseAdminDatasetResult {
  data: AdminDataset | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * Một lần gọi `getAdminDataset()` phát ra 4 request (dashboard, buildings, users,
 * audit-logs). Bốn màn admin đều dùng chung hook này, và React StrictMode chạy
 * effect hai lần ở dev — nếu để mỗi lần mount tự gọi thì chỉ mở trang Users đã bắn
 * 8 request giống hệt nhau, còn chuyển qua lại giữa các trang admin thì tải lại
 * toàn bộ dataset mỗi lần.
 *
 * Hai lớp chống lãng phí ở cấp module (dùng chung cho mọi component):
 *  - `inFlight`: các lời gọi trùng thời điểm chia sẻ CÙNG một promise;
 *  - `cache`   : kết quả dùng lại trong `CACHE_TTL_MS` cho lần điều hướng kế tiếp.
 *
 * `refresh()` luôn bỏ qua cache — đó là hành động người dùng chủ động yêu cầu số liệu mới.
 */
const CACHE_TTL_MS = 30_000;

let inFlight: Promise<AdminDataset> | null = null;
let cache: { data: AdminDataset; at: number } | null = null;

/** Xoá cache khi dữ liệu admin vừa bị thay đổi (tạo/sửa/xoá) hoặc khi đổi phiên. */
export function invalidateAdminDataset(): void {
  cache = null;
}

async function loadDataset(force: boolean): Promise<AdminDataset> {
  if (!force && cache && Date.now() - cache.at < CACHE_TTL_MS) {
    return cache.data;
  }
  if (!force && inFlight) {
    return inFlight;
  }

  const request = getAdminDataset()
    .then((result) => {
      cache = { data: result, at: Date.now() };
      return result;
    })
    .finally(() => {
      if (inFlight === request) inFlight = null;
    });

  inFlight = request;
  return request;
}

export function useAdminDataset(): UseAdminDatasetResult {
  const { session } = useAuth();
  const [data, setData] = useState<AdminDataset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    async (force: boolean) => {
      if (!session) {
        setData(null);
        setError('You are not signed in to an admin session.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const result = await loadDataset(force);
        setData(result);
        setError(null);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to load admin data';
        setError(message);
      } finally {
        setIsLoading(false);
      }
    },
    [session],
  );

  const refresh = useCallback(() => load(true), [load]);

  useEffect(() => {
    load(false).catch(() => undefined);
  }, [load]);

  return { data, isLoading, error, refresh };
}
