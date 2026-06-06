import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';

interface UserQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  fullName?: string;
}

export function UserQRModal({ isOpen, onClose, userId, fullName }: UserQRModalProps) {
  const [copied, setCopied] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  // Generate QR code
  useEffect(() => {
    if (isOpen && qrCanvasRef.current && userId) {
      QRCode.toCanvas(
        qrCanvasRef.current,
        userId,
        {
          errorCorrectionLevel: 'H',
          margin: 1,
          width: 280,
          color: {
            dark: '#ffffff',
            light: '#1e293b',
          },
        },
        (error: Error | null | undefined) => {
          if (error) console.error('QR Code generation error:', error);
        }
      );
    }
  }, [isOpen, userId]);

  const handleDownload = () => {
    if (!qrCanvasRef.current) return;

    const link = document.createElement('a');
    link.href = qrCanvasRef.current.toDataURL('image/png');
    link.download = `${fullName || 'user'}-qr-code.png`;
    link.click();
  };

  const handleCopyUserId = () => {
    navigator.clipboard.writeText(userId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-white/10 shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="relative bg-gradient-to-r from-orange-500/10 to-amber-500/10 border-b border-white/5 p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-400 font-mono">Mã QR của bạn</p>
                  <h2 className="text-xl font-black text-white">Check-In / Check-Out</h2>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200"
                >
                  <X size={20} className="text-slate-400 hover:text-white transition-colors" />
                </button>
              </div>

              {/* Content */}
              <div className="p-8 space-y-6">
              {/* QR Code Display */}
              <div
                ref={qrContainerRef}
                className="flex justify-center p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm"
              >
                <canvas ref={qrCanvasRef} />
              </div>

                {/* User Info */}
                <div className="space-y-3 rounded-2xl bg-slate-950/60 border border-white/5 p-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono mb-1">Tên người dùng</p>
                    <p className="text-sm font-semibold text-white">{fullName || 'Người dùng'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono mb-1">User ID</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-mono text-slate-300 break-all">{userId}</p>
                      <button
                        onClick={handleCopyUserId}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors duration-200 flex-shrink-0"
                        title="Copy ID"
                      >
                        {copied ? (
                          <Check size={16} className="text-emerald-400" />
                        ) : (
                          <Copy size={16} className="text-slate-400 hover:text-white" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="rounded-2xl bg-blue-500/5 border border-blue-500/20 p-4">
                  <p className="text-xs text-blue-200 leading-relaxed font-semibold">
                    📱 <strong>Hướng dẫn:</strong> Nhân viên sẽ quét mã QR này khi bạn check-in hoặc check-out xe. Đảm bảo hiển thị rõ ràng để quét nhanh nhất.
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleDownload}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-[0_0_20px_rgba(249,115,22,0.35)] inline-flex items-center justify-center gap-2"
                  >
                    <Download size={14} className="stroke-[2.5]" />
                    Tải xuống
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white font-black text-xs uppercase tracking-wider transition-all duration-300 hover:bg-slate-700 hover:border-white/20"
                  >
                    Đóng
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
