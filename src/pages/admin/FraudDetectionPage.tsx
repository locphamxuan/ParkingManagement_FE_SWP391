import { DataTable, type DataColumn } from '@/components/shared/DataTable';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { AnalyticsCard } from '@/components/shared/AnalyticsCard';
import { useAdminDataset } from '@/hooks/admin/useAdminDataset';
import type { FraudAlert } from '@/types';

const fraudKpis = [
  { label: 'Vụ gian lận mở', value: '9', delta: '2 nguy cấp' },
  { label: 'Cảnh báo biển số trùng', value: '3', delta: '+1 hôm nay' },
  { label: 'Thanh toán bất thường', value: '4', delta: 'Cần xem xét' },
  { label: 'Phiên đáng ngờ', value: '12', delta: 'Mẫu bị đánh dấu' },
];

export function FraudDetectionPage() {
  const { data, isLoading, error } = useAdminDataset();

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Đang tải cảnh báo gian lận...</div>;
  }

  if (error || !data) {
    return <div className="text-sm text-red-600">{error || 'Tải cảnh báo gian lận thất bại.'}</div>;
  }

  const columns: DataColumn<FraudAlert>[] = [
    { key: 'id', title: 'Mã cảnh báo' },
    { key: 'type', title: 'Loại' },
    { key: 'building', title: 'Tòa nhà' },
    { key: 'timestamp', title: 'Thời gian' },
    { key: 'note', title: 'Ghi chú' },
    { key: 'severity', title: 'Mức độ', render: (row) => <StatusBadge status={row.severity} /> },
  ];

  return (
    <div className="grid gap-5">
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {fraudKpis.map((item, index) => (
          <AnalyticsCard key={item.label} label={item.label} value={item.value} delta={item.delta} index={index} />
        ))}
      </section>
      <DataTable title="Dòng hoạt động đáng ngờ" rows={data.fraudAlerts} columns={columns} />
    </div>
  );
}
