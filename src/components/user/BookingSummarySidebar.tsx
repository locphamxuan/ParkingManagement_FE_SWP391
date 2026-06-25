import { CalendarClock, Bike, Car } from 'lucide-react';
import type { BookingMode, VehicleKind } from '@/pages/user/reservationsHelper';
import { fmtShort, fmtMoney } from '@/pages/user/reservationsHelper';

interface BookingSummarySidebarProps {
  selectedBuildingName?: string;
  mode: BookingMode;
  selectedPkgName?: string;
  selectedVehicleType: VehicleKind | '';
  selectedSlot: string | null;
  selectedPlate: string;
  startDateTime: Date | null;
  endDateTime: Date | null;
  estimatedAmount: number;
}

export function BookingSummarySidebar({
  selectedBuildingName,
  mode,
  selectedPkgName,
  selectedVehicleType,
  selectedSlot,
  selectedPlate,
  startDateTime,
  endDateTime,
  estimatedAmount,
}: BookingSummarySidebarProps) {
  return (
    <div className="lg:sticky lg:top-6 lg:self-start">
      <div className="glass-panel rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <CalendarClock size={16} className="text-orange-300/70" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300/70">
            Tóm tắt đặt chỗ
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-xs">
            <span className="font-bold text-slate-400">Tòa nhà</span>
            <span className="font-black text-white">{selectedBuildingName || '—'}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="font-bold text-slate-400">Chế độ</span>
            <span className="font-black text-white">
              {mode === 'hourly' ? 'Theo giờ' : selectedPkgName || 'Gói dài hạn'}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="font-bold text-slate-400">Loại xe</span>
            <span className="font-black text-white flex items-center gap-1.5">
              {selectedVehicleType === 'motorcycle' ? (
                <>
                  <Bike size={12} className="text-purple-300" /> Xe máy
                </>
              ) : selectedVehicleType === 'car' ? (
                <>
                  <Car size={12} className="text-cyan-300" /> Ô tô
                </>
              ) : (
                '—'
              )}
            </span>
          </div>

          <div className="h-px bg-white/[0.06]" />

          <div className={`grid gap-2 ${mode === 'hourly' ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {mode === 'hourly' && (
              <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 shadow-inner">
                <p className="text-[9px] font-bold uppercase text-slate-500">Ô đỗ</p>
                <p className="mt-1 font-mono text-lg font-black text-orange-300">
                  {selectedSlot || '—'}
                </p>
              </div>
            )}
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 shadow-inner">
              <p className="text-[9px] font-bold uppercase text-slate-500">Biển số</p>
              <p className="mt-1 font-mono text-sm font-black text-cyan-200 truncate">
                {selectedPlate || '—'}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 shadow-inner">
            <p className="text-[9px] font-bold uppercase text-slate-500">Nhận bãi</p>
            <p className="mt-1 text-sm font-black text-white">
              {startDateTime ? fmtShort(startDateTime) : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 shadow-inner">
            <p className="text-[9px] font-bold uppercase text-slate-500">Trả bãi</p>
            <p className="mt-1 text-sm font-black text-white">
              {endDateTime ? fmtShort(endDateTime) : '—'}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-3">
            <span className="text-xs font-bold text-emerald-200">Số tiền</span>
            <span className="font-mono text-sm font-black text-emerald-300">
              {estimatedAmount ? fmtMoney(estimatedAmount) : '—'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
