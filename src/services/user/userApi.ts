import { api } from '@/services/apiClient';

// ========== INTERFACES ==========

export interface Building {
  _id: string;
  name: string;
  code: string;
  totalFloors: number;
  status: 'active' | 'inactive' | 'maintenance';
  operatingHours: { open: string; close: string };
  pricing: { hourlyRate: number; dailyCap?: number | null; motorcycleMultiplier?: number };
  address?: { fullAddress?: string };
  contactPhone?: string;
}

export interface VehicleType {
  _id: string;
  code: string;
  name: string;
}

export interface ParkingSlot {
  _id: string;
  code: string;
  floor?: number;
  status?: 'available' | 'occupied' | 'reserved' | 'maintenance';
  vehicleType?: { _id: string; name: string; code: string } | null;
  reservable?: boolean;
}

export interface FloorAvailability {
  _id: string;
  code: string;
  name: string;
  levelNumber: number;
  capacity: number;
  status: 'active' | 'inactive' | 'maintenance';
  availableSlots: number;
  occupiedSlots: number;
  reservedSlots: number;
  totalSlots: number;
}

export interface Gate {
  _id: string;
  code: string;
  name: string;
}

export interface Reservation {
  _id: string;
  code: string;
  plateNumber: string;
  vehicleType?: VehicleType | null;
  slot?: ParkingSlot | null;
  building: Building;
  status: 'pending' | 'confirmed' | 'checked_in' | 'expired' | 'cancelled' | 'completed';
  startTime: string;
  endTime?: string | null;
  fee?: number;
  refundPercent?: number;
  refundAmount?: number;
  estimatedFee?: number;
  createdAt?: string;
  updatedAt?: string;
  parkingSession?: {
    _id: string;
    fee: number;
    status: string;
    entryTime: string;
    exitTime?: string | null;
    paymentStatus?: string;
  } | null;
}

export interface ParkingHistory {
  _id: string;
  plateNumber: string;
  vehicleType?: VehicleType | null;
  slot?: ParkingSlot | null;
  gate?: Gate | null;
  building: Building;
  checkIn: string;
  checkOut?: string | null;
  duration?: number | null;
  fee?: number | null;
  paymentMethod?: 'cash' | 'wallet' | 'qr' | null;
  paymentStatus: 'pending' | 'paid' | 'waived';
  status: 'active' | 'completed' | 'cancelled';
  createdAt?: string;
  entryGate?: Gate | null;
  exitGate?: Gate | null;
}

export interface LongTermPackage {
  _id: string;
  code: string;
  name: string;
  description?: string;
  building: Building | { _id: string; name: string; code?: string };
  vehicleType?: VehicleType | string | null;
  durationDays: number;
  price: number;
  reservedSlots?: number;
  allowDedicatedSlot?: boolean;
  benefits?: string[];
  isActive?: boolean;
  // ── Legacy/optional FE-only fields (not returned by the backend) ──
  discountPercentage?: number;
  maxVehicles?: number;
  features?: string[];
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface LongTermSubscription {
  _id: string;
  package: LongTermPackage;
  user?: { _id: string; fullName: string; email: string } | string;
  building?: Building | { _id: string; name: string } | string;
  /** Backend stores a single plate per subscription. */
  plateNumber?: string;
  /** Dedicated parking slot assigned to this subscription. */
  slot?: ParkingSlot | null;
  startDate: string;
  endDate: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  cancelReason?: 'change_slot' | 'change_vehicle' | 'no_longer_needed' | 'pricing_issue' | 'other' | null;
  cancelNote?: string | null;
  // ── Legacy/optional FE-only fields ──
  code?: string;
  linkedPlates?: string[];
  paymentMethod?: 'wallet' | 'card' | 'cash';
  price?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type UserVehicleType = 'motorcycle' | 'car' | 'suv' | 'truck' | 'other';

export interface LicensePlate {
  _id: string;
  plateNumber: string;
  vehicleType: UserVehicleType;
  isDefault: boolean;
  qrCode?: string;
}

export interface UserProfile {
  _id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'staff' | 'user';
  walletBalance?: number;
  licensePlates?: LicensePlate[];
}

export interface ReservationEstimate {
  estimatedFee: number;
  depositAmount: number;
  remainingFee: number;
  /** % cọc khi đặt (do manager cấu hình). */
  depositPercent?: number;
  /** % còn lại thu sau checkout = 100 - depositPercent. */
  remainingPercent?: number;
  hourlyRate: number;
  hours: number;
  regularHours: number;
  peakHours: number;
  peakRate: number;
  /** Thời lượng thực của khung đặt chỗ (phút). */
  durationMinutes?: number;
  /** True nếu phí bị nâng lên mức tối thiểu (lượt rất ngắn). */
  minimumApplied?: boolean;
}

export interface ReservationCreateResult {
  reservation: Reservation;
  depositAmount: number;
  estimatedFee: number;
}

export interface UserWallet {
  _id: string;
  user: string;
  balance: number;
  updatedAt: string;
}

export interface UserWalletTransaction {
  _id: string;
  type: 'credit' | 'debit';
  reason: string;
  amount: number;
  balanceAfter: number;
  note?: string;
  createdAt: string;
}

export interface Feedback {
  _id: string;
  user: { _id: string; fullName: string; email: string; avatar?: string | null };
  building: { _id: string; name: string; code: string };
  parkingSession: { _id: string; plateNumber: string; entryTime: string; exitTime: string; fee: number; status: string };
  rating: number;
  comment: string;
  portraitImageUrl?: string | null;
  plateImageUrl?: string | null;
  status: 'pending' | 'resolved';
  staffReply?: string | null;
  repliedBy?: { _id: string; fullName: string; role: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  user: string;
  type: 'checkin_rejected' | 'checkout_rejected' | 'general';
  title: string;
  message: string;
  plateNumber?: string | null;
  building?: string | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
}

export type LongTermPaymentMethod = 'wallet' | 'qr';

export interface WalletTopUpResult {
  checkoutUrl: string;
  orderCode: number;
  amount: number;
}

interface Wrap<T> {
  data: T;
}

interface ListResult<T> {
  items: T[];
  pagination?: { page: number; limit: number; total: number; totalPages: number };
}

// ========== API METHODS ==========

export const userApi = {
  // ========== RESERVATIONS ==========
  reservations: {
    /** Estimate fee + 15% deposit before booking (GET /users/reservations/estimate). */
    estimate: (query: {
      buildingId: string;
      vehicleTypeId: string;
      startTime: string;
      endTime: string;
    }) => api.get<Wrap<ReservationEstimate>>('/users/reservations/estimate', { query }),

    /** Get list of user's reservations */
    list: (query?: { status?: string; limit?: number; page?: number }) =>
      api.get<Wrap<ListResult<Reservation>>>('/users/reservations', { query }),

    /** Get reservation detail */
    get: (id: string) =>
      api.get<Wrap<{ reservation: Reservation }>>(`/users/reservations/${id}`),

    /** Create new reservation */
    create: (body: {
      plateNumber: string;
      buildingId: string;
      vehicleTypeId?: string;
      vehicleType?: string;
      startTime: string;
      endTime?: string;
      slotId?: string;
    }) =>
      api.post<Wrap<{ reservation: Reservation }>>('/users/reservations', body),

    /** Cancel reservation — BE hoàn refundPercent% tiền cọc vào ví. */
    cancel: (id: string) =>
      api.delete<Wrap<{ reservation: Reservation; refund: number; amountPaid: number; refundPercent: number }>>(
        `/users/reservations/${id}`,
      ),
  },

  // ========== PARKING HISTORY ==========
  parkingHistory: {
    /** Get user's parking history */
    list: (query?: { limit?: number; page?: number; fromDate?: string; toDate?: string }) =>
      api.get<Wrap<ListResult<ParkingHistory>>>('/users/parking-history', { query }),

    /** Get parking session detail */
    get: (id: string) =>
      api.get<Wrap<{ session: ParkingHistory }>>(`/users/parking-history/${id}`),
  },

  // ========== LONG-TERM PACKAGES ==========
  longTermPackages: {
    /** Get list of available long-term packages (BE returns { packages }). */
    list: (query?: { buildingId?: string; limit?: number; page?: number }) =>
      api.get<Wrap<{ packages: LongTermPackage[] }>>('/users/long-term/packages', { query }),

    /**
     * Get package detail. NOTE: the backend has no GET /packages/:id endpoint;
     * kept for the demo hook only — prefer filtering the list result.
     */
    get: (id: string) =>
      api.get<Wrap<{ package: LongTermPackage }>>(`/users/long-term/packages/${id}`),
  },

  // ========== LONG-TERM SUBSCRIPTIONS ==========
  longTermSubscriptions: {
    /** Get user's active subscriptions */
    list: (query?: { status?: string; limit?: number; page?: number }) =>
      api.get<Wrap<ListResult<LongTermSubscription>>>('/users/long-term/subscriptions', {
        query,
      }),

    /** Get subscription detail */
    get: (id: string) =>
      api.get<Wrap<{ subscription: LongTermSubscription }>>(`/users/long-term/subscriptions/${id}`),

    /** Subscribe to a long-term package (BE expects { packageId, plateNumber, slotId?, startDate? }). */
    create: (body: { packageId: string; plateNumber: string; slotId?: string; startDate?: string }) =>
      api.post<Wrap<{ subscription: LongTermSubscription }>>(
        '/users/long-term/subscriptions',
        body
      ),

    /** Cancel subscription */
    cancel: (id: string, body: { cancelReason: string; cancelNote?: string }) =>
      api.post<Wrap<{ subscription: LongTermSubscription }>>(
        `/users/long-term/subscriptions/${id}/cancel`,
        body
      ),
  },

  // ========== BUILDINGS ==========
  buildings: {
    /** Get list of all active buildings */
    list: (query?: { limit?: number; page?: number }) =>
      api.get<Wrap<ListResult<Building>>>('/users/buildings', { query }),

    /** Get vehicle types for a building */
    vehicleTypes: (buildingId: string) =>
      api.get<Wrap<ListResult<VehicleType>>>(`/users/buildings/${buildingId}/vehicle-types`),

    /** Get floors for a building with live availability counts (BE returns { building, floors }). */
    floors: (buildingId: string, query?: { vehicleTypeId?: string }) =>
      api.get<Wrap<{ building: { _id: string; code: string; name: string }; floors: FloorAvailability[] }>>(
        `/users/buildings/${buildingId}/floors`,
        { query }
      ),

    /** Get parking slots for a building floor (BE returns { floor, slots }). */
    slots: (buildingId: string, floorId: string) =>
      api.get<Wrap<{ floor: { _id: string; name: string; code: string }; slots: ParkingSlot[] }>>(
        `/users/buildings/${buildingId}/floors/${floorId}/slots`
      ),
  },

  // ========== PROFILE ==========
  profile: {
    /** Update own profile (PUT /users/profile). */
    update: (body: { fullName?: string; phone?: string; avatar?: string }) =>
      api.put<Wrap<{ user: UserProfile }>>('/users/profile', body),

    changePassword: (body: { currentPassword: string; newPassword: string }) =>
      api.put<{ data: { message: string } }>('/users/profile/password', body),
  },

  // ========== LICENSE PLATES ==========
  licensePlates: {
    /** GET /users/license-plates → { licensePlates }. */
    list: () =>
      api.get<Wrap<{ licensePlates: LicensePlate[] }>>('/users/license-plates'),

    /** POST /users/license-plates → returns the full updated list. */
    add: (body: { plateNumber: string; vehicleType?: UserVehicleType }) =>
      api.post<Wrap<{ licensePlates: LicensePlate[] }>>('/users/license-plates', body),

    /** PUT /users/license-plates/:plateId (vehicleType only). */
    update: (plateId: string, body: { vehicleType: UserVehicleType }) =>
      api.put<Wrap<{ licensePlates: LicensePlate[] }>>(`/users/license-plates/${plateId}`, body),

    /** DELETE /users/license-plates/:plateId. */
    remove: (plateId: string) =>
      api.delete<Wrap<{ licensePlates: LicensePlate[] }>>(`/users/license-plates/${plateId}`),

    /** PATCH /users/license-plates/:plateId/default. */
    setDefault: (plateId: string) =>
      api.patch<Wrap<{ licensePlates: LicensePlate[] }>>(`/users/license-plates/${plateId}/default`),
  },

  // ========== WALLET ==========
  wallet: {
    get: () =>
      api.get<Wrap<{ wallet: UserWallet }>>('/users/wallet'),

    transactions: (query?: { limit?: number; page?: number }) =>
      api.get<Wrap<ListResult<UserWalletTransaction>>>('/users/wallet/transactions', { query }),

    topup: (body: { amount: number }) =>
      api.post<Wrap<WalletTopUpResult>>('/users/wallet/topup', body),

    verifyTopup: (orderCode: number) =>
      api.get<Wrap<{ status: string; settled: boolean }>>(`/users/wallet/topup/${orderCode}/status`),
  },

  // ========== FEEDBACK ==========
  feedbacks: {
    create: (body: {
      buildingId: string;
      parkingSessionId: string;
      rating: number;
      comment: string;
      portraitImageUrl?: string | null;
      plateImageUrl?: string | null;
    }) => api.post<Wrap<{ feedback: Feedback }>>('/users/feedbacks', body),

    list: (query?: { status?: 'pending' | 'resolved'; rating?: number; limit?: number; page?: number }) =>
      api.get<Wrap<ListResult<Feedback>>>('/users/feedbacks/me', { query }),

    listAll: (query?: { buildingId?: string; rating?: number; limit?: number; page?: number; status?: string }) =>
      api.get<Wrap<ListResult<Feedback>>>('/users/feedbacks', { query }),
  },

  // ========== NOTIFICATIONS ==========
  notifications: {
    list: () => api.get<Wrap<{ items: Notification[]; unread: number }>>('/users/notifications'),
    
    markAsRead: (id: string) => api.patch<Wrap<Notification>>(`/users/notifications/${id}/read`),

    markAllRead: () => api.patch<Wrap<{ ok: boolean }>>('/users/notifications/read-all'),
  },
};
