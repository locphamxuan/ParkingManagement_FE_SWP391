import { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  TrendingUp,
  ArrowUpRight,
  Wallet,
  Crown,
  CalendarClock,
  Plus,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import {
  managerApi,
  type BuildingWallet,
  type BuildingWalletTransaction,
  type DailyRevenueResult,
  type AdminSubscriptionPackage,
  type SubscriptionStatus,
} from '@/services/manager/managerApi';

const fmtVnd = (n: number | null | undefined) =>
  n != null ? `${n.toLocaleString('vi-VN')} ₫` : '—';

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

const fmtDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString('vi-VN') : '—';

const TX_REASON_LABELS: Record<string, string> = {
  parking_fee: 'Phí gửi xe',
  reservation_fee: 'Phí đặt chỗ',
  topup: 'Nạp ví',
  admin_subscription: 'Mua gói hệ thống',
  transfer_to_system: 'Chuyển cho Admin',
  refund: 'Hoàn tiền',
};

export function ManagerWalletPage() {
  const { buildingId, refreshSubscription } = useBuildingContext();

  const [wallet, setWallet] = useState<BuildingWallet | null>(null);
  const [daily, setDaily] = useState<DailyRevenueResult | null>(null);
  const [transactions, setTransactions] = useState<BuildingWalletTransaction[]>([]);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [packages, setPackages] = useState<AdminSubscriptionPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscribingId, setSubscribingId] = useState<string | null>(null);
  const [subMessage, setSubMessage] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const [topupOpen, setTopupOpen] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [topupBusy, setTopupBusy] = useState(false);
  const [pendingTopup, setPendingTopup] = useState<{ orderCode: number; checkoutUrl: string; amount: number } | null>(null);

  const refresh = useCallback(async () => {
    if (!buildingId) return;
    setLoading(true);
    setError(null);
    try {
      const [walletRes, dailyRes, txRes, subRes, pkgRes] = await Promise.all([
        managerApi.wallet.get(buildingId),
        managerApi.wallet.getDailyRevenue(buildingId),
        managerApi.wallet.listTransactions(buildingId),
        managerApi.getSubscriptionStatus(buildingId),
        managerApi.wallet.listSubscriptionPackages(buildingId),
      ]);
      setWallet((walletRes as { data?: { wallet: BuildingWallet } })?.data?.wallet ?? null);
      setDaily((dailyRes as { data?: DailyRevenueResult })?.data ?? null);
      setTransactions((txRes as { data?: { items: BuildingWalletTransaction[] } })?.data?.items ?? []);
      setSubscription((subRes as { data?: SubscriptionStatus })?.data ?? null);
      setPackages((pkgRes as { data?: { items: AdminSubscriptionPackage[] } })?.data?.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tải dữ liệu ví thất bại');
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleSubscribe = useCallback(
    async (pkg: AdminSubscriptionPackage) => {
      if (!buildingId) return;
      if (!window.confirm(
        `Mua gói "${pkg.name}" với giá ${fmtVnd(pkg.price)}? Số tiền sẽ được trừ từ ví tòa nhà và chuyển cho Admin.`,
      )) return;
      setSubscribingId(pkg._id);
      setSubMessage(null);
      try {
        await managerApi.wallet.subscribe(buildingId, pkg._id);
        setSubMessage({ type: 'ok', text: `Đã kích hoạt gói "${pkg.name}" thành công.` });
        await refresh();
        refreshSubscription?.();
      } catch (err) {
        setSubMessage({ type: 'err', text: err instanceof Error ? err.message : 'Đăng ký gói thất bại.' });
      } finally {
        setSubscribingId(null);
      }
    },
    [buildingId, refresh, refreshSubscription],
  );

  const handleInitiateTopup = useCallback(async () => {
    if (!buildingId) return;
    const amount = Number(topupAmount);
    if (!amount || amount <= 0) {
      setSubMessage({ type: 'err', text: 'Số tiền nạp phải lớn hơn 0.' });
      return;
    }
    setTopupBusy(true);
    setSubMessage(null);
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
      setSubMessage({ type: 'err', text: err instanceof Error ? err.message : 'Không thể khởi tạo nạp ví.' });
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
        setSubMessage({ type: 'ok', text: `Đã nạp ${fmtVnd(pendingTopup.amount)} vào ví tòa nhà.` });
        setPendingTopup(null);
        await refresh();
      } else {
        setSubMessage({ type: 'err', text: 'Chưa nhận được thanh toán. Hoàn tất giao dịch rồi thử lại.' });
      }
    } catch (err) {
      setSubMessage({ type: 'err', text: err instanceof Error ? err.message : 'Xác nhận nạp ví thất bại.' });
    } finally {
      setTopupBusy(false);
    }
  }, [buildingId, pendingTopup, refresh]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <RefreshCw size={14} className="animate-spin" /> Đang tải ví tòa nhà...
      </div>
    );
  }

  const subActive = subscription?.active ?? false;

  return (
    <div className="grid gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Wallet size={22} className="text-primary" />
          <div>
            <h2 className="text-base font-bold text-foreground">Ví tòa nhà & Gói dịch vụ</h2>
            <p className="text-xs text-muted-foreground">
              Doanh thu giữ lại 100% trong ví tòa nhà. Mua gói dịch vụ hệ thống để mở khóa quản lý.
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={refresh} className="gap-2 text-xs">
            <RefreshCw size={13} /> Làm mới
          </Button>
          <Button onClick={() => setTopupOpen((v) => !v)} className="gap-2 text-xs">
            <Plus size={13} /> Nạp ví
          </Button>
        </div>
      </div>

      {/* Nạp ví tòa nhà (PayOS) */}
      {topupOpen && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-border bg-card/50 p-4">
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Số tiền nạp (VND)
            </label>
            <Input
              type="number"
              min={1}
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value)}
              placeholder="VD: 500000"
              className="w-48"
            />
          </div>
          <Button onClick={handleInitiateTopup} disabled={topupBusy} className="gap-2">
            {topupBusy ? <RefreshCw size={13} className="animate-spin" /> : <ExternalLink size={13} />}
            Tạo mã thanh toán PayOS
          </Button>
        </div>
      )}

      {pendingTopup && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-amber-500/25 bg-amber-500/5 px-4 py-3">
          <p className="text-sm text-amber-300">
            Đang chờ thanh toán {fmtVnd(pendingTopup.amount)}. Hoàn tất trên cổng PayOS rồi bấm xác nhận.
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={() => window.open(pendingTopup.checkoutUrl, '_blank', 'noopener')} className="gap-1.5">
              <ExternalLink size={13} /> Mở lại cổng
            </Button>
            <Button size="sm" onClick={handleVerifyTopup} disabled={topupBusy} className="gap-1.5">
              {topupBusy ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              Tôi đã thanh toán
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          <AlertTriangle size={14} className="shrink-0" /> {error}
        </div>
      )}

      {/* Thẻ tổng quan */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Số dư hiện tại
            </p>
            <p className="mt-2 text-2xl font-bold text-foreground">{fmtVnd(wallet?.balance)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Doanh thu hôm nay
            </p>
            <p className="mt-2 text-2xl font-bold text-emerald-400">{fmtVnd(daily?.totalRevenue)}</p>
          </CardContent>
        </Card>

        <Card className={subActive ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-amber-500/20 bg-amber-500/5'}>
          <CardContent className="p-5">
            <p className={`text-[10px] font-black uppercase tracking-widest ${subActive ? 'text-emerald-400/70' : 'text-amber-400/70'}`}>
              Gói dịch vụ hệ thống
            </p>
            <p className={`mt-2 text-lg font-bold ${subActive ? 'text-emerald-400' : 'text-amber-400'}`}>
              {subActive ? (subscription?.packageName ?? subscription?.package?.name ?? 'Đang hoạt động') : 'Chưa kích hoạt'}
            </p>
            <p className={`mt-1 text-xs ${subActive ? 'text-emerald-400/70' : 'text-amber-400/70'}`}>
              {subActive
                ? `Còn ${subscription?.daysRemaining ?? 0} ngày · hết hạn ${fmtDate(subscription?.endDate)}`
                : 'Mua gói bên dưới để mở khóa bảng điều khiển.'}
            </p>
          </CardContent>
        </Card>
      </div>

      {subMessage && (
        <div
          className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
            subMessage.type === 'ok'
              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
              : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
          }`}
        >
          {subMessage.type === 'ok' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
          {subMessage.text}
        </div>
      )}

      {/* Gói dịch vụ hệ thống (mua từ Admin) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Crown size={15} className="text-amber-400" />
            Gói dịch vụ hệ thống
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-3 rounded-lg border border-blue-500/20 bg-blue-500/5 px-4 py-3 text-xs text-blue-400">
            Hệ thống được bán theo dạng thuê bao: bạn mua một gói dịch vụ (tương tự gói phần mềm theo
            tháng). Tiền gói được trừ từ ví tòa nhà và chuyển cho Admin. Trong thời gian gói còn hiệu
            lực, bạn toàn quyền sử dụng bảng điều khiển quản lý.
          </div>

          {packages.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Admin chưa phát hành gói dịch vụ nào.
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => {
                const isCurrent = subActive && (subscription?.package?._id === pkg._id);
                return (
                  <div
                    key={pkg._id}
                    className={`flex flex-col rounded-xl border p-4 ${
                      isCurrent ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-border bg-card/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-foreground">{pkg.name}</p>
                      {isCurrent && (
                        <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          Đang dùng
                        </span>
                      )}
                    </div>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <CalendarClock size={12} /> {pkg.durationDays} ngày
                    </p>
                    <p className="mt-2 text-xl font-black text-amber-400">{fmtVnd(pkg.price)}</p>
                    {pkg.description && (
                      <p className="mt-1 text-xs text-muted-foreground">{pkg.description}</p>
                    )}
                    {(pkg.features?.length ?? 0) > 0 && (
                      <ul className="mt-2 space-y-1">
                        {pkg.features!.map((f, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                            <CheckCircle2 size={12} className="mt-0.5 shrink-0 text-emerald-400" />
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Button
                      className="mt-3 w-full gap-2"
                      disabled={subscribingId === pkg._id}
                      onClick={() => handleSubscribe(pkg)}
                    >
                      {subscribingId === pkg._id ? (
                        <RefreshCw size={13} className="animate-spin" />
                      ) : (
                        <Crown size={13} />
                      )}
                      {subActive ? 'Gia hạn / Đổi gói' : 'Mua gói'}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lịch sử giao dịch */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock size={15} className="text-primary" />
            Giao dịch gần đây
          </CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Chưa có giao dịch.</p>
          ) : (
            <div className="grid gap-2">
              {transactions.map((tx) => {
                const isCredit = tx.type === 'credit';
                return (
                  <div
                    key={tx._id}
                    className="flex items-center justify-between rounded-lg border border-border bg-card/50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          isCredit ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'
                        }`}
                      >
                        {isCredit ? <TrendingUp size={13} /> : <ArrowUpRight size={13} />}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {TX_REASON_LABELS[tx.reason] ?? tx.reason}
                        </p>
                        {tx.note && <p className="text-xs text-muted-foreground">{tx.note}</p>}
                        <p className="text-xs text-muted-foreground">
                          Số dư sau: {fmtVnd(tx.balanceAfter)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-mono font-bold ${isCredit ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isCredit ? '+' : '-'}{fmtVnd(tx.amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">{fmtTime(tx.createdAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
