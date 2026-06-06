import { useState, useCallback, useEffect } from 'react';
import { staffApi, type ParkingSession, type PlateInfo, type PaymentData, type PaymentStatus } from '@/services/staff/staffApi';
import { ApiError } from '@/services/apiClient';

interface UseStaffSessionsOptions {
  buildingId: string;
  autoFetch?: boolean;
}

interface UseStaffSessionsReturn {
  sessions: ParkingSession[];
  loading: boolean;
  error: string | null;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  
  // Actions
  checkIn: (plateNumber: string, vehicleType?: string, gate?: string, forceCheckIn?: boolean) => Promise<ParkingSession>;
  checkOut: (sessionId: string, paymentMethod: string, options?: any) => Promise<ParkingSession>;
  searchByPlate: (plate: string) => Promise<ParkingSession[]>;
  lookupPlate: (plate: string) => Promise<PlateInfo>;
  lookupUser: (qrCode: string) => Promise<PlateInfo>;
  initiatePayment: (sessionId: string) => Promise<PaymentData>;
  getPaymentStatus: (orderCode: number) => Promise<PaymentStatus>;
  refresh: () => Promise<void>;
}

export function useStaffSessions({
  buildingId,
  autoFetch = true,
}: UseStaffSessionsOptions): UseStaffSessionsReturn {
  const [sessions, setSessions] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const refresh = useCallback(async () => {
    if (!buildingId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await staffApi.sessions.list(buildingId, {
        status: statusFilter || undefined,
      });
      setSessions(response.data.items);
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
  }, [buildingId, statusFilter]);

  const checkIn = useCallback(
    async (plateNumber: string, vehicleType?: string, gate?: string, forceCheckIn?: boolean) => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await staffApi.sessions.checkIn(buildingId, {
          plateNumber,
          vehicleType,
          gate,
          forceCheckIn,
        });
        
        // Cập nhật list
        await refresh();
        
        return response.data.item;
      } catch (err) {
        const message = err instanceof ApiError 
          ? `Lỗi check-in ${err.status}: ${JSON.stringify(err.payload)}`
          : err instanceof Error 
          ? err.message 
          : 'Lỗi check-in';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [buildingId, refresh]
  );

  const checkOut = useCallback(
    async (sessionId: string, paymentMethod: string) => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await staffApi.sessions.checkOut(buildingId, sessionId, {
          paymentMethod,
        });
        
        // Cập nhật list
        await refresh();
        
        return response.data.item;
      } catch (err) {
        const message = err instanceof ApiError 
          ? `Lỗi check-out ${err.status}: ${JSON.stringify(err.payload)}`
          : err instanceof Error 
          ? err.message 
          : 'Lỗi check-out';
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [buildingId, refresh]
  );

  const searchByPlate = useCallback(async (plate: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await staffApi.sessions.search(plate);
      return response.data.items;
    } catch (err) {
      const message = err instanceof ApiError 
        ? `Lỗi tìm kiếm ${err.status}`
        : err instanceof Error 
        ? err.message 
        : 'Lỗi tìm kiếm';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const lookupPlate = useCallback(async (plate: string) => {
    try {
      const response = await staffApi.sessions.lookupPlate(plate);
      return response.data;
    } catch (err) {
      // Silent fail for lookup - not critical
      return { plateNumber: plate, hasAccount: false };
    }
  }, []);

  const lookupUser = useCallback(async (qrCode: string): Promise<PlateInfo> => {
    try {
      const response = await staffApi.sessions.lookupUser(qrCode);
      const data = response.data;
      return {
        plateNumber: '',
        hasAccount: data.hasAccount,
        user: data.user
          ? { id: data.user.id, fullName: data.user.fullName, email: data.user.email, phone: '', walletBalance: 0 }
          : undefined,
      };
    } catch {
      return { plateNumber: '', hasAccount: false };
    }
  }, []);

  const initiatePayment = useCallback(async (sessionId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await staffApi.sessions.initiatePayment(sessionId);
      return response.data;
    } catch (err) {
      const message = err instanceof ApiError 
        ? `Lỗi tạo QR ${err.status}`
        : err instanceof Error 
        ? err.message 
        : 'Lỗi tạo QR';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPaymentStatus = useCallback(async (orderCode: number) => {
    try {
      const response = await staffApi.sessions.getPaymentStatus(orderCode);
      return response.data;
    } catch (err) {
      throw err;
    }
  }, []);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch && buildingId) {
      refresh();
    }
  }, [buildingId, autoFetch, refresh]);

  return {
    sessions,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    checkIn,
    checkOut,
    searchByPlate,
    lookupPlate,
    lookupUser,
    initiatePayment,
    getPaymentStatus,
    refresh,
  };
}
