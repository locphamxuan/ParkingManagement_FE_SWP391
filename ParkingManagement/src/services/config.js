export const DEFAULT_API_BASE =
  import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

export function normalizeApiBase(value = DEFAULT_API_BASE) {
  return String(value).trim().replace(/\/$/, '');
}
