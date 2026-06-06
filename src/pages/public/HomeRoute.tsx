import { useCallback, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import { mainFlowModules } from '@/data/mainFlow';
import { useAuth } from '@/hooks/useAuth';

export function HomeRoute() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();

  // ALL hooks must be declared before any conditional returns (Rules of Hooks)
  const userMapped = useMemo(() => {
    if (!session) return null;
    return {
      fullName: session.displayName,
      email: session.email,
      role: session.role,
      phone: session.phone || '',
      licensePlates: session.licensePlates || [],
    };
  }, [session]);

  const onOpenAuth = useCallback((mode: 'login' | 'register' = 'login') => {
    navigate(`/auth/${mode}`);
  }, [navigate]);

  const onViewProfile = useCallback(() => {
    if (!session) { onOpenAuth('login'); return; }
    navigate('/profile');
  }, [navigate, onOpenAuth, session]);

  const onViewReservationHistory = useCallback(() => {
    if (!session) { onOpenAuth('login'); return; }
    navigate('/reservations', { state: { openHistory: true } });
  }, [navigate, onOpenAuth, session]);

  const onAction = useCallback(
    (module: any) => {
      if (module.id === 'auth') return onOpenAuth('login');
      if (module.id === 'profile') return onViewProfile();
      if (module.id === 'wallet') return session ? navigate('/wallet') : onOpenAuth('login');
      if (module.id === 'buildings') return navigate('/buildings');
      if (module.id === 'reservations') return navigate('/reservations');
      if (module.id === 'payments') return navigate('/long-term-subscriptions');
    },
    [navigate, onOpenAuth, onViewProfile, session],
  );

  const onLogout = useCallback(() => {
    logout();
    navigate('/', { replace: true });
  }, [logout, navigate]);

  // Use <Navigate> component (NOT navigate() function) for render-time redirects
  if (session?.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
  if (session?.role === 'manager') return <Navigate to="/manager" replace />;
  if (session?.role === 'staff') return <Navigate to="/staff" replace />;

  return (
    <HomePage
      modules={mainFlowModules}
      onOpenAuth={onOpenAuth}
      onViewProfile={onViewProfile}
      onViewReservationHistory={onViewReservationHistory}
      onAction={onAction}
      user={userMapped}
      onLogout={onLogout}
    />
  );
}

export default HomeRoute;
