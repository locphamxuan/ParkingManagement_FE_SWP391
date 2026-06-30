import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { AuthSession } from '@/services/authService';

type UserRole = AuthSession['role'];

interface ProtectedRouteProps {
  role: Extract<UserRole, 'admin' | 'manager' | 'staff'>;
}

const fallbackFor = (userRole: UserRole): string => {
  if (userRole === 'admin') return '/admin/dashboard';
  if (userRole === 'manager') return '/manager';
  if (userRole === 'staff') return '/staff';
  return '/auth/login';
};

export function ProtectedRoute({ role }: ProtectedRouteProps) {
  const location = useLocation();
  const { token, user } = useAuth();

  if (!token) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  }

  if (!user) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  }

  if (user.role !== role) {
    return <Navigate to={fallbackFor(user.role)} replace />;
  }

  return <Outlet />;
}
