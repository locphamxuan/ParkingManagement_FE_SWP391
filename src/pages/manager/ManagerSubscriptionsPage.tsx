import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CustomSelect } from '@/components/ui/select';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { managerApi, type Subscription } from '@/services/manager/managerApi';

const STATUS_FILTERS = [
  { value: '', label: 'Tất cả' },
  { value: 'active', label: 'Đang hoạt động' },
  { value: 'expired', label: 'Hết hạn' },
  { value: 'cancelled', label: 'Đã hủy' },
] as const;

const fmtDate = (v?: string) => (v ? new Date(v).toLocaleDateString('vi-VN') : '—');
const fmtMoney = (n?: number | null) => (n != null ? `${n.toLocaleString('vi-VN')} ₫` : '—');

export function ManagerSubscriptionsPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [cancelTarget, setCancelTarget] = useState<Subscription | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await managerApi.packages.subscriptions(buildingId, status ? { status } : undefined);
      setItems(res.data.items ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tải thất bại');
    } finally {
      setLoading(false);
    }
  }, [buildingId, status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError(null);
    try {
      await managerApi.packages.cancelSubscription(buildingId, cancelTarget._id, cancelReason || undefined);
      setCancelTarget(null);
      setCancelReason('');
      await refresh();
    } catch (err) {
      setCancelError(err instanceof Error ? err.message : 'Hủy gói thất bại');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Gói dài hạn của khách</CardTitle>
          <CustomSelect
            value={status}
            onChange={setStatus}
            options={STATUS_FILTERS.map((s) => ({
              value: s.value,
              label: s.label,
            }))}
            className="w-48"
          />
        </CardHeader>
        <CardContent>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {loading ? (
            <p className="text-sm text-muted-foreground">Đang tải...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa có gói nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="py-2 pr-3">Khách</th>
                    <th className="py-2 pr-3">Biển số</th>
                    <th className="py-2 pr-3">Gói</th>
                    <th className="py-2 pr-3">Hiệu lực</th>
                    <th className="py-2 pr-3">Trạng thái</th>
                    <th className="py-2 pr-3">Phí gói / Hoàn lại</th>
                    <th className="py-2">Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((s) => {
                    const refund = s.package?.price != null ? Math.round(s.package.price * 0.95) : null;
                    return (
                      <tr key={s._id} className="border-b last:border-0">
                        <td className="py-2 pr-3">
                          <div className="font-medium">{s.user?.fullName ?? '—'}</div>
                          <div className="text-xs text-muted-foreground">{s.user?.email}</div>
                        </td>
                        <td className="py-2 pr-3 font-mono">{s.plateNumber}</td>
                        <td className="py-2 pr-3">{s.package?.name}</td>
                        <td className="py-2 pr-3 whitespace-nowrap">{fmtDate(s.startDate)} → {fmtDate(s.endDate)}</td>
                        <td className="py-2 pr-3"><StatusBadge status={s.status} /></td>
                        <td className="py-2 pr-3">
                          {s.status === 'cancelled' ? (
                            <div className="text-xs">
                              <span className="text-muted-foreground">Giá gốc: </span>
                              <span className="font-medium">{fmtMoney(s.package?.price)}</span>
                              <br />
                              <span className="text-rose-400">Khấu trừ 5%: </span>
                              <span className="text-rose-400 font-medium">
                                {s.package?.price != null ? fmtMoney(Math.round(s.package.price * 0.05)) : '—'}
                              </span>
                              <br />
                              <span className="text-emerald-400">Đã hoàn: </span>
                              <span className="text-emerald-400 font-medium">{refund != null ? fmtMoney(refund) : '—'}</span>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">{fmtMoney(s.package?.price)}</span>
                          )}
                        </td>
                        <td className="py-2">
                          {(s.status === 'active' || s.status === 'pending') && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setCancelTarget(s)}
                              className="text-rose-500 hover:text-rose-400 hover:bg-rose-500/10 text-xs"
                            >
                              Hủy gói
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {cancelTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-rose-400">Hủy gói dài hạn</p>
                <h3 className="text-base font-semibold text-foreground">{cancelTarget.user?.fullName}</h3>
                <p className="text-xs text-muted-foreground">{cancelTarget.package?.name} · {cancelTarget.plateNumber}</p>
              </div>
              <button onClick={() => { setCancelTarget(null); setCancelReason(''); setCancelError(null); }} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <div className="rounded-xl border border-amber-500/25 bg-amber-500/8 px-4 py-3 text-sm text-amber-200 mb-4">
              <p className="font-semibold mb-1">Chính sách hoàn tiền khi hủy bởi quản lý:</p>
              <ul className="text-xs space-y-0.5 list-disc list-inside">
                <li>Khấu trừ <strong>5%</strong> phí xử lý</li>
                <li>Hoàn lại <strong>95%</strong> = {cancelTarget.package?.price != null ? fmtMoney(Math.round(cancelTarget.package.price * 0.95)) : '—'} vào ví người dùng</li>
              </ul>
            </div>

            <div className="mb-4">
              <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-1">Lý do hủy (tùy chọn)</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={2}
                placeholder="Ghi chú lý do hủy gói..."
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm text-foreground outline-none focus:border-rose-500/50"
              />
            </div>

            {cancelError && <p className="mb-3 text-xs text-rose-400">{cancelError}</p>}

            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                onClick={() => { setCancelTarget(null); setCancelReason(''); setCancelError(null); }}
                className="text-xs"
              >
                Hủy
              </Button>
              <Button
                onClick={handleCancel}
                disabled={cancelling}
                className="bg-rose-500 text-white hover:bg-rose-400 text-xs disabled:opacity-60"
              >
                {cancelling ? 'Đang xử lý...' : 'Xác nhận hủy gói'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
