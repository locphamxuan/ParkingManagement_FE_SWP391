import { useCallback, useEffect, useState } from 'react';
import { DEFAULT_API_BASE, requestJson } from '../services/pbmsApi';
import {
  clearSession,
  loadApiBase,
  loadSession,
  saveApiBase,
  saveSession,
  type LocalSession,
} from '../services/storage';

interface UseAuthSessionOptions {
  onMessage?: (message: string, type?: 'info' | 'success' | 'error') => void;
}

interface AuthPayload {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
}

interface AuthApiResponse {
  data?: LocalSession;
}

export default function useAuthSession({ onMessage }: UseAuthSessionOptions = {}) {
  const [apiBase, setApiBaseState] = useState(() => loadApiBase(DEFAULT_API_BASE));
  const [session, setSession] = useState<LocalSession>(() => loadSession());
  const [isLoading, setIsLoading] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const pushMessage = useCallback(
    (message: string, type: 'info' | 'success' | 'error' = 'info') => {
      onMessage?.(message, type);
    },
    [onMessage]
  );

  const persistSession = useCallback((nextSession: LocalSession) => {
    setSession(nextSession);
    saveSession(nextSession);
  }, []);

  const updateApiBase = useCallback(
    (nextApiBase: string) => {
      setApiBaseState(nextApiBase);
      saveApiBase(nextApiBase);
      pushMessage('Da luu dia chi ket noi.', 'success');
    },
    [pushMessage]
  );

  const refreshProfile = useCallback(async () => {
    if (!session.token) {
      pushMessage('Ban can dang nhap truoc.', 'error');
      return null;
    }

    try {
      setIsLoading(true);
      const response = await requestJson<AuthApiResponse>({
        apiBase,
        path: '/users/auth/me',
        token: session.token,
      });
      const user = response?.data?.user;

      if (!user) {
        throw new Error('Khong doc duoc thong tin nguoi dung');
      }

      const nextSession: LocalSession = { token: session.token, user };
      persistSession(nextSession);
      pushMessage('Da lam moi ho so ca nhan.', 'success');
      return nextSession;
    } catch (error) {
      clearSession();
      persistSession({ token: '', user: null });
      pushMessage(`Phien khong hop le: ${(error as Error).message}`, 'error');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [apiBase, persistSession, pushMessage, session.token]);

  const login = useCallback(
    async (payload: AuthPayload) => {
      try {
        setIsLoading(true);
        const response = await requestJson<AuthApiResponse>({
          apiBase,
          path: '/users/auth/login',
          method: 'POST',
          body: payload,
        });
        const nextSession = response?.data;

        if (!nextSession?.token || !nextSession?.user) {
          throw new Error('Phan hoi dang nhap khong hop le');
        }

        persistSession(nextSession);
        pushMessage('Dang nhap thanh cong.', 'success');
        return nextSession;
      } catch (error) {
        pushMessage((error as Error).message, 'error');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [apiBase, persistSession, pushMessage]
  );

  const register = useCallback(
    async (payload: AuthPayload) => {
      try {
        setIsLoading(true);
        const response = await requestJson<AuthApiResponse>({
          apiBase,
          path: '/users/auth/register',
          method: 'POST',
          body: payload,
        });
        const nextSession = response?.data;

        if (!nextSession?.token || !nextSession?.user) {
          throw new Error('Phan hoi dang ky khong hop le');
        }

        persistSession(nextSession);
        pushMessage('Dang ky thanh cong.', 'success');
        return nextSession;
      } catch (error) {
        pushMessage((error as Error).message, 'error');
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [apiBase, persistSession, pushMessage]
  );

  const logout = useCallback(() => {
    clearSession();
    persistSession({ token: '', user: null });
    pushMessage('Da dang xuat khoi he thong.', 'success');
  }, [persistSession, pushMessage]);

  useEffect(() => {
    const hasToken = Boolean(session.token);

    if (!hasToken) {
      setIsBootstrapping(false);
      return;
    }

    refreshProfile().finally(() => setIsBootstrapping(false));
  }, []);

  return {
    apiBase,
    isBootstrapping,
    isLoading,
    session,
    login,
    logout,
    register,
    refreshProfile,
    updateApiBase,
  };
}
