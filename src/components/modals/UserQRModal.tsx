import { Download } from 'lucide-react';
import { useCopyFeedback } from '@/hooks/useCopyFeedback';
import { useQrCanvas } from '@/hooks/useQrCanvas';
import { CopyableField, QrModalShell } from './QrModalShell';

interface UserQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  fullName?: string;
}

export function UserQRModal({ isOpen, onClose, userId, fullName }: UserQRModalProps) {
  const { canvasRef, download } = useQrCanvas(userId, isOpen);
  const { copied, copy } = useCopyFeedback();

  return (
    <QrModalShell
      isOpen={isOpen}
      onClose={onClose}
      accent="orange"
      eyebrow="Your QR Code"
      title="Check-In / Check-Out"
    >
      <div className="flex justify-center rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
        <canvas ref={canvasRef} />
      </div>

      <div className="space-y-3 rounded-2xl border border-white/5 bg-slate-950/60 p-4">
        <div>
          <p className="mb-1 text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono">User Name</p>
          <p className="text-sm font-semibold text-white">{fullName || 'User'}</p>
        </div>
        <CopyableField
          label="User ID"
          value={userId}
          copied={copied}
          onCopy={() => copy(userId)}
          copyTitle="Copy ID"
        />
      </div>

      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4">
        <p className="text-xs font-semibold leading-relaxed text-blue-200">
          📱 <strong>Instructions:</strong> Staff will scan this QR code when you check in or check out your
          vehicle. Make sure it is displayed clearly for the fastest scan.
        </p>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => download(`${fullName || 'user'}-qr-code.png`)}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-xs font-black uppercase tracking-wider text-slate-950 transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(249,115,22,0.35)]"
        >
          <Download size={14} className="stroke-[2.5]" />
          Download
        </button>
        <button
          type="button"
          onClick={onClose}
          className="flex-1 rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-xs font-black uppercase tracking-wider text-white transition-all duration-300 hover:border-white/20 hover:bg-slate-700"
        >
          Close
        </button>
      </div>
    </QrModalShell>
  );
}
