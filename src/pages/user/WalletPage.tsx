import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { useWallet } from '@/hooks/user/useWallet';
import { WalletBalanceCard } from '@/components/user/wallet/WalletBalanceCard';
import { QuickTopUpPanel } from '@/components/user/wallet/QuickTopUpPanel';
import { WalletTransactionsSection } from '@/components/user/wallet/WalletTransactionsSection';
import { PayosTopUpModal } from '@/components/user/wallet/PayosTopUpModal';

export default function WalletPage() {
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
    <main className="relative z-10">
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-wrap items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-black text-white">E-Wallet</h1>
            <p className="mt-1 text-xs font-semibold text-slate-400">Top up, pay parking fees, and track every transaction.</p>
          </div>
          <button
            type="button"
            onClick={refreshWallet}
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 text-xs text-slate-400 transition-all duration-300 hover:text-white hover:bg-white/[0.05] active:scale-90"
            title="Refresh Balance"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
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
