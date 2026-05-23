import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function ManagerProtectedRoute() {
  const { isManager } = useAuth();

  if (!isManager) {
    return <Navigate to="/manager/login" replace />;
  }

  return <Outlet />;
}
