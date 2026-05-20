import { MOCK_ADMIN } from '@/utils/constants';

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthSession {
  token: string;
  role: 'admin';
  email: string;
  displayName: string;
}

export async function mockLogin(input: LoginInput): Promise<AuthSession> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (
    input.email.toLowerCase() !== MOCK_ADMIN.email ||
    input.password !== MOCK_ADMIN.password
  ) {
    throw new Error('Invalid credentials. Use admin@gmail.com / 1');
  }

  return {
    token: `mock-token-${Date.now()}`,
    role: 'admin',
    email: MOCK_ADMIN.email,
    displayName: 'PBMS System Administrator',
  };
}
