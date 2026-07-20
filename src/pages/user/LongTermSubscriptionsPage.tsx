import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building2, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLongTermSubscriptions, useCancelSubscription, useRenewSubscription } from '@/hooks/user';
import type { LongTermSubscription } from '@/services/user/userApi';
import { packageStatusLabel, packageStatusBadgeClass } from '@/utils/packageStatus';
import { resolveErrorMessage } from '@/utils/apiErrors';

const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

function formatMoney(value: number): string {
  return currency.format(value);
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-US');
}

export default function LongTermSubscriptionsPage() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const {
    items: subscriptions,
    isLoading: isLoadingSubscriptions,
    error: subscriptionsError,
    refresh: refreshSubscriptions,
  } = useLongTermSubscriptions();

  const { cancel: cancelSub, isLoading: isCancelling } = useCancelSubscription();
  const { renew, isLoading: isRenewing } = useRenewSubscription();

  const [cancellingSub, setCancellingSub] = useState<LongTermSubscription | null>(null);
  const [cancelReason, setCancelReason] = useState<string>('change_vehicle');
  const [cancelNote, setCancelNote] = useState<string>('');
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleRenew = async (item: LongTermSubscription) => {
    if (!window.confirm(`Renew subscription "${item.package.name}" for plate ${item.plateNumber}? The fee will be deducted from your wallet.`)) return;
    setMessage(null);
    try {
      await renew(item._id);
      await refreshSubscriptions();
      setMessage({ type: 'success', text: 'Renewed successfully.' });
    } catch (err) {
      setMessage({ type: 'error', text: err instanceof Error ? err.message : 'Failed to renew' });
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (!session) {
    return <Navigate to="/auth/login" replace />;
  }

  return (
    <main className="relative z-10">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1 className="text-3xl font-black text-white md:text-4xl">Your Subscriptions</h1>
            <p className="mt-2 text-sm font-semibold text-slate-400">Manage, renew, and track your active subscriptions</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/packages/buy')}
            className="inline-flex items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-5 py-2.5 text-xs font-black uppercase tracking-wider text-orange-300 hover:bg-orange-500/20 transition-all shrink-0"
          >
            <CheckCircle2 size={14} /> Buy New Package
          </button>
        </motion.div>

        {/* Message */}
        {message && (
          <div
            className={`mb-6 flex items-center gap-2 rounded-2xl border p-4 text-sm font-semibold ${
              message.type === 'success'
                ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300'
                : 'border-rose-400/30 bg-rose-500/10 text-rose-300'
            }`}
          >
            <CheckCircle2 size={18} />
            {message.text}
          </div>
        )}

        {/* Subscriptions list */}
        <div className="rounded-3xl border border-white/10 bg-slate-900/55 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <Building2 size={16} className="text-cyan-300" />
              Active Packages
            </h2>
            <span className="rounded-full bg-slate-950 px-2 py-1 text-[11px] font-bold text-slate-400">
              {subscriptions.length}
            </span>
          </div>

          <div className="space-y-3">
            {isLoadingSubscriptions ? (
              <div className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-center">
                <Loader2 size={16} className="animate-spin mx-auto text-orange-300 mb-2" />
                <p className="text-xs font-semibold text-slate-400">Loading data...</p>
              </div>
            ) : subscriptionsError ? (
              <div className="rounded-xl border border-rose-400/30 bg-rose-500/10 p-4 text-center">
                <p className="text-xs font-semibold text-rose-300">{subscriptionsError.message}</p>
              </div>
            ) : subscriptions.length > 0 ? (
              subscriptions.map((item) => {
                const now = new Date();
                const startDate = new Date(item.startDate);
                const diffDays = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
                const isPendingOrActive = item.status === 'active' || item.status === 'pending';
                const canCancel = isPendingOrActive && (now <= startDate || diffDays <= 3);

                return (
                  <div key={item._id} className="rounded-xl border border-white/10 bg-slate-950/60 p-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-black text-orange-300">{item.package.name}</p>
                      <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider shrink-0 ${packageStatusBadgeClass(item.status)}`}>
                        {packageStatusLabel(item.status)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-300">
                      {item.plateNumber ?? item.linkedPlates?.join(', ') ?? '—'} • {item.package.code}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      {formatDate(item.startDate)} - {formatDate(item.endDate)}
                    </p>
                    <p className="mt-1 text-[11px] font-black text-cyan-300">
                      {formatMoney(item.price ?? item.package.price)}
                    </p>

                    {typeof item.package.maxHoursPerDay === 'number' && item.package.maxHoursPerDay > 0 && (
                      <p className="mt-1 text-[10px] text-slate-400">
                        Free hours: <span className="font-bold text-slate-200">{item.package.maxHoursPerDay}h/day</span>
                      </p>
                    )}
                    {(item.status === 'active' || item.status === 'pending') && (
                      item.slot?.code ? (
                        <p className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-emerald-300">
                          Slot reserved: {item.slot.code}
                        </p>
                      ) : (
                        <p className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-slate-500/30 bg-slate-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-slate-400">
                          No fixed slot — assigned at check-in
                        </p>
                      )
                    )}
                    {item.status === 'expired' && (
                      <p className="mt-2 text-[10px] text-amber-400/90 leading-relaxed border-t border-white/5 pt-1.5">
                        Package expired — hourly rates apply. Renew to continue receiving parking benefits.
                      </p>
                    )}

                    {(item.status === 'active' || item.status === 'expired') && (
                      <button
                        type="button"
                        disabled={isRenewing}
                        onClick={() => handleRenew(item)}
                        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-emerald-300 transition-all active:scale-95 disabled:opacity-60"
                      >
                        <RefreshCw size={12} /> {isRenewing ? 'Renewing...' : 'Renew'}
                      </button>
                    )}

                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => setCancellingSub(item)}
                        className="mt-2 w-full rounded-xl border border-rose-500/20 bg-rose-500/10 hover:bg-rose-500/20 px-3 py-1.5 text-xs font-black uppercase tracking-wider text-rose-400 transition-all active:scale-95"
                      >
                        Cancel Package
                      </button>
                    )}

                    {isPendingOrActive && !canCancel && (
                      <p className="mt-2 text-[10px] text-slate-400/80 italic leading-relaxed border-t border-white/5 pt-1.5">
                        Self-cancellation period (3 days) has passed. Please contact Admin for support.
                      </p>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-center text-xs font-semibold text-slate-500">
                No active subscriptions found.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Cancel modal */}
      {cancellingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-lg font-black text-white">Confirm Package Cancellation</h3>
              <p className="text-xs text-slate-400 mt-1">Package: {cancellingSub.package.name} ({cancellingSub.package.code})</p>
            </div>

            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 space-y-2 text-xs font-semibold text-rose-300">
              <p>
                This subscription will be cancelled. A partial refund (per this building's cancellation policy) will be credited to your wallet — the exact amount will be shown after confirmation.
              </p>
              <p className="text-[10px] text-rose-300/80 italic">
                (*) A cancellation fee is deducted for utility fees, system management, and parking lot operations.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <span className="text-xs font-bold uppercase text-slate-400 block mb-2">Reason for Cancellation</span>
                <div className="space-y-2">
                  {[
                    { value: 'change_vehicle', label: '🔄 Vehicle / license plate change' },
                    { value: 'no_longer_needed', label: '🏢 No longer need parking here' },
                    { value: 'pricing_issue', label: '💸 Subscription price no longer suitable' },
                    { value: 'other', label: '⚠️ Other reason' },
                  ].map((opt) => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
                        cancelReason === opt.value
                          ? 'border-orange-500/50 bg-orange-500/5 text-orange-300'
                          : 'border-white/5 bg-slate-950/40 text-slate-400 hover:bg-slate-950/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cancelReason"
                        value={opt.value}
                        checked={cancelReason === opt.value}
                        onChange={(e) => {
                          setCancelReason(e.target.value);
                          if (e.target.value !== 'other') setCancelNote('');
                        }}
                        className="accent-orange-500"
                      />
                      <span className="text-xs font-bold">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-xs font-bold uppercase text-slate-400 block mb-1">
                  Detailed Note {cancelReason === 'other' && <span className="text-rose-400">*</span>}
                </span>
                <textarea
                  value={cancelNote}
                  onChange={(e) => setCancelNote(e.target.value)}
                  placeholder={
                    cancelReason === 'other'
                      ? 'Please enter detailed cancellation reason here (required)...'
                      : 'Enter additional notes if any...'
                  }
                  rows={3}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-semibold text-white outline-none focus:border-orange-400/60 placeholder-slate-600 resize-none"
                />
              </div>
            </div>

            {cancelError && (
              <p className="text-xs font-bold text-rose-400 bg-rose-500/5 border border-rose-500/10 p-2.5 rounded-xl">
                {cancelError}
              </p>
            )}

            <div className="flex items-center gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => {
                  setCancellingSub(null);
                  setCancelReason('change_vehicle');
                  setCancelNote('');
                  setCancelError(null);
                }}
                disabled={isCancelling}
                className="px-4 py-2.5 rounded-xl border border-white/10 bg-slate-950 text-xs font-black uppercase tracking-wider text-slate-400 hover:text-white transition-all active:scale-95 disabled:opacity-50"
              >
                Back
              </button>
              <button
                type="button"
                disabled={isCancelling || (cancelReason === 'other' && !cancelNote.trim())}
                onClick={async () => {
                  setCancelError(null);
                  try {
                    const { refundAmount, refundPercent } = await cancelSub(cancellingSub._id, cancelReason, cancelNote);
                    await refreshSubscriptions();
                    setMessage({
                      type: 'success',
                      text: `Package cancelled successfully! A ${refundPercent}% refund (${formatMoney(refundAmount)}) has been credited to your wallet.`,
                    });
                    setCancellingSub(null);
                    setCancelReason('change_vehicle');
                    setCancelNote('');
                  } catch (err) {
                    setCancelError(resolveErrorMessage(err, 'Error cancelling package.'));
                  }
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-black uppercase tracking-wider text-white transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCancelling ? (
                  <>
                    <Loader2 size={12} className="animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Confirm Cancel'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
