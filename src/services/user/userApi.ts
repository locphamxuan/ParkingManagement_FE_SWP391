import { api } from '@/services/client/apiClient';
import type {
  Vehicle,
  VehicleCatalog,
  VehicleCategoryCode,
  VehicleInput,
  VehicleUpdateInput,
} from '@/services/vehicleService';

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

/** Danh mục loại xe RIÊNG của một tòa nhà (manager tự đặt tên/mã). */
export interface VehicleType {
  _id: string;
  code: string;
  name: string;
  /**
   * Thể loại xe chuẩn của hệ thống mà danh mục này đại diện. Nhờ trường này mà việc
   * khớp xe của khách với danh mục của tòa là so sánh dữ liệu, không phải đoán tên.
   */
  category?: VehicleCategoryCode;
}

export interface ParkingSlot {
  _id: string;
  code: string;
  /** Số tầng (legacy) hoặc object tầng đã populate (name/code). */
  floor?: number | { _id: string; name?: string; code?: string } | null;
  status?: 'available' | 'occupied' | 'reserved' | 'maintenance';
  vehicleType?: { _id: string; name: string; code: string } | null;
  reservable?: boolean;
  /** Chỉ chọn được slot khi selectable = true (available & không bị gói nào giữ). */
  selectable?: boolean;
  /** Chủ slot nếu đang bị một gói dài hạn giữ (biển số + tên tài khoản). */
  owner?: { plateNumber: string; accountName: string | null } | null;
}

export interface FloorAvailability {
  _id: string;
  code: string;
  name: string;
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
  paymentMethod?: 'cash' | 'wallet' | 'qr' | 'long_term' | null;
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
  /** Số giờ đỗ miễn phí tối đa/ngày (vượt sẽ tính phí theo giờ). 0 = không giới hạn. */
  maxHoursPerDay?: number;
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
  startDate: string;
  endDate: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  cancelReason?: 'change_vehicle' | 'no_longer_needed' | 'pricing_issue' | 'other' | null;
  cancelNote?: string | null;
  /** Slot cố định đã chọn lúc mua gói. null/undefined = gói floating (staff gán slot lúc check-in). */
  slot?: { _id: string; code?: string } | null;
  /** Snapshot % và số tiền đã hoàn lúc hủy (theo refund policy tại thời điểm đó). */
  refundPercent?: number | null;
  refundAmount?: number | null;
  // ── Legacy/optional FE-only fields ──
  code?: string;
  linkedPlates?: string[];
  paymentMethod?: 'wallet' | 'card' | 'cash';
  price?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserProfile {
  _id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatar?: string;
  role: 'admin' | 'manager' | 'staff' | 'user';
  walletBalance?: number;
  // Phương tiện là tài nguyên riêng (GET /users/vehicles), không đính kèm hồ sơ.
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
  type:
    | 'checkin_rejected'
    | 'checkout_rejected'
    | 'subscription_expiring'
    | 'subscription_expired'
    | 'subscription_slot_released'
    | 'subscription_overage'
    | 'incident_update'
    | 'incident_resolved'
    | 'feedback_reply'
    | 'general';
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

export type UserIncidentType =
  | 'slot_occupied'
  | 'slot_blocked'
  | 'vehicle_damaged'
  | 'facility_issue'
  | 'wrong_scan'
  | 'payment_dispute'
  | 'lost_ticket'
  | 'security'
  | 'other';

export interface UserIncident {
  _id: string;
  code: string;
  type: string;
  note?: string;
  target?: string;
  violatorPlate?: string;
  resolutionNote?: string;
  severity: string;
  status: string;
  building?: { _id: string; code?: string; name?: string } | null;
  slot?: { _id: string; code?: string } | null;
  createdAt: string;
  resolvedAt?: string | null;
}

// ========== API METHODS ==========

export const userApi = {
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

    /** Subscribe to a long-term package — always starts immediately at purchase time.
     * slotId tùy chọn: chọn slot cố định (dãy subscriber). */
    create: (body: { packageId: string; plateNumber: string; slotId?: string }) =>
      api.post<Wrap<{ subscription: LongTermSubscription }>>(
        '/users/long-term/subscriptions',
        body
      ),

    /** Renew (gia hạn) — cộng dồn endDate, trừ ví (POST /subscriptions/:id/renew). */
    renew: (id: string) =>
      api.post<Wrap<{ subscription: LongTermSubscription }>>(
        `/users/long-term/subscriptions/${id}/renew`,
        {}
      ),

    /** Cancel subscription — BE hoàn refundPercent% giá gói vào ví (theo refund policy của building). */
    cancel: (id: string, body: { cancelReason: string; cancelNote?: string }) =>
      api.post<Wrap<{ subscription: LongTermSubscription; refundAmount: number; refundPercent: number }>>(
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

    /** Get floors for a building with live availability counts (BE returns { building, floors }).
     *  usage='subscriber' → chỉ đếm ô dãy gói (mua gói chọn slot cố định). */
    floors: (buildingId: string, query?: { vehicleTypeId?: string; usage?: 'subscriber' }) =>
      api.get<Wrap<{ building: { _id: string; code: string; name: string }; floors: FloorAvailability[] }>>(
        `/users/buildings/${buildingId}/floors`,
        { query }
      ),

    /** Get parking slots for a building floor (BE returns { floor, slots }).
     *  usage='subscriber' → chỉ trả ô dãy gói đúng loại xe (mua gói chọn slot cố định). */
    slots: (buildingId: string, floorId: string, query?: { usage?: 'subscriber'; vehicleTypeId?: string }) =>
      api.get<Wrap<{ floor: { _id: string; name: string; code: string }; slots: ParkingSlot[] }>>(
        `/users/buildings/${buildingId}/floors/${floorId}/slots`,
        { query }
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

  // ========== VEHICLES ==========
  // Lớp mỏng bám sát endpoint; state dùng trong UI nằm ở `store/vehicleStore`.
  vehicles: {
    /** GET /users/vehicle-categories → danh mục thể loại xe + hạn dùng QR. */
    categories: () =>
      api.get<Wrap<VehicleCatalog>>('/users/vehicle-categories'),

    /** GET /users/vehicles → { vehicles }. Mã QR quá hạn được backend cấp lại tại đây. */
    list: () => api.get<Wrap<{ vehicles: Vehicle[] }>>('/users/vehicles'),

    /** GET /users/vehicles/:vehicleId. */
    get: (vehicleId: string) =>
      api.get<Wrap<{ vehicle: Vehicle }>>(`/users/vehicles/${vehicleId}`),

    /** POST /users/vehicles → xe vừa tạo. */
    add: (body: VehicleInput) => api.post<Wrap<{ vehicle: Vehicle }>>('/users/vehicles', body),

    /** PUT /users/vehicles/:vehicleId — sửa loại xe và mô tả (biển số không đổi được). */
    update: (vehicleId: string, body: VehicleUpdateInput) =>
      api.put<Wrap<{ vehicle: Vehicle }>>(`/users/vehicles/${vehicleId}`, body),

    /** DELETE /users/vehicles/:vehicleId → danh sách còn lại. */
    remove: (vehicleId: string) =>
      api.delete<Wrap<{ vehicles: Vehicle[] }>>(`/users/vehicles/${vehicleId}`),

    /** PATCH /users/vehicles/:vehicleId/default → danh sách sau khi đổi. */
    setDefault: (vehicleId: string) =>
      api.patch<Wrap<{ vehicles: Vehicle[] }>>(`/users/vehicles/${vehicleId}/default`),

    /** POST /users/vehicles/:vehicleId/qr/refresh — huỷ token cũ, cấp token mới. */
    refreshQr: (vehicleId: string) =>
      api.post<Wrap<{ vehicle: Vehicle }>>(`/users/vehicles/${vehicleId}/qr/refresh`),
  },

  // ========== WALLET ==========
  wallet: {
    get: () =>
      api.get<Wrap<{ walletBalance: number }>>('/users/wallet'),

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

    remove: (id: string) =>
      api.delete<Wrap<{ id: string }>>(`/users/feedbacks/${id}`),
  },

  // ========== NOTIFICATIONS ==========
  notifications: {
    list: () => api.get<Wrap<{ items: Notification[]; unread: number }>>('/users/notifications'),

    markAsRead: (id: string) => api.patch<Wrap<Notification>>(`/users/notifications/${id}/read`),

    markAllRead: () => api.patch<Wrap<{ ok: boolean }>>('/users/notifications/read-all'),
  },

  // ========== INCIDENTS (báo cáo sự cố) ==========
  incidents: {
    create: (body: {
      type: UserIncidentType;
      note?: string;
      slotId?: string;
      buildingId?: string;
      violatorPlate?: string;
    }) => api.post<Wrap<{ item: UserIncident }>>('/users/incidents', body),

    listMine: (query?: { status?: string; limit?: number; page?: number }) =>
      api.get<Wrap<ListResult<UserIncident>>>('/users/incidents/me', { query }),
  },
};
