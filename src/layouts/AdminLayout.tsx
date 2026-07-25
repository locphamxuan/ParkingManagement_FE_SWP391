import { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  CircleDollarSign,
  FileSearch,
  LayoutDashboard,
  Users,
} from 'lucide-react';
import { PortalSidebar, type PortalNavItem } from '@/components/layout/PortalSidebar';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_EMAIL_FALLBACK } from '@/utils/constants';

const navItems: readonly PortalNavItem[] = [
  { to: '', label: 'Overview', icon: LayoutDashboard },
  { to: 'buildings', label: 'Buildings', icon: Building2 },
  { to: 'users', label: 'Users', icon: Users },
  { to: 'revenue-analytics', label: 'Revenue Analytics', icon: CircleDollarSign },
  { to: 'audit-logs', label: 'Audit Logs', icon: FileSearch },
];

const titles: Record<string, string> = {
  '/admin': 'Business Dashboard',
  '/admin/dashboard': 'Business Dashboard',
  '/admin/buildings': 'Building Management',
  '/admin/users': 'User Management',
  '/admin/revenue-analytics': 'Revenue Analytics',
  '/admin/audit-logs': 'Audit Logs',
  '/admin/profile': 'Profile',
};

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const title = useMemo(() => titles[location.pathname] ?? 'Admin Dashboard', [location.pathname]);

  return (
    <div className="admin-theme relative min-h-screen bg-slate-950 text-foreground">
      {/* Subtle ambient glow for depth — kept low opacity so cards stand out */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.06),transparent_65%)] blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.04),transparent_60%)] blur-3xl" />
      </div>
      <div className="relative z-10 flex min-h-screen">
        <PortalSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((prev) => !prev)}
          portalLabel="ADMIN PORTAL"
          items={navItems}
        />
        <div className="flex min-h-screen flex-1 flex-col">
          <Navbar
            title={title}
            email={session?.email ?? ADMIN_EMAIL_FALLBACK}
            fullName={session?.displayName}
            role={session?.role}
            showNotification={false}
            onLogout={() => {
              logout();
              navigate('/auth/login', { replace: true });
            }}
          />
          <main className="flex-1 p-4 md:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
