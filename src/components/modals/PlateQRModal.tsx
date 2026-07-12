import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Copy, Check } from 'lucide-react';
import QRCode from 'qrcode';

interface PlateQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** The plate's opaque QR token (PLT-...). Camera 2 resolves it to the plate + owner. */
  qrToken: string;
  plateNumber: string;
  brand?: string | null;
}

export function PlateQRModal({ isOpen, onClose, qrToken, plateNumber, brand }: PlateQRModalProps) {
  const [copied, setCopied] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isOpen && qrCanvasRef.current && qrToken) {
      QRCode.toCanvas(
        qrCanvasRef.current,
        qrToken,
        {
          errorCorrectionLevel: 'H',
          margin: 2,
          width: 280,
          // Standard dark-on-white so any scanner (and inverted-unaware decoders) read it.
          color: { dark: '#0f172a', light: '#ffffff' },
        },
        () => undefined
      );
    }
  }, [isOpen, qrToken]);

  const handleDownload = () => {
    if (!qrCanvasRef.current) return;
    const link = document.createElement('a');
    link.href = qrCanvasRef.current.toDataURL('image/png');
    link.download = `${plateNumber.replace(/[^A-Z0-9]/gi, '')}-qr.png`;
    link.click();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(qrToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
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
              <div className="relative bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10 border-b border-white/5 p-6 flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-400 font-mono">Vehicle QR Code</p>
                  <h2 className="text-xl font-black text-white font-mono">{plateNumber}</h2>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors duration-200">
                  <X size={20} className="text-slate-400 hover:text-white transition-colors" />
                </button>
              </div>

              {/* Content */}
              <div className="p-8 space-y-6">
                <div className="flex justify-center p-6 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-sm">
                  <canvas ref={qrCanvasRef} />
                </div>

                <div className="space-y-3 rounded-2xl bg-slate-950/60 border border-white/5 p-4">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono mb-1">License plate {brand ? `· ${brand}` : ''}</p>
                    <p className="text-sm font-semibold text-white font-mono">{plateNumber}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono mb-1">QR Code (token)</p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-mono text-slate-300 break-all">{qrToken}</p>
                      <button
                        onClick={handleCopy}
                        className="p-1.5 hover:bg-white/10 rounded-lg transition-colors duration-200 flex-shrink-0"
                        title="Copy code"
                      >
                        {copied ? <Check size={16} className="text-emerald-400" /> : <Copy size={16} className="text-slate-400 hover:text-white" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-purple-500/5 border border-purple-500/20 p-4">
                  <p className="text-xs text-purple-200 leading-relaxed font-semibold">
                    🛵 <strong>Instructions:</strong> Staff use <strong>Camera 2 (QR Scan)</strong> to scan this code to identify the vehicle when the plate cannot be read.
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleDownload}
                    className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white font-black text-xs uppercase tracking-wider transition-all duration-300 hover:scale-105 inline-flex items-center justify-center gap-2"
                  >
                    <Download size={14} className="stroke-[2.5]" />
                    Download
                  </button>
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-white/10 text-white font-black text-xs uppercase tracking-wider transition-all duration-300 hover:bg-slate-700 hover:border-white/20"
                  >
                    Close
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
