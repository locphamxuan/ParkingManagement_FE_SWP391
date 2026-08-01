import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const session = useAuthStore((state) => state.session);
  const isBootstrapping = useAuthStore((state) => state.isBootstrapping);
  const login = useAuthStore((state) => state.login);
  const adoptSession = useAuthStore((state) => state.adoptSession);
  const logout = useAuthStore((state) => state.logout);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const isAuthenticating = useAuthStore((state) => state.isAuthenticating);
  const error = useAuthStore((state) => state.error);

  // Phương tiện KHÔNG có ở đây — dùng `useVehicles()` để lấy dữ liệu sống từ API.
  const user = session
    ? {
        userId: session.userId,
        email: session.email,
        role: session.role,
        fullName: session.displayName,
        phone: session.phone || '',
      }
    : null;

  return {
    session,
    isBootstrapping,
    user,
    login,
    adoptSession,
    logout,
    updateProfile,
    isAuthenticating,
    error,
    isAdmin: session?.role === 'admin',
    isManager: session?.role === 'manager',
    isStaff: session?.role === 'staff',
  };
}
