import type { ParkingSlot } from '@/services/manager/managerApi';

export const SLOT_STATUSES: ParkingSlot['status'][] = [
  'available',
  'occupied',
  'reserved',
  'maintenance',
];

export const slotStatusLabel = (s: ParkingSlot['status']): string =>
  s === 'available' ? 'Available' : s === 'occupied' ? 'Occupied' : s === 'reserved' ? 'Reserved' : 'Maintenance';
