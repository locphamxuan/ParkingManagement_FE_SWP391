export type ReservationVehicleType = 'car' | 'motorcycle';
export type ParkingSlotVehicleType = ReservationVehicleType | 'all';
export type ReservationStatus = 'active' | 'cancelled' | 'completed';
export type ParkingSlotStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

export interface UserReservationPolicyRecord {
  _id: string;
  buildingId: string;
  minAdvanceMinutes: number;
  maxAdvanceHours: number;
  maxHoldMinutes: number;
  reservableRatio: number;
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
  createdAt: string;
  status: ReservationStatus;
}

export interface CreateReservationInput {
  userId: string;
  buildingId: string;
  buildingName: string;
  slotCode: string;
  plateNumber: string;
  vehicleType: ReservationVehicleType;
  scheduledAt: string;
}

const RESERVATION_STORAGE_KEY = 'pbms.reservations';

const RESERVATION_POLICY_MOCK_DATA: UserReservationPolicyRecord[] = [
  {
    _id: 'rp-demo-1',
    buildingId: 'demo-building-1',
    minAdvanceMinutes: 15,
    maxAdvanceHours: 72,
    maxHoldMinutes: 30,
    reservableRatio: 0.35,
    isActive: true,
  },
  {
    _id: 'rp-demo-2',
    buildingId: 'demo-building-2',
    minAdvanceMinutes: 10,
    maxAdvanceHours: 48,
    maxHoldMinutes: 20,
    reservableRatio: 0.4,
    isActive: true,
  },
];

const PARKING_SLOT_MOCK_DATA: UserParkingSlotRecord[] = [
  { _id: 'slot-b1-a01', buildingId: 'demo-building-1', code: 'A-01', floorCode: 'F1', vehicleType: 'all', reservable: false, status: 'occupied' },
  { _id: 'slot-b1-a02', buildingId: 'demo-building-1', code: 'A-02', floorCode: 'F1', vehicleType: 'car', reservable: true, status: 'available' },
  { _id: 'slot-b1-a03', buildingId: 'demo-building-1', code: 'A-03', floorCode: 'F1', vehicleType: 'motorcycle', reservable: true, status: 'available' },
  { _id: 'slot-b1-a04', buildingId: 'demo-building-1', code: 'A-04', floorCode: 'F1', vehicleType: 'all', reservable: true, status: 'available' },
  { _id: 'slot-b1-a05', buildingId: 'demo-building-1', code: 'A-05', floorCode: 'F1', vehicleType: 'all', reservable: false, status: 'maintenance' },

  { _id: 'slot-b2-a01', buildingId: 'demo-building-2', code: 'A-01', floorCode: 'B1', vehicleType: 'all', reservable: false, status: 'occupied' },
  { _id: 'slot-b2-a02', buildingId: 'demo-building-2', code: 'A-02', floorCode: 'B1', vehicleType: 'all', reservable: true, status: 'available' },
  { _id: 'slot-b2-a03', buildingId: 'demo-building-2', code: 'A-03', floorCode: 'B1', vehicleType: 'car', reservable: true, status: 'available' },
  { _id: 'slot-b2-a04', buildingId: 'demo-building-2', code: 'A-04', floorCode: 'B1', vehicleType: 'motorcycle', reservable: true, status: 'reserved' },
  { _id: 'slot-b2-a05', buildingId: 'demo-building-2', code: 'A-05', floorCode: 'B1', vehicleType: 'all', reservable: false, status: 'maintenance' },
];

function randomReservationId(): string {
  return `RSV-${Math.floor(1000 + Math.random() * 9000)}`;
}

function defaultScheduleValue(): string {
  const next = new Date(Date.now() + 30 * 60_000);
  next.setSeconds(0, 0);
  const tzOffsetMs = next.getTimezoneOffset() * 60_000;
  return new Date(next.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

function parseStoredReservations(raw: string | null): UserReservationRecord[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item, index): UserReservationRecord | null => {
        if (!item || typeof item !== 'object') return null;

        const id =
          typeof (item as { id?: unknown }).id === 'string'
            ? (item as { id: string }).id
            : `RSV-LEGACY-${index + 1}`;
        const userId =
          typeof (item as { userId?: unknown }).userId === 'string'
            ? (item as { userId: string }).userId
            : '';
        const buildingId =
          typeof (item as { buildingId?: unknown }).buildingId === 'string'
            ? (item as { buildingId: string }).buildingId
            : 'legacy-building';
        const buildingName =
          typeof (item as { buildingName?: unknown }).buildingName === 'string'
            ? (item as { buildingName: string }).buildingName
            : 'Tòa nhà mặc định';
        const slotCode =
          typeof (item as { slotCode?: unknown }).slotCode === 'string'
            ? (item as { slotCode: string }).slotCode
            : 'A-02';
        const plateNumber =
          typeof (item as { plateNumber?: unknown }).plateNumber === 'string'
            ? (item as { plateNumber: string }).plateNumber
            : '--';
        const vehicleType: ReservationVehicleType =
          (item as { vehicleType?: unknown }).vehicleType === 'motorcycle' ? 'motorcycle' : 'car';
        const scheduledAt =
          typeof (item as { scheduledAt?: unknown }).scheduledAt === 'string'
            ? (item as { scheduledAt: string }).scheduledAt
            : defaultScheduleValue();
        const createdAt =
          typeof (item as { createdAt?: unknown }).createdAt === 'string'
            ? (item as { createdAt: string }).createdAt
            : new Date().toISOString();
        const statusRaw = (item as { status?: string }).status;
        const status: ReservationStatus =
          statusRaw === 'cancelled' || statusRaw === 'completed' ? statusRaw : 'active';

        if (!userId) return null;

        return {
          id,
          userId,
          buildingId,
          buildingName,
          slotCode,
          plateNumber,
          vehicleType,
          scheduledAt,
          createdAt,
          status,
        };
      })
      .filter((item): item is UserReservationRecord => Boolean(item));
  } catch {
    return [];
  }
}

function loadReservationsStore(): UserReservationRecord[] {
  return parseStoredReservations(localStorage.getItem(RESERVATION_STORAGE_KEY));
}

function saveReservationsStore(rows: UserReservationRecord[]): void {
  localStorage.setItem(RESERVATION_STORAGE_KEY, JSON.stringify(rows));
}

export function slotSupportsVehicle(
  slot: UserParkingSlotRecord,
  vehicleType: ReservationVehicleType,
): boolean {
  return slot.vehicleType === 'all' || slot.vehicleType === vehicleType;
}

export async function listReservationPolicies(): Promise<UserReservationPolicyRecord[]> {
  return RESERVATION_POLICY_MOCK_DATA;
}

export async function listParkingSlotsByBuilding(buildingId: string): Promise<UserParkingSlotRecord[]> {
  return PARKING_SLOT_MOCK_DATA.filter((slot) => slot.buildingId === buildingId);
}

export async function getReservationPolicyByBuilding(
  buildingId: string,
): Promise<UserReservationPolicyRecord | null> {
  return RESERVATION_POLICY_MOCK_DATA.find((item) => item.buildingId === buildingId) || null;
}

export async function listUserReservations(userId: string): Promise<UserReservationRecord[]> {
  return loadReservationsStore()
    .filter((row) => row.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function createUserReservation(
  input: CreateReservationInput,
): Promise<UserReservationRecord> {
  const policy = await getReservationPolicyByBuilding(input.buildingId);
  if (!policy || !policy.isActive) {
    throw new Error('Tòa nhà này đang tạm dừng đặt chỗ trước.');
  }

  const scheduledAtTime = new Date(input.scheduledAt).getTime();
  if (Number.isNaN(scheduledAtTime)) {
    throw new Error('Thời gian đặt chỗ không hợp lệ.');
  }

  const minAllowedTime = Date.now() + policy.minAdvanceMinutes * 60_000;
  const maxAllowedTime = Date.now() + policy.maxAdvanceHours * 3_600_000;
  if (scheduledAtTime < minAllowedTime || scheduledAtTime > maxAllowedTime) {
    throw new Error('Thời gian đặt chỗ vượt ngoài giới hạn chính sách.');
  }

  const slot = PARKING_SLOT_MOCK_DATA.find(
    (item) => item.buildingId === input.buildingId && item.code === input.slotCode,
  );
  if (!slot) {
    throw new Error('Không tìm thấy ô đỗ phù hợp.');
  }
  if (!slot.reservable || slot.status !== 'available') {
    throw new Error('Ô đỗ hiện không khả dụng để đặt chỗ.');
  }
  if (!slotSupportsVehicle(slot, input.vehicleType)) {
    throw new Error('Ô đỗ không hỗ trợ loại xe đã chọn.');
  }

  const existing = loadReservationsStore();
  const slotBusy = existing.some(
    (row) =>
      row.status === 'active' &&
      row.buildingId === input.buildingId &&
      row.slotCode === input.slotCode,
  );
  if (slotBusy) {
    throw new Error('Ô đỗ vừa được đặt, vui lòng chọn ô khác.');
  }

  const plateBusy = existing.some(
    (row) => row.status === 'active' && row.plateNumber === input.plateNumber,
  );
  if (plateBusy) {
    throw new Error('Biển số này đang được dùng cho lượt đặt chỗ khác.');
  }

  const created: UserReservationRecord = {
    id: randomReservationId(),
    userId: input.userId,
    buildingId: input.buildingId,
    buildingName: input.buildingName,
    slotCode: input.slotCode,
    plateNumber: input.plateNumber,
    vehicleType: input.vehicleType,
    scheduledAt: input.scheduledAt,
    createdAt: new Date().toISOString(),
    status: 'active',
  };

  const next = [created, ...existing];
  saveReservationsStore(next);
  return created;
}

export async function cancelUserReservation(reservationId: string, userId: string): Promise<void> {
  const existing = loadReservationsStore();
  const next = existing.map((row) => {
    if (row.id !== reservationId || row.userId !== userId) return row;
    return { ...row, status: 'cancelled' as const };
  });
  saveReservationsStore(next);
}
