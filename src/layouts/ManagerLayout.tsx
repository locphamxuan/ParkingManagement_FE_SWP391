import { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ManagerSidebar } from '@/components/shared/ManagerSidebar';
import { Navbar } from '@/components/shared/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { MOCK_ADMIN } from '@/utils/constants';

const titles: Record<string, string> = {
  '/manager/dashboard': 'Bảng điều khiển quản lý',
  '/manager/dashboard/floors': 'Quản lý tầng',
  '/manager/dashboard/slots': 'Quản lý chỗ đỗ',
  '/manager/dashboard/vehicles': 'Quản lý phương tiện',
  '/manager/dashboard/pricing': 'Chính sách giá',
  '/manager/dashboard/packages': 'Quản lý gói',
  '/manager/dashboard/staff': 'Quản lý nhân viên',
  '/manager/dashboard/revenue-report': 'Báo cáo doanh thu',
  '/manager/dashboard/feedback': 'Phản hồi',
  '/manager/dashboard/audit-logs': 'Nhật ký kiểm toán',
};

export function ManagerLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const title = useMemo(() => titles[location.pathname] ?? 'Manager Dashboard', [location.pathname]);

  return (
    <div className="admin-theme relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(249,115,22,0.18),transparent_24%),radial-gradient(circle_at_86%_10%,rgba(251,191,36,0.12),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.55),rgba(255,247,237,0.16))]" />
      <div className="relative z-10 flex min-h-screen">
        <ManagerSidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
        <div className="flex min-h-screen flex-1 flex-col">
          <Navbar
            title={title}
            email={session?.email ?? MOCK_ADMIN.email}
            dropdownType="manager"
            onLogout={() => {
              logout();
              navigate('/', { replace: true });
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
