import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mockLogin, type AuthSession } from '@/services/authService';
import { AUTH_STORAGE_KEY } from '@/utils/constants';

interface AuthState {
  session: AuthSession | null;
  isAuthenticating: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      isAuthenticating: false,
      error: null,
      async login(email, password) {
        set({ isAuthenticating: true, error: null });
        try {
          const session = await mockLogin({ email, password });
          set({ session, isAuthenticating: false, error: null });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          set({ error: message, isAuthenticating: false });
          throw error;
        }
      },
      logout() {
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
