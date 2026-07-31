import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Car,
  Bike,
  CheckCircle2,
  ChevronDown,
  Loader2,
  MapPin,
  Search,
  SquareParking,
  Layers,
  ShieldCheck,
} from 'lucide-react';
import { useBuildings } from '@/hooks/user';
import { useVehicles } from '@/hooks/user/useVehicles';
import type { Vehicle, VehicleCategory } from '@/services/vehicleService';
import {
  userApi,
  type Building,
  type FloorAvailability,
  type VehicleType,
} from '@/services/user/userApi';
import { isTwoWheelCategory } from '@/utils/plate';

/* ─── Helpers ──────────────────────────────────────────────────────────────── */

function isBuildingOpen(building: Building): boolean {
  return building.status ? building.status === 'active' : true;
}

function addressText(building: Building): string {
  if (building.address?.fullAddress) return building.address.fullAddress;
  return building.address ? JSON.stringify(building.address) : 'Address not updated';
}

/**
 * Tòa nhà này có nhận loại xe của chiếc xe đang chọn không.
 *
 * Trước đây hàm này đoán bằng regex trên mã/tên danh mục ('motor|xe|máy'…), nên
 * manager đặt tên khác quy ước là lọc sai. Giờ mỗi VehicleType khai báo `category`,
 * ta so ở mức NHÓM (2 bánh / 4 bánh) — đúng cách backend tính giá và gán ô đỗ.
 */
function vehicleMatchesBuildingTypes(vehicle: Vehicle, vtypes: VehicleType[]): boolean {
  if (vtypes.length === 0) return true; // tòa chưa khai báo loại xe → không lọc
  const wantsTwoWheel = isTwoWheelCategory(vehicle.category);
  return vtypes.some((vt) => isTwoWheelCategory(vt.category) === wantsTwoWheel);
}

/* ─── Sub Components ───────────────────────────────────────────────────────── */

function StatusBadge({ open }: { open: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 ${
        open
          ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400'
          : 'border-rose-500/20 bg-rose-500/5 text-rose-400'
      }`}
    >
      <span className="relative flex h-1.5 w-1.5">
        {open && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
        )}
        {!open && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${open ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
      </span>
      {open ? 'Open' : 'Closed'}
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
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      className={`group relative w-full overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300 backdrop-blur-md ${
        selected
          ? 'border-orange-500/30 bg-gradient-to-br from-orange-500/10 via-slate-900/40 to-slate-900/40 shadow-[0_0_30px_rgba(249,115,22,0.12)]'
          : 'border-white/[0.06] bg-slate-900/20 hover:border-white/10 hover:bg-slate-900/30'
      }`}
    >
      {/* Selected Indicator Bar on Left */}
      {selected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-orange-500 to-amber-500" />
      )}

      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[9px] font-black uppercase tracking-[0.2em] text-orange-400/80">
            {building.code || 'BUILDING'}
          </p>
          <h2 className="mt-1.5 text-base font-extrabold text-white group-hover:text-orange-200 transition-colors">
            {building.name}
          </h2>
          <p className="mt-2 flex items-start gap-1.5 text-xs font-semibold leading-relaxed text-slate-400">
            <MapPin size={13} className="mt-0.5 shrink-0 text-cyan-400/70" />
            <span className="line-clamp-1">{addressText(building)}</span>
          </p>
        </div>
        <StatusBadge open={open} />
      </div>

      <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-slate-500 transition-colors group-hover:text-slate-400">
        <CheckCircle2 size={13} className={selected ? 'text-orange-400' : 'text-emerald-500/50'} />
        {selected ? 'Viewing Details' : 'Click to view details'}
      </div>
    </motion.button>
  );
}

/* ─── Vehicle Dropdown ─────────────────────────────────────────────────────── */

function VehicleDropdown({
  vehicles,
  categories,
  selectedPlate,
  onSelect,
}: {
  vehicles: Vehicle[];
  categories: VehicleCategory[];
  selectedPlate: string;
  onSelect: (plateNumber: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = vehicles.find((v) => v.plateNumber === selectedPlate);

  const vehicleIcon = (category: string) =>
    isTwoWheelCategory(category) ? (
      <Bike size={16} className="text-purple-400" />
    ) : (
      <Car size={16} className="text-cyan-400" />
    );

  // Nhãn thể loại do backend cấp; chỉ rơi về mã gốc khi danh mục chưa nạp xong.
  const vehicleLabel = (category: string) =>
    categories.find((option) => option.code === category)?.label || category;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex h-14 w-full items-center justify-between gap-3 rounded-2xl border px-4 transition-all duration-300 backdrop-blur-md ${
          open
            ? 'border-orange-500 bg-orange-500/[0.04] shadow-[0_0_24px_rgba(249,115,22,0.15)]'
            : 'border-white/10 bg-slate-900/30 hover:border-white/20'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {selected ? (
            <>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08]">
                {vehicleIcon(selected.category)}
              </div>
              <div className="text-left min-w-0">
                <p className="text-sm font-black text-white tracking-wide truncate">{selected.plateNumber}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{vehicleLabel(selected.category)}</p>
              </div>
            </>
          ) : (
            <span className="text-sm font-semibold text-slate-500">Select your vehicle & plate</span>
          )}
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-orange-400" />
        </motion.div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-50 w-full overflow-hidden rounded-2xl border border-white/10 bg-[#0c1220]/95 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] backdrop-blur-xl"
          >
            {vehicles.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs font-semibold text-slate-500">
                You have not registered a vehicle compatible with this building.
              </div>
            ) : (
              <div className="max-h-52 overflow-y-auto p-1.5">
                {vehicles.map((vehicle) => {
                  const isActive = vehicle.plateNumber === selectedPlate;
                  return (
                    <button
                      key={vehicle._id}
                      type="button"
                      onClick={() => {
                        onSelect(vehicle.plateNumber);
                        setOpen(false);
                      }}
                      className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-all duration-150 ${
                        isActive
                          ? 'bg-orange-500/10 text-white border border-orange-500/20'
                          : 'text-slate-300 hover:bg-white/[0.04] hover:text-white border border-transparent'
                      }`}
                    >
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/[0.04] border border-white/[0.06]">
                        {vehicleIcon(vehicle.category)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-black tracking-wide ${isActive ? 'text-orange-300' : 'text-white'}`}>
                          {vehicle.plateNumber}
                        </p>
                        <p className="text-[9px] font-bold uppercase tracking-wider text-slate-500">{vehicleLabel(vehicle.category)}</p>
                      </div>
                      {isActive && <CheckCircle2 size={14} className="text-orange-400 shrink-0" />}
                      {vehicle.isDefault && (
                        <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400 shrink-0">
                          Default
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
  const { items: buildings, isLoading } = useBuildings();
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [selectedPlate, setSelectedPlate] = useState('');

  const [detail, setDetail] = useState<{ floors: FloorAvailability[]; vehicleTypes: VehicleType[] } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Danh sách xe lấy trực tiếp từ API (không phải bản sao trong phiên đăng nhập).
  const { vehicles, categories } = useVehicles();

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

  // Filter user vehicles to those matching building vehicle types
  const compatibleVehicles = useMemo(() => {
    if (!detail?.vehicleTypes) return vehicles;
    return vehicles.filter((vehicle) => vehicleMatchesBuildingTypes(vehicle, detail.vehicleTypes));
  }, [vehicles, detail?.vehicleTypes]);

  // Auto-select default vehicle
  useEffect(() => {
    if (compatibleVehicles.length > 0 && !selectedPlate) {
      const defaultVehicle = compatibleVehicles.find((v) => v.isDefault);
      setSelectedPlate(defaultVehicle?.plateNumber || compatibleVehicles[0].plateNumber);
    }
  }, [compatibleVehicles, selectedPlate]);

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
    <main className="relative z-10">
      {/* ── Content ── */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-end"
        >
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-orange-400/80">
              Select Building
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-white md:text-4xl">
              Smart Parking Lots
            </h1>
            <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-slate-400">
              Check floors, available slots, and supported vehicles. Select your vehicle to book.
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
              placeholder="Search by name, code, or address"
              className="h-12 w-full rounded-2xl border border-white/10 bg-slate-900/30 pl-11 pr-4 text-sm font-semibold text-white outline-none transition placeholder:text-slate-500 focus:border-orange-500 focus:shadow-[0_0_20px_rgba(249,115,22,0.15)]"
            />
          </label>
        </motion.div>

        {isLoading ? (
          <div className="flex min-h-[360px] items-center justify-center rounded-3xl border border-white/[0.06] bg-slate-900/40 backdrop-blur-md">
            <div className="flex items-center gap-3 text-sm font-bold text-slate-400 animate-pulse">
              <Loader2 size={18} className="animate-spin text-orange-400" />
              Loading buildings information...
            </div>
          </div>
        ) : buildings.length === 0 ? (
          <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-6 text-sm font-semibold text-rose-300">
            No buildings found. Please try again later.
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
                <div className="rounded-3xl border border-white/[0.06] bg-slate-900/40 backdrop-blur-md p-8 text-center text-sm font-semibold text-slate-500">
                  No matching buildings found.
                </div>
              )}
            </div>

            {/* ── Detail Panel ── */}
            {selectedBuilding && (
              <aside className="rounded-3xl border border-white/[0.06] bg-slate-900/40 backdrop-blur-md p-6 shadow-2xl lg:sticky lg:top-6 lg:self-start">
                {/* Header */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-cyan-400/80">
                      {selectedBuilding.code || 'BUILDING'}
                    </p>
                    <h2 className="mt-2 text-2xl font-black text-white">{selectedBuilding.name}</h2>
                    <p className="mt-2 flex items-start gap-2 text-sm font-semibold leading-relaxed text-slate-400">
                      <MapPin size={16} className="mt-0.5 shrink-0 text-orange-400/70" />
                      <span>{addressText(selectedBuilding)}</span>
                    </p>
                  </div>
                  <StatusBadge open={isBuildingOpen(selectedBuilding)} />
                </div>

                {/* Stats Grid */}
                <div className="mt-6 grid grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.02] to-transparent p-4 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.01]">
                    <Layers size={18} className="text-cyan-400/80" />
                    <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Floors</p>
                    <p className="mt-1 text-xl font-black text-white">
                      {detailLoading ? '…' : floorCount}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-emerald-500/10 bg-gradient-to-br from-emerald-500/5 to-transparent p-4 transition-all duration-300 hover:border-emerald-500/20 hover:bg-emerald-500/[0.02]">
                    <SquareParking size={18} className="text-emerald-400/80" />
                    <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Available</p>
                    <p className="mt-1 text-xl font-black text-emerald-400 shadow-emerald-400/10">
                      {detailLoading ? '…' : availableSlots}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.02] to-transparent p-4 transition-all duration-300 hover:border-white/10 hover:bg-white/[0.01]">
                    <Building2 size={18} className="text-orange-400/80" />
                    <p className="mt-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Slots</p>
                    <p className="mt-1 text-xl font-black text-white">
                      {detailLoading ? '…' : totalSlots}
                    </p>
                  </div>
                </div>

                {/* Vehicle Types */}
                <div className="mt-5 rounded-2xl border border-white/[0.06] bg-slate-900/40 backdrop-blur-md p-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Supported Vehicles</p>
                  {detailLoading ? (
                    <p className="mt-2 text-sm font-semibold text-slate-500 animate-pulse">Loading...</p>
                  ) : (detail?.vehicleTypes.length ?? 0) > 0 ? (
                    <div className="mt-2.5 flex flex-wrap gap-2">
                      {detail!.vehicleTypes.map((vt) => {
                        const isBike = isTwoWheelCategory(vt.category);
                        return (
                          <span
                            key={vt._id}
                            className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-all ${
                              isBike
                                ? 'border-purple-500/15 bg-purple-500/5 text-purple-300'
                                : 'border-cyan-500/15 bg-cyan-500/5 text-cyan-300'
                            }`}
                          >
                            {isBike ? (
                              <Bike size={12} className="text-purple-300" />
                            ) : (
                              <Car size={12} className="text-cyan-300" />
                            )}
                            {vt.name}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-2 text-xs font-semibold text-slate-500">Updating...</p>
                  )}
                </div>

                {/* Vehicle / Plate Dropdown */}
                <div className="mt-5">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Select Your Vehicle</p>
                  <VehicleDropdown
                    vehicles={compatibleVehicles}
                    categories={categories}
                    selectedPlate={selectedPlate}
                    onSelect={setSelectedPlate}
                  />
                </div>

                {/* CTA Button */}
                <motion.button
                  type="button"
                  disabled={!canProceed}
                  onClick={() =>
                    navigate('/packages/buy', {
                      state: { buildingId: selectedBuilding._id, plateNumber: selectedPlate },
                    })
                  }
                  whileHover={canProceed ? { scale: 1.015 } : {}}
                  whileTap={canProceed ? { scale: 0.985 } : {}}
                  className={`mt-6 flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-black uppercase tracking-wider transition-all duration-300 ${
                    canProceed
                      ? 'bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 shadow-[0_4px_20px_rgba(249,115,22,0.3)] hover:shadow-[0_4px_30px_rgba(249,115,22,0.45)] cursor-pointer'
                      : 'bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700/30 text-slate-500 cursor-not-allowed opacity-50 shadow-none'
                  }`}
                >
                  <ShieldCheck size={16} />
                  View slots to book
                </motion.button>
              </aside>
            )}
          </div>
        )}
      </section>
    </main>
  );
}
