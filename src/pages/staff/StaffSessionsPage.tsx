import { useCallback, useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { useBuildingContext } from '@/hooks/useBuildingContext';
import { staffApi, type ParkingSession } from '@/services/staff/staffApi';

const fmt = (n: number | null | undefined) =>
  n != null ? `${n.toLocaleString('vi-VN')} đ` : '—';

const fmtTime = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleString('vi-VN') : '—';

export function StaffSessionsPage() {
  const { buildingId } = useBuildingContext();
  const [items, setItems] = useState<ParkingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('');

  const refresh = useCallback(() => {
    setLoading(true);
    staffApi.sessions
      .list(buildingId, { status: statusFilter || undefined })
      .then((res) => {
        setItems(res.data.items);
        setError(null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Tải thất bại'))
      .finally(() => setLoading(false));
  }, [buildingId, statusFilter]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const columns: DataColumn<ParkingSession>[] = [
    { key: 'plateNumber', title: 'Biển số' },
    {
      key: 'vehicleType',
      title: 'Loại xe',
      render: (row) =>
        row.vehicleType ? `${row.vehicleType.name} (${row.vehicleType.code})` : '—',
    },
    { key: 'gate', title: 'Cổng', render: (row) => row.gate?.name ?? '—' },
    { key: 'checkIn', title: 'Vào', render: (row) => fmtTime(row.checkIn) },
    { key: 'checkOut', title: 'Ra', render: (row) => fmtTime(row.checkOut) },
    { key: 'fee', title: 'Phí', render: (row) => fmt(row.fee) },
    {
      key: 'paymentMethod',
      title: 'Phương thức',
      render: (row) => row.paymentMethod?.toUpperCase() ?? '—',
    },
    {
      key: 'paymentStatus',
      title: 'Thanh toán',
      render: (row) => <StatusBadge status={row.paymentStatus} />,
    },
    {
      key: 'status',
      title: 'Trạng thái',
      render: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-3">
        <select
          className="h-9 rounded-md border border-border bg-card px-3 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">Tất cả trạng thái</option>
          <option value="active">Đang hoạt động</option>
          <option value="completed">Đã hoàn thành</option>
          <option value="cancelled">Đã hủy</option>
        </select>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Đang tải...</div>
      ) : error ? (
        <div className="text-sm text-red-600">{error}</div>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            Không có phiên gửi xe nào.
          </CardContent>
        </Card>
      ) : (
        <DataTable title={`Phiên gửi xe (${items.length})`} rows={items} columns={columns} />
      )}
    </div>
  );
}
