import { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate, useMatch } from 'react-router-dom';
import {
  Building2,
  Car,
  ClipboardList,
  Clock,
  Flag,
  LayoutDashboard,
  Layers,
  MapPin,
  MessageSquare,
  Package,
  ShieldAlert,
  SlidersHorizontal,
  Square,
  Truck,
  User,
  Users,
  Wallet,
} from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { PortalSidebar, type PortalNavEntry } from '@/components/layout/PortalSidebar';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_EMAIL_FALLBACK } from '@/utils/constants';
import { useManagerBuildings } from '@/hooks/useManagerBuildings';

// Sidebar gom nhóm theo tần suất sử dụng: mục thao tác hằng ngày đứng riêng,
// mục cấu hình ít đụng tới được gấp vào nhóm collapsible.
const navItems: readonly PortalNavEntry[] = [
  { to: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { to: 'sessions', label: 'Parked Vehicles', icon: Car },
  {
    label: 'Infrastructure',
    icon: Building2,
    children: [
      { to: 'buildings', label: 'Buildings', icon: Building2 },
      { to: 'floors', label: 'Floors', icon: ClipboardList },
      { to: 'zones', label: 'Zones', icon: Layers },
      { to: 'gates', label: 'Gates', icon: Flag },
      { to: 'slots', label: 'Parking Slots', icon: Square },
      { to: 'vehicle-types', label: 'Vehicle Types', icon: Truck },
    ],
  },
  {
    label: 'Business',
    icon: Package,
    children: [
      { to: 'packages', label: 'Packages', icon: Package },
      { to: 'price-policies', label: 'Price Policies', icon: SlidersHorizontal },
      { to: 'refund-policy', label: 'Refund Policy', icon: MapPin },
      { to: 'wallet', label: 'Building Wallet', icon: Wallet },
    ],
  },
  {
    label: 'Staff & Shifts',
    icon: Users,
    children: [
      { to: 'staff', label: 'Staff', icon: User },
      { to: 'shifts', label: 'Shifts & Assignments', icon: Users },
      { to: 'operating-hours', label: 'Operating Hours', icon: Clock },
    ],
  },
  {
    label: 'Customer Care',
    icon: MessageSquare,
    children: [
      { to: 'incidents', label: 'Incidents', icon: ShieldAlert },
      { to: 'reviews', label: 'Reviews', icon: MessageSquare },
    ],
  },
];

const titles: Record<string, string> = {
  '/manager': 'Manager Dashboard',
  '/manager/dashboard': 'Management Report',
  '/manager/buildings': 'Building Management',
  '/manager/vehicle-types': 'Vehicle Types',
  '/manager/floors': 'Floors',
  '/manager/gates': 'Gates',
  '/manager/zones': 'Zones',
  '/manager/slots': 'Parking Slots',
  '/manager/operating-hours': 'Operating Hours',
  '/manager/price-policies': 'Price Policies',
  '/manager/refund-policy': 'Refund Policy',
  '/manager/packages': 'Package Management',
  '/manager/shifts': 'Shifts & Assignments',
  '/manager/sessions': 'Parked Vehicles',
  '/manager/reviews': 'Reviews',
  '/manager/incidents': 'Incidents',
  '/manager/wallet': 'Building Wallet',
  '/manager/profile': 'Profile',
};

export function ManagerLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { session, logout } = useAuth();
  const { selectedBuildingId, isLoading } = useManagerBuildings();
  const navigate = useNavigate();
  const location = useLocation();

  const title = useMemo(() => titles[location.pathname] ?? 'Manager Dashboard', [location.pathname]);
  const isProfileRoute = Boolean(useMatch('/manager/profile'));

  return (
    <div className="admin-theme relative min-h-screen bg-slate-950 text-foreground">
      {/* Subtle teal/orange ambient glow for manager theme */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle_at_center,rgba(14,116,144,0.06),transparent_65%)] blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.04),transparent_60%)] blur-3xl" />
      </div>
      <div className="relative z-10 flex min-h-screen">
        <PortalSidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((prev) => !prev)}
          portalLabel="MANAGER PORTAL"
          items={navItems}
          basePath="/manager"
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
            {isLoading && !isProfileRoute ? (
              <div className="text-sm text-muted-foreground">Loading...</div>
            ) : !selectedBuildingId && !isProfileRoute ? (
              <div className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
                
                This account has not been assigned to any building. Please contact the manager. 
              </div>
            ) : (
              <Outlet
                context={{
                  buildingId: selectedBuildingId ?? '',
                }}
              />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
