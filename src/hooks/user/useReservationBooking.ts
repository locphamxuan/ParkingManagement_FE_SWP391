import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { resolveErrorMessage } from '@/utils/apiErrors';
import { STORAGE_KEYS, loadString, removeStored, saveString } from '@/services/client/storage';

import {
  userApi,
  type Building,
  type VehicleType,
  type ParkingSlot as ApiParkingSlot,
  type FloorAvailability,
  type LongTermPackage,
  type ReservationPolicyLimits,
  type ReservationEstimate,
} from '@/services/user/userApi';

import {
  type BookingMode,
  type VehicleKind,
  fmtShort,
  normalizeVehicleTypeCode,
  isCarPackage,
  getMaxCalendarDate,
} from '@/pages/user/reservationsHelper';

export interface ReservationLocationState {
  buildingId?: string;
  plateNumber?: string;
  openHistory?: boolean;
  mode?: BookingMode;
}

export interface MappedSlot {
  _id: string;
  buildingId: string;
  code: string;
  vehicleType: VehicleKind | 'all';
  reservable: boolean;
  status: string;
}

/**
 * Toàn bộ state + business logic của luồng đặt chỗ (chọn tòa/slot, chọn ngày giờ/gói,
 * lấy ước tính phí/cọc thật từ BE, submit booking). Tách khỏi ReservationsPage để
 * page chỉ còn lo phần hiển thị theo từng khu vực UI.
 */
export function useReservationBooking() {
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
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleKind | ''>(
    () => (loadString(STORAGE_KEYS.selectedVehicleType) as VehicleKind) || ''
  );
  const changeVehicleType = (val: VehicleKind | '') => {
    setSelectedVehicleType(val);
    if (val) {
      saveString(STORAGE_KEYS.selectedVehicleType, val);
    } else {
      removeStored(STORAGE_KEYS.selectedVehicleType);
    }
  };
  const [reservationPolicy, setReservationPolicy] = useState<ReservationPolicyLimits | null>(null);
  const [liveEstimate, setLiveEstimate] = useState<ReservationEstimate | null>(null);
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
    let cancelled = false;

    const p1 = userApi.reservations.list({ limit: 100 }).then(res => {
      const items = res.data.items || [];
      return items
        .filter((r) => ['pending', 'confirmed', 'checked_in'].includes(r.status))
        .map((r) => r.plateNumber);
    }).catch(() => [] as string[]);

    const p2 = userApi.longTermSubscriptions.list({ limit: 100 }).then(res => {
      const items = res.data.items || [];
      return items
        .filter((s) => ['pending', 'active'].includes(s.status))
        .map((s) => (s.plateNumber || s.linkedPlates?.[0]) as string);
    }).catch(() => [] as string[]);

    Promise.all([p1, p2]).then(([resPlates, subPlates]) => {
      if (cancelled) return;
      setBookedPlates(Array.from(new Set([...resPlates.filter(Boolean), ...subPlates.filter(Boolean)])));
    });

    return () => { cancelled = true; };
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
          setFloorsError(`Failed to load floors: ${errorMsg}`);
          setFloorsData([]);
        }
      }
    };
    load();
    return () => { ignore = true; };
  }, [selectedBuildingId]);

  // Giới hạn đặt chỗ (maxAdvanceDays/maxDurationHours) do manager cấu hình theo building —
  // không hardcode ở FE, để date/duration picker luôn khớp policy thật.
  useEffect(() => {
    let ignore = false;
    if (!selectedBuildingId) { setReservationPolicy(null); return; }
    userApi.reservations.getPolicy(selectedBuildingId)
      .then((res) => { if (!ignore) setReservationPolicy(res.data); })
      .catch(() => { if (!ignore) setReservationPolicy(null); });
    return () => { ignore = true; };
  }, [selectedBuildingId]);

  // Load packages for selected building
  useEffect(() => {
    if (!selectedBuildingId) { setPackages([]); return; }
    let ignore = false;
    userApi.longTermPackages.list({ buildingId: selectedBuildingId })
      .then((res) => {
        if (ignore) return;
        setPackages(res.data.packages ?? []);
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

  const maxCalDate = useMemo(
    () => getMaxCalendarDate(mode, selectedPkg, reservationPolicy?.maxAdvanceDays),
    [mode, selectedPkg, reservationPolicy],
  );

  // Tìm vehicleTypeId thật của building khớp với loại xe đã chọn (car/motorcycle) —
  // dùng chung cho cả estimate và create, tránh lặp logic.
  const selectedVehicleTypeId = useMemo(() => {
    if (!selectedVehicleType) return undefined;
    const vt = vehicleTypesForBuilding.find((v) => {
      const c = (v.code || v.name || '').toLowerCase();
      if (selectedVehicleType === 'motorcycle') return /motor|xe|máy|bike|moto/i.test(c);
      return /car|oto|ô t|auto/i.test(c);
    });
    return vt?._id;
  }, [vehicleTypesForBuilding, selectedVehicleType]);

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

  // Ước tính phí + cọc lấy từ API thật (GET /users/reservations/estimate) — không
  // tự tính ở FE, tránh lệch với công thức tính giá thật của BE (peak hour, phụ phí...).
  useEffect(() => {
    let ignore = false;
    if (mode !== 'hourly' || !selectedBuildingId || !selectedVehicleTypeId || !startDateTime || !endDateTime) {
      setLiveEstimate(null);
      return;
    }
    userApi.reservations
      .estimate({
        buildingId: selectedBuildingId,
        vehicleTypeId: selectedVehicleTypeId,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
      })
      .then((res) => { if (!ignore) setLiveEstimate(res.data); })
      .catch(() => { if (!ignore) setLiveEstimate(null); });
    return () => { ignore = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, selectedBuildingId, selectedVehicleTypeId, startDateTime?.getTime(), endDateTime?.getTime()]);

  const estimatedAmount = useMemo(() => {
    if (mode === 'package') return selectedPkg?.price ?? 0;
    return liveEstimate?.estimatedFee ?? 0;
  }, [mode, selectedPkg, liveEstimate]);

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

  // So khớp bằng vehicleType thật của slot — không đoán từ chuỗi code
  // (code giờ do BE sinh {zoneCode}-NN nên không còn mang ý nghĩa loại xe).
  const unsupportedSlotCodes = useMemo(() => {
    if (!selectedVehicleType) return [];
    return slots
      .filter((s) => s.vehicleType !== 'all' && s.vehicleType !== selectedVehicleType)
      .map((s) => s.code);
  }, [slots, selectedVehicleType]);

  const canSubmit = Boolean(selectedBuildingId && !isSubmitting);

  /* ── Handlers ── */
  const handleBuildingChange = (id: string) => {
    setSelectedBuildingId(id);
    setSelectedSlot(null);
    setSelectedPlate('');
    setBookingError(null);
    setBookingSuccess(null);
    setSelectedPkg(null);
  };

  const handleVehicleTypeChange = (val: VehicleKind | '') => {
    changeVehicleType(val);
    setSelectedSlot(null);
    setSelectedPlate('');
    setSelectedPkg(null);
  };

  const handleModeChange = (next: BookingMode) => {
    setMode(next);
    setSelectedSlot(null);
    setBookingError(null);
    setBookingSuccess(null);
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

  const handleSelectPackage = (pkg: LongTermPackage) => {
    setSelectedPkg(pkg);
    setPkgStartDate(null);
    const nextType = isCarPackage(pkg) ? 'car' : 'motorcycle';
    if (selectedVehicleType !== nextType) {
      changeVehicleType(nextType);
      setSelectedSlot(null);
      setSelectedPlate('');
    }
  };

  const handleConfirmBooking = async () => {
    setBookingError(null);
    setBookingSuccess(null);

    if (!selectedVehicleType) {
      setBookingError('Please select vehicle type before booking.');
      return;
    }

    if (!selectedPlate) {
      setBookingError('Please select license plate.');
      return;
    }

    if (mode === 'hourly') {
      if (!selectedSlot) {
        setBookingError('Please select parking slot on the map.');
        return;
      }
      if (!startDateTime || !endDateTime) {
        setBookingError('Please select check-in and check-out time.');
        return;
      }
      if (startDateTime.getTime() < Date.now() - 5 * 60 * 1000) {
        setBookingError('Check-in time cannot be in the past. Please select another time.');
        return;
      }
    } else {
      if (!selectedPkg) {
        setBookingError('Please select long-term parking package.');
        return;
      }
      if (!startDateTime) {
        setBookingError('Please select package start date.');
        return;
      }
    }

    if (!selectedBuildingId) return;

    setIsSubmitting(true);
    try {
      if (mode === 'hourly') {
        // Find the slot's _id
        const slotRecord = slots.find((s) => s.code === selectedSlot);

        await userApi.reservations.create({
          buildingId: selectedBuildingId,
          plateNumber: selectedPlate,
          vehicleTypeId: selectedVehicleTypeId,
          vehicleType: selectedVehicleType || undefined,
          startTime: startDateTime!.toISOString(),
          endTime: endDateTime!.toISOString(),
          slotId: slotRecord?._id,
        });
        setBookingSuccess(`Booking successful! Slot ${selectedSlot} from ${fmtShort(startDateTime!)} to ${fmtShort(endDateTime!)}`);
      } else if (selectedPkg) {
        const res = await userApi.longTermSubscriptions.create({
          packageId: selectedPkg._id,
          plateNumber: selectedPlate,
          startDate: startDateTime!.toISOString(),
        });
        const data = res.data as { subscription?: unknown; checkoutUrl?: string };
        if (data?.checkoutUrl) {
          setBookingSuccess('Redirecting to PayOS payment gateway...');
          window.location.href = data.checkoutUrl;
        } else {
          setBookingSuccess(`Subscription for "${selectedPkg.name}" successful!`);
        }
      }
      setSelectedSlot(null);
      setShowSlotModal(false);
    } catch (err) {
      setBookingError(resolveErrorMessage(err, 'Failed to complete reservation.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    session,
    user,
    mode,
    rows,
    selectedBuildingId,
    selectedBuilding,
    vehicleTypesForBuilding,
    selectedVehicleType,
    reservationPolicy,
    liveEstimate,
    floorsData,
    floorsError,
    slots,
    selectedFloorIdModal,
    setSelectedFloorIdModal,
    selectedSlot,
    setSelectedSlot,
    selectedPlate,
    setSelectedPlate,
    selectedDate,
    setSelectedDate,
    selectedTime,
    setSelectedTime,
    durationHours,
    setDurationHours,
    packages,
    selectedPkg,
    pkgStartDate,
    setPkgStartDate,
    isLoadingBuildings,
    isLoadingSlots,
    isSubmitting,
    showSlotModal,
    setShowSlotModal,
    showHistory,
    setShowHistory,
    bookingError,
    setBookingError,
    bookingSuccess,
    setBookingSuccess,
    maxCalDate,
    startDateTime,
    endDateTime,
    estimatedAmount,
    plateOptions,
    unavailableSlotCodes,
    unsupportedSlotCodes,
    canSubmit,
    handleBuildingChange,
    handleVehicleTypeChange,
    handleModeChange,
    handleSlotClick,
    handleSelectPackage,
    handleConfirmBooking,
  };
}

export type ReservationBooking = ReturnType<typeof useReservationBooking>;
