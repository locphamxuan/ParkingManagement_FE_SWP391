import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  RefreshCw,
  Wallet,
  Plus,
  ExternalLink,
  CreditCard,
  QrCode,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import {
  managerApi,
  type BuildingWallet,
  type DailyRevenueResult,
  type PendingCashItem,
  type PaymentRecord,
} from '@/services/manager/managerApi';

const fmtVnd = (n: number | null | undefined) =>
  n != null ? `${n.toLocaleString('vi-VN')} ₫` : '—';

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', icon: Banknote, color: 'text-amber-400' },
  { id: 'wallet', label: 'Wallet', icon: Wallet, color: 'text-blue-400' },
  { id: 'qr', label: 'QR Code', icon: QrCode, color: 'text-purple-400' },
  { id: 'card', label: 'Card', icon: CreditCard, color: 'text-green-400' },
  { id: 'payos', label: 'PayOS', icon: CreditCard, color: 'text-cyan-400' },
];

export function ManagerWalletPage() {
  const { buildingId } = useBuildingContext();

  const [wallet, setWallet] = useState<BuildingWallet | null>(null);
  const [daily, setDaily] = useState<DailyRevenueResult | null>(null);
  const [pendingCash, setPendingCash] = useState<PendingCashItem[]>([]);
  const [pendingTotal, setPendingTotal] = useState(0);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [topupOpen, setTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupBusy, setTopupBusy] = useState(false);
  const [pendingTopup, setPendingTopup] = useState<{ orderCode: number; checkoutUrl: string; amount: number } | null>(null);

  // Payment stream by method
  const [selectedMethod, setSelectedMethod] = useState<string>('cash');
  const [paymentsByMethod, setPaymentsByMethod] = useState<Record<string, PaymentRecord[]>>({});
  const [paymentsLoading, setPaymentsLoading] = useState(false);

  // Không setLoading(true) ở đây — poll nền 30s sẽ làm nháy màn hình loading toàn trang.
  const refresh = useCallback(async () => {
    if (!buildingId) return;
    setError(null);
    try {
      const [walletRes, dailyRes, pendingRes] = await Promise.all([
        managerApi.wallet.get(buildingId),
        managerApi.wallet.getDailyRevenue(buildingId),
        managerApi.wallet.listPendingCash(buildingId),
      ]);
      setWallet((walletRes as { data?: { wallet: BuildingWallet } })?.data?.wallet ?? null);
      setDaily((dailyRes as { data?: DailyRevenueResult })?.data ?? null);
      const pendingData = (pendingRes as { data?: { items: PendingCashItem[]; pendingTotal: number } })?.data;
      setPendingCash(pendingData?.items ?? []);
      setPendingTotal(pendingData?.pendingTotal ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load wallet data');
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  // Load payments by method
  const loadPaymentsByMethod = useCallback(
    async (method: string) => {
      if (!buildingId) return;
      setPaymentsLoading(true);
      try {
        const res = await managerApi.wallet.listPayments(buildingId, { method, limit: '50' });
        const data = (res as { data?: { items: PaymentRecord[] } })?.data;
        setPaymentsByMethod((prev) => ({
          ...prev,
          [method]: data?.items ?? [],
        }));
      } catch (err) {
        console.error(`Failed to load payments for method ${method}:`, err);
      } finally {
        setPaymentsLoading(false);
      }
    },
    [buildingId]
  );

  // Tải lần đầu + tự làm mới mỗi 30s (đồng bộ cách làm với trang Sessions).
  useEffect(() => {
    setLoading(true);
    refresh();
    const timer = setInterval(refresh, 30_000);
    return () => clearInterval(timer);
  }, [refresh]);

  // Load payments for selected method + auto-refresh every 30s
  useEffect(() => {
    loadPaymentsByMethod(selectedMethod);
    const timer = setInterval(() => loadPaymentsByMethod(selectedMethod), 30_000);
    return () => clearInterval(timer);
  }, [selectedMethod, loadPaymentsByMethod]);

  const handleInitiateTopup = useCallback(async () => {
    if (!buildingId) return;
    const amount = Number(topupAmount);
    if (!amount || amount <= 0) {
      setMessage({ type: 'err', text: 'Top-up amount must be greater than 0.' });
      return;
    }
    setTopupBusy(true);
    setMessage(null);
    try {
      const res = await managerApi.wallet.initiateTopup(buildingId, amount);
      const data = (res as { data?: { orderCode: number; checkoutUrl: string } })?.data;
      if (data?.checkoutUrl) {
        setPendingTopup({ orderCode: data.orderCode, checkoutUrl: data.checkoutUrl, amount });
        setTopupOpen(false);
        setTopupAmount('');
        window.open(data.checkoutUrl, '_blank', 'noopener');
      }
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Failed to initiate top-up.' });
    } finally {
      setTopupBusy(false);
    }
  }, [buildingId, topupAmount]);

  const handleVerifyTopup = useCallback(async () => {
    if (!buildingId || !pendingTopup) return;
    setTopupBusy(true);
    try {
      const res = await managerApi.wallet.verifyTopup(buildingId, pendingTopup.orderCode);
      const status = (res as { data?: { status?: string } })?.data?.status;
      if (status === 'success') {
        setMessage({ type: 'ok', text: `Added ${fmtVnd(pendingTopup.amount)} to the building wallet.` });
        setPendingTopup(null);
        await refresh();
      } else {
        setMessage({ type: 'err', text: 'Payment not received yet. Complete the transaction and try again.' });
      }
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Failed to verify top-up.' });
    } finally {
      setTopupBusy(false);
    }
  }, [buildingId, pendingTopup, refresh]);

  const handleConfirmCash = useCallback(async (paymentId: string) => {
    if (!buildingId) return;
    setConfirmingId(paymentId);
    setMessage(null);
    try {
      await managerApi.wallet.confirmCash(buildingId, paymentId);
      setMessage({ type: 'ok', text: 'Cash receipt confirmed and added to the building wallet.' });
      await refresh();
    } catch (err) {
      setMessage({ type: 'err', text: err instanceof Error ? err.message : 'Failed to confirm cash receipt.' });
    } finally {
      setConfirmingId(null);
    }
  }, [buildingId, refresh]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <RefreshCw size={14} className="animate-spin" /> Loading building wallet...
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet size={22} className="text-primary" />
          <div>
            <h2 className="text-base font-bold text-foreground">Building Wallet</h2>
            <p className="text-xs text-muted-foreground">
              100% of parking revenue is retained in the building wallet.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={refresh} className="gap-2 text-xs">
            <RefreshCw size={13} /> Refresh
          </Button>
          <Button onClick={() => setTopupOpen((v) => !v)} className="gap-2 text-xs">
            <Plus size={13} /> Top Up
          </Button>
        </div>
      </div>

      {/* Nạp ví tòa nhà (PayOS) */}
      {topupOpen && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card/50 p-4">
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Top-up Amount (VND)
            </label>
            <Input
              type="number"
              min={1}
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              placeholder="e.g. 500000"
              className="w-48"
            />
          </div>
          <Button onClick={handleInitiateTopup} disabled={topupBusy} className="gap-2">
            {topupBusy ? <RefreshCw size={13} className="animate-spin" /> : <ExternalLink size={13} />}
            Generate PayOS Payment Link
          </Button>
        </div>
      )}

      {pendingTopup && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/25 bg-amber-500/5 px-4 py-3">
          <p className="text-sm text-amber-300">
            Awaiting payment of {fmtVnd(pendingTopup.amount)}. Complete it on the PayOS gateway, then confirm.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => window.open(pendingTopup.checkoutUrl, '_blank', 'noopener')} className="gap-1.5">
              <ExternalLink size={13} /> Reopen Gateway
            </Button>
            <Button size="sm" onClick={handleVerifyTopup} disabled={topupBusy} className="gap-1.5">
              {topupBusy ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              I've Paid
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          <AlertTriangle size={14} className="shrink-0" /> {error}
        </div>
      )}

      {message && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            message.type === 'ok'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
          }`}
        >
          {message.type === 'ok' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          {message.text}
        </div>
      )}

      {/* Thẻ tổng quan */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Current Balance
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">{fmtVnd(wallet?.balance)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Today's Revenue
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-400">{fmtVnd(daily?.totalRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tiền mặt chờ xác nhận — manager "Thu nhận" để cộng vào ví building */}
      <Card className={pendingCash.length > 0 ? 'border-amber-500/30' : undefined}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2 text-sm">
            <span className="flex items-center gap-2">
              <Banknote size={15} className="text-amber-400" />
              Cash Pending Confirmation
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                {pendingCash.length}
              </span>
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              Total: <strong className="text-amber-400">{fmtVnd(pendingTotal)}</strong>
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingCash.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">No cash awaiting confirmation.</p>
          ) : (
            <div className="grid gap-2">
              {pendingCash.map((p) => (
                <div key={p._id} className="flex items-center justify-between gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="rounded border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 font-mono text-xs font-bold text-amber-300">
                      {p.parkingSession?.plateNumber ?? '—'}
                    </span>
                    <div>
                      <p className="font-mono text-sm font-bold text-foreground">{fmtVnd(p.amount)}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {p.staff?.fullName ? `Collected by ${p.staff.fullName} · ` : ''}{fmtTime(p.createdAt)}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleConfirmCash(p._id)}
                    disabled={confirmingId === p._id}
                    className="gap-1.5"
                  >
                    {confirmingId === p._id ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
                    Collect
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lịch sử giao dịch */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Revenue Stream by Payment Method</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {/* Tabs for payment methods */}
          <div className="flex flex-wrap gap-2">
            {PAYMENT_METHODS.map((method) => {
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    selectedMethod === method.id
                      ? 'border border-primary bg-primary/10 text-primary'
                      : 'border border-border bg-card hover:bg-card/80'
                  }`}
                >
                  <Icon size={14} className={method.color} />
                  {method.label}
                </button>
              );
            })}
          </div>

          {/* Payments list for selected method */}
          <div className="pt-2">
            {paymentsLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <RefreshCw size={14} className="animate-spin" /> Loading payments...
              </div>
            ) : paymentsByMethod[selectedMethod]?.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No payments via {PAYMENT_METHODS.find((m) => m.id === selectedMethod)?.label} yet.
              </p>
            ) : (
              <div className="grid gap-2 max-h-96 overflow-y-auto">
                {paymentsByMethod[selectedMethod]?.map((payment) => (
                  <div
                    key={payment._id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card/50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-xs font-mono font-bold text-muted-foreground">
                        {payment.parkingSession?.plateNumber ?? 'N/A'}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">
                          {payment.user?.fullName || payment.staff?.fullName || 'Unknown'}
                        </p>
                        <p className="text-xs text-muted-foreground">{fmtTime(payment.createdAt)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-emerald-400">{fmtVnd(payment.amount)}</p>
                      <span className="text-xs text-muted-foreground capitalize">{payment.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
