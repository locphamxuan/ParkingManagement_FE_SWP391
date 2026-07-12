import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, Clock, ReceiptText, RefreshCw, WalletCards } from 'lucide-react';
import type { UserWalletTransaction } from '@/services/user/userApi';
import { fmtMoney, fmtTime, TX_REASON_LABELS, type TxFilter } from './wallet.constants';

interface WalletTransactionsSectionProps {
  isLoading: boolean;
  filter: TxFilter;
  onChangeFilter: (f: TxFilter) => void;
  transactions: UserWalletTransaction[];
}

/** Lịch sử giao dịch ví với filter Inflow/Outflow dạng pill trượt. */
export function WalletTransactionsSection({ isLoading, filter, onChangeFilter, transactions }: WalletTransactionsSectionProps) {
  return (
    <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 shadow-glass backdrop-blur-xl">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
          <ReceiptText size={16} className="text-cyan-400" /> Transaction History
        </h2>

        {/* Sliding Pill Tab Filter */}
        <div className="relative flex rounded-2xl border border-white/[0.08] bg-slate-950/60 p-1">
          {(['all', 'credit', 'debit'] as const).map((f) => {
            const isActive = filter === f;
            return (
              <button
                key={f}
                type="button"
                onClick={() => onChangeFilter(f)}
                className={`relative rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-colors duration-300 ${isActive ? 'text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'
                  }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabPill"
                    className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-[0_2px_10px_rgba(249,115,22,0.2)]"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{f === 'all' ? 'All' : f === 'credit' ? 'Inflow' : 'Outflow'}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* List display */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-sm text-slate-500">
            <RefreshCw size={24} className="mx-auto animate-spin text-slate-600 mb-2" />
            Loading data...
          </div>
        ) : transactions.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.05] bg-white/[0.01] p-12 text-center">
            <WalletCards size={36} className="mx-auto text-slate-700 mb-3" />
            <p className="text-sm font-bold text-slate-500">No transactions recorded in this period.</p>
          </div>
        ) : (
          transactions.map((tx) => {
            const isCredit = tx.type === 'credit';
            const Icon = isCredit ? ArrowDownLeft : ArrowUpRight;
            return (
              <motion.div
                layout
                key={tx._id}
                className="grid gap-4 rounded-2xl border border-white/[0.04] bg-white/[0.01] p-4 transition-all duration-300 hover:bg-white/[0.03] hover:border-white/[0.08] hover:-translate-y-0.5 sm:grid-cols-[auto_1fr_auto] sm:items-center shadow-sm"
              >
                {/* Direction icon container */}
                <div
                  className={`grid h-11 w-11 place-items-center rounded-xl border transition-all duration-300 ${isCredit
                      ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.05)]'
                      : 'border-orange-500/20 bg-orange-500/5 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.05)]'
                    }`}
                >
                  <Icon size={18} />
                </div>

                {/* Metadata details */}
                <div>
                  <p className="text-sm font-bold text-white">{TX_REASON_LABELS[tx.reason] ?? tx.reason}</p>
                  {tx.note && <p className="mt-1 text-xs text-slate-400 font-medium leading-relaxed">{tx.note}</p>}
                  <p className="mt-1 text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <Clock size={11} />
                    {fmtTime(tx.createdAt)}
                  </p>
                </div>

                {/* Financial value details */}
                <div className="text-left sm:text-right border-t border-white/[0.03] pt-2 sm:pt-0 sm:border-0">
                  <p className={`text-base font-black ${isCredit ? 'text-emerald-400' : 'text-orange-400'}`}>
                    {isCredit ? '+' : '-'}{fmtMoney(tx.amount)}
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-slate-500">Balance after: {fmtMoney(tx.balanceAfter)}</p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </section>
  );
}
