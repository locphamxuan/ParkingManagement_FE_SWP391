import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { loginWithBackend, type AuthSession } from '@/services/authService';
import { saveSession, clearSession, loadSession } from '@/services/storage';
import { AUTH_STORAGE_KEY } from '@/utils/constants';
import { api } from '@/services/apiClient';

interface AuthState {
  session: AuthSession | null;
  isAuthenticating: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AuthSession>;
  logout: () => void;
  updateProfile: (profile: { fullName: string; phone: string; licensePlates: Array<{ _id?: string; plateNumber: string; vehicleType: 'car' | 'motorcycle'; isDefault?: boolean }> }) => void;
  setDefaultLicensePlate: (plateId: string) => Promise<void>;
}

function mapLegacySession(): AuthSession | null {
  const legacy = loadSession();
  if (!legacy.token || !legacy.user) {
    return null;
  }

  const user = legacy.user as Record<string, unknown>;
  const email = String(user.email ?? '');

  // ĐỒNG BỘ: Kiểm tra ghi đè từ localStorage dùng chung để luôn tải dữ liệu mới nhất
  const locallyUpdated = JSON.parse(localStorage.getItem('pbms.locallyUpdatedUsers') || '{}');
  // Case-insensitive lookup
  const matchingKey = Object.keys(locallyUpdated).find(
    (key) => key.trim().toLowerCase() === email.trim().toLowerCase()
  );
  const localData = matchingKey ? locallyUpdated[matchingKey] : null;

  const finalName = localData?.fullName || String(user.fullName ?? user.displayName ?? '');
  const finalPhone = localData?.phone || String(user.phone ?? '');
  const rawPlates = localData?.licensePlates
    || (Array.isArray(user.licensePlates) ? user.licensePlates : []);

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
      .map((item) => {
        if (!item) return null;
        if (typeof item === 'string') {
          const plate = item.toUpperCase().trim();
          return plate ? { plateNumber: plate, vehicleType: 'car' as const, isDefault: false } : null;
        }
        if (typeof item === 'object') {
          const p = item as Record<string, unknown>;
          const plate = String(p.plateNumber ?? '').toUpperCase().trim();
          return plate
            ? {
                _id: p._id ? String(p._id) : undefined,
                plateNumber: plate,
                vehicleType: p.vehicleType === 'motorcycle' ? ('motorcycle' as const) : ('car' as const),
                isDefault: p.isDefault === true || p.isDefault === 'true',
              }
            : null;
        }
        return null;
      })
      .filter((p): p is { _id?: string; plateNumber: string; vehicleType: 'car' | 'motorcycle'; isDefault?: boolean } => Boolean(p && p.plateNumber)),
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      session: mapLegacySession(),
      isAuthenticating: false,
      error: null,
      async login(email, password) {
        set({ isAuthenticating: true, error: null });
        try {
          let session = await loginWithBackend({ email, password });

          // Đồng bộ: Merge thông tin đã lưu cục bộ vào session mới đăng nhập
          const locallyUpdated = JSON.parse(localStorage.getItem('pbms.locallyUpdatedUsers') || '{}');
          const matchingKey = Object.keys(locallyUpdated).find(
            (key) => key.trim().toLowerCase() === email.trim().toLowerCase()
          );
          const localData = matchingKey ? locallyUpdated[matchingKey] : null;

          if (localData) {
            // Merge local profile data on top of fresh backend session
            const localPlates: Array<{ _id?: string; plateNumber: string; vehicleType: 'car' | 'motorcycle'; isDefault?: boolean }> =
              (localData.licensePlates || []).map((p: any) => ({
                _id: p?._id ? String(p._id) : undefined,
                plateNumber: String(p?.plateNumber || p || '').toUpperCase().trim(),
                vehicleType: p?.vehicleType === 'motorcycle' ? ('motorcycle' as const) : ('car' as const),
                isDefault: p?.isDefault === true || p?.isDefault === 'true',
              })).filter((p: any) => p.plateNumber);

            // Merge uniquely: prefer local type info, include backend plates too
            const mergedPlates = [...localPlates];
            (session.licensePlates || []).forEach((p) => {
              const matched = mergedPlates.find((lp) => lp.plateNumber === p.plateNumber.toUpperCase());
              if (!matched) {
                mergedPlates.push(p);
              } else {
                if (!matched._id && p._id) {
                  matched._id = p._id;
                }
              }
            });

            session = {
              ...session,
              displayName: localData.fullName || session.displayName,
              phone: localData.phone || session.phone,
              licensePlates: mergedPlates,
            };
          }

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

          // Mirror in shared registry so Admin / UsersPage can read updated info
          const locallyUpdated = JSON.parse(localStorage.getItem('pbms.locallyUpdatedUsers') || '{}');
          const data = {
            fullName: profile.fullName,
            phone: profile.phone,
            licensePlates: profile.licensePlates,
          };
          locallyUpdated[updatedSession.email] = data;
          locallyUpdated[updatedSession.email.trim().toLowerCase()] = data;
          localStorage.setItem('pbms.locallyUpdatedUsers', JSON.stringify(locallyUpdated));

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

          const locallyUpdated = JSON.parse(localStorage.getItem('pbms.locallyUpdatedUsers') || '{}');
          const data = {
            fullName: updatedSession.displayName,
            phone: updatedSession.phone,
            licensePlates: updatedSession.licensePlates,
          };
          locallyUpdated[updatedSession.email] = data;
          locallyUpdated[updatedSession.email.trim().toLowerCase()] = data;
          localStorage.setItem('pbms.locallyUpdatedUsers', JSON.stringify(locallyUpdated));

          return { session: updatedSession };
        });
      },
    }),
    {
      name: AUTH_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ session: state.session }),
    }
  )
);
