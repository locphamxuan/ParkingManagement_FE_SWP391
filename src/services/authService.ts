import { requestJson } from '@/services/pbmsApi';

export interface LoginInput {
  email: string;
  password: string;
}

interface ApiUser {
  _id: string;
  email: string;
  fullName: string;
  role: 'admin' | 'manager' | 'staff' | 'user';
  assignedBuildings?: Array<{ _id?: string } | string>;
  phone?: string;
  licensePlates?: Array<{ _id?: string; plateNumber?: string; vehicleType?: string } | string>;
}

interface ApiAuthResponse {
  data?: {
    token?: string;
    user?: ApiUser;
  };
}

export interface AuthSession {
  token: string;
  userId: string;
  role: 'admin' | 'manager' | 'staff' | 'user';
  email: string;
  displayName: string;
  assignedBuildingIds: string[];
  phone?: string;
  licensePlates?: Array<{ _id?: string; plateNumber: string; vehicleType: 'car' | 'motorcycle'; isDefault?: boolean }>;
}

export async function loginWithBackend(input: LoginInput): Promise<AuthSession> {
  const payload = await requestJson<ApiAuthResponse>({
    path: '/users/auth/login',
    method: 'POST',
    body: {
      email: input.email,
      password: input.password,
    },
  });

  const token = payload?.data?.token;
  const user = payload?.data?.user;

  if (!token || !user) {
    throw new Error('Phản hồi đăng nhập không hợp lệ từ máy chủ.');
  }

  const assignedBuildingIds = Array.isArray(user.assignedBuildings)
    ? user.assignedBuildings
        .map((item) => (typeof item === 'string' ? item : String(item?._id || '')))
        .filter(Boolean)
    : [];

  const licensePlates = Array.isArray(user.licensePlates)
    ? user.licensePlates
        .map((item) => {
          if (typeof item === 'string') {
            return { plateNumber: item, vehicleType: 'car' as const, isDefault: false };
          }
          return {
            _id: (item as any)?._id ? String((item as any)._id) : undefined,
            plateNumber: item?.plateNumber || '',
            vehicleType: (item as any)?.vehicleType === 'motorcycle' ? ('motorcycle' as const) : ('car' as const),
            isDefault: Boolean((item as any)?.isDefault),
          };
        })
        .filter((item) => Boolean(item.plateNumber))
    : [];

  return {
    token,
    userId: String(user._id),
    role: user.role,
    email: user.email,
    displayName: user.fullName,
    assignedBuildingIds,
    phone: user.phone || '',
    licensePlates,
  };
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const payload = await requestJson<{ data?: { message?: string } }>({
    path: '/users/auth/forgot-password',
    method: 'POST',
    body: { email: email.trim().toLowerCase() },
  });

  if (!payload?.data?.message) {
    throw new Error('Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại.');
  }

  // Store email for reset password step
  localStorage.setItem('pbms.forgotEmail_pending', email.trim().toLowerCase());

  return { message: payload.data.message };
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  const payload = await requestJson<{ data?: { message?: string } }>({
    path: '/users/auth/reset-password',
    method: 'POST',
    body: { token, newPassword },
  });

  if (!payload?.data?.message) {
    throw new Error('Không thể đặt lại mật khẩu. Vui lòng thử lại.');
  }

  // Clear stored email after successful reset
  localStorage.removeItem('pbms.forgotEmail_pending');

  return { message: payload.data.message };
}
