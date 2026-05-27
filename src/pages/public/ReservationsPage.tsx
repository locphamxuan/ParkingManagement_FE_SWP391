import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
import { AnimatedParkingMap3D } from '@/components/shared/AnimatedParkingMap3D';
import { useAuth } from '@/hooks/useAuth';
import { CustomSelect } from '@/components/ui/select';
import { listUserBuildingViews, type UserBuildingView } from '@/pages/User/mockBuildingsData';
import {
  cancelUserReservation,
  createUserReservation,
  getUserWalletBalance,
  listParkingSlotsByBuilding,
  listReservationPolicies,
  listUserPayments,
  listUserReservations,
  listUserWalletTransactions,
  slotSupportsVehicle,
  type ReservationVehicleType,
  type UserParkingSlotRecord,
  type UserPaymentRecord,
  type UserReservationPolicyRecord,
  type UserReservationRecord,
  type UserWalletTransactionRecord,
} from '@/pages/User/mockReservationsData';

interface ReservationLocationState {
  buildingId?: string;
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

function paymentTypeLabel(type: UserPaymentRecord['type']): string {
  return type === 'reservation_refund' ? 'Hoàn tiền hủy đặt chỗ' : 'Giữ chỗ';
}

export default function ReservationsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const state = (location.state as ReservationLocationState | null) ?? null;

  const [rows, setRows] = useState<UserBuildingView[]>([]);
  const [slots, setSlots] = useState<UserParkingSlotRecord[]>([]);
  const [policies, setPolicies] = useState<UserReservationPolicyRecord[]>([]);
  const [reservations, setReservations] = useState<UserReservationRecord[]>([]);
  const [payments, setPayments] = useState<UserPaymentRecord[]>([]);
  const [walletTransactions, setWalletTransactions] = useState<UserWalletTransactionRecord[]>([]);
  const [walletBalance, setWalletBalance] = useState(0);

  const [isLoadingBuildings, setIsLoadingBuildings] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isLoadingUserData, setIsLoadingUserData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState<ReservationVehicleType | ''>('');
  const [scheduledAt, setScheduledAt] = useState(defaultScheduleValue());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedPlate, setSelectedPlate] = useState('');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

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
      const [buildingRows, policyRows] = await Promise.all([
        listUserBuildingViews(),
        listReservationPolicies(),
      ]);
      if (ignore) return;

      setRows(buildingRows);
      setPolicies(policyRows);
      const preferredBuildingId = state?.buildingId || buildingRows[0]?.building._id || '';
      setSelectedBuildingId((current) => current || preferredBuildingId);
      setIsLoadingBuildings(false);
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
      const [reservationRows, paymentRows, walletTxRows, balance] = await Promise.all([
        listUserReservations(user.userId),
        listUserPayments(user.userId),
        listUserWalletTransactions(user.userId),
        getUserWalletBalance(user.userId),
      ]);

      if (ignore) return;
      setReservations(reservationRows);
      setPayments(paymentRows);
      setWalletTransactions(walletTxRows);
      setWalletBalance(balance);
      setIsLoadingUserData(false);
    }

    loadUserData();
    return () => {
      ignore = true;
    };
  }, [user?.userId]);

  useEffect(() => {
    let ignore = false;

    async function loadSlots() {
      if (!selectedBuildingId) {
        setSlots([]);
        return;
      }

      setIsLoadingSlots(true);
      const slotRows = await listParkingSlotsByBuilding(selectedBuildingId);
      if (ignore) return;
      setSlots(slotRows);
      setIsLoadingSlots(false);
    }

    loadSlots();
    return () => {
      ignore = true;
    };
  }, [selectedBuildingId]);

  const policyByBuildingId = useMemo(() => {
    return new Map(policies.map((item) => [item.buildingId, item]));
  }, [policies]);

  const selectedBuilding = useMemo(
    () => rows.find((row) => row.building._id === selectedBuildingId) || null,
    [rows, selectedBuildingId],
  );

  const reservationPolicy = useMemo(
    () => policyByBuildingId.get(selectedBuildingId) || null,
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

  useEffect(() => {
    if (!selectedSlot) return;
    if (unavailableSlotCodes.includes(selectedSlot)) {
      setSelectedSlot(null);
    }
  }, [selectedSlot, unavailableSlotCodes]);

  if (!session || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  const canOpenBookingForm = Boolean(
    selectedBuildingId && selectedVehicleType && scheduledAt && reservationPolicy?.isActive !== false,
  );
  const canSubmit = Boolean(
    canOpenBookingForm && selectedSlot && selectedPlate && !isLoadingSlots && !isSubmitting,
  );

  const refreshUserData = async () => {
    const [reservationRows, paymentRows, walletTxRows, balance] = await Promise.all([
      listUserReservations(user.userId),
      listUserPayments(user.userId),
      listUserWalletTransactions(user.userId),
      getUserWalletBalance(user.userId),
    ]);

    setReservations(reservationRows);
    setPayments(paymentRows);
    setWalletTransactions(walletTxRows);
    setWalletBalance(balance);
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
    setShowSlotModal(false);

    const firstAvailablePlate = plateOptions.find(
      (plate) => !activeReservations.some((entry) => entry.plateNumber === plate.plateNumber),
    );
    setSelectedPlate(firstAvailablePlate?.plateNumber || '');
  };

  const handleBuildingChange = (buildingId: string) => {
    setSelectedBuildingId(buildingId);
    setSelectedSlot(null);
    setSelectedPlate('');
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
      const created = await createUserReservation({
        userId: user.userId,
        buildingId: selectedBuilding.building._id,
        buildingName: selectedBuilding.building.name,
        slotCode: selectedSlot,
        plateNumber: selectedPlate,
        vehicleType: selectedVehicleType,
        scheduledAt,
      });

      await refreshUserData();
      setBookingSuccess(
        `Đặt chỗ thành công: ${selectedBuilding.building.name} - ${selectedSlot} - ${selectedPlate}. Đã giữ ${formatMoney(created.amountPaid)} trong ví.`,
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
      const result = await cancelUserReservation(reservationId, user.userId);
      await refreshUserData();
      setBookingSuccess(
        `Đã hủy lượt đặt ${result.reservation.slotCode}. Hoàn ${result.refundPercent}%: ${formatMoney(result.refundAmount)}.`,
      );
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Không thể hủy lượt đặt.');
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 p-4"
        >
          <motion.button
            type="button"
            onClick={() => navigate('/')}
            whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(249,115,22,0.3)', borderColor: 'rgba(249,115,22,0.3)' }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-orange-400 transition-all duration-300"
          >
            <ArrowLeft size={14} />
            Trang chủ
          </motion.button>
          <div className="flex items-center gap-2">
          <motion.button
            type="button"
            onClick={() => navigate('/long-term-subscriptions')}
            whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(16,185,129,0.3)', borderColor: 'rgba(16,185,129,0.3)' }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-emerald-400 transition-all duration-300"
          >
            <CalendarClock size={14} />
            Gói dài hạn
          </motion.button>
          <motion.button
            type="button"
            onClick={() => navigate('/profile')}
            whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(249,115,22,0.3)', borderColor: 'rgba(249,115,22,0.3)' }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-orange-400 transition-all duration-300"
          >
            <User size={14} />
            Hồ sơ
          </motion.button>
        </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-3xl border border-white/10 bg-slate-900/50 p-6"
        >
          <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-300">FR-USR-03 + FR-USR-04</p>
          <h1 className="mt-2 text-2xl font-black text-white md:text-3xl">Đặt chỗ và hủy đặt chỗ</h1>
          <p className="mt-2 text-sm font-semibold text-slate-400">
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

        <div className="flex justify-center">
          <div className="w-full max-w-6xl">
            <div className="grid grid-cols-10 gap-6">
              <div className="col-span-7">
                <form
                  onSubmit={handleConfirmBooking}
                  className="rounded-3xl border border-white/10 bg-slate-900/55 p-6"
                >
              <div className="mb-4 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CalendarClock size={18} className="text-orange-300" />
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">
                    Form đặt chỗ
                  </h2>
                </div>
                <motion.button
                  type="button"
                  onClick={() => setShowHistoryModal(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-300 flex items-center gap-1 whitespace-nowrap"
                >
                  <History size={12} />
                  <span>Lịch sử ({isLoadingUserData ? '...' : reservations.length})</span>
                </motion.button>
              </div>

              <div className="space-y-4">
                <div className="block">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block mb-1">Tòa nhà</span>
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
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block mb-1">Loại xe</span>
                  <CustomSelect
                    value={selectedVehicleType}
                    onChange={(val) => {
                      const next = val as ReservationVehicleType | '';
                      setSelectedVehicleType(next);
                      setSelectedSlot(null);
                      setSelectedPlate('');
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
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Thời gian đặt chỗ</span>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    min={minDateTime}
                    max={maxDateTime}
                    onChange={(event) => {
                      setScheduledAt(event.target.value);
                      setSelectedSlot(null);
                    }}
                    className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-semibold text-white outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] transition-all duration-300 font-mono"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <motion.button
                    type="button"
                    onClick={() => {
                      if (!selectedBuildingId) {
                        setBookingError('Vui lòng chọn tòa nhà trước.');
                        return;
                      }
                      if (!selectedVehicleType) {
                        setBookingError('Vui lòng chọn loại xe trước.');
                        return;
                      }
                      if (!scheduledAt) {
                        setBookingError('Vui lòng chọn thời gian đặt chỗ trước.');
                        return;
                      }
                      setShowSlotModal(true);
                    }}
                    disabled={!selectedBuildingId || !selectedVehicleType || !scheduledAt || isLoadingSlots}
                    whileHover={selectedBuildingId && selectedVehicleType && scheduledAt ? { scale: 1.02, boxShadow: '0 0 15px rgba(34,197,94,0.45)' } : {}}
                    whileTap={selectedBuildingId && selectedVehicleType && scheduledAt ? { scale: 0.98 } : {}}
                    className="rounded-xl border border-white/10 bg-gradient-to-r from-emerald-600 to-teal-500 text-sm font-black uppercase tracking-wider text-white disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 py-3 flex items-center justify-center gap-2"
                  >
                    <MapPin size={16} />
                    Chọn slot
                  </motion.button>
                  <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3 shadow-inner">
                    <p className="text-[10px] font-bold uppercase text-slate-500">Slot đã chọn</p>
                    <p className="mt-1 text-lg font-mono font-black text-orange-400">{selectedSlot || '--'}</p>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3 shadow-inner">
                  <p className="text-[10px] font-bold uppercase text-slate-500">Khả dụng</p>
                  <p className="mt-1 text-sm font-black">
                    <span className="text-emerald-300">{availableSlotCount}</span>
                    <span className="text-slate-500"> / {slots.length}</span>
                  </p>
                </div>

                <div className="block">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block mb-1">Biển số xe</span>
                  <CustomSelect
                    value={selectedPlate}
                    onChange={setSelectedPlate}
                    options={[
                      { value: '', label: '-- Chọn biển số --' },
                      ...plateOptions.map((plate) => {
                        const isBusy = activeReservations.some(
                          (entry) => entry.plateNumber === plate.plateNumber,
                        );
                        return {
                          value: plate.plateNumber,
                          label: `${plate.plateNumber} - ${vehicleTypeLabel(plate.vehicleType)} ${isBusy ? '(đang sử dụng)' : ''}`,
                          disabled: isBusy,
                        };
                      }),
                    ]}
                    placeholder="-- Chọn biển số --"
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={!canSubmit}
                  whileHover={canSubmit ? { scale: 1.02, boxShadow: '0 0 20px rgba(249,115,22,0.45)' } : {}}
                  whileTap={canSubmit ? { scale: 0.98 } : {}}
                  className="h-11 w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-sm font-black uppercase tracking-wider text-slate-950 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300"
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Đặt chỗ'}
                </motion.button>
              </div>
            </form>
              </div>

              <div className="col-span-3">
                <div className="rounded-3xl border border-white/10 bg-slate-900/55 p-6 sticky top-6">
                      <div className="mb-4 flex items-center justify-between">
                    <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
                      <WalletCards size={16} className="text-cyan-300" />
                      Ví và giao dịch hoàn tiền
                    </h2>
                    <p className="text-xs font-black text-emerald-300">{formatMoney(walletBalance)}</p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Payments</p>
                    {payments.slice(0, 4).map((payment) => (
                      <div key={payment.id} className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                        <p className="text-xs font-bold text-white">{paymentTypeLabel(payment.type)}</p>
                        <p className="mt-1 text-[11px] text-slate-400">{payment.note}</p>
                        <p
                          className={`mt-1 text-xs font-black ${
                            payment.direction === 'credit' ? 'text-emerald-300' : 'text-orange-300'
                          }`}
                        >
                          {payment.direction === 'credit' ? '+' : '-'}
                          {formatMoney(payment.amount)}
                        </p>
                      </div>
                    ))}

                    <p className="pt-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Wallet Transactions
                    </p>
                    {walletTransactions.slice(0, 4).map((tx) => (
                      <div key={tx.id} className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                        <p className="text-xs font-bold text-white">{tx.description}</p>
                        <p className="mt-1 text-[11px] text-slate-400">{formatDateTime(tx.createdAt)}</p>
                        <p
                          className={`mt-1 text-xs font-black ${
                            tx.type === 'credit' ? 'text-emerald-300' : 'text-orange-300'
                          }`}
                        >
                          {tx.type === 'credit' ? '+' : '-'}
                          {formatMoney(tx.amount)} • Số dư: {formatMoney(tx.balanceAfter)}
                        </p>
                      </div>
                    ))}

                    {payments.length === 0 && walletTransactions.length === 0 ? (
                      <p className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-xs font-semibold text-slate-500">
                        Chưa có giao dịch thanh toán hoặc hoàn tiền.
                      </p>
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

      {/* Slot Selection Modal */}
      {showSlotModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowSlotModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl max-h-[80vh] rounded-3xl border border-white/10 bg-slate-900 p-6 overflow-auto"
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={20} className="text-cyan-300" />
                <h2 className="text-lg font-black uppercase tracking-wider text-white">
                  Chọn ô đỗ
                </h2>
                <span className="text-xs font-bold text-slate-400">
                  Khả dụng: <span className="text-emerald-300">{availableSlotCount}</span> / {slots.length}
                </span>
              </div>
              <motion.button
                type="button"
                onClick={() => setShowSlotModal(false)}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-xl border border-white/10 bg-slate-950 p-2 text-slate-300 hover:text-white hover:border-orange-400/50 transition-all duration-300"
              >
                <X size={20} />
              </motion.button>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <AnimatedParkingMap3D
                interactive
                selectedSlot={selectedSlot}
                activeReservations={activeReservationsForSelectedBuilding.map((item) => ({
                  slotCode: item.slotCode,
                  plateNumber: item.plateNumber,
                  vehicleType: item.vehicleType,
                }))}
                interactiveUnavailableSlots={unavailableSlotCodes}
                onSlotClick={handleSlotClick}
              />
            </div>

            <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-950/50 p-4">
              <p className="text-sm font-semibold text-slate-300">
                {selectedSlot ? (
                  <>
                    <span className="text-orange-400 font-black">Slot {selectedSlot}</span>
                    <span className="text-slate-400 ml-2">đã được chọn</span>
                  </>
                ) : (
                  <span className="text-slate-500">Nhấn vào ô đỗ để chọn</span>
                )}
              </p>
              <motion.button
                type="button"
                onClick={() => setShowSlotModal(false)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-black uppercase tracking-wider text-orange-400 hover:bg-orange-500/20 hover:border-orange-500/50 transition-all duration-300"
              >
                Hoàn tất
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowHistoryModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl max-h-[80vh] rounded-3xl border border-white/10 bg-slate-900 p-6 overflow-auto"
          >
            <div className="mb-4 flex items-center justify-between sticky top-0 bg-slate-900 pb-4">
              <div className="flex items-center gap-2">
                <History size={20} className="text-blue-300" />
                <h2 className="text-lg font-black uppercase tracking-wider text-white">
                  Lịch sử đặt chỗ
                </h2>
              </div>
              <motion.button
                type="button"
                onClick={() => setShowHistoryModal(false)}
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-xl border border-white/10 bg-slate-950 p-2 text-slate-300 hover:text-white hover:border-blue-400/50 transition-all duration-300"
              >
                <X size={20} />
              </motion.button>
            </div>

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
                          ? 'bg-slate-950 border-orange-500/15 shadow-[0_0_10px_rgba(249,115,22,0.03)]' 
                          : 'bg-slate-950/50 border-white/5 opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-mono font-black text-orange-400">{entry.id}</p>
                        <span className={`text-[8px] font-sans font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          entry.status === 'active' 
                            ? 'bg-emerald-500/20 text-emerald-400' 
                            : 'bg-slate-800 text-slate-500'
                        }`}>
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
                          {entry.plateNumber} - Slot {entry.slotCode}
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
          </motion.div>
        </motion.div>
      )}
    </main>
  );
}

