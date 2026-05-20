import { useAuthStore } from '@/store/authStore';

export function useAuth() {
  const session = useAuthStore((state) => state.session);
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticating = useAuthStore((state) => state.isAuthenticating);
  const error = useAuthStore((state) => state.error);

  return {
    session,
    login,
    logout,
    isAuthenticating,
    error,
    isAdmin: Boolean(session?.token) && session?.role === 'admin',
  };
}
