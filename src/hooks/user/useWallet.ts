import { useEffect, useState } from 'react';
import { userApi, type UserWallet, type UserWalletTransaction } from '@/services/user/userApi';
import {
  fmtMoney,
  TOP_UP_OPTIONS,
  type CopyField,
  type PendingTopUp,
  type TxFilter,
} from '@/components/user/wallet/wallet.constants';
import { useAuth } from '@/hooks/useAuth';

/** Toàn bộ state + nghiệp vụ của trang ví: nạp tiền PayOS, poll xác nhận, lịch sử giao dịch. */
export function useWallet() {
  const { session } = useAuth();

  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [transactions, setTransactions] = useState<UserWalletTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState(TOP_UP_OPTIONS[1]);
  const [customAmount, setCustomAmount] = useState('');
  const [customError, setCustomError] = useState<string | null>(null);
  const [filter, setFilter] = useState<TxFilter>('all');
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [pendingTopUp, setPendingTopUp] = useState<PendingTopUp | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [copiedField, setCopiedField] = useState<CopyField | null>(null);

  const refreshWallet = async () => {
    setIsLoading(true);
    try {
      const [walletRes, txRes] = await Promise.all([
        userApi.wallet.get(),
        userApi.wallet.transactions({ limit: 50 }),
      ]);
      // Backend returns { data: { walletBalance } }; tolerate a legacy { wallet } shape too.
      const walletData = (walletRes as { data?: { walletBalance?: number; wallet?: { balance?: number } } })?.data;
      const balance = walletData?.walletBalance ?? walletData?.wallet?.balance ?? 0;
      setWallet({ balance } as UserWallet);
      setTransactions((txRes as { data?: { items: UserWalletTransaction[] } })?.data?.items ?? []);
    } catch {
      // silent — show stale data
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) refreshWallet();
    // Chỉ refetch khi ĐỔI user — session/refreshWallet là tham chiếu mới mỗi render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.userId]);

  // Auto-poll wallet top-up verification status
  useEffect(() => {
    if (!pendingTopUp) return;

    const checkStatus = async () => {
      try {
        const res = await userApi.wallet.verifyTopup(pendingTopUp.orderCode);
        const status = (res as { data?: { status: string } })?.data?.status;
        if (status === 'success' || status === 'PAID') {
          setMessage({ type: 'ok', text: `Successfully deposited ${fmtMoney(pendingTopUp.amount)} into your wallet.` });
          setPendingTopUp(null);
          refreshWallet();
          clearInterval(pollInterval);
        }
      } catch {
        // silent fail - keep polling
      }
    };

    // Poll mỗi 3s, dừng hẳn sau 15 phút.
    const pollInterval = setInterval(checkStatus, 3000);
    const timeoutId = setTimeout(() => clearInterval(pollInterval), 15 * 60 * 1000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingTopUp]);

  const handleCopy = (text: string, field: CopyField) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleTopUp = async (amount: number) => {
    setMessage(null);
    setIsSubmitting(true);
    try {
      const res = await userApi.wallet.topup({ amount });
      const data = (res as { data?: PendingTopUp })?.data;
      if (data) setPendingTopUp({ ...data, amount });
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Failed to initiate deposit.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomTopUp = () => {
    setCustomError(null);
    const amount = parseInt(customAmount, 10);
    if (!customAmount.trim() || Number.isNaN(amount) || amount <= 0) {
      setCustomError('Please enter a valid amount.');
      return;
    }
    if (amount < 10_000) {
      setCustomError('Minimum amount is 10,000 VND.');
      return;
    }
    setCustomAmount('');
    handleTopUp(amount);
  };

  const handleVerifyTopUp = async () => {
    if (!pendingTopUp) return;
    setVerifying(true);
    try {
      const res = await userApi.wallet.verifyTopup(pendingTopUp.orderCode);
      const status = (res as { data?: { status: string } })?.data?.status;
      if (status === 'success' || status === 'PAID') {
        setMessage({ type: 'ok', text: `Successfully deposited ${fmtMoney(pendingTopUp.amount)} into your wallet.` });
        setPendingTopUp(null);
        await refreshWallet();
      } else {
        setMessage({ type: 'err', text: 'Payment not received yet. Please complete the transaction and try again.' });
      }
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Verification failed.' });
    } finally {
      setVerifying(false);
    }
  };

  const filteredTx = filter === 'all' ? transactions : transactions.filter((t) => t.type === filter);
  const totalCredit = transactions.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalDebit = transactions.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0);

  return {
    session,
    wallet,
    isLoading,
    isSubmitting,
    selectedAmount,
    setSelectedAmount,
    customAmount,
    setCustomAmount,
    customError,
    setCustomError,
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
  };
}

export type UseWalletReturn = ReturnType<typeof useWallet>;
