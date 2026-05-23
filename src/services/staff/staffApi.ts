import { api } from '@/services/apiClient';

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
  gate?: { _id: string; code: string; name: string } | null;
  checkIn: string;
  checkOut?: string | null;
  duration?: number | null;
  fee?: number | null;
  paymentMethod?: 'cash' | 'wallet' | 'qr' | null;
  paymentStatus: 'pending' | 'paid' | 'waived';
  status: 'active' | 'completed' | 'cancelled';
}

interface Wrap<T> {
  data: T;
}

export const staffApi = {
  buildings: () =>
    api.get<Wrap<StaffBuilding[] | { items: StaffBuilding[] }>>('/staff/buildings'),

  myShifts: (q?: Record<string, string | undefined>) =>
    api.get<Wrap<{ items: MyShift[] } | MyShift[]>>('/staff/my-shifts', { query: q }),

  sessions: {
    list: (buildingId: string, q?: Record<string, string | undefined>) =>
      api.get<Wrap<{ items: ParkingSession[] }>>(
        `/staff/buildings/${buildingId}/sessions`,
        { query: q }
      ),
    checkIn: (
      buildingId: string,
      body: { plateNumber: string; vehicleType?: string; gate?: string }
    ) =>
      api.post<Wrap<{ item: ParkingSession }>>(
        `/staff/buildings/${buildingId}/sessions/check-in`,
        body
      ),
    checkOut: (buildingId: string, sessionId: string, body: { paymentMethod: string }) =>
      api.patch<Wrap<{ item: ParkingSession }>>(
        `/staff/buildings/${buildingId}/sessions/${sessionId}/check-out`,
        body
      ),
  },
};

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
