import { api } from '@/services/apiClient';

// ========== INTERFACES ==========

export interface StaffBuilding {
  _id: string;
  name: string;
  code: string;
  status: 'active' | 'inactive' | 'maintenance';
  operatingHours: { open: string; close: string };
  address?: { fullAddress?: string };
  contactPhone?: string;
}

export interface MyShift {
  _id: string;
  shift: { _id: string; code: string; name: string; startTime: string; endTime: string };
  building: { _id: string; name: string; code: string };
  workDate: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  note?: string;
}

export interface ParkingSession {
  _id: string;
  plateNumber: string;
  vehicleType?: { _id: string; name: string; code: string } | null;
  slot?: { _id: string; code: string } | null;
  entryGate?: { _id: string; code: string; name: string } | null;
  exitGate?: { _id: string; code: string; name: string } | null;
  entryTime: string;
  exitTime?: string | null;
  duration?: number | null;
  fee?: number | null;
  paymentMethod?: 'cash' | 'wallet' | 'qr' | 'card' | 'payos' | 'long_term' | null;
  status: 'active' | 'completed' | 'cancelled';
}

export interface Reservation {
  _id: string;
  code: string;
  plateNumber: string;
  vehicleType?: { _id: string; name: string; code: string } | null;
  slot?: { _id: string; code: string } | null;
  building: { _id: string; name: string; code: string };
  status: 'pending' | 'confirmed' | 'checked_in' | 'expired' | 'cancelled';
  reservationDate: string;
  expiresAt: string;
}

export interface WalletTransaction {
  _id: string;
  sessionId: string;
  userId: string;
  amount: number;
  type: 'payment' | 'refund' | 'topup';
  status: 'pending' | 'completed' | 'failed';
  createdAt: string;
}

export interface Incident {
  _id: string;
  incidentType: string;
  parkingSessionId: string;
  plateNumber: string;
  penaltyFee: number;
  paymentMethod: 'cash' | 'wallet' | 'qr';
  description?: string;
  resolvedAt?: string;
  status: 'reported' | 'resolved' | 'cancelled';
}

export interface Dashboard {
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  revenue: number;
  todayShifts: number;
  activeShifts: number;
}

export interface PlateInfo {
  plateNumber: string;
  hasAccount: boolean;
  user?: {
    id: string;
    fullName: string;
    email: string;
    phone: string;
    walletBalance: number;
  };
  activeSession?: {
    id: string;
    building: string;
    entryTime: string;
  };
}

export interface PaymentData {
  checkoutUrl: string;
  qrCode: string;
  orderCode: number;
  amount: number;
  plateNumber: string;
  entryTime: string;
}

export interface PaymentStatus {
  status: 'success' | 'pending' | 'cancelled' | string;
  settled: boolean;
}

interface Wrap<T> {
  data: T;
}

// ========== API METHODS ==========

export const staffApi = {
  // Dashboard
  dashboard: () =>
    api.get<Wrap<Dashboard>>('/staff/dashboard'),

  // Buildings
  buildings: () =>
    api.get<Wrap<StaffBuilding[] | { items: StaffBuilding[] }>>('/staff/buildings'),

  buildingDetail: (buildingId: string) =>
    api.get<Wrap<StaffBuilding>>(`/staff/buildings/${buildingId}`),

  // My Shifts
  myShifts: (q?: Record<string, string | undefined>) =>
    api.get<Wrap<{ items: MyShift[] } | MyShift[]>>('/staff/my-shifts', { query: q }),

  // Parking Sessions
  sessions: {
    list: (buildingId: string, q?: Record<string, string | undefined>) =>
      api.get<Wrap<{ items: ParkingSession[] }>>(
        '/staff/parking-sessions/active',
        { query: { ...q, buildingId } }
      ),

    active: (q?: Record<string, string | undefined>) =>
      api.get<Wrap<{ items: ParkingSession[] }>>('/staff/parking-sessions/active', { query: q }),

    search: (plateNumber: string) =>
      api.get<Wrap<{ items: ParkingSession[] }>>('/staff/parking-sessions/search', {
        query: { plate: plateNumber },
      }),

    detail: (sessionId: string) =>
      api.get<Wrap<ParkingSession>>(`/staff/parking-sessions/${sessionId}`),

    checkIn: (
      buildingId: string,
      body: { plateNumber: string; vehicleType?: string; gate?: string; forceCheckIn?: boolean }
    ) =>
      api.post<Wrap<{ item: ParkingSession }>>(
        `/staff/parking-sessions/check-in`,
        body
      ),

    checkOut: (buildingId: string, sessionId: string, body: { paymentMethod: string }) =>
      api.patch<Wrap<{ item: ParkingSession }>>(
        `/staff/buildings/${buildingId}/sessions/${sessionId}/check-out`,
        body
      ),

    initiatePayment: (sessionId: string) =>
      api.post<Wrap<PaymentData>>(
        `/staff/parking-sessions/${sessionId}/initiate-payment`,
        {}
      ),

    getPaymentStatus: (orderCode: number) =>
      api.get<Wrap<PaymentStatus>>(
        `/staff/parking-sessions/payment/${orderCode}/status`
      ),

    lookupPlate: (plateNumber: string) =>
      api.get<Wrap<PlateInfo>>(
        `/staff/parking-sessions/lookup-plate/${plateNumber}`
      ),

    lookupUser: (qrCode: string) =>
      api.get<Wrap<PlateInfo>>(
        `/staff/users/lookup-qr/${qrCode}`
      ),
  },

  // Reservations
  reservations: {
    checkIn: (code: string, body: { gate?: string }) =>
      api.post<Wrap<{ item: Reservation }>>(
        `/staff/reservations/${code}/check-in`,
        body
      ),

    expire: (reservationId: string) =>
      api.patch<Wrap<{ item: Reservation }>>(
        `/staff/reservations/${reservationId}/expire`,
        {}
      ),
  },

  // Wallet Transactions
  walletTransactions: (body: {
    sessionId: string;
    userId: string;
    amount: number;
  }) =>
    api.post<Wrap<{ item: WalletTransaction }>>(
      '/staff/wallet-transactions',
      body
    ),

  // Incidents
  incidents: (body: {
    incidentType: string;
    parkingSessionId: string;
    penaltyFee: number;
    paymentMethod: 'cash' | 'wallet' | 'qr';
    description?: string;
  }) =>
    api.post<Wrap<{ item: Incident }>>(
      '/staff/incidents',
      body
    ),
};

// ========== HELPER FUNCTIONS ==========

export const extractShifts = (payload: Wrap<{ items: MyShift[] } | MyShift[]>): MyShift[] => {
  if (!payload?.data) return [];
  const d = payload.data;
  if (Array.isArray(d)) return d;
  return (d as { items?: MyShift[] }).items ?? [];
};

export const extractBuildings = (
  payload: StaffBuilding[] | { items: StaffBuilding[] }
): StaffBuilding[] => {
  if (Array.isArray(payload)) return payload;
  return (payload as { items?: StaffBuilding[] }).items ?? [];
};

export const extractSessions = (payload: any): ParkingSession[] => {
  if (!payload?.data) return [];
  if (Array.isArray(payload.data)) return payload.data;
  return (payload.data as { items?: ParkingSession[] }).items ?? [];
};
