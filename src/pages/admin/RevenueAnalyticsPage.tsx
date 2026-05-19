import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AnalyticsCard } from '@/components/shared/AnalyticsCard';
import { DataTable } from '@/components/shared/DataTable';
import { RevenueChart } from '@/components/shared/RevenueChart';
import { useAdminDataset } from '@/hooks/useAdminDataset';

const kpis = [
  { label: 'Tổng doanh thu (MTD)', value: '42.1B VND', delta: '+14.2%' },
  { label: 'Phân phối ròng', value: '36.8B VND', delta: '+9.1%' },
  { label: 'Giá vé trung bình', value: '198K VND', delta: '+5.4%' },
  { label: 'Tỉ lệ thu từ ví', value: '42%', delta: '+2.2%' },
];

export function RevenueAnalyticsPage() {
  const { data, isLoading, error } = useAdminDataset();

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Đang tải phân tích doanh thu...</div>;
  }

  if (error || !data) {
    return <div className="text-sm text-red-600">{error || 'Tải phân tích doanh thu thất bại.'}</div>;
  }

  return (
    <div className="grid gap-5">
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi, index) => (
          <AnalyticsCard key={kpi.label} label={kpi.label} value={kpi.value} delta={kpi.delta} index={index} />
        ))}
      </section>

      <RevenueChart data={data.revenueTrend} />

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4 shadow-[0_12px_30px_rgba(120,83,48,0.08)]">
          <h3 className="mb-3 text-base font-semibold">Building Revenue Comparison</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.buildings}>
                <CartesianGrid stroke="rgba(191,161,131,0.22)" strokeDasharray="3 3" />
                <XAxis dataKey="name" hide />
                <YAxis tick={{ fill: '#111827' }} />
                <Tooltip
                  contentStyle={{
                    background: '#fffaf3',
                    border: '1px solid rgba(234,88,12,0.16)',
                    borderRadius: '0.6rem',
                    boxShadow: '0 16px 36px rgba(120,83,48,0.14)',
                  }}
                />
                <Bar dataKey="revenueToday" fill="#f97316" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <DataTable
          title="Snapshot doanh thu ca"
          rows={data.revenueTrend}
          columns={[
            { key: 'date', title: 'Ngày' },
            { key: 'sessions', title: 'Phiên' },
            { key: 'occupancy', title: 'Tỉ lệ chiếm dụng %' },
            { key: 'revenue', title: 'Doanh thu (M VND)' },
          ]}
        />
      </section>
    </div>
  );
}
