import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export interface UserQrInfo {
  fullName: string;
  email: string;
  walletBalance?: number;
  activePackages: { id: string; name: string; code: string | null; plateNumber: string; endDate?: string }[];
}

interface UserQrInfoModalProps {
  info: UserQrInfo | null;
  onClose: () => void;
}

export function UserQrInfoModal({ info, onClose }: UserQrInfoModalProps) {
  if (!info) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Tài khoản đã quét</p>
            <h3 className="text-lg font-semibold text-foreground">{info.fullName}</h3>
            <p className="text-xs text-muted-foreground">{info.email}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition">✕</button>
        </div>

        {info.walletBalance != null && (
          <div className="mb-4 rounded-xl border border-violet-500/20 bg-violet-500/8 px-4 py-2.5 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Số dư ví</span>
            <span className="font-mono font-bold text-violet-400">{info.walletBalance.toLocaleString('vi-VN')} ₫</span>
          </div>
        )}

        <div className="mb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Gói dài hạn đang hoạt động
        </div>
        {info.activePackages.length === 0 ? (
          <p className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Khách chưa có gói dài hạn nào đang hoạt động.
          </p>
        ) : (
          <div className="space-y-2">
            {info.activePackages.map((pkg) => (
              <div key={pkg.id} className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-emerald-400">{pkg.name}</span>
                  {pkg.code && (
                    <span className="rounded-md border border-emerald-500/20 px-1.5 py-0.5 text-[10px] font-mono text-emerald-500">{pkg.code}</span>
                  )}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Biển số: <strong className="text-foreground font-mono">{pkg.plateNumber}</strong>
                  {pkg.endDate && (
                    <span className="ml-2 text-slate-500">
                      · Hết hạn: {new Date(pkg.endDate).toLocaleDateString('vi-VN')}
                    </span>
                  )}
                </p>
              </div>
            ))}
          </div>
        )}

        <Button onClick={onClose} className="mt-5 w-full" variant="secondary">
          Đóng
        </Button>
      </motion.div>
    </div>
  );
}
