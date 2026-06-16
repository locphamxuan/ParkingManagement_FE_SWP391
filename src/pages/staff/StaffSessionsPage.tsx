import { useCallback, useEffect, useState } from 'react';
import { Banknote, Wallet, QrCode, CircleDollarSign, RefreshCw, Car } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { staffApi, type ShiftRevenueSummary } from '@/services/staff/staffApi';

const fmtMoney = (n?: number | null) => (n != null ? `${n.toLocaleString('vi-VN')} ₫` : '—');
const fmtTime = (s?: string | null) =>
  s ? new Date(s).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = (s?: string | null) =>
  s ? new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';

const METHOD_LABELS: Record<string, string> = {
  cash: 'Tiền mặt',
  wallet: 'Trừ ví',
  qr: 'Chuyển khoản',
  payos: 'Chuyển khoản',
  card: 'Thẻ',
};

/**
 * Doanh thu ca — tiền nhân viên cổng ra đã thu trong NGÀY HÔM NAY, tách theo
 * phương thức (tiền mặt / ví / QR-chuyển khoản) + danh sách từng lượt.
 */
export function StaffSessionsPage() {
  const { buildingId } = useBuildingContext();
  const [data, setData] = useState<ShiftRevenueSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!buildingId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await staffApi.sessions.myShiftRevenue(buildingId);
      setData((res as { data?: ShiftRevenueSummary })?.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tải doanh thu ca thất bại');
    } finally {
      setLoading(false);
    }
  }, [buildingId]);

  useEffect(() => {
    void refresh();
    const timer = setInterval(() => void refresh(), 30_000);
    return () => clearInterval(timer);
  }, [refresh]);

  const stats = [
    { label: 'Tiền mặt', value: data?.byMethod.cash ?? 0, icon: Banknote, border: 'border-emerald-500/20 bg-emerald-500/5', color: 'text-emerald-500' },
    { label: 'Trừ ví', value: data?.byMethod.wallet ?? 0, icon: Wallet, border: 'border-violet-500/20 bg-violet-500/5', color: 'text-violet-500' },
    { label: 'Chuyển khoản / QR', value: data?.byMethod.online ?? 0, icon: QrCode, border: 'border-sky-500/20 bg-sky-500/5', color: 'text-sky-500' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CircleDollarSign size={18} className="text-primary" />
          <div>
            <h2 className="text-base font-semibold text-foreground">Doanh thu ca</h2>
            <p className="text-xs text-muted-foreground">
              Tiền bạn đã thu khi cho xe ra — hôm nay {fmtDate(data?.date)}
            </p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={refresh} className="gap-1.5">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Làm mới
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-500">{error}</div>
      )}

      {/* Tổng + số lượt */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="border border-primary/25 bg-primary/5">
          <CardContent className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tổng đã thu hôm nay</p>
            <p className="mt-2 text-3xl font-black text-primary">{loading ? '—' : fmtMoney(data?.total)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Số lượt cho xe ra</p>
            <p className="mt-2 text-3xl font-black text-foreground">{loading ? '—' : (data?.count ?? 0)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tách theo phương thức */}
      <div className="grid gap-3 sm:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className={`border ${s.border}`}>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Icon size={14} className={s.color} />
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{s.label}</p>
                </div>
                <p className="text-xl font-bold text-foreground">{loading ? '—' : fmtMoney(s.value)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Danh sách lượt đã thu */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Car size={14} className="text-primary" /> Các lượt đã thu
            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
              {data?.items.length ?? 0}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Đang tải...</p>
          ) : !data || data.items.length === 0 ? (
            <div className="py-8 text-center">
              <CircleDollarSign size={28} className="mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Chưa thu khoản nào trong ca hôm nay.</p>
            </div>
          ) : (
            <div className="grid gap-2">
              {data.items.map((it) => (
                <div key={it._id} className="flex items-center justify-between rounded-lg border border-border bg-card/50 px-4 py-2.5">
                  <div className="flex items-center gap-3">
                    <span className="rounded border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 font-mono text-xs font-bold text-amber-300">
                      {it.plateNumber ?? '—'}
                    </span>
                    <span className="text-xs text-muted-foreground">{METHOD_LABELS[it.method] ?? it.method}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-mono font-bold text-emerald-400">+{fmtMoney(it.amount)}</p>
                    <p className="text-[11px] text-muted-foreground">{fmtTime(it.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
