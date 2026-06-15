import { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { ADMIN_EMAIL_FALLBACK } from '@/utils/constants';

const titles: Record<string, string> = {
  '/admin/dashboard': 'Bảng điều khiển doanh nghiệp',
  '/admin/dashboard/buildings': 'Quản lý tòa nhà',
  '/admin/dashboard/users': 'Quản lý người dùng',
  '/admin/dashboard/revenue-analytics': 'Phân tích doanh thu',
  '/admin/dashboard/subscription-packages': 'Gói dịch vụ hệ thống',
  '/admin/dashboard/wallet-governance': 'Ví hệ thống',
  '/admin/dashboard/audit-logs': 'Nhật ký kiểm toán',
  '/admin/dashboard/notifications': 'Thông báo',
  '/admin/dashboard/profile': 'Hồ sơ cá nhân',
  '/admin/dashboard/settings': 'Cài đặt',
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
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
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
