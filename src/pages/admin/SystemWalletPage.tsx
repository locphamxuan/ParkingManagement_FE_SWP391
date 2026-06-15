import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Wallet, AlertTriangle, Plus, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ModalForm } from '@/components/modals/ModalForm';
import { CustomSelect } from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import {
  adminApi,
  type SystemWallet,
  type AdminBuilding,
} from '@/services/admin/adminApi';

function todayInput(): string {
  return new Date().toISOString().slice(0, 10);
}

const fmtVnd = (n: number | null | undefined) =>
  n != null ? `${n.toLocaleString('vi-VN')} ₫` : '—';

const fmtTime = (iso: string) =>
  new Date(iso).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });

export function SystemWalletPage() {
  const [wallet, setWallet] = useState<SystemWallet | null>(null);
  const [buildings, setBuildings] = useState<AdminBuilding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState('');
  const [showDist, setShowDist] = useState(false);
  const [distForm, setDistForm] = useState({
    buildingId: '',
    amount: '',
    periodStart: todayInput(),
    periodEnd: todayInput(),
    note: '',
  });
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [walletRes, buildingsRes] = await Promise.all([
        adminApi.wallet.get(),
        adminApi.buildings.list({ limit: '200' }),
      ]);
      setWallet((walletRes as { data?: { wallet: SystemWallet } })?.data?.wallet ?? null);
      setBuildings((buildingsRes as { data?: { items: AdminBuilding[] } })?.data?.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tải dữ liệu ví hệ thống thất bại');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleTopup = async () => {
    const amount = Number(topupAmount);
    if (!amount || amount <= 0) {
      setError('Số tiền nạp phải lớn hơn 0');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await adminApi.wallet.topup(amount);
      setShowTopup(false);
      setTopupAmount('');
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nạp ví thất bại');
    } finally {
      setBusy(false);
    }
  };

  const handleDistribute = async () => {
    const amount = Number(distForm.amount);
    if (!distForm.buildingId) {
      setError('Chọn tòa nhà nhận tiền');
      return;
    }
    if (!amount || amount <= 0) {
      setError('Số tiền phân phối phải lớn hơn 0');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await adminApi.wallet.distribute({
        buildingId: distForm.buildingId,
        amount,
        periodStart: distForm.periodStart,
        periodEnd: distForm.periodEnd,
        note: distForm.note.trim() || undefined,
      });
      setShowDist(false);
      setDistForm({ buildingId: '', amount: '', periodStart: todayInput(), periodEnd: todayInput(), note: '' });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Phân phối thất bại');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <RefreshCw size={14} className="animate-spin" /> Đang tải ví hệ thống...
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
            <h2 className="text-base font-bold text-foreground">Ví hệ thống</h2>
            <p className="text-xs text-muted-foreground">
              Ví tổng — nhận tiền khi quản lý mua gói dịch vụ hệ thống
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={refresh} className="gap-2 text-xs">
            <RefreshCw size={13} /> Làm mới
          </Button>
          <Button variant="secondary" onClick={() => setShowTopup(true)} className="gap-2 text-xs">
            <Plus size={13} /> Nạp ví
          </Button>
          <Button onClick={() => setShowDist(true)} className="gap-2 text-xs">
            <Send size={13} /> Phân phối
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-400">
          <AlertTriangle size={14} className="shrink-0" /> {error}
        </div>
      )}

      {/* Thẻ tổng quan */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
              Số dư hiện tại
            </p>
            <p className="mt-2 text-3xl font-bold text-foreground">
              {fmtVnd(wallet?.balance)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Cập nhật lần cuối: {wallet?.updatedAt ? fmtTime(wallet.updatedAt) : '—'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardContent className="p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-400/70">
              Tổng đã phân phối cho tòa nhà
            </p>
            <p className="mt-2 text-3xl font-bold text-amber-400">
              {fmtVnd(wallet?.totalDistributed)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Tổng lũy kế đã phân phối ra
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modal: Nạp ví hệ thống */}
      <ModalForm
        open={showTopup}
        onOpenChange={(open) => { if (!open) setShowTopup(false); }}
        title="Nạp tiền vào ví hệ thống"
        onSubmit={handleTopup}
      >
        <div className="grid gap-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Số tiền (VND)</label>
          <Input
            type="number"
            min={1}
            value={topupAmount}
            onChange={(e) => setTopupAmount(e.target.value)}
            placeholder="VD: 1000000"
          />
          {busy ? <p className="text-xs text-muted-foreground">Đang xử lý...</p> : null}
        </div>
      </ModalForm>

      {/* Modal: Phân phối cho tòa nhà */}
      <ModalForm
        open={showDist}
        onOpenChange={(open) => { if (!open) setShowDist(false); }}
        title="Phân phối tiền cho tòa nhà"
        onSubmit={handleDistribute}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="grid gap-1.5 md:col-span-2">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Tòa nhà</label>
            <CustomSelect
              className="h-10"
              value={distForm.buildingId}
              onChange={(val) => setDistForm((f) => ({ ...f, buildingId: val }))}
              placeholder="-- Chọn tòa nhà --"
              options={[
                { value: '', label: '-- Chọn tòa nhà --' },
                ...buildings.map((b) => ({
                  value: b._id,
                  label: `${b.code} · ${b.name}`
                }))
              ]}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Số tiền (VND)</label>
            <Input
              type="number"
              min={1}
              value={distForm.amount}
              onChange={(e) => setDistForm((f) => ({ ...f, amount: e.target.value }))}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Ghi chú</label>
            <Input
              value={distForm.note}
              onChange={(e) => setDistForm((f) => ({ ...f, note: e.target.value }))}
              placeholder="VD: Chia doanh thu tháng 6"
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Từ ngày</label>
            <DatePicker
              value={distForm.periodStart}
              onChange={(val) => setDistForm((f) => ({ ...f, periodStart: val }))}
            />
          </div>
          <div className="grid gap-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">Đến ngày</label>
            <DatePicker
              value={distForm.periodEnd}
              onChange={(val) => setDistForm((f) => ({ ...f, periodEnd: val }))}
            />
          </div>
        </div>
        {busy ? <p className="mt-2 text-xs text-muted-foreground">Đang xử lý...</p> : null}
      </ModalForm>
    </div>
  );
}
