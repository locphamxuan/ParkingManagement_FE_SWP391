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
  createdAt: string;
  status: ReservationStatus;
  amountPaid: number;
  paymentId: string;
  cancelledAt?: string;
  refundAmount?: number;
  refundPercent?: number;
  refundPaymentId?: string;
  refundWalletTxId?: string;
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

export type WalletTopUpGateway = 'payos' | 'sepay';
export type WalletTopUpStatus = 'pending' | 'success' | 'failed' | 'expired';

export interface UserWalletTopUpOrder {
  id: string;
  userId: string;
  orderCode: string;
  amount: number;
  gateway: WalletTopUpGateway;
  status: WalletTopUpStatus;
  transferContent: string;
  qrImageUrl: string;
  checkoutUrl?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  walletTxId?: string;
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

export interface CancelReservationResult {
  reservation: UserReservationRecord;
  refundAmount: number;
  refundPercent: number;
}

const RESERVATION_STORAGE_KEY = 'pbms.reservations';
const PAYMENT_STORAGE_KEY = 'pbms.payments';
const WALLET_TX_STORAGE_KEY = 'pbms.walletTransactions';
const WALLET_TOPUP_ORDER_STORAGE_KEY = 'pbms.walletTopupOrders';
const BASE_WALLET_BALANCE = 500_000;
const DEMO_QR_EXPIRE_MINUTES = 15;
const DEMO_WEBHOOK_DELAY_MS = 12_000;
const DEMO_BANK_BIN = '970422';
const DEMO_BANK_ACCOUNT = '190364889999';

const RESERVATION_POLICY_MOCK_DATA: UserReservationPolicyRecord[] = [
  {
    _id: 'rp-demo-1',
    buildingId: 'demo-building-1',
    minAdvanceMinutes: 15,
    maxAdvanceHours: 72,
    maxHoldMinutes: 30,
    reservableRatio: 0.35,
    refundPercent: 80,
    isActive: true,
  },
  {
    _id: 'rp-demo-2',
    buildingId: 'demo-building-2',
    minAdvanceMinutes: 10,
    maxAdvanceHours: 48,
    maxHoldMinutes: 20,
    reservableRatio: 0.4,
    refundPercent: 60,
    isActive: true,
  },
];

const PARKING_SLOT_MOCK_DATA: UserParkingSlotRecord[] = [
  {
    _id: 'slot-b1-a01',
    buildingId: 'demo-building-1',
    code: 'A-01',
    floorCode: 'F1',
    vehicleType: 'all',
    reservable: false,
    status: 'occupied',
  },
  {
    _id: 'slot-b1-a02',
    buildingId: 'demo-building-1',
    code: 'A-02',
    floorCode: 'F1',
    vehicleType: 'car',
    reservable: true,
    status: 'available',
  },
  {
    _id: 'slot-b1-a03',
    buildingId: 'demo-building-1',
    code: 'A-03',
    floorCode: 'F1',
    vehicleType: 'motorcycle',
    reservable: true,
    status: 'available',
  },
  {
    _id: 'slot-b1-a04',
    buildingId: 'demo-building-1',
    code: 'A-04',
    floorCode: 'F1',
    vehicleType: 'all',
    reservable: true,
    status: 'available',
  },
  {
    _id: 'slot-b1-a05',
    buildingId: 'demo-building-1',
    code: 'A-05',
    floorCode: 'F1',
    vehicleType: 'all',
    reservable: false,
    status: 'maintenance',
  },
  {
    _id: 'slot-b2-a01',
    buildingId: 'demo-building-2',
    code: 'A-01',
    floorCode: 'B1',
    vehicleType: 'all',
    reservable: false,
    status: 'occupied',
  },
  {
    _id: 'slot-b2-a02',
    buildingId: 'demo-building-2',
    code: 'A-02',
    floorCode: 'B1',
    vehicleType: 'all',
    reservable: true,
    status: 'available',
  },
  {
    _id: 'slot-b2-a03',
    buildingId: 'demo-building-2',
    code: 'A-03',
    floorCode: 'B1',
    vehicleType: 'car',
    reservable: true,
    status: 'available',
  },
  {
    _id: 'slot-b2-a04',
    buildingId: 'demo-building-2',
    code: 'A-04',
    floorCode: 'B1',
    vehicleType: 'motorcycle',
    reservable: true,
    status: 'reserved',
  },
  {
    _id: 'slot-b2-a05',
    buildingId: 'demo-building-2',
    code: 'A-05',
    floorCode: 'B1',
    vehicleType: 'all',
    reservable: false,
    status: 'maintenance',
  },
];

function randomId(prefix: string): string {
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}

function defaultScheduleValue(): string {
  const next = new Date(Date.now() + 30 * 60_000);
  next.setSeconds(0, 0);
  const tzOffsetMs = next.getTimezoneOffset() * 60_000;
  return new Date(next.getTime() - tzOffsetMs).toISOString().slice(0, 16);
}

function holdAmountForVehicle(vehicleType: ReservationVehicleType): number {
  return vehicleType === 'car' ? 40_000 : 15_000;
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

function parseStoredReservations(raw: string | null): UserReservationRecord[] {
  return parseJsonArray(raw)
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
      if (!userId) return null;

      const vehicleType: ReservationVehicleType =
        (item as { vehicleType?: unknown }).vehicleType === 'motorcycle' ? 'motorcycle' : 'car';

      const statusRaw = (item as { status?: unknown }).status;
      const status: ReservationStatus =
        statusRaw === 'cancelled' || statusRaw === 'completed' ? statusRaw : 'active';

      const amountPaidRaw = (item as { amountPaid?: unknown }).amountPaid;
      const amountPaid =
        typeof amountPaidRaw === 'number' && Number.isFinite(amountPaidRaw)
          ? amountPaidRaw
          : holdAmountForVehicle(vehicleType);

      return {
        id,
        userId,
        buildingId:
          typeof (item as { buildingId?: unknown }).buildingId === 'string'
            ? (item as { buildingId: string }).buildingId
            : 'legacy-building',
        buildingName:
          typeof (item as { buildingName?: unknown }).buildingName === 'string'
            ? (item as { buildingName: string }).buildingName
            : 'Tòa nhà mặc định',
        slotCode:
          typeof (item as { slotCode?: unknown }).slotCode === 'string'
            ? (item as { slotCode: string }).slotCode
            : 'A-02',
        plateNumber:
          typeof (item as { plateNumber?: unknown }).plateNumber === 'string'
            ? (item as { plateNumber: string }).plateNumber
            : '--',
        vehicleType,
        scheduledAt:
          typeof (item as { scheduledAt?: unknown }).scheduledAt === 'string'
            ? (item as { scheduledAt: string }).scheduledAt
            : defaultScheduleValue(),
        createdAt:
          typeof (item as { createdAt?: unknown }).createdAt === 'string'
            ? (item as { createdAt: string }).createdAt
            : new Date().toISOString(),
        status,
        amountPaid,
        paymentId:
          typeof (item as { paymentId?: unknown }).paymentId === 'string'
            ? (item as { paymentId: string }).paymentId
            : '',
        cancelledAt:
          typeof (item as { cancelledAt?: unknown }).cancelledAt === 'string'
            ? (item as { cancelledAt: string }).cancelledAt
            : undefined,
        refundAmount:
          typeof (item as { refundAmount?: unknown }).refundAmount === 'number'
            ? (item as { refundAmount: number }).refundAmount
            : undefined,
        refundPercent:
          typeof (item as { refundPercent?: unknown }).refundPercent === 'number'
            ? (item as { refundPercent: number }).refundPercent
            : undefined,
        refundPaymentId:
          typeof (item as { refundPaymentId?: unknown }).refundPaymentId === 'string'
            ? (item as { refundPaymentId: string }).refundPaymentId
            : undefined,
        refundWalletTxId:
          typeof (item as { refundWalletTxId?: unknown }).refundWalletTxId === 'string'
            ? (item as { refundWalletTxId: string }).refundWalletTxId
            : undefined,
      };
    })
    .filter((item): item is UserReservationRecord => Boolean(item));
}

function parseStoredPayments(raw: string | null): UserPaymentRecord[] {
  return parseJsonArray(raw)
    .map((item): UserPaymentRecord | null => {
      if (!item || typeof item !== 'object') return null;
      if (typeof (item as { id?: unknown }).id !== 'string') return null;
      if (typeof (item as { userId?: unknown }).userId !== 'string') return null;
      if (typeof (item as { reservationId?: unknown }).reservationId !== 'string') return null;
      if (typeof (item as { buildingId?: unknown }).buildingId !== 'string') return null;
      if (typeof (item as { amount?: unknown }).amount !== 'number') return null;

      const typeRaw = (item as { type?: unknown }).type;
      const type: PaymentType = typeRaw === 'reservation_refund' ? 'reservation_refund' : 'reservation_hold';
      const directionRaw = (item as { direction?: unknown }).direction;
      const direction: PaymentDirection = directionRaw === 'credit' ? 'credit' : 'debit';

      return {
        id: (item as { id: string }).id,
        userId: (item as { userId: string }).userId,
        reservationId: (item as { reservationId: string }).reservationId,
        buildingId: (item as { buildingId: string }).buildingId,
        type,
        direction,
        method: 'wallet',
        amount: (item as { amount: number }).amount,
        status: 'completed',
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
    .filter((item): item is UserPaymentRecord => Boolean(item));
}

function parseStoredWalletTx(raw: string | null): UserWalletTransactionRecord[] {
  return parseJsonArray(raw)
    .map((item): UserWalletTransactionRecord | null => {
      if (!item || typeof item !== 'object') return null;
      if (typeof (item as { id?: unknown }).id !== 'string') return null;
      if (typeof (item as { userId?: unknown }).userId !== 'string') return null;
      if (typeof (item as { paymentId?: unknown }).paymentId !== 'string') return null;
      if (typeof (item as { reservationId?: unknown }).reservationId !== 'string') return null;
      if (typeof (item as { amount?: unknown }).amount !== 'number') return null;
      if (typeof (item as { balanceAfter?: unknown }).balanceAfter !== 'number') return null;

      const typeRaw = (item as { type?: unknown }).type;
      const type: PaymentDirection = typeRaw === 'credit' ? 'credit' : 'debit';

      return {
        id: (item as { id: string }).id,
        userId: (item as { userId: string }).userId,
        paymentId: (item as { paymentId: string }).paymentId,
        reservationId: (item as { reservationId: string }).reservationId,
        type,
        amount: (item as { amount: number }).amount,
        balanceAfter: (item as { balanceAfter: number }).balanceAfter,
        description:
          typeof (item as { description?: unknown }).description === 'string'
            ? (item as { description: string }).description
            : '',
        createdAt:
          typeof (item as { createdAt?: unknown }).createdAt === 'string'
            ? (item as { createdAt: string }).createdAt
            : new Date().toISOString(),
      };
    })
    .filter((item): item is UserWalletTransactionRecord => Boolean(item));
}

function loadReservationsStore(): UserReservationRecord[] {
  return parseStoredReservations(localStorage.getItem(RESERVATION_STORAGE_KEY));
}

function saveReservationsStore(rows: UserReservationRecord[]): void {
  localStorage.setItem(RESERVATION_STORAGE_KEY, JSON.stringify(rows));
}

function loadPaymentsStore(): UserPaymentRecord[] {
  return parseStoredPayments(localStorage.getItem(PAYMENT_STORAGE_KEY));
}

function savePaymentsStore(rows: UserPaymentRecord[]): void {
  localStorage.setItem(PAYMENT_STORAGE_KEY, JSON.stringify(rows));
}

function loadWalletTxStore(): UserWalletTransactionRecord[] {
  return parseStoredWalletTx(localStorage.getItem(WALLET_TX_STORAGE_KEY));
}

function saveWalletTxStore(rows: UserWalletTransactionRecord[]): void {
  localStorage.setItem(WALLET_TX_STORAGE_KEY, JSON.stringify(rows));
}

function parseStoredTopUpOrders(raw: string | null): UserWalletTopUpOrder[] {
  return parseJsonArray(raw)
    .map((item): UserWalletTopUpOrder | null => {
      if (!item || typeof item !== 'object') return null;
      if (typeof (item as { id?: unknown }).id !== 'string') return null;
      if (typeof (item as { userId?: unknown }).userId !== 'string') return null;
      if (typeof (item as { orderCode?: unknown }).orderCode !== 'string') return null;
      if (typeof (item as { amount?: unknown }).amount !== 'number') return null;
      if (typeof (item as { transferContent?: unknown }).transferContent !== 'string') return null;
      if (typeof (item as { qrImageUrl?: unknown }).qrImageUrl !== 'string') return null;

      const statusRaw = (item as { status?: unknown }).status;
      const status: WalletTopUpStatus =
        statusRaw === 'success' || statusRaw === 'failed' || statusRaw === 'expired'
          ? statusRaw
          : 'pending';

      const gatewayRaw = (item as { gateway?: unknown }).gateway;
      const gateway: WalletTopUpGateway = gatewayRaw === 'sepay' ? 'sepay' : 'payos';

      return {
        id: (item as { id: string }).id,
        userId: (item as { userId: string }).userId,
        orderCode: (item as { orderCode: string }).orderCode,
        amount: (item as { amount: number }).amount,
        gateway,
        status,
        transferContent: (item as { transferContent: string }).transferContent,
        qrImageUrl: (item as { qrImageUrl: string }).qrImageUrl,
        checkoutUrl:
          typeof (item as { checkoutUrl?: unknown }).checkoutUrl === 'string'
            ? (item as { checkoutUrl: string }).checkoutUrl
            : undefined,
        createdAt:
          typeof (item as { createdAt?: unknown }).createdAt === 'string'
            ? (item as { createdAt: string }).createdAt
            : new Date().toISOString(),
        updatedAt:
          typeof (item as { updatedAt?: unknown }).updatedAt === 'string'
            ? (item as { updatedAt: string }).updatedAt
            : new Date().toISOString(),
        paidAt:
          typeof (item as { paidAt?: unknown }).paidAt === 'string'
            ? (item as { paidAt: string }).paidAt
            : undefined,
        walletTxId:
          typeof (item as { walletTxId?: unknown }).walletTxId === 'string'
            ? (item as { walletTxId: string }).walletTxId
            : undefined,
      };
    })
    .filter((item): item is UserWalletTopUpOrder => Boolean(item));
}

function loadTopUpOrdersStore(): UserWalletTopUpOrder[] {
  return parseStoredTopUpOrders(localStorage.getItem(WALLET_TOPUP_ORDER_STORAGE_KEY));
}

function saveTopUpOrdersStore(rows: UserWalletTopUpOrder[]): void {
  localStorage.setItem(WALLET_TOPUP_ORDER_STORAGE_KEY, JSON.stringify(rows));
}

function buildTransferContent(orderCode: string): string {
  return `NAP PBMS ${orderCode}`;
}

function buildVietQrImageUrl(amount: number, transferContent: string): string {
  const encodedContent = encodeURIComponent(transferContent);
  return `https://img.vietqr.io/image/${DEMO_BANK_BIN}-${DEMO_BANK_ACCOUNT}-compact2.png?amount=${amount}&addInfo=${encodedContent}&accountName=PBMS`;
}

function getUserWalletBalanceFromTx(
  userId: string,
  walletTxRows: UserWalletTransactionRecord[],
): number {
  const userRows = walletTxRows
    .filter((row) => row.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  if (userRows.length === 0) return BASE_WALLET_BALANCE;
  return userRows[userRows.length - 1].balanceAfter;
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

export async function listParkingSlotsByBuilding(
  buildingId: string,
): Promise<UserParkingSlotRecord[]> {
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

export async function listUserPayments(userId: string): Promise<UserPaymentRecord[]> {
  return loadPaymentsStore()
    .filter((row) => row.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function listUserWalletTransactions(
  userId: string,
): Promise<UserWalletTransactionRecord[]> {
  return loadWalletTxStore()
    .filter((row) => row.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function getUserWalletBalance(userId: string): Promise<number> {
  const walletTxRows = loadWalletTxStore();
  return getUserWalletBalanceFromTx(userId, walletTxRows);
}

export async function createUserWalletTopUp(
  userId: string,
  amount: number,
): Promise<UserWalletTransactionRecord> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Số tiền nạp ví không hợp lệ.');
  }

  const walletTxRows = loadWalletTxStore();
  const currentBalance = getUserWalletBalanceFromTx(userId, walletTxRows);
  const now = new Date().toISOString();
  const topUpTx: UserWalletTransactionRecord = {
    id: randomId('WTX'),
    userId,
    paymentId: randomId('TOPUP'),
    reservationId: 'wallet-topup',
    type: 'credit',
    amount,
    balanceAfter: currentBalance + amount,
    description: 'Nạp tiền vào ví PBMS',
    createdAt: now,
  };

  saveWalletTxStore([topUpTx, ...walletTxRows]);
  return topUpTx;
}

export async function createWalletTopUpOrder(
  userId: string,
  amount: number,
  gateway: WalletTopUpGateway = 'payos',
): Promise<UserWalletTopUpOrder> {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Số tiền nạp ví không hợp lệ.');
  }

  const orderCode = `${Date.now()}${Math.floor(100 + Math.random() * 900)}`;
  const transferContent = buildTransferContent(orderCode);
  const now = new Date().toISOString();

  const createdOrder: UserWalletTopUpOrder = {
    id: randomId('TOPUP-ORDER'),
    userId,
    orderCode,
    amount: Math.round(amount),
    gateway,
    status: 'pending',
    transferContent,
    qrImageUrl: buildVietQrImageUrl(amount, transferContent),
    checkoutUrl: `https://pay.payos.vn/web/${orderCode}`,
    createdAt: now,
    updatedAt: now,
  };

  const orders = loadTopUpOrdersStore();
  saveTopUpOrdersStore([createdOrder, ...orders]);
  return createdOrder;
}

export async function getLatestPendingTopUpOrder(
  userId: string,
): Promise<UserWalletTopUpOrder | null> {
  const orders = loadTopUpOrdersStore()
    .filter((row) => row.userId === userId && row.status === 'pending')
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  if (orders.length === 0) return null;
  return orders[0];
}

export async function getTopUpOrderStatus(orderCode: string): Promise<UserWalletTopUpOrder | null> {
  const orders = loadTopUpOrdersStore();
  const target = orders.find((row) => row.orderCode === orderCode);
  if (!target) return null;

  if (target.status !== 'pending') return target;

  const createdAtMs = new Date(target.createdAt).getTime();
  const nowMs = Date.now();
  const elapsed = nowMs - createdAtMs;
  const expiredMs = DEMO_QR_EXPIRE_MINUTES * 60_000;

  if (elapsed >= expiredMs) {
    const expiredOrder: UserWalletTopUpOrder = {
      ...target,
      status: 'expired',
      updatedAt: new Date().toISOString(),
    };
    saveTopUpOrdersStore(orders.map((row) => (row.orderCode === orderCode ? expiredOrder : row)));
    return expiredOrder;
  }

  if (elapsed < DEMO_WEBHOOK_DELAY_MS) {
    return target;
  }

  const walletTxRows = loadWalletTxStore();
  const currentBalance = getUserWalletBalanceFromTx(target.userId, walletTxRows);
  const paidAt = new Date().toISOString();
  const walletTxId = randomId('WTX');
  const paymentId = randomId('TOPUP');
  const topUpTx: UserWalletTransactionRecord = {
    id: walletTxId,
    userId: target.userId,
    paymentId,
    reservationId: 'wallet-topup',
    type: 'credit',
    amount: target.amount,
    balanceAfter: currentBalance + target.amount,
    description: `Nạp ví qua ${target.gateway.toUpperCase()} (${target.orderCode})`,
    createdAt: paidAt,
  };

  saveWalletTxStore([topUpTx, ...walletTxRows]);

  const successOrder: UserWalletTopUpOrder = {
    ...target,
    status: 'success',
    updatedAt: paidAt,
    paidAt,
    walletTxId,
  };
  saveTopUpOrdersStore(orders.map((row) => (row.orderCode === orderCode ? successOrder : row)));
  return successOrder;
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

  const existingReservations = loadReservationsStore();
  const slotBusy = existingReservations.some(
    (row) =>
      row.status === 'active' &&
      row.buildingId === input.buildingId &&
      row.slotCode === input.slotCode,
  );
  if (slotBusy) {
    throw new Error('Ô đỗ vừa được đặt, vui lòng chọn ô khác.');
  }

  const plateBusy = existingReservations.some(
    (row) => row.status === 'active' && row.plateNumber === input.plateNumber,
  );
  if (plateBusy) {
    throw new Error('Biển số này đang được dùng cho lượt đặt chỗ khác.');
  }

  const existingPayments = loadPaymentsStore();
  const existingWalletTx = loadWalletTxStore();
  const currentBalance = getUserWalletBalanceFromTx(input.userId, existingWalletTx);
  const holdAmount = holdAmountForVehicle(input.vehicleType);
  if (currentBalance < holdAmount) {
    throw new Error('Số dư ví không đủ để giữ chỗ.');
  }

  const reservationId = randomId('RSV');
  const holdPaymentId = randomId('PAY');
  const holdWalletTxId = randomId('WTX');
  const createdAt = new Date().toISOString();

  const payment: UserPaymentRecord = {
    id: holdPaymentId,
    userId: input.userId,
    reservationId,
    buildingId: input.buildingId,
    type: 'reservation_hold',
    direction: 'debit',
    method: 'wallet',
    amount: holdAmount,
    status: 'completed',
    note: `Giữ chỗ ${input.slotCode} tại ${input.buildingName}`,
    createdAt,
  };

  const walletTx: UserWalletTransactionRecord = {
    id: holdWalletTxId,
    userId: input.userId,
    paymentId: holdPaymentId,
    reservationId,
    type: 'debit',
    amount: holdAmount,
    balanceAfter: currentBalance - holdAmount,
    description: `Trừ ví để giữ chỗ ${input.slotCode}`,
    createdAt,
  };

  const created: UserReservationRecord = {
    id: reservationId,
    userId: input.userId,
    buildingId: input.buildingId,
    buildingName: input.buildingName,
    slotCode: input.slotCode,
    plateNumber: input.plateNumber,
    vehicleType: input.vehicleType,
    scheduledAt: input.scheduledAt,
    createdAt,
    status: 'active',
    amountPaid: holdAmount,
    paymentId: holdPaymentId,
  };

  saveReservationsStore([created, ...existingReservations]);
  savePaymentsStore([payment, ...existingPayments]);
  saveWalletTxStore([walletTx, ...existingWalletTx]);
  return created;
}

export async function cancelUserReservation(
  reservationId: string,
  userId: string,
): Promise<CancelReservationResult> {
  const reservations = loadReservationsStore();
  const target = reservations.find((row) => row.id === reservationId && row.userId === userId);
  if (!target) {
    throw new Error('Không tìm thấy lượt đặt cần hủy.');
  }
  if (target.status !== 'active') {
    throw new Error('Lượt đặt này không ở trạng thái có thể hủy.');
  }

  const policy = await getReservationPolicyByBuilding(target.buildingId);
  const refundPercent = policy?.refundPercent ?? 0;
  const refundAmount = Math.round((target.amountPaid * refundPercent) / 100);

  const now = new Date().toISOString();
  const payments = loadPaymentsStore();
  const walletTx = loadWalletTxStore();
  const currentBalance = getUserWalletBalanceFromTx(userId, walletTx);

  const refundPaymentId = randomId('PAY');
  const refundWalletTxId = randomId('WTX');

  const updatedReservation: UserReservationRecord = {
    ...target,
    status: 'cancelled',
    cancelledAt: now,
    refundAmount,
    refundPercent,
    refundPaymentId,
    refundWalletTxId,
  };

  const nextReservations = reservations.map((row) => (row.id === reservationId ? updatedReservation : row));

  const refundPayment: UserPaymentRecord = {
    id: refundPaymentId,
    userId,
    reservationId: target.id,
    buildingId: target.buildingId,
    type: 'reservation_refund',
    direction: 'credit',
    method: 'wallet',
    amount: refundAmount,
    status: 'completed',
    note: `Hoàn tiền hủy đặt chỗ ${target.slotCode} (${refundPercent}%)`,
    createdAt: now,
  };

  const refundWalletTx: UserWalletTransactionRecord = {
    id: refundWalletTxId,
    userId,
    paymentId: refundPaymentId,
    reservationId: target.id,
    type: 'credit',
    amount: refundAmount,
    balanceAfter: currentBalance + refundAmount,
    description: `Hoàn tiền hủy đặt chỗ ${target.slotCode}`,
    createdAt: now,
  };

  saveReservationsStore(nextReservations);
  savePaymentsStore([refundPayment, ...payments]);
  saveWalletTxStore([refundWalletTx, ...walletTx]);

  return {
    reservation: updatedReservation,
    refundAmount,
    refundPercent,
  };
}
