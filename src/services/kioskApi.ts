import { api } from '@/services/client/apiClient';

// Public gate-kiosk API — a long-term package driver self-admits by scanning the
// vehicle QR, without going through a staff member.

export interface KioskCheckInResult {
  subscription: {
    _id: string;
    plateNumber: string;
    status: string;
    building: string;
  };
  parkingSession: {
    _id: string;
    plateNumber: string;
    entryTime: string;
    status: string;
  };
}

export const kioskApi = {
  packageCheckIn: (payload: {
    qrCode: string;
    gate?: string;
    building?: string;
    plateImage?: string | null;
    portraitImage?: string | null;
  }) =>
    api.post<{ data: KioskCheckInResult }>('/kiosk/package-checkin', payload),
};
