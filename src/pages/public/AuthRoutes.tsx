import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthPage from '@/pages/AuthPage';

function usePublicAuthFlow(initialMode: 'login' | 'register') {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [notice, setNotice] = useState<{ message?: string; type?: string }>({});
  const [isLoading, setLoading] = useState(false);

  const onModeChange = useCallback((m: 'login' | 'register') => setMode(m), []);

  const onBackHome = useCallback(() => navigate('/', { replace: true }), [navigate]);

  const onSubmit = useCallback(
    async ({ mode: m }: { mode: 'login' | 'register'; payload: Record<string, string> }) => {
      setLoading(true);
      await new Promise((r) => setTimeout(r, 700));

      if (m === 'login') {
        setNotice({ message: 'Đăng nhập thành công (mock).', type: 'success' });
        setLoading(false);
        navigate('/', { replace: true });
        return;
      }

      setNotice({ message: 'Đăng ký thành công (mock). Vui lòng kiểm tra email.', type: 'success' });
      setLoading(false);
      setMode('login');
    },
    [navigate]
  );

  return { mode, notice, onModeChange, onBackHome, onSubmit, isLoading };
}

export function PublicLoginRoute() {
  const flow = usePublicAuthFlow('login');
  return <AuthPage {...flow} />;
}

export function PublicRegisterRoute() {
  const flow = usePublicAuthFlow('register');
  return <AuthPage {...flow} />;
}

export default PublicLoginRoute;
