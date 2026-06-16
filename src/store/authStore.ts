import { create } from 'zustand';
import { loginWithBackend, type AuthSession } from '@/services/authService';
import { saveSession, clearSession, loadSession } from '@/services/client/storage';
import { api } from '@/services/client/apiClient';

interface AuthState {
  session: AuthSession | null;
  isAuthenticating: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AuthSession>;
  logout: () => void;
  updateProfile: (profile: { fullName: string; phone: string; licensePlates: Array<{ _id?: string; plateNumber: string; vehicleType: 'car' | 'motorcycle'; brand?: string | null; isDefault?: boolean }> }) => void;
  setDefaultLicensePlate: (plateId: string) => Promise<void>;
}

function mapLegacySession(): AuthSession | null {
  const legacy = loadSession();
  if (!legacy.token || !legacy.user) {
    return null;
  }

  const user = legacy.user as Record<string, unknown>;
  const email = String(user.email ?? '');

  const finalName = String(user.fullName ?? user.displayName ?? '');
  const finalPhone = String(user.phone ?? '');
  const rawPlates = Array.isArray(user.licensePlates) ? user.licensePlates : [];

  return {
    token: legacy.token,
    userId: String(user._id ?? user.id ?? ''),
    role: (user.role as AuthSession['role']) ?? 'user',
    email,
    displayName: finalName,
    assignedBuildingIds: Array.isArray(user.assignedBuildings)
      ? user.assignedBuildings.map((item) => String(typeof item === 'string' ? item : (item as { _id?: string })._id ?? '')).filter(Boolean)
      : [],
    phone: finalPhone,
    licensePlates: (rawPlates as unknown[])
      .map((item): { _id?: string; plateNumber: string; vehicleType: 'car' | 'motorcycle'; brand?: string | null; isDefault?: boolean } | null => {
        if (!item) return null;
        if (typeof item === 'string') {
          const plate = item.toUpperCase().trim();
          return plate ? { plateNumber: plate, vehicleType: 'car', brand: null, isDefault: false } : null;
        }
        if (typeof item === 'object') {
          const p = item as Record<string, unknown>;
          const plate = String(p.plateNumber ?? '').toUpperCase().trim();
          return plate
            ? {
                _id: p._id ? String(p._id) : undefined,
                plateNumber: plate,
                vehicleType: p.vehicleType === 'motorcycle' ? 'motorcycle' : 'car',
                brand: typeof p.brand === 'string' && p.brand.trim() ? p.brand.trim() : null,
                isDefault: p.isDefault === true || p.isDefault === 'true',
              }
            : null;
        }
        return null;
      })
      .filter((p): p is { _id?: string; plateNumber: string; vehicleType: 'car' | 'motorcycle'; brand?: string | null; isDefault?: boolean } => Boolean(p && p.plateNumber)),
  };
}

export const useAuthStore = create<AuthState>()(
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
              phone: session.phone,
              licensePlates: session.licensePlates,
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
      updateProfile(profile) {
        set((state) => {
          if (!state.session) return {};
          const updatedSession: AuthSession = {
            ...state.session,
            displayName: profile.fullName,
            phone: profile.phone,
            licensePlates: profile.licensePlates,
          };
          saveSession({
            token: updatedSession.token,
            user: {
              _id: updatedSession.userId,
              email: updatedSession.email,
              fullName: updatedSession.displayName,
              role: updatedSession.role,
              assignedBuildings: updatedSession.assignedBuildingIds,
              phone: updatedSession.phone,
              // Persist full plate objects including _id so DELETE by ID works across page reloads
              licensePlates: updatedSession.licensePlates,
            },
          });

          return { session: updatedSession };
        });
      },
      async setDefaultLicensePlate(plateId) {
        const res = await api.patch<{ data?: { licensePlates?: any[] } }>(`/users/license-plates/${plateId}/default`);
        const updatedPlates = Array.isArray(res?.data?.licensePlates)
          ? res.data.licensePlates.map((item: any) => ({
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

          saveSession({
            token: updatedSession.token,
            user: {
              _id: updatedSession.userId,
              email: updatedSession.email,
              fullName: updatedSession.displayName,
              role: updatedSession.role,
              assignedBuildings: updatedSession.assignedBuildingIds,
              phone: updatedSession.phone,
              licensePlates: updatedSession.licensePlates,
            },
          });

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

