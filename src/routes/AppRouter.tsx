import { Navigate, Route, Routes } from 'react-router-dom';
import { AdminLayout } from '@/layouts/AdminLayout';
import { ManagerLayout } from '@/layouts/ManagerLayout';
import { DashboardOverviewPage } from '@/pages/admin/DashboardOverviewPage';
import { LoginPage } from '@/pages/admin/LoginPage';
import { BuildingsPage } from '@/pages/admin/BuildingsPage';
import { UsersPage } from '@/pages/admin/UsersPage';
import { RevenueAnalyticsPage } from '@/pages/admin/RevenueAnalyticsPage';
import { AuditLogsPage } from '@/pages/admin/AuditLogsPage';
import { FraudDetectionPage } from '@/pages/admin/FraudDetectionPage';
import { SystemHealthPage } from '@/pages/admin/SystemHealthPage';
import { ModulePlaceholderPage } from '@/pages/admin/ModulePlaceholderPage';
import {
  ManagerDashboardPage,
  ManagerFloorsPage,
  ManagerSlotsPage,
  ManagerVehiclesPage,
  ManagerPricingPage,
  ManagerPackagesPage,
  ManagerStaffPage,
  ManagerRevenueReportPage,
  ManagerFeedbackPage,
  ManagerAuditLogsPage,
} from '@/pages/manager';
import { HomeRoute } from '@/pages/public/HomeRoute';
import { DashboardRoute } from '@/pages/public/DashboardRoute';
import { PublicLoginRoute, PublicRegisterRoute } from '@/pages/public/AuthRoutes';
import { ProtectedRoute } from '@/routes/ProtectedRoute';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/dashboard" element={<DashboardRoute />} />
      <Route path="/auth/login" element={<PublicLoginRoute />} />
      <Route path="/auth/register" element={<PublicRegisterRoute />} />

      <Route path="/admin/login" element={<LoginPage />} />
      <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
      <Route path="/admin/direct" element={<AdminLayout />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/admin/dashboard" element={<AdminLayout />}>
          <Route index element={<DashboardOverviewPage />} />
          <Route path="buildings" element={<BuildingsPage />} />
          <Route
            path="managers"
            element={<ModulePlaceholderPage title="Quản lý" description="Quy trình phân công quản lý và bảng điều khiển quản trị." />}
          />
          <Route path="users" element={<UsersPage />} />
          <Route path="revenue-analytics" element={<RevenueAnalyticsPage />} />
          <Route
            path="wallet-governance"
            element={<ModulePlaceholderPage title="Quản lý ví" description="Điều khiển ví hệ thống, khung phân phối và phê duyệt." />}
          />
          <Route
            path="pricing-policies"
            element={<ModulePlaceholderPage title="Chính sách giá" description="Phạm vi chính sách, mẫu chính sách và ràng buộc theo vai trò." />}
          />
          <Route
            path="policy-push-logs"
            element={<ModulePlaceholderPage title="Lịch sử đẩy chính sách" description="Lịch sử đẩy chính sách giữa tòa nhà và thao tác hoàn tác." />}
          />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="fraud-detection" element={<FraudDetectionPage />} />
          <Route path="system-health" element={<SystemHealthPage />} />
          <Route
            path="notifications"
            element={<ModulePlaceholderPage title="Thông báo" description="Mẫu thông báo, giám sát hàng đợi và kênh gửi." />}
          />
          <Route
            path="settings"
            element={<ModulePlaceholderPage title="Cài đặt" description="Cấu hình nền tảng, chính sách truy cập và tùy chọn vận hành." />}
          />
        </Route>

        <Route path="/manager/dashboard" element={<ManagerLayout />}>
          <Route index element={<ManagerDashboardPage />} />
          <Route path="floors" element={<ManagerFloorsPage />} />
          <Route path="slots" element={<ManagerSlotsPage />} />
          <Route path="vehicles" element={<ManagerVehiclesPage />} />
          <Route path="pricing" element={<ManagerPricingPage />} />
          <Route path="packages" element={<ManagerPackagesPage />} />
          <Route path="staff" element={<ManagerStaffPage />} />
          <Route path="revenue-report" element={<ManagerRevenueReportPage />} />
          <Route path="feedback" element={<ManagerFeedbackPage />} />
          <Route path="audit-logs" element={<ManagerAuditLogsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
