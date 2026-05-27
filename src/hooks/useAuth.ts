import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const session = useAuthStore((state) => state.session);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const setDefaultLicensePlate = useAuthStore((state) => state.setDefaultLicensePlate);
  const isAuthenticating = useAuthStore((state) => state.isAuthenticating);
  const error = useAuthStore((state) => state.error);

  const token = session?.token ?? null;
  const user = session
    ? {
        userId: session.userId,
        email: session.email,
        role: session.role,
        fullName: session.displayName,
        phone: session.phone || '',
        licensePlates: session.licensePlates || [],
      }
    : null;

  const refresh = async () => {
    // No refresh flow implemented yet. This is a placeholder for route guards that expect it.
    return;
  };

  return {
    session,
    token,
    user,
    refresh,
    login,
    logout,
    updateProfile,
    setDefaultLicensePlate,
    isAuthenticating,
    error,
    isAdmin: Boolean(session?.token) && session?.role === 'admin',
    isManager: Boolean(session?.token) && session?.role === 'manager',
    isStaff: Boolean(session?.token) && session?.role === 'staff',
  };
}
