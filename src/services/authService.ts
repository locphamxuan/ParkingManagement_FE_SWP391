import { requestJson } from '@/services/client/apiClient';
import { saveForgotEmail, clearForgotEmail } from '@/services/client/storage';

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
  licensePlates?: Array<{ _id?: string; plateNumber?: string; vehicleType?: string; brand?: string | null; isDefault?: boolean } | string>;
}

interface ApiAuthResponse {
  data?: {
    user?: ApiUser;
  };
}

export interface AuthSession {
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
 * Map the backend `{ user }` payload into the FE AuthSession shape (the auth
 * token itself lives only in the httpOnly cookie the backend sets alongside
 * this response — the browser client never reads or stores it).
 * Shared by login / register / register-verify / me (all return the same envelope).
 */
function mapAuthSession(payload: ApiAuthResponse): AuthSession {
  const user = payload?.data?.user;

  if (!user) {
    throw new Error('Invalid authentication response from the server.');
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
            _id: item._id ? String(item._id) : undefined,
            plateNumber: item.plateNumber || '',
            vehicleType: item.vehicleType === 'motorcycle' ? ('motorcycle' as const) : ('car' as const),
            brand: item.brand ?? null,
            isDefault: Boolean(item.isDefault),
          };
        })
        .filter((item) => Boolean(item.plateNumber))
    : [];

  return {
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

  return { message: payload?.message || 'An OTP has been sent to your email.' };
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
 * Used to bootstrap/restore the browser session on app load, where the
 * httpOnly auth cookie is sent automatically and no token is passed. The
 * optional `token` param exists only for non-browser callers (integration
 * tests) that authenticate via an explicit Bearer token instead of a cookie.
 */
export async function fetchCurrentUser(token?: string): Promise<AuthSession> {
  const payload = await requestJson<ApiAuthResponse>({
    path: '/users/auth/me',
    method: 'GET',
    token,
  });

  return mapAuthSession(payload);
}

/**
 * Clears the httpOnly auth cookie server-side. POST /users/auth/logout.
 */
export async function logoutFromBackend(): Promise<void> {
  await requestJson({ path: '/users/auth/logout', method: 'POST' });
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  const payload = await requestJson<{ message?: string }>({
    path: '/users/auth/forgot-password',
    method: 'POST',
    body: { 
      email: email.trim().toLowerCase(),
      frontendUrl: window.location.origin
    },
  });

  if (!payload?.message) {
    throw new Error('Could not send the password reset email. Please try again.');
  }

  // Store email for reset password step
  saveForgotEmail(email.trim().toLowerCase());

  return { message: payload.message };
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  const payload = await requestJson<{ message?: string }>({
    path: '/users/auth/reset-password',
    method: 'POST',
    body: { token, newPassword },
  });

  if (!payload?.message) {
    throw new Error('Could not reset the password. Please try again.');
  }

  // Clear stored email after successful reset
  clearForgotEmail();

  return { message: payload.message };
}
