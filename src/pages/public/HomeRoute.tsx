import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import { mainFlowModules } from '@/data/mainFlow';

export function HomeRoute() {
  const navigate = useNavigate();

  const onOpenAuth = useCallback((mode: 'login' | 'register' = 'login') => {
    navigate(`/auth/${mode}`, { replace: false });
  }, [navigate]);

  const onOpenDashboard = useCallback(() => {
    navigate('/dashboard');
  }, [navigate]);

  const onOpenAdmin = useCallback(() => {
    navigate('/admin/login');
  }, [navigate]);

  const onAction = useCallback((module: any) => {
    if (module.id === 'auth') return onOpenAuth('login');
    if (module.id === 'profile') return onOpenDashboard();
    // fallback: no-op
    return undefined;
  }, [onOpenAuth, onOpenDashboard]);

  return (
    <HomePage
      modules={mainFlowModules}
      onOpenAuth={onOpenAuth}
      onOpenDashboard={onOpenDashboard}
      onAction={onAction}
      onOpenAdmin={onOpenAdmin}
    />
  );
}

export default HomeRoute;
