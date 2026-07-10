import type { ReactNode } from 'react';
import { Package, Timer } from 'lucide-react';
import type { BookingMode } from '@/pages/user/reservationsHelper';

interface ModeTabsProps {
  mode: BookingMode;
  onChange: (mode: BookingMode) => void;
}

export function ModeTabs({ mode, onChange }: ModeTabsProps) {
  const tabs: { key: BookingMode; label: string; icon: ReactNode }[] = [
    { key: 'hourly', label: 'Hourly Pre-booking', icon: <Timer size={14} /> },
    { key: 'package', label: 'Long-term Subscriptions', icon: <Package size={14} /> },
  ];

  return (
    <div className="mb-8 flex items-center gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] backdrop-blur-md p-1.5 max-w-md md:max-w-lg w-full mx-auto shadow-xl">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onChange(tab.key)}
          className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-xs font-black uppercase tracking-wider transition-all duration-200 btn-sand ${mode === tab.key
            ? 'btn-sand-orange btn-sand-active text-slate-950 font-black'
            : 'btn-sand-dark text-slate-400'
            }`}
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            {tab.icon} {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}
