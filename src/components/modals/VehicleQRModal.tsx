import { useEffect, useState } from 'react';
import { AlertTriangle, Clock, Download, RefreshCw } from 'lucide-react';
import type { Vehicle } from '@/services/vehicleService';
import { qrTimeRemainingMs } from '@/services/vehicleService';
import { useCopyFeedback } from '@/hooks/useCopyFeedback';
import { useQrCanvas } from '@/hooks/useQrCanvas';
import { CopyableField, QrModalShell } from './QrModalShell';

interface VehicleQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle | null;
  /** Hạn dùng mã (ngày) do backend cấu hình — dùng để giải thích cho người dùng. */
  qrTtlDays: number;
  /** Cấp lại token mới; modal tự vẽ lại QR từ xe trả về. */
  onRefreshQr: (vehicleId: string) => Promise<Vehicle>;
}

const MS_PER_HOUR = 60 * 60 * 1000;

/** "1d 4h left" / "3h 12m left" / "expired" — đủ để người dùng biết cần làm gì. */
function formatRemaining(ms: number): string {
  if (ms <= 0) return 'expired';
  const days = Math.floor(ms / (24 * MS_PER_HOUR));
  const hours = Math.floor((ms % (24 * MS_PER_HOUR)) / MS_PER_HOUR);
  const minutes = Math.floor((ms % MS_PER_HOUR) / (60 * 1000));
  if (days > 0) return `${days}d ${hours}h left`;
  if (hours > 0) return `${hours}h ${minutes}m left`;
  return `${minutes}m left`;
}

export function VehicleQRModal({
  isOpen,
  onClose,
  vehicle,
  qrTtlDays,
  onRefreshQr,
}: VehicleQRModalProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);

  const qrToken = vehicle?.qrCode || '';
  const { canvasRef, download } = useQrCanvas(qrToken, isOpen);
  const { copied, copy } = useCopyFeedback();

  // Đếm ngược mỗi phút để người dùng thấy mã sắp hết hạn mà chủ động cấp lại.
  useEffect(() => {
    if (!isOpen || !vehicle) return;
    const tick = () => setRemainingMs(qrTimeRemainingMs(vehicle));
    tick();
    const timer = setInterval(tick, 60 * 1000);
    return () => clearInterval(timer);
  }, [isOpen, vehicle]);

  if (!vehicle) return null;

  const isExpired = remainingMs <= 0;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      await onRefreshQr(vehicle._id);
    } catch (err) {
      setRefreshError(err instanceof Error ? err.message : 'Could not reissue the QR code.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <QrModalShell
      isOpen={isOpen}
      onClose={onClose}
      accent="purple"
      eyebrow="Vehicle QR code"
      title={vehicle.plateNumber}
      monoTitle
    >
      <div
        className={`relative flex justify-center rounded-2xl border p-6 backdrop-blur-sm ${
          isExpired ? 'border-rose-500/30 bg-rose-500/5' : 'border-white/10 bg-white/5'
        }`}
      >
        <canvas ref={canvasRef} className={isExpired ? 'opacity-30' : ''} />
        {isExpired && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-6 text-center">
            <AlertTriangle size={28} className="text-rose-400" />
            <p className="text-sm font-black text-rose-300">This code has expired</p>
            <p className="text-[11px] font-semibold text-rose-200/80">Use “Reissue code” to get a new one.</p>
          </div>
        )}
      </div>

      {/* Trạng thái hạn dùng — cho người dùng biết mã còn dùng được bao lâu. */}
      <div
        className={`flex items-center gap-2 rounded-2xl border px-4 py-3 ${
          isExpired
            ? 'border-rose-500/25 bg-rose-950/20 text-rose-300'
            : 'border-emerald-500/20 bg-emerald-950/10 text-emerald-300'
        }`}
      >
        <Clock size={14} className="shrink-0" />
        <p className="text-[11px] font-bold">
          Valid for {qrTtlDays} days — {formatRemaining(remainingMs)}
        </p>
      </div>

      <div className="space-y-3 rounded-2xl border border-white/5 bg-slate-950/60 p-4">
        <div>
          <p className="mb-1 text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono">
            Vehicle {vehicle.brand ?? ''}
          </p>
          <p className="font-mono text-sm font-semibold text-white">{vehicle.plateNumber}</p>
        </div>
        <CopyableField
          label="Token QR"
          value={qrToken}
          copied={copied}
          onCopy={() => copy(qrToken)}
          copyTitle="Copy code"
        />
      </div>

      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-4">
        <p className="text-xs font-semibold leading-relaxed text-purple-200">
          🛵 <strong>How it works:</strong> staff use <strong>Camera 2 (QR scan)</strong> to identify your
          vehicle when the plate cannot be read. The code expires after {qrTtlDays} days; reopening this
          screen issues a fresh one.
        </p>
      </div>

      {refreshError && <p className="text-[11px] font-semibold text-rose-400">{refreshError}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => void handleRefresh()}
          disabled={isRefreshing}
          className="inline-flex min-w-[130px] flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-800 px-4 py-3 text-xs font-black uppercase tracking-wider text-white transition-all duration-300 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw size={14} className={`stroke-[2.5] ${isRefreshing ? 'animate-spin' : ''}`} />
          {isRefreshing ? 'Reissuing…' : 'Reissue code'}
        </button>
        <button
          type="button"
          onClick={() => download(`${vehicle.plateNumber.replace(/[^A-Z0-9]/gi, '')}-qr.png`)}
          disabled={isExpired}
          className="inline-flex min-w-[130px] flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 px-4 py-3 text-xs font-black uppercase tracking-wider text-white transition-all duration-300 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
        >
          <Download size={14} className="stroke-[2.5]" />
          Download
        </button>
      </div>
    </QrModalShell>
  );
}
