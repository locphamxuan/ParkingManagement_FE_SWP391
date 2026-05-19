import { useCallback, useEffect, useState } from 'react';

/**
 * @template T
 * @param {() => Promise<{ data?: unknown } | unknown>} fetcher
 * @param {unknown[]} deps
 * @param {(raw: unknown) => T[]} [selectItems]
 */
export default function useAsyncResource(fetcher, deps = [], selectItems) {
  const [status, setStatus] = useState('idle');
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);

  const resolveItems = useCallback(
    (payload) => {
      if (selectItems) {
        return selectItems(payload);
      }

      const data = payload?.data ?? payload;

      if (Array.isArray(data)) {
        return data;
      }

      if (Array.isArray(data?.buildings)) {
        return data.buildings;
      }

      if (Array.isArray(data?.items)) {
        return data.items;
      }

      return [];
    },
    [selectItems]
  );

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);

    try {
      const payload = await fetcher();
      const nextItems = resolveItems(payload);

      if (!nextItems.length) {
        setItems([]);
        setStatus('empty');
        return;
      }

      setItems(nextItems);
      setStatus('success');
    } catch (err) {
      setItems([]);
      setError(err instanceof Error ? err : new Error('Đã xảy ra lỗi'));
      setStatus('error');
    }
  }, [fetcher, resolveItems]);

  useEffect(() => {
    load();
  }, [load, ...deps]);

  return {
    status,
    items,
    error,
    reload: load,
    isLoading: status === 'loading',
    isEmpty: status === 'empty',
    isError: status === 'error',
  };
}
