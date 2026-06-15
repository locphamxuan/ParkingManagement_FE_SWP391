import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export function ManagerSubscriptionsPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('');

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
                  <th className="py-2 pr-3">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => (
                  <tr key={s._id} className="border-b last:border-0">
                    <td className="py-2 pr-3">
                      <div className="font-medium">{s.user?.fullName ?? '—'}</div>
                      <div className="text-xs text-muted-foreground">{s.user?.email}</div>
                    </td>
                    <td className="py-2 pr-3 font-mono">{s.plateNumber}</td>
                    <td className="py-2 pr-3">{s.package?.name}</td>
                    <td className="py-2 pr-3 whitespace-nowrap">{fmtDate(s.startDate)} → {fmtDate(s.endDate)}</td>
                    <td className="py-2 pr-3"><StatusBadge status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
