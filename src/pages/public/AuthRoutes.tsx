import { useCallback, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import AuthPage, { AuthMode } from '@/pages/AuthPage';
import { requestRegistration, verifyRegistration } from '@/services/authService';
import { useAuth } from '@/hooks/useAuth';

function mapAuthErrorMessage(message: string): string {
  const normalized = message.trim().toLowerCase();

  if (normalized.includes('invalid email or password')) {
    return 'Incorrect email or password.';
  }
  if (normalized.includes('account is deactivated')) {
    return 'This account has been deactivated. Please contact an administrator.';
  }
  if (normalized.includes('email already registered')) {
    return 'This email is already registered.';
  }
  // Thông báo về độ mạnh mật khẩu (độ dài, mật khẩu quá phổ biến, chuỗi liên
  // tiếp…) do backend quyết định và đã đủ rõ — trả nguyên văn ở nhánh mặc định,
  // đừng chép ngưỡng sang đây rồi để nó trôi lệch.
  if (normalized.includes('valid email is required')) {
    return 'Please enter a valid email address.';
  }
  if (normalized.includes('full name is required')) {
    return 'Please enter your full name.';
  }
  if (normalized.includes('invalid phone number')) {
    return 'Invalid phone number.';
  }

  return message || 'Unable to process your request, please try again.';
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

  const { login, adoptSession } = useAuth();

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
            message: 'Login successful.',
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
        } else if (payload.otp) {
          // Bước 2: mã đúng thì tài khoản mới thực sự được tạo, và backend set
          // luôn cookie phiên trong phản hồi — chỉ cần nhận session vào store.
          const session = await verifyRegistration({
            email: payload.email,
            otp: payload.otp,
            password: payload.password,
          });
          adoptSession(session);

          setNotice({
            message: 'Registration successful.',
            type: 'success',
          });
          navigate('/', { replace: true });
        } else {
          // Bước 1: chỉ xin mã OTP. Backend luôn trả cùng một câu dù email đã tồn
          // tại hay chưa (chống dò tài khoản), nên form vẫn chuyển sang ô nhập mã.
          const { message } = await requestRegistration({
            email: payload.email,
            fullName: payload.fullName,
            phone: payload.phone || undefined,
          });

          setNotice({ message, type: 'success' });
        }
      } catch (error) {
        const message = error instanceof Error ? mapAuthErrorMessage(error.message) : 'Unable to process your request.';
        setNotice({ message, type: 'error' });
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [login, adoptSession, navigate],
  );

  return { mode, notice, onModeChange, onBackHome, onSubmit, isLoading };
}

export function PublicLoginRoute() {
  const { user, isBootstrapping } = useAuth();
  const flow = usePublicAuthFlow('login');

  if (isBootstrapping) return null;

  if (user) {
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
