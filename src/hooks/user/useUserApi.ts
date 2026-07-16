/* eslint-disable react-hooks/exhaustive-deps --
   Các hook trong file này cố ý liệt kê TỪNG FIELD của `query` trong deps thay vì
   cả object: caller truyền object literal mới mỗi render, đưa `query` vào deps
   sẽ gây refetch vô hạn. */
import { useEffect, useState, useCallback } from 'react';
import {
  userApi,
  type ParkingHistory,
  type LongTermPackage,
  type LongTermSubscription,
  type Building,
  type VehicleType,
  type ParkingSlot,
  type FloorAvailability,
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
          items: result.data.packages,
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
        items: result.data.packages,
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
    async (body: { packageId: string; linkedPlates: string[]; startDate?: string; paymentMethod?: string }) => {
      setIsLoading(true);
      setError(null);
      try {
        // Backend takes a single plateNumber — use the first linked plate.
        const result = await userApi.longTermSubscriptions.create({
          packageId: body.packageId,
          plateNumber: body.linkedPlates[0],
          ...(body.startDate ? { startDate: body.startDate } : {}),
        });
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

export function useRenewSubscription() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const renew = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await userApi.longTermSubscriptions.renew(id);
      return result.data.subscription;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { renew, isLoading, error };
}

export function useCancelSubscription() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const cancel = useCallback(async (id: string, cancelReason?: string, cancelNote?: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await userApi.longTermSubscriptions.cancel(id, {
        cancelReason: cancelReason || 'change_vehicle',
        cancelNote,
      });
      return result.data;
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

// ========== BUILDINGS HOOKS ==========

export function useBuildings(query?: { limit?: number; page?: number }) {
  const [state, setState] = useState<ListFetchState<Building>>({
    items: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    const fetchBuildings = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const result = await userApi.buildings.list(query);
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

    fetchBuildings();
  }, [query?.page, query?.limit]);

  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const result = await userApi.buildings.list(query);
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

export function useBuildingVehicleTypes(buildingId: string) {
  const [state, setState] = useState<ListFetchState<VehicleType>>({
    items: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!buildingId) {
      setState({ items: [], isLoading: false, error: null });
      return;
    }

    const fetchVehicleTypes = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const result = await userApi.buildings.vehicleTypes(buildingId);
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

    fetchVehicleTypes();
  }, [buildingId]);

  const refresh = useCallback(async () => {
    if (!buildingId) return;
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const result = await userApi.buildings.vehicleTypes(buildingId);
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
        error: error instanceof Error ? error : new Error('Unknown   error'),
      }));
    }
  }, [buildingId]);

  return { ...state, refresh };
}

export function useBuildingFloors(buildingId: string, query?: { vehicleTypeId?: string }) {
  const [state, setState] = useState<ListFetchState<FloorAvailability>>({
    items: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!buildingId) {
      setState({ items: [], isLoading: false, error: null });
      return;
    }

    const fetchFloors = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const result = await userApi.buildings.floors(buildingId, query);
        setState({
          items: result.data.floors,
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

    fetchFloors();
  }, [buildingId, query?.vehicleTypeId]);

  const refresh = useCallback(async () => {
    if (!buildingId) return;
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const result = await userApi.buildings.floors(buildingId, query);
      setState({
        items: result.data.floors,
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
  }, [buildingId, query?.vehicleTypeId]);

  return { ...state, refresh };
}

export function useBuildingSlots(buildingId: string, floorId: string, query?: { limit?: number; page?: number }) {
  const [state, setState] = useState<ListFetchState<ParkingSlot>>({
    items: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!buildingId || !floorId) {
      setState({ items: [], isLoading: false, error: null });
      return;
    }

    const fetchSlots = async () => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));
      try {
        const result = await userApi.buildings.slots(buildingId, floorId);
        setState({
          items: result.data.slots,
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

    fetchSlots();
  }, [buildingId, floorId, query?.page, query?.limit]);

  const refresh = useCallback(async () => {
    if (!buildingId || !floorId) return;
    setState((prev) => ({ ...prev, isLoading: true }));
    try {
      const result = await userApi.buildings.slots(buildingId, floorId);
      setState({
        items: result.data.slots,
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
  }, [buildingId, floorId]);

  return { ...state, refresh };
}
