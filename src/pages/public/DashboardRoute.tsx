import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

export function DashboardRoute() {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/auth/login', { replace: true });
      return;
    }
    if (user.role === 'admin') navigate('/admin/dashboard', { replace: true });
    else if (user.role === 'manager') navigate('/manager', { replace: true });
    else if (user.role === 'staff') navigate('/staff', { replace: true });
    else navigate('/', { replace: true });
  }, [isAuthenticated, user, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Đang điều hướng...
    </div>
  );
}
