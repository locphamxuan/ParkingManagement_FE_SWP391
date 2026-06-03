import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Copy,
  Plus,
  QrCode,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  User,
  WalletCards,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  createUserWalletTopUp,
  getUserWalletBalance,
  listUserPayments,
  listUserWalletTransactions,
  type UserPaymentRecord,
  type UserWalletTransactionRecord,
} from '@/pages/User/mockReservationsData';

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

type TxFilter = 'all' | 'credit' | 'debit';
type PaymentMethod = 'internal' | 'vnpay' | 'momo' | 'zalopay' | 'banking';

const paymentMethodLabels: Record<PaymentMethod, string> = {
  internal: 'Ví nội bộ',
  vnpay: 'VNPay',
  momo: 'MoMo',
  zalopay: 'ZaloPay',
  banking: 'Thẻ ngân hàng',
};

function formatMoney(value: number): string {
  return currency.format(value);
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function paymentTypeLabel(type: UserPaymentRecord['type']): string {
  return type === 'reservation_refund' ? 'Hoàn tiền hủy đặt chỗ' : 'Giữ chỗ';
}

const topUpOptions = [50_000, 100_000, 200_000, 500_000];

interface PendingTopUp {
  amount: number;
  code: string;
  qrData: string;
  qrImageUrl: string;
  paymentMethod: PaymentMethod;
  balanceBefore: number;
}

function createTopUpCode(): string {
  return `PAYOS${Date.now().toString().slice(-10)}`;
}

function createQrPayload(userId: string, amount: number, code: string): string {
  return `PBMS_TOPUP|PAYOS|USER:${userId}|AMOUNT:${amount}|CODE:${code}`;
}

function createQrImageUrl(payload: string): string {
  const encodedPayload = encodeURIComponent(payload);
  return `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=12&data=${encodedPayload}`;
}

export default function WalletPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [balance, setBalance] = useState(0);
  const [payments, setPayments] = useState<UserPaymentRecord[]>([]);
  const [transactions, setTransactions] = useState<UserWalletTransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTopUp, setSelectedTopUp] = useState(topUpOptions[1]);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('internal');
  const [filter, setFilter] = useState<TxFilter>('all');
  const [message, setMessage] = useState<string | null>(null);
  const [pendingTopUp, setPendingTopUp] = useState<PendingTopUp | null>(null);
  const [customAmountError, setCustomAmountError] = useState<string | null>(null);

  const user = useMemo(() => {
    if (!session) return null;
    return {
      userId: session.userId,
      fullName: session.displayName,
      email: session.email,
    };
  }, [session]);

  const refreshWallet = async () => {
    if (!user?.userId) return;
    setIsLoading(true);
    const [nextBalance, paymentRows, txRows] = await Promise.all([
      getUserWalletBalance(user.userId),
      listUserPayments(user.userId),
      listUserWalletTransactions(user.userId),
    ]);
    setBalance(nextBalance);
    setPayments(paymentRows);
    setTransactions(txRows);
    setIsLoading(false);
  };

  useEffect(() => {
    refreshWallet();
  }, [user?.userId]);

  const totals = useMemo(() => {
    return transactions.reduce(
      (summary, tx) => {
        if (tx.type === 'credit') return { ...summary, credit: summary.credit + tx.amount };
        return { ...summary, debit: summary.debit + tx.amount };
      },
      { credit: 0, debit: 0 },
    );
  }, [transactions]);

  const filteredTransactions = useMemo(() => {
    if (filter === 'all') return transactions;
    return transactions.filter((tx) => tx.type === filter);
  }, [filter, transactions]);

  if (!session || !user) {
    return <Navigate to="/auth/login" replace />;
  }

  const handleTopUp = () => {
    setMessage(null);
    setCustomAmountError(null);
    const code = createTopUpCode();
    const qrData = createQrPayload(user.userId, selectedTopUp, code);
    setPendingTopUp({
      amount: selectedTopUp,
      code,
      qrData,
      qrImageUrl: createQrImageUrl(qrData),
      paymentMethod: selectedPaymentMethod,
      balanceBefore: balance,
    });
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setCustomAmountError(null);
  };

  const validateAndTopUpCustomAmount = () => {
    setCustomAmountError(null);
    
    if (!customAmount.trim()) {
      setCustomAmountError('Vui lòng nhập số tiền nạp.');
      return;
    }

    const amount = parseInt(customAmount, 10);
    
    if (Number.isNaN(amount) || amount <= 0) {
      setCustomAmountError('Số tiền phải là một số dương.');
      return;
    }

    if (amount < 10_000) {
      setCustomAmountError('Số tiền tối thiểu là 10,000 VND.');
      return;
    }

    setMessage(null);
    const code = createTopUpCode();
    const qrData = createQrPayload(user.userId, amount, code);
    setPendingTopUp({
      amount,
      code,
      qrData,
      qrImageUrl: createQrImageUrl(qrData),
      paymentMethod: selectedPaymentMethod,
      balanceBefore: balance,
    });
    setCustomAmount('');
  };

  const handleConfirmTopUp = async () => {
    if (!pendingTopUp) return;
    setMessage(null);
    setIsSubmitting(true);
    try {
      await createUserWalletTopUp(user.userId, pendingTopUp.amount);
      await refreshWallet();
      setMessage(`Đã nạp ${formatMoney(pendingTopUp.amount)} vào ví PBMS.`);
      setPendingTopUp(null);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể nạp ví.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyQrContent = async () => {
    if (!pendingTopUp) return;
    try {
      await navigator.clipboard.writeText(pendingTopUp.qrData);
      setMessage('Đã sao chép nội dung QR.');
    } catch {
      setMessage('Không thể sao chép nội dung QR.');
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070b16] text-slate-100">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(148,163,184,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.035)_1px,transparent_1px),linear-gradient(135deg,rgba(249,115,22,0.12),transparent_32%,rgba(34,211,238,0.08)_72%,transparent)] bg-[size:44px_44px,44px_44px,100%_100%]"
      />
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl"
        >
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2 text-xs font-black uppercase tracking-wider text-orange-300 transition-all hover:border-orange-400/40 hover:bg-orange-500/10 hover:text-orange-200"
          >
            <ArrowLeft size={14} />
            Trang chủ
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/reservations')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2 text-xs font-black uppercase tracking-wider text-cyan-300 transition-all hover:border-cyan-400/40 hover:bg-cyan-500/10 hover:text-cyan-200"
            >
              <CalendarClock size={14} />
              Đặt chỗ
            </button>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2 text-xs font-black uppercase tracking-wider text-orange-300 transition-all hover:border-orange-400/40 hover:bg-orange-500/10 hover:text-orange-200"
            >
              <User size={14} />
              Hồ sơ
            </button>
          </div>
        </motion.div>

        <section className="mb-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl border border-orange-300/25 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(88,28,5,0.72)_48%,rgba(8,47,73,0.82))] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.38),0_0_45px_rgba(249,115,22,0.12)]"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-amber-300 to-cyan-300" />
            <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.08)_38%,transparent_44%)]" />
            <div className="pointer-events-none absolute bottom-0 right-0 h-28 w-52 rounded-tl-[80px] border-l border-t border-white/10 bg-white/[0.03]" />
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-200">Ví PBMS</p>
                <h1 className="mt-3 text-3xl font-black text-white drop-shadow md:text-5xl">{formatMoney(balance)}</h1>
                <p className="mt-2 max-w-xl text-sm font-semibold text-slate-300">
                  {user.fullName || user.email} • Số dư khả dụng cho đặt chỗ và hoàn tiền.
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 shadow-inner backdrop-blur">
                <WalletCards size={34} className="text-amber-200" />
              </div>
            </div>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 shadow-inner backdrop-blur-sm transition-all hover:border-emerald-300/25">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Tiền vào</p>
                <p className="mt-2 text-lg font-black text-emerald-300">{formatMoney(totals.credit)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 shadow-inner backdrop-blur-sm transition-all hover:border-orange-300/25">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Tiền ra</p>
                <p className="mt-2 text-lg font-black text-orange-300">{formatMoney(totals.debit)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 shadow-inner backdrop-blur-sm transition-all hover:border-cyan-300/25">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Giao dịch</p>
                <p className="mt-2 text-lg font-black text-cyan-300">{transactions.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-black/25 backdrop-blur-xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
                <Plus size={16} className="text-emerald-300" />
                Nạp ví nhanh
              </h2>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-black text-emerald-300">
                Ví nội bộ
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {topUpOptions.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setSelectedTopUp(amount)}
                  className={`rounded-2xl border px-3 py-4 text-sm font-black shadow-sm transition-all ${
                    selectedTopUp === amount
                      ? 'border-orange-300/60 bg-gradient-to-br from-orange-500/25 to-amber-400/10 text-orange-100 shadow-[0_0_24px_rgba(249,115,22,0.15)]'
                      : 'border-white/10 bg-slate-950/70 text-slate-300 hover:border-white/25 hover:bg-slate-900'
                  }`}
                >
                  {formatMoney(amount)}
                </button>
              ))}
            </div>

            <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-400">
                  Nhập số tiền tùy chỉnh
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="10000"
                    step="1000"
                    value={customAmount}
                    onChange={(e) => handleCustomAmountChange(e.target.value)}
                    placeholder="Tối thiểu 10,000 VND"
                    className="flex-1 rounded-xl border border-slate-700/80 bg-[#070b12] px-3 py-2.5 text-sm font-semibold text-white placeholder-slate-500 outline-none transition-all focus:border-orange-300/60 focus:ring-4 focus:ring-orange-300/10"
                  />
                  <button
                    type="button"
                    onClick={validateAndTopUpCustomAmount}
                    className="rounded-xl border border-orange-300/20 bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-[0_0_15px_rgba(249,115,22,0.2)] transition hover:brightness-110"
                  >
                    OK
                  </button>
                </div>
                {customAmountError && (
                  <p className="mt-2 text-xs font-semibold text-rose-300">{customAmountError}</p>
                )}
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-400">
                Phương thức thanh toán
              </label>
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value as PaymentMethod)}
                className="w-full rounded-xl border border-slate-700/80 bg-[#070b12] px-3 py-2.5 text-sm font-semibold text-white outline-none transition-all focus:border-orange-300/60 focus:ring-4 focus:ring-orange-300/10"
              >
                {(Object.entries(paymentMethodLabels) as Array<[PaymentMethod, string]>).map(
                  ([method, label]) => (
                    <option key={method} value={method}>
                      {label}
                    </option>
                  ),
                )}
              </select>
              <p className="text-[11px] font-semibold text-slate-500">
                Chọn phương thức thanh toán cho nạp ví.
              </p>
            </div>

            <button
              type="button"
              onClick={handleTopUp}
              disabled={isSubmitting}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-300 text-sm font-black uppercase tracking-wider text-slate-950 shadow-[0_14px_30px_rgba(249,115,22,0.22)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <QrCode size={16} />
              Tạo mã QR nạp ví
            </button>

            {message ? (
              <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.08)]">
                <CheckCircle2 size={15} />
                {message}
              </div>
            ) : null}

            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-300">
                <ShieldCheck size={14} className="text-cyan-300" />
                Trạng thái ví
              </p>
              <p className="mt-2 text-xs font-semibold text-slate-500">
                Ví đang hoạt động, sẵn sàng dùng cho giữ chỗ và nhận hoàn tiền.
              </p>
            </div>
          </motion.div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.78fr]">
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-black/25 backdrop-blur-xl">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
                <ReceiptText size={16} className="text-cyan-300" />
                Lịch sử ví
              </h2>
              <div className="flex rounded-2xl border border-white/10 bg-slate-950/80 p-1 shadow-inner">
                {(['all', 'credit', 'debit'] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    className={`rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-all ${
                      filter === item ? 'bg-orange-500 text-slate-950 shadow-[0_0_18px_rgba(249,115,22,0.22)]' : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {item === 'all' ? 'Tất cả' : item === 'credit' ? 'Tiền vào' : 'Tiền ra'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => {
                  const isCredit = tx.type === 'credit';
                  const Icon = isCredit ? ArrowDownLeft : ArrowUpRight;
                  return (
                    <div key={tx.id} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/65 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-white/20 hover:bg-slate-950/85 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                      <div className={`grid h-10 w-10 place-items-center rounded-xl border ${
                        isCredit
                          ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300'
                          : 'border-orange-400/20 bg-orange-500/10 text-orange-300'
                      }`}>
                        <Icon size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">{tx.description}</p>
                        <p className="mt-1 text-[11px] font-semibold text-slate-500">
                          {tx.id} • {formatDateTime(tx.createdAt)}
                        </p>
                      </div>
                      <div className="text-left sm:text-right">
                        <p className={`text-sm font-black ${isCredit ? 'text-emerald-300' : 'text-orange-300'}`}>
                          {isCredit ? '+' : '-'}{formatMoney(tx.amount)}
                        </p>
                        <p className="mt-1 text-[11px] font-semibold text-slate-500">
                          Số dư: {formatMoney(tx.balanceAfter)}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="rounded-2xl border border-white/10 bg-slate-950/65 p-8 text-center shadow-inner">
                  <WalletCards size={30} className="mx-auto text-slate-600" />
                  <p className="mt-3 text-sm font-black text-slate-400">
                    {isLoading ? 'Đang tải ví...' : 'Chưa có giao dịch ví.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl shadow-black/25 backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
                <RefreshCw size={16} className="text-emerald-300" />
                Thanh toán liên quan
              </h2>
              <span className="rounded-full bg-slate-950 px-2 py-1 text-[11px] font-bold text-slate-400">
                {payments.length}
              </span>
            </div>

            <div className="space-y-3">
              {payments.length > 0 ? (
                payments.map((payment) => (
                  <div key={payment.id} className="rounded-2xl border border-white/10 bg-slate-950/65 p-4 transition-all hover:border-white/20 hover:bg-slate-950/85">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-black text-white">{paymentTypeLabel(payment.type)}</p>
                        <p className="mt-1 text-[11px] font-semibold text-slate-500">{payment.note}</p>
                      </div>
                      <p className={`text-xs font-black ${
                        payment.direction === 'credit' ? 'text-emerald-300' : 'text-orange-300'
                      }`}>
                        {payment.direction === 'credit' ? '+' : '-'}{formatMoney(payment.amount)}
                      </p>
                    </div>
                    <p className="mt-2 text-[11px] text-slate-600">{formatDateTime(payment.createdAt)}</p>
                  </div>
                ))
              ) : (
                <p className="rounded-2xl border border-white/10 bg-slate-950/65 p-5 text-center text-xs font-semibold text-slate-500">
                  Chưa có thanh toán đặt chỗ qua ví.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>

      {pendingTopUp ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md"
          onClick={() => {
            if (!isSubmitting) setPendingTopUp(null);
          }}
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-[0_30px_120px_rgba(0,0,0,0.55)]"
          >
            <div className="flex items-center justify-between border-b border-white/10 bg-slate-900/80 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl border border-cyan-300/20 bg-cyan-300/10 text-cyan-200">
                  <QrCode size={20} />
                </span>
                <div>
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.22em] text-cyan-200">PAYOS QR</p>
                  <h2 className="text-base font-black text-white">Quét mã để nạp ví</h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingTopUp(null)}
                disabled={isSubmitting}
                className="rounded-full border border-white/10 bg-white/[0.04] p-2 text-slate-300 transition hover:border-orange-300/40 hover:bg-orange-300/10 hover:text-orange-200 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-5">
              <div className="rounded-3xl border border-white/10 bg-white p-4 shadow-[0_18px_50px_rgba(34,211,238,0.12)]">
                <img
                  src={pendingTopUp.qrImageUrl}
                  alt={`QR nạp ví ${formatMoney(pendingTopUp.amount)}`}
                  className="mx-auto aspect-square w-full max-w-[260px] rounded-2xl"
                />
              </div>

              <div className="mt-4 grid gap-3 rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-400">Số tiền</span>
                  <span className="font-mono text-sm font-black text-emerald-300">{formatMoney(pendingTopUp.amount)}</span>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-bold text-slate-400">Phương thức</span>
                  <span className="font-mono text-xs font-black text-orange-300">{paymentMethodLabels[pendingTopUp.paymentMethod]}</span>
                </div>
                <div className="border-t border-white/5 pt-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-400">Số dư hiện tại</span>
                    <span className="font-mono text-xs font-black text-cyan-300">{formatMoney(pendingTopUp.balanceBefore)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <span className="text-xs font-bold text-slate-400">Sau khi nạp</span>
                    <span className="font-mono text-xs font-black text-emerald-300">{formatMoney(pendingTopUp.balanceBefore + pendingTopUp.amount)}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400">Mã giao dịch</p>
                  <p className="mt-1 break-all rounded-xl border border-white/5 bg-slate-950 p-3 font-mono text-[11px] font-semibold text-slate-300">
                    {pendingTopUp.code}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400">Nội dung QR</p>
                  <p className="mt-1 break-all rounded-xl border border-white/5 bg-slate-950 p-3 font-mono text-[11px] font-semibold text-slate-300">
                    {pendingTopUp.qrData}
                  </p>
                </div>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleCopyQrContent}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] text-xs font-black uppercase tracking-wider text-slate-200 transition hover:bg-white/[0.08]"
                >
                  <Copy size={14} />
                  Sao chép
                </button>
                <button
                  type="button"
                  onClick={handleConfirmTopUp}
                  disabled={isSubmitting}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-300 text-xs font-black uppercase tracking-wider text-slate-950 shadow-[0_14px_30px_rgba(249,115,22,0.24)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <CreditCard size={14} />
                  {isSubmitting ? 'Đang xác nhận...' : 'Xác nhận nạp ví'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </main>
  );
}
