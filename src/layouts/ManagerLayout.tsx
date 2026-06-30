import { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate, useMatch } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { ManagerSidebar } from '@/components/layout/ManagerSidebar';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_EMAIL_FALLBACK } from '@/utils/constants';
import { useManagerBuildings } from '@/hooks/useManagerBuildings';

const titles: Record<string, string> = {
  '/manager': 'Manager Dashboard',
  '/manager/dashboard': 'Management report',
  '/manager/buildings': 'Building Management',
  '/manager/vehicle-types': 'Vehicle Type',
  '/manager/floors': 'Floor',
  '/manager/gates': 'Gate',
  '/manager/slots': 'Gate',
  '/manager/operating-hours': 'Operating Hour',
  '/manager/price-policies': 'Price Policy',
  '/manager/reservation-policy': 'Reservation Policy',
  '/manager/packages': 'Package',
  '/manager/shifts': 'Shilf',
  '/manager/reviews': 'Review',
  '/manager/wallet': 'Wallet',
  '/manager/profile': 'Profile',
  '/manager/settings': 'Setting',
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
        <ManagerSidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
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
