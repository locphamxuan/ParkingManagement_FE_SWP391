import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom';
import {
  CalendarClock,
  Car,
  ChevronLeft,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  ScanLine,
  ShieldAlert,
  User,
} from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { staffApi, extractBuildings, type StaffBuilding } from '@/services/staff/staffApi';
import { cn } from '@/utils/cn';

const BASE_PAGE_TITLE: Record<string, string> = {
  '': 'Overview',
  dashboard: 'Overview',
  operations: 'Vehicle Check-in',
  checkout: 'Vehicle Check-out',
  parked: 'Parked Vehicles',
  'my-shifts': 'My Shifts',
  incidents: 'Incident Management',
};

export function StaffLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, user, logout } = useAuth();
  const assignedBuildingId = session?.assignedBuildingIds?.[0] ?? null;
  const [buildings, setBuildings] = useState<StaffBuilding[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(assignedBuildingId);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  // Staff nào cũng thao tác được cả hai chiều — gate được gán chỉ hiển thị dạng badge.
  const navItems = useMemo(
    () => [
      { to: '', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: 'operations', label: 'Vehicle Check-in', icon: ScanLine },
      { to: 'checkout', label: 'Vehicle Check-out', icon: LogOut },
      { to: 'parked', label: 'Parked Vehicles', icon: Car },
      { to: 'my-shifts', label: 'My Shifts', icon: CalendarClock },
      { to: 'sessions', label: 'Check-in History', icon: Car },
      { to: 'incidents', label: 'Incidents', icon: ShieldAlert },
    ],
    [],
  );

  useEffect(() => {
    const assignedBuildingId = session?.assignedBuildingIds?.[0] ?? null;

    const loadBuildings = async () => {
      try {
        const res = await staffApi.buildings();
        const list = extractBuildings(res);
        if (list.length > 0) {
          setBuildings(list);
          setSelectedBuildingId((prev) => prev || list[0]._id || assignedBuildingId);
        } else if (assignedBuildingId) {
          const detailRes = await staffApi.buildingDetail(assignedBuildingId);
          const building = detailRes && typeof detailRes === 'object' && 'data' in detailRes ? (detailRes as { data?: StaffBuilding }).data : detailRes as StaffBuilding;
          if (building && building._id) {
            setBuildings([building]);
            setSelectedBuildingId(building._id);
          } else {
            setSelectedBuildingId(null);
          }
        } else {
          setSelectedBuildingId(null);
        }
      } catch {
        setSelectedBuildingId(assignedBuildingId);
      } finally {
        setBootstrapping(false);
      }
    };

    void loadBuildings();
  }, [session?.assignedBuildingIds]);

  const slug = useMemo(() => {
    const tail = location.pathname.replace(/^\/staff\/?/, '');
    if (!tail) return '';
    return tail.split('/')[0];
  }, [location.pathname]);

  const title = slug === 'sessions'
    ? 'Check-in History'
    : (BASE_PAGE_TITLE[slug] ?? 'Staff');
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
                <p className="text-xs font-extrabold text-slate-100">Operations Staff</p>
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
                  Staff
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
                              {user?.fullName || 'Staff'}
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
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Assigned Building</p>
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
                          <User size={14} className="text-emerald-400" /> View Profile
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator className="my-1.5 h-px bg-white/8" />
                        <DropdownMenu.Item
                          className="flex cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-bold text-rose-400 outline-none transition-all duration-200 hover:bg-rose-500/10 hover:text-rose-300 focus:bg-rose-500/10 focus:text-rose-300"
                          onClick={onLogout}
                        >
                          <LogOut size={14} /> Sign Out
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
                Loading...
              </div>
            ) : !selectedBuildingId && !isProfileRoute ? (
              <div className="rounded-2xl border border-amber-500/20 bg-amber-500/8 p-6 text-sm text-amber-200">
                This account has not been assigned to any building. Please contact your manager.
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
