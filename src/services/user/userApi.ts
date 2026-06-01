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
  status: 'pending' | 'confirmed' | 'checked_in' | 'expired' | 'cancelled';
  reservationDate: string;
  expiresAt: string;
  createdAt?: string;
  updatedAt?: string;
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
}

export interface LongTermPackage {
  _id: string;
  code: string;
  name: string;
  description?: string;
  building: Building;
  duration: number; // in days
  price: number;
  discountPercentage?: number;
  maxVehicles?: number;
  features?: string[];
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface LongTermSubscription {
  _id: string;
  code: string;
  package: LongTermPackage;
  user: { _id: string; fullName: string; email: string };
  linkedPlates: string[];
  startDate: string;
  endDate: string;
  status: 'active' | 'expired' | 'cancelled';
  paymentMethod?: 'wallet' | 'card' | 'cash';
  price: number;
  createdAt?: string;
  updatedAt?: string;
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
      slotId?: string;
      reservationDate: string;
    }) =>
      api.post<Wrap<{ reservation: Reservation }>>('/users/reservations', body),

    /** Cancel reservation */
    cancel: (id: string) =>
      api.delete<Wrap<{ reservation: Reservation }>>(`/users/reservations/${id}`),
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
    /** Get list of available long-term packages */
    list: (query?: { buildingId?: string; limit?: number; page?: number }) =>
      api.get<Wrap<ListResult<LongTermPackage>>>('/users/long-term/packages', { query }),

    /** Get package detail */
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

    /** Subscribe to a long-term package */
    create: (body: {
      packageId: string;
      linkedPlates: string[];
      paymentMethod?: 'wallet' | 'card' | 'cash';
    }) =>
      api.post<Wrap<{ subscription: LongTermSubscription }>>(
        '/users/long-term/subscriptions',
        body
      ),

    /** Cancel subscription */
    cancel: (id: string) =>
      api.delete<Wrap<{ subscription: LongTermSubscription }>>(
        `/users/long-term/subscriptions/${id}`
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

    /** Get floors for a building */
    floors: (buildingId: string) =>
      api.get<Wrap<ListResult<{ code: string; number: number }>>>(`/users/buildings/${buildingId}/floors`),

    /** Get parking slots for a building floor */
    slots: (buildingId: string, floorId: string, query?: { limit?: number; page?: number }) =>
      api.get<Wrap<ListResult<ParkingSlot>>>(`/users/buildings/${buildingId}/floors/${floorId}/slots`, {
        query,
      }),
  },
};
