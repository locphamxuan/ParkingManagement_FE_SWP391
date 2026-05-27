import type { ReservationVehicleType } from '@/pages/User/mockReservationsData';

export type LongTermPaymentMethod = 'wallet' | 'qr';
export type LongTermSubscriptionStatus = 'active' | 'cancelled' | 'expired';

export interface UserLongTermPackage {
  _id: string;
  buildingId: string;
  name: string;
  code: string;
  vehicleType: ReservationVehicleType | 'all';
  durationDays: number;
  price: number;
  reservedSlots: number;
  description?: string;
  isActive: boolean;
}

export interface UserLongTermSubscription {
  _id: string;
  userId: string;
  buildingId: string;
  buildingName: string;
  packageId: string;
  packageCode: string;
  packageName: string;
  durationDays: number;
  price: number;
  plateNumber: string;
  vehicleType: ReservationVehicleType;
  startDate: string;
  endDate: string;
  status: LongTermSubscriptionStatus;
  paymentId: string;
  createdAt: string;
}

export interface UserLongTermPayment {
  id: string;
  userId: string;
  subscriptionId: string;
  buildingId: string;
  amount: number;
  method: LongTermPaymentMethod;
  status: 'paid';
  note: string;
  createdAt: string;
}

export interface CreateLongTermSubscriptionInput {
  userId: string;
  buildingId: string;
  buildingName: string;
  packageId: string;
  plateNumber: string;
  vehicleType: ReservationVehicleType;
  paymentMethod: LongTermPaymentMethod;
  startDate: string;
}

const LONG_TERM_SUBSCRIPTIONS_STORAGE_KEY = 'pbms.longTermSubscriptions';
const LONG_TERM_PAYMENTS_STORAGE_KEY = 'pbms.longTermPayments';

const LONG_TERM_PACKAGE_MOCK_DATA: UserLongTermPackage[] = [
  {
    _id: 'ltp-b1-car-30',
    buildingId: 'demo-building-1',
    name: 'Gói Ô tô 30 ngày',
    code: 'CAR-30',
    vehicleType: 'car',
    durationDays: 30,
    price: 1_800_000,
    reservedSlots: 20,
    description: 'Ra vào không giới hạn, ưu tiên khu vực tầng 1.',
    isActive: true,
  },
  {
    _id: 'ltp-b1-bike-30',
    buildingId: 'demo-building-1',
    name: 'Gói Xe máy 30 ngày',
    code: 'BIKE-30',
    vehicleType: 'motorcycle',
    durationDays: 30,
    price: 550_000,
    reservedSlots: 40,
    description: 'Giữ chỗ theo tháng cho xe máy.',
    isActive: true,
  },
  {
    _id: 'ltp-b2-all-90',
    buildingId: 'demo-building-2',
    name: 'Gói Linh hoạt 90 ngày',
    code: 'FLEX-90',
    vehicleType: 'all',
    durationDays: 90,
    price: 3_900_000,
    reservedSlots: 15,
    description: 'Áp dụng cho cả ô tô và xe máy.',
    isActive: true,
  },
  {
    _id: 'ltp-b2-car-180',
    buildingId: 'demo-building-2',
    name: 'Gói Ô tô 180 ngày',
    code: 'CAR-180',
    vehicleType: 'car',
    durationDays: 180,
    price: 6_900_000,
    reservedSlots: 10,
    description: 'Gói tiết kiệm dài hạn cho ô tô.',
    isActive: true,
  },
];

function randomId(prefix: string): string {
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function parseJsonArray(raw: string | null): unknown[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseStoredSubscriptions(raw: string | null): UserLongTermSubscription[] {
  return parseJsonArray(raw)
    .map((item): UserLongTermSubscription | null => {
      if (!item || typeof item !== 'object') return null;
      if (typeof (item as { _id?: unknown })._id !== 'string') return null;
      if (typeof (item as { userId?: unknown }).userId !== 'string') return null;
      if (typeof (item as { packageId?: unknown }).packageId !== 'string') return null;
      if (typeof (item as { buildingId?: unknown }).buildingId !== 'string') return null;
      if (typeof (item as { plateNumber?: unknown }).plateNumber !== 'string') return null;

      const statusRaw = (item as { status?: unknown }).status;
      const status: LongTermSubscriptionStatus =
        statusRaw === 'cancelled' || statusRaw === 'expired' ? statusRaw : 'active';
      const vehicleTypeRaw = (item as { vehicleType?: unknown }).vehicleType;
      const vehicleType: ReservationVehicleType = vehicleTypeRaw === 'motorcycle' ? 'motorcycle' : 'car';

      return {
        _id: (item as { _id: string })._id,
        userId: (item as { userId: string }).userId,
        buildingId: (item as { buildingId: string }).buildingId,
        buildingName:
          typeof (item as { buildingName?: unknown }).buildingName === 'string'
            ? (item as { buildingName: string }).buildingName
            : 'Tòa nhà mặc định',
        packageId: (item as { packageId: string }).packageId,
        packageCode:
          typeof (item as { packageCode?: unknown }).packageCode === 'string'
            ? (item as { packageCode: string }).packageCode
            : 'PKG',
        packageName:
          typeof (item as { packageName?: unknown }).packageName === 'string'
            ? (item as { packageName: string }).packageName
            : 'Gói dài hạn',
        durationDays:
          typeof (item as { durationDays?: unknown }).durationDays === 'number'
            ? (item as { durationDays: number }).durationDays
            : 30,
        price:
          typeof (item as { price?: unknown }).price === 'number'
            ? (item as { price: number }).price
            : 0,
        plateNumber: (item as { plateNumber: string }).plateNumber,
        vehicleType,
        startDate:
          typeof (item as { startDate?: unknown }).startDate === 'string'
            ? (item as { startDate: string }).startDate
            : new Date().toISOString(),
        endDate:
          typeof (item as { endDate?: unknown }).endDate === 'string'
            ? (item as { endDate: string }).endDate
            : new Date().toISOString(),
        status,
        paymentId:
          typeof (item as { paymentId?: unknown }).paymentId === 'string'
            ? (item as { paymentId: string }).paymentId
            : '',
        createdAt:
          typeof (item as { createdAt?: unknown }).createdAt === 'string'
            ? (item as { createdAt: string }).createdAt
            : new Date().toISOString(),
      };
    })
    .filter((item): item is UserLongTermSubscription => Boolean(item));
}

function parseStoredPayments(raw: string | null): UserLongTermPayment[] {
  return parseJsonArray(raw)
    .map((item): UserLongTermPayment | null => {
      if (!item || typeof item !== 'object') return null;
      if (typeof (item as { id?: unknown }).id !== 'string') return null;
      if (typeof (item as { userId?: unknown }).userId !== 'string') return null;
      if (typeof (item as { subscriptionId?: unknown }).subscriptionId !== 'string') return null;
      if (typeof (item as { buildingId?: unknown }).buildingId !== 'string') return null;
      if (typeof (item as { amount?: unknown }).amount !== 'number') return null;

      const methodRaw = (item as { method?: unknown }).method;
      const method: LongTermPaymentMethod = methodRaw === 'qr' ? 'qr' : 'wallet';

      return {
        id: (item as { id: string }).id,
        userId: (item as { userId: string }).userId,
        subscriptionId: (item as { subscriptionId: string }).subscriptionId,
        buildingId: (item as { buildingId: string }).buildingId,
        amount: (item as { amount: number }).amount,
        method,
        status: 'paid',
        note:
          typeof (item as { note?: unknown }).note === 'string'
            ? (item as { note: string }).note
            : '',
        createdAt:
          typeof (item as { createdAt?: unknown }).createdAt === 'string'
            ? (item as { createdAt: string }).createdAt
            : new Date().toISOString(),
      };
    })
    .filter((item): item is UserLongTermPayment => Boolean(item));
}

function loadSubscriptionsStore(): UserLongTermSubscription[] {
  return parseStoredSubscriptions(localStorage.getItem(LONG_TERM_SUBSCRIPTIONS_STORAGE_KEY));
}

function saveSubscriptionsStore(rows: UserLongTermSubscription[]): void {
  localStorage.setItem(LONG_TERM_SUBSCRIPTIONS_STORAGE_KEY, JSON.stringify(rows));
}

function loadPaymentsStore(): UserLongTermPayment[] {
  return parseStoredPayments(localStorage.getItem(LONG_TERM_PAYMENTS_STORAGE_KEY));
}

function savePaymentsStore(rows: UserLongTermPayment[]): void {
  localStorage.setItem(LONG_TERM_PAYMENTS_STORAGE_KEY, JSON.stringify(rows));
}

export async function listLongTermPackages(
  buildingId?: string,
): Promise<UserLongTermPackage[]> {
  return LONG_TERM_PACKAGE_MOCK_DATA.filter(
    (item) => item.isActive && (!buildingId || item.buildingId === buildingId),
  );
}

export async function listUserLongTermSubscriptions(
  userId: string,
): Promise<UserLongTermSubscription[]> {
  return loadSubscriptionsStore()
    .filter((item) => item.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function listUserLongTermPayments(userId: string): Promise<UserLongTermPayment[]> {
  return loadPaymentsStore()
    .filter((item) => item.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function createLongTermSubscription(
  input: CreateLongTermSubscriptionInput,
): Promise<UserLongTermSubscription> {
  const longTermPackage = LONG_TERM_PACKAGE_MOCK_DATA.find(
    (item) => item._id === input.packageId && item.isActive,
  );
  if (!longTermPackage) {
    throw new Error('Không tìm thấy gói dài hạn phù hợp.');
  }

  if (longTermPackage.buildingId !== input.buildingId) {
    throw new Error('Gói đã chọn không thuộc tòa nhà hiện tại.');
  }

  if (
    longTermPackage.vehicleType !== 'all' &&
    longTermPackage.vehicleType !== input.vehicleType
  ) {
    throw new Error('Biển số này không phù hợp với loại xe của gói.');
  }

  const existing = loadSubscriptionsStore();
  const now = Date.now();
  const hasActiveOnPlate = existing.some((item) => {
    if (item.userId !== input.userId) return false;
    if (item.plateNumber !== input.plateNumber) return false;
    if (item.status !== 'active') return false;
    return new Date(item.endDate).getTime() > now;
  });

  if (hasActiveOnPlate) {
    throw new Error('Biển số này đang có gói dài hạn còn hiệu lực.');
  }

  const startDate = new Date(input.startDate);
  if (Number.isNaN(startDate.getTime())) {
    throw new Error('Ngày bắt đầu không hợp lệ.');
  }

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + longTermPackage.durationDays);

  const subscriptionId = randomId('LTS');
  const paymentId = randomId('PAY');
  const createdAt = new Date().toISOString();

  const subscription: UserLongTermSubscription = {
    _id: subscriptionId,
    userId: input.userId,
    buildingId: input.buildingId,
    buildingName: input.buildingName,
    packageId: longTermPackage._id,
    packageCode: longTermPackage.code,
    packageName: longTermPackage.name,
    durationDays: longTermPackage.durationDays,
    price: longTermPackage.price,
    plateNumber: input.plateNumber,
    vehicleType: input.vehicleType,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    status: 'active',
    paymentId,
    createdAt,
  };

  const payment: UserLongTermPayment = {
    id: paymentId,
    userId: input.userId,
    subscriptionId,
    buildingId: input.buildingId,
    amount: longTermPackage.price,
    method: input.paymentMethod,
    status: 'paid',
    note: `Thanh toán ${longTermPackage.name} cho biển số ${input.plateNumber}`,
    createdAt,
  };

  saveSubscriptionsStore([subscription, ...existing]);
  savePaymentsStore([payment, ...loadPaymentsStore()]);
  return subscription;
}
