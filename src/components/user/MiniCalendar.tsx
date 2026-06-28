import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface MiniCalendarProps {
  selectedDate: Date | null;
  onSelect: (d: Date) => void;
  maxDate: Date;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function MiniCalendar({ selectedDate, onSelect, maxDate }: MiniCalendarProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [viewMonth, setViewMonth] = useState(() => selectedDate || new Date());

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7; // Monday-start index (0 = Monday, 6 = Sunday)
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const dayNames = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  const monthNames = [
    'Tháng 1',
    'Tháng 2',
    'Tháng 3',
    'Tháng 4',
    'Tháng 5',
    'Tháng 6',
    'Tháng 7',
    'Tháng 8',
    'Tháng 9',
    'Tháng 10',
    'Tháng 11',
    'Tháng 12',
  ];

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => setViewMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setViewMonth(new Date(year, month + 1, 1));

  return (
    <div className="mx-auto max-w-[400px] w-full rounded-2xl border border-white/[0.06] bg-[#0c1220]/45 p-4 shadow-xl">
      {/* Month nav */}
      <div className="mb-4 flex items-center justify-between">
        <button
          type="button"
          onClick={prevMonth}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition duration-200"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-black text-white">
          {monthNames[month]} {year}
        </span>
        <button
          type="button"
          onClick={nextMonth}
          className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white transition duration-200"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {dayNames.map((d) => (
          <div key={d} className="text-center text-[10px] font-bold uppercase text-slate-500 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((day, idx) => {
          if (day === null) return <div key={`e-${idx}`} className="aspect-square" />;
          const cellDate = new Date(year, month, day);
          cellDate.setHours(0, 0, 0, 0);
          const isPast = cellDate < today;
          const isBeyondMax = cellDate > maxDate;
          const disabled = isPast || isBeyondMax;
          const isSelected = selectedDate && isSameDay(cellDate, selectedDate);
          const isToday = isSameDay(cellDate, today);

          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(cellDate)}
              className={`relative aspect-square w-full rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center ${
                isSelected
                  ? 'bg-orange-500 text-slate-950 font-black shadow-[0_4px_12px_rgba(249,115,22,0.4)] scale-105'
                  : disabled
                    ? 'text-slate-700 opacity-25 cursor-not-allowed'
                    : isToday
                      ? 'border border-orange-500/40 bg-orange-500/5 text-orange-400 hover:bg-orange-500/10'
                      : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              {day}
              {isToday && !isSelected && (
                <span className="absolute bottom-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-orange-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
