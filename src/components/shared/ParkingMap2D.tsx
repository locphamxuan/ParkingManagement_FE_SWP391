import { motion } from 'framer-motion';
import { Car, Bike, Lock } from 'lucide-react';

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
  // Group slots by row (A, B, C, etc.)
  const slotsByRow = slots.reduce((acc, slot) => {
    const row = slot.code.charAt(0);
    if (!acc[row]) acc[row] = [];
    acc[row].push(slot);
    return acc;
  }, {} as Record<string, ParkingSlot[]>);

  const rows = Object.keys(slotsByRow).sort();

  const getDetailedStatus = (slotCode: string): SlotDetailedStatus => {
    if (selectedSlot === slotCode) return 'selected';
    if (maintenanceSlots.includes(slotCode)) return 'maintenance';
    if (unsupportedSlots.includes(slotCode)) return 'unsupported';
    if (activeReservations.some((r) => r.slotCode === slotCode)) return 'reserved';
    if (unavailableSlots.includes(slotCode)) return 'occupied';
    return 'available';
  };

  const getReservationInfo = (slotCode: string) => {
    return activeReservations.find((r) => r.slotCode === slotCode);
  };

  const getStatusLabel = (status: SlotDetailedStatus): string => {
    switch (status) {
      case 'available':
        return 'Trống';
      case 'selected':
        return 'Đang chọn';
      case 'reserved':
        return 'Đã giữ';
      case 'occupied':
        return 'Đang sử dụng';
      case 'maintenance':
        return 'Bảo trì';
      case 'unsupported':
        return 'Không phù hợp';
      default:
        return 'Không xác định';
    }
  };

  const getSlotColor = (slotCode: string, status: SlotDetailedStatus) => {
    if (status === 'selected') {
      return 'bg-orange-300 border-orange-100 text-slate-950 shadow-[0_16px_36px_rgba(253,186,116,0.22)] ring-2 ring-orange-100/30';
    }
    if (status === 'available') {
      return 'bg-emerald-400 border-emerald-100/80 hover:bg-emerald-300 hover:shadow-[0_16px_34px_rgba(52,211,153,0.16)]';
    }
    if (status === 'reserved') {
      return 'bg-amber-400 border-amber-100/80';
    }
    if (status === 'occupied') {
      return 'bg-rose-500 border-rose-400/60 cursor-not-allowed';
    }
    if (status === 'maintenance') {
      return 'bg-slate-600 border-slate-500/60 cursor-not-allowed';
    }
    if (status === 'unsupported') {
      return 'bg-slate-700 border-slate-600/60 cursor-not-allowed';
    }
    return 'bg-slate-500';
  };

  return (
    <div className="w-full rounded-3xl border border-slate-800 bg-[#0b111d] p-4 sm:p-5">
      {/* Title */}
      <div className="mb-5 text-center">
        <h3 className="text-sm font-black uppercase tracking-widest text-white mb-2">Sơ đồ đỗ xe</h3>
        <p className="text-xs font-semibold text-slate-400">Nhấn vào ô để chọn</p>
      </div>

      {/* Legend - Improved layout */}
      <div className="mb-6 grid grid-cols-2 gap-2 text-center sm:grid-cols-3 lg:grid-cols-6">
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="h-3 w-3 rounded bg-emerald-500 ring-2 ring-emerald-300/25"></div>
          <span className="text-[10px] font-semibold text-slate-400">Trống</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="h-3 w-3 rounded bg-orange-500 ring-2 ring-orange-300/25"></div>
          <span className="text-[10px] font-semibold text-slate-400">Đang chọn</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="h-3 w-3 rounded bg-amber-500 ring-2 ring-amber-300/25"></div>
          <span className="text-[10px] font-semibold text-slate-400">Đã giữ</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="h-3 w-3 rounded bg-rose-500 ring-2 ring-rose-300/25"></div>
          <span className="text-[10px] font-semibold text-slate-400">Đang sử dụng</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="h-3 w-3 rounded bg-slate-600 ring-2 ring-slate-500/25"></div>
          <span className="text-[10px] font-semibold text-slate-400">Bảo trì</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-2">
          <div className="h-3 w-3 rounded bg-slate-700 ring-2 ring-slate-600/25"></div>
          <span className="text-[10px] font-semibold text-slate-400">Không phù hợp</span>
        </div>
      </div>

      {/* Parking Grid */}
      <div className="space-y-7">
        {rows.map((row) => (
          <div key={row}>
            {/* Row Label */}
            <div className="mb-3 text-center">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500">Dòng {row}</span>
            </div>

            {/* Slots Row */}
            <div className="flex flex-wrap justify-center gap-2">
              {slotsByRow[row]
                .sort((a, b) => {
                  const numA = parseInt(a.code.slice(1));
                  const numB = parseInt(b.code.slice(1));
                  return numA - numB;
                })
                .map((slot) => {
                  const detailedStatus = getDetailedStatus(slot.code);
                  const isSelected = selectedSlot === slot.code;
                  const reservation = getReservationInfo(slot.code);
                  const isDisabled = detailedStatus !== 'available' && !isSelected;

                  return (
                    <motion.div
                      key={slot.code}
                      whileHover={
                        interactive && detailedStatus === 'available'
                          ? { scale: 1.1, y: -4 }
                          : {}
                      }
                      whileTap={
                        interactive && detailedStatus === 'available'
                          ? { scale: 0.95 }
                          : {}
                      }
                    >
                      <button
                        onClick={() => {
                          if (interactive && detailedStatus === 'available' && onSlotClick) {
                            onSlotClick(slot.code);
                          }
                        }}
                        disabled={isDisabled && interactive}
                        title={`${slot.code} - ${getStatusLabel(detailedStatus)}`}
                        className={`
                          relative h-14 w-14 rounded-2xl border-2 transition-all duration-300 sm:h-16 sm:w-16
                          flex flex-col items-center justify-center font-mono font-bold text-xs
                          ${getSlotColor(slot.code, detailedStatus)}
                          ${interactive && detailedStatus === 'available' && !isSelected ? 'cursor-pointer' : ''}
                          ${isDisabled ? 'opacity-60' : ''}
                        `}
                        >
                        {slot.vehicleType && detailedStatus !== 'selected' && detailedStatus !== 'reserved' ? (
                          <span className="absolute left-1 top-1 rounded bg-slate-950/35 p-0.5">
                            {slot.vehicleType === 'car' ? (
                              <Car size={10} className="text-white" />
                            ) : (
                              <Bike size={10} className="text-white" />
                            )}
                          </span>
                        ) : null}

                        {/* Slot Code */}
                        <span className={`text-sm font-black ${
                          isSelected
                            ? 'text-slate-950'
                            : detailedStatus === 'available'
                            ? 'text-white'
                            : detailedStatus === 'occupied' || detailedStatus === 'maintenance' || detailedStatus === 'unsupported'
                            ? 'text-slate-400'
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
                        {(detailedStatus === 'occupied' || detailedStatus === 'maintenance' || detailedStatus === 'unsupported') && (
                          <Lock size={12} className="text-slate-500 absolute" />
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
