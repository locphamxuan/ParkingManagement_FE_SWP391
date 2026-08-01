import { useEffect, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Copy, X } from 'lucide-react';

type Accent = 'orange' | 'purple';

/**
 * Lớp vỏ chung cho các modal hiển thị mã QR (mã tài khoản, mã phương tiện).
 *
 * Trước đây mỗi modal tự dựng backdrop + panel + header với cùng một cấu hình
 * animation, nên sửa hành vi ở một chỗ là chỗ kia trôi lệch — và không chỗ nào
 * đóng được bằng phím Escape.
 */
interface QrModalShellProps {
  isOpen: boolean;
  onClose: () => void;
  accent: Accent;
  /** Dòng chữ nhỏ in hoa phía trên tiêu đề. */
  eyebrow: string;
  title: string;
  /** Tiêu đề là biển số/mã → dùng font mono cho dễ đọc từng ký tự. */
  monoTitle?: boolean;
  children: ReactNode;
}

// Class Tailwind phải ở dạng chuỗi tĩnh thì JIT mới giữ lại — không ghép động.
const ACCENT: Record<Accent, { header: string; eyebrow: string }> = {
  orange: {
    header: 'bg-gradient-to-r from-orange-500/10 to-amber-500/10',
    eyebrow: 'text-orange-400',
  },
  purple: {
    header: 'bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10',
    eyebrow: 'text-purple-400',
  },
};

export function QrModalShell({
  isOpen,
  onClose,
  accent,
  eyebrow,
  title,
  monoTitle = false,
  children,
}: QrModalShellProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  const tone = ACCENT[accent];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            key="modal"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4"
          >
            <div className="my-8 w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 shadow-2xl">
              <div className={`relative flex items-center justify-between border-b border-white/5 p-6 ${tone.header}`}>
                <div className="space-y-1">
                  <p className={`text-[10px] font-black uppercase tracking-[0.25em] font-mono ${tone.eyebrow}`}>
                    {eyebrow}
                  </p>
                  <h2 className={`text-xl font-black text-white ${monoTitle ? 'font-mono' : ''}`}>{title}</h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="rounded-lg p-2 transition-colors duration-200 hover:bg-white/10"
                >
                  <X size={20} className="text-slate-400 transition-colors hover:text-white" />
                </button>
              </div>

              <div className="space-y-6 p-8">{children}</div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/** Hàng "nhãn + giá trị + nút sao chép" dùng chung cho user ID và token QR. */
export function CopyableField({
  label,
  value,
  copied,
  onCopy,
  copyTitle,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
  copyTitle: string;
}) {
  return (
    <div>
      <p className="mb-1 text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono">{label}</p>
      <div className="flex items-center gap-2">
        <p className="break-all font-mono text-xs text-slate-300">{value}</p>
        <button
          type="button"
          onClick={onCopy}
          className="flex-shrink-0 rounded-lg p-1.5 transition-colors duration-200 hover:bg-white/10"
          title={copyTitle}
        >
          {copied ? (
            <Check size={16} className="text-emerald-400" />
          ) : (
            <Copy size={16} className="text-slate-400 hover:text-white" />
          )}
        </button>
      </div>
    </div>
  );
}
