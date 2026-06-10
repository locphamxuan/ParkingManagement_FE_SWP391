import { useEffect, useState, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Plus,
  QrCode,
  ReceiptText,
  RefreshCw,
  User,
  WalletCards,
  Copy,
  Clock,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { userApi, type UserWallet, type UserWalletTransaction } from '@/services/user/userApi';
import QRCode from 'qrcode';

const currency = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const fmtMoney = (n: number) => currency.format(n);
const fmtTime = (s: string) =>
  new Date(s).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });

const TX_REASON_LABELS: Record<string, string> = {
  // Backend reason codes (from WalletTransaction model)
  payos_topup: 'Nạp ví (PayOS)',
  topup: 'Nạp ví',
  reservation_fee: 'Phí đặt chỗ trước',
  parking_checkout: 'Phí gửi xe',
  parking_fee: 'Phí gửi xe',
  reservation_refund: 'Hoàn tiền đặt chỗ',
  refund: 'Hoàn tiền',
  long_term_subscription: 'Gói dài hạn',
  wallet_payment: 'Thanh toán ví',
  admin_credit: 'Điều chỉnh số dư',
};

const TOP_UP_OPTIONS = [50_000, 100_000, 200_000, 500_000];

type TxFilter = 'all' | 'credit' | 'debit';

interface PendingTopUp {
  amount: number;
  checkoutUrl: string;
  orderCode: number;
  qrCode?: string;
}

const BANK_BIN_MAP: Record<string, string> = {
  '970422': 'MB Bank (TMCP Quân Đội)',
  '970436': 'Vietcombank',
  '970415': 'VietinBank',
  '970418': 'BIDV',
  '970405': 'Agribank',
  '970407': 'Techcombank',
  '970416': 'ACB',
  '970423': 'TPBank',
  '970432': 'VPBank',
  '970403': 'Sacombank',
};

function parseVietQR(qrString?: string) {
  if (!qrString) return null;
  try {
    const parseTags = (str: string) => {
      const result: Record<string, string> = {};
      let idx = 0;
      while (idx < str.length) {
        const id = str.substring(idx, idx + 2);
        const len = parseInt(str.substring(idx + 2, idx + 4), 10);
        if (Number.isNaN(len)) break;
        const val = str.substring(idx + 4, idx + 4 + len);
        result[id] = val;
        idx += 4 + len;
      }
      return result;
    };

    const rootTags = parseTags(qrString);
    const tag38 = rootTags['38'];
    if (!tag38) return null;

    const sub38 = parseTags(tag38);
    const tag01 = sub38['01'];
    if (!tag01) return null;

    const sub01 = parseTags(tag01);
    const bankBin = sub01['00'];
    const accountNumber = sub01['01'];
    const accountName = rootTags['59'] || 'PHAM XUAN LOC';

    return {
      bankBin,
      accountNumber,
      accountName,
    };
  } catch (e) {
    console.error('Error parsing VietQR', e);
    return null;
  }
}

export default function WalletPage() {
  const navigate = useNavigate();
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
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);
  const [copiedField, setCopiedField] = useState<'account' | 'amount' | 'desc' | 'order' | null>(null);
  const [pollCount, setPollCount] = useState(0);

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
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
        },
        (error: Error | null | undefined) => {
          if (error) console.error('QR Code generation error:', error);
        }
      );
    }
  }, [pendingTopUp]);

  // Auto-poll wallet top-up verification status
  useEffect(() => {
    if (!pendingTopUp) {
      setPollCount(0);
      return;
    }

    let pollInterval: NodeJS.Timeout;
    let timeoutId: NodeJS.Timeout;

    const checkStatus = async () => {
      setPollCount((prev) => prev + 1);
      try {
        const res = await userApi.wallet.verifyTopup(pendingTopUp.orderCode);
        const status = (res as { data?: { status: string } })?.data?.status;
        if (status === 'success' || status === 'PAID') {
          setMessage({ type: 'ok', text: `Đã nạp ${fmtMoney(pendingTopUp.amount)} vào ví thành công.` });
          setPendingTopUp(null);
          refreshWallet();
          clearInterval(pollInterval);
        }
      } catch (err) {
        // silent fail - keep polling
      }
    };

    // Poll every 3 seconds
    pollInterval = setInterval(checkStatus, 3000);

    // Stop polling after 15 minutes
    timeoutId = setTimeout(() => {
      clearInterval(pollInterval);
    }, 15 * 60 * 1000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeoutId);
    };
  }, [pendingTopUp]);

  const handleCopy = (text: string, field: 'account' | 'amount' | 'desc' | 'order') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

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
  }, [session?.userId]);

  if (!session) return <Navigate to="/auth/login" replace />;

  const handleTopUp = async (amount: number) => {
    setMessage(null);
    setIsSubmitting(true);
    try {
      const res = await userApi.wallet.topup({ amount });
      const data = (res as { data?: PendingTopUp })?.data;
      if (data) setPendingTopUp({ ...data, amount });
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Không thể khởi tạo nạp ví.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCustomTopUp = () => {
    setCustomError(null);
    const amount = parseInt(customAmount, 10);
    if (!customAmount.trim() || Number.isNaN(amount) || amount <= 0) {
      setCustomError('Vui lòng nhập số tiền hợp lệ.');
      return;
    }
    if (amount < 10_000) {
      setCustomError('Số tiền tối thiểu là 10.000 đ.');
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
        setMessage({ type: 'ok', text: `Đã nạp ${fmtMoney(pendingTopUp.amount)} vào ví thành công.` });
        setPendingTopUp(null);
        await refreshWallet();
      } else {
        setMessage({ type: 'err', text: 'Chưa nhận được thanh toán. Vui lòng hoàn tất giao dịch và thử lại.' });
      }
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Xác nhận thất bại.' });
    } finally {
      setVerifying(false);
    }
  };

  const filteredTx = filter === 'all' ? transactions : transactions.filter((t) => t.type === filter);
  const totalCredit = transactions.filter((t) => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
  const totalDebit = transactions.filter((t) => t.type === 'debit').reduce((s, t) => s + t.amount, 0);

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
            <ArrowLeft size={14} /> Trang chủ
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/reservations')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-cyan-400 transition-all duration-300 hover:border-cyan-500/40 hover:bg-cyan-500/10 active:scale-95"
            >
              <CalendarClock size={14} /> Đặt chỗ
            </button>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-orange-400 transition-all duration-300 hover:border-orange-500/40 hover:bg-orange-500/10 active:scale-95"
            >
              <User size={14} /> Hồ sơ
            </button>
            <button
              type="button"
              onClick={refreshWallet}
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 text-xs text-slate-400 transition-all duration-300 hover:text-white hover:bg-white/[0.05] active:scale-90"
              title="Làm mới số dư"
            >
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </motion.div>

        {/* Balance Card + Quick Top-up Panel */}
        <section className="mb-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Holographic / Metallic Balance Card */}
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
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-orange-400">Ví PBMS</p>
                  <p className="mt-0.5 text-xs font-medium text-slate-400">Hệ thống gửi xe thông minh</p>
                </div>
                {/* Contactless payment design and metallic chip */}
                <div className="flex items-center gap-3">
                  {/* Holographic/Metallic chip */}
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
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Số dư khả dụng</p>
                <h1 className="mt-2 text-4xl sm:text-5xl font-black bg-gradient-to-r from-white via-amber-100 to-yellow-200 bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(251,191,36,0.15)] font-mono tracking-tight">
                  {isLoading ? (
                    <span className="inline-block h-10 w-48 animate-pulse rounded-md bg-white/10" />
                  ) : (
                    fmtMoney(wallet?.balance ?? 0)
                  )}
                </h1>
              </div>
            </div>

            {/* Card Footer details */}
            <div className="mt-8">
              <div className="mb-4 flex items-center justify-between border-t border-white/[0.06] pt-4 text-xs font-semibold text-slate-400">
                <span>{session.displayName || session.email}</span>
                <span className="font-mono text-[10px] text-slate-500">VALID THRU: 12/29</span>
              </div>

              {/* Glass container for flow summaries */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 backdrop-blur-md">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400">
                    <ArrowDownLeft size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Tổng tiền vào</p>
                    <p className="mt-0.5 text-base font-bold text-emerald-400">{fmtMoney(totalCredit)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-white/[0.05] bg-white/[0.02] p-4 backdrop-blur-md">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10 text-orange-400">
                    <ArrowUpRight size={16} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Tổng tiền ra</p>
                    <p className="mt-0.5 text-base font-bold text-orange-400">{fmtMoney(totalDebit)}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Top-up Panel */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex flex-col justify-between rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 shadow-glass backdrop-blur-xl"
          >
            <div>
              <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
                <Plus size={16} className="text-emerald-400" /> Nạp tiền ví nhanh
              </h2>

              {/* Fast choices grid */}
              <div className="grid grid-cols-2 gap-3">
                {TOP_UP_OPTIONS.map((amount) => {
                  const isSelected = selectedAmount === amount;
                  return (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setSelectedAmount(amount)}
                      className={`relative overflow-hidden rounded-xl border py-3.5 text-sm font-bold transition-all duration-300 active:scale-95 ${
                        isSelected
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
                      onChange={(e) => {
                        setCustomAmount(e.target.value);
                        setCustomError(null);
                      }}
                      placeholder="Nhập số tiền tùy chỉnh"
                      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.01] px-4 py-3 text-sm font-semibold text-white placeholder-slate-500 outline-none transition-all duration-300 focus:border-orange-500/40 focus:bg-white/[0.03] focus:ring-1 focus:ring-orange-500/20"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">đ</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCustomTopUp}
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
                onClick={() => handleTopUp(selectedAmount)}
                disabled={isSubmitting}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-amber-600 text-sm font-black uppercase tracking-wider text-slate-950 shadow-[0_4px_20px_rgba(249,115,22,0.2)] transition-all duration-300 hover:brightness-110 active:scale-98 disabled:opacity-50"
              >
                <QrCode size={16} />
                {isSubmitting ? 'Đang khởi tạo...' : `NẠP TIỀN VIA PAYOS (${fmtMoney(selectedAmount)})`}
              </button>

              {message && (
                <div
                  className={`mt-4 flex items-center gap-2.5 rounded-2xl border p-4 text-xs font-semibold ${
                    message.type === 'ok'
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
        </section>

        {/* Transaction History */}
        <section className="rounded-3xl border border-white/[0.06] bg-white/[0.02] p-6 shadow-glass backdrop-blur-xl">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <ReceiptText size={16} className="text-cyan-400" /> Lịch sử giao dịch
            </h2>

            {/* Sliding Pill Tab Filter */}
            <div className="relative flex rounded-2xl border border-white/[0.08] bg-slate-950/60 p-1">
              {(['all', 'credit', 'debit'] as const).map((f) => {
                const isActive = filter === f;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`relative rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-colors duration-300 ${
                      isActive ? 'text-slate-950 font-black' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabPill"
                        className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl shadow-[0_2px_10px_rgba(249,115,22,0.2)]"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{f === 'all' ? 'Tất cả' : f === 'credit' ? 'Tiền vào' : 'Tiền ra'}</span>
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
                Đang tải dữ liệu...
              </div>
            ) : filteredTx.length === 0 ? (
              <div className="rounded-2xl border border-white/[0.05] bg-white/[0.01] p-12 text-center">
                <WalletCards size={36} className="mx-auto text-slate-700 mb-3" />
                <p className="text-sm font-bold text-slate-500">Chưa ghi nhận giao dịch nào trong khoảng thời gian này.</p>
              </div>
            ) : (
              filteredTx.map((tx) => {
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
                      className={`grid h-11 w-11 place-items-center rounded-xl border transition-all duration-300 ${
                        isCredit
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
                      <p className="mt-1 text-[11px] font-semibold text-slate-500">Số dư sau GD: {fmtMoney(tx.balanceAfter)}</p>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* PayOS QR TopUp Confirmation Modal */}
      <AnimatePresence>
        {pendingTopUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
            onClick={() => {
              if (!verifying && !isSubmitting) setPendingTopUp(null);
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
                  <p className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-orange-400">Thanh toán PayOS</p>
                  <h2 className="text-base font-black text-white">Nạp tiền vào ví điện tử</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingTopUp(null)}
                  disabled={verifying}
                  className="rounded-full border border-white/[0.08] bg-white/[0.02] p-2 text-slate-400 hover:text-white transition-all duration-200 hover:bg-white/[0.06]"
                >
                  ✕
                </button>
              </div>

              {/* Scrollable Content wrapper */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1">
                <p className="text-xs text-slate-400 text-center leading-relaxed max-w-md mx-auto">
                  Mở ứng dụng Ngân hàng (Mobile Banking) hỗ trợ quét mã QR bên dưới, hoặc sao chép thông tin chi tiết để chuyển khoản hoàn tất giao dịch.
                </p>

                {/* QR Code and Detail tables side by side */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                  {/* Scanbox HUD screen */}
                  <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/[0.04] bg-white/[0.01] p-4">
                    {/* HUD Scan Box Frame */}
                    <div className="relative p-6 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(255,255,255,0.02)] border border-white/[0.08]">
                      <canvas ref={qrCanvasRef} className="z-10 relative" />

                      {/* HUD corner frame decorations */}
                      <div className="absolute -top-[2px] -left-[2px] w-6 h-6 border-t-2 border-l-2 border-orange-500 rounded-tl-lg shadow-[0_0_8px_rgba(249,115,22,0.5)] z-20" />
                      <div className="absolute -top-[2px] -right-[2px] w-6 h-6 border-t-2 border-r-2 border-orange-500 rounded-tr-lg shadow-[0_0_8px_rgba(249,115,22,0.5)] z-20" />
                      <div className="absolute -bottom-[2px] -left-[2px] w-6 h-6 border-b-2 border-l-2 border-orange-500 rounded-bl-lg shadow-[0_0_8px_rgba(249,115,22,0.5)] z-20" />
                      <div className="absolute -bottom-[2px] -right-[2px] w-6 h-6 border-b-2 border-r-2 border-orange-500 rounded-br-lg shadow-[0_0_8px_rgba(249,115,22,0.5)] z-20" />

                      {/* Scanning laser line effect */}
                      <div className="absolute inset-x-2 top-0 h-[2.5px] bg-gradient-to-r from-transparent via-orange-400 to-transparent animate-[bounce_3.5s_infinite] pointer-events-none opacity-40 z-20" />
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-orange-400 font-mono font-bold uppercase tracking-wider animate-pulse mt-2">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500"></span>
                      </span>
                      Hệ thống đang chờ giao dịch...
                    </div>
                  </div>

                  {/* Transfer Details Form */}
                  {(() => {
                    const qrInfo = parseVietQR(pendingTopUp.qrCode);
                    const bankName = qrInfo ? BANK_BIN_MAP[qrInfo.bankBin] || `Ngân hàng (BIN: ${qrInfo.bankBin})` : 'MB Bank (TMCP Quân Đội)';
                    const accNo = qrInfo?.accountNumber || 'VQRQAJNOG7846';
                    const accName = qrInfo?.accountName || 'PHAM XUAN LOC';

                    return (
                      <div className="flex flex-col justify-between space-y-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] p-5">
                        {/* Detail item row */}
                        <div className="flex flex-col">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono mb-0.5">Ngân hàng thụ hưởng</span>
                          <span className="text-xs font-bold text-white">{bankName}</span>
                        </div>

                        <div className="flex flex-col border-t border-white/[0.04] pt-2">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono mb-0.5">Số tài khoản</span>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-mono text-cyan-400 font-black tracking-wide">{accNo}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(accNo, 'account')}
                              className="p-1.5 hover:bg-white/[0.08] active:scale-90 rounded-lg transition-all duration-200 flex-shrink-0 border border-white/[0.05] bg-white/[0.02]"
                              title="Sao chép số tài khoản"
                            >
                              {copiedField === 'account' ? (
                                <CheckCircle2 size={13} className="text-emerald-400" />
                              ) : (
                                <Copy size={13} className="text-slate-400 hover:text-white" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col border-t border-white/[0.04] pt-2">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono mb-0.5">Chủ tài khoản</span>
                          <span className="text-xs font-bold text-white font-mono uppercase">{accName}</span>
                        </div>

                        <div className="flex flex-col border-t border-white/[0.04] pt-2">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono mb-0.5">Số tiền</span>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-sm font-mono text-orange-400 font-black tracking-wide">{fmtMoney(pendingTopUp.amount)}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(pendingTopUp.amount.toString(), 'amount')}
                              className="p-1.5 hover:bg-white/[0.08] active:scale-90 rounded-lg transition-all duration-200 flex-shrink-0 border border-white/[0.05] bg-white/[0.02]"
                              title="Sao chép số tiền"
                            >
                              {copiedField === 'amount' ? (
                                <CheckCircle2 size={13} className="text-emerald-400" />
                              ) : (
                                <Copy size={13} className="text-slate-400 hover:text-white" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-col border-t border-white/[0.04] pt-2">
                          <span className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono mb-0.5">Nội dung chuyển khoản</span>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-mono text-slate-200 font-bold break-all">Nap vi PBMS</span>
                            <button
                              type="button"
                              onClick={() => handleCopy('Nap vi PBMS', 'desc')}
                              className="p-1.5 hover:bg-white/[0.08] active:scale-90 rounded-lg transition-all duration-200 flex-shrink-0 border border-white/[0.05] bg-white/[0.02]"
                              title="Sao chép nội dung chuyển khoản"
                            >
                              {copiedField === 'desc' ? (
                                <CheckCircle2 size={13} className="text-emerald-400" />
                              ) : (
                                <Copy size={13} className="text-slate-400 hover:text-white" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Warning notice box */}
                <div className="rounded-2xl border border-amber-500/10 bg-amber-500/[0.02] p-4 text-slate-400 flex items-start gap-3 shadow-inner">
                  <AlertCircle size={16} className="text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                  <p className="text-[10px] leading-relaxed font-medium">
                    <strong className="text-amber-300">Chú ý:</strong> Vui lòng thực hiện quét QR hoặc nhập chính xác thông tin chuyển khoản (bao gồm cả <strong className="text-white">Số tiền</strong> và <strong className="text-white">Nội dung</strong>) để hệ thống tự động nhận diện và ghi nhận số dư của bạn ngay lập tức.
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
                  <ExternalLink size={14} /> Mở trang thanh toán
                </button>
                <div className="flex gap-3 flex-1">
                  <button
                    type="button"
                    onClick={handleVerifyTopUp}
                    disabled={verifying}
                    className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:brightness-110 shadow-[0_0_20px_rgba(249,115,22,0.25)] text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 active:scale-95 disabled:opacity-50"
                  >
                    {verifying ? 'Đang xác thực...' : 'Kiểm tra lại'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingTopUp(null)}
                    disabled={verifying}
                    className="h-12 px-5 rounded-2xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 font-bold text-xs transition-all duration-300 active:scale-95"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
