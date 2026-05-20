import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardPage from '@/pages/DashboardPage';
import { mainFlowModules } from '@/data/mainFlow';

export function DashboardRoute() {
  const navigate = useNavigate();

  const onLogout = useCallback(() => navigate('/', { replace: true }), [navigate]);
  const onRefresh = useCallback(() => window.location.reload(), []);
  const onAction = useCallback((module: any) => {
    if (module.id === 'auth') navigate('/auth/login');
  }, [navigate]);

  const mockUser = { fullName: 'Khach hang', email: 'user@pbms.vn', role: 'user', phone: '', isActive: true, lastLoginAt: undefined };

  return <DashboardPage user={mockUser} onLogout={onLogout} onRefresh={onRefresh} modules={mainFlowModules} onAction={onAction} />;
}

export default DashboardRoute;
