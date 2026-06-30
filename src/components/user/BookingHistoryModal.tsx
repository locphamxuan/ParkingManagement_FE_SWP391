import { AnimatePresence, motion } from 'framer-motion';
import { CalendarClock, X } from 'lucide-react';
import { ReservationHistoryTab } from '@/components/user/ReservationHistoryTab';

interface BookingHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BookingHistoryModal({ isOpen, onClose }: BookingHistoryModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={onClose}
        >
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] rounded-full bg-cyan-500/10 blur-[120px] pointer-events-none" />

          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-3xl glass-panel-white p-6 shadow-[0_12px_40px_rgba(0,0,0,0.15)] flex flex-col"
          >
            <div className="mb-6 flex items-center justify-between border-b border-white/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-orange-500/10 p-2 border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                  <CalendarClock size={20} className="text-orange-500" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white tracking-wide">Booking History</h2>
                  <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">
                    Track & manage your parking reservations
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-white/10 bg-slate-900/40 p-2 text-slate-400 hover:text-white hover:bg-slate-800 hover:rotate-90 transition-all duration-300"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-auto pr-1">
              <ReservationHistoryTab />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
