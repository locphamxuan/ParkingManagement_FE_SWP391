import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  Bell,
  Building2,
  CalendarClock,
  Car,
  ChevronRight,
  Clock,
  History,
  LogOut,
  Package,
  ShieldAlert,
  User,
  Wallet,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  userApi,
  type UserWallet,
  type ParkingHistory,
} from '@/services/user/userApi';
import { UserNotificationBell } from '@/components/layout/UserNotificationBell';

const fmtVnd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });
const fmtTime = (s?: string | null) =>
  s ? new Date(s).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }) : '—';

export default function UserDashboardPage() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();

  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [activeSession, setActiveSession] = useState<ParkingHistory | null>(null);
  const [loading, setLoading] = useState(true);

  // All hooks must be declared before any conditional return (Rules of Hooks)
  useEffect(() => {
    if (!session) return;
    setLoading(true);
    Promise.all([
      userApi.wallet.get(),
      userApi.parkingHistory.list({ limit: 5 }),
    ])
      .then(([walletRes, histRes]) => {
        // Backend returns { data: { walletBalance } }; tolerate a legacy { wallet } shape too.
        const walletData = walletRes.data as { wallet?: { balance?: number }; walletBalance?: number };
        const balance = walletData.walletBalance ?? walletData.wallet?.balance ?? 0;
        setWallet({ balance } as UserWallet);

        const histItems: ParkingHistory[] = histRes.data.items ?? [];
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
    { icon: Wallet, label: 'My Wallet', desc: 'Deposit & transactions', href: '/wallet', color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
    { icon: Building2, label: 'Buildings', desc: 'Browse parking lots', href: '/buildings', color: 'text-blue-400 border-blue-500/20 bg-blue-500/5' },
    { icon: CalendarClock, label: 'Buy Package', desc: 'Purchase a long-term package', href: '/packages/buy', color: 'text-orange-400 border-orange-500/20 bg-orange-500/5' },
    { icon: History, label: 'Parking History', desc: 'Browse past parking logs', href: '/parking-history', color: 'text-violet-400 border-violet-500/20 bg-violet-500/5' },
    { icon: Package, label: 'Subscriptions', desc: 'Subscribe to monthly packages', href: '/long-term-subscriptions', color: 'text-amber-400 border-amber-500/20 bg-amber-500/5' },
    { icon: Bell, label: 'Notifications', desc: 'View all system notifications', href: '/notifications', color: 'text-rose-400 border-rose-500/20 bg-rose-500/5' },
    { icon: ShieldAlert, label: 'Report Incident', desc: 'Report a parking issue', href: '/report-incident', color: 'text-orange-400 border-orange-500/20 bg-orange-500/5' },
    { icon: User, label: 'Profile', desc: 'Update personal details', href: '/profile', color: 'text-slate-400 border-slate-500/20 bg-slate-500/5' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/8 bg-slate-950/80 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">PBMS</p>
            <p className="text-sm font-bold text-white">
              Welcome, {session.displayName || session.email}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <UserNotificationBell />
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
              <p className="text-[10px] font-bold uppercase tracking-widest text-orange-300/70">Wallet Balance</p>
              <p className="mt-1 text-3xl font-black text-white">
                {loading ? '…' : fmtVnd.format(wallet?.balance ?? 0)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/wallet')}
              className="flex items-center gap-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-xs font-bold text-orange-300 hover:bg-orange-500/20 transition-colors"
            >
              <Wallet size={13} /> Deposit
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
                  <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">Active Parking</p>
                  <p className="font-mono text-sm font-black text-amber-300">{activeSession.plateNumber}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-400">{activeSession.building?.name}</p>
                <p className="flex items-center justify-end gap-1 text-[10px] text-emerald-400">
                  <Clock size={10} /> In: {fmtTime(activeSession.checkIn)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick navigation */}
        <div>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Quick Access</p>
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
            <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">My License Plates</p>
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
                  {p.isDefault && <span className="text-[9px] font-sans font-bold uppercase">(Default)</span>}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
