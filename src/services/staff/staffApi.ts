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
  /** Gate assigned by the manager for this shift (ra / vào). */
  gate?: { _id: string; code: string; name?: string; direction: 'in' | 'out' | 'both'; status?: string } | null;
  workDate: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  note?: string;
}

export interface ParkingSession {
  _id: string;
  plateNumber: string;
  vehicleBrand?: string | null;
  vehicleType?: { _id: string; name: string; code: string } | null;
  slot?: { _id: string; code: string; floor?: { _id: string; name: string; code: string } | null } | null;
  entryGate?: { _id: string; code: string; name: string } | null;
  exitGate?: { _id: string; code: string; name: string } | null;
  entryTime: string;
  exitTime?: string | null;
  duration?: number | null;
  fee?: number | null;
  currentFee?: number | null;        // live fee (per manager PricePolicy) for active sessions
  isMember?: boolean;                 // true if the plate is linked to an account
  plateImage?: string | null;        // license-plate camera snapshot (Camera 1)
  portraitImage?: string | null;     // QR / account camera snapshot (Camera 2 — driver portrait)
  user?: { _id: string; fullName?: string; email?: string } | null;
  staff?: { _id: string; fullName?: string; email?: string } | null; // check-in staff
  paymentMethod?: 'cash' | 'wallet' | 'qr' | 'card' | 'payos' | 'long_term' | null;
  status: 'active' | 'completed' | 'cancelled';
}

export interface StaffReservation {
  _id: string;
  code?: string;
  user?: { _id: string; fullName?: string; email?: string } | null;
  building?: { _id: string; name?: string; code?: string } | null;
  vehicleType?: { _id: string; name?: string; code?: string } | null;
  slot?: { _id: string; code?: string; floor?: { _id: string; name?: string; code?: string } | null } | null;
  plateNumber?: string;
  startTime?: string;
  endTime?: string;
  status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'expired';
  fee?: number | null;
  amountPaid?: number | null;
  createdAt?: string;
}

export interface StaffIncident {
  _id: string;
  code?: string;
  type?: string;
  building?: { _id?: string; code?: string; name?: string } | null;
  severity?: 'medium' | 'high' | 'critical';
  status?: 'open' | 'investigating' | 'escalated' | 'resolved' | 'closed';
  createdAt?: string;
  note?: string;
  target?: string;
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
  registeredVehicleType?: 'car' | 'motorcycle' | null;
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

type ApiList<T> = T[] | { items: T[] };

function unwrapList<T>(payload: ApiList<T> | Wrap<ApiList<T>> | null | undefined): T[] {
  if (!payload) return [];
  const raw = typeof payload === 'object' && 'data' in payload ? (payload as Wrap<ApiList<T>>).data : payload as ApiList<T>;
  if (Array.isArray(raw)) return raw;
  return (raw as { items?: T[] }).items ?? [];
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

  // Parking Sessions — top-level methods (correct backend paths)
  getActiveSessions: (query?: Record<string, string | number | boolean | undefined>) =>
    api.get<Wrap<ApiList<ParkingSession>>>('/staff/parking-sessions/active', { query }),

  checkIn: (payload: { plateNumber: string; vehicleType?: string; gate?: string; building?: string; vehicleBrand?: string; plateImage?: string | null; portraitImage?: string | null }) =>
    api.post<Wrap<{ item: ParkingSession }>>('/staff/parking-sessions/check-in', payload),

  checkOut: (sessionId: string, body?: { paymentMethod?: string }) =>
    api.patch<Wrap<{ item: ParkingSession }>>(`/staff/parking-sessions/${sessionId}/check-out`, body ?? {}),

  initiateSessionPayment: (sessionId: string) =>
    api.post<Wrap<PaymentData>>(`/staff/parking-sessions/${sessionId}/initiate-payment`, {}),

  verifySessionPayment: (orderCode: number) =>
    api.get<Wrap<PaymentStatus>>(`/staff/parking-sessions/payment/${orderCode}/status`),

  lookupPlate: (plateNumber: string) =>
    api.get<Wrap<PlateInfo>>(`/staff/parking-sessions/lookup-plate/${plateNumber}`),

  lookupUserQr: (qrCode: string) =>
    api.get<Wrap<{ hasAccount: boolean; user: { id: string; fullName: string; email: string } | null }>>(
      `/staff/users/lookup-qr/${qrCode}`
    ),

  // Lookup a license plate by its unique QR token (PLT-...)
  lookupPlateQr: (qrCode: string) =>
    api.get<
      Wrap<{
        qrCode: string;
        found: boolean;
        plate: { plateNumber: string; vehicleType: string } | null;
        user: { id: string; fullName: string; email: string; phone: string | null; walletBalance: number; isActive: boolean } | null;
        activeSessions: { id: string; building: string; plateNumber: string; entryTime: string; fee: number }[];
      }>
    >(`/staff/users/lookup-plate-qr/${qrCode}`),

  addCustomerPlate: (customerId: string, payload: { plateNumber: string; vehicleType?: string }) =>
    api.post<Wrap<{ success: boolean }>>(`/staff/users/${customerId}/license-plates`, payload),

  // AI camera (Camera 1): send a captured frame (base64, data-URL prefix allowed),
  // get back the recognized plate + brand and the resolved owner account.
  scanVehicle: (image: string) =>
    api.post<
      Wrap<{
        plateNumber: string;
        plateConfidence: number;
        vehicleType: 'car' | 'motorcycle' | null;
        brand: string | null;
        brandConfidence: number;
        vehicleTypeMismatch: boolean;
        hasAccount: boolean;
        registeredVehicleType: 'car' | 'motorcycle' | null;
        user: { id: string; fullName: string; email: string; phone: string | null; walletBalance: number } | null;
        activeSession: { id: string; building: string; entryTime: string } | null;
      }>
    >('/staff/parking-sessions/scan', { image }),

  // Staff rejects a check-in/check-out → backend notifies the plate owner.
  reject: (payload: { plateNumber: string; stage: 'check-in' | 'check-out'; reason: string; building?: string }) =>
    api.post<Wrap<{ plateNumber: string; stage: string; notified: boolean }>>(
      '/staff/parking-sessions/reject',
      payload
    ),

  // Camera 2: unified QR resolver — PLT- plate token or account ID.
  resolveQr: (code: string) =>
    api.get<
      Wrap<{
        kind: 'plate' | 'user';
        found?: boolean;
        hasAccount?: boolean;
        plate?: { plateNumber: string; vehicleType: string; brand?: string | null } | null;
        user: { id: string; fullName: string; email: string; phone?: string | null; walletBalance?: number } | null;
        activeSessions?: { id: string; building: string; plateNumber: string; entryTime: string; fee: number }[];
      }>
    >(`/staff/users/resolve-qr/${encodeURIComponent(code)}`),

  checkInReservation: (code: string) =>
    api.post(`/staff/reservations/${code}/check-in`),

  listReservations: (query?: Record<string, string | undefined>) =>
    api.get<Wrap<{ items: StaffReservation[]; total: number }>>('/staff/reservations', { query }),

  // Sessions (namespaced, for backward compat)
  sessions: {
    list: (buildingId: string, q?: Record<string, string | undefined>) =>
      api.get<Wrap<{ items: ParkingSession[] }>>(
        '/staff/parking-sessions/active',
        { query: { ...q, buildingId, populate: 'slot.floor,vehicleType,entryGate,exitGate' } }
      ),

    active: (q?: Record<string, string | undefined>) =>
      api.get<Wrap<{ items: ParkingSession[] }>>('/staff/parking-sessions/active', { query: { ...q, populate: 'slot.floor,vehicleType,entryGate,exitGate' } }),

    search: (plateNumber: string) =>
      api.get<Wrap<{ items: ParkingSession[] }>>('/staff/parking-sessions/search', {
        query: { plate: plateNumber, populate: 'slot.floor,vehicleType,entryGate,exitGate' },
      }),

    detail: (sessionId: string) =>
      api.get<Wrap<ParkingSession>>(`/staff/parking-sessions/${sessionId}`),

    checkIn: (
      _buildingId: string,
      body: { plateNumber: string; vehicleType?: string; gate?: string; forceCheckIn?: boolean }
    ) =>
      api.post<Wrap<{ item: ParkingSession }>>('/staff/parking-sessions/check-in', body),

    checkOut: (_buildingId: string, sessionId: string, body: { paymentMethod: string }) =>
      api.patch<Wrap<{ item: ParkingSession }>>(
        `/staff/parking-sessions/${sessionId}/check-out`,
        body
      ),

    initiatePayment: (sessionId: string) =>
      api.post<Wrap<PaymentData>>(`/staff/parking-sessions/${sessionId}/initiate-payment`, {}),

    getPaymentStatus: (orderCode: number) =>
      api.get<Wrap<PaymentStatus>>(`/staff/parking-sessions/payment/${orderCode}/status`),

    lookupPlate: (plateNumber: string) =>
      api.get<Wrap<PlateInfo>>(`/staff/parking-sessions/lookup-plate/${plateNumber}`),

    lookupUser: (qrCode: string) =>
      api.get<Wrap<{ hasAccount: boolean; user: { id: string; fullName: string; email: string } | null }>>(
        `/staff/users/lookup-qr/${qrCode}`
      ),
  },

  // Reservations
  reservations: {
    list: (query?: Record<string, string | undefined>) =>
      api.get<Wrap<{ items: StaffReservation[]; total: number }>>('/staff/reservations', { query }),

    checkIn: (code: string, body?: { gate?: string }) =>
      api.post<Wrap<{ item: StaffReservation }>>(
        `/staff/reservations/${code}/check-in`,
        body ?? {}
      ),

    expire: (reservationId: string) =>
      api.patch<Wrap<{ item: StaffReservation }>>(
        `/staff/reservations/${reservationId}/expire`,
        {}
      ),
  },

  // Incidents
  incidents: {
    list: (buildingId?: string) =>
      api.get<Wrap<ApiList<StaffIncident>>>('/staff/incidents', {
        query: buildingId ? { buildingId } : undefined,
      }),

    create: (payload: { type: string; target?: string; note?: string; buildingId?: string }) =>
      api.post('/staff/incidents', payload),
  },

  // Wallet Transactions
  walletTransactions: (body: {
    sessionId: string;
    userId: string;
    amount: number;
  }) =>
    api.post<Wrap<{ item: WalletTransaction }>>('/staff/wallet-transactions', body),
};

// ========== HELPER FUNCTIONS ==========

export const extractShifts = (payload: Wrap<{ items: MyShift[] } | MyShift[]>): MyShift[] => {
  return unwrapList(payload);
};

export const extractBuildings = (
  payload: StaffBuilding[] | { items: StaffBuilding[] }
): StaffBuilding[] => {
  if (Array.isArray(payload)) return payload;
  return (payload as { items?: StaffBuilding[] }).items ?? [];
};

export const extractSessions = (payload: unknown): ParkingSession[] => {
  return unwrapList(payload as ApiList<ParkingSession> | Wrap<ApiList<ParkingSession>>);
};

export const extractIncidents = (
  payload: StaffIncident[] | { items: StaffIncident[] }
): StaffIncident[] => {
  if (Array.isArray(payload)) return payload;
  return (payload as { items?: StaffIncident[] }).items ?? [];
};
