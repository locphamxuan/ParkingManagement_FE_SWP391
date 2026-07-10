import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface FreeSlot {
  _id: string;
  code: string;
  floor?: { name?: string; code?: string } | null;
}

interface SlotSelectorProps {
  label: ReactNode;
  hasActivePackage: boolean;
  freeSlots: FreeSlot[];
  selectedSlotId: string;
  onChange: (slotId: string) => void;
  emptyStateText: string;
}

export function SlotSelector({ label, hasActivePackage, freeSlots, selectedSlotId, onChange, emptyStateText }: SlotSelectorProps) {
  return (
    <div className={`rounded-xl border p-3 space-y-2 ${hasActivePackage ? 'border-amber-500/30 bg-amber-500/10' : 'border-sky-500/30 bg-sky-500/10'}`}>
      <p className={`text-[11px] font-bold flex items-center gap-1 ${hasActivePackage ? 'text-amber-300' : 'text-sky-300'}`}>
        <AlertCircle size={12} />
        {label}
      </p>
      <select
        value={selectedSlotId}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Select an available parking slot"
        className={`h-10 w-full rounded-lg border border-white/10 bg-slate-950 px-3 text-sm font-semibold text-white outline-none ${hasActivePackage ? 'focus:border-amber-400/60' : 'focus:border-sky-400/60'}`}
      >
        <option value="">-- Select an available slot --</option>
        {freeSlots.map((s) => (
          <option key={s._id} value={s._id}>
            {s.code}{s.floor?.name || s.floor?.code ? ` · ${s.floor?.name || s.floor?.code}` : ''}
          </option>
        ))}
      </select>
      {freeSlots.length === 0 && <p className="text-[11px] text-slate-400">{emptyStateText}</p>}
    </div>
  );
}
