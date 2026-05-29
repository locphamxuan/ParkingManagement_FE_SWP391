import { useEffect, useState, useCallback } from 'react';
import {
  userApi,
  type Reservation,
  type ParkingHistory,
  type LongTermPackage,
  type LongTermSubscription,
} from '@/services/user/userApi';

interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

interface ListFetchState<T> {
  items: T[];
  isLoading: boolean;
  error: Error | null;
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

// ========== RESERVATIONS HOOKS ==========

export function useReservations(query?: { status?: string; limit?: number; page?: number }) {
  const [state, setState] = useState<ListFetchState<Reservation>>({
    items: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchReservations = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const result = await userApi.reservations.list(query);
        setState({
          items: result.data.items,
          pagination: result.data.pagination,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Unknown error'),
        }));
      }
    };

    fetchReservations();
  }, [query?.page, query?.limit, query?.status]);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const result = await userApi.reservations.list(query);
      setState({
        items: result.data.items,
        pagination: result.data.pagination,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }));
    }
  }, [query]);

  return { ...state, refresh };
}

export function useReservation(id: string) {
  const [state, setState] = useState<FetchState<Reservation>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!id) return;

    const fetchReservation = async () => {
      setState({ data: null, isLoading: true, error: null });
      try {
        const result = await userApi.reservations.get(id);
        setState({ data: result.data.reservation, isLoading: false, error: null });
      } catch (error) {
        setState({
          data: null,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Unknown error'),
        });
      }
    };

    fetchReservation();
  }, [id]);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const result = await userApi.reservations.get(id);
      setState({ data: result.data.reservation, isLoading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      });
    }
  }, [id]);

  return { ...state, refresh };
}

export function useCreateReservation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const create = useCallback(
    async (body: {
      plateNumber: string;
      buildingId: string;
      vehicleTypeId?: string;
      slotId?: string;
      reservationDate: string;
    }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await userApi.reservations.create(body);
        return result.data.reservation;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { create, isLoading, error };
}

export function useCancelReservation() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const cancel = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await userApi.reservations.cancel(id);
      return result.data.reservation;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { cancel, isLoading, error };
}

// ========== PARKING HISTORY HOOKS ==========

export function useParkingHistory(query?: {
  limit?: number;
  page?: number;
  fromDate?: string;
  toDate?: string;
}) {
  const [state, setState] = useState<ListFetchState<ParkingHistory>>({
    items: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchHistory = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const result = await userApi.parkingHistory.list(query);
        setState({
          items: result.data.items,
          pagination: result.data.pagination,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Unknown error'),
        }));
      }
    };

    fetchHistory();
  }, [query?.page, query?.limit, query?.fromDate, query?.toDate]);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const result = await userApi.parkingHistory.list(query);
      setState({
        items: result.data.items,
        pagination: result.data.pagination,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }));
    }
  }, [query]);

  return { ...state, refresh };
}

export function useParkingHistoryItem(id: string) {
  const [state, setState] = useState<FetchState<ParkingHistory>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!id) return;

    const fetchSession = async () => {
      setState({ data: null, isLoading: true, error: null });
      try {
        const result = await userApi.parkingHistory.get(id);
        setState({ data: result.data.session, isLoading: false, error: null });
      } catch (error) {
        setState({
          data: null,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Unknown error'),
        });
      }
    };

    fetchSession();
  }, [id]);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const result = await userApi.parkingHistory.get(id);
      setState({ data: result.data.session, isLoading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      });
    }
  }, [id]);

  return { ...state, refresh };
}

// ========== LONG-TERM PACKAGES HOOKS ==========

export function useLongTermPackages(query?: {
  buildingId?: string;
  limit?: number;
  page?: number;
}) {
  const [state, setState] = useState<ListFetchState<LongTermPackage>>({
    items: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchPackages = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const result = await userApi.longTermPackages.list(query);
        setState({
          items: result.data.items,
          pagination: result.data.pagination,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Unknown error'),
        }));
      }
    };

    fetchPackages();
  }, [query?.buildingId, query?.page, query?.limit]);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const result = await userApi.longTermPackages.list(query);
      setState({
        items: result.data.items,
        pagination: result.data.pagination,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }));
    }
  }, [query]);

  return { ...state, refresh };
}

export function useLongTermPackage(id: string) {
  const [state, setState] = useState<FetchState<LongTermPackage>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!id) return;

    const fetchPackage = async () => {
      setState({ data: null, isLoading: true, error: null });
      try {
        const result = await userApi.longTermPackages.get(id);
        setState({ data: result.data.package, isLoading: false, error: null });
      } catch (error) {
        setState({
          data: null,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Unknown error'),
        });
      }
    };

    fetchPackage();
  }, [id]);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const result = await userApi.longTermPackages.get(id);
      setState({ data: result.data.package, isLoading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      });
    }
  }, [id]);

  return { ...state, refresh };
}

// ========== LONG-TERM SUBSCRIPTIONS HOOKS ==========

export function useLongTermSubscriptions(query?: {
  status?: string;
  limit?: number;
  page?: number;
}) {
  const [state, setState] = useState<ListFetchState<LongTermSubscription>>({
    items: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchSubscriptions = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const result = await userApi.longTermSubscriptions.list(query);
        setState({
          items: result.data.items,
          pagination: result.data.pagination,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Unknown error'),
        }));
      }
    };

    fetchSubscriptions();
  }, [query?.page, query?.limit, query?.status]);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const result = await userApi.longTermSubscriptions.list(query);
      setState({
        items: result.data.items,
        pagination: result.data.pagination,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      }));
    }
  }, [query]);

  return { ...state, refresh };
}

export function useLongTermSubscription(id: string) {
  const [state, setState] = useState<FetchState<LongTermSubscription>>({
    data: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!id) return;

    const fetchSubscription = async () => {
      setState({ data: null, isLoading: true, error: null });
      try {
        const result = await userApi.longTermSubscriptions.get(id);
        setState({ data: result.data.subscription, isLoading: false, error: null });
      } catch (error) {
        setState({
          data: null,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Unknown error'),
        });
      }
    };

    fetchSubscription();
  }, [id]);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const result = await userApi.longTermSubscriptions.get(id);
      setState({ data: result.data.subscription, isLoading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Unknown error'),
      });
    }
  }, [id]);

  return { ...state, refresh };
}

export function useSubscribeToPackage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const subscribe = useCallback(
    async (body: { packageId: string; linkedPlates: string[]; paymentMethod?: string }) => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await userApi.longTermSubscriptions.create(body as any);
        return result.data.subscription;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  return { subscribe, isLoading, error };
}

export function useCancelSubscription() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const cancel = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await userApi.longTermSubscriptions.cancel(id);
      return result.data.subscription;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { cancel, isLoading, error };
}
