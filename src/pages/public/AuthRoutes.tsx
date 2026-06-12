import { useCallback, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import AuthPage, { AuthMode } from '@/pages/AuthPage';
import { requestJson } from '@/services/client/apiClient';
import { useAuth } from '@/hooks/useAuth';

interface AuthApiResponse {
  success: boolean;
  message?: string;
  data?: {
    token?: string;
    user?: Record<string, unknown>;
  };
}

function mapAuthErrorMessage(message: string): string {
  const normalized = message.trim().toLowerCase();

  if (normalized.includes('invalid email or password')) {
    return 'Email hoặc mật khẩu không đúng.';
  }
  if (normalized.includes('account is deactivated')) {
    return 'Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.';
  }
  if (normalized.includes('email already registered')) {
    return 'Email đã được đăng ký.';
  }
  if (normalized.includes('password must be at least 6 characters')) {
    return 'Mật khẩu phải có ít nhất 6 ký tự.';
  }
  if (normalized.includes('valid email is required')) {
    return 'Email không hợp lệ.';
  }
  if (normalized.includes('full name is required')) {
    return 'Vui lòng nhập họ và tên.';
  }
  if (normalized.includes('invalid phone number')) {
    return 'Số điện thoại không hợp lệ.';
  }

  return message || 'Không thể xử lý yêu cầu, vui lòng thử lại.';
}

function usePublicAuthFlow(initialMode: 'login' | 'register') {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [notice, setNotice] = useState<{ message?: string; type?: string }>({});
  const [isLoading, setLoading] = useState(false);

  const onModeChange = useCallback((m: AuthMode) => {
    setMode(m);
  }, []);

  const onBackHome = useCallback(
    () => navigate("/", { replace: true }),
    [navigate],
  );

  const { login } = useAuth();

  const onSubmit = useCallback(
    async ({
      mode: m,
      payload,
    }: {
      mode: string;
      payload: Record<string, string>;
    }) => {
      try {
        setLoading(true);

        if (m === 'login') {
          const session = await login(payload.email, payload.password);

          setNotice({
            message: 'Đăng nhập thành công.',
            type: 'success',
          });

          if (session.role === 'admin') {
            navigate('/admin/dashboard', { replace: true });
          } else if (session.role === 'manager') {
            navigate('/manager/dashboard', { replace: true });
          } else if (session.role === 'staff') {
            navigate('/staff', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        } else {
          const path = '/users/auth/register';
          const response = await requestJson<AuthApiResponse>({
            path,
            method: 'POST',
            body: payload,
          });

          const token = response?.data?.token;
          const user = response?.data?.user;

          if (!token || !user) {
            throw new Error('Phản hồi xác thực không hợp lệ từ máy chủ.');
          }

          setNotice({
            message: 'Đăng ký thành công.',
            type: 'success',
          });
          navigate('/', { replace: true });
        }
      } catch (error) {
        const message = error instanceof Error ? mapAuthErrorMessage(error.message) : 'không thể xử lý yêu cầu';
        setNotice({ message, type: 'error' });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [login, navigate],
  );

  return { mode, notice, onModeChange, onBackHome, onSubmit, isLoading };
}

export function PublicLoginRoute() {
  const { token, user } = useAuth();
  const flow = usePublicAuthFlow('login');

  if (token && user) {
    const redirectPath = user.role === 'admin' ? '/admin/dashboard' : user.role === 'manager' ? '/manager/dashboard' : user.role === 'staff' ? '/staff' : '/';
    return <Navigate to={redirectPath} replace />;
  }

  return <AuthPage {...flow} />;
}

export function PublicRegisterRoute() {
  const flow = usePublicAuthFlow('register');
  return <AuthPage {...flow} />;
}

export function PublicResetPasswordRoute() {
  const flow = usePublicAuthFlow('login'); // AuthPage sẽ tự động đọc token từ URL và chuyển sang chế độ đặt lại mật khẩu
  return <AuthPage {...flow} />;
}

export default PublicLoginRoute;
