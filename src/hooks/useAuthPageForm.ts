import { useEffect, useMemo, useRef, useState } from 'react';
import type { FormEvent, ChangeEvent, MouseEvent as ReactMouseEvent } from 'react';
import { useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { forgotPassword, resetPassword } from '@/services/authService';
import { STORAGE_KEYS, clearForgotEmail, loadJson, saveJson } from '@/services/client/storage';
import { MIN_PASSWORD_LENGTH } from '@/utils/constants';
import type { AuthMode } from '@/pages/AuthPage';

const initialForm = {
  fullName: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
};

interface UseAuthPageFormArgs {
  mode: AuthMode;
  notice: { message?: string; type?: string };
  onModeChange: (mode: AuthMode) => void;
  onSubmit: (input: { mode: AuthMode; payload: Record<string, string> }) => Promise<unknown>;
}

/**
 * Toàn bộ state + business logic của AuthPage (login/register/forgot/reset).
 * Tách khỏi AuthPage để page chỉ còn lo phần bố cục/hiển thị theo từng chế độ.
 */
export function useAuthPageForm({ mode, notice, onModeChange, onSubmit }: UseAuthPageFormArgs) {
  const [searchParams] = useSearchParams();
  const [localNotice, setLocalNotice] = useState<{ message?: string; type?: string } | null>(null);
  const [form, setForm] = useState(initialForm);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetPasswordForm, setResetPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  // Chỉ ghi nhớ EMAIL để gợi ý đăng nhập — KHÔNG bao giờ lưu mật khẩu ở client.
  const [savedAccounts, setSavedAccounts] = useState<{ email: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  // Đăng ký đi 2 bước: xin mã OTP qua email rồi mới tạo tài khoản. Giữ lại thông
  // tin đã nhập ở bước 1 vì mật khẩu chỉ được gửi lên ở bước 2 (xem authService).
  const [pendingRegistration, setPendingRegistration] = useState<Record<string, string> | null>(null);
  const [otpCode, setOtpCode] = useState('');

  useEffect(() => {
    setShowPassword(false);
    setShowConfirmPassword(false);
    setPendingRegistration(null);
    setOtpCode('');
  }, [mode]);

  // Modal thông báo (thành công/thất bại) cho luồng quên & đặt lại mật khẩu.
  const [modal, setModal] = useState<{
    title: string;
    message: string;
    type: 'success' | 'error';
    next?: () => void;
  } | null>(null);

  const closeModal = () => {
    const next = modal?.next;
    setModal(null);
    next?.();
  };

  // Auto-detect reset-password mode from URL token
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setResetToken(token);
      onModeChange('reset-password');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  // Load saved emails from localStorage on mount and initialize phones
  useEffect(() => {
    const parsed = loadJson<{ email?: string }[]>(STORAGE_KEYS.savedAccounts);
    if (parsed) {
      // Chỉ giữ email; loại bỏ mọi mật khẩu plaintext có thể còn sót từ bản cũ.
      const emailsOnly = parsed
        .filter((acc) => acc?.email)
        .map((acc) => ({ email: acc.email as string }));
      setSavedAccounts(emailsOnly);
      saveJson(STORAGE_KEYS.savedAccounts, emailsOnly);
    }
  }, []);

  // Save email helper (no password persisted)
  const saveAccount = (email: string) => {
    if (!email) return;
    let current = loadJson<{ email: string }[]>(STORAGE_KEYS.savedAccounts) ?? [];

    // Bỏ trùng, đưa lên đầu, giữ tối đa 5 email
    current = current.filter((acc) => acc.email !== email);
    current.unshift({ email });
    current = current.slice(0, 5);

    saveJson(STORAGE_KEYS.savedAccounts, current);
    setSavedAccounts(current);
  };

  // Delete saved account
  const deleteSavedAccount = (e: ReactMouseEvent, emailToDelete: string) => {
    e.stopPropagation();
    e.preventDefault(); // Prevents input from losing focus!
    const updated = savedAccounts.filter((acc) => acc.email !== emailToDelete);
    saveJson(STORAGE_KEYS.savedAccounts, updated);
    setSavedAccounts(updated);
  };

  const handleSelectAccount = (e: { preventDefault: () => void }, acc: { email: string }) => {
    e.preventDefault(); // Điền sẵn email, người dùng tự nhập mật khẩu.
    setForm((s) => ({ ...s, email: acc.email }));
    setShowDropdown(false);
    // Tự động focus vào ô mật khẩu sau khi điền email, giúp trình duyệt gợi ý mật khẩu tương ứng đã lưu
    setTimeout(() => {
      passwordInputRef.current?.focus();
    }, 50);
  };

  // 3D Mouse Tracking Tilt Motion Values
  const mouseX = useMotionValue(0.5); // Range: 0 to 1
  const mouseY = useMotionValue(0.5); // Range: 0 to 1

  // Smooth springs for high-tactile response
  const springX = useSpring(mouseX, { stiffness: 120, damping: 22 });
  const springY = useSpring(mouseY, { stiffness: 120, damping: 22 });

  // Map mouse positions to rotational angles
  const rotateY = useTransform(springX, [0, 1], [-8, 8]);
  const rotateX = useTransform(springY, [0, 1], [8, -8]);

  const otpStep = Boolean(pendingRegistration);

  const title = useMemo(() => {
    if (mode === 'reset-password') return 'Reset Password';
    if (mode === 'forgot-password') return 'Recover Password';
    if (mode === 'register' && otpStep) return 'Verify Your Email';
    return mode === 'login' ? 'Login to PBMS' : 'Create PBMS Account';
  }, [mode, otpStep]);
  const description = useMemo(() => {
    if (mode === 'reset-password')
      return 'Enter your new password to complete the reset process.';
    if (mode === 'forgot-password')
      return 'Enter the email address associated with your account to receive a reset link.';
    if (mode === 'register' && otpStep)
      return 'We sent a 6-digit code to your email. Enter it to finish creating your account.';
    return mode === 'login'
      ? 'Log in to continue using the smart parking management system.'
      : 'Create a new account to start using the smart parking platform.';
  }, [mode, otpStep]);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalNotice(null);

    if (mode === 'register') {
      if (form.password !== form.confirmPassword) {
        setLocalNotice({ message: 'Confirm password does not match!', type: 'error' });
        return;
      }

      const phoneTrimmed = form.phone.trim();
      const phoneRegex = /^0[0-9]{9}$/;
      if (!phoneRegex.test(phoneTrimmed)) {
        setLocalNotice({
          message: 'Phone number must start with 0 and contain exactly 10 digits!',
          type: 'error',
        });
        return;
      }

      // Chặn sớm đúng ngưỡng của BE (`utils/passwordPolicy`, 12 ký tự): mật khẩu
      // chỉ được gửi ở bước 2, nên nếu không kiểm ở đây thì người dùng phải chờ
      // nhận email, gõ mã xong mới biết mật khẩu bị từ chối.
      if (form.password.length < MIN_PASSWORD_LENGTH) {
        setLocalNotice({
          message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters!`,
          type: 'error',
        });
        return;
      }

      const payload: Record<string, string> = {
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        phone: phoneTrimmed,
      };

      try {
        // Bước 1 — chỉ xin mã OTP. BE kiểm tra trùng email/phone (409 PHONE_TAKEN)
        // ở bước 2; lỗi hiển thị qua notice của parent.
        await onSubmit({ mode, payload });
        setPendingRegistration(payload);
        setOtpCode('');
      } catch {
        // Error already mapped in public auth flow hook
      }
    } else {
      const payload: Record<string, string> = {
        email: form.email.trim(),
        password: form.password,
      };

      try {
        await onSubmit({ mode, payload });
        saveAccount(form.email.trim());
      } catch (err) {
        // BE xử lý lockout (423 ACCOUNT_LOCKED) + sai mật khẩu — hiển thị message của BE.
        setLocalNotice({
          message: err instanceof Error ? err.message : 'Login failed',
          type: 'error',
        });
      }
    }
  }

  /** Bước 2 của đăng ký: gửi mã + mật khẩu đã nhập ở bước 1 để tạo tài khoản. */
  async function handleVerifyOtp(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalNotice(null);

    if (!pendingRegistration) return;

    const otp = otpCode.trim();
    if (!/^\d{6}$/.test(otp)) {
      setLocalNotice({ message: 'The verification code is 6 digits.', type: 'error' });
      return;
    }

    try {
      await onSubmit({ mode: 'register', payload: { ...pendingRegistration, otp } });
    } catch {
      // Thông báo lỗi (mã sai, hết hạn, email/SĐT đã dùng) do parent map và hiển thị.
    }
  }

  /** Gửi lại mã: dùng đúng dữ liệu bước 1, không bắt người dùng gõ lại form. */
  async function handleResendOtp() {
    if (!pendingRegistration) return;
    setLocalNotice(null);
    try {
      await onSubmit({ mode: 'register', payload: pendingRegistration });
      setOtpCode('');
    } catch {
      // Đã hiển thị ở notice của parent.
    }
  }

  /** Quay lại form đăng ký; mã cũ vẫn còn hiệu lực ở BE cho tới khi hết hạn. */
  const handleCancelOtp = () => {
    setPendingRegistration(null);
    setOtpCode('');
    setLocalNotice(null);
  };

  async function handleForgotPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalNotice(null);

    const email = forgotEmail.trim();

    if (!email) {
      setLocalNotice({ message: 'Please enter your email!', type: 'error' });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalNotice({ message: 'Invalid email address!', type: 'error' });
      return;
    }

    try {
      await forgotPassword(email);
      setModal({
        title: 'Recovery Email Sent',
        message:
          'If this email exists in our system, we have sent a reset password link. Please check your inbox (including spam folder). The link is valid for 15 minutes.',
        type: 'success',
        next: () => {
          setForgotEmail('');
          setLocalNotice(null);
          onModeChange('login');
        },
      });
    } catch (error) {
      setModal({
        title: 'Failed to Send Email',
        message: error instanceof Error ? error.message : 'Failed to send email. Please try again.',
        type: 'error',
      });
    }
  }

  async function handleResetPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalNotice(null);

    if (!resetToken) {
      setLocalNotice({ message: 'Invalid or expired password reset link!', type: 'error' });
      return;
    }

    const newPassword = resetPasswordForm.newPassword.trim();
    const confirmPassword = resetPasswordForm.confirmPassword.trim();

    // Validation: Mật khẩu không được bỏ trống
    if (!newPassword || !confirmPassword) {
      setLocalNotice({ message: 'Please enter password!', type: 'error' });
      return;
    }

    // Validation: Độ dài mật khẩu >= 6
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setLocalNotice({
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters!`,
        type: 'error',
      });
      return;
    }

    // Validation: Mật khẩu và xác nhận phải trùng khớp
    if (newPassword !== confirmPassword) {
      setLocalNotice({ message: 'Confirm password does not match!', type: 'error' });
      return;
    }

    try {
      await resetPassword(resetToken, newPassword);

      // Mật khẩu là dữ liệu nhạy cảm — không lưu plaintext ở client. Nguồn chính
      // thống là backend; chỉ dọn email pending còn sót lại.
      clearForgotEmail();

      setModal({
        title: 'Password Reset Successfully',
        message: 'Your password has been updated. Please log in with your new password.',
        type: 'success',
        next: () => {
          setResetPasswordForm({ newPassword: '', confirmPassword: '' });
          setResetToken(null);
          setLocalNotice(null);
          onModeChange('login');
        },
      });
    } catch (error) {
      setModal({
        title: 'Failed to Reset Password',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to reset password. Please try again or request a new link.',
        type: 'error',
      });
    }
  }

  function handleMouseMove(e: ReactMouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const x = (e.clientX - rect.left) / width;
    const y = (e.clientY - rect.top) / height;
    mouseX.set(x);
    mouseY.set(y);
  }

  function handleMouseLeave() {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }

  // Composite handlers dùng trực tiếp trong JSX (gộp đổi mode + reset state liên quan)
  const handleGoToForgotPassword = () => onModeChange('forgot-password');

  const handleCancelForgotPassword = () => {
    onModeChange('login');
    setForgotEmail('');
    setLocalNotice(null);
  };

  const handleCancelResetPassword = () => {
    onModeChange('login');
    setResetPasswordForm({ newPassword: '', confirmPassword: '' });
    setResetToken(null);
    setLocalNotice(null);
  };

  const handleToggleLoginRegister = () => onModeChange(mode === 'login' ? 'register' : 'login');

  const displayNotice = localNotice || notice;

  return {
    title,
    description,
    displayNotice,
    modal,
    closeModal,
    form,
    handleChange,
    handleSubmit,
    showPassword,
    setShowPassword,
    showConfirmPassword,
    setShowConfirmPassword,
    showDropdown,
    setShowDropdown,
    savedAccounts,
    handleSelectAccount,
    deleteSavedAccount,
    emailInputRef,
    passwordInputRef,
    dropdownRef,
    otpStep,
    otpCode,
    setOtpCode,
    pendingEmail: pendingRegistration?.email ?? '',
    handleVerifyOtp,
    handleResendOtp,
    handleCancelOtp,
    forgotEmail,
    setForgotEmail,
    handleForgotPassword,
    resetPasswordForm,
    setResetPasswordForm,
    handleResetPassword,
    rotateX,
    rotateY,
    handleMouseMove,
    handleMouseLeave,
    handleGoToForgotPassword,
    handleCancelForgotPassword,
    handleCancelResetPassword,
    handleToggleLoginRegister,
  };
}

export type AuthPageFormState = ReturnType<typeof useAuthPageForm>;
