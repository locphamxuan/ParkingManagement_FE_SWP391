import { useCallback, useEffect, useState } from 'react';
import { Building2, CircleDollarSign, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { adminApi, type RevenueReport } from '@/services/admin/adminApi';

const fmtVnd = (n: number | undefined | null) =>
  n != null ? `${n.toLocaleString('vi-VN')} ₫` : '—';

const isoDay = (d: Date) => d.toISOString().slice(0, 10);

export function RevenueAnalyticsPage() {
  const [from, setFrom] = useState(() => isoDay(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)));
  const [to, setTo] = useState(() => isoDay(new Date()));
  const [report, setReport] = useState<RevenueReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.revenue.report({ from, to });
      setReport((res as { data?: RevenueReport })?.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải báo cáo doanh thu.');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  useEffect(() => { void loadReport(); }, [loadReport]);

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex items-center gap-2">
            <CircleDollarSign size={18} className="text-emerald-400" />
            <div>
              <h3 className="font-semibold text-foreground">Doanh thu gửi xe theo tòa nhà</h3>
              <p className="text-xs text-muted-foreground">
                Tổng hợp doanh thu gửi xe của các tòa nhà trong khoảng thời gian đã chọn
              </p>
            </div>
          </div>
          <div className="flex items-end gap-2">
            <div className="grid gap-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Từ ngày</label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="w-40" />
            </div>
            <div className="grid gap-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Đến ngày</label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="w-40" />
            </div>
            <Button variant="secondary" size="sm" onClick={loadReport} className="gap-1.5">
              <RefreshCw size={13} /> Làm mới
            </Button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-500">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <RefreshCw size={14} className="animate-spin" /> Đang tải báo cáo doanh thu...
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="border-emerald-500/20 bg-emerald-500/5 sm:col-span-1">
              <CardContent className="p-5">
                <div className="mb-2 flex items-center gap-2">
                  <CircleDollarSign size={14} className="text-emerald-500" />
                  <p className="text-xs font-black uppercase tracking-wider text-emerald-600/70">
                    Tổng doanh thu
                  </p>
                </div>
                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                  {fmtVnd(report?.grandTotal)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {report?.items?.length ?? 0} tòa nhà có doanh thu
                </p>
              </CardContent>
            </Card>

            <Card className="sm:col-span-2">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Building2 size={14} className="text-primary" />
                  Doanh thu theo tòa nhà
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!report?.items?.length ? (
                  <p className="py-2 text-sm text-muted-foreground">Chưa có doanh thu trong khoảng thời gian này.</p>
                ) : (
                  <div className="space-y-2">
                    {report.items.map((r) => (
                      <div key={r.buildingId} className="flex items-center justify-between rounded-lg border border-border bg-card/50 px-3 py-2.5">
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {r.buildingCode && (
                              <span className="mr-1.5 font-mono text-xs text-muted-foreground">{r.buildingCode}</span>
                            )}
                            {r.buildingName ?? 'Tòa nhà'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {r.sessionCount} lượt · Tiền mặt {fmtVnd(r.cashAmount)} · Ví {fmtVnd(r.walletAmount)} · QR {fmtVnd(r.qrAmount)}
                          </p>
                        </div>
                        <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {fmtVnd(r.totalRevenue)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </section>
    </div>
  );
}
