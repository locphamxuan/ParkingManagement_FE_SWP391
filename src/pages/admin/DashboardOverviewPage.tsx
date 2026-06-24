import { Pie, PieChart, ResponsiveContainer, Tooltip, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { AnalyticsCard } from '@/components/charts/AnalyticsCard';
import { ActivityTimeline } from '@/components/charts/ActivityTimeline';
import { RevenueChart } from '@/components/charts/RevenueChart';
import { useAdminDataset } from '@/hooks/admin/useAdminDataset';
import { Activity, CreditCard, ShieldCheck, TrendingUp } from 'lucide-react';

const pieColors = ['#f97316', '#a855f7', '#3b82f6', '#06b6d4'];
const STAT_ICONS = [
  <TrendingUp size={14} />,
  <Activity size={14} />,
  <CreditCard size={14} />,
  <ShieldCheck size={14} />,
];

const sectionVariants = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 90, damping: 18, delay: i * 0.1 },
  }),
};

export function DashboardOverviewPage() {
  const { data, isLoading, error } = useAdminDataset();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-24 text-sm text-slate-400 font-semibold bg-slate-950/40 rounded-3xl border border-white/5 backdrop-blur-md">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-orange-500 border-t-transparent mb-3" />
        Đang tải dữ liệu tổng quan bãi đỗ...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-rose-500/20 bg-rose-950/20 p-5 text-sm font-semibold text-rose-400 backdrop-blur-md">
        {error || 'Tải dữ liệu thất bại.'}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 relative">

      {/* ── SECTION 1: Welcome Hero Banner ── */}
      <motion.section
        custom={0}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="relative overflow-hidden rounded-3xl glow-border-pulse glass-premium p-8 shadow-2xl"
      >
        {/* Radial glows inside the hero */}
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.12),transparent_70%)] pointer-events-none blur-2xl" />
        <div className="absolute -left-12 -bottom-12 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.09),transparent_70%)] pointer-events-none blur-2xl" />
        {/* Horizontal scan line on hero */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-orange-500/30 to-transparent absolute top-1/2 cyber-shimmer" />
        </div>

        <div className="relative z-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-[9px] font-black uppercase tracking-widest text-orange-400 font-mono">
              Cổng Quản Trị Trung Tâm
            </div>
            <h1 className="mt-2.5 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Tổng quan <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-purple-400 bg-clip-text text-transparent">Hệ Thống PBMS</span>
            </h1>
            <p className="mt-3.5 max-w-2xl text-xs font-semibold text-slate-300 leading-relaxed">
              Trung tâm giám sát toàn diện bãi đỗ xe nhiều tầng. Theo dõi doanh thu thời gian thực, quản lý phân bổ phương thức thanh toán, rà soát giao dịch gần đây và giám sát hoạt động bãi đỗ trực tiếp.
            </p>
          </div>
          <div className="inline-flex items-center gap-2.5 rounded-full bg-slate-950/80 border border-emerald-500/20 px-4 py-2.5 text-xs font-black text-emerald-400 uppercase font-mono shadow-xl self-start sm:self-auto backdrop-blur-md neon-glow-emerald">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]" />
            <span>Hệ thống Live</span>
          </div>
        </div>
      </motion.section>

      {/* ── SECTION 2: Metric Cards Grid with stagger ── */}
      <motion.section
        custom={1}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
        style={{ perspective: '1400px' }}
      >
        {data.dashboardStats.map((stat, index) => (
          <AnalyticsCard
            key={stat.key}
            label={stat.label}
            value={stat.value}
            delta={stat.delta}
            index={index}
            icon={STAT_ICONS[index % STAT_ICONS.length]}
          />
        ))}
      </motion.section>

      {/* ── SECTION 3: Revenue Chart + Pie Distribution ── */}
      <motion.section
        custom={2}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="grid gap-6 xl:grid-cols-[2fr,1fr]"
      >
        <RevenueChart data={data.revenueTrend} />

        {/* Pie Distribution Card */}
        <div className="relative overflow-hidden rounded-3xl glass-premium glow-border-pulse p-6 shadow-2xl">
          <div className="absolute -right-16 -top-16 h-32 w-32 rounded-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.07),transparent_65%)] pointer-events-none blur-2xl" />
          
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 font-mono">Phân bổ phương thức</h3>
            <span className="px-2 py-0.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-400 font-mono uppercase tracking-wider">Live</span>
          </div>

          <div className="h-[240px] w-full flex items-center justify-center cyber-scanline rounded-xl">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.paymentMethodDistribution}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={90}
                  innerRadius={52}
                  paddingAngle={4}
                  stroke="rgba(15,23,42,0.8)"
                  strokeWidth={2}
                >
                  {data.paymentMethodDistribution.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={pieColors[index % pieColors.length]}
                      style={{ filter: `drop-shadow(0 0 6px ${pieColors[index % pieColors.length]}90)` }}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="glass-premium border border-white/10 px-3 py-2 rounded-xl shadow-2xl text-[10px] text-white">
                          <p className="font-mono font-black uppercase tracking-wider text-slate-400">{payload[0].name}</p>
                          <p className="font-black mt-1 font-mono text-xs" style={{ color: payload[0].payload.fill }}>
                            {payload[0].value}%
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Neon legend rows */}
          <div className="mt-3 space-y-2">
            {data.paymentMethodDistribution.map((entry, idx) => {
              const color = pieColors[idx % pieColors.length];
              return (
                <div key={entry.name} className="flex items-center justify-between text-[10px] font-bold font-mono">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}80` }} />
                    <span className="text-slate-400 uppercase tracking-wider">{entry.name}</span>
                  </div>
                  <span className="font-black" style={{ color }}>{entry.value}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* ── SECTION 4: Activity / Transactions / Guardrails ── */}
      <motion.section
        custom={3}
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
        className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3"
      >
        {/* Activity logs */}
        <div className="relative overflow-hidden rounded-3xl glass-premium glow-border-pulse p-6 shadow-2xl">
          <ActivityTimeline title="Hoạt động bãi đỗ trực tiếp" items={data.liveActivities} />
        </div>

        {/* Buildings performance */}
        <div className="relative overflow-hidden rounded-3xl glass-premium glow-border-pulse p-6 shadow-2xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 font-mono">Hiệu suất tòa nhà</h3>
            <span className="px-2 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-[9px] font-black text-orange-400 font-mono uppercase tracking-wider">{data.buildings.length} tòa</span>
          </div>
          <div className="max-h-[360px] overflow-y-auto pr-1 space-y-3">
            {data.buildings.length === 0 ? (
              <p className="text-xs text-slate-500 italic text-center py-6">Chưa có dữ liệu tòa nhà.</p>
            ) : (
              data.buildings.slice(0, 8).map((b) => (
                <motion.div
                  key={b.id}
                  whileHover={{ scale: 1.01, x: 2 }}
                  className="rounded-2xl border border-white/5 bg-slate-900/50 p-4 transition-all duration-300 hover:border-orange-500/25 hover:shadow-[0_0_12px_rgba(249,115,22,0.08)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-black text-xs text-white truncate">{b.name}</p>
                      <p className="mt-1 text-[10px] text-slate-500 font-bold">{b.address}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs font-black text-orange-400 font-mono">{b.occupancyRate}%</p>
                      <p className="text-[10px] text-slate-500 font-mono">{b.revenueToday.toLocaleString('vi-VN')} VND</p>
                    </div>
                  </div>
                  <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-400 transition-all duration-500"
                      style={{ width: `${Math.min(b.occupancyRate, 100)}%` }}
                    />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Operational guardrails */}
        <div className="relative overflow-hidden rounded-3xl glass-premium glow-border-pulse p-6 shadow-2xl">
          <div className="mb-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-300 font-mono">Rào cản vận hành</h3>
          </div>
          <div className="space-y-3">
            {data.operationalGuardrails.map((rule) => (
              <motion.div
                key={rule}
                whileHover={{ x: 3 }}
                className="rounded-2xl border border-white/5 bg-slate-900/40 p-4 text-[11px] text-slate-300 font-semibold leading-relaxed transition-all hover:border-purple-500/30 hover:shadow-[0_0_10px_rgba(168,85,247,0.07)]"
              >
                <div className="flex gap-2.5 items-start">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-1.5 shrink-0 shadow-[0_0_6px_rgba(168,85,247,0.5)]" />
                  <span>{rule}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
}
