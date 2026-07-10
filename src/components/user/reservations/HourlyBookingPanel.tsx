import { motion } from 'framer-motion';
import { CalendarClock, Clock, Timer } from 'lucide-react';
import { MiniCalendar } from '@/components/user/MiniCalendar';
import { TimeScroller } from '@/components/user/TimeScroller';
import { DurationSelector } from '@/components/user/DurationSelector';

interface HourlyBookingPanelProps {
  disabled: boolean;
  selectedDate: Date | null;
  onSelectDate: (date: Date | null) => void;
  maxCalDate: Date;
  selectedTime: string;
  onSelectTime: (time: string) => void;
  durationHours: number;
  onSelectDuration: (hours: number) => void;
  maxDurationHours?: number;
}

export function HourlyBookingPanel({
  disabled,
  selectedDate,
  onSelectDate,
  maxCalDate,
  selectedTime,
  onSelectTime,
  durationHours,
  onSelectDuration,
  maxDurationHours,
}: HourlyBookingPanelProps) {
  return (
    <motion.div
      key="hourly"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`space-y-5 transition-all duration-200 ${disabled ? 'opacity-30' : ''}`}
    >
      {/* Date */}
      <div className="glass-panel-white rounded-3xl p-6 relative">
        {disabled && (
          <div className="absolute inset-0 bg-transparent cursor-not-allowed z-20" title="Please select vehicle type before selecting date." />
        )}
        <div className="flex items-center gap-2 mb-4">
          <CalendarClock size={16} className="text-cyan-300/70" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/70">Select check-in date</span>
        </div>
        <MiniCalendar selectedDate={selectedDate} onSelect={onSelectDate} maxDate={maxCalDate} />
        <p className="mt-2 text-[10px] font-semibold text-slate-500">
          Can only pre-book up to 7 days in advance
        </p>
      </div>

      {/* Time */}
      <div className="glass-panel-white rounded-3xl p-6 relative">
        {disabled && (
          <div className="absolute inset-0 bg-transparent cursor-not-allowed z-20" title="Please select vehicle type before selecting check-in time." />
        )}
        <div className="flex items-center gap-2 mb-3">
          <Clock size={16} className="text-cyan-300/70" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/70">Check-in time</span>
        </div>
        <TimeScroller selected={selectedTime} onSelect={onSelectTime} />
      </div>

      {/* Duration */}
      <div className="glass-panel-white rounded-3xl p-6 relative">
        {disabled && (
          <div className="absolute inset-0 bg-transparent cursor-not-allowed z-20" title="Please select vehicle type before selecting duration." />
        )}
        <div className="flex items-center gap-2 mb-3">
          <Timer size={16} className="text-cyan-300/70" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-300/70">Duration (hours)</span>
        </div>
        <DurationSelector hours={durationHours} onSelect={onSelectDuration} maxHours={maxDurationHours} />
      </div>
    </motion.div>
  );
}
