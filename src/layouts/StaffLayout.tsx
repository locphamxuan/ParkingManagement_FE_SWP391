import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  CalendarCheck2,
  Car,
  ChevronLeft,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  ScanLine,
  ShieldAlert,
  User,
  Wallet,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useAssignedGates } from '@/hooks/staff/useAssignedGates';
import { staffApi, extractBuildings, type StaffBuilding } from '@/services/staff/staffApi';
import { cn } from '@/utils/cn';

const BASE_PAGE_TITLE: Record<string, string> = {
  '': 'Tổng quan',
  dashboard: 'Tổng quan',
  operations: 'Check-in xe vào',
  checkout: 'Check-out xe ra',
  parked: 'Xe đang đỗ',
  reservations: 'Đặt chỗ trước',
  'my-shifts': 'Ca làm việc của tôi',
  incidents: 'Quản lý sự cố',
};

export function StaffLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showCheckIn, showCheckOut } = useAssignedGates();
  const [buildings, setBuildings] = useState<StaffBuilding[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  // Cổng vào → check-in (cổng vào mới hiện tab này). Trang "Xe đang đỗ" hiện cho
  // cả hai loại nhân viên, nhưng chỉ nhân viên cổng ra mới thao tác thanh toán.
  const navItems = useMemo(
    () => [
      { to: '', label: 'Tổng quan', icon: LayoutDashboard, end: true },
      ...(showCheckIn ? [{ to: 'operations', label: 'Check-in xe vào', icon: ScanLine }] : []),
      ...(showCheckOut ? [{ to: 'checkout', label: 'Check-out xe ra', icon: LogOut }] : []),
      { to: 'parked', label: 'Xe đang đỗ', icon: Car },
      { to: 'reservations', label: 'Đặt chỗ trước', icon: CalendarCheck2 },
      { to: 'my-shifts', label: 'Ca làm việc', icon: CalendarClock },
      ...(showCheckIn || showCheckOut ? [{ to: 'sessions', label: showCheckOut ? 'Doanh thu ca' : 'Lịch sử xe vào', icon: showCheckOut ? Wallet : Car }] : []),
      { to: 'incidents', label: 'Sự cố', icon: ShieldAlert },
    ],
    [showCheckIn, showCheckOut],
  );

  useEffect(() => {
    staffApi
      .buildings()
      .then((res) => {
        const list = extractBuildings(res.data as StaffBuilding[] | { items: StaffBuilding[] });
        setBuildings(list);
        setSelectedBuildingId(list[0]?._id ?? null);
      })
      .catch(() => undefined)
      .finally(() => setBootstrapping(false));
  }, []);

  const slug = useMemo(() => {
    const tail = location.pathname.replace(/^\/staff\/?/, '');
    if (!tail) return '';
    return tail.split('/')[0];
  }, [location.pathname]);

  const title = slug === 'sessions'
    ? (showCheckOut ? 'Doanh thu ca' : 'Lịch sử xe vào')
    : (BASE_PAGE_TITLE[slug] ?? 'Nhân viên');
  const selectedBuilding = buildings.find((b) => b._id === selectedBuildingId);
  const isProfileRoute = Boolean(useMatch('/staff/profile'));

  const onLogout = () => {
    logout();
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="admin-theme relative min-h-screen bg-background text-foreground">
      {/* Background glows */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08),transparent_65%)] blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[320px] w-[320px] rounded-full bg-[radial-gradient(circle_at_center,rgba(52,211,153,0.05),transparent_60%)] blur-3xl" />
      </div>

      <div className="relative z-10 flex min-h-screen">
        {/* ── Sidebar ── */}
        <aside
          className={cn(
            'sticky top-0 hidden h-screen border-r border-white/8 bg-slate-900/95 p-4 shadow-[4px_0_30px_rgba(0,0,0,0.25)] backdrop-blur-xl lg:flex lg:flex-col transition-all duration-300 ease-in-out',
            collapsed ? 'w-[80px]' : 'w-[248px]',
          )}
        >
          {/* Sidebar header */}
          <div className="mb-5 flex items-center justify-between rounded-2xl border border-white/8 bg-slate-800/60 p-3 shadow-sm">
            {!collapsed ? (
              <div className="pl-1 min-w-0">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
                  PBMS Staff
                </p>
                <p className="text-xs font-extrabold text-slate-100">Nhân viên vận hành</p>
                {selectedBuilding ? (
                  <p className="mt-0.5 truncate text-[10px] text-slate-500">
                    {selectedBuilding.code} · {selectedBuilding.name}
                  </p>
                ) : null}
              </div>
            ) : (
              <ScanLine
                size={18}
                className="mx-auto text-emerald-400 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]"
              />
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCollapsed((p) => !p)}
              className="h-7 w-7 shrink-0 rounded-lg p-0 text-slate-400 hover:bg-white/8 hover:text-white"
            >
              <ChevronLeft
                size={14}
                className={cn('transition-transform duration-300', collapsed && 'rotate-180')}
              />
            </Button>
          </div>

          {/* Nav */}
          <nav className="flex-1 space-y-1 overflow-y-auto pr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-200',
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25 scale-[1.02]'
                        : 'text-slate-400 hover:bg-white/6 hover:text-slate-100',
                    )
                  }
                >
                  <Icon size={15} className="shrink-0" />
                  {!collapsed ? <span className="tracking-wide">{item.label}</span> : null}
                </NavLink>
              );
            })}
          </nav>
        </aside>

        {/* ── Main area ── */}
        <div className="flex min-h-screen flex-1 flex-col">
          {/* Header */}
          <header className="sticky top-0 z-20 border-b border-white/8 bg-slate-950/80 px-5 py-3 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">
                  Nhân viên
                </p>
                <h1 className="text-lg font-semibold text-white">{title}</h1>
              </div>

              <div className="flex items-center gap-2">
                {buildings.length > 1 ? (
                  <select
                    value={selectedBuildingId ?? ''}
                    onChange={(e) => setSelectedBuildingId(e.target.value)}
                    className="h-9 rounded-lg border border-white/10 bg-slate-800 px-3 text-sm text-slate-200 outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    {buildings.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.code} — {b.name}
                      </option>
                    ))}
                  </select>
                ) : null}

                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button
                      type="button"
                      className="group inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-slate-900/80 px-3.5 py-2 text-xs font-semibold text-slate-200 shadow-md backdrop-blur-md transition-all duration-300 hover:bg-slate-800/80 hover:border-emerald-500/30 hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 text-xs font-extrabold text-emerald-400 border border-emerald-500/30 shadow-inner">
                        {(user?.fullName ?? user?.email ?? 'S')[0]?.toUpperCase()}
                      </span>
                      <span className="max-w-[120px] truncate text-slate-200 font-bold tracking-wide">
                        {user?.fullName || user?.email?.split('@')[0]}
                      </span>
                      <ChevronDown size={13} className="shrink-0 text-slate-500 transition-transform duration-300 group-aria-expanded:rotate-180 ml-0.5" />
                    </button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      sideOffset={6}
                      className="z-50 w-72 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-[0_20px_45px_rgba(0,0,0,0.5)]"
                    >
                      {/* Profile card */}
                      <div className="border-b border-white/8 px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10">
                            <span className="text-base font-bold text-emerald-400">
                              {(user?.fullName ?? user?.email ?? 'S')[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate">
                              {user?.fullName || 'Nhân viên'}
                            </p>
                            <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-500">
                              Staff
                            </p>
                          </div>
                        </div>

                        {/* Building info */}
                        {selectedBuilding && (
                          <div className="mt-3 rounded-xl border border-white/8 bg-slate-800/60 px-3 py-2">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tòa nhà phụ trách</p>
                            <p className="mt-0.5 text-xs font-semibold text-slate-200">
                              {selectedBuilding.name}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {selectedBuilding.code}
                              {selectedBuilding.operatingHours
                                ? ` · ${selectedBuilding.operatingHours.open}–${selectedBuilding.operatingHours.close}`
                                : ''}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="p-1.5 space-y-1">
                        <DropdownMenu.Item
                          className="flex cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-300 outline-none transition-all duration-200 hover:bg-emerald-500/10 hover:text-emerald-400 focus:bg-emerald-500/10 focus:text-emerald-400"
                          onClick={() => navigate('/staff/profile')}
                        >
                          <User size={14} className="text-emerald-400" /> Xem hồ sơ
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator className="my-1.5 h-px bg-white/8" />
                        <DropdownMenu.Item
                          className="flex cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-rose-400 outline-none transition-all duration-200 hover:bg-rose-500/10 hover:text-rose-300 focus:bg-rose-500/10 focus:text-rose-300"
                          onClick={onLogout}
                        >
                          <LogOut size={14} /> Đăng xuất
                        </DropdownMenu.Item>
                      </div>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            </div>
          </header>

          {/* Content */}
          <main className="flex-1 p-4 md:p-6">
            {bootstrapping && !isProfileRoute ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-slate-400">
                Đang tải...
              </div>
            ) : !selectedBuildingId && !isProfileRoute ? (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-6 text-sm text-amber-200">
                Tài khoản này chưa được gán tòa nhà nào. Vui lòng liên hệ quản lý.
              </div>
            ) : (
              <Outlet
                context={{ buildingId: selectedBuildingId ?? '', building: selectedBuilding ?? null }}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
