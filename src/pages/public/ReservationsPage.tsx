import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ArrowLeft,
  Bike,
  Building2,
  CalendarClock,
  Car,
  CheckCircle2,
  Clock3,
  History,
  MapPin,
  ParkingCircle,
  Trash2,
  User,
  WalletCards,
  X,
} from 'lucide-react';
import { ParkingMap2D } from '@/components/shared/ParkingMap2D';
import { useAuth } from '@/hooks/useAuth';
import { CustomSelect } from '@/components/ui/select';
import { userApi, type Building, type VehicleType, type ParkingSlot as ApiParkingSlot, type FloorAvailability, type Reservation } from '@/services/user';

// Local minimal types (replacing mock types)
type ReservationVehicleType = 'car' | 'motorcycle';

interface UserParkingSlotRecord {
  _id: string;
  buildingId: string;
  code: string;
  floorCode?: string;
  vehicleType: ReservationVehicleType | 'all';
  reservable: boolean;
  status: string;
}

interface UserReservationPolicyRecord {
  _id?: string;
  buildingId: string;
  minAdvanceMinutes: number;
  maxAdvanceHours: number;
  maxHoldMinutes?: number;
  reservableRatio?: number;
  refundPercent?: number;
  isActive?: boolean;
}

interface UserReservationRecord {
  id: string;
  userId: string;
  buildingId: string;
  buildingName: string;
  slotCode: string;
  plateNumber: string;
  vehicleType: ReservationVehicleType;
  scheduledAt: string;
  createdAt: string;
  status: string;
  amountPaid: number;
  paymentId?: string;
  refundAmount?: number;
  refundPercent?: number;
}

interface UserPaymentRecord {
  id: string;
  userId: string;
  reservationId: string;
  buildingId: string;
  type: string;
  direction: string;
  method: string;
  amount: number;
  status: string;
  note: string;
  createdAt: string;
}

interface UserWalletTransactionRecord {
  id: string;
  userId: string;
  paymentId?: string;
  reservationId?: string;
  type: string;
  amount: number;
  balanceAfter?: number;
  description?: string;
  createdAt: string;
}

function slotSupportsVehicle(slot: UserParkingSlotRecord, vehicleType: ReservationVehicleType) {
  return slot.vehicleType === 'all' || slot.vehicleType === vehicleType;
}

interface ReservationLocationState {
  buildingId?: string;
  openHistory?: boolean;
}

const DATETIME_LOCAL_SLICE_END = 16;
const money = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

function toDateTimeLocalValue(date: Date): string {
  const tzOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - tzOffsetMs).toISOString().slice(0, DATETIME_LOCAL_SLICE_END);
}

function defaultScheduleValue(): string {
  const next = new Date(Date.now() + 30 * 60_000);
  next.setSeconds(0, 0);
  return toDateTimeLocalValue(next);
}

function formatDateTime(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatMoney(value: number): string {
  return money.format(value);
}

function vehicleTypeLabel(value: ReservationVehicleType): string {
  return value === 'car' ? 'Ô tô' : 'Xe máy';
}

function normalizeVehicleTypeCode(raw?: string | null): ReservationVehicleType | 'all' {
  if (!raw) return 'all';
  const code = String(raw).toLowerCase();
  if (code.includes('car') || code.includes('ô tô') || code.includes('oto') || code.includes('ôto')) return 'car';
  if (code.includes('motor') || code.includes('moto') || code.includes('xe') || code.includes('motorcycle')) return 'motorcycle';
  return 'all';
}

function holdAmountForVehicleType(value: ReservationVehicleType | ''): number {
  if (value === 'car') return 40_000;
  if (value === 'motorcycle') return 15_000;
  return 0;
}

function paymentTypeLabel(type: UserPaymentRecord['type']): string {
  return type === 'reservation_refund' ? 'Hoàn tiền hủy đặt chỗ' : 'Giữ chỗ';
}

function fieldLabelClass(active: boolean): string {
  return `mb-1.5 block font-mono text-[10px] uppercase tracking-widest ${
    active ? 'border-l-2 border-orange-500/60 pl-2 text-slate-200' : 'text-slate-400'
  }`;
}

export default function ReservationsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const state = (location.state as ReservationLocationState | null) ?? null;

  const [rows, setRows] = useState<Array<{ building: Building }>>([]);
  const [slots, setSlots] = useState<UserParkingSlotRecord[]>([]);
  const [policies, setPolicies] = useState<UserReservationPolicyRecord[]>([]);
  const [reservations, setReservations] = useState<UserReservationRecord[]>([]);
  const [payments, setPayments] = useState<UserPaymentRecord[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<UserWalletTransactionRecord[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [floorsData, setFloorsData] = useState<FloorAvailability[]>([]);
  const [vehicleTypesForBuilding, setVehicleTypesForBuilding] = useState<VehicleType[]>([]);
  const [selectedFloorIdModal, setSelectedFloorIdModal] = useState<string>('');

  const [isLoadingBuildings, setIsLoadingBuildings] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);

  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState<ReservationVehicleType | ''>('');
  const [scheduledAt, setScheduledAt] = useState(defaultScheduleValue());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedPlate, setSelectedPlate] = useState('');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  const user = useMemo(() => {
    if (!session) return null;
    return {
      userId: session.userId,
      fullName: session.displayName,
      licensePlates: session.licensePlates || [],
    };
  }, [session]);

  useEffect(() => {
    let ignore = false;

    async function loadStaticData() {
      setIsLoadingBuildings(true);
      try {
        const response = await userApi.buildings.list();
        if (ignore) return;

        // Transform API response to match component structure
        const buildingRows = response.data.items.map((building) => ({
          building,
        }));

        setRows(buildingRows);
        const preferredBuildingId = state?.buildingId || buildingRows[0]?.building._id || '';
        setSelectedBuildingId((current) => current || preferredBuildingId);
      } catch (err) {
        console.error('Failed to load buildings:', err);
      } finally {
        if (!ignore) setIsLoadingBuildings(false);
      }
    }

    loadStaticData();
    return () => {
      ignore = true;
    };
  }, [state?.buildingId]);


  useEffect(() => {
    let ignore = false;

    async function loadUserData() {
      if (!user?.userId) {
        if (!ignore) setIsLoadingUserData(false);
        return;
      }

      setIsLoadingUserData(true);
      try {
        const [resRes, walletRes, walletTxRes] = await Promise.all([
          userApi.reservations.list({}),
          userApi.wallet.get(),
          userApi.wallet.transactions({ limit: 50 }),
        ]);
        if (ignore) return;

        const reservationRows: UserReservationRecord[] = (resRes.data.items || []).map((r: Reservation) => ({
          id: r._id,
          userId: user.userId,
          buildingId: r.building?._id || '',
          buildingName: r.building?.name || '',
          slotCode: r.slot?.code || (r.code || ''),
          plateNumber: r.plateNumber,
          vehicleType: (r.vehicleType?.code === 'car' ? 'car' : 'motorcycle') as ReservationVehicleType,
          scheduledAt: r.startTime,
          createdAt: r.createdAt || new Date().toISOString(),
          status: r.status,
          amountPaid: r.fee || 0,
        }));

        const balance = walletRes.data.wallet?.balance ?? 0;
        const walletTxRows: UserWalletTransactionRecord[] = (walletTxRes.data.items || []).map((t: any) => ({
          id: t._id || t.id,
          userId: t.userId,
          paymentId: t.paymentId,
          reservationId: t.reservationId,
          type: t.type,
          amount: t.amount,
          balanceAfter: t.balanceAfter,
          description: t.description,
          createdAt: t.createdAt,
        }));

        setReservations(reservationRows);
        setPayments([]);
        setWalletTransactions(walletTxRows);
        setWalletBalance(balance);
      } catch (err) {
        console.error('Failed to load user data via API', err);
      }
      setIsLoadingUserData(false);
    }

    loadUserData();
    return () => {
      ignore = true;
    };
  }, [user?.userId]);

  useEffect(() => {
    if (state?.openHistory) {
      setShowHistoryPanel(true);
    }
  }, [state?.openHistory]);

  useEffect(() => {
    let ignore = false;

    async function loadSlotsAndFloors() {
      if (!selectedBuildingId) {
        setSlots([]);
        setFloorsData([]);
        setVehicleTypesForBuilding([]);
        return;
      }

      setIsLoadingSlots(true);

      try {
        // 1) Load vehicle types for this building to map FE vehicle kind to backend id
        const vtRes = await userApi.buildings.vehicleTypes(selectedBuildingId);
        if (ignore) return;
        const vtypes = vtRes.data.items || [];
        setVehicleTypesForBuilding(vtypes);

        const desiredCode = selectedVehicleType === 'car' ? 'car' : selectedVehicleType === 'motorcycle' ? 'motorcycle' : undefined;
        const matched = desiredCode ? vtypes.find((v) => String(v.code).toLowerCase() === desiredCode) : undefined;
        const vehicleTypeId = matched?._id;

        // 2) Load floors availability for building (optionally filtered by vehicleType)
        const floorsRes = await userApi.buildings.floors(selectedBuildingId, vehicleTypeId ? { vehicleTypeId } : undefined);
        if (ignore) return;
        const floors = floorsRes.data.floors || [];
        setFloorsData(floors);

        // Do NOT auto-load slots here — let user pick a floor in the modal first.
        setSlots([]);
        setSelectedFloorIdModal('');
      } catch (err) {
        // fallback: keep existing mock behavior if API fails
        console.error('Failed to load slots/floors', err);
      } finally {
        if (!ignore) setIsLoadingSlots(false);
      }
    }

    loadSlotsAndFloors();
    return () => {
      ignore = true;
    };
  }, [selectedBuildingId, selectedVehicleType]);

  // Load slots for the selected floor in the modal
  useEffect(() => {
    let ignore = false;

    async function loadSlotsForFloor() {
      if (!selectedBuildingId || !selectedFloorIdModal) {
        return;
      }

      setIsLoadingSlots(true);
      try {
        const slotsRes = await userApi.buildings.slots(selectedBuildingId, selectedFloorIdModal);
        if (ignore) return;
        const apiSlots: ApiParkingSlot[] = slotsRes.data.slots || [];
        const mapped = apiSlots.map((s) => {
          // floor may be populated object or an id
          let floorCode: string | undefined;
          if (s.floor && typeof s.floor === 'object' && 'code' in (s.floor as any)) {
            floorCode = String((s.floor as any).code);
          } else if (s.floor && typeof s.floor === 'string') {
            // try to find from floorsData
            const floorId = s.floor;
            const found = floorsData.find((f) => f._id === floorId || String(f._id) === floorId);
            if (found) floorCode = found.code ?? found.name ?? (typeof found.levelNumber === 'number' ? String(found.levelNumber) : undefined);
            else floorCode = floorId;
          } else {
            // fallback: use selectedFloorInfo if available
            floorCode = selectedFloorInfo?.code ?? selectedFloorInfo?.name ?? undefined;
          }

          // vehicleType may be object or id — normalize to 'car'|'motorcycle'|'all'
          let rawCode: string | undefined;
          if (s.vehicleType && typeof s.vehicleType === 'object' && 'code' in (s.vehicleType as any)) {
            rawCode = String((s.vehicleType as any).code);
          } else if (s.vehicleType && typeof s.vehicleType === 'string') {
            const vehicleTypeId = s.vehicleType;
            const found = vehicleTypesForBuilding.find((v) => v._id === vehicleTypeId || String(v._id) === vehicleTypeId);
            rawCode = found ? String(found.code) : vehicleTypeId;
          }
          const vt = normalizeVehicleTypeCode(rawCode);

          return {
            _id: s._id,
            buildingId: selectedBuildingId,
            code: s.code,
            floorCode,
            vehicleType: vt,
            reservable: s.reservable ?? true,
            status: (s.status as any) || 'available',
          } as UserParkingSlotRecord;
        });

        setSlots(mapped);
        // clear any previously selected slot/plate when switching floors
        setSelectedSlot(null);
        setSelectedPlate('');
      } catch (err) {
        console.error('Failed to load slots for floor', err);
      } finally {
        if (!ignore) setIsLoadingSlots(false);
      }
    }

    loadSlotsForFloor();
    return () => {
      ignore = true;
    };
  }, [selectedBuildingId, selectedFloorIdModal]);

  const policyByBuildingId = useMemo(() => {
    return new Map(policies.map((item) => [item.buildingId, item]));
  }, [policies]);

  const selectedBuilding = useMemo(
    () => rows.find((row) => row.building._id === selectedBuildingId) || null,
    [rows, selectedBuildingId],
  );

  const reservationPolicy = useMemo(
    () =>
      policyByBuildingId.get(selectedBuildingId) || {
        minAdvanceMinutes: 15,
        maxAdvanceHours: 72,
        maxHoldMinutes: 30,
        refundPercent: 0,
        isActive: true,
      },
    [policyByBuildingId, selectedBuildingId],
  );

  const activeReservations = useMemo(
    () => reservations.filter((row) => row.status === 'active'),
    [reservations],
  );

  const activeReservationsForSelectedBuilding = useMemo(
    () => activeReservations.filter((row) => row.buildingId === selectedBuildingId),
    [activeReservations, selectedBuildingId],
  );

  const plateOptions = useMemo(() => {
    if (!user || !selectedVehicleType) return [];
    return user.licensePlates.filter((plate) => plate.vehicleType === selectedVehicleType);
  }, [user, selectedVehicleType]);

  const activePlateNumbers = useMemo(
    () => new Set(activeReservations.map((entry) => entry.plateNumber)),
    [activeReservations],
  );

  const availablePlateOptions = useMemo(
    () => plateOptions.filter((plate) => !activePlateNumbers.has(plate.plateNumber)),
    [activePlateNumbers, plateOptions],
  );

  const selectedSlotRecord = useMemo(
    () => slots.find((slot) => slot.code === selectedSlot) || null,
    [selectedSlot, slots],
  );

  const selectedPlateRecord = useMemo(
    () => plateOptions.find((plate) => plate.plateNumber === selectedPlate) || null,
    [plateOptions, selectedPlate],
  );

  const selectedSlotVehicleLabel = selectedSlotRecord
    ? selectedSlotRecord.vehicleType === 'all'
      ? 'Ô tô hoặc xe máy'
      : vehicleTypeLabel(selectedSlotRecord.vehicleType)
    : '--';

  const minDateTime = useMemo(() => {
    const leadMinutes = reservationPolicy?.minAdvanceMinutes ?? 15;
    return toDateTimeLocalValue(new Date(Date.now() + leadMinutes * 60_000));
  }, [reservationPolicy?.minAdvanceMinutes]);

  const maxDateTime = useMemo(() => {
    const maxHours = reservationPolicy?.maxAdvanceHours ?? 72;
    return toDateTimeLocalValue(new Date(Date.now() + maxHours * 3_600_000));
  }, [reservationPolicy?.maxAdvanceHours]);

  const unavailableSlotCodes = useMemo(() => {
    const codes = new Set<string>();
    const reservedInActive = new Set(activeReservationsForSelectedBuilding.map((row) => row.slotCode));

    slots.forEach((slot) => {
      const notAvailableByStatus = slot.status !== 'available';
      const notReservable = !slot.reservable;
      const notMatchVehicle = selectedVehicleType
        ? !slotSupportsVehicle(slot, selectedVehicleType)
        : true;

      if (notAvailableByStatus || notReservable || notMatchVehicle || reservedInActive.has(slot.code)) {
        codes.add(slot.code);
      }
    });

    return Array.from(codes);
  }, [activeReservationsForSelectedBuilding, selectedVehicleType, slots]);

  const availableSlotCount = useMemo(() => {
    if (!selectedVehicleType) return 0;
    const unavailable = new Set(unavailableSlotCodes);
    return slots.filter((slot) => !unavailable.has(slot.code)).length;
  }, [selectedVehicleType, slots, unavailableSlotCodes]);

  const floorsAvailableCount = useMemo(() => {
    return floorsData.reduce((acc, f) => acc + (f.availableSlots || 0), 0);
  }, [floorsData]);

  const floorsTotalSlots = useMemo(() => {
    return floorsData.reduce((acc, f) => acc + (f.totalSlots || 0), 0);
  }, [floorsData]);

  const selectedFloorInfo = useMemo(() => {
    return floorsData.find((f) => f._id === selectedFloorIdModal) || null;
  }, [floorsData, selectedFloorIdModal]);

  useEffect(() => {
    if (!selectedSlot) return;
    if (unavailableSlotCodes.includes(selectedSlot)) {
      setSelectedSlot(null);
      setSelectedPlate('');
    }
  }, [selectedSlot, unavailableSlotCodes]);

  useEffect(() => {
    if (!selectedPlate) return;
    const plateStillValid = plateOptions.some((plate) => plate.plateNumber === selectedPlate);
    if (!plateStillValid || activePlateNumbers.has(selectedPlate)) {
      setSelectedPlate('');
    }
  }, [activePlateNumbers, plateOptions, selectedPlate]);

  useEffect(() => {
    if (!selectedBuildingId || !selectedVehicleType || !scheduledAt) {
      setCurrentStep(1);
      return;
    }
    if (!selectedSlot) {
      setCurrentStep((prev) => (prev > 2 ? 2 : prev));
      return;
    }
    if (!selectedPlate) {
      setCurrentStep((prev) => (prev > 3 ? 3 : prev));
      return;
    }
    setCurrentStep((prev) => (prev > 4 ? 4 : prev));
  }, [scheduledAt, selectedBuildingId, selectedPlate, selectedSlot, selectedVehicleType]);

  if (!session || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  const canOpenBookingForm = Boolean(
    selectedBuildingId && selectedVehicleType && scheduledAt && reservationPolicy?.isActive !== false,
  );
  const canSubmit = Boolean(
    canOpenBookingForm && selectedSlot && selectedPlate && !isLoadingSlots && !isSubmitting,
  );
  const historyOnlyMode = Boolean(state?.openHistory);

  const bookingStep = currentStep;
  const holdAmount = holdAmountForVehicleType(selectedVehicleType);
  const activeFieldGlow = 'shadow-[0_0_0_1px_rgba(249,115,22,0.18),0_0_24px_rgba(249,115,22,0.08)]';

  const refreshUserData = async () => {
    try {
      const [resRes, walletRes, walletTxRes] = await Promise.all([
        userApi.reservations.list({}),
        userApi.wallet.get(),
        userApi.wallet.transactions({ limit: 50 }),
      ]);

      const reservationRows: UserReservationRecord[] = (resRes.data.items || []).map((r: Reservation) => ({
        id: r._id,
        userId: user.userId,
        buildingId: r.building?._id || '',
        buildingName: r.building?.name || '',
        slotCode: r.slot?.code || (r.code || ''),
        plateNumber: r.plateNumber,
        vehicleType: (r.vehicleType?.code === 'car' ? 'car' : 'motorcycle') as ReservationVehicleType,
        scheduledAt: r.startTime,
        createdAt: r.createdAt || new Date().toISOString(),
        status: r.status,
        amountPaid: r.fee || 0,
      }));

      const balance = walletRes.data.wallet?.balance ?? 0;
      const walletTxRows: UserWalletTransactionRecord[] = (walletTxRes.data.items || []).map((t: any) => ({
        id: t._id || t.id,
        userId: t.userId,
        paymentId: t.paymentId,
        reservationId: t.reservationId,
        type: t.type,
        amount: t.amount,
        balanceAfter: t.balanceAfter,
        description: t.description,
        createdAt: t.createdAt,
      }));

      setReservations(reservationRows);
      setPayments([]);
      setWalletTransactions(walletTxRows);
      setWalletBalance(balance);
    } catch (err) {
      console.error('Failed to refresh user data via API', err);
    }
  };

  const handleSlotClick = (slotCode: string) => {
    setBookingError(null);
    setBookingSuccess(null);

    if (!selectedBuildingId) {
      setBookingError('Vui lòng chọn tòa nhà trước khi chọn ô đỗ.');
      return;
    }
    if (!selectedVehicleType) {
      setBookingError('Vui lòng chọn loại xe trước khi chọn ô đỗ.');
      return;
    }
    if (!scheduledAt) {
      setBookingError('Vui lòng chọn thời gian đặt chỗ.');
      return;
    }
    if (reservationPolicy?.isActive === false) {
      setBookingError('Tòa nhà này đang tạm dừng đặt chỗ trước.');
      return;
    }
    if (unavailableSlotCodes.includes(slotCode)) {
      setBookingError('Ô đỗ này hiện không khả dụng.');
      return;
    }

    setSelectedSlot(slotCode);

    const firstAvailablePlate = availablePlateOptions[0];
    setSelectedPlate(firstAvailablePlate?.plateNumber || '');
    setCurrentStep(firstAvailablePlate ? 4 : 3);
    if (!firstAvailablePlate) {
      setBookingError(`Bạn chưa có biển số ${vehicleTypeLabel(selectedVehicleType)} phù hợp hoặc tất cả đang được giữ chỗ.`);
    }
  };

  const handleBuildingChange = (buildingId: string) => {
    setSelectedBuildingId(buildingId);
    setSelectedSlot(null);
    setSelectedPlate('');
    setCurrentStep(1);
    setBookingError(null);
    setBookingSuccess(null);
  };

  const handleConfirmBooking = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBookingError(null);
    setBookingSuccess(null);

    if (!selectedBuilding) {
      setBookingError('Không tìm thấy tòa nhà.');
      return;
    }
    if (!selectedVehicleType) {
      setBookingError('Vui lòng chọn loại xe.');
      return;
    }
    if (!scheduledAt) {
      setBookingError('Vui lòng chọn thời gian đặt chỗ.');
      return;
    }
    if (!selectedSlot) {
      setBookingError('Vui lòng chọn ô đỗ trên bản đồ.');
      return;
    }
    if (!selectedPlate) {
      setBookingError('Vui lòng chọn biển số xe.');
      return;
    }
    if (activeReservations.length >= user.licensePlates.length) {
      setBookingError(
        `Bạn đã đặt tối đa ${user.licensePlates.length} lượt đang giữ. Vui lòng hủy hoặc hoàn tất lượt cũ.`,
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const slotId = slots.find((s) => s.code === selectedSlot)?._id;
      const start = new Date(scheduledAt);
      const holdMinutes = reservationPolicy?.maxHoldMinutes ?? 30;
      const end = new Date(start.getTime() + holdMinutes * 60_000);
      const body: any = {
        plateNumber: selectedPlate,
        buildingId: selectedBuilding.building._id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      };
      if (slotId) body.slotId = slotId;
      if (selectedVehicleType) body.vehicleType = selectedVehicleType;

      const res = await userApi.reservations.create(body);
      const createdReservation: Reservation = res.data.reservation;

      await refreshUserData();
      setBookingSuccess(
        `Đặt chỗ thành công: ${selectedBuilding.building.name} - ${selectedSlot} - ${selectedPlate}.`,
      );
      setSelectedSlot(null);
      setSelectedPlate('');
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Không thể tạo lượt đặt chỗ.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    setBookingError(null);
    setBookingSuccess(null);

    try {
      const res = await userApi.reservations.cancel(reservationId);
      // backend returns reservation detail
      await refreshUserData();
      const cancelled = res.data.reservation;
      setBookingSuccess(`Đã hủy lượt đặt. Trạng thái: ${cancelled.status}`);
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Không thể hủy lượt đặt.');
    }
  };

  const historyPanel = (
    <div className="space-y-3">
      {reservations.length > 0 ? (
        reservations.map((entry, idx) => {
          const refundPolicyPercent = policyByBuildingId.get(entry.buildingId)?.refundPercent ?? 0;
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05, duration: 0.35 }}
              whileHover={{ scale: 1.01, borderColor: entry.status === 'active' ? 'rgba(249,115,22,0.25)' : 'rgba(255,255,255,0.1)' }}
              className={`rounded-2xl border p-4 transition-all duration-300 ${
                entry.status === 'active'
                  ? 'border-orange-500/15 bg-slate-950 shadow-[0_0_10px_rgba(249,115,22,0.03)]'
                  : 'border-white/5 bg-slate-950/50 opacity-70'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="font-mono text-xs font-black text-orange-400">{entry.id}</p>
                <span
                  className={`rounded px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider ${
                    entry.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {entry.status === 'active' ? 'Đang giữ' : entry.status === 'cancelled' ? 'Đã hủy' : 'Hoàn tất'}
                </span>
              </div>

              <div className="mt-2 space-y-1 text-xs font-semibold text-slate-300">
                <p className="flex items-center gap-2">
                  <Building2 size={13} className="text-cyan-300" />
                  {entry.buildingName}
                </p>
                <p className="flex items-center gap-2">
                  {entry.vehicleType === 'car' ? (
                    <Car size={13} className="text-cyan-300" />
                  ) : (
                    <Bike size={13} className="text-purple-300" />
                  )}
                  {entry.plateNumber} - Ô {entry.slotCode}
                </p>
                <p className="flex items-center gap-2">
                  <Clock3 size={13} className="text-orange-300" />
                  {formatDateTime(entry.scheduledAt)}
                </p>
                <p className="text-[11px] text-slate-400">
                  Tiền đã giữ: <span className="font-black text-orange-300">{formatMoney(entry.amountPaid)}</span>
                </p>
                {entry.status === 'cancelled' ? (
                  <p className="text-[11px] text-emerald-300">
                    Đã hoàn: {formatMoney(entry.refundAmount || 0)} ({entry.refundPercent || refundPolicyPercent}%)
                  </p>
                ) : (
                  <p className="text-[11px] text-slate-400">
                    Hủy lúc này được hoàn: {refundPolicyPercent}% ({formatMoney(Math.round((entry.amountPaid * refundPolicyPercent) / 100))})
                  </p>
                )}
              </div>

              {entry.status === 'active' ? (
                <motion.button
                  type="button"
                  onClick={() => handleCancelReservation(entry.id)}
                  whileHover={{ scale: 1.03, backgroundColor: 'rgba(239,68,68,0.2)', borderColor: 'rgba(239,68,68,0.45)' }}
                  whileTap={{ scale: 0.97 }}
                  className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-rose-400 transition-all duration-300"
                >
                  <Trash2 size={12} />
                  Hủy và hoàn tiền
                </motion.button>
              ) : null}
            </motion.div>
          );
        })
      ) : (
        <p className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-center text-xs font-semibold text-slate-500">
          {isLoadingUserData ? 'Đang tải lịch sử...' : 'Chưa có lượt đặt chỗ nào.'}
        </p>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-[#070b12] text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <motion.button
            type="button"
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(249,115,22,0.3)', borderColor: 'rgba(249,115,22,0.3)' }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-200 transition-all duration-300 hover:border-orange-300/40 hover:bg-orange-300/10 hover:text-orange-200"
          >
            <ArrowLeft size={14} />
            Trang chủ
          </motion.button>
          <div className="flex flex-wrap items-center gap-2">
          <motion.button
            type="button"
            onClick={() => navigate('/long-term-subscriptions')}
            whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(16,185,129,0.3)', borderColor: 'rgba(16,185,129,0.3)' }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-200 transition-all duration-300 hover:border-emerald-300/40 hover:bg-emerald-300/10 hover:text-emerald-200"
          >
            <CalendarClock size={14} />
            Gói dài hạn
          </motion.button>
          <motion.button
            type="button"
            onClick={() => navigate('/profile')}
            whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(249,115,22,0.3)', borderColor: 'rgba(249,115,22,0.3)' }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-200 transition-all duration-300 hover:border-orange-300/40 hover:bg-orange-300/10 hover:text-orange-200"
          >
            <User size={14} />
            Hồ sơ
          </motion.button>
        </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">Đặt chỗ và hủy đặt chỗ</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-6 text-slate-400">
            Chọn tòa nhà, loại xe, thời gian đặt chỗ. Khi hủy, hệ thống hoàn tiền theo chính sách.
          </p>
        </motion.div>

        {bookingSuccess ? (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm font-semibold text-emerald-300">
            <CheckCircle2 size={16} />
            {bookingSuccess}
          </div>
        ) : null}

        {bookingError ? (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 p-3 text-sm font-semibold text-rose-300">
            <AlertTriangle size={16} />
            {bookingError}
          </div>
        ) : null}

        {historyOnlyMode ? (
          <div className="mx-auto max-w-4xl">
            <div className="rounded-[28px] border border-slate-800/90 bg-slate-900/75 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.24)] sm:p-6">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-200">Lịch sử khách hàng</p>
                  <h2 className="mt-1 text-2xl font-black text-white">Lịch sử đặt chỗ của bạn</h2>
                  <p className="mt-2 text-sm font-semibold text-slate-400">
                    Xem lại các lượt đã đặt, trạng thái hiện tại và thao tác hủy/hoàn tiền nếu còn hiệu lực.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/reservations', { replace: true })}
                    className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-black text-slate-300 transition hover:bg-white/[0.06]"
                  >
                    Về đặt chỗ
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/')}
                    className="rounded-2xl border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-sm font-black text-cyan-200 transition hover:bg-cyan-300/16"
                  >
                    Về trang chủ
                  </button>
                </div>
              </div>
              {historyPanel}
            </div>
          </div>
        ) : (
        <div className="flex justify-center">
          <div className="w-full max-w-6xl">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
              <div className="lg:col-span-7 xl:col-span-8">
                <form
                  onSubmit={handleConfirmBooking}
                  className="rounded-[28px] border border-slate-800/90 bg-slate-900/80 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.28)] sm:p-6"
                >
                  <div className="mb-5 flex flex-col gap-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex items-start gap-3">
                        <div className="rounded-2xl border border-orange-300/20 bg-orange-300/10 p-3 text-orange-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                          <CalendarClock size={20} />
                        </div>
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-300">Đặt chỗ nhanh</p>
                          <h2 className="mt-1 text-xl font-black text-white">Chọn đúng ô, đúng xe, đúng biển số</h2>
                          <p className="mt-1 text-xs font-semibold text-slate-400">
                            Hoàn tất theo 4 bước, phần chọn ô mở riêng trong popup để màn hình không bị chật.
                          </p>
                        </div>
                      </div>
                      <motion.button
                        type="button"
                        onClick={() => setShowHistoryPanel((visible) => !visible)}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="inline-flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-bold uppercase tracking-wider text-slate-300 transition-all duration-300 hover:border-cyan-300/30 hover:bg-cyan-300/10 hover:text-cyan-200"
                      >
                        <History size={14} />
                        <span>{showHistoryPanel ? 'Ẩn lịch sử' : 'Lịch sử'} ({isLoadingUserData ? '...' : reservations.length})</span>
                      </motion.button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {[
                        { step: 1, label: 'Thông tin', done: Boolean(selectedBuildingId && selectedVehicleType && scheduledAt) },
                        { step: 2, label: 'Ô đỗ', done: Boolean(selectedSlot) },
                        { step: 3, label: 'Biển số', done: Boolean(selectedPlate) },
                        { step: 4, label: 'Xác nhận', done: canSubmit },
                      ].map((item) => (
                        <div
                          key={item.step}
                          className={`rounded-full border px-3 py-2 transition-all duration-300 ${
                            item.done
                              ? 'border-emerald-300/25 bg-emerald-300/10 text-emerald-200'
                              : bookingStep === item.step
                                ? item.step === 1
                                  ? 'border-emerald-300/40 bg-emerald-300/12 text-emerald-200 shadow-[0_0_24px_rgba(52,211,153,0.14)]'
                                  : 'border-orange-300/30 bg-orange-300/10 text-orange-200'
                                : 'border-white/10 bg-white/[0.03] text-slate-500'
                          }`}
                        >
                          <p className="text-[10px] font-black uppercase tracking-wider">Bước {item.step}</p>
                          <p className="mt-0.5 text-xs font-black">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-800 bg-[#0b111d] p-4 sm:p-5">
                    <AnimatePresence mode="wait">
                      {currentStep === 1 ? (
                        <motion.div
                          key="step-1"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="space-y-4"
                        >
                          <div className={`rounded-3xl border border-emerald-300/20 bg-emerald-300/8 p-4 ${activeFieldGlow}`}>
                            <div className="mb-3 flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_14px_rgba(52,211,153,0.8)]" />
                                <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-emerald-200">Bước 1 đang hoạt động</span>
                              </div>
                              <span className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1 font-mono text-[11px] font-black text-emerald-200">
                                Khả dụng: {selectedVehicleType ? (floorsData.length ? `${floorsAvailableCount}/${floorsTotalSlots}` : `${availableSlotCount}/${slots.length}`) : '--'}
                              </span>
                            </div>

                            <div className="space-y-4">
                              <div className="block">
                                <span className={fieldLabelClass(true)}>Tòa nhà</span>
                                <CustomSelect
                                  value={selectedBuildingId}
                                  onChange={(val) => handleBuildingChange(val)}
                                  options={[
                                    { value: '', label: '-- Chọn tòa nhà --' },
                                    ...rows.map((row) => ({
                                      value: row.building._id,
                                      label: row.building.name,
                                    })),
                                  ]}
                                  placeholder="-- Chọn tòa nhà --"
                                />
                              </div>

                              <div className="block">
                                <span className={fieldLabelClass(true)}>Loại xe</span>
                                <CustomSelect
                                  value={selectedVehicleType}
                                  onChange={(val) => {
                                    const next = val as ReservationVehicleType | '';
                                    setSelectedVehicleType(next);
                                    setSelectedSlot(null);
                                    setSelectedPlate('');
                                    setCurrentStep(1);
                                  }}
                                  options={[
                                    { value: '', label: '-- Chọn loại xe --' },
                                    { value: 'car', label: 'Ô tô' },
                                    { value: 'motorcycle', label: 'Xe máy' },
                                  ]}
                                  placeholder="-- Chọn loại xe --"
                                />
                              </div>

                              <label className="block">
                                <span className={fieldLabelClass(true)}>Thời gian đặt chỗ</span>
                                <input
                                  type="datetime-local"
                                  value={scheduledAt}
                                  min={minDateTime}
                                  max={maxDateTime}
                                  onChange={(event) => {
                                    setScheduledAt(event.target.value);
                                    setSelectedSlot(null);
                                    setCurrentStep(1);
                                  }}
                                  className="mt-1 h-12 w-full rounded-2xl border border-slate-700/80 bg-[#070b12] px-4 text-sm font-semibold text-white outline-none transition-all duration-300 focus:border-orange-300/60 focus:ring-4 focus:ring-orange-300/10 font-mono"
                                />
                              </label>
                            </div>
                          </div>

                          <motion.button
                            type="button"
                            onClick={() => setCurrentStep(2)}
                            disabled={!canOpenBookingForm}
                            whileHover={canOpenBookingForm ? { scale: 1.01 } : {}}
                            whileTap={canOpenBookingForm ? { scale: 0.99 } : {}}
                            className="min-h-12 w-full rounded-2xl border border-emerald-300/20 bg-gradient-to-r from-emerald-400 to-cyan-300 px-4 text-sm font-black uppercase tracking-wider text-slate-950 shadow-[0_0_24px_rgba(52,211,153,0.28)] transition-all duration-300 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none"
                          >
                            Tiếp tục chọn ô đỗ
                          </motion.button>
                        </motion.div>
                      ) : null}

                      {currentStep === 2 ? (
                        <motion.div
                          key="step-2"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="space-y-4"
                        >
                          <div className="rounded-3xl border border-cyan-300/15 bg-white/[0.03] p-4">
                            <span className={fieldLabelClass(true)}>Chọn ô đỗ</span>
                            <div className="mt-2 grid items-stretch gap-3 sm:grid-cols-[minmax(0,1fr)_190px]">
                              <motion.button
                                type="button"
                                onClick={() => {
                                  if (!selectedBuildingId) {
                                    setBookingError('Vui lòng chọn tòa nhà trước.');
                                    setCurrentStep(1);
                                    return;
                                  }
                                  if (!selectedVehicleType) {
                                    setBookingError('Vui lòng chọn loại xe trước.');
                                    setCurrentStep(1);
                                    return;
                                  }
                                  if (!scheduledAt) {
                                    setBookingError('Vui lòng chọn thời gian đặt chỗ trước.');
                                    setCurrentStep(1);
                                    return;
                                  }
                                  setShowSlotModal(true);
                                }}
                                disabled={!canOpenBookingForm || isLoadingSlots}
                                whileHover={canOpenBookingForm ? { scale: 1.01 } : {}}
                                whileTap={canOpenBookingForm ? { scale: 0.99 } : {}}
                                className="flex min-h-16 items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-[#08131f] px-4 text-sm font-black uppercase tracking-wider text-cyan-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all duration-300 hover:border-cyan-300/40 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500"
                              >
                                <MapPin size={16} />
                                Chọn ô đỗ
                              </motion.button>
                              <div className="rounded-2xl border border-orange-300/20 bg-[#070b12] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                                <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">Console slot</p>
                                <p className="mt-2 font-mono text-2xl font-black text-orange-300">{selectedSlot || '--'}</p>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => setCurrentStep(1)}
                              className="min-h-11 flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm font-black uppercase tracking-wider text-slate-300 transition hover:bg-white/[0.06]"
                            >
                              Quay lại
                            </button>
                            <button
                              type="button"
                              onClick={() => setCurrentStep(3)}
                              disabled={!selectedSlot}
                              className="min-h-11 flex-1 rounded-2xl border border-orange-300/20 bg-gradient-to-r from-orange-500 to-amber-400 px-4 text-sm font-black uppercase tracking-wider text-slate-950 shadow-[0_0_25px_rgba(249,115,22,0.4)] transition disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none"
                            >
                              Tiếp tục chọn biển số
                            </button>
                          </div>
                        </motion.div>
                      ) : null}

                      {currentStep === 3 ? (
                        <motion.div
                          key="step-3"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="space-y-4"
                        >
                          <div className={`rounded-3xl border border-orange-300/12 bg-white/[0.03] p-4 ${activeFieldGlow}`}>
                            <span className={fieldLabelClass(true)}>Biển số xe</span>
                            <CustomSelect
                              value={selectedPlate}
                              onChange={(value) => {
                                setSelectedPlate(value);
                                if (value) setCurrentStep(4);
                              }}
                              disabled={!selectedSlot || availablePlateOptions.length === 0}
                              options={[
                                { value: '', label: '-- Chọn biển số --' },
                                ...plateOptions.map((plate) => {
                                  const isBusy = activePlateNumbers.has(plate.plateNumber);
                                  return {
                                    value: plate.plateNumber,
                                    label: `${plate.plateNumber} - ${vehicleTypeLabel(plate.vehicleType)} ${isBusy ? '(đang sử dụng)' : ''}`,
                                    disabled: isBusy,
                                  };
                                }),
                              ]}
                              placeholder="-- Chọn biển số --"
                            />
                            <p className="mt-2 text-[11px] font-semibold text-slate-500">
                              {selectedSlot
                                ? selectedPlateRecord
                                  ? `Đang dùng ${selectedPlateRecord.plateNumber} cho ô ${selectedSlot}.`
                                  : 'Chỉ hiện biển số phù hợp với loại xe của ô đã chọn.'
                                : 'Chọn ô đỗ trước để tải đúng danh sách biển số.'}
                            </p>
                          </div>

                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => setCurrentStep(2)}
                              className="min-h-11 flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm font-black uppercase tracking-wider text-slate-300 transition hover:bg-white/[0.06]"
                            >
                              Quay lại
                            </button>
                            <button
                              type="button"
                              onClick={() => setCurrentStep(4)}
                              disabled={!selectedPlate}
                              className="min-h-11 flex-1 rounded-2xl border border-orange-300/20 bg-gradient-to-r from-orange-500 to-amber-400 px-4 text-sm font-black uppercase tracking-wider text-slate-950 shadow-[0_0_25px_rgba(249,115,22,0.4)] transition disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none"
                            >
                              Xem xác nhận
                            </button>
                          </div>
                        </motion.div>
                      ) : null}

                      {currentStep === 4 ? (
                        <motion.div
                          key="step-4"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.22, ease: 'easeOut' }}
                          className="space-y-4"
                        >
                          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
                            <span className={fieldLabelClass(true)}>Xác nhận đặt chỗ</span>
                            <div className="mt-3 grid gap-3 sm:grid-cols-2">
                              <div className="rounded-2xl border border-white/5 bg-[#070b12] p-3">
                                <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Tòa nhà</p>
                                <p className="mt-1 text-sm font-black text-white">{selectedBuilding?.building.name || '--'}</p>
                              </div>
                              <div className="rounded-2xl border border-white/5 bg-[#070b12] p-3">
                                <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Thời gian</p>
                                <p className="mt-1 text-sm font-black text-white">{scheduledAt ? formatDateTime(scheduledAt) : '--'}</p>
                              </div>
                              <div className="rounded-2xl border border-white/5 bg-[#070b12] p-3">
                                <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Ô đỗ</p>
                                <p className="mt-1 font-mono text-lg font-black text-orange-300">{selectedSlot || '--'}</p>
                              </div>
                              <div className="rounded-2xl border border-white/5 bg-[#070b12] p-3">
                                <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">Biển số</p>
                                <p className="mt-1 font-mono text-lg font-black text-cyan-200">{selectedPlate || '--'}</p>
                              </div>
                            </div>
                            <div className="mt-3 rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-4 py-3">
                              <div className="flex items-center justify-between gap-3">
                                <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-100">Tiền giữ chỗ</span>
                                <span className="font-mono text-sm font-black text-emerald-200">{holdAmount ? formatMoney(holdAmount) : '--'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => setCurrentStep(3)}
                              className="min-h-11 flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm font-black uppercase tracking-wider text-slate-300 transition hover:bg-white/[0.06]"
                            >
                              Quay lại
                            </button>
                            <motion.button
                              type="submit"
                              disabled={!canSubmit}
                              animate={canSubmit ? { boxShadow: ['0 0 20px rgba(249,115,22,0.22)', '0 0 25px rgba(249,115,22,0.4)', '0 0 20px rgba(249,115,22,0.22)'] } : {}}
                              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
                              whileHover={canSubmit ? { scale: 1.01 } : {}}
                              whileTap={canSubmit ? { scale: 0.99 } : {}}
                              className="min-h-11 flex-1 rounded-2xl border border-orange-300/20 bg-gradient-to-r from-orange-500 to-amber-400 px-4 text-sm font-black uppercase tracking-wider text-slate-950 shadow-[0_0_25px_rgba(249,115,22,0.4)] transition disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800 disabled:text-slate-500 disabled:shadow-none"
                            >
                              {isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt chỗ'}
                            </motion.button>
                          </div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </form>
              </div>

              <div className="lg:col-span-5 xl:col-span-4">
                <div className="rounded-[28px] border border-slate-800/90 bg-slate-900/70 p-4 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-5 lg:sticky lg:top-6">
                  <div className="mb-5 rounded-3xl border border-slate-800 bg-[#0b111d] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-orange-200">Tóm tắt đặt chỗ</p>
                    <div className="mt-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs font-bold text-slate-400">Tòa nhà</span>
                        <span className="max-w-[65%] text-right text-sm font-black text-white">
                          {selectedBuilding?.building.name || '--'}
                        </span>
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="text-xs font-bold text-slate-400">Thời gian</span>
                        <span className="text-right text-sm font-black text-white">
                          {scheduledAt ? formatDateTime(scheduledAt) : '--'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-2xl border border-slate-800 bg-[#070b12] p-3">
                          <p className="text-[10px] font-bold uppercase text-slate-500">Ô đỗ</p>
                          <p className="mt-1 font-mono text-lg font-black text-orange-300">{selectedSlot || '--'}</p>
                        </div>
                        <div className="rounded-2xl border border-slate-800 bg-[#070b12] p-3">
                          <p className="text-[10px] font-bold uppercase text-slate-500">Xe</p>
                          <div className="mt-1 flex items-center gap-2 text-sm font-black text-white">
                            {selectedVehicleType === 'motorcycle' ? (
                              <Bike size={15} className="text-purple-300" />
                            ) : selectedVehicleType === 'car' ? (
                              <Car size={15} className="text-cyan-300" />
                            ) : (
                              <ParkingCircle size={15} className="text-slate-500" />
                            )}
                            <span>{selectedVehicleType ? vehicleTypeLabel(selectedVehicleType) : '--'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="rounded-2xl border border-slate-800 bg-[#070b12] p-3">
                        <p className="text-[10px] font-bold uppercase text-slate-500">Biển số</p>
                        <p className="mt-1 text-sm font-black text-cyan-200">
                          {selectedPlateRecord
                            ? `${selectedPlateRecord.plateNumber} - ${vehicleTypeLabel(selectedPlateRecord.vehicleType)}`
                            : '--'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-emerald-300/20 bg-emerald-300/10 p-3">
                        <span className="text-xs font-bold text-emerald-100">Tiền giữ chỗ</span>
                        <span className="text-sm font-black text-emerald-200">{holdAmount ? formatMoney(holdAmount) : '--'}</span>
                      </div>
                    </div>
                  </div>

                      <div className="mb-4 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
                      <WalletCards size={16} className="text-cyan-300" />
                      Ví và giao dịch hoàn tiền
                    </h2>
                    <p className="rounded-full bg-emerald-300/10 px-3 py-1 text-xs font-black text-emerald-200">{formatMoney(walletBalance)}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-4">
                      <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Payments</p>
                      {payments.length > 0 ? (
                        <div className="space-y-0">
                          {payments.slice(0, 4).map((payment, index) => (
                            <div
                              key={payment.id}
                              className={`py-3 ${index < Math.min(payments.slice(0, 4).length, 4) - 1 ? 'border-b border-white/5' : ''}`}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-black text-white">{paymentTypeLabel(payment.type)}</p>
                                  <p className="mt-1 text-[11px] text-slate-400">{payment.note}</p>
                                </div>
                                <p
                                  className={`font-mono text-sm font-black ${
                                    payment.direction === 'credit' ? 'text-emerald-300' : 'text-rose-300'
                                  }`}
                                >
                                  {payment.direction === 'credit' ? '+' : '-'}
                                  {formatMoney(payment.amount)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-slate-500">Chưa có giao dịch payment.</p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-white/5 bg-slate-900/40 p-4">
                      <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Wallet Transactions</p>
                      {walletTransactions.length > 0 ? (
                        <div className="space-y-0">
                          {walletTransactions.slice(0, 4).map((tx, index) => (
                            <div
                              key={tx.id}
                              className={`py-3 ${index < Math.min(walletTransactions.slice(0, 4).length, 4) - 1 ? 'border-b border-white/5' : ''}`}
                            >
                              <p className="text-sm font-black text-white">{tx.description}</p>
                              <p className="mt-1 text-[11px] text-slate-400">{formatDateTime(tx.createdAt)}</p>
                              <p className="mt-2 font-mono text-xs font-black text-slate-300">
                                <span className={tx.type === 'credit' ? 'text-emerald-300' : 'text-rose-300'}>
                                  {tx.type === 'credit' ? '+' : '-'}
                                  {formatMoney(tx.amount)}
                                </span>
                                <span className="text-slate-500"> • </span>
                                <span className="text-slate-400">Số dư:</span>{' '}
                                <span className="text-emerald-300">{formatMoney(tx.balanceAfter ?? 0)}</span>
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs font-semibold text-slate-500">Chưa có giao dịch ví.</p>
                      )}
                    </div>

                    {showHistoryPanel ? (
                      <div className="rounded-3xl border border-cyan-300/20 bg-slate-950/80 p-4 shadow-[inset_0_0_24px_rgba(16,185,129,0.12)]">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">Lịch sử đặt chỗ</p>
                            <p className="mt-1 text-sm font-semibold text-slate-400">Các lượt đặt chỗ gần nhất và trạng thái hiện tại.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setShowHistoryPanel(false)}
                            className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-black uppercase tracking-wider text-slate-300 transition hover:bg-white/[0.06]"
                          >
                            Đóng
                          </button>
                        </div>
                        {historyPanel}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              {isLoadingBuildings || isLoadingSlots ? (
                <p className="text-xs font-semibold text-slate-500">
                  Đang tải dữ liệu tòa nhà và danh sách slot...
                </p>
              ) : null}
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Slot Selection Modal */}
      {showSlotModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-2 backdrop-blur-md"
          onClick={() => setShowSlotModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[88vh] w-full max-w-5xl overflow-auto rounded-[28px] border border-slate-700/80 bg-[#0b111d] p-4 shadow-[0_30px_120px_rgba(0,0,0,0.55)] sm:p-6"
          >
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-2xl bg-cyan-300/10 p-2 text-cyan-200">
                  <MapPin size={18} />
                </span>
                <h2 className="text-lg font-black uppercase tracking-wider text-white">
                  Chọn ô đỗ
                </h2>
                <span className="text-xs font-bold text-slate-400">
                  Khả dụng: <span className="text-emerald-300">{selectedFloorInfo ? selectedFloorInfo.availableSlots : floorsData.length ? floorsAvailableCount : availableSlotCount}</span> / {selectedFloorInfo ? selectedFloorInfo.totalSlots : floorsData.length ? floorsTotalSlots : slots.length}
                </span>
              </div>
              <motion.button
                type="button"
                onClick={() => setShowSlotModal(false)}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-slate-300 transition-all duration-300 hover:border-orange-300/40 hover:bg-orange-300/10 hover:text-orange-200"
              >
                <X size={20} />
              </motion.button>
            </div>

            <div className="mb-3">
              <span className={fieldLabelClass(true)}>Chọn tầng</span>
              <CustomSelect
                value={selectedFloorIdModal}
                onChange={(val) => {
                  const next = String(val || '');
                  setSelectedFloorIdModal(next);
                  setSelectedSlot(null);
                  setSelectedPlate('');
                }}
                options={[
                  { value: '', label: '-- Chọn tầng --' },
                  ...floorsData.map((f) => ({ value: f._id, label: `${f.name} (${f.availableSlots}/${f.totalSlots})` })),
                ]}
                placeholder="-- Chọn tầng --"
              />
              <p className="mt-2 text-xs text-slate-400">Chọn tầng để tải danh sách ô đỗ tương ứng.</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-3xl border border-slate-800 bg-[#070b12] p-3 sm:p-4">
              <ParkingMap2D
                interactive
                slots={slots.map((slot) => ({
                  code: slot.code,
                  status: slot.status === 'available' && slot.reservable ? 'available' : 'unavailable',
                  vehicleType: slot.vehicleType === 'all' ? undefined : slot.vehicleType,
                }))}
                selectedSlot={selectedSlot}
                activeReservations={activeReservationsForSelectedBuilding.map((item) => ({
                  slotCode: item.slotCode,
                  plateNumber: item.plateNumber,
                  vehicleType: item.vehicleType,
                }))}
                unavailableSlots={unavailableSlotCodes}
                onSlotClick={handleSlotClick}
              />
            </div>

            <div className="rounded-3xl border border-slate-800 bg-[#070b12] p-4 lg:sticky lg:top-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-wider text-cyan-200">Xe dùng cho ô đang chọn</p>
                  <p className="mt-1 text-sm font-semibold text-slate-300">
                    {selectedSlot ? (
                      <>
                        Ô <span className="font-mono font-black text-orange-300">{selectedSlot}</span>
                        <span className="mx-2 text-slate-600">•</span>
                        Chỉ nhận <span className="font-black text-cyan-200">{selectedSlotVehicleLabel}</span>
                      </>
                    ) : (
                      'Chạm vào một ô đỗ để xem đúng loại xe và biển số phù hợp.'
                    )}
                  </p>
                </div>
                <div className="rounded-2xl border border-slate-800 bg-[#0b111d] px-3 py-2">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Đang lọc</p>
                  <div className="mt-1 flex items-center gap-2 text-sm font-black text-white">
                    {selectedVehicleType === 'motorcycle' ? (
                      <Bike size={15} className="text-purple-300" />
                    ) : selectedVehicleType === 'car' ? (
                      <Car size={15} className="text-cyan-300" />
                    ) : (
                      <ParkingCircle size={15} className="text-slate-500" />
                    )}
                    <span>{selectedVehicleType ? vehicleTypeLabel(selectedVehicleType) : '--'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <span className="mb-1 block text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                  Biển số xe của bạn
                </span>
                <CustomSelect
                  value={selectedPlate}
                  onChange={setSelectedPlate}
                  disabled={!selectedSlot || availablePlateOptions.length === 0}
                  options={[
                    { value: '', label: '-- Chọn biển số --' },
                    ...plateOptions.map((plate) => {
                      const isBusy = activePlateNumbers.has(plate.plateNumber);
                      return {
                        value: plate.plateNumber,
                        label: `${plate.plateNumber} - ${vehicleTypeLabel(plate.vehicleType)} ${isBusy ? '(đang sử dụng)' : ''}`,
                        disabled: isBusy,
                      };
                    }),
                  ]}
                  placeholder="-- Chọn biển số --"
                />
                <p className="mt-2 text-[11px] font-semibold text-slate-500">
                  {selectedSlot
                    ? selectedPlateRecord
                      ? `Sẽ đặt ${selectedSlot} cho ${selectedPlateRecord.plateNumber} - ${vehicleTypeLabel(selectedPlateRecord.vehicleType)}.`
                      : 'Không có biển số rảnh cho loại xe này.'
                    : 'Nếu ô chỉ nhận xe máy, danh sách này chỉ hiện biển số xe máy.'}
                </p>
              </div>
            </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 rounded-3xl border border-slate-800 bg-[#070b12] p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-slate-300">
                {selectedSlot ? (
                  <>
                    <span className="text-orange-400 font-black">Ô {selectedSlot}</span>
                    <span className="text-slate-400 ml-2">đã được chọn</span>
                  </>
                ) : (
                  <span className="text-slate-500">Nhấn vào ô đỗ để chọn</span>
                )}
              </p>
              <motion.button
                type="button"
                onClick={() => setShowSlotModal(false)}
                disabled={!selectedSlot || !selectedPlate}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full rounded-2xl bg-orange-300 px-5 py-2.5 text-sm font-black uppercase tracking-wider text-slate-950 transition-all duration-300 hover:bg-orange-200 disabled:cursor-not-allowed disabled:bg-slate-800 disabled:text-slate-500 sm:w-auto"
              >
                Hoàn tất
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

    </main>
  );
}

