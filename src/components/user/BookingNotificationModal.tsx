import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle } from 'lucide-react';

interface BookingNotificationModalProps {
  bookingSuccess: string | null;
  bookingError: string | null;
  onCloseSuccess: () => void;
  onCloseError: () => void;
}

export function BookingNotificationModal({
  bookingSuccess,
  bookingError,
  onCloseSuccess,
  onCloseError,
}: BookingNotificationModalProps) {
  const isOpen = Boolean(bookingSuccess || bookingError);

  const handleClose = () => {
    if (bookingSuccess) onCloseSuccess();
    if (bookingError) onCloseError();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm pointer-events-auto"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm overflow-hidden rounded-3xl border p-6 text-left shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl bg-slate-900/95 pointer-events-auto"
            style={{
              borderColor: bookingSuccess ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)',
            }}
          >
            {bookingSuccess ? (
              <div className="flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.4 }}
                  className="rounded-full bg-emerald-500/10 p-3.5 border border-emerald-500/20 mb-4 shrink-0"
                >
                  <CheckCircle2 size={32} className="text-emerald-400" />
                </motion.div>
                <h3 className="text-lg font-black uppercase tracking-wider text-emerald-400">Thành công!</h3>
                <p className="mt-3 text-sm font-medium text-slate-300 leading-relaxed break-words">
                  {bookingSuccess}
                </p>
                <button
                  type="button"
                  onClick={onCloseSuccess}
                  className="mt-6 w-full rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-950 transition hover:brightness-110 active:scale-95 shadow-[0_4px_15px_rgba(16,185,129,0.2)]"
                >
                  Đồng ý
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center text-center">
                <motion.div
                  initial={{ x: 0 }}
                  animate={{ x: [-10, 10, -10, 10, 0] }}
                  transition={{ duration: 0.4 }}
                  className="rounded-full bg-rose-500/10 p-3.5 border border-rose-500/20 mb-4 shrink-0"
                >
                  <XCircle size={32} className="text-rose-400" />
                </motion.div>
                <h3 className="text-lg font-black uppercase tracking-wider text-rose-400">Đã xảy ra lỗi</h3>
                <p className="mt-3 text-sm font-medium text-slate-300 leading-relaxed break-words">
                  {bookingError}
                </p>
                <button
                  type="button"
                  onClick={onCloseError}
                  className="mt-6 w-full rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-950 transition hover:brightness-110 active:scale-95 shadow-[0_4px_15px_rgba(244,63,94,0.2)]"
                >
                  Đóng
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
