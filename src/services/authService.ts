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
  licensePlates?: Array<{ _id?: string; plateNumber: string; vehicleType: 'car' | 'motorcycle'; brand?: string | null; isDefault?: boolean }>;
}

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface RegisterVerifyInput {
  email: string;
  otp: string;
}

/**
 * Map the backend `{ token, user }` payload into the FE AuthSession shape.
 * Shared by login / register / register-verify (all return the same envelope).
 */
function mapAuthSession(payload: ApiAuthResponse): AuthSession {
  const token = payload?.data?.token;
  const user = payload?.data?.user;

  if (!token || !user) {
    throw new Error('Phản hồi xác thực không hợp lệ từ máy chủ.');
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
            return { plateNumber: item, vehicleType: 'car' as const, brand: null, isDefault: false };
          }
          return {
            _id: (item as any)?._id ? String((item as any)._id) : undefined,
            plateNumber: item?.plateNumber || '',
            vehicleType: (item as any)?.vehicleType === 'motorcycle' ? ('motorcycle' as const) : ('car' as const),
            brand: (item as any)?.brand ?? null,
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

export async function loginWithBackend(input: LoginInput): Promise<AuthSession> {
  const payload = await requestJson<ApiAuthResponse>({
    path: '/users/auth/login',
    method: 'POST',
    body: {
      email: input.email,
      password: input.password,
    },
  });

  return mapAuthSession(payload);
}

/**
 * Register directly (no OTP). POST /users/auth/register → { token, user }.
 */
export async function registerWithBackend(input: RegisterInput): Promise<AuthSession> {
  const payload = await requestJson<ApiAuthResponse>({
    path: '/users/auth/register',
    method: 'POST',
    body: {
      email: input.email.trim().toLowerCase(),
      password: input.password,
      fullName: input.fullName.trim(),
      ...(input.phone ? { phone: input.phone.trim() } : {}),
    },
  });

  return mapAuthSession(payload);
}

/**
 * Step 1 of OTP registration. POST /users/auth/register-request → sends an OTP
 * to the email. Returns the server message.
 */
export async function requestRegistration(input: RegisterInput): Promise<{ message: string }> {
  const payload = await requestJson<{ message?: string }>({
    path: '/users/auth/register-request',
    method: 'POST',
    body: {
      email: input.email.trim().toLowerCase(),
      password: input.password,
      fullName: input.fullName.trim(),
      ...(input.phone ? { phone: input.phone.trim() } : {}),
    },
  });

  return { message: payload?.message || 'OTP đã được gửi tới email của bạn.' };
}

/**
 * Step 2 of OTP registration. POST /users/auth/register-verify → { token, user }.
 */
export async function verifyRegistration(input: RegisterVerifyInput): Promise<AuthSession> {
  const payload = await requestJson<ApiAuthResponse>({
    path: '/users/auth/register-verify',
    method: 'POST',
    body: {
      email: input.email.trim().toLowerCase(),
      otp: input.otp.trim(),
    },
  });

  return mapAuthSession(payload);
}

/**
 * Fetch the current authenticated user. GET /users/auth/me → { user }.
 */
export async function fetchCurrentUser(token: string): Promise<AuthSession> {
  const payload = await requestJson<ApiAuthResponse>({
    path: '/users/auth/me',
    method: 'GET',
    token,
  });

  // /me returns { data: { user } } (no token) — reuse the stored token.
  return mapAuthSession({ data: { token, user: payload?.data?.user } });
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const payload = await requestJson<{ message?: string }>({
    path: '/users/auth/forgot-password',
    method: 'POST',
    body: { email: email.trim().toLowerCase() },
  });

  if (!payload?.message) {
    throw new Error('Không thể gửi email đặt lại mật khẩu. Vui lòng thử lại.');
  }

  // Store email for reset password step
  localStorage.setItem('pbms.forgotEmail_pending', email.trim().toLowerCase());

  return { message: payload.message };
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  const payload = await requestJson<{ message?: string }>({
    path: '/users/auth/reset-password',
    method: 'POST',
    body: { token, newPassword },
  });

  if (!payload?.message) {
    throw new Error('Không thể đặt lại mật khẩu. Vui lòng thử lại.');
  }

  // Clear stored email after successful reset
  localStorage.removeItem('pbms.forgotEmail_pending');

  return { message: payload.message };
}
