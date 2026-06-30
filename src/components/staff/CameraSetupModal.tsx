import { Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import type { CameraRole } from '@/hooks/useCameraDevices';

interface CameraDevice {
  deviceId: string;
  label: string;
}

interface CameraAssignment {
  plate?: string;
  portrait?: string;
  qr?: string;
}

interface CameraSetupModalProps {
  open: boolean;
  onClose: () => void;
  devices: CameraDevice[];
  assignment: CameraAssignment;
  assign: (role: CameraRole, deviceId: string) => void;
  requestAndRefresh: () => Promise<void>;
}

const ROLES: { role: CameraRole; label: string }[] = [
  { role: 'plate', label: 'Camera 1 · Biển số' },
  { role: 'qr', label: 'Camera 2 · QR' },
  { role: 'portrait', label: 'Camera 3 · Chân dung' },
];

export function CameraSetupModal({ open, onClose, devices, assignment, assign, requestAndRefresh }: CameraSetupModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Thiết bị</p>
            <h3 className="text-xl font-semibold text-foreground">Cài đặt camera</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition">✕</button>
        </div>

        <p className="mb-4 text-xs text-muted-foreground">
          Khi có nhiều camera (biển số / chân dung / QR), gán mỗi vai trò vào một thiết bị riêng để
          mở đồng thời và chụp đúng hình. Trên máy 1 webcam thì các vai trò dùng chung 1 thiết bị.
        </p>

        <div className="space-y-3">
          {ROLES.map(({ role, label }) => (
            <div key={role} className="grid gap-1.5">
              <label className="text-xs font-semibold text-foreground">{label}</label>
              <select
                value={assignment[role] ?? ''}
                onChange={(e) => assign(role, e.target.value)}
                className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary/50"
              >
                <option value="">— Tự động (mặc định) —</option>
                {devices.map((d, i) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Camera ${i + 1}`}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {devices.length === 0 && (
          <p className="mt-3 text-[11px] text-amber-400">
            Chưa thấy thiết bị nào — bấm "Làm mới" và cấp quyền camera cho trình duyệt.
          </p>
        )}

        <div className="mt-5 flex justify-between gap-2">
          <Button type="button" variant="secondary" onClick={() => void requestAndRefresh()} className="gap-1.5 text-xs">
            <Settings size={13} /> Làm mới danh sách
          </Button>
          <Button onClick={onClose} className="bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 text-xs">
            Xong
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
