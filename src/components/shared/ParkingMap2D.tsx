import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Car, Bike, Lock } from 'lucide-react';

export interface ParkingSlot {
  code: string;
  status: 'available' | 'unavailable' | 'reserved';
  vehicleType?: 'car' | 'motorcycle';
  plateNumber?: string;
  floorCode?: string;
}

export interface ParkingMap2DProps {
  slots: ParkingSlot[];
  selectedSlot?: string | null;
  activeReservations?: Array<{ slotCode: string; plateNumber: string; vehicleType: 'car' | 'motorcycle' }>;
  unavailableSlots?: string[];
  onSlotClick?: (slotCode: string) => void;
  interactive?: boolean;
}

export function ParkingMap2D({
  slots,
  selectedSlot = null,
  activeReservations = [],
  unavailableSlots = [],
  onSlotClick,
  interactive = false,
}: ParkingMap2DProps) {
  // 1. Group slots by floorCode (default to 'F1' if missing)
  const slotsByFloor = slots.reduce((acc, slot) => {
    const floor = slot.floorCode || 'F1';
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(slot);
    return acc;
  }, {} as Record<string, ParkingSlot[]>);

  // 2. Sort floors: Basements (B2, B1) lower than Floors (F1, F2, F3)
  const floors = Object.keys(slotsByFloor).sort((a, b) => {
    const isBaseA = a.startsWith('B');
    const isBaseB = b.startsWith('B');
    const numA = parseInt(a.replace(/^\D+/g, '')) || 0;
    const numB = parseInt(b.replace(/^\D+/g, '')) || 0;

    if (isBaseA && !isBaseB) return -1;
    if (!isBaseA && isBaseB) return 1;
    if (isBaseA && isBaseB) {
      return numB - numA; // B2 below B1
    }
    return numA - numB; // F1 below F2
  });

  // Local state for activeFloor (initializing to match selectedSlot floor or top floor on load)
  const [activeFloor, setActiveFloor] = useState<string>(() => {
    if (selectedSlot) {
      const found = slots.find((s) => s.code === selectedSlot);
      if (found && found.floorCode) return found.floorCode;
    }
    return floors.length > 0 ? floors[floors.length - 1] : 'F1';
  });

  // Auto-select active floor based on selectedSlot or top floor when slots/selectedSlot change
  useEffect(() => {
    if (selectedSlot) {
      const found = slots.find((s) => s.code === selectedSlot);
      if (found && found.floorCode) {
        setActiveFloor(found.floorCode);
      }
    }
  }, [slots, selectedSlot]);

  const getSlotStatus = (slotCode: string) => {
    const activeRes = activeReservations.find((r) => r.slotCode === slotCode);
    if (activeRes) return 'reserved';
    if (unavailableSlots.includes(slotCode)) return 'unavailable';
    const foundSlot = slots.find((s) => s.code === slotCode);
    return foundSlot ? foundSlot.status : 'available';
  };

  const getReservationInfo = (slotCode: string) => {
    const activeRes = activeReservations.find((r) => r.slotCode === slotCode);
    if (activeRes) return activeRes;
    const foundSlot = slots.find((s) => s.code === slotCode);
    if (foundSlot && foundSlot.status === 'reserved') {
      return {
        slotCode,
        plateNumber: foundSlot.plateNumber || '',
        vehicleType: foundSlot.vehicleType || 'car',
      };
    }
    return undefined;
  };

  const getSlotColor = (slotCode: string, isSelected: boolean) => {
    const status = getSlotStatus(slotCode);
    if (isSelected) {
      return 'bg-orange-500/25 border-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.8)]';
    }
    if (status === 'available') {
      return 'bg-emerald-950/20 border-emerald-400/80 text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-300 hover:text-emerald-300 shadow-[0_4px_12px_rgba(5,206,146,0.15)]';
    }
    if (status === 'unavailable') {
      return 'bg-slate-950 border-slate-600 border-dashed text-slate-400 cursor-not-allowed';
    }
    if (status === 'reserved') {
      return 'bg-slate-900 border-slate-700/80 text-slate-400 cursor-not-allowed';
    }
    return 'bg-slate-500';
  };

  // 4. Get active slots
  const activeSlots = slotsByFloor[activeFloor] || [];

  // 5. Partition active slots dynamically into Lane A (Top) and Lane B (Bottom)
  const prefixes = Array.from(new Set(activeSlots.map(s => s.code.charAt(0).toUpperCase())));
  const hasMultipleRows = prefixes.length > 1;

  let rawLaneA: ParkingSlot[] = [];
  let rawLaneB: ParkingSlot[] = [];

  if (hasMultipleRows) {
    const sortedPrefixes = prefixes.sort();
    const prefixA = sortedPrefixes[0];
    
    activeSlots.forEach((slot) => {
      const firstChar = slot.code.charAt(0).toUpperCase();
      if (firstChar === prefixA) {
        rawLaneA.push(slot);
      } else {
        rawLaneB.push(slot);
      }
    });
  } else {
    // Split by odd/even index for single-prefix floors
    const sorted = [...activeSlots].sort((a, b) => {
      const numA = parseInt(a.code.replace(/^\D+/g, '')) || 0;
      const numB = parseInt(b.code.replace(/^\D+/g, '')) || 0;
      return numA - numB;
    });
    sorted.forEach((slot, idx) => {
      if (idx % 2 === 0) {
        rawLaneA.push(slot);
      } else {
        rawLaneB.push(slot);
      }
    });
  }

  const sortLane = (lane: ParkingSlot[]) => {
    return [...lane].sort((a, b) => {
      const numA = parseInt(a.code.replace(/^\D+/g, '')) || 0;
      const numB = parseInt(b.code.replace(/^\D+/g, '')) || 0;
      return numA - numB;
    });
  };

  const laneA = sortLane(rawLaneA);
  const laneB = sortLane(rawLaneB);

  const prefixesA = Array.from(new Set(laneA.map(s => s.code.charAt(0).toUpperCase()))).join(', ');
  const prefixesB = Array.from(new Set(laneB.map(s => s.code.charAt(0).toUpperCase()))).join(', ');

  const renderSlot = (slot: ParkingSlot) => {
    const status = getSlotStatus(slot.code);
    const isSelected = selectedSlot === slot.code;
    const reservation = getReservationInfo(slot.code);
    const isAvailable = status === 'available';

    return (
      <motion.div
        key={slot.code}
        whileHover={
          interactive && isAvailable
            ? { scale: 1.08, y: -2 }
            : {}
        }
        whileTap={
          interactive && isAvailable
            ? { scale: 0.95 }
            : {}
        }
        className="relative"
      >
        {/* Breathing Select Indicator */}
        {isSelected && (
          <motion.div
            animate={{ 
              y: [-10, -18, -10]
            }}
            transition={{ 
              duration: 1.4, 
              repeat: Infinity, 
              ease: 'easeInOut' 
            }}
            className="absolute -top-10 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center pointer-events-none"
          >
            <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-sans font-black text-[8px] px-2 py-0.5 rounded-full border border-orange-300 shadow-[0_0_12px_rgba(249,115,22,0.8)] tracking-wider whitespace-nowrap leading-none">
              BẠN CHỌN
            </div>
            <div className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-t-[4.5px] border-t-orange-500 drop-shadow-[0_1.5px_3px_rgba(249,115,22,0.6)]"></div>
          </motion.div>
        )}

        <button
          type="button"
          onClick={() => {
            if (interactive && isAvailable && onSlotClick) {
              onSlotClick(slot.code);
            }
          }}
          disabled={!isAvailable && !isSelected && interactive}
          className={`
            relative w-14 h-15 rounded-xl border-2 transition-all duration-300
            flex flex-col items-center justify-center font-mono font-black text-xs
            ${getSlotColor(slot.code, isSelected)}
            ${interactive && isAvailable && !isSelected ? 'cursor-pointer' : ''}
          `}
        >
          {/* Slot Code */}
          <span className="text-[11px]">
            {slot.code}
          </span>

          {/* Vehicle Icon for Reserved Slots */}
          {status === 'reserved' && (
            <div className="mt-1 flex items-center justify-center">
              {slot.vehicleType === 'car' ? (
                <Car size={16} className="text-cyan-400" />
              ) : (
                <Bike size={16} className="text-purple-400" />
              )}
            </div>
          )}

          {/* Lock Icon for Unavailable */}
          {status === 'unavailable' && (
            <Lock size={12} className="text-slate-400 mt-1" />
          )}
        </button>
      </motion.div>
    );
  };

  return (
    <div className="w-full bg-slate-950 rounded-3xl p-6 border border-white/5 relative overflow-hidden flex flex-col min-h-[380px]">
      {/* Glow Backdrop Grid & Radial Blobs */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0e1e38_1px,transparent_1px),linear-gradient(to_bottom,#0e1e38_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-30"></div>
      <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-orange-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/3 w-72 h-72 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header Info */}
      <div className="mb-4 text-center z-10">
        <h3 className="text-sm font-black uppercase tracking-widest text-white mb-1">Sơ đồ đỗ xe 2D</h3>
        <p className="text-xs font-semibold text-slate-400">Chọn sàn và nhấn vào ô đỗ để chọn</p>
      </div>

      {/* Floor Selection Tabs */}
      {floors.length > 0 && (
        <div className="mb-6 flex justify-center flex-wrap gap-2.5 z-10 bg-slate-900/40 p-2 rounded-2xl border border-white/5 backdrop-blur-md max-w-md mx-auto w-full">
          {floors.map((floor) => {
            const isActive = floor === activeFloor;
            const floorLabel = floor.toUpperCase().startsWith('TẦNG') || floor.toUpperCase().startsWith('TANG')
              ? `Tầng ${floor.toUpperCase()}`
              : `Tầng ${floor.toUpperCase()}`;
            return (
              <button
                key={floor}
                type="button"
                onClick={() => setActiveFloor(floor)}
                className={`
                  px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 font-mono flex items-center gap-2 shadow-sm
                  ${
                    isActive
                      ? 'bg-orange-500/10 text-orange-400 border border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.35)]'
                      : 'bg-slate-950/80 text-slate-400 border border-white/5 hover:text-white hover:border-orange-500/30 hover:bg-slate-900'
                  }
                `}
              >
                {isActive ? (
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                  </span>
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                )}
                {floorLabel}
              </button>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="mb-6 grid grid-cols-3 gap-3 text-center z-10 max-w-md mx-auto w-full">
        <div className="flex items-center justify-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-lg bg-emerald-950/20 border border-emerald-400/80 shadow-[0_0_6px_rgba(5,206,146,0.15)]"></div>
          <span className="text-[10px] font-bold text-slate-400">Trống</span>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-lg bg-slate-900 border border-slate-700/80"></div>
          <span className="text-[10px] font-bold text-slate-400">Đã giữ</span>
        </div>
        <div className="flex items-center justify-center gap-1.5">
          <div className="w-3.5 h-3.5 rounded-lg bg-slate-950 border border-slate-600 border-dashed"></div>
          <span className="text-[10px] font-bold text-slate-400">Không khả dụng</span>
        </div>
      </div>

      {/* Symmetric Dual-Lane Grid Layout */}
      <div className="space-y-4 z-10 flex-grow py-2">
        {/* LANE A */}
        <div className="border border-white/5 bg-slate-900/30 p-4 rounded-2xl backdrop-blur-md">
          <div className="mb-3 text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
              Dãy {prefixesA || 'A'} (Top Row)
            </span>
          </div>
          <div className="flex justify-center gap-3 flex-wrap">
            {laneA.length > 0 ? (
              laneA.map((slot) => renderSlot(slot))
            ) : (
              <span className="text-[10px] text-slate-600 font-mono italic">Không có ô đỗ ở dãy này</span>
            )}
          </div>
        </div>

        {/* CENTRAL DRIVEWAY */}
        <div 
          className="w-full h-8 bg-slate-950/80 rounded-xl border-y border-dashed border-slate-800/80 flex items-center justify-between px-6 relative select-none pointer-events-none shrink-0"
        >
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t border-dashed border-amber-500/25 h-0"></div>
          <div className="text-cyan-400/40 text-[9px] font-mono tracking-widest uppercase select-none z-10">◀ LỐI VÀO (IN)</div>
          <div className="text-cyan-400/50 text-[9px] font-mono tracking-widest uppercase select-none z-10">ĐƯỜNG DI CHUYỂN ──▶</div>
          <div className="text-cyan-400/40 text-[9px] font-mono tracking-widest uppercase select-none z-10">LỐI RA (OUT) ▶</div>
        </div>

        {/* LANE B */}
        <div className="border border-white/5 bg-slate-900/30 p-4 rounded-2xl backdrop-blur-md">
          <div className="mb-3 text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
              Dãy {prefixesB || 'B'} (Bottom Row)
            </span>
          </div>
          <div className="flex justify-center gap-3 flex-wrap">
            {laneB.length > 0 ? (
              laneB.map((slot) => renderSlot(slot))
            ) : (
              <span className="text-[10px] text-slate-600 font-mono italic">Không có ô đỗ ở dãy này</span>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-6 pt-4 border-t border-white/5 text-center z-10 flex justify-between items-center text-[10px] text-slate-400">
        <span>Tầng hiện tại: <span className="text-orange-400 font-bold font-mono">{activeFloor}</span></span>
        <span>Tổng số ô: <span className="text-white font-black">{slots.length}</span></span>
      </div>
    </div>
  );
}
