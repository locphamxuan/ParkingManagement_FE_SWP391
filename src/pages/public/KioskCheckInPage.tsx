import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, QrCode, AlertCircle, UserCog } from 'lucide-react';
import { LiveQRCamera } from '@/components/staff/LiveQRCamera';
import { kioskApi } from '@/services/kioskApi';

type Result =
  | { type: 'ok'; plate: string; code: string; entryTime: string }
  | { type: 'err'; text: string };

/**
 * Public gate kiosk — a reservation driver self-admits by showing the vehicle QR
 * to Camera 2. No staff involved. A portrait frame is captured and stored.
 */
export default function KioskCheckInPage() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const submit = async (payload: { qrCode: string; portraitImage?: string | null }) => {
    if (busy) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await kioskApi.reservationCheckIn(payload);
      const data = (res as { data?: { reservation?: { code?: string; plateNumber?: string }; parkingSession?: { entryTime?: string } } })?.data;
      setResult({
        type: 'ok',
        plate: data?.reservation?.plateNumber ?? '',
        code: data?.reservation?.code ?? '',
        entryTime: data?.parkingSession?.entryTime ?? new Date().toISOString(),
      });
    } catch (err) {
      setResult({ type: 'err', text: err instanceof Error ? err.message : 'Check-in failed' });
    } finally {
      setBusy(false);
      // Auto-clear the result so the next car can scan.
      setTimeout(() => setResult(null), 6000);
    }
  };

  const handleQr = (code: string) => {
    void submit({ qrCode: code });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400">
            <QrCode size={28} />
          </div>
          <h1 className="text-2xl font-black">Reservation Self Check-in</h1>
          <p className="mt-1 text-sm text-slate-400">
            For guests with an existing reservation: present the vehicle QR code to the camera to enter automatically (no staff needed).
          </p>
        </div>

        <LiveQRCamera onResult={handleQr} paused={busy || !!result} />

        {busy && (
          <div className="flex items-center justify-center gap-2 text-sm text-slate-300">
            <Loader2 size={16} className="animate-spin" /> Processing...
          </div>
        )}

        {result?.type === 'ok' && (
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center"
          >
            <CheckCircle2 size={40} className="mx-auto mb-2 text-emerald-400" />
            <p className="text-lg font-bold text-emerald-300">Please proceed to the parking area</p>
            <p className="mt-1 font-mono text-xl font-black text-white">{result.plate}</p>
            {result.code && <p className="text-xs text-slate-400">Reservation code: {result.code}</p>}
            <p className="mt-1 text-xs text-slate-400">{new Date(result.entryTime).toLocaleString('vi-VN')}</p>
          </motion.div>
        )}

        {result?.type === 'err' && (
          <div className="flex items-start gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-300">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{result.text}</span>
          </div>
        )}

        <div className="flex items-start gap-2 rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-xs text-slate-400">
          <UserCog size={14} className="mt-0.5 shrink-0" />
          <span>Can't scan the QR code? Please see the staff at the gate for manual check-in.</span>
        </div>
      </div>
    </div>
  );
}
