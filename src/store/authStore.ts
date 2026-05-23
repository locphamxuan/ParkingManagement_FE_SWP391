import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { loginWithBackend, type AuthSession } from '@/services/authService';
import { saveSession, clearSession, loadSession } from '@/services/storage';
import { AUTH_STORAGE_KEY } from '@/utils/constants';

interface AuthState {
  session: AuthSession | null;
  isAuthenticating: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AuthSession>;
  logout: () => void;
}

function mapLegacySession(): AuthSession | null {
  const legacy = loadSession();
  if (!legacy.token || !legacy.user) {
    return null;
  }

  const user = legacy.user as Record<string, unknown>;
  return {
    token: legacy.token,
    userId: String(user._id ?? user.id ?? ''),
    role: (user.role as AuthSession['role']) ?? 'user',
    email: String(user.email ?? ''),
    displayName: String(user.fullName ?? user.displayName ?? ''),
    assignedBuildingIds: Array.isArray(user.assignedBuildings)
      ? user.assignedBuildings.map((item) => String(typeof item === 'string' ? item : (item as { _id?: string })._id ?? '')).filter(Boolean)
      : [],
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: mapLegacySession(),
      isAuthenticating: false,
      error: null,
      async login(email, password) {
        set({ isAuthenticating: true, error: null });
        try {
          const session = await loginWithBackend({ email, password });
          set({ session, isAuthenticating: false, error: null });
          saveSession({
            token: session.token,
            user: {
              _id: session.userId,
              email: session.email,
              fullName: session.displayName,
              role: session.role,
              assignedBuildings: session.assignedBuildingIds,
            },
          });
          return session;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          set({ error: message, isAuthenticating: false });
          throw error;
        }
      },
      logout() {
        clearSession();
        set({ session: null, error: null });
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ session: state.session }),
    }
  )
);
