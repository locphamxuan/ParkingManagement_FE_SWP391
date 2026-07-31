import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Copy, Check, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import QRCode from 'qrcode';
import type { Vehicle } from '@/services/vehicleService';
import { qrTimeRemainingMs } from '@/services/vehicleService';

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

/** "1 ngày 4 giờ" / "3 giờ 12 phút" / "sắp hết hạn" — đủ để người dùng biết cần làm gì. */
function formatRemaining(ms: number): string {
  if (ms <= 0) return 'đã hết hạn';
  const days = Math.floor(ms / (24 * MS_PER_HOUR));
  const hours = Math.floor((ms % (24 * MS_PER_HOUR)) / MS_PER_HOUR);
  const minutes = Math.floor((ms % MS_PER_HOUR) / (60 * 1000));
  if (days > 0) return `còn ${days} ngày ${hours} giờ`;
  if (hours > 0) return `còn ${hours} giờ ${minutes} phút`;
  return `còn ${minutes} phút`;
}

export function VehicleQRModal({
  isOpen,
  onClose,
  vehicle,
  qrTtlDays,
  onRefreshQr,
}: VehicleQRModalProps) {
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState(0);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  const qrToken = vehicle?.qrCode || '';

  useEffect(() => {
    if (!isOpen || !qrCanvasRef.current || !qrToken) return;
    QRCode.toCanvas(
      qrCanvasRef.current,
      qrToken,
      {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 280,
        // Đen trên nền trắng để mọi máy quét đều đọc được.
        color: { dark: '#0f172a', light: '#ffffff' },
      },
      () => undefined
    );
  }, [isOpen, qrToken]);

  // Đếm ngược mỗi phút để người dùng thấy mã sắp hết hạn mà chủ động cấp lại.
  useEffect(() => {
    if (!isOpen || !vehicle) return;
    const tick = () => setRemainingMs(qrTimeRemainingMs(vehicle));
    tick();
    const timer = setInterval(tick, 60 * 1000);
    return () => clearInterval(timer);
  }, [isOpen, vehicle]);

  const isExpired = remainingMs <= 0;

  const handleDownload = () => {
    if (!qrCanvasRef.current || !vehicle) return;
    const link = document.createElement('a');
    link.href = qrCanvasRef.current.toDataURL('image/png');
    link.download = `${vehicle.plateNumber.replace(/[^A-Z0-9]/gi, '')}-qr.png`;
    link.click();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(qrToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefresh = async () => {
    if (!vehicle) return;
    setIsRefreshing(true);
    setRefreshError(null);
    try {
      await onRefreshQr(vehicle._id);
    } catch (err) {
      setRefreshError(err instanceof Error ? err.message : 'Không cấp lại được mã QR.');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && vehicle && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="w-full max-w-md rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-white/10 shadow-2xl overflow-hidden my-8">
              <div className="relative bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 border-b border-white/5 p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-400 font-mono">Mã QR phương tiện</p>
                  <h2 className="text-xl font-black text-white font-mono">{vehicle.plateNumber}</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200">
                  <X size={20} className="text-slate-400 hover:text-white transition-colors" />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className={`relative flex justify-center p-6 rounded-2xl border backdrop-blur-sm ${
                  isExpired ? 'bg-rose-500/5 border-rose-500/30' : 'bg-white/5 border-white/10'
                }`}>
                  <canvas ref={qrCanvasRef} className={isExpired ? 'opacity-30' : ''} />
                  {isExpired && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-6">
                      <AlertTriangle size={28} className="text-rose-400" />
                      <p className="text-sm font-black text-rose-300">Mã đã hết hạn</p>
                      <p className="text-[11px] font-semibold text-rose-200/80">Bấm “Cấp lại mã” để lấy mã mới.</p>
                    </div>
                  )}
                </div>

                {/* Trạng thái hạn dùng — cho người dùng biết mã còn dùng được bao lâu. */}
                <div className={`flex items-center gap-2 rounded-2xl border px-4 py-3 ${
                  isExpired
                    ? 'border-rose-500/25 bg-rose-950/20 text-rose-300'
                    : 'border-emerald-500/20 bg-emerald-950/10 text-emerald-300'
                }`}>
                  <Clock size={14} className="shrink-0" />
                  <p className="text-[11px] font-bold">
                    Hiệu lực {qrTtlDays} ngày — {formatRemaining(remainingMs)}
                  </p>
                </div>

                <div className="space-y-3 rounded-2xl bg-slate-950/60 border border-white/5 p-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono mb-1">
                      Phương tiện {vehicle.brand ?? ''}
                    </p>
                    <p className="text-sm font-semibold text-white font-mono">{vehicle.plateNumber}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono mb-1">Token QR</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-mono text-slate-300 break-all">{qrToken}</p>
                      <button
                        onClick={handleCopy}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors duration-200 flex-shrink-0"
                        title="Sao chép mã"
                      >
                        {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} className="text-slate-400 hover:text-white" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-purple-500/5 border border-purple-500/20 p-4">
                  <p className="text-xs text-purple-200 leading-relaxed font-semibold">
                    🛵 <strong>Hướng dẫn:</strong> Nhân viên dùng <strong>Camera 2 (quét QR)</strong> để nhận diện xe khi không đọc được biển số.
                    Mã tự hết hạn sau {qrTtlDays} ngày; mở lại màn hình này là hệ thống cấp mã mới.
                  </p>
                </div>

                {refreshError && (
                  <p className="text-[11px] font-semibold text-rose-400">{refreshError}</p>
                )}

                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => void handleRefresh()}
                    disabled={isRefreshing}
                    className="flex-1 min-w-[130px] px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white font-black text-xs uppercase tracking-wider transition-all duration-300 hover:bg-slate-700 inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <RefreshCw size={14} className={`stroke-[2.5] ${isRefreshing ? 'animate-spin' : ''}`} />
                    {isRefreshing ? 'Đang cấp…' : 'Cấp lại mã'}
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={isExpired}
                    className="flex-1 min-w-[130px] px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white font-black text-xs uppercase tracking-wider transition-all duration-300 hover:scale-105 inline-flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    <Download size={14} className="stroke-[2.5]" />
                    Tải về
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
