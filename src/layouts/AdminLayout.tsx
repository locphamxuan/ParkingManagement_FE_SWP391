import { useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/shared/Sidebar';
import { Navbar } from '@/components/shared/Navbar';
import { useAuth } from '@/hooks/useAuth';
import { MOCK_ADMIN } from '@/utils/constants';

const titles: Record<string, string> = {
  '/admin/dashboard': 'Bảng điều khiển doanh nghiệp',
  '/admin/dashboard/buildings': 'Quản lý tòa nhà',
  '/admin/dashboard/managers': 'Quản lý nhân sự',
  '/admin/dashboard/users': 'Quản lý người dùng',
  '/admin/dashboard/revenue-analytics': 'Phân tích doanh thu',
  '/admin/dashboard/wallet-governance': 'Quản lý ví',
  '/admin/dashboard/pricing-policies': 'Chính sách giá',
  '/admin/dashboard/policy-push-logs': 'Lịch sử đẩy chính sách',
  '/admin/dashboard/audit-logs': 'Nhật ký kiểm toán',
  '/admin/dashboard/fraud-detection': 'Phát hiện gian lận',
  '/admin/dashboard/system-health': 'Tình trạng hệ thống',
  '/admin/dashboard/notifications': 'Thông báo',
  '/admin/dashboard/settings': 'Cài đặt',
};

export function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const title = useMemo(() => titles[location.pathname] ?? 'Admin Dashboard', [location.pathname]);

  return (
    <div className="admin-theme relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_8%,rgba(249,115,22,0.18),transparent_24%),radial-gradient(circle_at_86%_10%,rgba(251,191,36,0.12),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.55),rgba(255,247,237,0.16))]" />
      <div className="relative z-10 flex min-h-screen">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((prev) => !prev)} />
        <div className="flex min-h-screen flex-1 flex-col">
        <Navbar
          title={title}
          email={session?.email ?? MOCK_ADMIN.email}
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
