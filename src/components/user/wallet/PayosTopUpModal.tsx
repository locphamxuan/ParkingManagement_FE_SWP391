import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, Copy, ExternalLink } from 'lucide-react';
import QRCode from 'qrcode';
import {
  BANK_BIN_MAP,
  fmtMoney,
  parseVietQR,
  type CopyField,
  type PendingTopUp,
} from './wallet.constants';

interface PayosTopUpModalProps {
  pendingTopUp: PendingTopUp | null;
  verifying: boolean;
  isSubmitting: boolean;
  copiedField: CopyField | null;
  onCopy: (text: string, field: CopyField) => void;
  onVerify: () => void;
  onClose: () => void;
}

/** Hàng chi tiết chuyển khoản có nút copy. */
function CopyRow({
  label,
  value,
  valueClass,
  field,
  copiedField,
  onCopy,
  copyValue,
}: {
  label: string;
  value: string;
  valueClass: string;
  field: CopyField;
  copiedField: CopyField | null;
  onCopy: (text: string, field: CopyField) => void;
  copyValue?: string;
}) {
  return (
    <div className="flex flex-col border-t border-white/[0.04] pt-2">
      <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono mb-0.5">{label}</span>
      <div className="flex items-center justify-between gap-2">
        <span className={valueClass}>{value}</span>
        <button
          type="button"
          onClick={() => onCopy(copyValue ?? value, field)}
          className="p-1.5 hover:bg-white/[0.08] active:scale-90 rounded-lg transition-all duration-200 flex-shrink-0 border border-white/[0.05] bg-white/[0.02]"
          title={`Copy ${label.toLowerCase()}`}
        >
          {copiedField === field ? (
            <CheckCircle2 size={13} className="text-emerald-400" />
          ) : (
            <Copy size={13} className="text-slate-400 hover:text-white" />
          )}
        </button>
      </div>
    </div>
  );
}

/** Modal PayOS: QR VietQR + thông tin chuyển khoản + nút xác nhận thanh toán. */
export function PayosTopUpModal({
  pendingTopUp,
  verifying,
  isSubmitting,
  copiedField,
  onCopy,
  onVerify,
  onClose,
}: PayosTopUpModalProps) {
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Render QR Code onto canvas
  useEffect(() => {
    if (pendingTopUp?.qrCode && qrCanvasRef.current) {
      QRCode.toCanvas(
        qrCanvasRef.current,
        pendingTopUp.qrCode,
        {
          errorCorrectionLevel: 'M',
          margin: 1,
          width: 200,
          color: { dark: '#0f172a', light: '#ffffff' },
        },
        () => undefined,
      );
    }
  }, [pendingTopUp]);

  const qrInfo = parseVietQR(pendingTopUp?.qrCode);
  const bankName = qrInfo
    ? BANK_BIN_MAP[qrInfo.bankBin] || `Bank (BIN: ${qrInfo.bankBin})`
    : 'MB Bank (Military Commercial Joint Stock Bank)';
  const accNo = qrInfo?.accountNumber || 'VQRQAJNOG7846';
  const accName = qrInfo?.accountName || 'PHAM XUAN LOC';

  return (
    <AnimatePresence>
      {pendingTopUp && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="presentation"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => {
            if (!verifying && !isSubmitting) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0b0f19]/90 backdrop-blur-2xl shadow-[0_0_50px_rgba(249,115,22,0.12)] flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/[0.06] bg-gradient-to-r from-orange-500/10 to-amber-500/10 px-6 py-4">
              <div>
                <p className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-orange-400">PayOS Payment</p>
                <h2 className="text-base font-black text-white">Deposit Funds to Wallet</h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                disabled={verifying}
                className="rounded-full border border-white/[0.08] bg-white/[0.02] p-2 text-slate-400 hover:text-white transition-all duration-200 hover:bg-white/[0.06]"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content wrapper */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              <p className="text-xs text-slate-400 text-center leading-relaxed max-w-md mx-auto">
                Open your Mobile Banking app that supports scanning QR code below, or copy the details to make the transfer to complete the transaction.
              </p>

              {/* QR Code and Detail tables side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                {/* Scanbox HUD screen */}
                <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/[0.04] bg-white/[0.01] p-4">
                  <div className="relative p-6 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.02)] border border-white/[0.08]">
                    <canvas ref={qrCanvasRef} className="z-10 relative" />
                    <div className="absolute -top-[2px] -left-[2px] w-6 h-6 border-t-2 border-l-2 border-orange-500 rounded-tl-lg shadow-[0_0_8px_rgba(249,115,22,0.5)] z-20" />
                    <div className="absolute -top-[2px] -right-[2px] w-6 h-6 border-t-2 border-r-2 border-orange-500 rounded-tr-lg shadow-[0_0_8px_rgba(249,115,22,0.5)] z-20" />
                    <div className="absolute -bottom-[2px] -left-[2px] w-6 h-6 border-b-2 border-l-2 border-orange-500 rounded-bl-lg shadow-[0_0_8px_rgba(249,115,22,0.5)] z-20" />
                    <div className="absolute -bottom-[2px] -right-[2px] w-6 h-6 border-b-2 border-r-2 border-orange-500 rounded-br-lg shadow-[0_0_8px_rgba(249,115,22,0.5)] z-20" />
                    <div className="absolute inset-x-2 top-0 h-[2.5px] bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-[bounce_3.5s_infinite] pointer-events-none opacity-40 z-20" />
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-orange-400 font-mono font-bold uppercase tracking-wider animate-pulse mt-2">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500"></span>
                    </span>
                    Waiting for transaction...
                  </div>
                </div>

                {/* Transfer Details Form */}
                <div className="flex flex-col justify-between space-y-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono mb-0.5">Beneficiary Bank</span>
                    <span className="text-xs font-bold text-white">{bankName}</span>
                  </div>

                  <CopyRow
                    label="Account Number"
                    value={accNo}
                    valueClass="text-sm font-mono text-cyan-400 font-black tracking-wide"
                    field="account"
                    copiedField={copiedField}
                    onCopy={onCopy}
                  />

                  <div className="flex flex-col border-t border-white/[0.04] pt-2">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono mb-0.5">Account Owner</span>
                    <span className="text-xs font-bold text-white font-mono uppercase">{accName}</span>
                  </div>

                  <CopyRow
                    label="Amount"
                    value={fmtMoney(pendingTopUp.amount)}
                    copyValue={pendingTopUp.amount.toString()}
                    valueClass="text-sm font-mono text-orange-400 font-black tracking-wide"
                    field="amount"
                    copiedField={copiedField}
                    onCopy={onCopy}
                  />

                  <CopyRow
                    label="Transfer Description"
                    value="Wallet Deposit"
                    valueClass="text-xs font-mono text-slate-200 font-bold break-all"
                    field="desc"
                    copiedField={copiedField}
                    onCopy={onCopy}
                  />
                </div>
              </div>

              {/* Warning notice box */}
              <div className="rounded-2xl border border-amber-500/10 bg-amber-500/[0.02] p-4 text-slate-400 flex items-start gap-3 shadow-inner">
                <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                <p className="text-[10px] leading-relaxed font-medium">
                  <strong className="text-amber-300">Note:</strong> Please scan the QR code or enter the exact transfer details (including both <strong className="text-white">Amount</strong> and <strong className="text-white">Description</strong>) so the system can automatically verify and credit your balance instantly.
                </p>
              </div>
            </div>

            {/* Modal Footer CTA Action buttons */}
            <div className="border-t border-white/[0.06] bg-slate-950/40 p-6 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => window.open(pendingTopUp.checkoutUrl, '_blank', 'noopener')}
                className="flex-1 h-12 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 shadow-sm"
              >
                <ExternalLink size={14} /> Open payment page
              </button>
              <div className="flex gap-3 flex-1">
                <button
                  type="button"
                  onClick={onVerify}
                  disabled={verifying}
                  className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 shadow-[0_0_20px_rgba(249,115,22,0.25)] text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 active:scale-95 disabled:opacity-50"
                >
                  {verifying ? 'Verifying...' : 'Check Status'}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={verifying}
                  className="h-12 px-5 rounded-2xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-bold text-xs transition-all duration-300 active:scale-95"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
