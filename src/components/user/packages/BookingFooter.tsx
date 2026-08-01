import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';
import { fmtMoney, fmtShort, type BookingMode } from '@/pages/user/packagePurchaseHelper';

interface BookingFooterProps {
  startDateTime: Date | null;
  endDateTime: Date | null;
  estimatedAmount: number;
  canSubmit: boolean;
  isSubmitting: boolean;
  mode: BookingMode;
  onConfirm: () => void;
}

export function BookingFooter({
  startDateTime,
  endDateTime,
  estimatedAmount,
  canSubmit,
  isSubmitting,
  mode,
  onConfirm,
}: BookingFooterProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-[#060a11]/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="hidden text-xs font-semibold text-slate-400 sm:block">
          {startDateTime && endDateTime ? (
            <>
              <span className="text-white">Check-in:</span> {fmtShort(startDateTime)}
              <span className="mx-2 text-slate-600">—</span>
              <span className="text-white">Check-out:</span> {fmtShort(endDateTime)}
              <span className="mx-2 text-slate-600">|</span>
              <span className="text-emerald-300 font-black">{fmtMoney(estimatedAmount)}</span>
            </>
          ) : (
            'Select time and slot to pre-book'
          )}
        </div>
        <motion.button
          type="button"
          disabled={!canSubmit}
          onClick={onConfirm}
          whileHover={canSubmit ? { scale: 1.02 } : {}}
          whileTap={canSubmit ? { scale: 0.98 } : {}}
          className={`flex items-center gap-2 rounded-2xl btn-sand btn-sand-orange border border-white/10 bg-white/[0.03] backdrop-blur-sm px-6 py-3 text-sm font-black uppercase tracking-wider text-white transition-all disabled:cursor-not-allowed disabled:from-slate-700 disabled:to-slate-700 disabled:text-slate-400 disabled:shadow-none ${
            canSubmit ? 'btn-sand-active shadow-[0_0_20px_rgba(245,158,11,0.45)]' : ''
          }`}
        >
          <span className="relative z-10 flex items-center gap-2">
            <ShieldCheck size={16} />
            {isSubmitting ? 'Processing...' : mode === 'hourly' ? 'Confirm Booking' : 'Buy Package'}
          </span>
        </motion.button>
      </div>
    </div>
  );
}
