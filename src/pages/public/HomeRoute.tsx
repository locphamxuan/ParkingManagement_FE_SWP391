import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import HomePage from '@/pages/HomePage';
import { mainFlowModules } from '@/data/mainFlow';
import { useAuth } from '@/hooks/useAuth';

export function HomeRoute() {
  const navigate = useNavigate();
  
  // Use reactive Zustand store instead of direct localStorage to prevent sync lag
  const { session, logout } = useAuth();

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
    navigate(`/auth/${mode}`, { replace: false });
  }, [navigate]);

  const onViewProfile = useCallback(() => {
    if (!session) {
      return onOpenAuth('login');
    }
    navigate('/profile', { replace: false });
  }, [navigate, onOpenAuth, session]);

  const onAction = useCallback(
    (module: any) => {
      if (module.id === 'auth') return onOpenAuth('login');
      if (module.id === 'profile') return onViewProfile();
      if (module.id === 'buildings') return navigate('/buildings');
      if (module.id === 'reservations') return navigate('/reservations');
      return undefined;
    },
    [navigate, onOpenAuth, onViewProfile]
  );

  const onLogout = useCallback(() => {
    // Correctly clear Zustand store session alongside legacy localStorage session
    logout();
    navigate('/', { replace: true });
  }, [logout, navigate]);

  return (
    <HomePage
      modules={mainFlowModules}
      onOpenAuth={onOpenAuth}
      onViewProfile={onViewProfile}
      onAction={onAction}
      user={userMapped}
      onLogout={onLogout}
    />
  );
}

export default HomeRoute;
