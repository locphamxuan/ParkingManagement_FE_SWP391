import { motion } from 'framer-motion';
import { MapPin } from 'lucide-react';
import type { LongTermPackage } from '@/services/user/userApi';

interface SlotPickerPanelProps {
  disabled: boolean;
  selectedBuildingId: string;
  selectedSlot: string | null;
  onOpenSlotModal: () => void;
}

export function SlotPickerPanel({
  disabled,
  selectedBuildingId,
  selectedSlot,
  onOpenSlotModal,
}: SlotPickerPanelProps) {
  return (
    <div className={`glass-panel-white rounded-3xl p-6 transition-all duration-200 relative ${disabled ? 'opacity-50' : ''}`}>
      {disabled && (
        <div className="absolute inset-0 bg-transparent cursor-not-allowed z-20" title="Please select vehicle type before selecting slot." />
      )}
      <div className="flex items-center gap-2 mb-3">
        <MapPin size={16} className="text-cyan-300/70" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/70">Select Slot</span>
      </div>

      <div className="flex items-center gap-3">
        <motion.button
          type="button"
          onClick={onOpenSlotModal}
          disabled={!selectedBuildingId}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-cyan-300/20 bg-cyan-300/5 px-4 py-4 text-sm font-black uppercase tracking-wider text-cyan-200 transition-all hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:border-slate-700 disabled:text-slate-500 disabled:bg-transparent"
        >
          <MapPin size={16} /> Select Slot
        </motion.button>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-center min-w-[100px] shadow-sm">
          <p className="text-[9px] font-bold uppercase text-slate-500">Slot</p>
          <p className="mt-1 font-mono text-xl font-black text-cyan-300">{selectedSlot || '—'}</p>
        </div>
      </div>
    </div>
  );
}

interface PackageInfoPanelProps {
  selectedPkg: LongTermPackage | null;
}

export function PackageInfoPanel({ selectedPkg }: PackageInfoPanelProps) {
  return (
    <div className="glass-panel-white rounded-3xl border border-blue-500/20 bg-blue-500/5 p-6 shadow-lg">
      <p className="text-[11px] text-cyan-200/90">
        Package allows free parking up to <strong>{selectedPkg?.maxHoursPerDay ? `${selectedPkg.maxHoursPerDay}h` : 'according to package'}/day</strong>
        {' '}(excess hours billed at regular hourly rates). You may optionally <strong>reserve a fixed slot</strong> that stays yours
        for the whole package period — otherwise staff will assign an empty slot upon entry.
        Each package is tied to <strong>1 plate</strong>.
      </p>
    </div>
  );
}
