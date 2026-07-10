import { motion } from 'framer-motion';
import { ArrowLeft, CalendarClock } from 'lucide-react';

interface ReservationHeaderProps {
  onBack: () => void;
  onShowHistory: () => void;
}

export function ReservationHeader({ onBack, onShowHistory }: ReservationHeaderProps) {
  return (
    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
      className="mb-6 flex flex-col gap-3 border-b border-white/[0.06] pb-5 sm:flex-row sm:items-center sm:justify-between"
    >
      <button type="button" onClick={onBack}
        className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-300 transition hover:border-cyan-300/30 hover:text-cyan-200"
      >
        <ArrowLeft size={14} /> Home
      </button>
      <div className="flex gap-2">
        <button type="button" onClick={onShowHistory}
          className="inline-flex items-center gap-2 rounded-xl border border-orange-500/20 bg-orange-500/5 px-4 py-2 text-xs font-black uppercase tracking-wider text-orange-400 transition hover:border-orange-400/40 hover:bg-orange-500/10 hover:text-orange-300"
        >
          <CalendarClock size={14} /> History
        </button>
      </div>
    </motion.div>
  );
}
