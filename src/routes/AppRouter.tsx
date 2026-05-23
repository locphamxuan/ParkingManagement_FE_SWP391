import { Navigate, Route, Routes } from 'react-router-dom';
import { ScrollToTop } from '@/components/shared/ScrollToTop';
import { AdminLayout } from '@/layouts/AdminLayout';
import { DashboardOverviewPage } from '@/pages/admin/DashboardOverviewPage';
import { BuildingsPage } from '@/pages/admin/BuildingsPage';
import { UsersPage } from '@/pages/admin/UsersPage';
import { RevenueAnalyticsPage } from '@/pages/admin/RevenueAnalyticsPage';
import { AuditLogsPage } from '@/pages/admin/AuditLogsPage';
import { AdminProfilePage } from '@/pages/admin/AdminProfilePage';
import { FraudDetectionPage } from '@/pages/admin/FraudDetectionPage';
import { SystemHealthPage } from '@/pages/admin/SystemHealthPage';
import { ModulePlaceholderPage } from '@/pages/admin/ModulePlaceholderPage';
import { HomeRoute } from '@/pages/public/HomeRoute';
import ProfilePage from '@/pages/public/ProfilePage';
import { PublicLoginRoute, PublicRegisterRoute } from '@/pages/public/AuthRoutes';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { ManagerLayout } from '@/layouts/ManagerLayout';
import { ManagerBuildingsPage } from '@/pages/manager/ManagerBuildingsPage';
import { ManagerDashboardPage } from '@/pages/manager/ManagerDashboardPage';
import { ManagerFeedbackPage } from '@/pages/manager/ManagerFeedbackPage';
import { ManagerPlaceholderPage } from '@/pages/manager/ManagerPlaceholderPage';
import { ManagerProfilePage } from '@/pages/manager/ManagerProfilePage';
import { ManagerProtectedRoute } from '@/routes/ManagerProtectedRoute';
import { ManagerVehicleTypesPage } from '@/pages/manager/ManagerVehicleTypesPage';
import { ManagerFloorsPage } from '@/pages/manager/ManagerFloorsPage';
import { ManagerGatesPage } from '@/pages/manager/ManagerGatesPage';
import { ManagerSlotsPage } from '@/pages/manager/ManagerSlotsPage';
import { ManagerPricingPage } from '@/pages/manager/ManagerPricingPage';
import { ManagerReservationPolicyPage } from '@/pages/manager/ManagerReservationPolicyPage';
import { ManagerPackagesPage } from '@/pages/manager/ManagerPackagesPage';
import { ManagerShiftsPage } from '@/pages/manager/ManagerShiftsPage';

export function AppRouter() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      <Route path="/auth/login" element={<PublicLoginRoute />} />
      <Route path="/auth/register" element={<PublicRegisterRoute />} />
      <Route path="/profile" element={<ProfilePage />} />

      <Route path="/manager/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/manager" element={<Navigate to="/manager/dashboard" replace />} />
      <Route element={<ManagerProtectedRoute />}>
        <Route path="/manager" element={<ManagerLayout />}>
          <Route index element={<ManagerDashboardPage />} />
          <Route path="dashboard" element={<ManagerDashboardPage />} />
          <Route path="buildings" element={<ManagerBuildingsPage />} />
          <Route path="vehicle-types" element={<ManagerVehicleTypesPage />} />
          <Route path="feedbacks" element={<ManagerFeedbackPage />} />
          <Route path="profile" element={<ManagerProfilePage />} />
          <Route path="floors" element={<ManagerFloorsPage />} />
          <Route path="gates" element={<ManagerGatesPage />} />
          <Route path="slots" element={<ManagerSlotsPage />} />
          <Route path="price-policies" element={<ManagerPricingPage />} />
          <Route path="reservation-policy" element={<ManagerReservationPolicyPage />} />
          <Route path="packages" element={<ManagerPackagesPage />} />
          <Route path="shifts" element={<ManagerShiftsPage />} />
          <Route
            path="settings"
            element={
              <ManagerPlaceholderPage
                title="Cài đặt"
                description="Cấu hình bảo mật, thông báo và tham số vận hành cho manager."
              />
            }
          />
        </Route>
      </Route>

      <Route path="/admin/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/admin" element={<Navigate to="/auth/login" replace />} />
      <Route path="/admin/direct" element={<AdminLayout />} />

      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/admin/dashboard" element={<AdminLayout />}>
          <Route index element={<DashboardOverviewPage />} />
          <Route path="buildings" element={<BuildingsPage />} />
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
          <Route path="profile" element={<AdminProfilePage />} />
          <Route
            path="settings"
            element={<ModulePlaceholderPage title="Cài đặt" description="Cấu hình nền tảng, chính sách truy cập và tùy chọn vận hành." />}
          />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
