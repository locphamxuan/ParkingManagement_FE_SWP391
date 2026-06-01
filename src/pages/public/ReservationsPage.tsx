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
  Trash2,
  User,
  X,
} from 'lucide-react';
import { ParkingMap2D } from '@/components/shared/ParkingMap2D';
import { useAuth } from '@/hooks/useAuth';
import { CustomSelect } from '@/components/ui/select';
import {
  useBuildings,
  useReservations,
  useCancelReservation,
  useCreateReservation,
} from '@/hooks/user';
import type { Building, Reservation } from '@/services/user/userApi';

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

function vehicleTypeLabel(value: string): string {
  return value === 'car' ? 'Ô tô' : 'Xe máy';
}

export default function ReservationsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const state = (location.state as ReservationLocationState | null) ?? null;

  // API Hooks
  const { items: buildings, isLoading: isLoadingBuildings } = useBuildings();
  const { items: reservations, isLoading: isLoadingReservations, refresh: refreshReservations } =
    useReservations();
  const { create: createReservation, isLoading: isSubmitting } = useCreateReservation();
  const { cancel: cancelReservation } = useCancelReservation();

  // Local state
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>('');
  const [scheduledAt, setScheduledAt] = useState(defaultScheduleValue());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedPlate, setSelectedPlate] = useState('');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  const user = useMemo(() => {
    if (!session) return null;
    return {
      userId: session.userId,
      fullName: session.displayName,
      licensePlates: session.licensePlates || [],
    };
  }, [session]);

  // Set default building on load
  useEffect(() => {
    if (buildings.length > 0 && !selectedBuildingId) {
      const preferredBuildingId = state?.buildingId || buildings[0]?._id || '';
      setSelectedBuildingId(preferredBuildingId);
    }
  }, [buildings, state?.buildingId, selectedBuildingId]);

  const activeReservations = useMemo(
    () =>
      reservations.filter((row) => row.status === 'confirmed' || row.status === 'checked_in' || row.status === 'pending'),
    [reservations]
  );

  const plateOptions = useMemo(() => {
    if (!user || !selectedVehicleType) return [];
    return user.licensePlates.filter((plate) => plate.vehicleType === selectedVehicleType);
  }, [user, selectedVehicleType]);

  const selectedBuilding = useMemo(
    () => buildings.find((b) => b._id === selectedBuildingId) || null,
    [buildings, selectedBuildingId]
  );

  const minDateTime = useMemo(() => {
    const leadMinutes = 15;
    return toDateTimeLocalValue(new Date(Date.now() + leadMinutes * 60_000));
  }, []);

  const maxDateTime = useMemo(() => {
    const maxHours = 72;
    return toDateTimeLocalValue(new Date(Date.now() + maxHours * 3_600_000));
  }, []);

  if (!session || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  const canOpenBookingForm = Boolean(selectedBuildingId && selectedVehicleType && scheduledAt);
  const canSubmit = Boolean(canOpenBookingForm && selectedSlot && selectedPlate && !isSubmitting);

  const handleBuildingChange = (buildingId: string) => {
    setSelectedBuildingId(buildingId);
    setSelectedSlot(null);
    setSelectedPlate('');
    setBookingError(null);
    setBookingSuccess(null);
  };

  const handleSlotClick = (slotCode: string) => {
    setBookingError(null);
    setBookingSuccess(null);
    setSelectedSlot(slotCode);
    setShowSlotModal(false);

    const firstAvailablePlate = plateOptions.find(
      (plate) =>
        !activeReservations.some(
          (entry) => entry.plateNumber === plate.plateNumber && entry.building._id === selectedBuildingId
        )
    );
    setSelectedPlate(firstAvailablePlate?.plateNumber || '');
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

    try {
      await createReservation({
        plateNumber: selectedPlate,
        buildingId: selectedBuilding._id,
        slotId: selectedSlot,
        reservationDate: scheduledAt,
      });

      await refreshReservations();
      setBookingSuccess(`Đặt chỗ thành công: ${selectedBuilding.name} - ${selectedSlot} - ${selectedPlate}.`);
      setSelectedSlot(null);
      setSelectedPlate('');
      setScheduledAt(defaultScheduleValue());
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Không thể tạo lượt đặt chỗ.');
    }
  };

  const handleCancelReservation = async (reservationId: string) => {
    setBookingError(null);
    setBookingSuccess(null);

    try {
      await cancelReservation(reservationId);
      await refreshReservations();
      setBookingSuccess('Đã hủy lượt đặt thành công.');
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
            whileHover={{
              scale: 1.05,
              boxShadow: '0 0 15px rgba(249,115,22,0.3)',
              borderColor: 'rgba(249,115,22,0.3)',
            }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-orange-400 transition-all duration-300"
          >
            <ArrowLeft size={14} />
            Trang chủ
          </motion.button>
          <motion.button
            type="button"
            onClick={() => navigate('/profile')}
            whileHover={{
              scale: 1.05,
              boxShadow: '0 0 15px rgba(249,115,22,0.3)',
              borderColor: 'rgba(249,115,22,0.3)',
            }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-orange-400 transition-all duration-300"
          >
            <User size={14} />
            Hồ sơ
          </motion.button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-3xl border border-white/10 bg-slate-900/50 p-6"
        >
          <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-300">FR-USR-03 + FR-USR-04</p>
          <h1 className="mt-2 text-2xl font-black text-white md:text-3xl">Đặt chỗ và hủy đặt chỗ</h1>
          <p className="mt-2 text-sm font-semibold text-slate-400">
            Chọn tòa nhà, loại xe, thời gian đặt chỗ. Khi hủy, hệ thống xử lý theo chính sách.
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
          <div className="w-full max-w-4xl">
            {isLoadingBuildings ? (
              <div className="rounded-3xl border border-white/10 bg-slate-900/55 p-12 text-center">
                <p className="text-slate-400">Đang tải danh sách tòa nhà...</p>
              </div>
            ) : (
              <form
                onSubmit={handleConfirmBooking}
                className="rounded-3xl border border-white/10 bg-slate-900/55 p-6 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <CalendarClock size={18} className="text-orange-300" />
                  <h2 className="text-sm font-black uppercase tracking-wider text-white">Form đặt chỗ</h2>
                  <motion.button
                    type="button"
                    onClick={() => setShowHistoryModal(true)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="ml-auto rounded-lg border border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/50 transition-all duration-300 flex items-center gap-1"
                  >
                    <History size={12} />
                    <span>Lịch sử ({reservations.length})</span>
                  </motion.button>
                </div>

                <div className="block">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block mb-1">
                    Tòa nhà
                  </span>
                  <CustomSelect
                    value={selectedBuildingId}
                    onChange={(val) => handleBuildingChange(val)}
                    options={[
                      { value: '', label: '-- Chọn tòa nhà --' },
                      ...buildings.map((building) => ({
                        value: building._id,
                        label: building.name,
                      })),
                    ]}
                    placeholder="-- Chọn tòa nhà --"
                  />
                </div>

                <div className="block">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block mb-1">
                    Loại xe
                  </span>
                  <CustomSelect
                    value={selectedVehicleType}
                    onChange={(val) => {
                      setSelectedVehicleType(val);
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
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                    Thời gian đặt chỗ
                  </span>
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
                  disabled={!selectedBuildingId || !selectedVehicleType || !scheduledAt}
                  whileHover={selectedBuildingId && selectedVehicleType && scheduledAt ? { scale: 1.02, boxShadow: '0 0 15px rgba(34,197,94,0.45)' } : {}}
                  whileTap={selectedBuildingId && selectedVehicleType && scheduledAt ? { scale: 0.98 } : {}}
                  className="w-full rounded-xl border border-white/10 bg-gradient-to-r from-emerald-600 to-teal-500 text-sm font-black uppercase tracking-wider text-white disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-300 py-3 flex items-center justify-center gap-2"
                >
                  <MapPin size={16} />
                  Chọn ô đỗ
                </motion.button>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3 shadow-inner">
                    <p className="text-[10px] font-bold uppercase text-slate-500">Ô đỗ đã chọn</p>
                    <p className="mt-1 text-lg font-mono font-black text-orange-400">{selectedSlot || '--'}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-slate-950/60 p-3 shadow-inner">
                    <p className="text-[10px] font-bold uppercase text-slate-500">Biển số xe</p>
                    <p className="mt-1 text-sm font-mono font-black text-cyan-400">{selectedPlate || '--'}</p>
                  </div>
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
              </form>
            )}
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
                  <h2 className="text-lg font-black uppercase tracking-wider text-white">Chọn ô đỗ</h2>
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
                <p className="text-sm text-slate-400 mb-4">Chọn ô đỗ trên bản đồ dưới đây</p>
                <ParkingMap2D
                  interactive
                  slots={[
                    { code: 'A-01', status: 'available' },
                    { code: 'A-02', status: 'available' },
                    { code: 'A-03', status: 'available' },
                    { code: 'B-01', status: 'available' },
                    { code: 'B-02', status: 'available' },
                  ]}
                  selectedSlot={selectedSlot}
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
                  <h2 className="text-lg font-black uppercase tracking-wider text-white">Lịch sử đặt chỗ</h2>
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
                {isLoadingReservations ? (
                  <p className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-center text-xs font-semibold text-slate-500">
                    Đang tải lịch sử...
                  </p>
                ) : reservations.length > 0 ? (
                  reservations.map((entry, idx) => (
                    <motion.div
                      key={entry._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05, duration: 0.35 }}
                      whileHover={{
                        scale: 1.01,
                        borderColor: entry.status === 'confirmed' ? 'rgba(249,115,22,0.25)' : 'rgba(255,255,255,0.1)',
                      }}
                      className={`rounded-2xl border p-4 transition-all duration-300 ${
                        entry.status === 'confirmed' || entry.status === 'checked_in'
                          ? 'bg-slate-950 border-orange-500/15 shadow-[0_0_10px_rgba(249,115,22,0.03)]'
                          : 'bg-slate-950/50 border-white/5 opacity-70'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-xs font-mono font-black text-orange-400">{entry.code}</p>
                        <span
                          className={`text-[8px] font-sans font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            entry.status === 'confirmed' || entry.status === 'checked_in'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : entry.status === 'cancelled'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {entry.status}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1 text-xs font-semibold text-slate-300">
                        <p className="flex items-center gap-2">
                          <Building2 size={13} className="text-cyan-300" />
                          {entry.building.name}
                        </p>
                        <p className="flex items-center gap-2">
                          {entry.vehicleType?.name || 'N/A'} - {entry.plateNumber}
                          {entry.slot && ` - Slot ${entry.slot.code}`}
                        </p>
                        <p className="flex items-center gap-2">
                          <Clock3 size={13} className="text-orange-300" />
                          {formatDateTime(entry.reservationDate)}
                        </p>
                      </div>

                      {(entry.status === 'confirmed' || entry.status === 'checked_in' || entry.status === 'pending') ? (
                        <motion.button
                          type="button"
                          onClick={() => handleCancelReservation(entry._id)}
                          whileHover={{
                            scale: 1.03,
                            backgroundColor: 'rgba(239,68,68,0.2)',
                            borderColor: 'rgba(239,68,68,0.45)',
                          }}
                          whileTap={{ scale: 0.97 }}
                          className="mt-3 inline-flex items-center gap-2 rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-rose-400 transition-all duration-300"
                        >
                          <Trash2 size={12} />
                          Hủy
                        </motion.button>
                      ) : null}
                    </motion.div>
                  ))
                ) : (
                  <p className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 text-center text-xs font-semibold text-slate-500">
                    Chưa có lượt đặt chỗ nào.
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
