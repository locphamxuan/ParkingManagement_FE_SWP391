import { useCallback, useEffect, useState } from 'react';
import { Building2, Crown, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { adminApi, type SubscriptionTransferReport } from '@/services/admin/adminApi';

const fmtVnd = (n: number | undefined | null) =>
  n != null ? `${n.toLocaleString('vi-VN')} ₫` : '—';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

export function RevenueAnalyticsPage() {
  const [subReport, setSubReport] = useState<SubscriptionTransferReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransfers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminApi.revenue.subscriptions();
      setSubReport((res as { data?: SubscriptionTransferReport })?.data ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải doanh thu gói dịch vụ.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadTransfers(); }, [loadTransfers]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <RefreshCw size={14} className="animate-spin" /> Đang tải phân tích doanh thu...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Doanh thu từ gói dịch vụ hệ thống (Manager mua gói của Admin) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown size={18} className="text-amber-400" />
            <div>
              <h3 className="font-semibold text-foreground">Doanh thu từ gói dịch vụ hệ thống</h3>
              <p className="text-xs text-muted-foreground">
                Tiền các quản lý thanh toán khi mua gói dịch vụ của hệ thống
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={loadTransfers} className="gap-1.5">
            <RefreshCw size={13} /> Làm mới
          </Button>
        </div>

        {error && (
          <div className="rounded-lg border border-rose-500/20 bg-rose-500/10 px-3 py-2 text-sm text-rose-500">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-amber-500/20 bg-amber-500/5 sm:col-span-1">
            <CardContent className="p-5">
              <div className="mb-2 flex items-center gap-2">
                <Crown size={14} className="text-amber-500" />
                <p className="text-xs font-black uppercase tracking-wider text-amber-600/70">
                  Tổng tiền gói đã thu
                </p>
              </div>
              <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">
                {fmtVnd(subReport?.grandTotal)}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {subReport?.total ?? 0} lượt mua gói từ các quản lý
              </p>
            </CardContent>
          </Card>

          {/* Danh sách lượt mua gói */}
          <Card className="sm:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                <Building2 size={14} className="text-primary" />
                Lượt mua gói gần đây
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!subReport?.items?.length ? (
                <p className="py-2 text-sm text-muted-foreground">Chưa có lượt mua gói nào.</p>
              ) : (
                <div className="space-y-2">
                  {subReport.items.map((t) => (
                    <div key={t._id} className="flex items-center justify-between rounded-lg border border-border bg-card/50 px-3 py-2.5">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {t.building?.code && (
                            <span className="mr-1.5 font-mono text-xs text-muted-foreground">{t.building.code}</span>
                          )}
                          {t.building?.name ?? 'Tòa nhà'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {fmtDate(t.createdAt)}
                          {t.performedBy?.fullName ? ` · ${t.performedBy.fullName}` : ''}
                        </p>
                      </div>
                      <p className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        +{fmtVnd(t.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
