import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Building2,
  CalendarClock,
  Car,
  ChevronRight,
  Clock,
  History,
  LogOut,
  Package,
  User,
  Wallet,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  userApi,
  type Reservation,
  type UserWallet,
  type ParkingHistory,
} from '@/services/user/userApi';
import { StatusBadge } from '@/components/shared/StatusBadge';

const fmtVnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const fmtTime = (s?: string | null) =>
  s ? new Date(s).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Đang chờ',
  confirmed: 'Đã xác nhận',
  checked_in: 'Đã check-in',
  expired: 'Hết hạn',
  cancelled: 'Đã hủy',
};

export default function UserDashboardPage() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();

  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [activeSession, setActiveSession] = useState<ParkingHistory | null>(null);
  const [loading, setLoading] = useState(true);

  // All hooks must be declared before any conditional return (Rules of Hooks)
  useEffect(() => {
    if (!session) return;
    setLoading(true);
    Promise.all([
      userApi.wallet.get(),
      userApi.reservations.list({ limit: 5 }),
      userApi.parkingHistory.list({ limit: 5 }),
    ])
      .then(([walletRes, resRes, histRes]) => {
        // Backend returns { data: { walletBalance } }; tolerate a legacy { wallet } shape too.
        const walletData = (walletRes as any)?.data;
        const balance = walletData?.walletBalance ?? walletData?.wallet?.balance ?? 0;
        setWallet({ balance } as UserWallet);

        const reservItems = (resRes as any)?.data?.items ?? [];
        setReservations(reservItems);

        const histItems: ParkingHistory[] = (histRes as any)?.data?.items ?? [];
        const active = histItems.find((s) => s.status === 'active') ?? null;
        setActiveSession(active);
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [session]);

  if (!session) return <Navigate to="/auth/login" replace />;

  const onLogout = () => {
    logout();
    navigate('/', { replace: true });
  };

  const quickLinks = [
    { icon: Wallet, label: 'Ví của tôi', desc: 'Nạp tiền & lịch sử giao dịch', href: '/wallet', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
    { icon: Building2, label: 'Tòa nhà', desc: 'Xem bãi đỗ xe hiện có', href: '/buildings', color: 'text-blue-400 border-blue-500/20 bg-blue-500/5' },
    { icon: CalendarClock, label: 'Đặt chỗ', desc: 'Đặt vị trí trước', href: '/reservations', color: 'text-orange-400 border-orange-500/20 bg-orange-500/5' },
    { icon: History, label: 'Lịch sử gửi xe', desc: 'Xem các phiên gửi xe trước', href: '/parking-history', color: 'text-violet-400 border-violet-500/20 bg-violet-500/5' },
    { icon: Package, label: 'Gói dài hạn', desc: 'Đăng ký gói tháng', href: '/long-term-subscriptions', color: 'text-amber-400 border-amber-500/20 bg-amber-500/5' },
    { icon: User, label: 'Hồ sơ', desc: 'Cập nhật thông tin cá nhân', href: '/profile', color: 'text-slate-400 border-slate-500/20 bg-slate-500/5' },
  ];

  const activeReservations = reservations.filter((r) =>
    ['pending', 'confirmed', 'checked_in'].includes(r.status),
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/8 bg-slate-950/80 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">PBMS</p>
            <p className="text-sm font-bold text-white">
              Xin chào, {session.displayName || session.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-400 hover:text-white transition-colors"
            >
              <User size={14} />
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-rose-400 hover:text-rose-300 transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        {/* Wallet balance */}
        <div className="relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 to-amber-500/5 p-5">
          <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-orange-500/10 blur-2xl" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-orange-300/70">Số dư ví</p>
              <p className="mt-1 text-3xl font-black text-white">
                {loading ? '…' : fmtVnd.format(wallet?.balance ?? 0)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/wallet')}
              className="flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-xs font-bold text-orange-300 hover:bg-orange-500/20 transition-colors"
            >
              <Wallet size={13} /> Nạp tiền
            </button>
          </div>
        </div>

        {/* Active parking session */}
        {activeSession && (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/30 bg-emerald-500/10">
                  <Car size={16} className="text-emerald-400" />
                </div>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">Xe đang gửi</p>
                  <p className="font-mono text-sm font-black text-amber-300">{activeSession.plateNumber}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400">{activeSession.building?.name}</p>
                <p className="flex items-center justify-end gap-1 text-[10px] text-emerald-400">
                  <Clock size={10} /> Vào {fmtTime(activeSession.checkIn)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Active reservations */}
        {activeReservations.length > 0 && (
          <div>
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Đặt chỗ đang hoạt động ({activeReservations.length})
              </p>
              <button
                type="button"
                onClick={() => navigate('/reservations', { state: { openHistory: true } })}
                className="text-[10px] text-orange-400 hover:text-orange-300 font-semibold"
              >
                Xem tất cả →
              </button>
            </div>
            <div className="space-y-2">
              {activeReservations.slice(0, 3).map((r) => (
                <div key={r._id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-black text-orange-300">{r.code}</span>
                      <span className="rounded border border-amber-500/25 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                        {r.plateNumber}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {r.building?.name} · {fmtTime(r.startTime)}
                    </p>
                  </div>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick navigation */}
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Truy cập nhanh</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {quickLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => navigate(link.href)}
                  className={`flex items-center gap-3 rounded-xl border ${link.color} p-4 text-left transition-all hover:scale-[1.02] hover:shadow-lg`}
                >
                  <Icon size={18} className="shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white">{link.label}</p>
                    <p className="text-[10px] text-slate-400">{link.desc}</p>
                  </div>
                  <ChevronRight size={14} className="shrink-0 text-slate-500" />
                </button>
              );
            })}
          </div>
        </div>

        {/* License plates */}
        {session.licensePlates && session.licensePlates.length > 0 && (
          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Biển số xe của tôi</p>
            <div className="flex flex-wrap gap-2">
              {session.licensePlates.map((p) => (
                <span
                  key={p.plateNumber}
                  className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 font-mono text-xs font-black tracking-wider ${
                    p.isDefault
                      ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
                      : p.vehicleType === 'motorcycle'
                      ? 'border-purple-500/30 bg-purple-500/10 text-purple-400'
                      : 'border-blue-500/30 bg-blue-500/10 text-blue-400'
                  }`}
                >
                  {p.vehicleType === 'motorcycle' ? '🏍️' : '🚗'} {p.plateNumber}
                  {p.isDefault && <span className="text-[9px] font-sans font-bold uppercase">(Mặc định)</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
