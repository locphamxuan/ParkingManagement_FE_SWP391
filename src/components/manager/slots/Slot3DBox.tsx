import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ParkingSlot, VehicleType } from '@/services/manager/managerApi';

interface Slot3DBoxProps {
  slot: ParkingSlot;
  onClick: () => void;
  statusFilter: string;
  vehicleTypes: VehicleType[];
}

// Khối slot 3D extrude bằng CSS — mỗi mặt là 1 div xoay trong preserve-3d.
export function Slot3DBox({ slot, onClick, statusFilter, vehicleTypes }: Slot3DBoxProps) {
  const [hovered, setHovered] = useState(false);

  const config = {
    available: {
      faceColor: 'bg-emerald-500/25 border-emerald-500/40 text-emerald-300',
      label: 'Available',
      glow: 'shadow-[0_0_14px_rgba(16,185,129,0.25),0_0_4px_rgba(16,185,129,0.1)] hover:shadow-[0_0_28px_rgba(16,185,129,0.6),0_0_8px_rgba(16,185,129,0.3)]'
    },
    occupied: {
      faceColor: 'bg-red-500/25 border-red-500/45 text-red-300',
      label: 'Occupied',
      glow: 'shadow-[0_0_14px_rgba(239,68,68,0.35),0_0_4px_rgba(239,68,68,0.15)] hover:shadow-[0_0_28px_rgba(239,68,68,0.65),0_0_8px_rgba(239,68,68,0.3)]'
    },
    reserved: {
      faceColor: 'bg-purple-500/25 border-purple-500/45 text-purple-300',
      label: 'Reserved',
      glow: 'shadow-[0_0_14px_rgba(168,85,247,0.35),0_0_4px_rgba(168,85,247,0.15)] hover:shadow-[0_0_28px_rgba(168,85,247,0.65),0_0_8px_rgba(168,85,247,0.3)]'
    },
    maintenance: {
      faceColor: 'bg-amber-500/20 border-amber-500/35 text-amber-300 bg-[repeating-linear-gradient(45deg,rgba(245,158,11,0.12),rgba(245,158,11,0.12)_6px,rgba(0,0,0,0.4)_6px,rgba(0,0,0,0.4)_12px)]',
      label: 'Maintenance',
      glow: 'shadow-[0_0_14px_rgba(245,158,11,0.2),0_0_4px_rgba(245,158,11,0.1)] hover:shadow-[0_0_28px_rgba(245,158,11,0.55),0_0_8px_rgba(245,158,11,0.25)]'
    }
  }[slot.status];

  // Slot không khớp filter thì làm mờ thay vì ẩn — giữ nguyên bố cục lưới.
  const isFilteredOut = statusFilter && slot.status !== statusFilter;

  const vtName = useMemo(() => {
    if (!slot.vehicleType) return '— Not fixed —';
    if (typeof slot.vehicleType === 'object') return slot.vehicleType.name;
    const found = vehicleTypes.find(v => v._id === slot.vehicleType);
    return found ? found.name : 'Vehicle Type';
  }, [slot.vehicleType, vehicleTypes]);

  return (
    <div
      role="button"
      tabIndex={0}
      className={`relative cursor-pointer transition-all duration-300 ${isFilteredOut ? 'opacity-25 scale-95 blur-[0.5px]' : 'opacity-100'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        width: '60px',
        height: '40px',
        transformStyle: 'preserve-3d',
      }}
    >
      <div
        className={`box-3d w-full h-full rounded transition-all duration-300 ${config.glow}`}
        style={{
          '--box-w': '60px',
          '--box-d': '40px',
          '--box-h': hovered ? '20px' : '10px',
          transform: hovered ? 'translateZ(10px)' : 'translateZ(0px)',
          transformStyle: 'preserve-3d'
        } as React.CSSProperties}
      >
        <div className={`box-3d-face box-3d-top rounded border-t border-x ${config.faceColor} flex items-center justify-center font-mono text-[9px] font-black uppercase tracking-wider`}>
          {slot.code}
          {slot.status === 'occupied' && (
            <div className="absolute w-5 h-2.5 rounded bg-orange-400/30 border border-orange-400/50 -bottom-0.5 preserve-3d" style={{ transform: 'translateZ(4px)' }} />
          )}
        </div>
        <div className={`box-3d-face box-3d-front border-b border-x ${config.faceColor}`} />
        <div className={`box-3d-face box-3d-right border-y border-r ${config.faceColor}`} />
        <div className={`box-3d-face box-3d-back ${config.faceColor}`} />
        <div className={`box-3d-face box-3d-left ${config.faceColor}`} />
      </div>

      {/* Tooltip glassmorphic — counter-rotate để luôn hướng về camera */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, z: 20 }}
            animate={{ opacity: 1, scale: 1, z: 35 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute z-50 pointer-events-none w-44 glass-panel-dark border border-white/10 rounded-2xl p-3 shadow-2xl"
            style={{
              bottom: '120%',
              left: '50%',
              transform: 'translateX(-50%) translateZ(35px) rotateZ(45deg) rotateX(-60deg)',
              transformOrigin: 'bottom center'
            }}
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-[11px] font-black text-white font-mono">{slot.code}</span>
              <span className={`text-[8px] font-black uppercase font-mono px-1.5 py-0.5 rounded ${
                slot.status === 'available' ? 'bg-emerald-500/10 text-emerald-400' :
                slot.status === 'occupied' ? 'bg-orange-500/10 text-orange-400' :
                slot.status === 'reserved' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
              }`}>
                {config.label}
              </span>
            </div>
            <div className="space-y-1 text-[9px] text-slate-400 font-semibold leading-relaxed">
              <p>Type: <span className="text-white font-black">{vtName}</span></p>
              <p>Reservable: <span className="text-white font-black">{slot.reservable ? 'Yes' : 'Locked'}</span></p>
              {slot.note && <p className="border-t border-white/5 pt-1 mt-1 text-slate-500 italic">Note: {slot.note}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
