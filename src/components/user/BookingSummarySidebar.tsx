import { CalendarClock, Bike, Car } from 'lucide-react';
import type { BookingMode, VehicleKind } from '@/pages/user/packagePurchaseHelper';
import { fmtShort, fmtMoney } from '@/pages/user/packagePurchaseHelper';

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
  /** Số tiền cọc thật do BE tính (chỉ áp dụng chế độ hourly). */
  depositAmount?: number;
  depositPercent?: number;
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
  depositAmount,
  depositPercent,
}: BookingSummarySidebarProps) {
  return (
    <div className="lg:sticky lg:top-6 lg:self-start">
      <div className="glass-panel-white rounded-3xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <CalendarClock size={16} className="text-orange-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300/70">
            Booking Summary
          </span>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-xs">
            <span className="font-bold text-slate-400">Building</span>
            <span className="font-black text-white">{selectedBuildingName || '—'}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="font-bold text-slate-400">Mode</span>
            <span className="font-black text-white">
              {mode === 'hourly' ? 'Hourly' : selectedPkgName || 'Long-term'}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="font-bold text-slate-400">Vehicle Type</span>
            <span className="font-black text-white flex items-center gap-1.5">
              {selectedVehicleType === 'motorcycle' ? (
                <>
                  <Bike size={12} className="text-purple-300" /> Motorcycle
                </>
              ) : selectedVehicleType === 'car' ? (
                <>
                  <Car size={12} className="text-cyan-300" /> Car
                </>
              ) : (
                '—'
              )}
            </span>
          </div>

          <div className="h-px bg-white/[0.06]" />

          <div className={`grid gap-2 ${selectedSlot ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {selectedSlot && (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 shadow-inner">
                <p className="text-[9px] font-bold uppercase text-slate-500">Slot</p>
                <p className="mt-1 font-mono text-lg font-black text-orange-400">
                  {selectedSlot}
                </p>
              </div>
            )}
            <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 shadow-inner">
              <p className="text-[9px] font-bold uppercase text-slate-500">Plate Number</p>
              <p className="mt-1 font-mono text-sm font-black text-cyan-200 truncate">
                {selectedPlate || '—'}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 shadow-inner">
            <p className="text-[9px] font-bold uppercase text-slate-500">Check-in</p>
            <p className="mt-1 text-sm font-black text-white">
              {startDateTime ? fmtShort(startDateTime) : '—'}
            </p>
          </div>
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-3 shadow-inner">
            <p className="text-[9px] font-bold uppercase text-slate-500">Check-out</p>
            <p className="mt-1 text-sm font-black text-white">
              {endDateTime ? fmtShort(endDateTime) : '—'}
            </p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3">
            <span className="text-xs font-bold text-emerald-400">Amount</span>
            <span className="font-mono text-sm font-black text-emerald-300">
              {estimatedAmount ? fmtMoney(estimatedAmount) : '—'}
            </span>
          </div>
          {mode === 'hourly' && depositAmount != null && (
            <div className="flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 p-3">
              <span className="text-xs font-bold text-amber-400">
                Deposit{depositPercent != null ? ` (${depositPercent}%)` : ''}
              </span>
              <span className="font-mono text-sm font-black text-amber-300">{fmtMoney(depositAmount)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
