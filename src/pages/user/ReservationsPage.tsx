import { useEffect, useMemo, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  CalendarClock,
  Clock,
  MapPin,
  Package,
  ShieldCheck,
  Timer,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { CustomSelect } from '@/components/ui/select';
import back1 from '@/assets/back1.webp';

import {
  userApi,
  type Building,
  type VehicleType,
  type ParkingSlot as ApiParkingSlot,
  type FloorAvailability,
  type LongTermPackage,
} from '@/services/user/userApi';

import {
  type BookingMode,
  type VehicleKind,
  fmtMoney,
  fmtShort,
  normalizeVehicleTypeCode,
  isCarPackage,
  getMaxCalendarDate,
  packageCategory,
  categoryColors,
} from '@/pages/user/reservationsHelper';

import { MiniCalendar } from '@/components/user/MiniCalendar';
import { TimeScroller } from '@/components/user/TimeScroller';
import { DurationSelector } from '@/components/user/DurationSelector';
import { PackageCard } from '@/components/user/PackageCard';
import { ReservationHistoryTab } from '@/components/user/ReservationHistoryTab';
import { SlotSelectionModal } from '@/components/user/SlotSelectionModal';
import { BookingNotificationModal } from '@/components/user/BookingNotificationModal';
import { BookingSummarySidebar } from '@/components/user/BookingSummarySidebar';

/* ─── Types ────────────────────────────────────────────────────────────────── */

interface ReservationLocationState {
  buildingId?: string;
  plateNumber?: string;
  openHistory?: boolean;
  mode?: BookingMode;
}

interface MappedSlot {
  _id: string;
  buildingId: string;
  code: string;
  floorCode?: string;
  vehicleType: VehicleKind | 'all';
  reservable: boolean;
  status: string;
}

/* ─── Main ReservationsPage ────────────────────────────────────────────────── */

/* ─── Main ReservationsPage ────────────────────────────────────────────────── */

export default function ReservationsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const state = (location.state as ReservationLocationState | null) ?? null;

  const user = useMemo(() => {
    if (!session) return null;
    return { userId: session.userId, fullName: session.displayName, licensePlates: session.licensePlates || [] };
  }, [session]);

  /* ── Core state ── */
  const [mode, setMode] = useState<BookingMode>(state?.mode || 'hourly');
  const [rows, setRows] = useState<Array<{ building: Building }>>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [vehicleTypesForBuilding, setVehicleTypesForBuilding] = useState<VehicleType[]>([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleKind | ''>('');
  const [floorsData, setFloorsData] = useState<FloorAvailability[]>([]);
  const [floorsError, setFloorsError] = useState<string>('');
  const [slots, setSlots] = useState<MappedSlot[]>([]);
  const [selectedFloorIdModal, setSelectedFloorIdModal] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedPlate, setSelectedPlate] = useState('');

  /* ── Hourly state ── */
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState('08:00');
  const [durationHours, setDurationHours] = useState(2);

  /* ── Package state ── */
  const [packages, setPackages] = useState<LongTermPackage[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<LongTermPackage | null>(null);
  const [pkgStartDate, setPkgStartDate] = useState<Date | null>(null);

  /* ── UI state ── */
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(true);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

  // Auto-dismiss alerts after 10 seconds
  useEffect(() => {
    if (bookingSuccess) {
      const timer = setTimeout(() => setBookingSuccess(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [bookingSuccess]);

  useEffect(() => {
    if (bookingError) {
      const timer = setTimeout(() => setBookingError(null), 10000);
      return () => clearTimeout(timer);
    }
  }, [bookingError]);

  const [bookedPlates, setBookedPlates] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;

    // Fetch reservations
    const p1 = userApi.reservations.list({ limit: 100 }).then(res => {
      const items = (res as any)?.data?.items || [];
      return items
        .filter((r: any) => ['pending', 'confirmed', 'checked_in'].includes(r.status))
        .map((r: any) => r.plateNumber);
    }).catch(() => []);

    // Fetch subscriptions
    const p2 = userApi.longTermSubscriptions.list({ limit: 100 }).then(res => {
      const items = (res as any)?.data?.items || [];
      return items
        .filter((s: any) => ['pending', 'active'].includes(s.status))
        .map((s: any) => s.plateNumber || s.linkedPlates?.[0]);
    }).catch(() => []);

    Promise.all([p1, p2]).then(([resPlates, subPlates]) => {
      const allBooked = Array.from(new Set([
        ...resPlates.filter(Boolean),
        ...subPlates.filter(Boolean)
      ]));
      setBookedPlates(allBooked);
    });
  }, [user, bookingSuccess]);

  /* ── Data Loading ── */
  useEffect(() => {
    let ignore = false;
    setIsLoadingBuildings(true);
    userApi.buildings.list()
      .then((res) => {
        if (ignore) return;
        const buildingRows = res.data.items.map((b) => ({ building: b }));
        setRows(buildingRows);
        const preferred = state?.buildingId || buildingRows[0]?.building._id || '';
        setSelectedBuildingId((c) => c || preferred);
      })
      .catch(() => { })
      .finally(() => { if (!ignore) setIsLoadingBuildings(false); });
    return () => { ignore = true; };
  }, [state?.buildingId]);

  // Set plate from navigation state
  useEffect(() => {
    if (state?.plateNumber) setSelectedPlate(state.plateNumber);
  }, [state?.plateNumber]);

  // Set history mode
  useEffect(() => {
    if (state?.openHistory) setShowHistory(true);
  }, [state?.openHistory]);

  // Load vehicle types + floors for selected building
  useEffect(() => {
    let ignore = false;
    if (!selectedBuildingId) { setFloorsData([]); setVehicleTypesForBuilding([]); setFloorsError(''); return; }

    const load = async () => {
      try {
        setFloorsError('');
        const vtRes = await userApi.buildings.vehicleTypes(selectedBuildingId);
        if (ignore) return;
        setVehicleTypesForBuilding(vtRes.data.items || []);

        const floorsRes = await userApi.buildings.floors(selectedBuildingId);
        if (ignore) return;
        setFloorsData(floorsRes.data.floors || []);
      } catch (err) {
        if (!ignore) {
          const errorMsg = err instanceof Error ? err.message : String(err);
          console.error('Error loading floors:', errorMsg, err);
          setFloorsError(`Lỗi tải tầng: ${errorMsg}`);
          setFloorsData([]);
        }
      }
    };
    load();
    return () => { ignore = true; };
  }, [selectedBuildingId]);

  // Load packages for selected building
  useEffect(() => {
    if (!selectedBuildingId) { setPackages([]); return; }
    let ignore = false;
    userApi.longTermPackages.list({ buildingId: selectedBuildingId })
      .then((res) => {
        if (ignore) return;
        setPackages((res as any)?.data?.packages ?? []);
      })
      .catch(() => { });
    return () => { ignore = true; };
  }, [selectedBuildingId]);

  // Load slots when floor is selected in modal
  useEffect(() => {
    let ignore = false;
    if (!selectedBuildingId || !selectedFloorIdModal) return;
    setIsLoadingSlots(true);
    userApi.buildings.slots(selectedBuildingId, selectedFloorIdModal)
      .then((slotsRes) => {
        if (ignore) return;
        const apiSlots: ApiParkingSlot[] = slotsRes.data.slots || [];
        const mapped: MappedSlot[] = apiSlots.map((s) => {
          let rawCode: string | undefined;
          if (s.vehicleType && typeof s.vehicleType === 'object' && 'code' in s.vehicleType) {
            rawCode = String(s.vehicleType.code);
          }
          return {
            _id: s._id,
            buildingId: selectedBuildingId,
            code: s.code,
            vehicleType: normalizeVehicleTypeCode(rawCode),
            reservable: s.reservable ?? true,
            status: (s.status as string) || 'available',
          };
        });
        setSlots(mapped);
        setSelectedSlot(null);
      })
      .catch(() => { })
      .finally(() => { if (!ignore) setIsLoadingSlots(false); });
    return () => { ignore = true; };
  }, [selectedBuildingId, selectedFloorIdModal]);

  /* ── Derived values ── */
  const selectedBuilding = useMemo(
    () => rows.find((r) => r.building._id === selectedBuildingId) || null,
    [rows, selectedBuildingId],
  );

  const maxCalDate = useMemo(() => getMaxCalendarDate(mode, selectedPkg), [mode, selectedPkg]);

  const startDateTime = useMemo(() => {
    if (mode === 'hourly') {
      if (!selectedDate) return null;
      const [h, m] = selectedTime.split(':').map(Number);
      const d = new Date(selectedDate);
      d.setHours(h, m, 0, 0);
      return d;
    }
    // Package mode: use start of day (00:00) — no specific time needed
    if (!pkgStartDate) return null;
    const d = new Date(pkgStartDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [mode, selectedDate, selectedTime, pkgStartDate]);

  const endDateTime = useMemo(() => {
    if (mode === 'hourly') {
      if (!startDateTime) return null;
      return new Date(startDateTime.getTime() + durationHours * 60 * 60 * 1000);
    }
    if (startDateTime && selectedPkg) {
      return new Date(startDateTime.getTime() + selectedPkg.durationDays * 24 * 60 * 60 * 1000);
    }
    return null;
  }, [mode, startDateTime, durationHours, selectedPkg]);

  const estimatedAmount = useMemo(() => {
    if (mode === 'package' && selectedPkg) return selectedPkg.price;
    // Rough estimate for hourly — will be replaced by API estimate
    const building = selectedBuilding?.building;
    if (!building?.pricing?.hourlyRate) return 0;
    const rate = selectedVehicleType === 'motorcycle'
      ? building.pricing.hourlyRate * (building.pricing.motorcycleMultiplier || 0.5)
      : building.pricing.hourlyRate;
    return Math.ceil(rate * durationHours);
  }, [mode, selectedPkg, selectedBuilding, selectedVehicleType, durationHours]);

  const plateOptions = useMemo(() => {
    if (!user) return [];
    const base = selectedVehicleType
      ? user.licensePlates.filter((p) => {
        const t = p.vehicleType?.toLowerCase();
        if (selectedVehicleType === 'motorcycle') return t === 'motorcycle' || t === 'bike';
        return t !== 'motorcycle' && t !== 'bike';
      })
      : user.licensePlates;
    return base.filter((p) => !bookedPlates.includes(p.plateNumber));
  }, [user, selectedVehicleType, bookedPlates]);

  const unavailableSlotCodes = useMemo(() => {
    return slots.filter((s) => {
      if (s.status !== 'available') return true;
      if (!s.reservable) return true;
      return false;
    }).map((s) => s.code);
  }, [slots]);

  const unsupportedSlotCodes = useMemo(() => {
    if (!selectedVehicleType) return [];
    return slots.filter((s) => {
      if (s.status !== 'available') return false;
      if (!s.reservable) return false;

      // Prefix check: C for Car, M for Motorcycle
      const firstChar = String(s.code).trim().charAt(0).toUpperCase();
      if (selectedVehicleType === 'car' && firstChar === 'M') {
        return true; // Motorcycle slot is unsupported for Cars
      }
      if (selectedVehicleType === 'motorcycle' && firstChar === 'C') {
        return true; // Car slot is unsupported for Motorcycles
      }

      return s.vehicleType !== 'all' && s.vehicleType !== selectedVehicleType;
    }).map((s) => s.code);
  }, [slots, selectedVehicleType]);


  const canSubmit = Boolean(
    mode === 'package'
      // Gói floating: KHÔNG chọn slot (staff gán chỗ trống lúc check-in).
      ? selectedBuildingId && selectedPkg && selectedPlate && startDateTime && !isSubmitting
      : selectedBuildingId && selectedSlot && selectedPlate && startDateTime && endDateTime && !isSubmitting
  );

  /* ── Handlers ── */
  const handleBuildingChange = (id: string) => {
    setSelectedBuildingId(id);
    setSelectedSlot(null);
    setSelectedPlate('');
    setBookingError(null);
    setBookingSuccess(null);
    setSelectedPkg(null);
  };

  const handleSlotClick = (code: string) => {
    if (unavailableSlotCodes.includes(code)) return;
    if (unsupportedSlotCodes.includes(code)) return;
    setSelectedSlot(code);
    setBookingError(null);
    // Auto-select first available plate
    if (!selectedPlate && plateOptions.length > 0) {
      setSelectedPlate(plateOptions[0].plateNumber);
    }
  };

  const handleConfirmBooking = async () => {
    setBookingError(null);
    setBookingSuccess(null);
    if (!startDateTime || !endDateTime || !selectedPlate || !selectedBuildingId) return;

    if (mode === 'hourly') {
      if (startDateTime.getTime() < Date.now() - 5 * 60 * 1000) {
        setBookingError('Thời gian nhận bãi không được ở trong quá khứ. Vui lòng chọn thời gian khác.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === 'hourly') {
        // Find vehicleTypeId from building's vehicle types
        const vt = vehicleTypesForBuilding.find((v) => {
          const c = (v.code || v.name || '').toLowerCase();
          if (selectedVehicleType === 'motorcycle') return /motor|xe|máy|bike|moto/i.test(c);
          return /car|oto|ô t|auto/i.test(c);
        });

        // Find the slot's _id
        const slotRecord = slots.find((s) => s.code === selectedSlot);

        await userApi.reservations.create({
          buildingId: selectedBuildingId,
          plateNumber: selectedPlate,
          vehicleTypeId: vt?._id,
          vehicleType: selectedVehicleType || undefined,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          slotId: slotRecord?._id,
        });
        setBookingSuccess(`Đặt chỗ thành công! Ô ${selectedSlot} từ ${fmtShort(startDateTime)} đến ${fmtShort(endDateTime)}`);
      } else if (selectedPkg) {
        const res = await userApi.longTermSubscriptions.create({
          packageId: selectedPkg._id,
          plateNumber: selectedPlate,
          startDate: startDateTime.toISOString(),
        });
        const data = (res as any)?.data;
        if (data?.checkoutUrl) {
          setBookingSuccess('Chuyển hướng đến cổng thanh toán PayOS...');
          window.location.href = data.checkoutUrl;
        } else {
          setBookingSuccess(`Đăng ký gói "${selectedPkg.name}" thành công!`);
        }
      }
      setSelectedSlot(null);
      setShowSlotModal(false);
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Không thể hoàn tất đặt chỗ');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!session || !user) return <Navigate to="/auth/login" replace />;

  /* ── Render ── */
  return (
    <main className="min-h-screen text-slate-100 relative isolate">
      {/* Background Neon Glow Spheres and subtle background image */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-slate-950" aria-hidden="true">
        <div 
          className="absolute inset-0 opacity-[0.25] filter blur-[6px] bg-cover pointer-events-none"
          style={{ backgroundImage: `url(${back1})`, backgroundPosition: 'center 85%' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(2,6,23,0.4)_0%,rgba(2,6,23,0.92)_100%)] pointer-events-none" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[55%] rounded-full bg-[radial-gradient(circle_at_center,hsla(24,95%,53%,0.06),transparent_55%)] blur-3xl" />
        <div className="absolute top-[35%] right-[-15%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle_at_center,hsla(263,90%,51%,0.05),transparent_55%)] blur-3xl" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle_at_center,hsla(142,76%,45%,0.03),transparent_50%)] blur-3xl" />
      </div>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col gap-3 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <button type="button" onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-300 transition hover:border-orange-300/30 hover:text-orange-200"
          >
            <ArrowLeft size={14} /> Trang chủ
          </button>
          <div className="flex gap-2">
            <button type="button" onClick={() => setShowHistory(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-yellow-500/20 bg-yellow-500/5 px-4 py-2 text-xs font-black uppercase tracking-wider text-yellow-400 transition hover:border-yellow-400/40 hover:bg-yellow-500/10 hover:text-yellow-300"
            >
              <CalendarClock size={14} /> Lịch sử
            </button>
          </div>
        </motion.div>

        {/* ── Tab Bar ── */}
        <div className="mb-8 flex items-center gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1.5 max-w-md md:max-w-lg w-full mx-auto shadow-xl">
          {[
            { key: 'hourly' as BookingMode, label: 'Đặt theo giờ', icon: <Timer size={14} /> },
            { key: 'package' as BookingMode, label: 'Đăng ký gói dài hạn', icon: <Package size={14} /> },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setMode(tab.key);
                setSelectedSlot(null);
                setBookingError(null);
                setBookingSuccess(null);
              }}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-xs font-black uppercase tracking-wider transition-all duration-200 ${mode === tab.key
                ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 shadow-[0_0_16px_rgba(249,115,22,0.2)]'
                : 'text-slate-400 hover:text-white'
                }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Alerts are now displayed as floating notification toasts */}


        {/* ── Main Wizard ── */}
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* Left: Booking Form */}
          <div className="space-y-5">
            {/* Building + Vehicle + Plate */}
            <div className="glass-panel-dark rounded-3xl p-6 relative z-30">
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={16} className="text-cyan-300/70" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/70">Thông tin cơ bản</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 relative z-20">
                <div>
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Tòa nhà</span>
                  <CustomSelect
                    value={selectedBuildingId}
                    onChange={handleBuildingChange}
                    options={[
                      { value: '', label: '-- Chọn tòa nhà --' },
                      ...rows.map((r) => ({ value: r.building._id, label: r.building.name })),
                    ]}
                    placeholder="-- Chọn tòa nhà --"
                  />
                </div>
                <div>
                  <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-500">Loại xe</span>
                  <CustomSelect
                    value={selectedVehicleType}
                    onChange={(val) => {
                      setSelectedVehicleType(val as VehicleKind | '');
                      setSelectedSlot(null);
                      setSelectedPlate('');
                      setSelectedPkg(null);
                    }}
                    options={[
                      { value: '', label: '-- Chọn loại xe --' },
                      { value: 'car', label: '🚗 Ô tô' },
                      { value: 'motorcycle', label: '🏍️ Xe máy' },
                    ]}
                    placeholder="-- Chọn loại xe --"
                  />
                </div>
              </div>

              {/* Plate selection right below vehicle type */}
              <div className="mt-4 relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={14} className="text-amber-300/70" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Biển số xe</span>
                </div>
                <CustomSelect
                  value={selectedPlate}
                  onChange={setSelectedPlate}
                  disabled={plateOptions.length === 0}
                  options={[
                    { value: '', label: plateOptions.length === 0 ? '-- Tất cả biển số xe phù hợp đều đã đặt chỗ --' : '-- Chọn biển số --' },
                    ...plateOptions.map((p) => ({
                      value: p.plateNumber,
                      label: `${p.plateNumber} — ${p.vehicleType === 'motorcycle' ? '🏍️ Xe máy' : '🚗 Ô tô'}`,
                    })),
                  ]}
                  placeholder="-- Chọn biển số --"
                />
              </div>
            </div>

            {/* ── Hourly Mode ── */}
            <AnimatePresence mode="wait">
              {mode === 'hourly' && (
                <motion.div key="hourly" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="space-y-5"
                >
                  {/* Date */}
                  <div className="glass-panel-dark rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <CalendarClock size={16} className="text-orange-300/70" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300/70">Chọn ngày nhận xe</span>
                    </div>
                    <MiniCalendar selectedDate={selectedDate} onSelect={setSelectedDate} maxDate={maxCalDate} />
                    <p className="mt-2 text-[10px] font-semibold text-slate-500">
                      Chỉ được đặt trước tối đa 7 ngày
                    </p>
                  </div>

                  {/* Time */}
                  <div className="glass-panel-dark rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Clock size={16} className="text-orange-300/70" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300/70">Giờ nhận xe</span>
                    </div>
                    <TimeScroller selected={selectedTime} onSelect={setSelectedTime} />
                  </div>

                  {/* Duration */}
                  <div className="glass-panel-dark rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Timer size={16} className="text-orange-300/70" />
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300/70">Số giờ sử dụng</span>
                    </div>
                    <DurationSelector hours={durationHours} onSelect={setDurationHours} />
                  </div>
                </motion.div>
              )}

              {/* ── Package Mode ── */}
              {mode === 'package' && (
                <motion.div key="package" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="space-y-5"
                >
                  {/* Package Cards */}
                  <div className="glass-panel-dark rounded-3xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-300/70">Chọn gói dài hạn</span>
                    </div>

                    {packages.length === 0 ? (
                      <p className="text-sm text-slate-500 font-semibold py-4 text-center">
                        {isLoadingBuildings ? 'Đang tải...' : 'Không có gói nào cho tòa nhà này.'}
                      </p>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {packages.map((pkg) => {
                          const cat = packageCategory(pkg);
                          const colors = categoryColors[cat];
                          const isSelected = selectedPkg?._id === pkg._id;
                          const isCar = isCarPackage(pkg);
                          // isLocked: only when a vehicle type IS selected and this package doesn't match
                          const isLocked = !!selectedVehicleType && (selectedVehicleType === 'car' ? !isCar : isCar);
                          return (
                            <PackageCard
                              key={pkg._id}
                              pkg={pkg}
                              isSelected={isSelected}
                              isLocked={isLocked}
                              cat={cat}
                              colors={colors}
                              onClick={() => {
                                if (isLocked) return;
                                setSelectedPkg(pkg);
                                setPkgStartDate(null);
                                const nextType = isCar ? 'car' : 'motorcycle';
                                if (selectedVehicleType !== nextType) {
                                  setSelectedVehicleType(nextType);
                                  setSelectedSlot(null);
                                  setSelectedPlate('');
                                }
                              }}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Package Date */}
                  {selectedPkg && (
                    <div className="glass-panel-dark rounded-3xl p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <CalendarClock size={16} className="text-purple-300/70" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-300/70">Ngày bắt đầu gói</span>
                      </div>
                      <MiniCalendar selectedDate={pkgStartDate} onSelect={setPkgStartDate} maxDate={maxCalDate} />
                      <p className="mt-2 text-[10px] font-semibold text-slate-500">
                        {selectedPkg.durationDays <= 7
                          ? 'Gói tuần: chọn trong vòng 7 ngày tới'
                          : selectedPkg.durationDays <= 30
                            ? 'Gói tháng: chọn trong tháng này hoặc tháng sau'
                            : 'Gói năm: chọn trong năm nay hoặc năm sau'}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* ── Slot Selection Button (chỉ cho đặt theo giờ) ── */}
            {mode === 'hourly' ? (
              <div className="glass-panel-dark rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-3">
                  <MapPin size={16} className="text-cyan-300/70" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/70">Chọn chỗ đỗ</span>
                </div>

                <div className="flex items-center gap-3">
                  <motion.button
                    type="button"
                    onClick={() => setShowSlotModal(true)}
                    disabled={!selectedBuildingId}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 px-4 py-4 text-sm font-black uppercase tracking-wider text-cyan-200 transition-all hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500 disabled:bg-transparent"
                  >
                    <MapPin size={16} /> Chọn chỗ đỗ
                  </motion.button>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center min-w-[100px] shadow-sm">
                    <p className="text-[9px] font-bold uppercase text-slate-500">Ô đỗ</p>
                    <p className="mt-1 font-mono text-xl font-black text-orange-300">{selectedSlot || '—'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="glass-panel-dark rounded-3xl border-amber-500/20 bg-amber-500/5 p-6 shadow-lg">
                <p className="text-[11px] text-amber-200/90">
                  Gói cho phép đỗ <strong>miễn phí {selectedPkg?.maxHoursPerDay ? `${selectedPkg.maxHoursPerDay}h` : 'theo gói'}/ngày</strong>
                  {' '}(vượt tính phí theo giá thường). Gói <strong>không giữ chỗ cố định</strong> — nhân viên xếp chỗ trống khi xe vào.
                  Mỗi gói gắn với <strong>1 biển số</strong>. Muốn chắc chắn có chỗ vào giờ cụ thể, hãy dùng <strong>Đặt chỗ theo giờ</strong>.
                </p>
              </div>
            )}

          </div>


          {/* Right: Summary Sidebar */}
          <BookingSummarySidebar
            selectedBuildingName={selectedBuilding?.building.name}
            mode={mode}
            selectedPkgName={selectedPkg?.name}
            selectedVehicleType={selectedVehicleType}
            selectedSlot={selectedSlot}
            selectedPlate={selectedPlate}
            startDateTime={startDateTime}
            endDateTime={endDateTime}
            estimatedAmount={estimatedAmount}
          />
        </div>

        {/* ── Sticky Footer ── */}
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-[#060a11]/95 backdrop-blur-xl">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="hidden text-xs font-semibold text-slate-400 sm:block">
              {startDateTime && endDateTime ? (
                <>
                  <span className="text-white">Nhận bãi:</span> {fmtShort(startDateTime)}
                  <span className="mx-2 text-slate-600">—</span>
                  <span className="text-white">Trả bãi:</span> {fmtShort(endDateTime)}
                  <span className="mx-2 text-slate-600">|</span>
                  <span className="text-emerald-300 font-black">{fmtMoney(estimatedAmount)}</span>
                </>
              ) : (
                'Chọn thời gian và chỗ đỗ để đặt chỗ'
              )}
            </div>
            <motion.button
              type="button"
              disabled={!canSubmit}
              onClick={handleConfirmBooking}
              whileHover={canSubmit ? { scale: 1.02 } : {}}
              whileTap={canSubmit ? { scale: 0.98 } : {}}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-6 py-3 text-sm font-black uppercase tracking-wider text-slate-950 shadow-[0_0_24px_rgba(249,115,22,0.3)] transition-all disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 disabled:shadow-none"
            >
              <ShieldCheck size={16} />
              {isSubmitting ? 'Đang xử lý...' : mode === 'hourly' ? 'Xác nhận đặt chỗ' : 'Mua gói'}
            </motion.button>
          </div>
        </div>

        {/* Extra bottom padding for sticky footer */}
        <div className="h-20" />
      </div>

      {/* ── Slot Selection Modal ── */}
      <SlotSelectionModal
        isOpen={showSlotModal}
        onClose={() => setShowSlotModal(false)}
        selectedFloorIdModal={selectedFloorIdModal}
        setSelectedFloorIdModal={setSelectedFloorIdModal}
        slots={slots}
        selectedSlot={selectedSlot}
        setSelectedSlot={setSelectedSlot}
        unavailableSlotCodes={unavailableSlotCodes}
        unsupportedSlotCodes={unsupportedSlotCodes}
        onSlotClick={handleSlotClick}
        isLoadingSlots={isLoadingSlots}
        floorsError={floorsError}
        floorsData={floorsData}
        selectedVehicleType={selectedVehicleType}
      />

      {/* ── History Modal ── */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            onClick={() => setShowHistory(false)}
          >
            {/* Background glowing flare */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-orange-500/10 blur-[120px] pointer-events-none" />

            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-slate-950/95 p-6 shadow-[0_0_80px_rgba(0,0,0,0.8),_inset_0_1px_1px_rgba(255,255,255,0.1)] flex flex-col"
            >
              {/* Modal Header */}
              <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-orange-500/10 p-2 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                    <CalendarClock size={20} className="text-orange-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white tracking-wide">Lịch sử đặt chỗ</h2>
                    <p className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase mt-0.5">Theo dõi & Quản lý các lượt đỗ xe</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  className="rounded-full border border-white/5 bg-white/[0.02] p-2 text-slate-400 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-auto pr-1">
                <ReservationHistoryTab />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Center Notification Popup Modal ── */}
      <BookingNotificationModal
        bookingSuccess={bookingSuccess}
        bookingError={bookingError}
        onCloseSuccess={() => setBookingSuccess(null)}
        onCloseError={() => setBookingError(null)}
      />
    </main>
  );
}
