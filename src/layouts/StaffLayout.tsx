import { useEffect, useMemo, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { CalendarClock, Car, LayoutDashboard, LogOut } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { staffApi, extractBuildings, type StaffBuilding } from '@/services/staff/staffApi';
import { cn } from '@/utils/cn';

const navItems = [
  { to: '', label: 'Tổng quan', icon: LayoutDashboard, end: true },
  { to: 'my-shifts', label: 'Ca làm việc', icon: CalendarClock },
  { to: 'sessions', label: 'Phiên gửi xe', icon: Car },
];

const pageTitle: Record<string, string> = {
  '': 'Tổng quan',
  'my-shifts': 'Ca làm việc của tôi',
  sessions: 'Phiên gửi xe',
};

export function StaffLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [buildings, setBuildings] = useState<StaffBuilding[]>([]);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

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

  const title = pageTitle[slug] ?? 'Nhân viên';
  const selectedBuilding = buildings.find((b) => b._id === selectedBuildingId);

  const onLogout = () => {
    logout();
    navigate('/auth/login', { replace: true });
  };

  return (
    <div className="admin-theme relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(16,185,129,0.14),transparent_24%),radial-gradient(circle_at_86%_10%,rgba(52,211,153,0.10),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.55),rgba(240,253,250,0.16))]" />

      <div className="relative z-10 flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-[240px] flex-col border-r border-border/80 bg-[rgba(240,253,250,0.92)] p-3 shadow-[12px_0_36px_rgba(16,185,129,0.10)] backdrop-blur-2xl lg:flex">
          <div className="mb-4 rounded-2xl border border-border/80 bg-white/78 p-3 shadow-[0_10px_24px_rgba(16,185,129,0.08)]">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-700">PBMS Staff</p>
            <p className="mt-1 text-sm font-semibold text-black">Vận hành ca trực</p>
            {selectedBuilding ? (
              <p className="mt-1 truncate text-xs text-stone-500">
                {selectedBuilding.code} · {selectedBuilding.name}
              </p>
            ) : null}
          </div>

          <nav className="flex-1 space-y-0.5 overflow-y-auto pr-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition',
                      isActive
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-[0_8px_18px_rgba(16,185,129,0.22)]'
                        : 'text-stone-700 hover:bg-emerald-500/10 hover:text-black'
                    )
                  }
                >
                  <Icon size={15} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-border/80 bg-[rgba(240,253,250,0.86)] px-4 py-3 backdrop-blur-2xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-[0.18em] text-emerald-700">Nhân viên</p>
                <h1 className="text-xl font-semibold text-black">{title}</h1>
              </div>

              <div className="flex items-center gap-2">
                {buildings.length > 1 ? (
                  <select
                    value={selectedBuildingId ?? ''}
                    onChange={(e) => setSelectedBuildingId(e.target.value)}
                    className="h-9 rounded-md border border-border bg-white px-3 text-sm text-foreground outline-none"
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
                    <Button variant="secondary" size="sm" className="gap-2">
                      <span className="max-w-[150px] truncate text-xs sm:text-sm">
                        {user?.email}
                      </span>
                    </Button>
                  </DropdownMenu.Trigger>
                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      sideOffset={6}
                      className="z-50 min-w-[200px] rounded-md border border-border/80 bg-[rgba(240,253,250,0.98)] p-1 shadow-[0_20px_45px_rgba(16,185,129,0.14)]"
                    >
                      <div className="px-3 py-2">
                        <p className="text-sm font-semibold text-foreground">{user?.fullName}</p>
                        <p className="text-xs text-muted-foreground">{user?.role}</p>
                      </div>
                      <DropdownMenu.Separator className="my-1 h-px bg-border/80" />
                      <DropdownMenu.Item
                        className="flex items-center gap-2 rounded px-3 py-2 text-sm text-emerald-700 outline-none hover:bg-emerald-500/10 cursor-pointer"
                        onClick={onLogout}
                      >
                        <LogOut size={14} /> Đăng xuất
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6">
            {bootstrapping ? (
              <div className="text-sm text-muted-foreground">Đang tải...</div>
            ) : !selectedBuildingId ? (
              <div className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
                Tài khoản này chưa được gán tòa nhà nào. Vui lòng liên hệ quản lý.
              </div>
            ) : (
              <Outlet context={{ buildingId: selectedBuildingId }} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
