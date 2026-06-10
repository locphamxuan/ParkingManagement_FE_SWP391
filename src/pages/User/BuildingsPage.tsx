import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Building2,
  Car,
  Bike,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MapPin,
  PhoneCall,
  Search,
  SquareParking,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { useBuildings } from '@/hooks/user';
import { useAuth } from '@/hooks/useAuth';
import {
  userApi,
  type Building,
  type FloorAvailability,
  type VehicleType,
  type LicensePlate,
  type UserVehicleType,
} from '@/services/user/userApi';

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function isBuildingOpen(building: Building): boolean {
  return building.status ? building.status === 'active' : true;
}

function addressText(building: Building): string {
  if (building.address?.fullAddress) return building.address.fullAddress;
  return building.address ? JSON.stringify(building.address) : 'Chưa cập nhật địa chỉ';
}

/** Map FE vehicleType strings to backend vehicle type code for matching. */
function plateMatchesVehicleTypes(plate: LicensePlate, vtypes: VehicleType[]): boolean {
  if (vtypes.length === 0) return true; // no filter
  const t = plate.vehicleType?.toLowerCase() ?? '';
  return vtypes.some((vt) => {
    const c = (vt.code || vt.name || '').toLowerCase();
    if (t === 'motorcycle' || t === 'bike') return /motor|xe|máy|bike|moto/i.test(c);
    return /car|oto|ô t|auto/i.test(c); // car, suv, truck all map to car
  });
}

/* ─── Sub Components ───────────────────────────────────────────────────────── */

function StatusBadge({ open }: { open: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${
        open
          ? 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300'
          : 'border-rose-400/25 bg-rose-400/10 text-rose-300'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${open ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-rose-400'}`} />
      {open ? 'Đang mở' : 'Tạm đóng'}
    </span>
  );
}

function BuildingCard({
  building,
  selected,
  onSelect,
}: {
  building: Building;
  selected: boolean;
  onSelect: () => void;
}) {
  const open = isBuildingOpen(building);

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`group w-full rounded-2xl border p-5 text-left transition-all duration-300 ${
        selected
          ? 'border-orange-400/50 bg-gradient-to-br from-orange-500/10 to-amber-500/5 shadow-[0_0_32px_rgba(249,115,22,0.12)]'
          : 'border-white/8 bg-white/[0.03] hover:border-orange-400/25 hover:bg-white/[0.05]'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300/80">
            {building.code || 'BUILDING'}
          </p>
          <h2 className="mt-2 text-lg font-black text-white">{building.name}</h2>
          <p className="mt-2 flex items-start gap-2 text-xs font-semibold leading-relaxed text-slate-400">
            <MapPin size={13} className="mt-0.5 shrink-0 text-cyan-300/70" />
            <span className="line-clamp-2">{addressText(building)}</span>
          </p>
        </div>
        <StatusBadge open={open} />
      </div>

      <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-slate-500 transition-colors group-hover:text-slate-400">
        <CheckCircle2 size={13} className={selected ? 'text-orange-300' : 'text-emerald-400/60'} />
        {selected ? 'Đang xem chi tiết' : 'Bấm để xem chi tiết'}
      </div>
    </motion.button>
  );
}

/* ─── Vehicle / License Plate Dropdown ─────────────────────────────────────── */

function VehiclePlateDropdown({
  plates,
  selectedPlate,
  onSelect,
}: {
  plates: LicensePlate[];
  selectedPlate: string;
  onSelect: (plateNumber: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = plates.find((p) => p.plateNumber === selectedPlate);

  const vehicleIcon = (type: string) => {
    const t = type?.toLowerCase() ?? '';
    if (t === 'motorcycle' || t === 'bike') return <Bike size={16} className="text-purple-300" />;
    return <Car size={16} className="text-cyan-300" />;
  };

  const vehicleLabel = (type: string) => {
    const t = type?.toLowerCase() ?? '';
    if (t === 'motorcycle' || t === 'bike') return 'Xe máy';
    return 'Ô tô';
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex h-14 w-full items-center justify-between gap-3 rounded-2xl border px-4 transition-all duration-300 ${
          open
            ? 'border-orange-400/50 bg-white/[0.06] shadow-[0_0_24px_rgba(249,115,22,0.1)]'
            : 'border-white/10 bg-white/[0.03] hover:border-white/20'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {selected ? (
            <>
              {vehicleIcon(selected.vehicleType)}
              <div className="text-left min-w-0">
                <p className="text-sm font-black text-white truncate">{selected.plateNumber}</p>
                <p className="text-[10px] font-semibold text-slate-400">{vehicleLabel(selected.vehicleType)}</p>
              </div>
            </>
          ) : (
            <span className="text-sm font-semibold text-slate-500">Chọn xe & biển số của bạn</span>
          )}
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-orange-300/60" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-50 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0c1220]/95 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          >
            {plates.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs font-semibold text-slate-500">
                Bạn chưa đăng ký biển số phù hợp với tòa nhà này.
              </div>
            ) : (
              <div className="max-h-52 overflow-y-auto p-1.5">
                {plates.map((plate) => {
                  const isActive = plate.plateNumber === selectedPlate;
                  return (
                    <button
                      key={plate._id}
                      type="button"
                      onClick={() => {
                        onSelect(plate.plateNumber);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-all duration-150 ${
                        isActive
                          ? 'bg-orange-400/15 text-white'
                          : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                      }`}
                    >
                      {vehicleIcon(plate.vehicleType)}
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-black ${isActive ? 'text-orange-200' : 'text-white'}`}>
                          {plate.plateNumber}
                        </p>
                        <p className="text-[10px] font-semibold text-slate-500">{vehicleLabel(plate.vehicleType)}</p>
                      </div>
                      {isActive && <CheckCircle2 size={14} className="text-orange-300 shrink-0" />}
                      {plate.isDefault && (
                        <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold text-emerald-300 shrink-0">
                          Mặc định
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Page ────────────────────────────────────────────────────────────── */

export default function BuildingsPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const { items: buildings, isLoading } = useBuildings();
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [selectedPlate, setSelectedPlate] = useState('');

  const [detail, setDetail] = useState<{ floors: FloorAvailability[]; vehicleTypes: VehicleType[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const userPlates: LicensePlate[] = useMemo(() => {
    return (session?.licensePlates || []).map((p) => ({
      _id: p._id || '',
      plateNumber: p.plateNumber,
      vehicleType: p.vehicleType as UserVehicleType,
      isDefault: !!p.isDefault,
    }));
  }, [session]);

  // Auto-select first building
  useEffect(() => {
    if (buildings.length > 0 && !selectedId) {
      setSelectedId(buildings[0]._id);
    }
  }, [buildings, selectedId]);

  const filteredRows = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return buildings;
    return buildings.filter((building) => {
      const haystack = [building.name, building.code, addressText(building)]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(keyword);
    });
  }, [query, buildings]);

  const selectedBuilding = useMemo(
    () => filteredRows.find((b) => b._id === selectedId) || filteredRows[0] || null,
    [filteredRows, selectedId],
  );

  // Fetch floors + vehicle types for selected building
  useEffect(() => {
    const id = selectedBuilding?._id;
    if (!id) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    Promise.all([userApi.buildings.floors(id), userApi.buildings.vehicleTypes(id)])
      .then(([fRes, vRes]) => {
        if (cancelled) return;
        const floors = (fRes as { data?: { floors?: FloorAvailability[] } })?.data?.floors ?? [];
        const vehicleTypes = (vRes as { data?: { items?: VehicleType[] } })?.data?.items ?? [];
        setDetail({ floors, vehicleTypes });
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedBuilding?._id]);

  // Filter user plates to those matching building vehicle types
  const compatiblePlates = useMemo(() => {
    if (!detail?.vehicleTypes) return userPlates;
    return userPlates.filter((plate) => plateMatchesVehicleTypes(plate, detail.vehicleTypes));
  }, [userPlates, detail?.vehicleTypes]);

  // Auto-select default plate
  useEffect(() => {
    if (compatiblePlates.length > 0 && !selectedPlate) {
      const defaultPlate = compatiblePlates.find((p) => p.isDefault);
      setSelectedPlate(defaultPlate?.plateNumber || compatiblePlates[0].plateNumber);
    }
  }, [compatiblePlates, selectedPlate]);

  // Reset plate when building changes
  useEffect(() => {
    setSelectedPlate('');
  }, [selectedBuilding?._id]);

  const floorCount = detail?.floors.length ?? 0;
  const availableSlots = useMemo(
    () => (detail?.floors ?? []).reduce((sum, f) => sum + (f.availableSlots ?? 0), 0),
    [detail],
  );
  const totalSlots = useMemo(
    () => (detail?.floors ?? []).reduce((sum, f) => sum + (f.totalSlots ?? 0), 0),
    [detail],
  );

  const canProceed = Boolean(selectedBuilding && selectedPlate && isBuildingOpen(selectedBuilding));

  return (
    <main className="min-h-screen bg-[#060a11] text-slate-100">
      {/* ── Top Bar ── */}
      <div className="border-b border-white/[0.06] bg-[#060a11]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-black uppercase tracking-wider text-orange-300/90 transition hover:border-orange-400/30 hover:bg-orange-400/5"
          >
            <ArrowLeft size={14} />
            Trang chủ
          </button>
          <div className="hidden items-center gap-2 text-xs font-bold text-slate-500 sm:flex">
            <PhoneCall size={14} className="text-emerald-400/60" />
            Hỗ trợ 1900 636 447
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end"
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-300/70">
              Chọn tòa nhà
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
              Bãi đỗ xe thông minh
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-slate-400">
              Xem số tầng, chỗ trống và loại xe được hỗ trợ. Chọn xe của bạn rồi bấm đặt chỗ.
            </p>
          </div>

          <label className="relative block">
            <Search
              size={17}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Tìm theo tên, mã hoặc địa chỉ"
              className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.03] pl-11 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-orange-400/50 focus:shadow-[0_0_20px_rgba(249,115,22,0.08)]"
            />
          </label>
        </motion.div>

        {isLoading ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center gap-3 text-sm font-bold text-slate-400">
              <Loader2 size={18} className="animate-spin text-orange-300" />
              Đang tải thông tin tòa nhà...
            </div>
          </div>
        ) : buildings.length === 0 ? (
          <div className="rounded-3xl border border-rose-400/20 bg-rose-500/5 p-6 text-sm font-semibold text-rose-200">
            Không có tòa nhà nào. Vui lòng thử lại sau.
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            {/* ── Building List ── */}
            <div className="space-y-3">
              {filteredRows.map((building) => (
                <BuildingCard
                  key={building._id}
                  building={building}
                  selected={selectedBuilding?._id === building._id}
                  onSelect={() => setSelectedId(building._id)}
                />
              ))}

              {filteredRows.length === 0 && (
                <div className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-8 text-center text-sm font-semibold text-slate-500">
                  Không tìm thấy tòa nhà phù hợp.
                </div>
              )}
            </div>

            {/* ── Detail Panel ── */}
            {selectedBuilding && (
              <aside className="rounded-3xl border border-white/[0.06] bg-gradient-to-b from-white/[0.04] to-transparent p-6 shadow-2xl lg:sticky lg:top-6 lg:self-start">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-300/80">
                      {selectedBuilding.code || 'BUILDING'}
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-white">{selectedBuilding.name}</h2>
                    <p className="mt-2 flex items-start gap-2 text-sm font-semibold leading-relaxed text-slate-400">
                      <MapPin size={16} className="mt-0.5 shrink-0 text-orange-300/70" />
                      <span>{addressText(selectedBuilding)}</span>
                    </p>
                  </div>
                  <StatusBadge open={isBuildingOpen(selectedBuilding)} />
                </div>

                {/* Stats Grid */}
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <Layers size={18} className="text-cyan-300/70" />
                    <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Số tầng</p>
                    <p className="mt-1 text-xl font-black text-white">
                      {detailLoading ? '…' : floorCount}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <SquareParking size={18} className="text-emerald-300/70" />
                    <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Chỗ trống</p>
                    <p className="mt-1 text-xl font-black text-emerald-300">
                      {detailLoading ? '…' : availableSlots}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                    <Building2 size={18} className="text-orange-300/70" />
                    <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Tổng ô</p>
                    <p className="mt-1 text-xl font-black text-white">
                      {detailLoading ? '…' : totalSlots}
                    </p>
                  </div>
                </div>

                {/* Vehicle Types */}
                <div className="mt-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Loại xe được hỗ trợ</p>
                  {detailLoading ? (
                    <p className="mt-2 text-sm font-semibold text-slate-500">Đang tải...</p>
                  ) : (detail?.vehicleTypes.length ?? 0) > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {detail!.vehicleTypes.map((vt) => {
                        const isBike = /motor|xe|máy|bike|moto/i.test((vt.code || vt.name || ''));
                        return (
                          <span
                            key={vt._id}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-bold text-slate-200"
                          >
                            {isBike ? <Bike size={12} className="text-purple-300/70" /> : <Car size={12} className="text-cyan-300/70" />}
                            {vt.name}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm font-semibold text-slate-500">Đang cập nhật</p>
                  )}
                </div>

                {/* Vehicle / Plate Dropdown */}
                <div className="mt-5">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Chọn xe của bạn</p>
                  <VehiclePlateDropdown
                    plates={compatiblePlates}
                    selectedPlate={selectedPlate}
                    onSelect={setSelectedPlate}
                  />
                </div>

                {/* CTA Button */}
                <motion.button
                  type="button"
                  disabled={!canProceed}
                  onClick={() =>
                    navigate('/reservations', {
                      state: { buildingId: selectedBuilding._id, plateNumber: selectedPlate },
                    })
                  }
                  whileHover={canProceed ? { scale: 1.01 } : {}}
                  whileTap={canProceed ? { scale: 0.99 } : {}}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 px-5 py-3.5 text-sm font-black uppercase tracking-wider text-slate-950 shadow-[0_0_30px_rgba(249,115,22,0.25)] transition-all duration-300 hover:shadow-[0_0_40px_rgba(249,115,22,0.35)] disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 disabled:shadow-none"
                >
                  <ShieldCheck size={16} />
                  Xem chỗ đỗ để đặt chỗ
                </motion.button>
              </aside>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
