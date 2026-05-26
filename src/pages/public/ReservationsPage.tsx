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

type VehicleType = 'car' | 'motorcycle';
type ReservationStatus = 'active' | 'cancelled' | 'completed';

interface ReservationRecord {
  id: string;
  userId: string;
  buildingId: string;
  buildingName: string;
  slotCode: string;
  plateNumber: string;
  vehicleType: VehicleType;
  scheduledAt: string;
  createdAt: string;
  status: ReservationStatus;
}

interface ReservationLocationState {
  buildingId?: string;
}

const RESERVATION_STORAGE_KEY = 'pbms.reservations';
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

function parseStoredReservations(raw: string | null): ReservationRecord[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map((item, index): ReservationRecord | null => {
        if (!item || typeof item !== 'object') return null;

        const vehicleType: VehicleType =
          (item as { vehicleType?: string }).vehicleType === 'motorcycle' ? 'motorcycle' : 'car';
        const statusRaw = (item as { status?: string }).status;
        const status: ReservationStatus =
          statusRaw === 'cancelled' || statusRaw === 'completed' ? statusRaw : 'active';

        const id =
          typeof (item as { id?: unknown }).id === 'string'
            ? (item as { id: string }).id
            : `RSV-LEGACY-${index + 1}`;
        const userId =
          typeof (item as { userId?: unknown }).userId === 'string'
            ? (item as { userId: string }).userId
            : '';
        if (!userId) return null;

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
        const scheduledAt =
          typeof (item as { scheduledAt?: unknown }).scheduledAt === 'string'
            ? (item as { scheduledAt: string }).scheduledAt
            : defaultScheduleValue();
        const createdAt =
          typeof (item as { createdAt?: unknown }).createdAt === 'string'
            ? (item as { createdAt: string }).createdAt
            : new Date().toISOString();

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
      .filter((item): item is ReservationRecord => Boolean(item));
  } catch {
    return [];
  }
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

function vehicleTypeLabel(value: VehicleType): string {
  return value === 'car' ? 'Ô tô' : 'Xe máy';
}

export default function ReservationsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();

  const state = (location.state as ReservationLocationState | null) ?? null;

  const [rows, setRows] = useState<UserBuildingView[]>([]);
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(true);
  const [reservations, setReservations] = useState<ReservationRecord[]>(() =>
    parseStoredReservations(localStorage.getItem(RESERVATION_STORAGE_KEY)),
  );

  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType | ''>('');
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

  const selectedBuilding = useMemo(
    () => rows.find((row) => row.building._id === selectedBuildingId) || null,
    [rows, selectedBuildingId],
  );

  const userReservations = useMemo(() => {
    if (!user) return [];
    return reservations.filter((row) => row.userId === user.userId);
  }, [reservations, user]);

  const activeReservations = useMemo(
    () => userReservations.filter((row) => row.status === 'active'),
    [userReservations],
  );

  const activeReservationsForSelectedBuilding = useMemo(
    () => activeReservations.filter((row) => row.buildingId === selectedBuildingId),
    [activeReservations, selectedBuildingId],
  );

  const plateOptions = useMemo(() => {
    if (!user || !selectedVehicleType) return [];
    return user.licensePlates.filter((plate) => plate.vehicleType === selectedVehicleType);
  }, [user, selectedVehicleType]);

  const reservationPolicy = selectedBuilding?.reservationPolicy || null;

  const minDateTime = useMemo(() => {
    const leadMinutes = reservationPolicy?.minAdvanceMinutes ?? 15;
    return toDateTimeLocalValue(new Date(Date.now() + leadMinutes * 60_000));
  }, [reservationPolicy?.minAdvanceMinutes]);

  const maxDateTime = useMemo(() => {
    const maxHours = reservationPolicy?.maxAdvanceHours ?? 72;
    return toDateTimeLocalValue(new Date(Date.now() + maxHours * 3_600_000));
  }, [reservationPolicy?.maxAdvanceHours]);

  const saveReservations = (next: ReservationRecord[]) => {
    setReservations(next);
    localStorage.setItem(RESERVATION_STORAGE_KEY, JSON.stringify(next));
  };

  if (!session || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  const canOpenBookingForm = Boolean(
    selectedBuildingId && selectedVehicleType && scheduledAt && reservationPolicy?.isActive !== false,
  );

  const canSubmit = Boolean(
    canOpenBookingForm && selectedSlot && selectedPlate && !isLoadingBuildings,
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

  const handleConfirmBooking = (event: React.FormEvent<HTMLFormElement>) => {
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
    if (reservationPolicy?.isActive === false) {
      setBookingError('Tòa nhà này đang tạm dừng đặt chỗ trước.');
      return;
    }

    if (activeReservations.length >= user.licensePlates.length) {
      setBookingError(
        `Bạn đã đặt tối đa ${user.licensePlates.length} lượt đang giữ. Vui lòng hủy hoặc hoàn tất lượt cũ.`,
      );
      return;
    }

    const scheduledAtTime = new Date(scheduledAt).getTime();
    if (Number.isNaN(scheduledAtTime)) {
      setBookingError('Thời gian đặt chỗ không hợp lệ.');
      return;
    }

    const minAllowedTime = new Date(minDateTime).getTime();
    const maxAllowedTime = new Date(maxDateTime).getTime();
    if (scheduledAtTime < minAllowedTime || scheduledAtTime > maxAllowedTime) {
      setBookingError(
        `Thời gian đặt chỗ phải nằm trong khoảng ${formatDateTime(minDateTime)} - ${formatDateTime(maxDateTime)}.`,
      );
      return;
    }

    const isPlateBusy = activeReservations.some((entry) => entry.plateNumber === selectedPlate);
    if (isPlateBusy) {
      setBookingError('Biển số này đang được dùng cho lượt đặt chỗ khác.');
      return;
    }

    const isSlotBusy = reservations.some(
      (entry) =>
        entry.status === 'active' &&
        entry.buildingId === selectedBuilding.building._id &&
        entry.slotCode === selectedSlot,
    );
    if (isSlotBusy) {
      setBookingError('Ô đỗ vừa được đặt, vui lòng chọn ô khác.');
      return;
    }

    const newReservation: ReservationRecord = {
      id: `RSV-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: user.userId,
      buildingId: selectedBuilding.building._id,
      buildingName: selectedBuilding.building.name,
      slotCode: selectedSlot,
      plateNumber: selectedPlate,
      vehicleType: selectedVehicleType,
      scheduledAt,
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    const next = [newReservation, ...reservations];
    saveReservations(next);

    setBookingSuccess(
      `Đặt chỗ thành công: ${selectedBuilding.building.name} - ${selectedSlot} - ${selectedPlate}.`,
    );
    setSelectedSlot(null);
    setSelectedPlate('');
  };

  const handleCancelReservation = (reservationId: string) => {
    const next = reservations.map((entry) =>
      entry.id === reservationId ? { ...entry, status: 'cancelled' as const } : entry,
    );
    saveReservations(next);
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
            <div className="mb-4 flex items-center gap-2">
              <ParkingCircle size={18} className="text-cyan-300" />
              <h2 className="text-sm font-black uppercase tracking-wider text-white">Bản đồ slot</h2>
            </div>
            <AnimatedParkingMap3D
              interactive
              selectedSlot={selectedSlot}
              activeReservations={activeReservationsForSelectedBuilding.map((item) => ({
                slotCode: item.slotCode,
                plateNumber: item.plateNumber,
                vehicleType: item.vehicleType,
              }))}
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
                      const next = event.target.value as VehicleType | '';
                      setSelectedVehicleType(next);
                      setSelectedSlot(null);
                      setSelectedPlate('');
                    }}
                    className="mt-1 h-11 w-full rounded-xl border border-white/10 bg-slate-950 px-3 text-sm font-semibold text-white outline-none focus:border-orange-400/60"
                  >
                    <option value="">-- Chọn loại xe --</option>
                    <option value="car">O to</option>
                    <option value="motorcycle">Xe may</option>
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
                  Đặt chỗ
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
                  {userReservations.length}
                </span>
              </div>

              <div className="space-y-3">
                {userReservations.length > 0 ? (
                  userReservations.map((entry) => (
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
                    Chưa có lượt đặt chỗ nào.
                  </p>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

