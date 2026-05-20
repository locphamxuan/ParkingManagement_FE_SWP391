import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { AnalyticsCard } from '@/components/shared/AnalyticsCard';
import { ActivityTimeline } from '@/components/shared/ActivityTimeline';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RevenueChart } from '@/components/shared/RevenueChart';
import { useAdminDataset } from '@/hooks/useAdminDataset';

const pieColors = ['#f97316', '#fb923c', '#f59e0b', '#1f2a44'];

export function DashboardOverviewPage() {
  const { data, isLoading, error } = useAdminDataset();

    if (isLoading) {
      return <div className="text-sm text-muted-foreground">Đang tải dữ liệu tổng quan...</div>;
    }

    if (error || !data) {
      return <div className="text-sm text-red-600">{error || 'Tải dữ liệu thất bại.'}</div>;
    }

  return (
    <div className="grid gap-5">
      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {data.dashboardStats.map((stat, index) => (
          <AnalyticsCard key={stat.key} label={stat.label} value={stat.value} delta={stat.delta} index={index} />
        ))}
      </section>

      <section className="grid gap-5 xl:grid-cols-[2fr,1fr]">
        <RevenueChart data={data.revenueTrend} />

        <Card>
          <CardHeader>
              <CardTitle>Phân bổ phương thức thanh toán</CardTitle>
          </CardHeader>
          <CardContent className="h-[320px] pt-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.paymentMethodDistribution} dataKey="value" nameKey="name" outerRadius={96} stroke="rgba(255,250,243,0.98)" strokeWidth={2}>
                  {data.paymentMethodDistribution.map((entry, index) => (
                    <Cell key={entry.name} fill={pieColors[index % pieColors.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: '#fffaf3',
                    border: '1px solid rgba(234,88,12,0.16)',
                    borderRadius: '0.75rem',
                    boxShadow: '0 16px 36px rgba(120,83,48,0.14)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
        <ActivityTimeline title="Hoạt động bãi đỗ trực tiếp" items={data.liveActivities} />

        <Card>
          <CardHeader>
              <CardTitle>Giao dịch gần đây</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2.5">
              {data.transactions.map((tx) => (
                <li
                  key={tx.id}
                  className="rounded-xl border border-border/70 bg-muted/40 p-3 text-sm transition-colors duration-200 hover:border-primary/18 hover:bg-orange-50/70"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold tracking-[-0.01em] text-foreground">
                        {tx.id} - {tx.method}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{tx.building}</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-primary">{tx.amount.toLocaleString()} VND</p>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
              <CardTitle>Rào cản vận hành</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-black">
              {data.operationalGuardrails.map((rule) => (
                <li key={rule} className="rounded-lg border border-border/70 bg-muted/40 p-2.5 transition-colors duration-200 hover:border-primary/18 hover:bg-orange-50/70">
                  {rule}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
 
