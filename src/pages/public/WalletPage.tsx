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
  Plus,
  ReceiptText,
  RefreshCw,
  ShieldCheck,
  User,
  WalletCards,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  createWalletTopUpOrder,
  getLatestPendingTopUpOrder,
  getTopUpOrderStatus,
  getUserWalletBalance,
  listUserPayments,
  listUserWalletTransactions,
  type UserPaymentRecord,
  type UserWalletTopUpOrder,
  type UserWalletTransactionRecord,
} from '@/pages/User/mockReservationsData';

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

type TxFilter = 'all' | 'credit' | 'debit';

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
const QR_EXPIRE_MINUTES = 15;

export default function WalletPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [balance, setBalance] = useState(0);
  const [payments, setPayments] = useState<UserPaymentRecord[]>([]);
  const [transactions, setTransactions] = useState<UserWalletTransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTopUp, setSelectedTopUp] = useState(topUpOptions[1]);
  const [filter, setFilter] = useState<TxFilter>('all');
  const [message, setMessage] = useState<string | null>(null);
  const [pendingOrder, setPendingOrder] = useState<UserWalletTopUpOrder | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());

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

  useEffect(() => {
    if (!user?.userId) return;
    getLatestPendingTopUpOrder(user.userId).then(setPendingOrder);
  }, [user?.userId]);

  useEffect(() => {
    if (!pendingOrder || pendingOrder.status !== 'pending') return;
    const timer = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [pendingOrder]);

  useEffect(() => {
    if (!pendingOrder || pendingOrder.status !== 'pending') return;
    const pollTimer = window.setInterval(async () => {
      const order = await getTopUpOrderStatus(pendingOrder.orderCode);
      if (!order) return;
      setPendingOrder(order);
      if (order.status === 'success') {
        await refreshWallet();
        setMessage(`Nạp tiền thành công: ${formatMoney(order.amount)}.`);
      }
      if (order.status === 'expired') {
        setMessage('Mã QR đã hết hạn. Vui lòng tạo lại giao dịch nạp mới.');
      }
    }, 3000);
    return () => window.clearInterval(pollTimer);
  }, [pendingOrder?.orderCode, pendingOrder?.status]);

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

  const handleTopUp = async () => {
    setMessage(null);
    setIsSubmitting(true);
    try {
      const order = await createWalletTopUpOrder(user.userId, selectedTopUp, 'payos');
      setPendingOrder(order);
      setMessage('Đã tạo mã QR nạp tiền. Vui lòng chuyển khoản đúng nội dung để hệ thống đối soát.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Không thể khởi tạo giao dịch nạp ví.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRefreshOrderStatus = async () => {
    if (!pendingOrder) return;
    const order = await getTopUpOrderStatus(pendingOrder.orderCode);
    if (!order) return;
    setPendingOrder(order);
    if (order.status === 'success') {
      await refreshWallet();
      setMessage(`Nạp tiền thành công: ${formatMoney(order.amount)}.`);
    }
  };

  const pendingOrderExpireAtMs = pendingOrder
    ? new Date(pendingOrder.createdAt).getTime() + QR_EXPIRE_MINUTES * 60_000
    : 0;
  const pendingRemainingMs = Math.max(0, pendingOrderExpireAtMs - nowMs);
  const pendingRemainingMin = Math.floor(pendingRemainingMs / 60_000);
  const pendingRemainingSec = Math.floor((pendingRemainingMs % 60_000) / 1000);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070b16] text-slate-100">
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/75 p-4">
          <button type="button" onClick={() => navigate('/')} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2 text-xs font-black uppercase tracking-wider text-orange-300">
            <ArrowLeft size={14} /> Trang chủ
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navigate('/reservations')} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2 text-xs font-black uppercase tracking-wider text-cyan-300"><CalendarClock size={14} /> Đặt chỗ</button>
            <button type="button" onClick={() => navigate('/profile')} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2 text-xs font-black uppercase tracking-wider text-orange-300"><User size={14} /> Hồ sơ</button>
          </div>
        </motion.div>

        <section className="mb-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-3xl border border-orange-300/25 bg-slate-900/80 p-6">
            <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-200">Ví PBMS</p>
            <h1 className="mt-3 text-3xl font-black text-white md:text-5xl">{formatMoney(balance)}</h1>
            <p className="mt-2 text-sm font-semibold text-slate-300">{user.fullName || user.email}</p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Tiền vào</p><p className="mt-2 text-lg font-black text-emerald-300">{formatMoney(totals.credit)}</p></div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Tiền ra</p><p className="mt-2 text-lg font-black text-orange-300">{formatMoney(totals.debit)}</p></div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4"><p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Giao dịch</p><p className="mt-2 text-lg font-black text-cyan-300">{transactions.length}</p></div>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white"><Plus size={16} className="text-emerald-300" /> Nạp ví (VietQR)</h2>
              <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2 py-1 text-[10px] font-black text-emerald-300">PayOS</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {topUpOptions.map((amount) => (
                <button key={amount} type="button" onClick={() => setSelectedTopUp(amount)} className={`rounded-2xl border px-3 py-4 text-sm font-black ${selectedTopUp === amount ? 'border-orange-300/60 bg-orange-500/20 text-orange-100' : 'border-white/10 bg-slate-950/70 text-slate-300'}`}>
                  {formatMoney(amount)}
                </button>
              ))}
            </div>

            <button type="button" onClick={handleTopUp} disabled={isSubmitting} className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-300 text-sm font-black uppercase tracking-wider text-slate-950 disabled:cursor-not-allowed disabled:opacity-60">
              <CreditCard size={16} /> {isSubmitting ? 'Đang tạo QR...' : 'Tạo mã QR nạp tiền'}
            </button>

            {message ? <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300"><CheckCircle2 size={15} />{message}</div> : null}

            {pendingOrder ? (
              <div className="mt-4 rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-4 text-xs text-cyan-100">
                <p className="text-[11px] font-black uppercase tracking-wider text-cyan-200">Trạng thái: {pendingOrder.status.toUpperCase()}</p>
                <p className="mt-2 font-semibold">OrderCode: {pendingOrder.orderCode}</p>
                <p className="mt-1 font-semibold">Nội dung CK: {pendingOrder.transferContent}</p>
                <p className="mt-1 font-semibold">Số tiền: {formatMoney(pendingOrder.amount)}</p>
                {pendingOrder.status === 'pending' ? <p className="mt-1 font-semibold">Hết hạn sau: {String(pendingRemainingMin).padStart(2, '0')}:{String(pendingRemainingSec).padStart(2, '0')}</p> : null}
                <div className="mt-3 overflow-hidden rounded-xl border border-white/20 bg-white p-2">
                  <img src={pendingOrder.qrImageUrl} alt="VietQR nạp tiền ví" className="mx-auto h-72 w-72 max-w-full object-contain" />
                </div>
                <button type="button" onClick={handleRefreshOrderStatus} className="mt-3 inline-flex items-center rounded-xl border border-cyan-300/40 bg-cyan-400/15 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-cyan-100">
                  Kiểm tra trạng thái
                </button>
              </div>
            ) : null}

            <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-300"><ShieldCheck size={14} className="text-cyan-300" /> Trạng thái ví</p>
              <p className="mt-2 text-xs font-semibold text-slate-500">Ví hoạt động bình thường, sẵn sàng cho đặt chỗ và hoàn tiền.</p>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_0.78fr]">
          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white"><ReceiptText size={16} className="text-cyan-300" /> Lịch sử ví</h2>
              <div className="flex rounded-2xl border border-white/10 bg-slate-950/80 p-1">
                {(['all', 'credit', 'debit'] as const).map((item) => (
                  <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider ${filter === item ? 'bg-orange-500 text-slate-950' : 'text-slate-400'}`}>
                    {item === 'all' ? 'Tất cả' : item === 'credit' ? 'Tiền vào' : 'Tiền ra'}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {filteredTransactions.length > 0 ? filteredTransactions.map((tx) => {
                const isCredit = tx.type === 'credit';
                const Icon = isCredit ? ArrowDownLeft : ArrowUpRight;
                return (
                  <div key={tx.id} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/65 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                    <div className={`grid h-10 w-10 place-items-center rounded-xl border ${isCredit ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300' : 'border-orange-400/20 bg-orange-500/10 text-orange-300'}`}><Icon size={18} /></div>
                    <div>
                      <p className="text-sm font-black text-white">{tx.description}</p>
                      <p className="mt-1 text-[11px] font-semibold text-slate-500">{tx.id} • {formatDateTime(tx.createdAt)}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className={`text-sm font-black ${isCredit ? 'text-emerald-300' : 'text-orange-300'}`}>{isCredit ? '+' : '-'}{formatMoney(tx.amount)}</p>
                      <p className="mt-1 text-[11px] font-semibold text-slate-500">Số dư: {formatMoney(tx.balanceAfter)}</p>
                    </div>
                  </div>
                );
              }) : <div className="rounded-2xl border border-white/10 bg-slate-950/65 p-8 text-center"><WalletCards size={30} className="mx-auto text-slate-600" /><p className="mt-3 text-sm font-black text-slate-400">{isLoading ? 'Đang tải ví...' : 'Chưa có giao dịch ví.'}</p></div>}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/70 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white"><RefreshCw size={16} className="text-emerald-300" /> Thanh toán liên quan</h2>
              <span className="rounded-full bg-slate-950 px-2 py-1 text-[11px] font-bold text-slate-400">{payments.length}</span>
            </div>
            <div className="space-y-3">
              {payments.length > 0 ? payments.map((payment) => (
                <div key={payment.id} className="rounded-2xl border border-white/10 bg-slate-950/65 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black text-white">{paymentTypeLabel(payment.type)}</p>
                      <p className="mt-1 text-[11px] font-semibold text-slate-500">{payment.note}</p>
                    </div>
                    <p className={`text-xs font-black ${payment.direction === 'credit' ? 'text-emerald-300' : 'text-orange-300'}`}>{payment.direction === 'credit' ? '+' : '-'}{formatMoney(payment.amount)}</p>
                  </div>
                  <p className="mt-2 text-[11px] text-slate-600">{formatDateTime(payment.createdAt)}</p>
                </div>
              )) : <p className="rounded-2xl border border-white/10 bg-slate-950/65 p-5 text-center text-xs font-semibold text-slate-500">Chưa có thanh toán đặt chỗ qua ví.</p>}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
