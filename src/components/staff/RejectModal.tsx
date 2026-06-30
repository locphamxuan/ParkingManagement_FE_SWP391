import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { normalizePlate } from '@/utils/plate';

interface RejectModalProps {
  open: boolean;
  onClose: () => void;
  plateNumber: string;
  rejectReason: string;
  onReasonChange: (reason: string) => void;
  onConfirm: () => void;
}

export function RejectModal({ open, onClose, plateNumber, rejectReason, onReasonChange, onConfirm }: RejectModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md rounded-2xl border border-rose-500/30 bg-card p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-400">Từ chối cho xe vào</p>
            <h3 className="text-xl font-semibold text-foreground">Lý do từ chối</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition">✕</button>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Biển số <strong className="text-foreground font-mono">{normalizePlate(plateNumber) || plateNumber || '—'}</strong>. Hệ thống sẽ gửi thông báo kèm lý do đến tài khoản khách (nếu biển đã đăng ký).
        </p>
        <textarea
          value={rejectReason}
          onChange={(e) => onReasonChange(e.target.value)}
          rows={3}
          placeholder="Vd: Đăng ký xe máy nhưng thực tế là ô tô; thông tin phương tiện không khớp..."
          className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-rose-500/50"
        />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={onClose} className="text-xs">Hủy</Button>
          <Button
            onClick={onConfirm}
            disabled={!rejectReason.trim()}
            className="bg-rose-500 text-white hover:bg-rose-400 text-xs disabled:opacity-60"
          >
            Xác nhận từ chối
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
