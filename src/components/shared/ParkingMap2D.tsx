import { motion } from 'framer-motion';
import { Car, Bike, Lock } from 'lucide-react';

export interface ParkingSlot {
  code: string;
  status: 'available' | 'unavailable' | 'reserved';
  vehicleType?: 'car' | 'motorcycle';
  plateNumber?: string;
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
  // Group slots by row (A, B, C, etc.)
  const slotsByRow = slots.reduce((acc, slot) => {
    const row = slot.code.charAt(0);
    if (!acc[row]) acc[row] = [];
    acc[row].push(slot);
    return acc;
  }, {} as Record<string, ParkingSlot[]>);

  const rows = Object.keys(slotsByRow).sort();

  const getSlotStatus = (slotCode: string) => {
    const activeRes = activeReservations.find((r) => r.slotCode === slotCode);
    if (activeRes) return 'reserved';
    if (unavailableSlots.includes(slotCode)) return 'unavailable';
    return 'available';
  };

  const getReservationInfo = (slotCode: string) => {
    return activeReservations.find((r) => r.slotCode === slotCode);
  };

  const getSlotColor = (slotCode: string) => {
    const status = getSlotStatus(slotCode);
    if (selectedSlot === slotCode) {
      return 'bg-orange-500 border-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.6)]';
    }
    if (status === 'available') {
      return 'bg-emerald-500 border-emerald-400 hover:shadow-[0_0_15px_rgba(34,197,94,0.4)]';
    }
    if (status === 'unavailable') {
      return 'bg-slate-400 border-slate-500 cursor-not-allowed';
    }
    if (status === 'reserved') {
      return 'bg-amber-500 border-amber-400';
    }
    return 'bg-slate-500';
  };

  return (
    <div className="w-full bg-slate-900 rounded-2xl p-8">
      {/* Title */}
      <div className="mb-6 text-center">
        <h3 className="text-sm font-black uppercase tracking-widest text-white mb-2">Sơ đồ đỗ xe</h3>
        <p className="text-xs font-semibold text-slate-400">Nhấn vào ô để chọn</p>
      </div>

      {/* Legend */}
      <div className="mb-8 grid grid-cols-3 gap-4 text-center">
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 rounded bg-emerald-500 border border-emerald-400"></div>
          <span className="text-xs font-semibold text-slate-400">Trống</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 rounded bg-amber-500 border border-amber-400"></div>
          <span className="text-xs font-semibold text-slate-400">Đã giữ</span>
        </div>
        <div className="flex items-center justify-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-400 border border-slate-500"></div>
          <span className="text-xs font-semibold text-slate-400">Không khả dụng</span>
        </div>
      </div>

      {/* Parking Grid */}
      <div className="space-y-8">
        {rows.map((row) => (
          <div key={row}>
            {/* Row Label */}
            <div className="mb-3 text-center">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">Dòng {row}</span>
            </div>

            {/* Slots Row */}
            <div className="flex justify-center gap-2 flex-wrap">
              {slotsByRow[row]
                .sort((a, b) => {
                  const numA = parseInt(a.code.slice(1));
                  const numB = parseInt(b.code.slice(1));
                  return numA - numB;
                })
                .map((slot) => {
                  const status = getSlotStatus(slot.code);
                  const isSelected = selectedSlot === slot.code;
                  const reservation = getReservationInfo(slot.code);
                  const isDisabled = status !== 'available' && !isSelected;

                  return (
                    <motion.div
                      key={slot.code}
                      whileHover={
                        interactive && status === 'available'
                          ? { scale: 1.1, y: -4 }
                          : {}
                      }
                      whileTap={
                        interactive && status === 'available'
                          ? { scale: 0.95 }
                          : {}
                      }
                    >
                      <button
                        onClick={() => {
                          if (interactive && status === 'available' && onSlotClick) {
                            onSlotClick(slot.code);
                          }
                        }}
                        disabled={isDisabled && interactive}
                        className={`
                          relative w-16 h-16 rounded-lg border-2 transition-all duration-300
                          flex flex-col items-center justify-center font-mono font-bold text-xs
                          ${getSlotColor(slot.code)}
                          ${interactive && status === 'available' && !isSelected ? 'cursor-pointer' : ''}
                          ${isDisabled ? 'opacity-60' : ''}
                        `}
                      >
                        {/* Slot Code */}
                        <span className={`text-sm font-black ${
                          isSelected
                            ? 'text-white'
                            : status === 'available'
                            ? 'text-white'
                            : status === 'unavailable'
                            ? 'text-slate-700'
                            : 'text-white'
                        }`}>
                          {slot.code}
                        </span>

                        {/* Vehicle Icon for Reserved Slots */}
                        {reservation && (
                          <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2 bg-slate-800 rounded px-1.5 py-0.5 flex items-center gap-0.5 border border-slate-600">
                            {reservation.vehicleType === 'car' ? (
                              <Car size={10} className="text-cyan-400" />
                            ) : (
                              <Bike size={10} className="text-purple-400" />
                            )}
                            <span className="text-[9px] font-mono font-bold text-slate-300">
                              {reservation.plateNumber}
                            </span>
                          </div>
                        )}

                        {/* Lock Icon for Unavailable */}
                        {status === 'unavailable' && (
                          <Lock size={12} className="text-slate-600 absolute" />
                        )}
                      </button>
                    </motion.div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info */}
      <div className="mt-8 pt-6 border-t border-slate-700 text-center">
        <p className="text-xs font-semibold text-slate-400">
          Tổng số ô: <span className="text-white font-black">{slots.length}</span>
        </p>
      </div>
    </div>
  );
}
