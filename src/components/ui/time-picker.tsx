import { useState, useRef, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

interface TimePickerProps {
  value: string; // "HH:mm" format (24h)
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function TimePicker({ value, onChange, className, disabled = false }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse 24h format to 12h format components
  const parseTime = (timeStr: string) => {
    if (!timeStr) return { hour: '12', minute: '00', period: 'SA' };
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    if (isNaN(h)) h = 12;
    const period = h >= 12 ? 'CH' : 'SA';
    let hour12 = h % 12;
    if (hour12 === 0) hour12 = 12;
    return {
      hour: String(hour12).padStart(2, '0'),
      minute: String(m).padStart(2, '0'),
      period,
    };
  };

  const { hour, minute, period } = parseTime(value);

  // Convert 12h components to 24h string
  const updateTime = (h: string, m: string, p: string) => {
    let hourVal = parseInt(h, 10);
    if (p === 'CH' && hourVal < 12) hourVal += 12;
    if (p === 'SA' && hourVal === 12) hourVal = 0;
    const formatted = `${String(hourVal).padStart(2, '0')}:${m}`;
    onChange(formatted);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const hoursList = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
  const minutesList = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
  const periodsList = ['SA', 'CH'];

  const displayTime = `${hour}:${minute} ${period}`;

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
        <span className="text-left font-medium">{displayTime}</span>
        <Clock size={16} className="text-slate-400 shrink-0 ml-2" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute left-0 z-50 flex h-64 w-60 gap-1 rounded-2xl border border-slate-700/80 bg-[#070b12]/98 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.65)] backdrop-blur-xl"
            style={{ top: '100%' }}
          >
            {/* Hour Column */}
            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar border-r border-slate-800 pr-1">
              <span className="text-[9px] font-black uppercase text-slate-500 text-center mb-1 sticky top-0 bg-[#070b12] py-1">Hour</span>
              {hoursList.map((h) => {
                const isSelected = h === hour;
                return (
                  <button
                    key={h}
                    type="button"
                    onClick={() => updateTime(h, minute, period)}
                    className={cn(
                      "py-1.5 px-2 text-xs font-semibold rounded-lg text-center transition-all duration-150 hover:bg-white/[0.06] hover:text-white text-slate-400",
                      isSelected && "bg-orange-500 text-slate-950 hover:bg-orange-400 hover:text-slate-950 font-black shadow-sm"
                    )}
                  >
                    {h}
                  </button>
                );
              })}
            </div>

            {/* Minute Column */}
            <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar border-r border-slate-800 pr-1">
              <span className="text-[9px] font-black uppercase text-slate-500 text-center mb-1 sticky top-0 bg-[#070b12] py-1">Minute</span>
              {minutesList.map((m) => {
                const isSelected = m === minute;
                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => updateTime(hour, m, period)}
                    className={cn(
                      "py-1.5 px-2 text-xs font-semibold rounded-lg text-center transition-all duration-150 hover:bg-white/[0.06] hover:text-white text-slate-400",
                      isSelected && "bg-orange-500 text-slate-950 hover:bg-orange-400 hover:text-slate-950 font-black shadow-sm"
                    )}
                  >
                    {m}
                  </button>
                );
              })}
            </div>

            {/* Period Column */}
            <div className="w-16 flex flex-col justify-start">
              <span className="text-[9px] font-black uppercase text-slate-500 text-center mb-1 py-1">AM/PM</span>
              <div className="flex flex-col gap-1">
                {periodsList.map((p) => {
                  const isSelected = p === period;
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => updateTime(hour, minute, p)}
                      className={cn(
                        "py-2 px-2 text-xs font-semibold rounded-lg text-center transition-all duration-150 hover:bg-white/[0.06] hover:text-white text-slate-400",
                        isSelected && "bg-orange-500 text-slate-950 hover:bg-orange-400 hover:text-slate-950 font-black shadow-sm"
                      )}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
