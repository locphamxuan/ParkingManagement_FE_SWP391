import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { RevenuePoint } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RevenueChartProps {
  data: RevenuePoint[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue, Occupancy and Session Trend</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px] pt-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="rev" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.34} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="occ" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#1f2a44" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#1f2a44" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(191,161,131,0.22)" strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fill: '#111827', fontSize: 12 }} tickLine={false} axisLine={{ stroke: 'rgba(191,161,131,0.32)' }} />
            <YAxis tick={{ fill: '#111827', fontSize: 12 }} tickLine={false} axisLine={{ stroke: 'rgba(191,161,131,0.32)' }} />
            <Tooltip
              contentStyle={{
                background: '#fffaf3',
                border: '1px solid rgba(234,88,12,0.16)',
                borderRadius: '0.75rem',
                boxShadow: '0 16px 36px rgba(120,83,48,0.14)',
              }}
            />
            <Legend wrapperStyle={{ color: '#111827' }} />
            <Area type="monotone" dataKey="revenue" stroke="#f97316" strokeWidth={2.4} fill="url(#rev)" />
            <Area type="monotone" dataKey="occupancy" stroke="#1f2a44" strokeWidth={2} fill="url(#occ)" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
