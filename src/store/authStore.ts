import { create } from 'zustand';
import { loginWithBackend, fetchCurrentUser, logoutFromBackend, type AuthSession } from '@/services/authService';
import { api } from '@/services/client/apiClient';

interface AuthState {
  session: AuthSession | null;
  /** True while the app is restoring the session via GET /users/auth/me on load. */
  isBootstrapping: boolean;
  isAuthenticating: boolean;
  error: string | null;
  bootstrap: () => Promise<void>;
  login: (email: string, password: string) => Promise<AuthSession>;
  logout: () => void;
  updateProfile: (profile: { fullName: string; phone: string; licensePlates: Array<{ _id?: string; plateNumber: string; vehicleType: 'car' | 'motorcycle'; brand?: string | null; isDefault?: boolean }> }) => void;
  setDefaultLicensePlate: (plateId: string) => Promise<void>;
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
            licensePlates: profile.licensePlates,
          };
          return { session: updatedSession };
        });
      },
      async setDefaultLicensePlate(plateId) {
        type RawPlate = { _id?: unknown; plateNumber?: unknown; vehicleType?: unknown; isDefault?: unknown };
        const res = await api.patch<{ data?: { licensePlates?: RawPlate[] } }>(`/users/license-plates/${plateId}/default`);
        const updatedPlates = Array.isArray(res?.data?.licensePlates)
          ? res.data.licensePlates.map((item: RawPlate) => ({
              _id: item._id ? String(item._id) : undefined,
              plateNumber: String(item.plateNumber || '').toUpperCase().trim(),
              vehicleType: item.vehicleType === 'motorcycle' ? ('motorcycle' as const) : ('car' as const),
              isDefault: item.isDefault === true || item.isDefault === 'true',
            }))
          : [];

        set((state) => {
          if (!state.session) return {};
          const updatedSession: AuthSession = {
            ...state.session,
            licensePlates: updatedPlates,
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
