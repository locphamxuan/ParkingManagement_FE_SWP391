import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Car, Crown, Square, TrendingUp, Ticket } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useManagerBuildings } from '@/hooks/useManagerBuildings';
import { managerApi, type DashboardOverview } from '@/services/manager/managerApi';

const METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  wallet: 'App Wallet',
  qr: 'QR',
  payos: 'PayOS',
  card: 'Bank Card',
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 18 } },
};

export function ManagerDashboardPage() {
  const { session } = useAuth();
  const {
    buildings,
    selectedBuilding,
    selectedBuildingId,
    setSelectedBuildingId,
    isLoading: isBuildingsLoading,
    error: buildingsError,
  } = useManagerBuildings();

  const navigate = useNavigate();
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);
  const needsSubscription = /subscription|gói/i.test(overviewError ?? '');

  const userName = useMemo(
    () => session?.displayName || session?.email || 'Manager',
    [session],
  );

  const fetchOverview = useCallback(async () => {
    if (!selectedBuildingId) {
      setOverview(null);
      return;
    }
    setIsLoadingOverview(true);
    setOverviewError(null);
    try {
      const res = await managerApi.getDashboard(selectedBuildingId);
      setOverview((res as { data?: DashboardOverview })?.data ?? null);
    } catch (err) {
      setOverviewError(err instanceof Error ? err.message : 'Unable to load report.');
      setOverview(null);
    } finally {
      setIsLoadingOverview(false);
    }
  }, [selectedBuildingId]);

  useEffect(() => {
    void fetchOverview();
  }, [fetchOverview]);

  const revenueByMethod = useMemo(
    () =>
      Object.entries(overview?.revenue?.byMethod ?? {})
        .map(([method, summary]) => ({ method, ...summary }))
        .sort((a, b) => b.amount - a.amount),
    [overview],
  );

  const cards = useMemo(
    () => [
      { label: 'Vehicles Parked', value: overview?.sessions?.active ?? 0, icon: Car, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
      { label: 'Vehicles Today', value: overview?.sessions?.today ?? 0, icon: TrendingUp, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
      { label: 'Available Slots', value: (overview?.slots?.available ?? (overview?.slots?.total ?? 0) - (overview?.slots?.occupied ?? 0)), icon: Square, color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20' },
      { label: 'Long-term Packages', value: overview?.subscriptions?.active ?? 0, icon: Ticket, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
    ],
    [overview],
  );

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={containerVariants}
      className="mx-auto max-w-6xl space-y-6 pb-12 relative"
    >
      {/* Hero */}
      <motion.section
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl glow-border-pulse glass-premium p-8 shadow-2xl"
      >
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.12),transparent_70%)] pointer-events-none blur-2xl" />
        <div className="absolute -left-12 -bottom-12 h-32 w-32 rounded-full bg-[radial-gradient(circle_at_center,rgba(14,116,144,0.08),transparent_70%)] pointer-events-none blur-2xl" />
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent absolute top-1/2 cyber-shimmer" />
        </div>

        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-teal-500/10 border border-teal-500/20 text-[9px] font-black uppercase tracking-widest text-teal-400 font-mono">
              Manager Dashboard
            </div>
            <h1 className="mt-2.5 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Good day,{' '}
              <span className="bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
                {userName}
              </span>
            </h1>
            <p className="mt-3 max-w-2xl text-xs font-semibold text-slate-300 leading-relaxed">
              Track parking status, approve shifts, update pricing, and respond to customer feedback in real time.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-slate-950/80 border border-teal-500/20 px-4 py-2.5 text-xs font-black text-teal-400 uppercase font-mono shadow-xl self-start sm:self-auto backdrop-blur-md">
            <Building2 size={14} />
            <span>{selectedBuilding?.name ?? 'No building selected'}</span>
          </div>
        </div>
      </motion.section>

      {/* Quick actions */}
      <motion.div variants={itemVariants} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Pricing', desc: 'Manage parking price policies', href: '/manager/price-policies', color: 'border-orange-500/20 bg-orange-500/5 text-orange-400' },
          { label: 'Staff & Shifts', desc: 'Assign shifts and manage staff', href: '/manager/shifts', color: 'border-teal-500/20 bg-teal-500/5 text-teal-400' },
          { label: 'Long-term Packages', desc: 'Manage packages and subscriptions', href: '/manager/packages', color: 'border-purple-500/20 bg-purple-500/5 text-purple-400' },
          { label: 'Reviews', desc: 'View and respond to feedback', href: '/manager/reviews', color: 'border-cyan-500/20 bg-cyan-500/5 text-cyan-400' },
        ].map((action) => (
          <button
            key={action.href}
            type="button"
            onClick={() => navigate(action.href)}
            className={`rounded-2xl border p-4 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${action.color}`}
          >
            <p className="font-black text-sm text-white">{action.label}</p>
            <p className="mt-1 text-[10px] text-slate-400">{action.desc}</p>
          </button>
        ))}
      </motion.div>

      <section className="grid gap-6 lg:grid-cols-[1.3fr,0.7fr]">
        <div className="space-y-6">
          {/* Danh sách tòa nhà */}
          <motion.div variants={itemVariants}>
            <Card className="border border-white/5 bg-slate-900/40 shadow-2xl backdrop-blur-md overflow-hidden rounded-3xl">
              <CardHeader className="border-b border-white/5 bg-slate-950/30 p-5">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-300 font-mono">Assigned Buildings</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {isBuildingsLoading ? (
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                    <span>Loading buildings...</span>
                  </div>
                ) : buildingsError ? (
                  <p className="text-xs font-semibold text-rose-400 bg-rose-950/20 border border-rose-500/20 p-3.5 rounded-2xl">{buildingsError}</p>
                ) : buildings.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">This account has not been assigned to manage any building.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {buildings.map((b) => {
                      const isSelected = selectedBuildingId === b._id;
                      return (
                        <button
                          key={b._id}
                          type="button"
                          onClick={() => setSelectedBuildingId(b._id)}
                          className={`rounded-2xl border p-4 text-left transition-all duration-300 ${
                            isSelected
                              ? 'border-teal-500 bg-teal-500/10 shadow-[0_0_15px_rgba(20,184,166,0.18)] scale-[1.01]'
                              : 'border-white/5 bg-slate-950/40 text-slate-300 hover:border-white/10 hover:bg-slate-900/40'
                          }`}
                        >
                          <p className={`font-black text-sm ${isSelected ? 'text-teal-400' : 'text-slate-200'}`}>
                            {b.name || b.code || 'Building'}
                          </p>
                          <p className="mt-2.5 text-[10px] font-bold text-slate-400 flex items-center gap-1.5 font-mono uppercase tracking-wide">
                            <span className={`h-1.5 w-1.5 rounded-full ${b.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                            {b.status === 'active' ? 'Active' : b.status === 'maintenance' ? 'Maintenance' : 'Inactive'}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Báo cáo nhanh */}
          <motion.div variants={itemVariants}>
            <Card className="border border-white/5 bg-slate-900/40 shadow-2xl backdrop-blur-md overflow-hidden rounded-3xl">
              <CardHeader className="border-b border-white/5 bg-slate-950/30 p-5">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-300 font-mono">Today's Quick Report</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {isLoadingOverview ? (
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
                    <span>Aggregating data...</span>
                  </div>
                ) : overviewError ? (
                  needsSubscription ? (
                    <div className="rounded-2xl border border-amber-500/25 bg-amber-950/20 p-4">
                      <div className="flex items-center gap-2 text-amber-300">
                        <Crown size={15} />
                        <p className="text-xs font-black uppercase tracking-wider font-mono">Subscription Activation Required</p>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-amber-200/80">
                        This building has no active system subscription. Purchase a plan to unlock the manager dashboard.
                      </p>
                      <button
                        type="button"
                        onClick={() => navigate('/manager/wallet')}
                        className="mt-3 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-400 px-4 py-2 text-xs font-black text-slate-950 transition hover:brightness-110"
                      >
                        <Crown size={13} /> Buy Subscription
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-rose-400 bg-rose-950/20 border border-rose-500/20 p-3.5 rounded-2xl">{overviewError}</p>
                  )
                ) : overview ? (
                  <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
                    {cards.map((card) => {
                      const Icon = card.icon;
                      return (
                        <div key={card.label} className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 transition-all duration-300 hover:border-teal-500/25 hover:shadow-[0_0_12px_rgba(20,184,166,0.08)] hover:scale-[1.02]">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-lg border ${card.bg} ${card.color}`}>
                              <Icon size={14} />
                            </div>
                            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">{card.label}</p>
                          </div>
                          <p className="mt-4 text-2xl font-black text-white font-mono">{card.value}</p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 font-semibold italic text-center py-4">Select a building above to view detailed figures.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Hiệu suất bãi đỗ */}
          <motion.div variants={itemVariants}>
            <Card className="border border-white/5 bg-slate-900/40 shadow-2xl backdrop-blur-md overflow-hidden rounded-3xl">
              <CardHeader className="border-b border-white/5 bg-slate-950/30 p-5">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-300 font-mono">Parking Performance</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Occupied Slots</p>
                  <div className="mt-2 flex items-baseline justify-between">
                    <p className="text-2xl font-black text-white font-mono">{overview?.slots?.occupied ?? 0}</p>
                    <p className="text-xs font-bold text-slate-500 font-mono">/ {overview?.slots?.total ?? 0} slots</p>
                  </div>
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 shadow-[0_0_8px_rgba(20,184,166,0.4)] transition-all duration-500"
                      style={{ width: `${overview?.slots?.occupancyRate ?? 0}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Occupancy Rate</p>
                  <p className="mt-2 text-2xl font-black text-teal-400 font-mono">{overview?.slots?.occupancyRate ?? 0}%</p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4 border-l-4 border-l-teal-500 shadow-xl">
                  <p className="text-[9px] font-black uppercase tracking-wider text-teal-400 font-mono">Revenue Today</p>
                  <p className="mt-2.5 text-2xl font-black text-white font-mono">
                    {(overview?.revenue?.today ?? 0).toLocaleString('vi-VN')}{' '}
                    <span className="text-xs font-black text-slate-400">VND</span>
                  </p>
                  {revenueByMethod.length > 0 ? (
                    <ul className="mt-3 space-y-1 border-t border-white/5 pt-2.5">
                      {revenueByMethod.map((row) => (
                        <li key={row.method} className="flex items-center justify-between text-[10px] font-bold font-mono">
                          <span className="uppercase tracking-wider text-slate-400">
                            {METHOD_LABELS[row.method] ?? row.method}
                          </span>
                          <span className="text-slate-200">
                            {row.amount.toLocaleString('vi-VN')}
                            <span className="ml-1.5 text-slate-500">×{row.count}</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 border-t border-white/5 pt-2.5 text-[10px] font-semibold italic text-slate-500">
                      No payments collected today yet.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Đăng ký */}
          <motion.div variants={itemVariants}>
            <Card className="border border-white/5 bg-slate-900/40 shadow-2xl backdrop-blur-md overflow-hidden rounded-3xl">
              <CardHeader className="border-b border-white/5 bg-slate-950/30 p-5">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-300 font-mono">Customer Long-term Packages</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Active Long-term Packages</p>
                  <p className="mt-1.5 text-xl font-black text-white font-mono">
                    {overview?.subscriptions?.active ?? 0}{' '}
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">packages</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}
