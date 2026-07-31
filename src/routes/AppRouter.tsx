import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { ScrollToTop } from '@/components/common/ScrollToTop';
// Guards + layouts: eager (nhỏ, là khung luôn cần). Page: lazy để tách chunk.
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { AdminLayout } from '@/layouts/AdminLayout';
import { ManagerLayout } from '@/layouts/ManagerLayout';
import { StaffLayout } from '@/layouts/StaffLayout';
import { UserLayout } from '@/layouts/UserLayout';

// ── Public ──────────────────────────────────────────────────────────────────
const HomeRoute = lazy(() => import('@/pages/public/HomeRoute').then((m) => ({ default: m.HomeRoute })));
const AboutPage = lazy(() => import('@/pages/public/AboutPage'));
const ServicesPage = lazy(() => import('@/pages/public/ServicesPage'));
const ContactPage = lazy(() => import('@/pages/public/ContactPage'));
const ReviewsPage = lazy(() => import('@/pages/public/ReviewsPage'));
const KioskCheckInPage = lazy(() => import('@/pages/public/KioskCheckInPage'));
const PublicLoginRoute = lazy(() => import('@/pages/public/AuthRoutes').then((m) => ({ default: m.PublicLoginRoute })));
const PublicRegisterRoute = lazy(() => import('@/pages/public/AuthRoutes').then((m) => ({ default: m.PublicRegisterRoute })));
const PublicResetPasswordRoute = lazy(() => import('@/pages/public/AuthRoutes').then((m) => ({ default: m.PublicResetPasswordRoute })));

// ── User ────────────────────────────────────────────────────────────────────
const BuildingsUserPage = lazy(() => import('@/pages/user/BuildingsPage'));
const ProfilePage = lazy(() => import('@/pages/user/ProfilePage'));
const PackagePurchasePage = lazy(() => import('@/pages/user/PackagePurchasePage'));
const LongTermSubscriptionsPage = lazy(() => import('@/pages/user/LongTermSubscriptionsPage'));
const UserNotificationsPage = lazy(() => import('@/pages/user/UserNotificationsPage'));
const WalletPage = lazy(() => import('@/pages/user/WalletPage'));
const ParkingHistoryPage = lazy(() => import('@/pages/user/ParkingHistoryPage'));
const ReportIncidentPage = lazy(() => import('@/pages/user/ReportIncidentPage'));
const UserDashboardPage = lazy(() => import('@/pages/user/UserDashboardPage'));

// ── Manager ─────────────────────────────────────────────────────────────────
const ManagerBuildingsPage = lazy(() => import('@/pages/manager/ManagerBuildingsPage').then((m) => ({ default: m.ManagerBuildingsPage })));
const ManagerDashboardPage = lazy(() => import('@/pages/manager/ManagerDashboardPage').then((m) => ({ default: m.ManagerDashboardPage })));
const ManagerProfilePage = lazy(() => import('@/pages/manager/ManagerProfilePage').then((m) => ({ default: m.ManagerProfilePage })));
const ManagerVehicleTypesPage = lazy(() => import('@/pages/manager/ManagerVehicleTypesPage').then((m) => ({ default: m.ManagerVehicleTypesPage })));
const ManagerFloorsPage = lazy(() => import('@/pages/manager/ManagerFloorsPage').then((m) => ({ default: m.ManagerFloorsPage })));
const ManagerGatesPage = lazy(() => import('@/pages/manager/ManagerGatesPage').then((m) => ({ default: m.ManagerGatesPage })));
const ManagerZonesPage = lazy(() => import('@/pages/manager/ManagerZonesPage').then((m) => ({ default: m.ManagerZonesPage })));
const ManagerSlotsPage = lazy(() => import('@/pages/manager/ManagerSlotsPage').then((m) => ({ default: m.ManagerSlotsPage })));
const ManagerPricingPage = lazy(() => import('@/pages/manager/ManagerPricingPage').then((m) => ({ default: m.ManagerPricingPage })));
const ManagerRefundPolicyPage = lazy(() => import('@/pages/manager/ManagerRefundPolicyPage').then((m) => ({ default: m.ManagerRefundPolicyPage })));
const ManagerPackagesHubPage = lazy(() => import('@/pages/manager/ManagerPackagesHubPage').then((m) => ({ default: m.ManagerPackagesHubPage })));
const ManagerShiftManagementPage = lazy(() => import('@/pages/manager/ManagerShiftManagementPage').then((m) => ({ default: m.ManagerShiftManagementPage })));
const ManagerOperatingHoursPage = lazy(() => import('@/pages/manager/ManagerOperatingHoursPage').then((m) => ({ default: m.ManagerOperatingHoursPage })));
const ManagerStaffPage = lazy(() => import('@/pages/manager/ManagerStaffPage').then((m) => ({ default: m.ManagerStaffPage })));
const ManagerWalletPage = lazy(() => import('@/pages/manager/ManagerWalletPage').then((m) => ({ default: m.ManagerWalletPage })));
const ManagerReviewsPage = lazy(() => import('@/pages/manager/ManagerReviewsPage').then((m) => ({ default: m.ManagerReviewsPage })));
const ManagerIncidentsPage = lazy(() => import('@/pages/manager/ManagerIncidentsPage').then((m) => ({ default: m.ManagerIncidentsPage })));
const ManagerSessionsPage = lazy(() => import('@/pages/manager/ManagerSessionsPage').then((m) => ({ default: m.ManagerSessionsPage })));

// ── Staff ───────────────────────────────────────────────────────────────────
const StaffDashboardPage = lazy(() => import('@/pages/staff/StaffDashboardPage').then((m) => ({ default: m.StaffDashboardPage })));
const StaffOperationsPage = lazy(() => import('@/pages/staff/StaffOperationsPage').then((m) => ({ default: m.StaffOperationsPage })));
const StaffParkedPage = lazy(() => import('@/pages/staff/StaffParkedPage').then((m) => ({ default: m.StaffParkedPage })));
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

/** Giữ tương thích bookmark cũ: /admin/dashboard/<page> → /admin/<page>. */
function LegacyAdminRedirect() {
  const { page } = useParams();
  return <Navigate to={`/admin/${page ?? ''}`} replace />;
}

/** Fallback hiển thị khi chunk của page đang được tải. */
function RouteFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-400">
      Loading…
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
      <Route path="/about" element={<AboutPage />} />
      <Route path="/services" element={<ServicesPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/dashboard" element={<Navigate to="/" replace />} />
      <Route path="/auth/login" element={<PublicLoginRoute />} />
      <Route path="/auth/register" element={<PublicRegisterRoute />} />
      <Route path="/auth/reset-password" element={<PublicResetPasswordRoute />} />
      <Route path="/auth/reset_password" element={<PublicResetPasswordRoute />} />
      {/* Bọc ProtectedRoute để chờ GET /auth/me xong mới quyết định chuyển hướng —
          nếu không, tải thẳng/refresh một trang user sẽ bị đá về trang chủ do
          session chưa kịp khôi phục. */}
      <Route element={<ProtectedRoute role="user" />}>
      <Route element={<UserLayout />}>
        <Route path="/buildings" element={<BuildingsUserPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/packages/buy" element={<PackagePurchasePage />} />
        <Route path="/long-term-subscriptions" element={<LongTermSubscriptionsPage />} />
        <Route path="/notifications" element={<UserNotificationsPage />} />
        <Route path="/parking-history" element={<ParkingHistoryPage />} />
        <Route path="/report-incident" element={<ReportIncidentPage />} />
        <Route path="/user-dashboard" element={<UserDashboardPage />} />
      </Route>
      </Route>
      <Route path="/reservations" element={<Navigate to="/packages/buy" replace />} />
      <Route path="/reviews" element={<ReviewsPage />} />
      <Route path="/kiosk" element={<KioskCheckInPage />} />

      <Route path="/manager/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/manager" element={<Navigate to="/manager/dashboard" replace />} />
      <Route element={<ProtectedRoute role="manager" />}>
        <Route path="/manager" element={<ManagerLayout />}>
          <Route index element={<ManagerDashboardPage />} />
          <Route path="dashboard" element={<ManagerDashboardPage />} />
          <Route path="buildings" element={<ManagerBuildingsPage />} />
          <Route path="vehicle-types" element={<ManagerVehicleTypesPage />} />
          <Route path="profile" element={<ManagerProfilePage />} />
          <Route path="floors" element={<ManagerFloorsPage />} />
          <Route path="gates" element={<ManagerGatesPage />} />
          <Route path="zones" element={<ManagerZonesPage />} />
          <Route path="slots" element={<ManagerSlotsPage />} />
          <Route path="price-policies" element={<ManagerPricingPage />} />
          <Route path="refund-policy" element={<ManagerRefundPolicyPage />} />
          <Route path="packages" element={<ManagerPackagesHubPage />} />
          <Route path="subscriptions" element={<Navigate to="/manager/packages" replace />} />
          <Route path="shifts" element={<ManagerShiftManagementPage />} />
          <Route path="staff-shifts" element={<Navigate to="/manager/shifts" replace />} />
          <Route path="operating-hours" element={<ManagerOperatingHoursPage />} />
          <Route path="staff" element={<ManagerStaffPage />} />
          <Route path="reviews" element={<ManagerReviewsPage />} />
          <Route path="incidents" element={<ManagerIncidentsPage />} />
          <Route path="sessions" element={<ManagerSessionsPage />} />
          <Route path="wallet" element={<ManagerWalletPage />} />
        </Route>
      </Route>

      <Route path="/staff/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/staff" element={<Navigate to="/staff/dashboard" replace />} />
      <Route element={<ProtectedRoute role="staff" />}>
        <Route path="/staff" element={<StaffLayout />}>
          <Route index element={<StaffDashboardPage />} />
          <Route path="dashboard" element={<StaffDashboardPage />} />
          <Route path="operations" element={<StaffOperationsPage />} />
          <Route path="checkout" element={<StaffParkedPage view="scanner" />} />
          <Route path="parked" element={<StaffParkedPage view="list" />} />
          <Route path="my-shifts" element={<StaffShiftsPage />} />
          <Route path="sessions" element={<StaffSessionsPage />} />
          <Route path="incidents" element={<StaffIncidentsPage />} />
          <Route path="profile" element={<StaffProfilePage />} />
        </Route>
      </Route>

      <Route path="/admin/login" element={<Navigate to="/auth/login" replace />} />
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<DashboardOverviewPage />} />
          <Route path="dashboard" element={<DashboardOverviewPage />} />
          {/* Redirect các đường dẫn lồng nhau kiểu cũ /admin/dashboard/<page> */}
          <Route path="dashboard/:page" element={<LegacyAdminRedirect />} />
          <Route path="buildings" element={<BuildingsPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="revenue-analytics" element={<RevenueAnalyticsPage />} />
          <Route path="audit-logs" element={<AuditLogsPage />} />
          <Route path="profile" element={<AdminProfilePage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
    </>
  );
}
