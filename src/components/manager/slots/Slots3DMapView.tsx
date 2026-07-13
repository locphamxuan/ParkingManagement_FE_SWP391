import { useState } from 'react';
import { Layers, RotateCcw } from 'lucide-react';
import { motion } from 'framer-motion';
import { Slot3DBox } from '@/components/manager/slots/Slot3DBox';
import type { Floor, ParkingSlot, VehicleType } from '@/services/manager/managerApi';

interface Slots3DMapViewProps {
  floors: Floor[];
  slotsByFloor: Record<string, ParkingSlot[]>;
  items: ParkingSlot[];
  floorFilter: string;
  statusFilter: string;
  vehicleTypes: VehicleType[];
  onSlotClick: (slot: ParkingSlot) => void;
}

const LEGEND: { status: ParkingSlot['status']; label: string; swatch: string; count: string }[] = [
  { status: 'available', label: 'Available', swatch: 'bg-emerald-500/20 border-emerald-500/40', count: 'text-emerald-400' },
  { status: 'occupied', label: 'Occupied', swatch: 'bg-red-500/20 border-red-500/40', count: 'text-red-400' },
  { status: 'reserved', label: 'Reserved', swatch: 'bg-purple-500/20 border-purple-500/40', count: 'text-purple-400' },
  { status: 'maintenance', label: 'Maintenance', swatch: 'bg-amber-500/20 border-amber-500/30', count: 'text-amber-400' },
];

// Bản đồ slot 3D dạng chồng tầng + panel chỉnh góc nhìn (rx/rz là state cục bộ của view).
export function Slots3DMapView({
  floors,
  slotsByFloor,
  items,
  floorFilter,
  statusFilter,
  vehicleTypes,
  onSlotClick,
}: Slots3DMapViewProps) {
  const [rx, setRx] = useState(60);
  const [rz, setRz] = useState(-45);

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr,300px]">
      {/* 3D Map Viewport */}
      <div className="h-[620px] relative rounded-3xl border border-orange-500/15 bg-slate-950 shadow-[0_0_60px_rgba(0,0,0,0.9),inset_0_0_30px_rgba(0,0,0,0.6)] overflow-hidden flex items-center justify-center glass-premium cyber-scanline">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.018)_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:14px_14px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(249,115,22,0.07),rgba(168,85,247,0.035)_50%,transparent_75%)] pointer-events-none" />

        <div className="perspective-1000 w-full h-full flex items-center justify-center preserve-3d">
          <motion.div
            style={{
              rotateX: rx,
              rotateZ: rz,
              transformStyle: 'preserve-3d',
            }}
            className="isometric-mesh relative w-[500px] h-[400px] preserve-3d transition-transform duration-200"
          >
            {floors.map((floor, fIdx) => {
              if (floorFilter && floor._id !== floorFilter) return null;

              const floorSlots = slotsByFloor[floor._id] || [];
              // Lọc theo 1 tầng thì hạ tầng đó về mặt đất thay vì treo lơ lửng
              const zOffset = floorFilter ? 0 : (fIdx * 130);

              return (
                <motion.div
                  key={floor._id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: fIdx * 0.06, type: 'spring', stiffness: 120, damping: 18 }}
                  style={{
                    transform: `translateZ(${zOffset}px)`,
                    transformStyle: 'preserve-3d',
                  }}
                  className="absolute inset-0 rounded-3xl border border-cyan-500/25 bg-slate-900/55 shadow-[0_0_30px_rgba(6,182,212,0.08),0_8px_32px_rgba(0,0,0,0.6)] preserve-3d p-6 flex flex-col justify-between overflow-hidden"
                >
                  <div className="absolute inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent pointer-events-none"
                    style={{ top: `${((fIdx % 3) + 1) * 25}%` }}
                  />
                  <div className="flex justify-between items-center mb-4 z-10 preserve-3d" style={{ transform: 'translateZ(15px)' }}>
                    <span className="text-[10px] font-black tracking-widest text-orange-400 uppercase font-mono bg-slate-950/80 px-2.5 py-1 rounded-lg border border-white/5">
                      {(floor.name || `FLOOR ${floor.code}`).toUpperCase()}
                    </span>
                    <span className="text-[9px] font-bold text-slate-500 font-mono">
                      CAPACITY: {floorSlots.filter(s => s.status === 'occupied').length}/{floorSlots.length} SLOTS
                    </span>
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-5 gap-6 my-auto items-center justify-items-center preserve-3d" style={{ transform: 'translateZ(10px)' }}>
                    {floorSlots.length === 0 ? (
                      <div className="col-span-full text-center text-slate-600 text-xs py-10 uppercase tracking-widest font-mono">No slots configured</div>
                    ) : (
                      floorSlots.map((slot) => (
                        <Slot3DBox
                          key={slot._id}
                          slot={slot}
                          onClick={() => onSlotClick(slot)}
                          statusFilter={statusFilter}
                          vehicleTypes={vehicleTypes}
                        />
                      ))
                    )}
                  </div>

                  <div className="text-[8px] text-slate-600 font-black tracking-widest uppercase font-mono text-right preserve-3d mt-4" style={{ transform: 'translateZ(5px)' }}>
                    {(floor.name || floor.code).toUpperCase()} ARCHITECTURE
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        <div className="absolute left-6 top-6 flex flex-col gap-1.5 z-20 pointer-events-none">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-slate-400">
            <Layers size={12} className="text-orange-400" />
            <span>3D Zone Map ({items.length} Slots)</span>
          </div>
        </div>
      </div>

      {/* Cockpit control panel */}
      <div className="glass-premium glow-border-pulse rounded-3xl p-6 shadow-2xl flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-white font-mono mb-4 flex items-center gap-1.5 pb-2.5 border-b border-white/5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
            Spatial View
          </h3>

          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
                <span>X Tilt</span>
                <span className="text-orange-400 font-mono">{rx}°</span>
              </div>
              <input
                type="range"
                min="20"
                max="85"
                value={rx}
                onChange={(e) => setRx(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-orange-500 border border-white/5"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
                <span>Z Rotation</span>
                <span className="text-orange-400 font-mono">{rz}°</span>
              </div>
              <input
                type="range"
                min="-180"
                max="180"
                value={rz}
                onChange={(e) => setRz(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-orange-500 border border-white/5"
              />
            </div>

            <button
              onClick={() => { setRx(60); setRz(-45); }}
              className="w-full py-2.5 rounded-xl border border-white/10 hover:border-orange-500/30 text-white font-mono text-[9px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 hover:bg-slate-950/50"
            >
              <RotateCcw size={12} /> Reset View
            </button>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-white/5 space-y-3">
          <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 font-mono mb-2">Status Legend</div>
          {LEGEND.map((row) => (
            <div key={row.status} className="flex items-center justify-between text-[10px] font-bold text-slate-300 bg-slate-950/40 p-2.5 rounded-xl border border-white/5">
              <span className="flex items-center gap-2"><span className={`w-2.5 h-2.5 rounded border ${row.swatch}`} /> {row.label}</span>
              <span className={`font-mono font-black ${row.count}`}>
                {items.filter(s => s.status === row.status).length}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
