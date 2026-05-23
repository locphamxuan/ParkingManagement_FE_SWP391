import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { DataTable } from '@/components/shared/DataTable';
import { RevenueChart } from '@/components/shared/RevenueChart';
import { useAdminDataset } from '@/hooks/admin/useAdminDataset';

export function RevenueAnalyticsPage() {
  const { data, isLoading, error } = useAdminDataset();

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Đang tải phân tích doanh thu...</div>;
  }

  if (error || !data) {
    return <div className="text-sm text-red-600">{error || 'Tải phân tích doanh thu thất bại.'}</div>;
  }

  const hasRevenue = data.revenueTrend.length > 0;

  return (
    <div className="grid gap-5">
      {!hasRevenue && (
        <div className="rounded-lg border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
          Chưa có dữ liệu doanh thu. Dữ liệu sẽ hiển thị sau khi có phiên gửi xe hoàn thành.
        </div>
      )}

      {hasRevenue && <RevenueChart data={data.revenueTrend} />}

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4 shadow-[0_12px_30px_rgba(120,83,48,0.08)]">
          <h3 className="mb-3 text-base font-semibold">So sánh doanh thu tòa nhà</h3>
          {data.buildings.every((b) => !b.revenueToday) ? (
            <div className="flex h-[300px] items-center justify-center text-sm text-muted-foreground">
              Chưa có dữ liệu
            </div>
          ) : (
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
          )}
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
