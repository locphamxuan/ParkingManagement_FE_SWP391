import { useState } from 'react';
import { Plus, RotateCcw, Zap } from 'lucide-react';
import { AnimatedParkingMap3D } from '@/components/map/AnimatedParkingMap3D';
import type { ParkingSlot } from '@/services/manager/managerApi';

interface Slots3DMapViewProps {
  slotsByFloor: Record<string, ParkingSlot[]>;
  items: ParkingSlot[];
  floorFilter: string;
  onSlotClick: (slot: ParkingSlot) => void;
  onOpenMultiSlot?: (qty?: number) => void;
}

// Bản đồ slot 3D đồng nhất với User role + panel chỉnh góc nhìn & quick batch action.
export function Slots3DMapView({
  slotsByFloor,
  items,
  floorFilter,
  onSlotClick,
  onOpenMultiSlot,
}: Slots3DMapViewProps) {
  const [rx, setRx] = useState(60);
  const [rz, setRz] = useState(-45);

  const displayedSlots = floorFilter ? (slotsByFloor[floorFilter] || []) : items;

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr,300px]">
      {/* 3D Map Viewport (Identical high-fidelity 3D Hologram Map model as User side) */}
      <div className="h-[620px] relative rounded-3xl overflow-hidden shadow-2xl group">
        <AnimatedParkingMap3D
          rotateX={rx}
          rotateZ={rz}
          interactive={true}
          slots={displayedSlots}
          onEditSlot={onSlotClick}
        />

        {/* Quick Batch Creator Overlay Action Bar directly on 3D Map */}
        {onOpenMultiSlot && (
          <div className="absolute top-16 left-6 z-20 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenMultiSlot(5)}
              className="px-3.5 py-2 rounded-xl bg-orange-500/90 border border-orange-400/40 text-slate-950 font-mono text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-lg hover:bg-orange-400 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Plus size={12} className="stroke-[3]" /> +5 Slots
            </button>
            <button
              type="button"
              onClick={() => onOpenMultiSlot(10)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 border border-orange-400/40 text-slate-950 font-mono text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-lg hover:brightness-110 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Zap size={12} className="text-slate-950 fill-slate-950" /> +10 Slots
            </button>
            <button
              type="button"
              onClick={() => onOpenMultiSlot(20)}
              className="px-3.5 py-2 rounded-xl bg-slate-900/80 border border-white/10 text-slate-200 font-mono text-[10px] font-black uppercase tracking-wider backdrop-blur-md shadow-lg hover:bg-slate-800 hover:border-white/20 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              +20 Batch
            </button>
          </div>
        )}
      </div>

      {/* Sci-Fi Right Cockpit Control Panel */}
      <div className="glass-panel-dark rounded-3xl p-6 border border-white/5 shadow-2xl flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-black uppercase tracking-widest text-white font-mono mb-4 flex items-center gap-1.5 pb-2.5 border-b border-white/5">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping" />
            Spatial view
          </h3>

          {/* Cockpit Angle Tilt Controls */}
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">
                <span>Tilt X</span>
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
                <span>Rotate Z</span>
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
              type="button"
              onClick={() => { setRx(60); setRz(-45); }}
              className="w-full py-2.5 rounded-xl border border-white/10 hover:border-orange-500/30 text-white font-mono text-[9px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 hover:bg-slate-950/50 cursor-pointer"
            >
              <RotateCcw size={12} /> Reset View
            </button>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-white/5 space-y-2">
          <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 font-mono mb-2">Status legend</div>
          
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-emerald-500/20">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" /> 
              Available
            </span>
            <span className="font-mono text-emerald-400 font-black">
              {displayedSlots.filter(s => s.status === 'available').length}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-rose-500/20">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" /> 
              Occupied
            </span>
            <span className="font-mono text-rose-400 font-black">
              {displayedSlots.filter(s => s.status === 'occupied').length}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-purple-500/20">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_#a855f7]" /> 
              Reserved
            </span>
            <span className="font-mono text-purple-400 font-black">
              {displayedSlots.filter(s => s.status === 'reserved').length}
            </span>
          </div>

          <div className="flex items-center justify-between text-[10px] font-bold text-slate-300 bg-slate-900/60 p-2.5 rounded-xl border border-amber-500/20">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_#f59e0b]" /> 
              Maintenance
            </span>
            <span className="font-mono text-amber-400 font-black">
              {displayedSlots.filter(s => s.status === 'maintenance').length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
