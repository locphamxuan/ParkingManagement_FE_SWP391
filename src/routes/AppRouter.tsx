import { Navigate, Route, Routes } from 'react-router-dom';
import { ScrollToTop } from '@/components/shared/ScrollToTop';
import { AdminLayout } from '@/layouts/AdminLayout';
import { DashboardOverviewPage } from '@/pages/admin/DashboardOverviewPage';
import { BuildingsPage } from '@/pages/admin/BuildingsPage';
import { UsersPage } from '@/pages/admin/UsersPage';
import { RevenueAnalyticsPage } from '@/pages/admin/RevenueAnalyticsPage';
import { AuditLogsPage } from '@/pages/admin/AuditLogsPage';
import { AdminProfilePage } from '@/pages/admin/AdminProfilePage';
import { SystemWalletPage } from '@/pages/admin/SystemWalletPage';
import { SubscriptionPackagesPage } from '@/pages/admin/SubscriptionPackagesPage';
import { ModulePlaceholderPage } from '@/pages/admin/ModulePlaceholderPage';
import { HomeRoute } from '@/pages/public/HomeRoute';
import BuildingsUserPage from '@/pages/User/BuildingsPage';
import ProfilePage from '@/pages/public/ProfilePage';
import ReservationsPage from '@/pages/public/ReservationsPage';
import LongTermSubscriptionsPage from '@/pages/public/LongTermSubscriptionsPage';
import WalletPage from '@/pages/public/WalletPage';
import ParkingHistoryPage from '@/pages/public/ParkingHistoryPage';
import UserDashboardPage from '@/pages/public/UserDashboardPage';
import { PublicLoginRoute, PublicRegisterRoute, PublicResetPasswordRoute } from '@/pages/public/AuthRoutes';
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
import { ManagerStaffShiftsPage } from '@/pages/manager/ManagerStaffShiftsPage';
import { ManagerStaffPage } from '@/pages/manager/ManagerStaffPage';
import { ManagerWalletPage } from '@/pages/manager/ManagerWalletPage';
import { StaffLayout } from '@/layouts/StaffLayout';
import { StaffDashboardPage } from '@/pages/staff/StaffDashboardPage';
import { StaffOperationsPage } from '@/pages/staff/StaffOperationsPage';
import { StaffReservationsPage } from '@/pages/staff/StaffReservationsPage';
import { StaffSessionsPage } from '@/pages/staff/StaffSessionsPage';
import { StaffShiftsPage } from '@/pages/staff/StaffShiftsPage';
import { StaffIncidentsPage } from '@/pages/staff/StaffIncidentsPage';
import { StaffProfilePage } from '@/pages/staff/StaffProfilePage';
import { StaffProtectedRoute } from '@/routes/StaffProtectedRoute';

export function AppRouter() {
  return (
    <>
      <ScrollToTop />
      <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      <Route path="/auth/login" element={<PublicLoginRoute />} />
      <Route path="/auth/register" element={<PublicRegisterRoute />} />
      <Route path="/auth/reset-password" element={<PublicResetPasswordRoute />} />
      <Route path="/auth/reset_password" element={<PublicResetPasswordRoute />} />
      <Route path="/buildings" element={<BuildingsUserPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/wallet" element={<WalletPage />} />
      <Route path="/reservations" element={<ReservationsPage />} />
      <Route path="/long-term-subscriptions" element={<LongTermSubscriptionsPage />} />
      <Route path="/parking-history" element={<ParkingHistoryPage />} />
      <Route path="/user-dashboard" element={<UserDashboardPage />} />

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
          <Route path="staff" element={<ManagerStaffPage />} />
          <Route path="staff-shifts" element={<ManagerStaffShiftsPage />} />
          <Route path="wallet" element={<ManagerWalletPage />} />
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

      <Route path="/staff/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/staff" element={<Navigate to="/staff/dashboard" replace />} />
      <Route element={<StaffProtectedRoute />}>
        <Route path="/staff" element={<StaffLayout />}>
          <Route index element={<StaffDashboardPage />} />
          <Route path="dashboard" element={<StaffDashboardPage />} />
          <Route path="operations" element={<StaffOperationsPage />} />
          <Route path="reservations" element={<StaffReservationsPage />} />
          <Route path="my-shifts" element={<StaffShiftsPage />} />
          <Route path="sessions" element={<StaffSessionsPage />} />
          <Route path="incidents" element={<StaffIncidentsPage />} />
          <Route path="profile" element={<StaffProfilePage />} />
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
          <Route path="subscription-packages" element={<SubscriptionPackagesPage />} />
          <Route path="wallet-governance" element={<SystemWalletPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="profile" element={<AdminProfilePage />} />
          <Route
            path="notifications"
            element={<ModulePlaceholderPage title="Thông báo" description="Mẫu thông báo, giám sát hàng đợi và kênh gửi." />}
          />
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
