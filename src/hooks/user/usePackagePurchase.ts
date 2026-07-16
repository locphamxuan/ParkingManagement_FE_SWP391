import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { resolveErrorMessage } from '@/utils/apiErrors';
import { STORAGE_KEYS, loadString, removeStored, saveString } from '@/services/client/storage';

import {
  userApi,
  type Building,
  type VehicleType,
  type LongTermPackage,
  type ParkingSlot as ApiParkingSlot,
  type FloorAvailability,
} from '@/services/user/userApi';

import {
  type VehicleKind,
  isCarPackage,
  getMaxCalendarDate,
  normalizeVehicleTypeCode,
} from '@/pages/user/reservationsHelper';

export interface PackagePurchaseLocationState {
  buildingId?: string;
  plateNumber?: string;
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
 * Toàn bộ state + business logic của luồng MUA GÓI dài hạn (chọn tòa/loại xe/biển,
 * chọn gói + ngày bắt đầu, mua gói). Tách khỏi trang để trang chỉ lo hiển thị.
 * Chọn slot cố định (tùy chọn) được thêm ở Phase 1.
 */
export function usePackagePurchase() {
  const location = useLocation();
  const { session } = useAuth();
  const state = (location.state as PackagePurchaseLocationState | null) ?? null;

  const user = useMemo(() => {
    if (!session) return null;
    return { userId: session.userId, fullName: session.displayName, licensePlates: session.licensePlates || [] };
  }, [session]);

  /* ── Core state ── */
  const [rows, setRows] = useState<Array<{ building: Building }>>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [vehicleTypesForBuilding, setVehicleTypesForBuilding] = useState<VehicleType[]>([]);
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleKind | ''>(
    () => (loadString(STORAGE_KEYS.selectedVehicleType) as VehicleKind) || ''
  );
  const changeVehicleType = (val: VehicleKind | '') => {
    setSelectedVehicleType(val);
    if (val) saveString(STORAGE_KEYS.selectedVehicleType, val);
    else removeStored(STORAGE_KEYS.selectedVehicleType);
  };
  const [selectedPlate, setSelectedPlate] = useState('');

  /* ── Package state ── */
  const [packages, setPackages] = useState<LongTermPackage[]>([]);
  const [selectedPkg, setSelectedPkg] = useState<LongTermPackage | null>(null);
  const [pkgStartDate, setPkgStartDate] = useState<Date | null>(null);

  /* ── Fixed-slot picker (tùy chọn) — chỉ ô dãy 'subscriber' ── */
  const [floorsData, setFloorsData] = useState<FloorAvailability[]>([]);
  const [floorsError, setFloorsError] = useState<string>('');
  const [slots, setSlots] = useState<MappedSlot[]>([]);
  const [selectedFloorIdModal, setSelectedFloorIdModal] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);

  /* ── UI state ── */
  const [isLoadingBuildings, setIsLoadingBuildings] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingSuccess, setBookingSuccess] = useState<string | null>(null);

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

  // Biển đã có gói (active/pending) → loại khỏi lựa chọn để tránh mua trùng.
  const [bookedPlates, setBookedPlates] = useState<string[]>([]);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    userApi.longTermSubscriptions.list({ limit: 100 })
      .then((res) => {
        if (cancelled) return;
        const plates = (res.data.items || [])
          .filter((s) => ['pending', 'active'].includes(s.status))
          .map((s) => (s.plateNumber || s.linkedPlates?.[0]) as string)
          .filter(Boolean);
        setBookedPlates(Array.from(new Set(plates)));
      })
      .catch(() => setBookedPlates([]));
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

  useEffect(() => {
    if (state?.plateNumber) setSelectedPlate(state.plateNumber);
  }, [state?.plateNumber]);

  // Load vehicle types for selected building (để map car/motorcycle → vehicleTypeId).
  useEffect(() => {
    let ignore = false;
    if (!selectedBuildingId) { setVehicleTypesForBuilding([]); return; }
    userApi.buildings.vehicleTypes(selectedBuildingId)
      .then((res) => { if (!ignore) setVehicleTypesForBuilding(res.data.items || []); })
      .catch(() => { if (!ignore) setVehicleTypesForBuilding([]); });
    return () => { ignore = true; };
  }, [selectedBuildingId]);

  // Load packages for selected building.
  useEffect(() => {
    if (!selectedBuildingId) { setPackages([]); return; }
    let ignore = false;
    userApi.longTermPackages.list({ buildingId: selectedBuildingId })
      .then((res) => { if (!ignore) setPackages(res.data.packages ?? []); })
      .catch(() => { });
    return () => { ignore = true; };
  }, [selectedBuildingId]);

  /* ── Derived values ── */
  const selectedBuilding = useMemo(
    () => rows.find((r) => r.building._id === selectedBuildingId) || null,
    [rows, selectedBuildingId],
  );

  const maxCalDate = useMemo(
    () => getMaxCalendarDate('package', selectedPkg),
    [selectedPkg],
  );

  const selectedVehicleTypeId = useMemo(() => {
    if (!selectedVehicleType) return undefined;
    const vt = vehicleTypesForBuilding.find((v) => {
      const c = (v.code || v.name || '').toLowerCase();
      if (selectedVehicleType === 'motorcycle') return /motor|xe|máy|bike|moto/i.test(c);
      return /car|oto|ô t|auto/i.test(c);
    });
    return vt?._id;
  }, [vehicleTypesForBuilding, selectedVehicleType]);

  // Load các TẦNG có ô dãy 'subscriber' đúng loại xe (cho slot picker của gói).
  useEffect(() => {
    let ignore = false;
    if (!selectedBuildingId || !selectedVehicleTypeId) { setFloorsData([]); setFloorsError(''); return; }
    userApi.buildings.floors(selectedBuildingId, { usage: 'subscriber', vehicleTypeId: selectedVehicleTypeId })
      .then((res) => { if (!ignore) setFloorsData(res.data.floors || []); })
      .catch((err) => {
        if (ignore) return;
        setFloorsData([]);
        setFloorsError(err instanceof Error ? `Failed to load floors: ${err.message}` : 'Failed to load floors');
      });
    return () => { ignore = true; };
  }, [selectedBuildingId, selectedVehicleTypeId]);

  // Load ô dãy 'subscriber' của tầng đang chọn trong modal.
  useEffect(() => {
    let ignore = false;
    if (!selectedBuildingId || !selectedFloorIdModal || !selectedVehicleTypeId) return;
    setIsLoadingSlots(true);
    userApi.buildings.slots(selectedBuildingId, selectedFloorIdModal, { usage: 'subscriber', vehicleTypeId: selectedVehicleTypeId })
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
  }, [selectedBuildingId, selectedFloorIdModal, selectedVehicleTypeId]);

  const startDateTime = useMemo(() => {
    if (!pkgStartDate) return null;
    const d = new Date(pkgStartDate);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [pkgStartDate]);

  const endDateTime = useMemo(() => {
    if (startDateTime && selectedPkg) {
      return new Date(startDateTime.getTime() + selectedPkg.durationDays * 24 * 60 * 60 * 1000);
    }
    return null;
  }, [startDateTime, selectedPkg]);

  const estimatedAmount = useMemo(() => selectedPkg?.price ?? 0, [selectedPkg]);

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

  const canSubmit = Boolean(selectedBuildingId && !isSubmitting);

  // Ô không chọn được (không trống hoặc không cho giữ chỗ).
  const unavailableSlotCodes = useMemo(
    () => slots.filter((s) => s.status !== 'available' || !s.reservable).map((s) => s.code),
    [slots],
  );
  // Ô sai loại xe của gói (BE đã lọc theo vehicleType nên thường rỗng, giữ để chắc chắn).
  const unsupportedSlotCodes = useMemo(() => {
    if (!selectedVehicleType) return [];
    return slots
      .filter((s) => s.vehicleType !== 'all' && s.vehicleType !== selectedVehicleType)
      .map((s) => s.code);
  }, [slots, selectedVehicleType]);

  /* ── Handlers ── */
  const handleBuildingChange = (id: string) => {
    setSelectedBuildingId(id);
    setSelectedPlate('');
    setBookingError(null);
    setBookingSuccess(null);
    setSelectedPkg(null);
    setSelectedSlot(null);
  };

  const handleVehicleTypeChange = (val: VehicleKind | '') => {
    changeVehicleType(val);
    setSelectedPlate('');
    setSelectedPkg(null);
    setSelectedSlot(null);
  };

  const handleSelectPackage = (pkg: LongTermPackage) => {
    setSelectedPkg(pkg);
    setPkgStartDate(null);
    setSelectedSlot(null);
    const nextType = isCarPackage(pkg) ? 'car' : 'motorcycle';
    if (selectedVehicleType !== nextType) {
      changeVehicleType(nextType);
      setSelectedPlate('');
    }
  };

  const handleSlotClick = (code: string) => {
    if (unavailableSlotCodes.includes(code)) return;
    if (unsupportedSlotCodes.includes(code)) return;
    setSelectedSlot(code);
  };

  const handleConfirmPurchase = async () => {
    setBookingError(null);
    setBookingSuccess(null);

    if (!selectedVehicleType) { setBookingError('Please select vehicle type before purchasing.'); return; }
    if (!selectedPlate) { setBookingError('Please select license plate.'); return; }
    if (!selectedPkg) { setBookingError('Please select a long-term package.'); return; }
    if (!startDateTime) { setBookingError('Please select package start date.'); return; }
    if (!selectedBuildingId) return;

    setIsSubmitting(true);
    try {
      const slotRecord = selectedSlot ? slots.find((s) => s.code === selectedSlot) : null;
      const res = await userApi.longTermSubscriptions.create({
        packageId: selectedPkg._id,
        plateNumber: selectedPlate,
        startDate: startDateTime.toISOString(),
        slotId: slotRecord?._id,
      });
      const data = res.data as { subscription?: unknown; checkoutUrl?: string };
      if (data?.checkoutUrl) {
        setBookingSuccess('Redirecting to PayOS payment gateway...');
        window.location.href = data.checkoutUrl;
      } else {
        setBookingSuccess(`Subscription for "${selectedPkg.name}" successful!`);
      }
    } catch (err) {
      setBookingError(resolveErrorMessage(err, 'Failed to purchase package.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    session,
    user,
    rows,
    selectedBuildingId,
    selectedBuilding,
    vehicleTypesForBuilding,
    selectedVehicleType,
    selectedVehicleTypeId,
    selectedPlate,
    setSelectedPlate,
    packages,
    selectedPkg,
    pkgStartDate,
    setPkgStartDate,
    isLoadingBuildings,
    isSubmitting,
    bookingError,
    setBookingError,
    bookingSuccess,
    setBookingSuccess,
    maxCalDate,
    startDateTime,
    endDateTime,
    estimatedAmount,
    plateOptions,
    canSubmit,
    // Slot picker (tùy chọn)
    floorsData,
    floorsError,
    slots,
    selectedFloorIdModal,
    setSelectedFloorIdModal,
    selectedSlot,
    setSelectedSlot,
    isLoadingSlots,
    showSlotModal,
    setShowSlotModal,
    unavailableSlotCodes,
    unsupportedSlotCodes,
    handleSlotClick,
    handleBuildingChange,
    handleVehicleTypeChange,
    handleSelectPackage,
    handleConfirmPurchase,
  };
}

export type PackagePurchase = ReturnType<typeof usePackagePurchase>;
