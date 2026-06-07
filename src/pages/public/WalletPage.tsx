import { useEffect, useState, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
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
  Check,
  Clock,
  AlertCircle,
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
    <main className="relative min-h-screen overflow-hidden bg-[#070b16] text-slate-100">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(148,163,184,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.035)_1px,transparent_1px),linear-gradient(135deg,rgba(249,115,22,0.12),transparent_32%,rgba(34,211,238,0.08)_72%,transparent)] bg-[size:44px_44px,44px_44px,100%_100%]"
      />
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* Nav */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-900/75 p-4 shadow-2xl backdrop-blur-xl"
        >
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2 text-xs font-black uppercase tracking-wider text-orange-300 transition hover:border-orange-400/40 hover:bg-orange-500/10"
          >
            <ArrowLeft size={14} /> Trang chủ
          </button>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => navigate('/reservations')} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2 text-xs font-black uppercase tracking-wider text-cyan-300 transition hover:border-cyan-400/40 hover:bg-cyan-500/10">
              <CalendarClock size={14} /> Đặt chỗ
            </button>
            <button type="button" onClick={() => navigate('/profile')} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/80 px-4 py-2 text-xs font-black uppercase tracking-wider text-orange-300 transition hover:border-orange-400/40 hover:bg-orange-500/10">
              <User size={14} /> Hồ sơ
            </button>
            <button type="button" onClick={refreshWallet} className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/80 px-3 py-2 text-xs text-slate-400 transition hover:text-white">
              <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            </button>
          </div>
        </motion.div>

        {/* Balance card + Quick top-up */}
        <section className="mb-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          {/* Balance */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl border border-orange-300/25 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(88,28,5,0.72)_48%,rgba(8,47,73,0.82))] p-6 shadow-[0_22px_70px_rgba(0,0,0,0.38),0_0_45px_rgba(249,115,22,0.12)]"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500 via-amber-300 to-cyan-300" />
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-orange-200">Ví PBMS</p>
                <h1 className="mt-3 text-4xl font-black text-white drop-shadow">
                  {isLoading ? '—' : fmtMoney(wallet?.balance ?? 0)}
                </h1>
                <p className="mt-2 text-sm font-semibold text-slate-300">
                  {session.displayName || session.email} · Số dư khả dụng
                </p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                <WalletCards size={32} className="text-amber-200" />
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Tổng tiền vào</p>
                <p className="mt-2 text-lg font-black text-emerald-300">{fmtMoney(totalCredit)}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-slate-950/55 p-4 backdrop-blur-sm">
                <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">Tổng tiền ra</p>
                <p className="mt-2 text-lg font-black text-orange-300">{fmtMoney(totalDebit)}</p>
              </div>
            </div>
          </motion.div>

          {/* Nạp ví nhanh */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl backdrop-blur-xl"
          >
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <Plus size={16} className="text-emerald-300" /> Nạp ví
            </h2>

            <div className="grid grid-cols-2 gap-2">
              {TOP_UP_OPTIONS.map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setSelectedAmount(amount)}
                  className={`rounded-xl border px-3 py-3 text-sm font-black transition ${
                    selectedAmount === amount
                      ? 'border-orange-300/60 bg-orange-500/25 text-orange-100'
                      : 'border-white/10 bg-slate-950/70 text-slate-300 hover:border-white/25'
                  }`}
                >
                  {fmtMoney(amount)}
                </button>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <input
                type="number"
                min="10000"
                step="1000"
                value={customAmount}
                onChange={(e) => { setCustomAmount(e.target.value); setCustomError(null); }}
                placeholder="Số tiền khác (tối thiểu 10.000)"
                className="flex-1 rounded-xl border border-slate-700/80 bg-[#070b12] px-3 py-2.5 text-sm font-semibold text-white placeholder-slate-500 outline-none focus:border-orange-300/60"
              />
              <button
                type="button"
                onClick={handleCustomTopUp}
                disabled={isSubmitting}
                className="rounded-xl border border-orange-300/20 bg-gradient-to-r from-orange-500 to-amber-400 px-4 py-2.5 text-xs font-black text-slate-950 transition hover:brightness-110 disabled:opacity-60"
              >
                OK
              </button>
            </div>
            {customError && <p className="mt-1 text-xs text-rose-300">{customError}</p>}

            <button
              type="button"
              onClick={() => handleTopUp(selectedAmount)}
              disabled={isSubmitting}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-300 text-sm font-black uppercase tracking-wider text-slate-950 shadow-[0_14px_30px_rgba(249,115,22,0.22)] transition hover:brightness-110 disabled:opacity-60"
            >
              <QrCode size={16} />
              {isSubmitting ? 'Đang tạo...' : `Nạp ${fmtMoney(selectedAmount)}`}
            </button>

            {message && (
              <div className={`mt-4 flex items-center gap-2 rounded-2xl border p-3 text-xs font-semibold ${message.type === 'ok' ? 'border-emerald-400/30 bg-emerald-500/10 text-emerald-300' : 'border-rose-400/30 bg-rose-500/10 text-rose-300'}`}>
                {message.type === 'ok' ? <CheckCircle2 size={14} /> : null}
                {message.text}
              </div>
            )}
          </motion.div>
        </section>

        {/* Lịch sử giao dịch */}
        <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-6 shadow-2xl backdrop-blur-xl">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-white">
              <ReceiptText size={16} className="text-cyan-300" /> Lịch sử giao dịch
            </h2>
            <div className="flex rounded-2xl border border-white/10 bg-slate-950/80 p-1">
              {(['all', 'credit', 'debit'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFilter(f)}
                  className={`rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition ${
                    filter === f ? 'bg-orange-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'Tất cả' : f === 'credit' ? 'Tiền vào' : 'Tiền ra'}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <p className="py-6 text-center text-sm text-slate-500">Đang tải...</p>
            ) : filteredTx.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-slate-950/65 p-8 text-center">
                <WalletCards size={28} className="mx-auto text-slate-600" />
                <p className="mt-3 text-sm font-black text-slate-400">Chưa có giao dịch.</p>
              </div>
            ) : (
              filteredTx.map((tx) => {
                const isCredit = tx.type === 'credit';
                const Icon = isCredit ? ArrowDownLeft : ArrowUpRight;
                return (
                  <div key={tx._id} className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/65 p-4 transition hover:-translate-y-0.5 hover:border-white/20 sm:grid-cols-[auto_1fr_auto] sm:items-center">
                    <div className={`grid h-10 w-10 place-items-center rounded-xl border ${isCredit ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-300' : 'border-orange-400/20 bg-orange-500/10 text-orange-300'}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-black text-white">{TX_REASON_LABELS[tx.reason] ?? tx.reason}</p>
                      {tx.note && <p className="mt-0.5 text-[11px] text-slate-500">{tx.note}</p>}
                      <p className="mt-0.5 text-[11px] text-slate-500">{fmtTime(tx.createdAt)}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className={`text-sm font-black ${isCredit ? 'text-emerald-300' : 'text-orange-300'}`}>
                        {isCredit ? '+' : '-'}{fmtMoney(tx.amount)}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">Số dư: {fmtMoney(tx.balanceAfter)}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Modal xác nhận nạp ví (PayOS QR) */}
      {pendingTopUp && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          onClick={() => { if (!verifying && !isSubmitting) setPendingTopUp(null); }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-3xl border border-white/10 bg-slate-950 shadow-[0_0_50px_rgba(249,115,22,0.18)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 bg-gradient-to-r from-orange-500/10 to-amber-500/10 px-6 py-4">
              <div>
                <p className="font-mono text-[9px] font-black uppercase tracking-[0.2em] text-orange-400">Thanh toán PayOS</p>
                <h2 className="text-base font-black text-white">Nạp tiền vào ví</h2>
              </div>
              <button
                type="button"
                onClick={() => setPendingTopUp(null)}
                disabled={verifying}
                className="rounded-full border border-white/10 p-2 text-slate-400 hover:text-white transition hover:bg-white/5"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <p className="text-xs text-slate-400 text-center leading-relaxed">
                Mở ứng dụng Ngân hàng (Mobile Banking) quét mã QR bên dưới, hoặc copy thông tin chuyển khoản để hoàn tất giao dịch.
              </p>

              {/* QR and Transfer Info Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
                {/* QR Code Container */}
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="relative p-4 bg-white rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-orange-500/20">
                    <canvas ref={qrCanvasRef} />
                    <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-orange-500/10 to-amber-500/10 opacity-30 blur pointer-events-none" />
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-orange-400 font-mono font-bold uppercase tracking-wider animate-pulse">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-orange-500"></span>
                    </span>
                    Đang chờ thanh toán...
                  </div>
                </div>

                {/* Account Details */}
                {(() => {
                  const qrInfo = parseVietQR(pendingTopUp.qrCode);
                  const bankName = qrInfo ? (BANK_BIN_MAP[qrInfo.bankBin] || `Ngân hàng (BIN: ${qrInfo.bankBin})`) : 'MB Bank (TMCP Quân Đội)';
                  const accNo = qrInfo?.accountNumber || 'VQRQAJNOG7846';
                  const accName = qrInfo?.accountName || 'PHAM XUAN LOC';

                  return (
                    <div className="space-y-3.5 rounded-2xl bg-slate-900/60 border border-white/5 p-4">
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono mb-0.5">Ngân hàng thụ hưởng</p>
                        <p className="text-xs font-semibold text-white">{bankName}</p>
                      </div>

                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono mb-0.5">Số tài khoản</p>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-mono text-cyan-400 font-black tracking-wide">{accNo}</p>
                          <button
                            type="button"
                            onClick={() => handleCopy(accNo, 'account')}
                            className="p-1.5 hover:bg-white/5 rounded-lg transition-colors duration-200 flex-shrink-0"
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

                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono mb-0.5">Chủ tài khoản</p>
                        <p className="text-xs font-semibold text-white font-mono uppercase">{accName}</p>
                      </div>

                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono mb-0.5">Số tiền</p>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-mono text-orange-400 font-black tracking-wide">{fmtMoney(pendingTopUp.amount)}</p>
                          <button
                            type="button"
                            onClick={() => handleCopy(pendingTopUp.amount.toString(), 'amount')}
                            className="p-1.5 hover:bg-white/5 rounded-lg transition-colors duration-200 flex-shrink-0"
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

                      <div>
                        <p className="text-[9px] font-black uppercase tracking-wider text-slate-500 font-mono mb-0.5">Nội dung chuyển khoản</p>
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-mono text-slate-200 font-bold break-all">Nap vi PBMS</p>
                          <button
                            type="button"
                            onClick={() => handleCopy('Nap vi PBMS', 'desc')}
                            className="p-1.5 hover:bg-white/5 rounded-lg transition-colors duration-200 flex-shrink-0"
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

              {/* Warning box */}
              <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-3.5 text-slate-400 flex items-start gap-2.5">
                <AlertCircle size={15} className="text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[10px] leading-relaxed font-semibold">
                  <strong>Chú ý:</strong> Vui lòng quét mã QR hoặc nhập chính xác thông tin chuyển khoản (đặc biệt là <strong>Số tiền</strong> và <strong>Nội dung</strong>) để hệ thống tự động cộng tiền ngay lập tức.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => window.open(pendingTopUp.checkoutUrl, '_blank', 'noopener')}
                  className="flex-1 h-11 rounded-xl border border-white/10 hover:border-white/20 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2"
                >
                  🌐 Mở trang thanh toán
                </button>
                <div className="flex gap-3 flex-1">
                  <button
                    type="button"
                    onClick={handleVerifyTopUp}
                    disabled={verifying}
                    className="flex-1 h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-200 hover:scale-102 hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] disabled:opacity-50"
                  >
                    {verifying ? 'Đang kiểm tra...' : 'Kiểm tra lại'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingTopUp(null)}
                    disabled={verifying}
                    className="h-11 px-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-all duration-200"
                  >
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </main>
  );
}

