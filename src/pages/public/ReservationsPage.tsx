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
  ParkingCircle,
  Trash2,
  User,
} from 'lucide-react';
import { AnimatedParkingMap3D } from '@/components/shared/AnimatedParkingMap3D';
import { useAuth } from '@/hooks/useAuth';
import { listUserBuildingViews, type UserBuildingView } from '@/pages/User/mockBuildingsData';
import {
  cancelUserReservation,
  createUserReservation,
  getReservationPolicyByBuilding,
  listParkingSlotsByBuilding,
  listUserReservations,
  slotSupportsVehicle,
  type ReservationVehicleType,
  type UserParkingSlotRecord,
  type UserReservationPolicyRecord,
  type UserReservationRecord,
} from '@/pages/User/mockReservationsData';

interface ReservationLocationState {
  buildingId?: string;
}

const DATETIME_LOCAL_SLICE_END = 16;

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

function vehicleTypeLabel(value: ReservationVehicleType): string {
  return value === 'car' ? 'Ô tô' : 'Xe máy';
}

export default function ReservationsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const state = (location.state as ReservationLocationState | null) ?? null;

  const [rows, setRows] = useState<UserBuildingView[]>([]);
  const [slots, setSlots] = useState<UserParkingSlotRecord[]>([]);
  const [reservationPolicy, setReservationPolicy] = useState<UserReservationPolicyRecord | null>(null);
  const [reservations, setReservations] = useState<UserReservationRecord[]>([]);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isLoadingReservations, setIsLoadingReservations] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    async function loadBuildings() {
      setIsLoadingBuildings(true);
      const data = await listUserBuildingViews();
      if (ignore) return;

      setRows(data);
      const preferredBuildingId = state?.buildingId || data[0]?.building._id || '';
      setSelectedBuildingId((current) => current || preferredBuildingId);
      setIsLoadingBuildings(false);
    }

    loadBuildings();
    return () => {
      ignore = true;
    };
  }, [state?.buildingId]);

  useEffect(() => {
    let ignore = false;

    async function loadReservations() {
      if (!user?.userId) {
        if (!ignore) setIsLoadingReservations(false);
        return;
      }
      setIsLoadingReservations(true);
      const data = await listUserReservations(user.userId);
      if (ignore) return;
      setReservations(data);
      setIsLoadingReservations(false);
    }

    loadReservations();
    return () => {
      ignore = true;
    };
  }, [user?.userId]);

  useEffect(() => {
    let ignore = false;

    async function loadBuildingMeta() {
      if (!selectedBuildingId) {
        setSlots([]);
        setReservationPolicy(null);
        return;
      }

      setIsLoadingSlots(true);
      const [slotRows, policy] = await Promise.all([
        listParkingSlotsByBuilding(selectedBuildingId),
        getReservationPolicyByBuilding(selectedBuildingId),
      ]);
      if (ignore) return;

      setSlots(slotRows);
      setReservationPolicy(policy);
      setIsLoadingSlots(false);
    }

    loadBuildingMeta();
    return () => {
      ignore = true;
    };
  }, [selectedBuildingId]);

  const selectedBuilding = useMemo(
    () => rows.find((row) => row.building._id === selectedBuildingId) || null,
    [rows, selectedBuildingId],
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
      await createUserReservation({
        userId: user.userId,
        buildingId: selectedBuilding.building._id,
        buildingName: selectedBuilding.building.name,
        slotCode: selectedSlot,
        plateNumber: selectedPlate,
        vehicleType: selectedVehicleType,
        scheduledAt,
      });

      const nextReservations = await listUserReservations(user.userId);
      setReservations(nextReservations);
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
    await cancelUserReservation(reservationId, user.userId);
    const nextReservations = await listUserReservations(user.userId);
    setReservations(nextReservations);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 p-4"
        >
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-wider text-orange-300"
          >
            <ArrowLeft size={14} />
            Trang chủ
          </button>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950 px-4 py-2 text-xs font-black uppercase tracking-wider text-orange-300"
          >
            <User size={14} />
            Hồ sơ
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-3xl border border-white/10 bg-slate-900/50 p-6"
        >
          <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-300">FR-USR-03</p>
          <h1 className="mt-2 text-2xl font-black text-white md:text-3xl">Đặt chỗ trước</h1>
          <p className="mt-2 text-sm font-semibold text-slate-400">
            Chọn tòa nhà, loại xe và thời gian đặt chỗ trước khi giữ chỗ.
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

        <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-3xl border border-white/10 bg-slate-900/55 p-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ParkingCircle size={18} className="text-cyan-300" />
                <h2 className="text-sm font-black uppercase tracking-wider text-white">Bản đồ slot</h2>
              </div>
              <p className="text-xs font-bold text-slate-400">
                Khả dụng: <span className="text-emerald-300">{availableSlotCount}</span> / {slots.length}
              </p>
            </div>
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
          </section>

          <aside className="space-y-6">
            <form
              onSubmit={handleConfirmBooking}
              className="rounded-3xl border border-white/10 bg-slate-900/55 p-6"
            >
              <div className="mb-4 flex items-center gap-2">
                <CalendarClock size={18} className="text-orange-300" />
                <h2 className="text-sm font-black uppercase tracking-wider text-white">
                  Form đặt chỗ
                </h2>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="text-xs font-bold uppercase text-slate-400">Tòa nhà</span>
                  <select
                    value={selectedBuildingId}
                    onChange={(event) => handleBuildingChange(event.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-semibold text-white outline-none focus:border-orange-400/60"
                  >
                    <option value="">-- Chọn tòa nhà --</option>
                    {rows.map((row) => (
                      <option key={row.building._id} value={row.building._id}>
                        {row.building.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase text-slate-400">Loại xe</span>
                  <select
                    value={selectedVehicleType}
                    onChange={(event) => {
                      const next = event.target.value as ReservationVehicleType | '';
                      setSelectedVehicleType(next);
                      setSelectedSlot(null);
                      setSelectedPlate('');
                    }}
                    className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-semibold text-white outline-none focus:border-orange-400/60"
                  >
                    <option value="">-- Chọn loại xe --</option>
                    <option value="car">Ô tô</option>
                    <option value="motorcycle">Xe máy</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-xs font-bold uppercase text-slate-400">Thời gian đặt chỗ</span>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    min={minDateTime}
                    max={maxDateTime}
                    onChange={(event) => {
                      setScheduledAt(event.target.value);
                      setSelectedSlot(null);
                    }}
                    className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-semibold text-white outline-none focus:border-orange-400/60"
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                    <p className="text-[10px] font-bold uppercase text-slate-500">Slot đã chọn</p>
                    <p className="mt-1 text-lg font-black text-white">{selectedSlot || '--'}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3">
                    <p className="text-[10px] font-bold uppercase text-slate-500">Policy</p>
                    <p className="mt-1 text-xs font-bold text-slate-300">
                      Min {reservationPolicy?.minAdvanceMinutes ?? 15}p / Max{' '}
                      {reservationPolicy?.maxAdvanceHours ?? 72}h
                    </p>
                  </div>
                </div>

                <label className="block">
                  <span className="text-xs font-bold uppercase text-slate-400">Biển số xe</span>
                  <select
                    value={selectedPlate}
                    onChange={(event) => setSelectedPlate(event.target.value)}
                    className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-semibold text-white outline-none focus:border-orange-400/60"
                  >
                    <option value="">-- Chọn biển số --</option>
                    {plateOptions.map((plate) => {
                      const isBusy = activeReservations.some(
                        (entry) => entry.plateNumber === plate.plateNumber,
                      );
                      return (
                        <option key={plate.plateNumber} value={plate.plateNumber} disabled={isBusy}>
                          {plate.plateNumber} - {vehicleTypeLabel(plate.vehicleType)}{' '}
                          {isBusy ? '(đang sử dụng)' : ''}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="h-11 w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-400 text-sm font-black uppercase tracking-wider text-slate-950 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmitting ? 'Đang xử lý...' : 'Đặt chỗ'}
                </button>

                {!canOpenBookingForm ? (
                  <p className="text-xs font-semibold text-slate-500">
                    Chọn đủ thông tin bên trên, sau đó bấm vào slot màu xanh trên bản đồ.
                  </p>
                ) : null}
              </div>
            </form>

            <div className="rounded-3xl border border-white/10 bg-slate-900/55 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-wider text-white">
                  Lịch sử đặt chỗ
                </h2>
                <span className="rounded-full bg-slate-950 px-2 py-1 text-[11px] font-bold text-slate-400">
                  {isLoadingReservations ? '...' : reservations.length}
                </span>
              </div>

              <div className="space-y-3">
                {reservations.length > 0 ? (
                  reservations.map((entry) => (
                    <div
                      key={entry.id}
                      className="rounded-2xl border border-white/10 bg-slate-950/70 p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-black text-orange-300">{entry.id}</p>
                        <p className="text-[10px] font-black uppercase text-slate-400">
                          {entry.status}
                        </p>
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
                      </div>

                      {entry.status === 'active' ? (
                        <button
                          type="button"
                          onClick={() => handleCancelReservation(entry.id)}
                          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-400/35 bg-rose-500/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-rose-300"
                        >
                          <Trash2 size={12} />
                          Hủy lượt đặt
                        </button>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-center text-xs font-semibold text-slate-500">
                    {isLoadingReservations ? 'Đang tải lịch sử...' : 'Chưa có lượt đặt chỗ nào.'}
                  </p>
                )}
              </div>
            </div>

            {isLoadingBuildings || isLoadingSlots ? (
              <p className="text-xs font-semibold text-slate-500">
                Đang tải dữ liệu tòa nhà và danh sách slot...
              </p>
            ) : null}
          </aside>
        </div>
      </div>
    </main>
  );
}
