import { MonitoringWidget } from '@/components/shared/MonitoringWidget';
import { useAdminDataset } from '@/hooks/admin/useAdminDataset';

export function SystemHealthPage() {
  const { data, isLoading, error } = useAdminDataset();

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Đang tải tình trạng hệ thống...</div>;
  }

  if (error || !data) {
    return <div className="text-sm text-red-600">{error || 'Tải tình trạng hệ thống thất bại.'}</div>;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {data.monitoringMetrics.map((metric) => (
        <MonitoringWidget key={metric.id} metric={metric} />
      ))}
    </div>
  );
}
