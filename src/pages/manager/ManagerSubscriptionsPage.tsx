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

// Lấy mã ô đỗ + tên tầng từ slot đã populate.
const slotLabel = (slot: Subscription['slot']): { code: string; floor: string } | null => {
  if (!slot || typeof slot === 'string') return null;
  const floor =
    slot.floor && typeof slot.floor === 'object' ? slot.floor.name || slot.floor.code || '' : '';
  return { code: slot.code, floor };
};

export function ManagerSubscriptionsPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [releasingId, setReleasingId] = useState<string | null>(null);

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

  const onReleaseSlot = async (sub: Subscription) => {
    if (!window.confirm(`Thu hồi chỗ đỗ cố định của biển ${sub.plateNumber}? Khách sẽ được thông báo.`)) return;
    setReleasingId(sub._id);
    try {
      await managerApi.packages.releaseSlot(buildingId, sub._id);
      await refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Thu hồi thất bại');
    } finally {
      setReleasingId(null);
    }
  };

  return (
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
                  <th className="py-2 pr-3">Slot cố định</th>
                  <th className="py-2 pr-3">Trạng thái</th>
                  <th className="py-2 pr-3 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => {
                  const hasSlot = Boolean(s.slot) && !s.slotReleased;
                  return (
                    <tr key={s._id} className="border-b last:border-0">
                      <td className="py-2 pr-3">
                        <div className="font-medium">{s.user?.fullName ?? '—'}</div>
                        <div className="text-xs text-muted-foreground">{s.user?.email}</div>
                      </td>
                      <td className="py-2 pr-3 font-mono">{s.plateNumber}</td>
                      <td className="py-2 pr-3">{s.package?.name}</td>
                      <td className="py-2 pr-3 whitespace-nowrap">{fmtDate(s.startDate)} → {fmtDate(s.endDate)}</td>
                      <td className="py-2 pr-3">
                        {(() => {
                          const sl = slotLabel(s.slot);
                          if (!sl) return <span className="text-xs text-muted-foreground">Không</span>;
                          return (
                            <div className="text-xs">
                              <span className="font-mono font-semibold text-foreground">{sl.code}</span>
                              {sl.floor ? <span className="text-muted-foreground"> · {sl.floor}</span> : null}
                              {s.slotReleased ? (
                                <span className="text-rose-500"> (đã thu hồi)</span>
                              ) : (
                                <span className="text-emerald-600"> · đang giữ</span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="py-2 pr-3"><StatusBadge status={s.status} /></td>
                      <td className="py-2 pr-3 text-right">
                        {hasSlot ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={releasingId === s._id}
                            onClick={() => onReleaseSlot(s)}
                          >
                            {releasingId === s._id ? 'Đang thu hồi...' : 'Thu hồi slot'}
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
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
  );
}
