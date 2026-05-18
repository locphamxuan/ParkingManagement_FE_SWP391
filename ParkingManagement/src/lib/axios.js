import axios from 'axios';
import { DEFAULT_API_BASE, normalizeApiBase } from '@/services/config';
import { loadApiBase, loadSession } from '@/services/storage';

const api = axios.create({
  baseURL: normalizeApiBase(loadApiBase(DEFAULT_API_BASE)),
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const { token } = loadSession();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Không thể xử lý yêu cầu';

    return Promise.reject(new Error(message));
  }
);

export function setApiBase(nextBase) {
  api.defaults.baseURL = normalizeApiBase(nextBase);
}

export default api;
