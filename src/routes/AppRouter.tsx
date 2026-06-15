import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ScrollToTop } from '@/components/common/ScrollToTop';
// Guards + layouts: eager (nhỏ, là khung luôn cần). Page: lazy để tách chunk.
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { ManagerProtectedRoute } from '@/routes/ManagerProtectedRoute';
import { StaffProtectedRoute } from '@/routes/StaffProtectedRoute';
import { AdminLayout } from '@/layouts/AdminLayout';
import { ManagerLayout } from '@/layouts/ManagerLayout';
import { StaffLayout } from '@/layouts/StaffLayout';

// ── Public ──────────────────────────────────────────────────────────────────
const HomeRoute = lazy(() => import('@/pages/public/HomeRoute').then((m) => ({ default: m.HomeRoute })));
const ReviewsPage = lazy(() => import('@/pages/public/ReviewsPage'));
const KioskCheckInPage = lazy(() => import('@/pages/public/KioskCheckInPage'));
const PublicLoginRoute = lazy(() => import('@/pages/public/AuthRoutes').then((m) => ({ default: m.PublicLoginRoute })));
const PublicRegisterRoute = lazy(() => import('@/pages/public/AuthRoutes').then((m) => ({ default: m.PublicRegisterRoute })));
const PublicResetPasswordRoute = lazy(() => import('@/pages/public/AuthRoutes').then((m) => ({ default: m.PublicResetPasswordRoute })));

// ── User ────────────────────────────────────────────────────────────────────
const BuildingsUserPage = lazy(() => import('@/pages/user/BuildingsPage'));
const ProfilePage = lazy(() => import('@/pages/user/ProfilePage'));
const ReservationsPage = lazy(() => import('@/pages/user/ReservationsPage'));
const LongTermSubscriptionsPage = lazy(() => import('@/pages/user/LongTermSubscriptionsPage'));
const UserNotificationsPage = lazy(() => import('@/pages/user/UserNotificationsPage'));
const WalletPage = lazy(() => import('@/pages/user/WalletPage'));
const ParkingHistoryPage = lazy(() => import('@/pages/user/ParkingHistoryPage'));
const UserDashboardPage = lazy(() => import('@/pages/user/UserDashboardPage'));

// ── Manager ─────────────────────────────────────────────────────────────────
const ManagerBuildingsPage = lazy(() => import('@/pages/manager/ManagerBuildingsPage').then((m) => ({ default: m.ManagerBuildingsPage })));
const ManagerDashboardPage = lazy(() => import('@/pages/manager/ManagerDashboardPage').then((m) => ({ default: m.ManagerDashboardPage })));
const ManagerPlaceholderPage = lazy(() => import('@/pages/manager/ManagerPlaceholderPage').then((m) => ({ default: m.ManagerPlaceholderPage })));
const ManagerProfilePage = lazy(() => import('@/pages/manager/ManagerProfilePage').then((m) => ({ default: m.ManagerProfilePage })));
const ManagerVehicleTypesPage = lazy(() => import('@/pages/manager/ManagerVehicleTypesPage').then((m) => ({ default: m.ManagerVehicleTypesPage })));
const ManagerFloorsPage = lazy(() => import('@/pages/manager/ManagerFloorsPage').then((m) => ({ default: m.ManagerFloorsPage })));
const ManagerGatesPage = lazy(() => import('@/pages/manager/ManagerGatesPage').then((m) => ({ default: m.ManagerGatesPage })));
const ManagerSlotsPage = lazy(() => import('@/pages/manager/ManagerSlotsPage').then((m) => ({ default: m.ManagerSlotsPage })));
const ManagerPricingPage = lazy(() => import('@/pages/manager/ManagerPricingPage').then((m) => ({ default: m.ManagerPricingPage })));
const ManagerReservationPolicyPage = lazy(() => import('@/pages/manager/ManagerReservationPolicyPage').then((m) => ({ default: m.ManagerReservationPolicyPage })));
const ManagerPackagesHubPage = lazy(() => import('@/pages/manager/ManagerPackagesHubPage').then((m) => ({ default: m.ManagerPackagesHubPage })));
const ManagerShiftManagementPage = lazy(() => import('@/pages/manager/ManagerShiftManagementPage').then((m) => ({ default: m.ManagerShiftManagementPage })));
const ManagerOperatingHoursPage = lazy(() => import('@/pages/manager/ManagerOperatingHoursPage').then((m) => ({ default: m.ManagerOperatingHoursPage })));
const ManagerStaffPage = lazy(() => import('@/pages/manager/ManagerStaffPage').then((m) => ({ default: m.ManagerStaffPage })));
const ManagerWalletPage = lazy(() => import('@/pages/manager/ManagerWalletPage').then((m) => ({ default: m.ManagerWalletPage })));
const ManagerReviewsPage = lazy(() => import('@/pages/manager/ManagerReviewsPage').then((m) => ({ default: m.ManagerReviewsPage })));

// ── Staff ───────────────────────────────────────────────────────────────────
const StaffDashboardPage = lazy(() => import('@/pages/staff/StaffDashboardPage').then((m) => ({ default: m.StaffDashboardPage })));
const StaffOperationsPage = lazy(() => import('@/pages/staff/StaffOperationsPage').then((m) => ({ default: m.StaffOperationsPage })));
const StaffParkedPage = lazy(() => import('@/pages/staff/StaffParkedPage').then((m) => ({ default: m.StaffParkedPage })));
const StaffReservationsPage = lazy(() => import('@/pages/staff/StaffReservationsPage').then((m) => ({ default: m.StaffReservationsPage })));
const StaffSessionsPage = lazy(() => import('@/pages/staff/StaffSessionsPage').then((m) => ({ default: m.StaffSessionsPage })));
const StaffShiftsPage = lazy(() => import('@/pages/staff/StaffShiftsPage').then((m) => ({ default: m.StaffShiftsPage })));
const StaffIncidentsPage = lazy(() => import('@/pages/staff/StaffIncidentsPage').then((m) => ({ default: m.StaffIncidentsPage })));
const StaffProfilePage = lazy(() => import('@/pages/staff/StaffProfilePage').then((m) => ({ default: m.StaffProfilePage })));

// ── Admin ───────────────────────────────────────────────────────────────────
const DashboardOverviewPage = lazy(() => import('@/pages/admin/DashboardOverviewPage').then((m) => ({ default: m.DashboardOverviewPage })));
const BuildingsPage = lazy(() => import('@/pages/admin/BuildingsPage').then((m) => ({ default: m.BuildingsPage })));
const UsersPage = lazy(() => import('@/pages/admin/UsersPage').then((m) => ({ default: m.UsersPage })));
const RevenueAnalyticsPage = lazy(() => import('@/pages/admin/RevenueAnalyticsPage').then((m) => ({ default: m.RevenueAnalyticsPage })));
const AuditLogsPage = lazy(() => import('@/pages/admin/AuditLogsPage').then((m) => ({ default: m.AuditLogsPage })));
const AdminProfilePage = lazy(() => import('@/pages/admin/AdminProfilePage').then((m) => ({ default: m.AdminProfilePage })));
const ModulePlaceholderPage = lazy(() => import('@/pages/admin/ModulePlaceholderPage').then((m) => ({ default: m.ModulePlaceholderPage })));

/** Fallback hiển thị khi chunk của page đang được tải. */
function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-400">
      Đang tải…
    </div>
  );
}

export function AppRouter() {
  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<RouteFallback />}>
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
      <Route path="/notifications" element={<UserNotificationsPage />} />
      <Route path="/parking-history" element={<ParkingHistoryPage />} />
      <Route path="/reviews" element={<ReviewsPage />} />
      <Route path="/user-dashboard" element={<UserDashboardPage />} />
      <Route path="/kiosk" element={<KioskCheckInPage />} />

      <Route path="/manager/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/manager" element={<Navigate to="/manager/dashboard" replace />} />
      <Route element={<ManagerProtectedRoute />}>
        <Route path="/manager" element={<ManagerLayout />}>
          <Route index element={<ManagerDashboardPage />} />
          <Route path="dashboard" element={<ManagerDashboardPage />} />
          <Route path="buildings" element={<ManagerBuildingsPage />} />
          <Route path="vehicle-types" element={<ManagerVehicleTypesPage />} />
          <Route path="profile" element={<ManagerProfilePage />} />
          <Route path="floors" element={<ManagerFloorsPage />} />
          <Route path="gates" element={<ManagerGatesPage />} />
          <Route path="slots" element={<ManagerSlotsPage />} />
          <Route path="price-policies" element={<ManagerPricingPage />} />
          <Route path="reservation-policy" element={<ManagerReservationPolicyPage />} />
          <Route path="packages" element={<ManagerPackagesHubPage />} />
          <Route path="subscriptions" element={<Navigate to="/manager/packages" replace />} />
          <Route path="shifts" element={<ManagerShiftManagementPage />} />
          <Route path="staff-shifts" element={<Navigate to="/manager/shifts" replace />} />
          <Route path="operating-hours" element={<ManagerOperatingHoursPage />} />
          <Route path="staff" element={<ManagerStaffPage />} />
          <Route path="reviews" element={<ManagerReviewsPage />} />
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
          <Route path="checkout" element={<StaffParkedPage />} />
          <Route path="parked" element={<StaffParkedPage readOnly />} />
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
      </Suspense>
    </>
  );
}
