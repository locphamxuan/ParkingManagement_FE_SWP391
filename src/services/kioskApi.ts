import { api } from '@/services/client/apiClient';

// Public gate-kiosk API — a reservation driver self-admits by scanning the
// vehicle QR, without going through a staff member.

export interface KioskCheckInResult {
  reservation: {
    _id: string;
    code: string;
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
  reservationCheckIn: (payload: {
    qrCode?: string;
    plateNumber?: string;
    gate?: string;
    plateImage?: string | null;
    portraitImage?: string | null;
  }) =>
    api.post<{ data: KioskCheckInResult }>('/kiosk/reservation-checkin', payload),
};
