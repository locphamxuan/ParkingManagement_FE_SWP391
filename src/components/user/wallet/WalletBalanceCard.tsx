import { motion } from 'framer-motion';
import { ArrowDownLeft, ArrowUpRight, WalletCards } from 'lucide-react';
import { fmtMoney } from './wallet.constants';

interface WalletBalanceCardProps {
  balance: number;
  isLoading: boolean;
  ownerLabel: string;
  totalCredit: number;
  totalDebit: number;
}

/** Thẻ ví kim loại (holographic) hiển thị số dư + tổng dòng tiền vào/ra. */
export function WalletBalanceCard({ balance, isLoading, ownerLabel, totalCredit, totalDebit }: WalletBalanceCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-slate-900 via-zinc-900 to-amber-950/40 p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7),_0_0_45px_rgba(249,115,22,0.08)] transition-all duration-300"
    >
      {/* Holographic reflection sheen effect */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,rgba(255,255,255,0.03)_45%,rgba(255,255,255,0.08)_50%,rgba(255,255,255,0.03)_55%,transparent_70%)] bg-[size:200%_100%] bg-[position:-100%_0] group-hover:bg-[position:100%_0] transition-all duration-1000 ease-out" />

      {/* Glowing top line */}
      <div className="absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-orange-500/50 via-amber-300 to-cyan-400/50 opacity-70" />

      <div>
        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-400">PBMS Wallet</p>
            <p className="mt-0.5 text-xs font-medium text-slate-400">Smart Parking System</p>
          </div>
          {/* Contactless payment design and metallic chip */}
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-11 overflow-hidden rounded-md bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-300 shadow-inner">
              <div className="absolute inset-y-0 left-1/3 w-[1px] bg-black/20" />
              <div className="absolute inset-y-0 left-2/3 w-[1px] bg-black/20" />
              <div className="absolute inset-x-0 top-1/2 h-[1px] bg-black/20" />
              <div className="absolute inset-1 rounded-sm border border-black/10 pointer-events-none" />
            </div>
            <WalletCards size={32} className="text-amber-200/90" />
          </div>
        </div>

        {/* Balance Amount */}
        <div className="mt-8">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Available Balance</p>
          <h1 className="mt-2 text-4xl sm:text-5xl font-black bg-gradient-to-r from-white via-amber-100 to-yellow-200 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(251,191,36,0.15)] font-mono tracking-tight">
            {isLoading ? (
              <span className="inline-block h-10 w-48 animate-pulse rounded-md bg-white/10" />
            ) : (
              fmtMoney(balance)
            )}
          </h1>
        </div>
      </div>

      {/* Card Footer details */}
      <div className="mt-8">
        <div className="mb-4 flex items-center justify-between border-t border-white/[0.06] pt-4 text-xs font-semibold text-slate-400">
          <span>{ownerLabel}</span>
          <span className="font-mono text-[10px] text-slate-500">VALID THRU: 12/29</span>
        </div>

        {/* Glass container for flow summaries */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 backdrop-blur-md">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
              <ArrowDownLeft size={16} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Total Inflow</p>
              <p className="mt-0.5 text-base font-bold text-emerald-400">{fmtMoney(totalCredit)}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 backdrop-blur-md">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
              <ArrowUpRight size={16} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Total Outflow</p>
              <p className="mt-0.5 text-base font-bold text-orange-400">{fmtMoney(totalDebit)}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
