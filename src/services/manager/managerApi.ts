import { api } from '@/services/apiClient';

export interface ManagerBuilding {
  _id: string;
  name: string;
  code: string;
  totalFloors: number;
  status: 'active' | 'inactive' | 'maintenance';
  operatingHours: { open: string; close: string };
  pricing: { hourlyRate: number; dailyCap?: number | null; motorcycleMultiplier?: number };
  address?: { fullAddress?: string; street?: string; district?: string; city?: string };
  contactPhone?: string;
}

export interface VehicleType {
  _id: string;
  building: string;
  code: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface Floor {
  _id: string;
  building: string;
  code: string;
  capacity: number;
  status: 'active' | 'inactive' | 'maintenance';
  allowedVehicleTypes: VehicleType[];
}

export interface Gate {
  _id: string;
  building: string;
  code: string;
  name: string;
  direction: 'in' | 'out' | 'both';
  status: 'active' | 'inactive' | 'maintenance';
  allowedVehicleTypes: VehicleType[];
  /** Floors this gate serves (BE Gate.floors). */
  floors?: (Floor | string)[];
}

export interface ParkingSlot {
  _id: string;
  building: string;
  floor: { _id: string; code: string; name: string; levelNumber: number } | string;
  code: string;
  vehicleType?: VehicleType | string | null;
  status: 'available' | 'occupied' | 'reserved' | 'maintenance';
  reservable: boolean;
  note?: string;
}

export interface PricePolicy {
  _id: string;
  building: string;
  vehicleType: VehicleType | string;
  name: string;
  /** Rate type — regular (giờ thường) hoặc peak (cao điểm). */
  type: 'regular' | 'peak';
  hourlyRate: number;
  timeWindow?: { from: string; to: string };
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
}

export interface PolicyPushLog {
  _id: string;
  building: string;
  pricePolicy: { _id: string; name: string };
  actor: { _id: string; fullName: string; email: string; role: string };
  action: string;
  previousValue?: unknown;
  newValue?: unknown;
  createdAt: string;
}

export interface LongTermPackage {
  _id: string;
  building: string;
  vehicleType: VehicleType | string;
  name: string;
  code: string;
  durationDays: number;
  price: number;
  reservedSlots: number;
  description?: string;
  /** Perks shown to users (e.g. "Miễn phí rửa xe", "Ưu tiên chỗ gần thang máy"). */
  benefits?: string[];
  /** When true, subscribers get a dedicated reserved slot. */
  allowDedicatedSlot?: boolean;
  isActive: boolean;
}

export interface Subscription {
  _id: string;
  user: { _id: string; fullName: string; email: string; phone?: string };
  package: { _id: string; name: string; code: string; durationDays: number; price: number };
  plateNumber: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  slot?: {
    _id: string;
    code: string;
    floor?: string | { _id: string; code?: string; name?: string };
  };
  slotReleased?: boolean;
}

export interface ReservationPolicy {
  _id?: string;
  maxHoldMinutes: number;
  refundPercent: number;
  /** % tổng phí thu làm cọc khi đặt; phần còn lại (100 - depositPercent) thu sau checkout. */
  depositPercent: number;
  /** Returned by BE but not editable via the manager upsert (kept for display). */
  bookingFee?: number;
  isActive: boolean;
}

export interface Shift {
  _id: string;
  building: string;
  name: string;
  code: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
}

export interface StaffShift {
  _id: string;
  building: string;
  shift: { _id: string; code: string; name: string; startTime: string; endTime: string };
  staff: { _id: string; fullName: string; email: string; phone?: string };
  /** Gate the manager assigned this staff to for the shift (ra / vào). */
  gate?: { _id: string; code: string; name?: string; direction: 'in' | 'out' | 'both'; status?: string } | null;
  workDate: string;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  note?: string;
}

export interface ShiftRevenue {
  _id: string;
  shift: { _id: string; code: string; name: string };
  staff: { _id: string; fullName: string; email: string };
  workDate: string;
  sessionCount: number;
  totalRevenue: number;
  cashAmount: number;
  walletAmount: number;
  qrAmount: number;
  reconciled: boolean;
}

export interface DashboardOverview {
  slots: {
    total: number;
    available?: number;
    occupied?: number;
    reserved?: number;
    maintenance?: number;
    occupancyRate: number;
  };
  floors: number;
  gates: number;
  sessions: { active: number; today: number };
  subscriptions: { active: number };
  revenue: {
    today: number;
    byMethod: Record<string, { amount: number; count: number }>;
    weekly: { date: string; revenue: number; sessions: number }[];
  };
}

export interface BuildingWallet {
  _id: string;
  building: string;
  balance: number;
  updatedAt: string;
}

export interface BuildingWalletTransaction {
  _id: string;
  building: string;
  type: 'credit' | 'debit';
  reason: string;
  amount: number;
  balanceAfter: number;
  note?: string;
  createdAt: string;
}

export interface DailyRevenueResult {
  date: string;
  totalRevenue: number;
  targetTransfer: number;
  settled: boolean;
}

export interface DailyRevenueSettlement {
  _id: string;
  building: string;
  date: string;
  revenue: number;
  targetAmount: number;
  transferredAmount: number;
  note?: string;
  createdAt: string;
}

export interface AdminSubscriptionPackage {
  _id: string;
  name: string;
  price: number;
  durationDays: number;
  description?: string;
  features?: string[];
  isActive: boolean;
  createdAt?: string;
}

export interface SubscriptionStatus {
  active: boolean;
  endDate: string | null;
  startDate: string | null;
  daysRemaining: number;
  package: { _id: string; name: string; price: number; durationDays: number } | null;
  packageName: string | null;
}

export interface WalletTopUpResult {
  checkoutUrl: string;
  qrCode: string;
  orderCode: number;
}

interface Wrap<T> {
  data: T;
}

const path = (buildingId: string, suffix: string) =>
  `/manager/buildings/${buildingId}${suffix}`;

export const managerApi = {
  listAssignedBuildings: () =>
    api.get<Wrap<ManagerBuilding[] | { items: ManagerBuilding[] }>>('/manager/buildings'),
  updateBuilding: (id: string, body: Partial<ManagerBuilding>) =>
    api.put<Wrap<{ building: ManagerBuilding }>>(`/manager/buildings/${id}`, body),
  /** Update only the building open/close hours (dedicated tab). */
  updateOperatingHours: (buildingId: string, body: { open: string; close: string }) =>
    api.put<Wrap<{ building: ManagerBuilding }>>(path(buildingId, '/operating-hours'), body),

  getDashboard: (buildingId: string) =>
    api.get<Wrap<DashboardOverview>>(path(buildingId, '/dashboard')),

  vehicleTypes: {
    list: (b: string) => api.get<Wrap<{ items: VehicleType[] }>>(path(b, '/vehicle-types')),
    create: (b: string, body: Partial<VehicleType>) =>
      api.post<Wrap<{ item: VehicleType }>>(path(b, '/vehicle-types'), body),
    update: (b: string, id: string, body: Partial<VehicleType>) =>
      api.put<Wrap<{ item: VehicleType }>>(path(b, `/vehicle-types/${id}`), body),
    remove: (b: string, id: string) => api.delete(path(b, `/vehicle-types/${id}`)),
  },

  floors: {
    list: (b: string) => api.get<Wrap<{ items: Floor[] }>>(path(b, '/floors')),
    create: (b: string, body: Partial<Floor> & { allowedVehicleTypes?: string[] }) =>
      api.post<Wrap<{ item: Floor }>>(path(b, '/floors'), body),
    update: (b: string, id: string, body: Partial<Floor> & { allowedVehicleTypes?: string[] }) =>
      api.put<Wrap<{ item: Floor }>>(path(b, `/floors/${id}`), body),
    remove: (b: string, id: string) => api.delete(path(b, `/floors/${id}`)),
  },

  gates: {
    // Manager CRUD cổng và tự đặt thể loại (ra / vào / hai chiều).
    list: (b: string) => api.get<Wrap<{ items: Gate[] }>>(path(b, '/gates')),
    create: (b: string, body: { code: string; name?: string; direction?: Gate['direction']; status?: Gate['status'] }) =>
      api.post<Wrap<{ item: Gate }>>(path(b, '/gates'), body),
    update: (b: string, id: string, body: { code?: string; name?: string; direction?: Gate['direction']; status?: Gate['status'] }) =>
      api.put<Wrap<{ item: Gate }>>(path(b, `/gates/${id}`), body),
    remove: (b: string, id: string) => api.delete(path(b, `/gates/${id}`)),
    updateStatus: (b: string, id: string, status: Gate['status']) =>
      api.patch<Wrap<{ item: Gate }>>(path(b, `/gates/${id}/status`), { status }),
  },

  slots: {
    list: (b: string, q?: Record<string, string | undefined>) =>
      api.get<Wrap<{ items: ParkingSlot[] }>>(path(b, '/slots'), { query: q }),
    create: (b: string, body: Partial<ParkingSlot> & { floor: string }) =>
      api.post<Wrap<{ item: ParkingSlot }>>(path(b, '/slots'), body),
    update: (b: string, id: string, body: Partial<ParkingSlot>) =>
      api.put<Wrap<{ item: ParkingSlot }>>(path(b, `/slots/${id}`), body),
    updateStatus: (b: string, id: string, status: ParkingSlot['status']) =>
      api.patch<Wrap<{ item: ParkingSlot }>>(path(b, `/slots/${id}/status`), { status }),
    remove: (b: string, id: string) => api.delete(path(b, `/slots/${id}`)),
  },

  pricePolicies: {
    list: (b: string) => api.get<Wrap<{ items: PricePolicy[] }>>(path(b, '/price-policies')),
    create: (b: string, body: Partial<PricePolicy>) =>
      api.post<Wrap<{ item: PricePolicy }>>(path(b, '/price-policies'), body),
    update: (b: string, id: string, body: Partial<PricePolicy>) =>
      api.put<Wrap<{ item: PricePolicy }>>(path(b, `/price-policies/${id}`), body),
    deactivate: (b: string, id: string) => api.delete(path(b, `/price-policies/${id}`)),
    pushLogs: (b: string) =>
      api.get<Wrap<{ items: PolicyPushLog[]; pagination: unknown }>>(path(b, '/policy-push-logs')),
  },

  packages: {
    list: (b: string) =>
      api.get<Wrap<{ items: LongTermPackage[] }>>(path(b, '/packages')),
    create: (b: string, body: Partial<LongTermPackage>) =>
      api.post<Wrap<{ item: LongTermPackage }>>(path(b, '/packages'), body),
    update: (b: string, id: string, body: Partial<LongTermPackage>) =>
      api.put<Wrap<{ item: LongTermPackage }>>(path(b, `/packages/${id}`), body),
    remove: (b: string, id: string) => api.delete(path(b, `/packages/${id}`)),
    subscriptions: (b: string, q?: Record<string, string | undefined>) =>
      api.get<Wrap<{ items: Subscription[]; pagination: unknown }>>(path(b, '/subscriptions'), { query: q }),
    releaseSlot: (b: string, id: string) =>
      api.post(path(b, `/subscriptions/${id}/release-slot`)),
  },

  reservationPolicy: {
    get: (b: string) =>
      api.get<Wrap<{ item: ReservationPolicy }>>(path(b, '/reservation-policy')),
    update: (b: string, body: Partial<ReservationPolicy>) =>
      api.put<Wrap<{ item: ReservationPolicy }>>(path(b, '/reservation-policy'), body),
  },

  shifts: {
    list: (b: string) => api.get<Wrap<{ items: Shift[] }>>(path(b, '/shifts')),
    create: (b: string, body: Partial<Shift>) =>
      api.post<Wrap<{ item: Shift }>>(path(b, '/shifts'), body),
    update: (b: string, id: string, body: Partial<Shift>) =>
      api.put<Wrap<{ item: Shift }>>(path(b, `/shifts/${id}`), body),
    remove: (b: string, id: string) => api.delete(path(b, `/shifts/${id}`)),
    listStaff: (b: string) =>
      api.get<Wrap<{ items: { _id: string; fullName: string; email: string; role: string }[] }>>(
        path(b, '/staff')
      ),
    listStaffShifts: (b: string, q?: Record<string, string | undefined>) =>
      api.get<Wrap<{ items: StaffShift[] }>>(path(b, '/staff-shifts'), { query: q }),
    assignStaffShift: (
      b: string,
      body: { staff: string; shift: string; workDate: string; gate?: string | null; note?: string }
    ) => api.post<Wrap<{ item: StaffShift }>>(path(b, '/staff-shifts'), body),
    updateStaffShift: (
      b: string,
      id: string,
      body: { staff?: string; shift?: string; workDate?: string; gate?: string | null; status?: StaffShift['status']; note?: string }
    ) => api.put<Wrap<{ item: StaffShift }>>(path(b, `/staff-shifts/${id}`), body),
    removeStaffShift: (b: string, id: string) =>
      api.delete(path(b, `/staff-shifts/${id}`)),
    revenues: (b: string, q?: Record<string, string | undefined>) =>
      api.get<
        Wrap<{ items: ShiftRevenue[]; totals: { sessionCount: number; totalRevenue: number; cashAmount: number; walletAmount: number; qrAmount: number } }>
      >(path(b, '/shift-revenues'), { query: q }),
  },

  wallet: {
    get: (b: string) =>
      api.get<Wrap<{ wallet: BuildingWallet }>>(path(b, '/wallet')),
    getDailyRevenue: (b: string, date?: string) =>
      api.get<Wrap<DailyRevenueResult>>(path(b, '/wallet/daily-revenue'), {
        query: date ? { date } : undefined,
      }),
    listTransactions: (b: string, q?: Record<string, string | undefined>) =>
      api.get<Wrap<{ items: BuildingWalletTransaction[] }>>(path(b, '/wallet/transactions'), { query: q }),
    listSettlements: (b: string, q?: Record<string, string | undefined>) =>
      api.get<Wrap<{ items: DailyRevenueSettlement[] }>>(path(b, '/wallet/settlements'), { query: q }),

    /** Admin subscription packages a manager can buy (GET /wallet/subscription-packages). */
    listSubscriptionPackages: (b: string) =>
      api.get<Wrap<{ items: AdminSubscriptionPackage[] }>>(path(b, '/wallet/subscription-packages')),

    /** Subscribe to an admin package, paying from the building wallet (POST /wallet/subscribe). */
    subscribe: (b: string, packageId: string) =>
      api.post<Wrap<{ wallet: BuildingWallet; package: AdminSubscriptionPackage; subscription: SubscriptionStatus }>>(
        path(b, '/wallet/subscribe'),
        { packageId }
      ),

    /** PayOS top-up for the building wallet (POST /wallet/topup). */
    initiateTopup: (b: string, amount: number) =>
      api.post<Wrap<WalletTopUpResult>>(path(b, '/wallet/topup'), { amount }),

    /** Manually verify a PayOS top-up (GET /wallet/topup/:orderCode/verify). */
    verifyTopup: (b: string, orderCode: number) =>
      api.get<Wrap<{ status: string; credited: boolean }>>(path(b, `/wallet/topup/${orderCode}/verify`)),
  },

  /** Building admin-subscription status — drives the dashboard gate (GET /subscription). */
  getSubscriptionStatus: (b: string) =>
    api.get<Wrap<SubscriptionStatus>>(path(b, '/subscription')),

};

export const unwrapItems = <T,>(payload: Wrap<{ items: T[] }> | Wrap<T[]> | undefined): T[] => {
  if (!payload?.data) return [];
  const d = payload.data as unknown as { items?: T[] };
  if (Array.isArray(d)) return d as unknown as T[];
  return d.items ?? [];
};
