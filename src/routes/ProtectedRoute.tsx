import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { AuthSession } from '@/services/authService';

type UserRole = AuthSession['role'];

interface ProtectedRouteProps {
  role: UserRole;
}

const fallbackFor = (userRole: UserRole): string => {
  if (userRole === 'admin') return '/admin/dashboard';
  if (userRole === 'manager') return '/manager';
  if (userRole === 'staff') return '/staff';
  return '/auth/login';
};

export function ProtectedRoute({ role }: ProtectedRouteProps) {
  const location = useLocation();
  const { user, isBootstrapping } = useAuth();

  // Wait for the GET /users/auth/me session check to resolve before deciding
  // to redirect — otherwise a hard refresh always bounces to /auth/login first.
  if (isBootstrapping) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-400">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  }

  if (user.role !== role) {
    return <Navigate to={fallbackFor(user.role)} replace />;
  }

  return <Outlet />;
}
