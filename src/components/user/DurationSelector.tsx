interface DurationSelectorProps {
  hours: number;
  onSelect: (h: number) => void;
  /** Số giờ tối đa mỗi lượt đặt, theo ReservationPolicy.maxDurationHours của building. */
  maxHours?: number;
}

const ALL_HOUR_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 12, 24, 36, 48];

export function DurationSelector({ hours, onSelect, maxHours = 24 }: DurationSelectorProps) {
  const hourOptions = ALL_HOUR_OPTIONS.filter((h) => h <= maxHours);
  return (
    <div className="flex flex-wrap gap-1.5">
      {hourOptions.map((h) => (
        <button
          key={h}
          type="button"
          onClick={() => onSelect(h)}
          className={`rounded-xl px-3 py-2 text-xs font-bold transition-all duration-150 ${
            hours === h
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-[0_0_10px_rgba(249,115,22,0.25)]'
              : 'border border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-cyan-300/25 hover:text-white'
          }`}
        >
          {h} {h === 1 ? 'hour' : 'hours'}
        </button>
      ))}
    </div>
  );
}
