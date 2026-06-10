import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ─── Types ────────────────────────────────────────────────────────────────── */

export type SlotDetailedStatus =
  | 'available'
  | 'selected'
  | 'reserved'
  | 'occupied'
  | 'maintenance'
  | 'unsupported';

export interface ParkingSlot {
  code: string;
  status: 'available' | 'unavailable' | 'reserved';
  vehicleType?: 'car' | 'motorcycle';
  plateNumber?: string;
  detailedStatus?: SlotDetailedStatus;
}

export interface ParkingMap2DProps {
  slots: ParkingSlot[];
  selectedSlot?: string | null;
  activeReservations?: Array<{ slotCode: string; plateNumber: string; vehicleType: 'car' | 'motorcycle' }>;
  unavailableSlots?: string[];
  maintenanceSlots?: string[];
  unsupportedSlots?: string[];
  onSlotClick?: (slotCode: string) => void;
  interactive?: boolean;
}

/* ─── SVG Icons (inline, no lock icons on occupied) ────────────────────────── */

function CarSvg({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <path d="M5 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM19 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" fill="currentColor" />
      <path d="M3 13h18l-1.5-5h-2L16 5H8L6.5 8h-2L3 13Z" fill="currentColor" opacity=".7" />
      <path d="M3 13v4h3v-1h12v1h3v-4H3Z" fill="currentColor" opacity=".5" />
    </svg>
  );
}

function MotorcycleSvg({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <circle cx="5" cy="16" r="3" fill="currentColor" opacity=".7" />
      <circle cx="19" cy="16" r="3" fill="currentColor" opacity=".7" />
      <path d="M5 16h6l3-8h2l3 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M11 16l1-4h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/* ─── Status Helpers ───────────────────────────────────────────────────────── */

function getDetailedStatus(
  slotCode: string,
  selectedSlot: string | null | undefined,
  maintenanceSlots: string[],
  unsupportedSlots: string[],
  activeReservations: Array<{ slotCode: string }>,
  unavailableSlots: string[],
): SlotDetailedStatus {
  if (selectedSlot === slotCode) return 'selected';
  if (maintenanceSlots.includes(slotCode)) return 'maintenance';
  if (unsupportedSlots.includes(slotCode)) return 'unsupported';
  if (activeReservations.some((r) => r.slotCode === slotCode)) return 'reserved';
  if (unavailableSlots.includes(slotCode)) return 'occupied';
  return 'available';
}

function slotBg(status: SlotDetailedStatus): string {
  switch (status) {
    case 'selected':
      return 'bg-orange-400 border-orange-200 shadow-[0_0_20px_rgba(251,191,36,0.3)] ring-2 ring-orange-200/30';
    case 'available':
      return 'bg-emerald-500/90 border-emerald-300/50 hover:bg-emerald-400 hover:shadow-[0_0_18px_rgba(52,211,153,0.2)]';
    case 'reserved':
      return 'bg-amber-500/80 border-amber-300/40';
    case 'occupied':
      return 'bg-slate-600/60 border-slate-500/30';
    case 'maintenance':
      return 'bg-slate-700/60 border-slate-600/30';
    case 'unsupported':
      return 'bg-slate-800/60 border-slate-700/30';
  }
}

function slotTextColor(status: SlotDetailedStatus): string {
  if (status === 'selected') return 'text-slate-950';
  if (status === 'available') return 'text-white';
  return 'text-slate-400';
}

/* ─── Slot Cell ────────────────────────────────────────────────────────────── */

function SlotCell({
  slot,
  status,
  interactive,
  onClick,
  is3D,
}: {
  slot: ParkingSlot;
  status: SlotDetailedStatus;
  interactive: boolean;
  onClick: () => void;
  is3D: boolean;
}) {
  const isClickable = interactive && status === 'available';
  const isOccupied = status === 'occupied' || status === 'reserved';
  const isSelected = status === 'selected';
  const showVehicleIcon = isOccupied && slot.vehicleType;

  return (
    <motion.button
      type="button"
      onClick={isClickable || isSelected ? onClick : undefined}
      disabled={!isClickable && !isSelected}
      whileHover={isClickable ? { scale: 1.08, y: -3 } : {}}
      whileTap={isClickable ? { scale: 0.95 } : {}}
      title={`${slot.code} — ${status === 'available' ? 'Trống' : status === 'selected' ? 'Đang chọn' : status === 'occupied' ? 'Đang sử dụng' : status === 'reserved' ? 'Đã giữ' : status === 'maintenance' ? 'Bảo trì' : 'Không phù hợp'}`}
      className={`
        relative flex flex-col items-center justify-center rounded-xl border-2 transition-all duration-200
        ${is3D ? 'h-12 w-14 sm:h-14 sm:w-16' : 'h-14 w-14 sm:h-16 sm:w-16'}
        ${slotBg(status)}
        ${isClickable ? 'cursor-pointer' : !isSelected ? 'cursor-default' : 'cursor-pointer'}
        ${!isClickable && !isSelected ? 'opacity-55' : ''}
      `}
    >
      {/* Vehicle Icon for occupied/reserved */}
      {showVehicleIcon ? (
        <div className="flex flex-col items-center gap-0.5">
          {slot.vehicleType === 'car' ? (
            <CarSvg className="h-5 w-5 text-slate-300/80" />
          ) : (
            <MotorcycleSvg className="h-5 w-5 text-slate-300/80" />
          )}
          <span className={`text-[9px] font-bold ${slotTextColor(status)}`}>{slot.code}</span>
        </div>
      ) : (
        <span className={`text-sm font-black ${slotTextColor(status)}`}>{slot.code}</span>
      )}

      {/* Vehicle type badge for available slots */}
      {status === 'available' && slot.vehicleType && (
        <span className="absolute right-0.5 top-0.5 rounded bg-black/30 p-0.5">
          {slot.vehicleType === 'car' ? (
            <CarSvg className="h-2.5 w-2.5 text-white/80" />
          ) : (
            <MotorcycleSvg className="h-2.5 w-2.5 text-white/80" />
          )}
        </span>
      )}
    </motion.button>
  );
}

/* ─── Row Component (with aisle split) ─────────────────────────────────────── */

function ParkingRow({
  rowLabel,
  slots,
  selectedSlot,
  maintenanceSlots,
  unsupportedSlots,
  activeReservations,
  unavailableSlots,
  interactive,
  onSlotClick,
  is3D,
}: {
  rowLabel: string;
  slots: ParkingSlot[];
  selectedSlot: string | null | undefined;
  maintenanceSlots: string[];
  unsupportedSlots: string[];
  activeReservations: Array<{ slotCode: string; plateNumber: string; vehicleType: 'car' | 'motorcycle' }>;
  unavailableSlots: string[];
  interactive: boolean;
  onSlotClick?: (code: string) => void;
  is3D: boolean;
}) {
  const sorted = [...slots].sort((a, b) => {
    const numA = parseInt(a.code.replace(/[^0-9]/g, '')) || 0;
    const numB = parseInt(b.code.replace(/[^0-9]/g, '')) || 0;
    return numA - numB;
  });

  // Split into two halves for the aisle
  const mid = Math.ceil(sorted.length / 2);
  const leftSide = sorted.slice(0, mid);
  const rightSide = sorted.slice(mid);

  const renderSlot = (slot: ParkingSlot) => {
    const status = getDetailedStatus(slot.code, selectedSlot, maintenanceSlots, unsupportedSlots, activeReservations, unavailableSlots);
    return (
      <SlotCell
        key={slot.code}
        slot={slot}
        status={status}
        interactive={interactive}
        onClick={() => onSlotClick?.(slot.code)}
        is3D={is3D}
      />
    );
  };

  return (
    <div className="flex items-center gap-2 sm:gap-3">
      {/* Row Label */}
      <span className="w-8 shrink-0 text-right text-[10px] font-black uppercase tracking-wider text-slate-500">
        {rowLabel}
      </span>

      {/* Left slots */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {leftSide.map(renderSlot)}
      </div>

      {/* Central Aisle */}
      <div className="flex shrink-0 flex-col items-center gap-0.5 px-1 sm:px-3">
        <div className="h-8 w-0.5 rounded-full bg-amber-400/20" />
        <span className="text-[7px] font-bold uppercase tracking-widest text-amber-300/40 [writing-mode:vertical-rl]">
          Lối đi
        </span>
        <div className="h-8 w-0.5 rounded-full bg-amber-400/20" />
      </div>

      {/* Right slots */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {rightSide.map(renderSlot)}
      </div>

      {/* Row Label (right) */}
      <span className="w-8 shrink-0 text-left text-[10px] font-black uppercase tracking-wider text-slate-500">
        {rowLabel}
      </span>
    </div>
  );
}

/* ─── Legend ────────────────────────────────────────────────────────────────── */

const LEGEND = [
  { color: 'bg-emerald-500', label: 'Trống', ring: 'ring-emerald-300/25' },
  { color: 'bg-orange-400', label: 'Đang chọn', ring: 'ring-orange-300/25' },
  { color: 'bg-amber-500', label: 'Đã giữ', ring: 'ring-amber-300/25' },
  { color: 'bg-slate-600', label: 'Đang sử dụng', ring: 'ring-slate-500/25' },
  { color: 'bg-slate-700', label: 'Bảo trì', ring: 'ring-slate-600/25' },
];

function Legend() {
  return (
    <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
      {LEGEND.map(({ color, label, ring }) => (
        <div key={label} className="flex items-center gap-1.5">
          <div className={`h-2.5 w-2.5 rounded ${color} ring-2 ${ring}`} />
          <span className="text-[10px] font-semibold text-slate-400">{label}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Entry / Exit Markers ─────────────────────────────────────────────────── */

function EntryExitMarkers() {
  return (
    <div className="flex items-center justify-between px-4 py-2">
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
          <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M1 8h12M9 4l4 4-4 4" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400/70">Lối vào</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-wider text-rose-400/70">Lối ra</span>
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-500/15 text-rose-400">
          <svg viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
            <path d="M15 8H3M7 4l-4 4 4 4" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ─── View Toggle ──────────────────────────────────────────────────────────── */

function ViewToggle({ view, onChange }: { view: '2D' | '3D'; onChange: (v: '2D' | '3D') => void }) {
  return (
    <div className="inline-flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
      {(['2D', '3D'] as const).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`relative rounded-lg px-4 py-1.5 text-xs font-black uppercase tracking-wider transition-all duration-200 ${
            view === v
              ? 'bg-orange-400 text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.3)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

/* ─── Main Component ───────────────────────────────────────────────────────── */

export function ParkingMap2D({
  slots,
  selectedSlot = null,
  activeReservations = [],
  unavailableSlots = [],
  maintenanceSlots = [],
  unsupportedSlots = [],
  onSlotClick,
  interactive = false,
}: ParkingMap2DProps) {
  const [view, setView] = useState<'2D' | '3D'>('2D');
  const [rotateX, setRotateX] = useState(45);
  const [rotateZ, setRotateZ] = useState(-10);
  const [zoom, setZoom] = useState(0.85);

  const reset3D = () => {
    setRotateX(45);
    setRotateZ(-10);
    setZoom(0.85);
  };

  // Group slots by row letter
  const slotsByRow = useMemo(() => {
    const grouped: Record<string, ParkingSlot[]> = {};
    slots.forEach((slot) => {
      const row = slot.code.charAt(0);
      if (!grouped[row]) grouped[row] = [];
      grouped[row].push(slot);
    });
    return grouped;
  }, [slots]);

  const rows = useMemo(() => Object.keys(slotsByRow).sort(), [slotsByRow]);

  const availableCount = useMemo(() => {
    const unavSet = new Set([...unavailableSlots, ...maintenanceSlots, ...unsupportedSlots]);
    const reservedSet = new Set(activeReservations.map((r) => r.slotCode));
    return slots.filter((s) => !unavSet.has(s.code) && !reservedSet.has(s.code) && s.status !== 'unavailable').length;
  }, [slots, unavailableSlots, maintenanceSlots, unsupportedSlots, activeReservations]);

  return (
    <div className="w-full rounded-3xl border border-slate-800/80 bg-[#080d17] p-4 sm:p-5">
      {/* Header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-white">Sơ đồ đỗ xe</h3>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            {interactive ? 'Nhấn vào ô xanh để chọn' : 'Chế độ xem'}
            {' · '}
            <span className="text-emerald-400">{availableCount}</span>
            <span className="text-slate-500">/{slots.length} trống</span>
          </p>
        </div>
        <ViewToggle view={view} onChange={setView} />
      </div>

      {/* Legend */}
      <div className="mb-5">
        <Legend />
      </div>

      {/* 3D Interactive Controls */}
      {view === '3D' && (
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-2xl border border-white/5 bg-slate-900/60 px-4 py-3.5 text-xs mb-5 shadow-inner">
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Độ nghiêng (Tilt):</span>
            <input
              type="range"
              min="20"
              max="80"
              value={rotateX}
              onChange={(e) => setRotateX(Number(e.target.value))}
              className="w-20 accent-orange-500 bg-slate-800 rounded-lg h-1 appearance-none cursor-pointer"
            />
            <span className="font-mono text-slate-300 w-8 text-right">{rotateX}°</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Xoay (Rotate):</span>
            <input
              type="range"
              min="-180"
              max="180"
              value={rotateZ}
              onChange={(e) => setRotateZ(Number(e.target.value))}
              className="w-24 accent-orange-500 bg-slate-800 rounded-lg h-1 appearance-none cursor-pointer"
            />
            <span className="font-mono text-slate-300 w-10 text-right">{rotateZ}°</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Zoom:</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.05).toFixed(2))))}
              className="h-6 w-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs font-black flex items-center justify-center"
            >
              -
            </button>
            <input
              type="range"
              min="0.4"
              max="1.6"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-20 accent-orange-500 bg-slate-800 rounded-lg h-1 appearance-none cursor-pointer"
            />
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.6, Number((z + 0.05).toFixed(2))))}
              className="h-6 w-6 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs font-black flex items-center justify-center"
            >
              +
            </button>
            <span className="font-mono text-slate-300 w-12 text-right">{Math.round(zoom * 100)}%</span>
          </div>
          <button
            type="button"
            onClick={reset3D}
            className="px-3 py-1.5 rounded-xl border border-white/10 hover:border-orange-500/30 text-[9px] font-black uppercase tracking-wider text-slate-300 hover:text-orange-200 transition duration-200"
          >
            Mặc định
          </button>
        </div>
      )}

      {/* Entry marker */}
      <EntryExitMarkers />

      {/* Parking Grid */}
      <AnimatePresence mode="wait">
        {view === '2D' ? (
          <motion.div
            key="view-2d"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-4 py-4"
          >
            {rows.map((row) => (
              <ParkingRow
                key={row}
                rowLabel={row}
                slots={slotsByRow[row]}
                selectedSlot={selectedSlot}
                maintenanceSlots={maintenanceSlots}
                unsupportedSlots={unsupportedSlots}
                activeReservations={activeReservations}
                unavailableSlots={unavailableSlots}
                interactive={interactive}
                onSlotClick={onSlotClick}
                is3D={false}
              />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="view-3d"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-x-auto py-4 select-none"
            style={{
              perspective: '1200px',
            }}
          >
            <div
              className="mx-auto space-y-3 origin-center transition-transform duration-150 ease-out"
              style={{
                transform: `rotateX(${rotateX}deg) rotateZ(${rotateZ}deg) scale(${zoom})`,
                transformStyle: 'preserve-3d',
              }}
            >
              {rows.map((row, idx) => (
                <motion.div
                  key={row}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04, duration: 0.3 }}
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: `translateZ(${idx * 2}px)`,
                  }}
                >
                  <ParkingRow
                    rowLabel={row}
                    slots={slotsByRow[row]}
                    selectedSlot={selectedSlot}
                    maintenanceSlots={maintenanceSlots}
                    unsupportedSlots={unsupportedSlots}
                    activeReservations={activeReservations}
                    unavailableSlots={unavailableSlots}
                    interactive={interactive}
                    onSlotClick={onSlotClick}
                    is3D={true}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exit marker */}
      <EntryExitMarkers />

      {/* Footer */}
      <div className="mt-4 border-t border-slate-800/60 pt-4 text-center">
        <p className="text-xs font-semibold text-slate-500">
          Tổng số ô: <span className="font-black text-white">{slots.length}</span>
          {' · '}
          Đang xem: <span className="font-black text-orange-300">{view}</span>
        </p>
      </div>
    </div>
  );
}
