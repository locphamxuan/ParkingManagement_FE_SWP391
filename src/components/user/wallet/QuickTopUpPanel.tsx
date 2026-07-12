import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Plus, QrCode } from 'lucide-react';
import { fmtMoney, TOP_UP_OPTIONS } from './wallet.constants';

interface QuickTopUpPanelProps {
  selectedAmount: number;
  onSelectAmount: (amount: number) => void;
  customAmount: string;
  onChangeCustomAmount: (value: string) => void;
  customError: string | null;
  isSubmitting: boolean;
  message: { type: 'ok' | 'err'; text: string } | null;
  onTopUp: (amount: number) => void;
  onCustomTopUp: () => void;
}

/** Panel nạp nhanh: chọn mệnh giá / nhập số tiền tùy ý → tạo phiên PayOS. */
export function QuickTopUpPanel({
  selectedAmount,
  onSelectAmount,
  customAmount,
  onChangeCustomAmount,
  customError,
  isSubmitting,
  message,
  onTopUp,
  onCustomTopUp,
}: QuickTopUpPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      className="flex flex-col justify-between rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 shadow-glass backdrop-blur-xl"
    >
      <div>
        <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
          <Plus size={16} className="text-emerald-400" /> Quick Deposit
        </h2>

        {/* Fast choices grid */}
        <div className="grid grid-cols-2 gap-3">
          {TOP_UP_OPTIONS.map((amount) => {
            const isSelected = selectedAmount === amount;
            return (
              <button
                key={amount}
                type="button"
                onClick={() => onSelectAmount(amount)}
                className={`relative overflow-hidden rounded-xl border py-3.5 text-sm font-bold transition-all duration-300 active:scale-95 ${isSelected
                    ? 'border-orange-500 bg-gradient-to-br from-orange-500/15 to-amber-500/5 text-orange-200 shadow-[0_0_15px_rgba(249,115,22,0.15)] ring-1 ring-orange-500/20'
                    : 'border-white/[0.05] bg-white/[0.02] text-slate-300 hover:border-white/[0.15] hover:bg-white/[0.05] hover:text-white'
                  }`}
              >
                {fmtMoney(amount)}
              </button>
            );
          })}
        </div>

        {/* Custom input */}
        <div className="mt-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="number"
                min="10000"
                step="1000"
                value={customAmount}
                onChange={(e) => onChangeCustomAmount(e.target.value)}
                placeholder="Enter custom amount"
                className="w-full rounded-xl border border-white/[0.08] bg-white/[0.01] px-4 py-3 text-sm font-semibold text-white placeholder-slate-500 outline-none transition-all duration-300 focus:border-orange-500/40 focus:bg-white/[0.03] focus:ring-1 focus:ring-orange-500/20"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">đ</span>
            </div>
            <button
              type="button"
              onClick={onCustomTopUp}
              disabled={isSubmitting}
              className="rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 text-xs font-bold text-white transition-all duration-300 hover:bg-orange-500 hover:text-black hover:border-orange-500 hover:shadow-[0_0_10px_rgba(249,115,22,0.3)] disabled:opacity-50 disabled:pointer-events-none active:scale-95"
            >
              OK
            </button>
          </div>
          {customError && (
            <p className="mt-1.5 flex items-center gap-1 text-[11px] text-rose-400">
              <AlertCircle size={12} /> {customError}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6">
        {/* Primary action CTA button */}
        <button
          type="button"
          onClick={() => onTopUp(selectedAmount)}
          disabled={isSubmitting}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-amber-600 text-sm font-black uppercase tracking-wider text-slate-950 shadow-[0_4px_20px_rgba(249,115,22,0.2)] transition-all duration-300 hover:brightness-110 active:scale-98 disabled:opacity-50"
        >
          <QrCode size={16} />
          {isSubmitting ? 'Initializing...' : `DEPOSIT (${fmtMoney(selectedAmount)})`}
        </button>

        {message && (
          <div
            className={`mt-4 flex items-center gap-2.5 rounded-2xl border p-4 text-xs font-semibold ${message.type === 'ok'
                ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.05)]'
                : 'border-rose-500/20 bg-rose-500/5 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.05)]'
              }`}
          >
            {message.type === 'ok' ? <CheckCircle2 size={15} className="shrink-0" /> : <AlertCircle size={15} className="shrink-0" />}
            <span>{message.text}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
