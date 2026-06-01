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

export interface ParkingMap3DProps {
  slots: ParkingSlot[];
  selectedSlot?: string | null;
  activeReservations?: Array<{ slotCode: string; plateNumber: string; vehicleType: 'car' | 'motorcycle' }>;
  unavailableSlots?: string[];
  onSlotClick?: (slotCode: string) => void;
  interactive?: boolean;
}

// Sleek vector of sports car seen from above (top-down)
const TopDownCar = ({ className = "w-9 h-9" }: { className?: string }) => (
  <svg className={`${className} drop-shadow-[0_4px_6px_rgba(0,0,0,0.6)] select-none pointer-events-none`} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="8" width="40" height="48" rx="8" fill="#000000" opacity="0.5" filter="blur(1px)" />
    <rect x="8" y="14" width="5" height="10" rx="1.5" fill="#0a0f1d" />
    <rect x="51" y="14" width="5" height="10" rx="1.5" fill="#0a0f1d" />
    <rect x="8" y="40" width="5" height="10" rx="1.5" fill="#0a0f1d" />
    <rect x="51" y="40" width="5" height="10" rx="1.5" fill="#0a0f1d" />
    <rect x="12" y="10" width="40" height="44" rx="7" fill="url(#holoCarGrad)" stroke="#0ea5e9" strokeWidth="1" />
    <path d="M17 21C17 19.5 18.5 18 20 18H44C45.5 18 47 19.5 47 21L44 26H20L17 21Z" fill="#38bdf8" opacity="0.85" />
    <path d="M19 41L21 45C21.5 46.2 22.8 47 24 47H40C41.2 47 42.5 46.2 43 45L45 41H19Z" fill="#38bdf8" opacity="0.65" />
    <rect x="19" y="24" width="26" height="16" rx="3" fill="#090d16" stroke="#1e293b" strokeWidth="0.5" />
    <circle cx="17" cy="11" r="2.5" fill="#fef08a" className="animate-pulse" />
    <circle cx="47" cy="11" r="2.5" fill="#fef08a" className="animate-pulse" />
    <rect x="17" y="52" width="5" height="2" fill="#ef4444" />
    <rect x="42" y="52" width="5" height="2" fill="#ef4444" />
    <defs>
      <linearGradient id="holoCarGrad" x1="12" y1="10" x2="52" y2="54" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0ea5e9" />
        <stop offset="0.5" stopColor="#0284c7" />
        <stop offset="1" stopColor="#0369a1" />
      </linearGradient>
    </defs>
  </svg>
);

// Sleek vector of motorcycle seen from above (top-down)
const TopDownMotorcycle = ({ className = "w-7 h-7" }: { className?: string }) => (
  <svg className={`${className} drop-shadow-[0_3px_5px_rgba(0,0,0,0.6)] select-none pointer-events-none`} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="25" y="6" width="14" height="52" rx="3" fill="#000000" opacity="0.45" filter="blur(1px)" />
    <rect x="30" y="4" width="4" height="12" rx="1.5" fill="#090f1d" />
    <rect x="30" y="48" width="4" height="12" rx="1.5" fill="#090f1d" />
    <rect x="26" y="16" width="12" height="26" rx="3" fill="#334155" />
    <circle cx="32" cy="23" r="4" fill="#475569" />
    <circle cx="32" cy="32" r="4" fill="#475569" />
    <path d="M23 20C23 17.5 25.5 15.5 32 15.5C38.5 15.5 41 17.5 41 20L36 35C35.5 36.5 34 37.5 32 37.5C30 37.5 28.5 36.5 28 35L23 20Z" fill="url(#holoMotoGrad)" stroke="#c084fc" strokeWidth="0.8" />
    <path d="M18 18L28 20M46 18L36 20" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
    <path d="M28 30C28 28.5 29 27.5 32 27.5C35 27.5 36 28.5 36 30L34 38C34 39 33 39.5 32 39.5C31 39.5 30 39 30 38L28 30Z" fill="#0a0f1d" />
    <defs>
      <linearGradient id="holoMotoGrad" x1="23" y1="15.5" x2="41" y2="37.5" gradientUnits="userSpaceOnUse">
        <stop stopColor="#c084fc" />
        <stop offset="0.5" stopColor="#a855f7" />
        <stop offset="1" stopColor="#7e22ce" />
      </linearGradient>
    </defs>
  </svg>
);

export function ParkingMap3D({
  slots,
  selectedSlot = null,
  activeReservations = [],
  unavailableSlots = [],
  onSlotClick,
  interactive = false,
}: ParkingMap3DProps) {
  // Debug log to ensure real data is flowing correctly
  console.log("=== ParkingMap3D slots received ===", slots);

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
    const numA = parseInt(a.slice(1)) || 0;
    const numB = parseInt(b.slice(1)) || 0;

    if (isBaseA && !isBaseB) return -1;
    if (!isBaseA && isBaseB) return 1;
    if (isBaseA && isBaseB) {
      return numB - numA; // B2 below B1
    }
    return numA - numB; // F1 below F2
  });

  const [activeFloor, setActiveFloor] = useState<string>('');

  // 3. Auto-select active floor based on selectedSlot or top floor
  useEffect(() => {
    if (floors.length > 0) {
      if (selectedSlot) {
        const found = slots.find((s) => s.code === selectedSlot);
        if (found && found.floorCode) {
          setActiveFloor(found.floorCode);
          return;
        }
      }
      // Default to top floor
      setActiveFloor(floors[floors.length - 1]);
    }
  }, [slots, selectedSlot]);

  const getSlotStatus = (slotCode: string) => {
    const activeRes = activeReservations.find((r) => r.slotCode === slotCode);
    if (activeRes) return 'reserved';
    if (unavailableSlots?.includes(slotCode)) return 'unavailable';
    return 'available';
  };

  const getReservationInfo = (slotCode: string) => {
    return activeReservations?.find((r) => r.slotCode === slotCode);
  };

  // 4. Calculate dynamic animations for each floor based on active status
  const getFloorAnimation = (floor: string) => {
    const index = floors.indexOf(floor);
    const isActive = floor === activeFloor;

    // Focused active floor flies up to the top, inactive floors stack beautifully below it
    const zTranslate = isActive ? 110 : index * 24;
    const yTranslate = isActive ? -12 : index * -4;

    return {
      z: zTranslate,
      y: yTranslate,
      opacity: isActive ? 1 : 0.15,
      scale: isActive ? 1.05 : 0.82,
    };
  };

  return (
    <div className="w-full bg-slate-950 rounded-3xl p-6 border border-white/5 relative overflow-hidden flex flex-col md:flex-row gap-6 min-h-[380px]">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0e1e38_1px,transparent_1px),linear-gradient(to_bottom,#0e1e38_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] opacity-40"></div>
      
      <div className="absolute top-1/4 left-1/3 w-72 h-72 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      {/* LEFT: Hologram Controls & Statistics */}
      <div className="flex flex-col gap-4 z-10 w-full md:w-52 shrink-0 bg-slate-900/40 p-4 rounded-2xl border border-white/5 backdrop-blur-md">
        <div>
          <div className="inline-flex items-center gap-1.5 bg-cyan-500/15 px-2.5 py-0.5 rounded-full border border-cyan-500/30 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
            <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400 font-mono">HOLOGRAM 3D STACK</span>
          </div>
          <h3 className="text-xs font-black uppercase text-white font-sans tracking-wide">Điều khiển Tầng</h3>
          <p className="text-[10px] text-slate-400 mt-0.5 leading-relaxed">Chọn sàn để phóng đại tầng và tương tác ô đỗ</p>
        </div>

        {/* Floor Selection Stack Column */}
        <div className="flex flex-row md:flex-col gap-1.5">
          {floors.map((floor) => {
            const isActive = floor === activeFloor;
            return (
              <button
                key={floor}
                type="button"
                onClick={() => setActiveFloor(floor)}
                className={`
                  flex-1 md:flex-initial px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 font-mono flex items-center justify-center md:justify-start gap-2 shadow-sm
                  ${
                    isActive
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 shadow-[0_0_12px_rgba(6,182,212,0.4)] border border-cyan-300'
                      : 'bg-slate-950/80 text-slate-400 border border-white/5 hover:text-white hover:border-cyan-500/30'
                  }
                `}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-slate-950 animate-pulse' : 'bg-slate-600'}`}></span>
                Tầng {floor}
              </button>
            );
          })}
        </div>

        {/* Dynamic Map Statistics */}
        <div className="mt-auto pt-3 border-t border-slate-800 text-[10px] space-y-1 text-slate-400">
          <div className="flex justify-between">
            <span>Tổng ô đỗ:</span>
            <span className="font-bold text-white">{slots.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Tầng hiện tại:</span>
            <span className="font-bold text-cyan-400 font-mono">{activeFloor}</span>
          </div>
        </div>
      </div>

      {/* RIGHT: 3D VIEWPORT */}
      <div style={{ perspective: '1600px' }} className="flex-grow flex items-center justify-center py-6 relative min-h-[280px] overflow-hidden rounded-2xl">
        <div className="absolute bottom-2 right-4 text-[9px] text-slate-500 font-mono tracking-wider select-none z-10 pointer-events-none">
          Perspective Angle: Isometric 60°
        </div>

        {/* 3D Isometric Stack Canvas */}
        <div
          style={{
            transform: 'rotateX(60deg) rotateZ(-45deg)',
            transformStyle: 'preserve-3d',
          }}
          className="w-full max-w-md h-[180px] relative flex items-center justify-center transition-transform duration-500"
        >
          {floors.map((floor) => {
            const slotsInFloor = slotsByFloor[floor] || [];
            const isFloorActive = floor === activeFloor;
            const slotCount = slotsInFloor.length;

            // Compute dynamic slot sizing parameters based on slotCount on this floor
            let slotW = 60;
            let slotH = 64;
            let fontSizeClass = "text-[10px] mb-1";
            let carIconClass = "w-[36px] h-[36px]";
            let motoIconClass = "w-[28px] h-[28px]";
            let lockIconSize = 11;
            let gapClass = "gap-3";
            let rowGapClass = "gap-2";
            let borderClass = "border-2 rounded-xl";
            
            if (slotCount <= 4) {
              // Large display for few slots
              slotW = 84;
              slotH = 92;
              fontSizeClass = "text-[12px] mb-1.5";
              carIconClass = "w-[52px] h-[52px]";
              motoIconClass = "w-[44px] h-[44px]";
              lockIconSize = 16;
              gapClass = "gap-5";
              rowGapClass = "gap-4";
              borderClass = "border-2.5 rounded-2xl";
            } else if (slotCount > 4 && slotCount <= 8) {
              // Standard premium size
              slotW = 64;
              slotH = 72;
              fontSizeClass = "text-[10.5px] mb-1";
              carIconClass = "w-[40px] h-[40px]";
              motoIconClass = "w-[32px] h-[32px]";
              lockIconSize = 12;
              gapClass = "gap-3";
              rowGapClass = "gap-2";
              borderClass = "border-2 rounded-xl";
            } else if (slotCount > 8 && slotCount <= 15) {
              // Compact size for moderate slot density
              slotW = 48;
              slotH = 56;
              fontSizeClass = "text-[9px] mb-0.5";
              carIconClass = "w-[30px] h-[30px]";
              motoIconClass = "w-[24px] h-[24px]";
              lockIconSize = 9;
              gapClass = "gap-2";
              rowGapClass = "gap-1.5";
              borderClass = "border-[1.5px] rounded-lg";
            } else {
              // Micro size for very dense slot floors (e.g. 15+)
              slotW = 36;
              slotH = 44;
              fontSizeClass = "text-[8px] mb-0";
              carIconClass = "w-[22px] h-[22px]";
              motoIconClass = "w-[18px] h-[18px]";
              lockIconSize = 8;
              gapClass = "gap-1";
              rowGapClass = "gap-1";
              borderClass = "border rounded-md";
            }

            const prefixes = Array.from(new Set(slotsInFloor.map(s => s.code.charAt(0).toUpperCase())));
            const hasMultipleRows = prefixes.length > 1;

            let laneA: ParkingSlot[] = [];
            let laneB: ParkingSlot[] = [];

            if (hasMultipleRows) {
              const sortedPrefixes = prefixes.sort();
              const prefixA = sortedPrefixes[0];
              
              slotsInFloor.forEach((slot) => {
                const firstChar = slot.code.charAt(0).toUpperCase();
                if (firstChar === prefixA) {
                  laneA.push(slot);
                } else {
                  laneB.push(slot);
                }
              });
            } else {
              // Split by odd/even index for single-prefix floors
              const sorted = [...slotsInFloor].sort((a, b) => {
                const numA = parseInt(a.code.replace(/^\D+/g, '')) || 0;
                const numB = parseInt(b.code.replace(/^\D+/g, '')) || 0;
                return numA - numB;
              });
              sorted.forEach((slot, idx) => {
                if (idx % 2 === 0) {
                  laneA.push(slot);
                } else {
                  laneB.push(slot);
                }
              });
            }

            const renderSlot = (slot: ParkingSlot) => {
              const status = slot.status;
              const isSelected = selectedSlot === slot.code;
              const isDisabled = status !== 'available' && !isSelected;

              if (!isFloorActive) {
                const isSlotReserved = status === 'reserved';
                return (
                  <div
                    key={slot.code}
                    className={`w-12 h-14 rounded-lg border flex items-center justify-center font-mono text-[9px] font-bold select-none pointer-events-none transition-all duration-300 ${
                      isSlotReserved
                        ? 'border-purple-500/20 bg-purple-500/5 text-purple-400/35'
                        : status === 'unavailable'
                        ? 'border-slate-800 bg-transparent text-slate-800'
                        : 'border-cyan-500/15 bg-transparent text-cyan-400/30'
                    }`}
                    style={{ transformStyle: 'preserve-3d' }}
                  >
                    {slot.code}
                  </div>
                );
              }

              let slotClasses = `relative ${borderClass} transition-all duration-300 flex flex-col items-center justify-center font-mono font-bold ${fontSizeClass} `;
              
              if (isSelected) {
                slotClasses += "bg-orange-500/25 border-orange-500 text-white shadow-[0_0_20px_rgba(249,115,22,0.8),0_4px_0_#f97316] z-20 cursor-pointer";
              } else if (status === 'available') {
                slotClasses += "bg-emerald-950/20 border-emerald-400/80 text-white shadow-[0_4px_0_#05ce92,0_6px_12px_rgba(5,206,146,0.15)] ";
                if (interactive) slotClasses += "hover:bg-emerald-500/25 hover:border-emerald-300 hover:shadow-[0_6px_0_#10b981,0_10px_18px_rgba(16,185,129,0.35)] cursor-pointer";
              } else if (status === 'unavailable') {
                slotClasses += "bg-slate-950/90 border-slate-700/60 text-slate-500/70 shadow-[0_2px_0_#0f172a] cursor-not-allowed border-dashed";
              } else if (status === 'reserved') {
                slotClasses += "bg-slate-900 border-slate-700/80 text-slate-500 shadow-[0_4px_0_#334155,0_8px_16px_rgba(0,0,0,0.55)] cursor-not-allowed";
              }

              return (
                <motion.div
                  key={slot.code}
                  role="button"
                  tabIndex={isDisabled ? -1 : 0}
                  onClick={() => {
                    if (interactive && status === 'available' && onSlotClick) {
                      onSlotClick(slot.code);
                    }
                  }}
                  className={slotClasses}
                  style={{ 
                    width: `${slotW}px`, 
                    height: `${slotH}px`, 
                    transformStyle: 'preserve-3d' 
                  }}
                  whileHover={
                    interactive && status === 'available'
                      ? { translateZ: 8, y: -3, x: -3 }
                      : {}
                  }
                  whileTap={
                    interactive && status === 'available'
                      ? { scale: 0.95, translateZ: 2 }
                      : {}
                  }
                >
                  {isSelected && (
                    <motion.div
                      style={{ transformStyle: 'preserve-3d' }}
                      animate={{ 
                        y: [-10, -18, -10],
                        z: [25, 35, 25]
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

                  <span 
                    style={{ transform: 'translateZ(5px)' }}
                    className="font-black select-none pointer-events-none"
                  >
                    {slot.code}
                  </span>

                  {status === 'reserved' && (
                    <div style={{ transform: 'translateZ(6px)' }} className="flex items-center justify-center">
                      {slot.vehicleType === 'car' ? (
                        <TopDownCar className={carIconClass} />
                      ) : (
                        <TopDownMotorcycle className={motoIconClass} />
                      )}
                    </div>
                  )}

                  {status === 'unavailable' && (
                    <div style={{ transform: 'translateZ(4px)' }} className="flex items-center justify-center">
                      <Lock size={lockIconSize} className="text-slate-400 animate-pulse" />
                    </div>
                  )}

                  {status === 'reserved' && slot.plateNumber && (
                    <div 
                      style={{ transform: 'translateZ(10px)' }} 
                      className="absolute -bottom-3.5 left-1/2 transform -translate-x-1/2 bg-slate-950 border border-slate-800 rounded px-1 py-0.5 flex items-center gap-0.5 z-20 shadow-md whitespace-nowrap"
                    >
                      {slot.vehicleType === 'car' ? (
                        <Car size={7} className="text-cyan-400" />
                      ) : (
                        <Bike size={7} className="text-purple-400" />
                      )}
                      <span className="text-[7px] font-mono font-bold text-slate-300 leading-none">
                        {slot.plateNumber}
                      </span>
                    </div>
                  )}
                </motion.div>
              );
            };

            return (
              <motion.div
                key={floor}
                style={{ transformStyle: 'preserve-3d' }}
                animate={getFloorAnimation(floor)}
                transition={{ type: 'spring', stiffness: 90, damping: 15 }}
                className={`absolute w-[380px] h-[220px] p-6 rounded-3xl transition-all duration-300 border pointer-events-auto ${
                  isFloorActive
                    ? 'bg-[#0f172a] border-slate-700/80 shadow-[0_25px_50px_rgba(0,0,0,0.8)] z-30'
                    : 'bg-cyan-500/5 border-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.02)] cursor-pointer z-10 hover:border-cyan-500/30'
                }`}
                onClick={() => {
                  if (!isFloorActive) setActiveFloor(floor);
                }}
              >
                <div
                  style={{ transform: 'translateZ(15px)' }}
                  className={`absolute -top-3.5 -left-3.5 px-3 py-1 rounded-xl text-[9px] font-black uppercase font-mono tracking-widest shadow-md border ${
                    isFloorActive
                      ? 'bg-slate-950 border-cyan-500/55 text-cyan-400'
                      : 'bg-slate-950/80 border-slate-800 text-slate-500'
                  }`}
                >
                  TẦNG {floor} {isFloorActive ? '• ACTIVE' : ''}
                </div>

                <div className="flex flex-col justify-between items-center h-full w-full py-1.5" style={{ transformStyle: 'preserve-3d' }}>
                  
                  {/* LANE A (Top Row) */}
                  <div className={`flex justify-center items-center flex-wrap ${gapClass}`} style={{ transformStyle: 'preserve-3d' }}>
                    {laneA.length > 0 ? (
                      laneA.map((slot) => renderSlot(slot))
                    ) : (
                      <div className="h-[40px] flex items-center justify-center text-[8px] text-slate-600 font-mono tracking-widest uppercase select-none">
                        Lane Empty
                      </div>
                    )}
                  </div>

                  {/* CENTRAL DRIVEWAY */}
                  {isFloorActive && (
                    <div 
                      style={{ transform: 'translateZ(1px)' }}
                      className="w-[90%] h-[24px] bg-slate-950/70 rounded-md border-y border-dashed border-slate-800/80 flex items-center justify-between px-6 relative my-1 select-none pointer-events-none shrink-0"
                    >
                      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t border-dashed border-amber-500/25 h-0"></div>
                      <div className="text-cyan-500/20 text-[8px] font-mono tracking-widest uppercase select-none">◀ IN</div>
                      <div className="text-cyan-500/30 text-[8px] font-mono tracking-widest uppercase select-none">DRIVEWAY ──▶</div>
                      <div className="text-cyan-500/20 text-[8px] font-mono tracking-widest uppercase select-none">OUT ▶</div>
                    </div>
                  )}

                  {/* LANE B (Bottom Row) */}
                  <div className={`flex justify-center items-center flex-wrap ${gapClass}`} style={{ transformStyle: 'preserve-3d' }}>
                    {laneB.length > 0 ? (
                      laneB.map((slot) => renderSlot(slot))
                    ) : (
                      <div className="h-[40px] flex items-center justify-center text-[8px] text-slate-600 font-mono tracking-widest uppercase select-none">
                        Lane Empty
                      </div>
                    )}
                  </div>

                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
