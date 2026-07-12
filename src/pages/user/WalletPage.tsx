import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CalendarClock, RefreshCw, User } from 'lucide-react';
import { useWallet } from '@/hooks/user/useWallet';
import { WalletBalanceCard } from '@/components/user/wallet/WalletBalanceCard';
import { QuickTopUpPanel } from '@/components/user/wallet/QuickTopUpPanel';
import { WalletTransactionsSection } from '@/components/user/wallet/WalletTransactionsSection';
import { PayosTopUpModal } from '@/components/user/wallet/PayosTopUpModal';

export default function WalletPage() {
  const navigate = useNavigate();
  const {
    session,
    wallet,
    isLoading,
    isSubmitting,
    selectedAmount,
    setSelectedAmount,
    customAmount,
    setCustomAmount,
    setCustomError,
    customError,
    filter,
    setFilter,
    message,
    pendingTopUp,
    setPendingTopUp,
    verifying,
    copiedField,
    filteredTx,
    totalCredit,
    totalDebit,
    refreshWallet,
    handleCopy,
    handleTopUp,
    handleCustomTopUp,
    handleVerifyTopUp,
  } = useWallet();

  if (!session) return <Navigate to="/auth/login" replace />;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#030712] text-slate-100 font-sans selection:bg-orange-500/30 selection:text-orange-200">
      {/* Background patterns */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-950 via-zinc-950 to-black bg-no-repeat"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:44px_44px] opacity-70"
      />

      {/* Decorative ambient light blobs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-amber-500/10 to-orange-600/5 blur-[130px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 right-[-10%] w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-500/5 to-purple-600/5 blur-[120px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-[-10%] left-[10%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-emerald-500/5 to-cyan-500/5 blur-[150px]"
      />

      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Nav Bar */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/[0.08] bg-slate-950/40 p-4 shadow-glass backdrop-blur-xl"
        >
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-orange-400 transition-all duration-300 hover:border-orange-500/40 hover:bg-orange-500/10 active:scale-95"
          >
            <ArrowLeft size={14} /> Home
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/reservations')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-cyan-400 transition-all duration-300 hover:border-cyan-500/40 hover:bg-cyan-500/10 active:scale-95"
            >
              <CalendarClock size={14} /> Pre-booking
            </button>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-orange-400 transition-all duration-300 hover:border-orange-500/40 hover:bg-orange-500/10 active:scale-95"
            >
              <User size={14} /> Profile
            </button>
            <button
              type="button"
              onClick={refreshWallet}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 text-xs text-slate-400 transition-all duration-300 hover:text-white hover:bg-white/[0.05] active:scale-90"
              title="Refresh Balance"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </motion.div>

        {/* Balance Card + Quick Top-up Panel */}
        <section className="mb-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <WalletBalanceCard
            balance={wallet?.balance ?? 0}
            isLoading={isLoading}
            ownerLabel={session.displayName || session.email}
            totalCredit={totalCredit}
            totalDebit={totalDebit}
          />
          <QuickTopUpPanel
            selectedAmount={selectedAmount}
            onSelectAmount={setSelectedAmount}
            customAmount={customAmount}
            onChangeCustomAmount={(v) => {
              setCustomAmount(v);
              setCustomError(null);
            }}
            customError={customError}
            isSubmitting={isSubmitting}
            message={message}
            onTopUp={handleTopUp}
            onCustomTopUp={handleCustomTopUp}
          />
        </section>

        <WalletTransactionsSection
          isLoading={isLoading}
          filter={filter}
          onChangeFilter={setFilter}
          transactions={filteredTx}
        />
      </div>

      <PayosTopUpModal
        pendingTopUp={pendingTopUp}
        verifying={verifying}
        isSubmitting={isSubmitting}
        copiedField={copiedField}
        onCopy={handleCopy}
        onVerify={handleVerifyTopUp}
        onClose={() => setPendingTopUp(null)}
      />
    </main>
  );
}
