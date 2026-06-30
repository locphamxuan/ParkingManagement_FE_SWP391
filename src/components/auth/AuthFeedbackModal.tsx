import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

interface ModalData {
  title: string;
  message: string;
  type: 'success' | 'error';
  next?: () => void;
}

interface AuthFeedbackModalProps {
  modal: ModalData | null;
  onClose: () => void;
}

export function AuthFeedbackModal({ modal, onClose }: AuthFeedbackModalProps) {
  if (!modal) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-md px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6 text-center shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3.5 top-3.5 rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        <div
          className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
            modal.type === 'success' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
          }`}
        >
          {modal.type === 'success' ? (
            <CheckCircle2 size={30} className="stroke-[2.2]" />
          ) : (
            <AlertCircle size={30} className="stroke-[2.2]" />
          )}
        </div>

        <h3 className="text-base font-black tracking-tight text-white">{modal.title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">{modal.message}</p>

        <button
          type="button"
          onClick={onClose}
          className={`mt-5 h-11 w-full rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
            modal.type === 'success'
              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 hover:shadow-[0_0_25px_rgba(249,115,22,0.45)]'
              : 'border border-white/10 text-white hover:bg-slate-800'
          }`}
        >
          Got it
        </button>
      </motion.div>
    </div>
  );
}
