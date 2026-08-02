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

interface RevenueChartProps {
  data: RevenuePoint[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  // Customized 3D Glowing HTML Tooltip
  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="glass-panel-dark border border-orange-500/20 px-4 py-3 rounded-2xl shadow-[0_0_25px_rgba(249,115,22,0.2)] text-xs text-white backdrop-blur-md">
          <p className="font-mono font-black text-slate-400 mb-2 uppercase tracking-widest">{label}</p>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center gap-6">
              <span className="text-orange-400 font-bold">Revenue:</span>
              <span className="font-mono font-black text-white">{payload[0].value.toLocaleString('vi-VN')} VND</span>
            </div>
            {payload[1] && (
              <div className="flex justify-between items-center gap-6">
                <span className="text-purple-400 font-bold">Payments:</span>
                <span className="font-mono font-black text-white">{payload[1].value}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/5 bg-slate-900/60 p-6 backdrop-blur-md shadow-2xl">
      {/* Background backing glow effect */}
      <div className="absolute -left-16 -bottom-16 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.1),transparent_65%)] pointer-events-none" />
      <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.08),transparent_65%)] pointer-events-none" />
      
      <div className="mb-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-slate-400 font-mono">Revenue Trend (Last 7 Days)</h3>
      </div>

      <div className="h-[320px] w-full preserve-3d">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f97316" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="occGrad" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.2} />
                <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" vertical={false} />
            <XAxis 
              dataKey="date" 
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }} 
              tickLine={false} 
              axisLine={{ stroke: 'rgba(255,255,255,0.05)' }} 
            />
            {/* Doanh thu (hàng nghìn ₫) và số giao dịch lệch nhau nhiều bậc độ lớn nên
                phải tách trục, nếu chung trục thì đường giao dịch bị ép sát đáy. */}
            <YAxis
              yAxisId="revenue"
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
              tickFormatter={(value: number) => value.toLocaleString('vi-VN')}
            />
            <YAxis
              yAxisId="payments"
              orientation="right"
              allowDecimals={false}
              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 'bold', fontFamily: 'monospace' }}
              tickLine={false}
              axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(249,115,22,0.15)', strokeWidth: 1 }} />
            <Legend 
              verticalAlign="top" 
              height={36} 
              wrapperStyle={{ color: '#cbd5e1', fontSize: 11, fontWeight: 'bold', fontFamily: 'monospace', textTransform: 'uppercase' }} 
            />
            <Area
              type="monotone"
              name="Revenue (VND)"
              yAxisId="revenue"
              dataKey="revenue"
              stroke="#f97316"
              strokeWidth={2.5}
              fill="url(#revGrad)"
              activeDot={{ r: 5, strokeWidth: 0, fill: '#f97316' }}
            />
            <Area
              type="monotone"
              name="Payments"
              yAxisId="payments"
              dataKey="sessions"
              stroke="#a855f7"
              strokeWidth={2}
              fill="url(#occGrad)"
              activeDot={{ r: 4, strokeWidth: 0, fill: '#a855f7' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
