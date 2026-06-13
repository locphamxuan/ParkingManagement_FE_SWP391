import { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

interface DatePickerProps {
  value: string; // "YYYY-MM-DD" format
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MONTH_NAMES = [
  'Tháng Một',
  'Tháng Hai',
  'Tháng Ba',
  'Tháng Tư',
  'Tháng Năm',
  'Tháng Sáu',
  'Tháng Bảy',
  'Tháng Tám',
  'Tháng Chín',
  'Tháng Mười',
  'Tháng Mười Một',
  'Tháng Mười Hai',
];

const WEEK_DAYS = ['H', 'B', 'T', 'N', 'S', 'B', 'C'];

export function DatePicker({ value, onChange, placeholder = 'dd/mm/yyyy', className, disabled = false }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse value to Date object or null
  const parsedDate = value ? new Date(value) : null;
  const isValidDate = parsedDate && !isNaN(parsedDate.getTime());

  // Month shown in calendar view
  const [viewDate, setViewDate] = useState(() => (isValidDate ? new Date(parsedDate) : new Date()));

  useEffect(() => {
    if (isValidDate) {
      setViewDate(new Date(parsedDate));
    }
  }, [value]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleSelectDay = (day: number, isCurrentMonth: boolean) => {
    let targetMonth = viewDate.getMonth();
    let targetYear = viewDate.getFullYear();

    if (!isCurrentMonth) {
      if (day > 20) {
        // Clicked previous month's day
        targetMonth -= 1;
      } else {
        // Clicked next month's day
        targetMonth += 1;
      }
    }

    const d = new Date(targetYear, targetMonth, day);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  const handleClear = () => {
    onChange('');
    setIsOpen(false);
  };

  const handleToday = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    onChange(`${yyyy}-${mm}-${dd}`);
    setIsOpen(false);
  };

  // Generate calendar days
  const getCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday, 1 is Monday...
    // Adjust firstDayIndex to make Monday (1) the first index (0 in WEEK_DAYS)
    // Sunday (0) becomes index 6
    const adjustedStart = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    const days: Array<{ day: number; currentMonth: boolean }> = [];

    // Prev month overflow days
    for (let i = adjustedStart - 1; i >= 0; i--) {
      days.push({ day: prevMonthTotalDays - i, currentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= totalDays; i++) {
      days.push({ day: i, currentMonth: true });
    }

    // Next month overflow days
    const remainingSlots = 42 - days.length; // 6 rows * 7 days
    for (let i = 1; i <= remainingSlots; i++) {
      days.push({ day: i, currentMonth: false });
    }

    return days;
  };

  const formattedDisplay = () => {
    if (!isValidDate) return <span className="text-slate-500">{placeholder}</span>;
    const dd = String(parsedDate.getDate()).padStart(2, '0');
    const mm = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const yyyy = parsedDate.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const displayMonthName = `${MONTH_NAMES[viewDate.getMonth()]} ${viewDate.getFullYear()}`;
  const days = getCalendarDays();

  return (
    <div ref={containerRef} className={cn('relative w-full', className)}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-xl border border-slate-700/80 bg-[#070b12] px-3 text-sm font-semibold text-white outline-none transition-all duration-300 hover:border-slate-500",
          isOpen && "border-orange-500/50 ring-2 ring-orange-500/10",
          disabled && "cursor-not-allowed opacity-50"
        )}
      >
        <span className="text-left font-medium">{formattedDisplay()}</span>
        <Calendar size={16} className="text-slate-400 shrink-0 ml-2" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 z-50 flex flex-col w-64 rounded-2xl border border-slate-700/80 bg-[#070b12]/98 p-3 shadow-[0_20px_50px_rgba(0,0,0,0.65)] backdrop-blur-xl"
            style={{ top: '100%' }}
          >
            {/* Header: Month & Year Selector */}
            <div className="flex items-center justify-between mb-3.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition-all"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-black uppercase text-white tracking-wide">{displayMonthName}</span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 rounded-lg hover:bg-white/[0.06] text-slate-400 hover:text-white transition-all"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Week days Header */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {WEEK_DAYS.map((day, idx) => (
                <span key={idx} className="text-[10px] font-black uppercase text-slate-500">
                  {day}
                </span>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {days.map((item, idx) => {
                const isSelected =
                  isValidDate &&
                  item.currentMonth &&
                  parsedDate.getDate() === item.day &&
                  parsedDate.getMonth() === viewDate.getMonth() &&
                  parsedDate.getFullYear() === viewDate.getFullYear();

                const isToday =
                  item.currentMonth &&
                  new Date().getDate() === item.day &&
                  new Date().getMonth() === viewDate.getMonth() &&
                  new Date().getFullYear() === viewDate.getFullYear();

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectDay(item.day, item.currentMonth)}
                    className={cn(
                      "h-7 w-7 text-xs font-semibold rounded-lg flex items-center justify-center transition-all duration-150",
                      item.currentMonth ? "text-slate-200 hover:bg-white/[0.06] hover:text-white" : "text-slate-600 hover:bg-white/[0.03] hover:text-slate-400",
                      isToday && !isSelected && "border border-orange-500/40 text-orange-400 font-bold",
                      isSelected && "bg-orange-500 text-slate-950 hover:bg-orange-400 hover:text-slate-950 font-black shadow-sm"
                    )}
                  >
                    {item.day}
                  </button>
                );
              })}
            </div>

            {/* Footer buttons: Clear & Today */}
            <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800">
              <button
                type="button"
                onClick={handleClear}
                className="text-[10px] font-black uppercase tracking-wider text-rose-400 hover:text-rose-300 transition-colors"
              >
                Xóa
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="text-[10px] font-black uppercase tracking-wider text-orange-400 hover:text-orange-300 transition-colors"
              >
                Hôm nay
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
