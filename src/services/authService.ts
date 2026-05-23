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

  return {
    token,
    userId: String(user._id),
    role: user.role,
    email: user.email,
    displayName: user.fullName,
    assignedBuildingIds,
  };
}
