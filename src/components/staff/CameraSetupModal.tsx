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
  { role: 'plate', label: 'Camera 1 · License Plate' },
  { role: 'qr', label: 'Camera 2 · QR' },
  { role: 'portrait', label: 'Camera 3 · Portrait' },
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
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-primary">Devices</p>
            <h3 className="text-xl font-semibold text-foreground">Camera Setup</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition">✕</button>
        </div>

        <p className="mb-4 text-xs text-muted-foreground">
          When you have multiple cameras (plate / portrait / QR), assign each role to its own device
          so they can open simultaneously and capture the correct image. On a machine with a single webcam, all roles share the same device.
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
                <option value="">— Auto (default) —</option>
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
            No devices found yet — click "Refresh" and grant camera permission to the browser.
          </p>
        )}

        <div className="mt-5 flex justify-between gap-2">
          <Button type="button" variant="secondary" onClick={() => void requestAndRefresh()} className="gap-1.5 text-xs">
            <Settings size={13} /> Refresh list
          </Button>
          <Button onClick={onClose} className="bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950 hover:brightness-110 text-xs">
            Done
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
