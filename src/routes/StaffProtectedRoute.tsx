import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function StaffProtectedRoute() {
  const { isStaff } = useAuth();

  if (!isStaff) {
    return <Navigate to="/auth/login" replace />;
  }

  return <Outlet />;
}
