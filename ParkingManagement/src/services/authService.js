import api from '@/lib/axios';

/**
 * @param {{ email: string, password: string, fullName?: string, phone?: string }} payload
 */
export async function login(payload) {
  const { data } = await api.post('/users/auth/login', payload);
  return data;
}

/**
 * @param {{ email: string, password: string, fullName: string, phone?: string }} payload
 */
export async function register(payload) {
  const { data } = await api.post('/users/auth/register', payload);
  return data;
}

export async function getMe() {
  const { data } = await api.get('/users/auth/me');
  return data;
}
