import { create } from 'zustand';
import { loginWithBackend, fetchCurrentUser, logoutFromBackend, type AuthSession } from '@/services/authService';
import { useVehicleStore } from '@/store/vehicleStore';

interface AuthState {
  session: AuthSession | null;
  /** True while the app is restoring the session via GET /users/auth/me on load. */
  isBootstrapping: boolean;
  isAuthenticating: boolean;
  error: string | null;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthSession>;
  logout: () => void;
  // Phương tiện KHÔNG thuộc hồ sơ phiên đăng nhập — quản lý ở `vehicleStore`.
  updateProfile: (profile: { fullName: string; phone: string }) => void;
}

export const useAuthStore = create<AuthState>()(
  (set) => ({
      session: null,
      isBootstrapping: true,
      isAuthenticating: false,
      error: null,
      async bootstrap() {
        try {
          const session = await fetchCurrentUser();
          set({ session, isBootstrapping: false });
        } catch {
          // Not logged in (no/expired cookie) — a normal state, not an error to surface.
          set({ session: null, isBootstrapping: false });
        }
      },
      async login(email, password) {
        set({ isAuthenticating: true, error: null });
        try {
          const session = await loginWithBackend({ email, password });
          set({ session, isAuthenticating: false, error: null });
          return session;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Login failed';
          set({ error: message, isAuthenticating: false });
          throw error;
        }
      },
      logout() {
        set({ session: null, error: null });
        // Xoá luôn dữ liệu xe của tài khoản vừa thoát, tránh hiện nhầm cho người kế tiếp.
        useVehicleStore.getState().reset();
        // Fire-and-forget: clear the httpOnly cookie server-side; local state
        // is already cleared so the UI reacts immediately regardless of network.
        void logoutFromBackend().catch(() => {});
      },
      updateProfile(profile) {
        set((state) => {
          if (!state.session) return {};
          const updatedSession: AuthSession = {
            ...state.session,
            displayName: profile.fullName,
            phone: profile.phone,
          };
          return { session: updatedSession };
        });
      },
    })
);

if (typeof window !== 'undefined') {
  window.addEventListener('auth-unauthorized', () => {
    useAuthStore.getState().logout();
  });
}
