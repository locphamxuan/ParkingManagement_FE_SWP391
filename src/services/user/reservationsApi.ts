import { userApi, type Reservation, type UserWalletTransaction } from '@/services/user/userApi';

/**
 * Real BE-backed data layer for the reservation page (replaces the old
 * localStorage mock). Exposes the same function/type surface the page used so
 * the UI code stays unchanged, but every call hits the actual API:
 *  - reservations → /users/reservations (list / create / cancel)
 *  - wallet       → /users/wallet (balance + transactions)
 */

export type ReservationVehicleType = 'car' | 'motorcycle';
export type ParkingSlotVehicleType = ReservationVehicleType | 'all';
export type ReservationStatus = 'active' | 'cancelled' | 'completed';
export type ParkingSlotStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';
export type PaymentType = 'reservation_hold' | 'reservation_refund';
export type PaymentDirection = 'debit' | 'credit';

export interface UserReservationPolicyRecord {
  _id: string;
  buildingId: string;
  minAdvanceMinutes: number;
  maxAdvanceHours: number;
  maxHoldMinutes: number;
  reservableRatio: number;
  refundPercent: number;
  isActive: boolean;
}

export interface UserParkingSlotRecord {
  _id: string;
  buildingId: string;
  code: string;
  floorCode?: string;
  vehicleType: ParkingSlotVehicleType;
  reservable: boolean;
  status: ParkingSlotStatus;
}

export interface UserReservationRecord {
  id: string;
  userId: string;
  buildingId: string;
  buildingName: string;
  slotCode: string;
  plateNumber: string;
  vehicleType: ReservationVehicleType;
  scheduledAt: string;
  durationHours?: number;
  scheduledEndAt?: string;
  createdAt: string;
  status: ReservationStatus;
  amountPaid: number;
  paymentId: string;
  cancelledAt?: string;
  refundAmount?: number;
  refundPercent?: number;
}

export interface UserPaymentRecord {
  id: string;
  userId: string;
  reservationId: string;
  buildingId: string;
  type: PaymentType;
  direction: PaymentDirection;
  method: 'wallet';
  amount: number;
  status: 'completed';
  note: string;
  createdAt: string;
}

export interface UserWalletTransactionRecord {
  id: string;
  userId: string;
  paymentId: string;
  reservationId: string;
  type: PaymentDirection;
  amount: number;
  balanceAfter: number;
  description: string;
  createdAt: string;
}

export interface CreateReservationInput {
  userId: string;
  buildingId: string;
  buildingName: string;
  slotCode: string;
  /** Real parking slot id (preferred). */
  slotId?: string;
  plateNumber: string;
  vehicleType: ReservationVehicleType;
  scheduledAt: string;
  durationHours?: number;
}

export interface CancelReservationResult {
  reservation: UserReservationRecord;
  refundAmount: number;
  refundPercent: number;
}

// ── helpers ──────────────────────────────────────────────────────────────────

const kindFromVehicleType = (vt: Reservation['vehicleType']): ReservationVehicleType => {
  const s = `${vt?.code ?? ''} ${vt?.name ?? ''}`.toLowerCase();
  return /motor|xe m|máy|bike|moto/.test(s) ? 'motorcycle' : 'car';
};

const idOf = (v: unknown): string =>
  typeof v === 'object' && v !== null && '_id' in (v as { _id?: unknown })
    ? String((v as { _id: unknown })._id)
    : String(v ?? '');

// Real reservation status → the page's 3-state model.
const mapStatus = (s: string): ReservationStatus => {
  if (s === 'cancelled' || s === 'expired') return 'cancelled';
  if (s === 'completed') return 'completed';
  return 'active'; // pending | confirmed | checked_in
};

const mapReservation = (r: Reservation): UserReservationRecord => {
  const start = r.startTime;
  const end = r.endTime ?? undefined;
  const durationHours =
    start && end
      ? Math.max(1, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 3_600_000))
      : 1;
  return {
    id: r._id,
    userId: '',
    buildingId: idOf(r.building),
    buildingName: typeof r.building === 'object' ? r.building?.name ?? '' : '',
    slotCode: r.slot?.code ?? '',
    plateNumber: r.plateNumber,
    vehicleType: kindFromVehicleType(r.vehicleType),
    scheduledAt: start,
    scheduledEndAt: end,
    durationHours,
    createdAt: r.createdAt ?? start,
    status: mapStatus(r.status),
    amountPaid: r.fee ?? 0,
    paymentId: '',
    refundPercent: r.refundPercent ?? 0,
    refundAmount: r.refundAmount ?? 0,
  };
};

const REASON_LABELS: Record<string, string> = {
  reservation_deposit: 'Giữ chỗ đặt trước',
  reservation_checkout: 'Thanh toán phí đặt chỗ',
  reservation_refund: 'Hoàn tiền đặt chỗ',
  parking_checkout: 'Thanh toán phí gửi xe',
  topup: 'Nạp tiền vào ví',
};

const txDescription = (t: UserWalletTransaction): string =>
  t.note || REASON_LABELS[t.reason] || t.reason || (t.type === 'credit' ? 'Cộng ví' : 'Trừ ví');

// ── API functions (same names the page imported from the mock) ────────────────

export function slotSupportsVehicle(
  slot: { vehicleType: ParkingSlotVehicleType },
  vehicleType: ReservationVehicleType,
): boolean {
  return slot.vehicleType === 'all' || slot.vehicleType === vehicleType;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function listUserReservations(_userId?: string): Promise<UserReservationRecord[]> {
  const res = await userApi.reservations.list({ limit: 100 });
  const items = (res as { data?: { items?: Reservation[] } })?.data?.items ?? [];
  return items.map(mapReservation);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function listUserWalletTransactions(_userId?: string): Promise<UserWalletTransactionRecord[]> {
  const res = await userApi.wallet.transactions({ limit: 50 });
  const items = (res as { data?: { items?: UserWalletTransaction[] } })?.data?.items ?? [];
  return items.map((t) => ({
    id: t._id,
    userId: '',
    paymentId: '',
    reservationId: '',
    type: t.type === 'credit' ? 'credit' : 'debit',
    amount: t.amount,
    balanceAfter: t.balanceAfter,
    description: txDescription(t),
    createdAt: t.createdAt,
  }));
}

/** Derived from wallet transactions — only the reservation-related ones. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function listUserPayments(_userId?: string): Promise<UserPaymentRecord[]> {
  const res = await userApi.wallet.transactions({ limit: 50 });
  const items = (res as { data?: { items?: UserWalletTransaction[] } })?.data?.items ?? [];
  return items
    .filter((t) => `${t.reason ?? ''}`.includes('reservation'))
    .map((t) => ({
      id: t._id,
      userId: '',
      reservationId: '',
      buildingId: '',
      type: t.type === 'credit' ? 'reservation_refund' : 'reservation_hold',
      direction: t.type === 'credit' ? 'credit' : 'debit',
      method: 'wallet' as const,
      amount: t.amount,
      status: 'completed' as const,
      note: txDescription(t),
      createdAt: t.createdAt,
    }));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function getUserWalletBalance(_userId?: string): Promise<number> {
  const res = await userApi.wallet.get();
  return (res as { data?: { wallet?: { balance?: number } } })?.data?.wallet?.balance ?? 0;
}

export async function createUserReservation(
  input: CreateReservationInput,
): Promise<UserReservationRecord> {
  const durationHours = input.durationHours ?? 1;
  if (!Number.isInteger(durationHours) || durationHours < 1) {
    throw new Error('Thời lượng đặt chỗ phải là số giờ nguyên (1, 2, 3… giờ).');
  }
  const start = new Date(input.scheduledAt);
  if (Number.isNaN(start.getTime())) throw new Error('Thời gian đặt chỗ không hợp lệ.');
  const end = new Date(start.getTime() + durationHours * 3_600_000);

  // Resolve the building's vehicleTypeId matching the selected kind (car/moto).
  let vehicleTypeId: string | undefined;
  try {
    const vtRes = await userApi.buildings.vehicleTypes(input.buildingId);
    const vts = (vtRes as { data?: { items?: { _id: string; code: string; name: string }[] } })?.data?.items ?? [];
    const match = vts.find((v) => {
      const s = `${v.code} ${v.name}`.toLowerCase();
      const kind = /motor|xe m|máy|bike|moto/.test(s) ? 'motorcycle' : 'car';
      return kind === input.vehicleType;
    });
    vehicleTypeId = match?._id;
  } catch {
    /* fall back to sending the kind string; BE resolves it */
  }

  const res = await userApi.reservations.create({
    plateNumber: input.plateNumber,
    buildingId: input.buildingId,
    ...(vehicleTypeId ? { vehicleTypeId } : { vehicleType: input.vehicleType }),
    startTime: start.toISOString(),
    endTime: end.toISOString(),
    ...(input.slotId ? { slotId: input.slotId } : {}),
  });

  const data = (res as { data?: { reservation?: Reservation; depositAmount?: number } })?.data;
  const reservation = data?.reservation;
  if (!reservation) throw new Error('Không tạo được lượt đặt chỗ.');
  const mapped = mapReservation(reservation);
  // Deposit charged at booking = the amount actually held in the wallet.
  mapped.amountPaid = data?.depositAmount ?? mapped.amountPaid;
  return mapped;
}

export async function cancelUserReservation(
  reservationId: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _userId?: string,
): Promise<CancelReservationResult> {
  const res = await userApi.reservations.cancel(reservationId);
  const data = (res as { data?: { reservation?: Reservation; refund?: number; refundPercent?: number } })?.data;
  const reservation = data?.reservation;
  const mapped = reservation
    ? mapReservation(reservation)
    : ({ id: reservationId, status: 'cancelled' } as UserReservationRecord);
  // Hoàn tiền theo % do manager cấu hình (BE trả về refund + refundPercent).
  return {
    reservation: mapped,
    refundAmount: data?.refund ?? 0,
    refundPercent: data?.refundPercent ?? 0,
  };
}

/** Kept for signature compatibility — the page derives bounds from defaults. */
export async function listReservationPolicies(): Promise<UserReservationPolicyRecord[]> {
  return [];
}

/** Fallback only — the page loads slots per-floor via userApi. */
export async function listParkingSlotsByBuilding(): Promise<UserParkingSlotRecord[]> {
  return [];
}
