import { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, Gauge, Layers, MessageSquare, Square, Info } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/useAuth';
import { useManagerBuildings } from '@/hooks/useManagerBuildings';
import { managerApi, type ManagerOverviewData } from '@/services/managerApi';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 18 } }
};

export function ManagerDashboardPage() {
  const { session } = useAuth();
  const { buildings, selectedBuilding, selectedBuildingId, setSelectedBuildingId, isLoading: isBuildingsLoading, error: buildingsError } = useManagerBuildings();
  const [overview, setOverview] = useState<ManagerOverviewData | null>(null);
  const [isLoadingOverview, setIsLoadingOverview] = useState(false);
  const [overviewError, setOverviewError] = useState<string | null>(null);

  const userName = useMemo(() => {
    if (!session) return 'Người quản lý';
    return session.displayName || session.email || 'Người quản lý';
  }, [session]);

  const fetchOverview = useCallback(async () => {
    if (!selectedBuildingId || !session?.token) {
      setOverview(null);
      return;
    }

    setIsLoadingOverview(true);
    setOverviewError(null);

    try {
      const data = await managerApi.getBuildingDashboard(selectedBuildingId, session.token);
      setOverview(data);
    } catch (error) {
      setOverviewError(error instanceof Error ? error.message : 'Không thể tải báo cáo.');
      setOverview(null);
    } finally {
      setIsLoadingOverview(false);
    }
  }, [selectedBuildingId, session?.token]);

  useEffect(() => {
    void fetchOverview();
  }, [fetchOverview]);

  const cards = useMemo(
    () => [
      {
        label: 'Số tầng',
        value: overview?.floors ?? 0,
        icon: Layers,
        color: 'text-cyan-400',
        bg: 'bg-cyan-500/10 border-cyan-500/20'
      },
      {
        label: 'Số cổng',
        value: overview?.gates ?? 0,
        icon: Building2,
        color: 'text-purple-400',
        bg: 'bg-purple-500/10 border-purple-500/20'
      },
      {
        label: 'Chỗ đỗ',
        value: overview?.slots?.total ?? 0,
        icon: Square,
        color: 'text-orange-400',
        bg: 'bg-orange-500/10 border-orange-500/20'
      },
      {
        label: 'Phiên đang hoạt động',
        value: overview?.sessions?.active ?? 0,
        icon: MessageSquare,
        color: 'text-emerald-400',
        bg: 'bg-emerald-500/10 border-emerald-500/20'
      },
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
      {/* Welcome Hero Banner */}
      <motion.section 
        variants={itemVariants}
        className="relative overflow-hidden rounded-3xl glow-border-pulse glass-premium p-8 shadow-2xl"
      >
        <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.12),transparent_70%)] pointer-events-none blur-2xl" />
        <div className="absolute -left-12 -bottom-12 h-32 w-32 rounded-full bg-[radial-gradient(circle_at_center,rgba(14,116,144,0.08),transparent_70%)] pointer-events-none blur-2xl" />
        
        {/* Shimmer laser sweep line */}
        <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
          <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/20 to-transparent absolute top-1/2 cyber-shimmer" />
        </div>

        <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-[9px] font-black uppercase tracking-widest text-orange-400 font-mono">
              Cổng Quản Trị Viên
            </div>
            <h1 className="mt-2.5 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Chào ngày mới, <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-cyan-400 bg-clip-text text-transparent">{userName}</span>
            </h1>
            <p className="mt-3.5 max-w-2xl text-xs font-semibold text-slate-300 leading-relaxed">
              Trung tâm điều khiển tòa nhà giúp bạn kiểm tra tình hình chỗ đỗ đỗ xe, phê duyệt các ca trực của nhân viên, cập nhật bảng giá franchise và phản hồi thắc mắc của khách hàng theo thời gian thực.
            </p>
          </div>
          <div className="inline-flex items-center gap-2.5 rounded-full bg-slate-950/80 border border-orange-500/20 px-4.5 py-2.5 text-xs font-black text-orange-400 uppercase font-mono shadow-xl self-start sm:self-auto backdrop-blur-md">
            <Building2 size={14} className="text-orange-400" />
            <span>{selectedBuilding?.name ?? 'Chưa chọn tòa nhà'}</span>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-6 lg:grid-cols-[1.3fr,0.7fr]">
        <div className="space-y-6">
          {/* Building Selection Card */}
          <motion.div variants={itemVariants}>
            <Card className="border border-white/5 bg-slate-900/40 shadow-2xl backdrop-blur-md overflow-hidden rounded-3xl">
              <CardHeader className="border-b border-white/5 bg-slate-950/30 p-5">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-300 font-mono">Tòa nhà phụ trách</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {isBuildingsLoading ? (
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                    <span>Đang tải danh sách tòa nhà phụ trách...</span>
                  </div>
                ) : buildingsError ? (
                  <p className="text-xs font-semibold text-rose-400 bg-rose-950/20 border border-rose-500/20 p-3.5 rounded-2xl">{buildingsError}</p>
                ) : buildings.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">Tài khoản này chưa được phân quyền quản lý bãi xe nào.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {buildings.map((building) => {
                      const isSelected = selectedBuildingId === building._id;
                      return (
                        <button
                          key={building._id}
                          type="button"
                          onClick={() => setSelectedBuildingId(building._id)}
                          className={`rounded-2xl border p-4 text-left transition-all duration-300 ${
                            isSelected
                              ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_15px_rgba(249,115,22,0.15)] scale-[1.01]'
                              : 'border-white/5 bg-slate-950/40 text-slate-300 hover:border-white/10 hover:bg-slate-900/40'
                          }`}
                        >
                          <p className={`font-black text-sm ${isSelected ? 'text-orange-400' : 'text-slate-200'}`}>
                            {building.name || building.code || 'Tòa nhà'}
                          </p>
                          <p className="mt-2.5 text-[10px] font-bold text-slate-400 flex items-center gap-1.5 font-mono uppercase tracking-wide">
                            <span className={`h-1.5 w-1.5 rounded-full ${building.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                            Trạng thái: {building.status === 'active' ? 'Hoạt động' : 'Tạm dừng'}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Quick Reports Stats */}
          <motion.div variants={itemVariants}>
            <Card className="border border-white/5 bg-slate-900/40 shadow-2xl backdrop-blur-md overflow-hidden rounded-3xl">
              <CardHeader className="border-b border-white/5 bg-slate-950/30 p-5">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-300 font-mono">Báo cáo nhanh hôm nay</CardTitle>
              </CardHeader>
              <CardContent className="p-5">
                {isLoadingOverview ? (
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
                    <span>Đang tổng hợp dữ liệu bãi xe...</span>
                  </div>
                ) : overviewError ? (
                  <p className="text-xs font-semibold text-rose-400 bg-rose-950/20 border border-rose-500/20 p-3.5 rounded-2xl">{overviewError}</p>
                ) : overview ? (
                  <div className="grid gap-4 grid-cols-2 xl:grid-cols-4">
                    {cards.map((card) => {
                      const Icon = card.icon;
                      return (
                        <div key={card.label} className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 transition-all duration-300 hover:border-orange-500/25 hover:shadow-[0_0_12px_rgba(249,115,22,0.08)] hover:scale-[1.02]">
                          <div className="flex items-center gap-2.5">
                            <div className={`p-1.5 rounded-lg ${card.bg} ${card.color}`}>
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
                  <p className="text-xs text-slate-400 font-semibold italic text-center py-4">Vui lòng chọn một tòa nhà cụ thể ở trên để xem số liệu chi tiết.</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Stats Sidebar column */}
        <div className="space-y-6">
          {/* Capacity and Occupancy Stats Card */}
          <motion.div variants={itemVariants}>
            <Card className="border border-white/5 bg-slate-900/40 shadow-2xl backdrop-blur-md overflow-hidden rounded-3xl">
              <CardHeader className="border-b border-white/5 bg-slate-950/30 p-5">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-300 font-mono">Hiệu suất bãi đỗ</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-4">
                <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Số ô đang có xe</p>
                  <div className="mt-2 flex items-baseline justify-between">
                    <p className="text-2xl font-black text-white font-mono">{overview?.slots?.occupied ?? 0}</p>
                    <p className="text-xs font-bold text-slate-500 font-mono">/ {overview?.slots?.total ?? 0} ô đỗ</p>
                  </div>
                  {/* Visual Progress Bar */}
                  <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-800">
                    <div 
                      className="h-full bg-gradient-to-r from-orange-500 to-amber-500 shadow-[0_0_8px_rgba(249,115,22,0.4)] transition-all duration-500" 
                      style={{ width: `${overview?.slots?.occupancyRate ?? 0}%` }} 
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Tỉ lệ lấp đầy</p>
                  <p className="mt-2 text-2xl font-black text-orange-400 font-mono">{overview?.slots?.occupancyRate ?? 0}%</p>
                </div>

                <div className="rounded-2xl border border-white/5 bg-slate-950/60 p-4 border-l-4 border-l-orange-500 shadow-xl">
                  <p className="text-[9px] font-black uppercase tracking-wider text-orange-400 font-mono">Doanh thu ghi nhận ca ngày</p>
                  <p className="mt-2.5 text-2xl font-black text-white font-mono">{overview?.revenue?.today?.toLocaleString() ?? 0} <span className="text-xs font-black text-slate-400">VND</span></p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Feedbacks and subscriptions states */}
          <motion.div variants={itemVariants}>
            <Card className="border border-white/5 bg-slate-900/40 shadow-2xl backdrop-blur-md overflow-hidden rounded-3xl">
              <CardHeader className="border-b border-white/5 bg-slate-950/30 p-5">
                <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-300 font-mono">Yêu cầu & Gói dài hạn</CardTitle>
              </CardHeader>
              <CardContent className="p-5 space-y-3">
                <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Phản hồi cần xử lý</p>
                    <p className="mt-1 text-xl font-black text-white font-mono">{overview?.feedbacks?.pending ?? 0}</p>
                  </div>
                  {overview?.feedbacks?.pending && overview.feedbacks.pending > 0 ? (
                    <span className="flex h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_#f43f5e]" />
                  ) : null}
                </div>

                <div className="rounded-2xl border border-white/5 bg-slate-950/40 p-4">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400 font-mono">Đăng ký gói tháng đang hoạt động</p>
                  <p className="mt-1.5 text-xl font-black text-white font-mono">{overview?.subscriptions?.active ?? 0} <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">thuê bao</span></p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
}

