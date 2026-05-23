import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/store/authStore';

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
  const { token, user, refresh } = useAuth();
  const [refreshing, setRefreshing] = useState<boolean>(Boolean(token) && !user);

  useEffect(() => {
    let mounted = true;
    if (token && !user) {
      setRefreshing(true);
      refresh()
        .catch(() => undefined)
        .finally(() => {
          if (mounted) setRefreshing(false);
        });
    }
    return () => {
      mounted = false;
    };
  }, [token, user, refresh]);

  if (!token) {
    return <Navigate to="/auth/login" replace state={{ from: location.pathname }} />;
  }

  if (refreshing) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Đang xác thực phiên...
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
