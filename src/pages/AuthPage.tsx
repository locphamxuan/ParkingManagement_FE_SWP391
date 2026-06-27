import { useMemo, useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { Home, X, AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { forgotPassword, resetPassword } from '@/services/authService';
import { InteractiveParticleCanvas } from '@/components/common/InteractiveParticleCanvas';
import back1 from '@/assets/back1.webp';


const initialForm = {
  fullName: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export type AuthMode = 'login' | 'register' | 'forgot-password' | 'reset-password';

interface AuthPageProps {
  mode: AuthMode;
  notice: { message?: string; type?: string };
  onModeChange: (mode: AuthMode) => void;
  onBackHome: () => void;
  onSubmit: (input: { mode: AuthMode; payload: Record<string, string> }) => Promise<unknown>;
  isLoading: boolean;
}

const promoPoints = [
  {
    title: 'Dễ sử dụng',
    text: 'Biểu mẫu sáng rõ, thao tác nhanh và đồng bộ màu sắc với landing page trang chủ.',
  },
  {
    title: 'Đúng bối cảnh',
    text: 'Hình nền bãi đỗ xe và tông màu cam kem giúp nhận diện rõ đây là hệ thống parking.',
  },
  {
    title: 'An tâm truy cập',
    text: 'Thông tin tài khoản và các luồng đăng nhập, đăng ký được trình bày ngắn gọn, dễ theo dõi.',
  },
];

export default function AuthPage({ mode, notice, onModeChange, onSubmit, isLoading }: AuthPageProps) {
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

  useEffect(() => {
    setShowPassword(false);
    setShowConfirmPassword(false);
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
  }, [searchParams]);

  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);
  const passwordInputRef = useRef<HTMLInputElement | null>(null);

  // Load saved emails from localStorage on mount and initialize phones
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pbms_saved_accounts');
      if (stored) {
        // Chỉ giữ email; loại bỏ mọi mật khẩu plaintext có thể còn sót từ bản cũ.
        const parsed: { email?: string }[] = JSON.parse(stored);
        const emailsOnly = parsed
          .filter((acc) => acc?.email)
          .map((acc) => ({ email: acc.email as string }));
        setSavedAccounts(emailsOnly);
        localStorage.setItem('pbms_saved_accounts', JSON.stringify(emailsOnly));
      }
    } catch (e) {
      console.error('Failed to load saved accounts', e);
    }
  }, []);

  // Save email helper (no password persisted)
  const saveAccount = (email: string) => {
    if (!email) return;
    try {
      const stored = localStorage.getItem('pbms_saved_accounts');
      let current: { email: string }[] = stored ? JSON.parse(stored) : [];

      // Remove duplicates, add to front, keep max 5
      current = current.filter((acc) => acc.email !== email);
      current.unshift({ email });
      current = current.slice(0, 5);

      localStorage.setItem('pbms_saved_accounts', JSON.stringify(current));
      setSavedAccounts(current);
    } catch (e) {
      console.error('Failed to save account', e);
    }
  };

  // Delete saved account
  const deleteSavedAccount = (e: React.MouseEvent, emailToDelete: string) => {
    e.stopPropagation();
    e.preventDefault(); // Prevents input from losing focus!
    try {
      const updated = savedAccounts.filter(acc => acc.email !== emailToDelete);
      localStorage.setItem('pbms_saved_accounts', JSON.stringify(updated));
      setSavedAccounts(updated);
    } catch (err) {
      console.error('Failed to delete saved account', err);
    }
  };

  const handleSelectAccount = (e: React.MouseEvent, acc: { email: string }) => {
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

  const title = useMemo(() => {
    if (mode === 'reset-password') return 'Đặt lại mật khẩu';
    if (mode === 'forgot-password') return 'Khôi phục mật khẩu';
    return mode === 'login' ? 'Đăng nhập vào PBMS' : 'Tạo tài khoản PBMS';
  }, [mode]);
  const description = useMemo(() => {
    if (mode === 'reset-password')
      return 'Nhập mật khẩu mới của bạn để hoàn tất quá trình đặt lại mật khẩu.';
    if (mode === 'forgot-password')
      return 'Nhập địa chỉ email liên kết với tài khoản của bạn để nhận link đặt lại mật khẩu.';
    return mode === 'login'
      ? 'Đăng nhập để tiếp tục sử dụng hệ thống quản lý bãi đỗ xe, theo dõi thông tin và truy cập các chức năng cần thiết.'
      : 'Tạo tài khoản mới để bắt đầu sử dụng nền tảng quản lý bãi đỗ xe với giao diện đồng nhất cùng trang chủ.';
  }, [mode]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalNotice(null);

    if (mode === 'register') {
      if (form.password !== form.confirmPassword) {
        setLocalNotice({ message: 'Mật khẩu xác nhận không khớp!', type: 'error' });
        return;
      }

      const phoneTrimmed = form.phone.trim();
      const phoneRegex = /^0[0-9]{9}$/;
      if (!phoneRegex.test(phoneTrimmed)) {
        setLocalNotice({
          message: 'Số điện thoại phải bắt đầu bằng số 0 và có đúng 10 chữ số!',
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
        // BE kiểm tra trùng email/phone (409 PHONE_TAKEN) — lỗi hiển thị qua notice của parent.
        await onSubmit({ mode, payload });
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
          message: err instanceof Error ? err.message : 'Đăng nhập thất bại',
          type: 'error',
        });
      }
    }
  }

  async function handleForgotPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalNotice(null);

    const email = forgotEmail.trim();
    
    if (!email) {
      setLocalNotice({ message: 'Vui lòng nhập email của bạn!', type: 'error' });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setLocalNotice({ message: 'Email không hợp lệ!', type: 'error' });
      return;
    }

    try {
      await forgotPassword(email);
      setModal({
        title: 'Đã gửi email khôi phục',
        message:
          'Nếu email này có trong hệ thống, chúng tôi đã gửi link đặt lại mật khẩu. Vui lòng kiểm tra hộp thư (kể cả thư mục spam). Link có hiệu lực trong 15 phút.',
        type: 'success',
        next: () => {
          setForgotEmail('');
          setLocalNotice(null);
          onModeChange('login');
        },
      });
    } catch (error) {
      setModal({
        title: 'Gửi email thất bại',
        message: error instanceof Error ? error.message : 'Gửi email thất bại. Vui lòng thử lại.',
        type: 'error',
      });
    }
  }

  async function handleResetPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLocalNotice(null);

    if (!resetToken) {
      setLocalNotice({ message: 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn!', type: 'error' });
      return;
    }

    const newPassword = resetPasswordForm.newPassword.trim();
    const confirmPassword = resetPasswordForm.confirmPassword.trim();

    // Validation: Mật khẩu không được bỏ trống
    if (!newPassword || !confirmPassword) {
      setLocalNotice({ message: 'Vui lòng nhập mật khẩu!', type: 'error' });
      return;
    }

    // Validation: Độ dài mật khẩu >= 6
    if (newPassword.length < 6) {
      setLocalNotice({ message: 'Mật khẩu phải có ít nhất 6 ký tự!', type: 'error' });
      return;
    }

    // Validation: Mật khẩu và xác nhận phải trùng khớp
    if (newPassword !== confirmPassword) {
      setLocalNotice({ message: 'Mật khẩu xác nhận không khớp!', type: 'error' });
      return;
    }

    try {
      await resetPassword(resetToken, newPassword);

      // Mật khẩu là dữ liệu nhạy cảm — không lưu plaintext ở client. Nguồn chính
      // thống là backend; chỉ dọn email pending còn sót lại.
      localStorage.removeItem('pbms.forgotEmail_pending');

      setModal({
        title: 'Đặt lại mật khẩu thành công',
        message: 'Mật khẩu của bạn đã được cập nhật. Vui lòng đăng nhập bằng mật khẩu mới.',
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
        title: 'Đặt lại mật khẩu thất bại',
        message:
          error instanceof Error
            ? error.message
            : 'Đặt lại mật khẩu thất bại. Vui lòng thử lại hoặc yêu cầu link mới.',
        type: 'error',
      });
    }
  }

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
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

  return (
    <main 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 py-12 px-4 overflow-hidden selection:bg-orange-500 selection:text-white"
      style={{ perspective: '1200px' }}
    >
      {/* Laser Scanning Line and perspective grid animations */}
      <style>{`
        @keyframes gridScroll {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 0 45px;
          }
        }
        .cyber-grid-animate {
          animation: gridScroll 3.5s linear infinite;
        }
        @keyframes scanline {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .input-scan-focus {
          transition: all 0.3s ease;
        }
        .input-scan-focus:focus {
          background-image: linear-gradient(90deg, rgba(15,23,42,0.85) 0%, rgba(249,115,22,0.06) 50%, rgba(15,23,42,0.85) 100%);
          background-size: 200% 100%;
          animation: scanline 2.5s linear infinite;
        }
      `}</style>
      
      {/* Background Neon Glow Vectors */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] rounded-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.08),transparent_60%)] pointer-events-none blur-3xl z-0" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.06),transparent_60%)] pointer-events-none blur-3xl z-0" />
      <InteractiveParticleCanvas />

      {/* 3D Cyber-Grid Perspective Floor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-[50%] opacity-40"
          style={{
            perspective: '1000px',
            transformStyle: 'preserve-3d'
          }}
        >
          <div 
            className="w-full h-full cyber-grid-animate"
            style={{
              transform: 'rotateX(75deg)',
              transformOrigin: 'bottom center',
              backgroundImage: `
                linear-gradient(to right, rgba(249, 115, 22, 0.12) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(168, 85, 247, 0.12) 1px, transparent 1px)
              `,
              backgroundSize: '45px 45px',
              maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 80%)',
              WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 80%)',
            }}
          />
        </div>
      </div>

      {/* Floating Sticky Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <a 
          href="/" 
          className="inline-flex items-center gap-2 rounded-xl border border-white/5 bg-slate-900/60 backdrop-blur-md px-4 py-2.5 text-xs font-black uppercase tracking-widest text-orange-400 shadow-xl hover:border-orange-500/30 hover:shadow-[0_0_15px_rgba(249,115,22,0.25)] hover:scale-105 transition-all duration-300"
        >
          <Home size={14} className="stroke-[3]" />
          Về trang chủ
        </a>
      </div>

      {/* Core Center Auth Container with 3D Mouse Tilt */}
      <motion.div 
        style={{ 
          rotateX, 
          rotateY, 
          transformStyle: "preserve-3d" 
        }}
        initial={{ opacity: 0, scale: 0.96, z: -100 }}
        animate={{ opacity: 1, scale: 1, z: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 18 }}
        className="w-full max-w-4xl glass-panel-dark border border-white/5 shadow-2xl rounded-3xl overflow-y-auto md:overflow-hidden max-h-[90vh] md:max-h-none grid grid-cols-1 md:grid-cols-2 relative z-10"
      >
        {/* Left Interactive Promo Info Column */}
        <div 
          className="p-8 text-white flex flex-col justify-between relative overflow-hidden preserve-3d bg-cover bg-no-repeat"
          style={{ 
            transformStyle: "preserve-3d",
            backgroundImage: `url(${back1})`,
            backgroundPosition: 'center 85%'
          }}
        >
          {/* Subtle overlay to ensure text contrast and premium vibe */}
          <div className="absolute inset-0 bg-slate-950/45 pointer-events-none z-0" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none z-0" />
          
          <div className="relative z-10" style={{ transform: "translateZ(30px)" }}>
            <h2 className="text-3xl font-black tracking-tight">{title}</h2>
            <p className="mt-3.5 text-xs font-bold text-orange-100 leading-relaxed">{description}</p>
          </div>
          
          {/* HOLOGRAPHIC 3D RADAR SCANNER CORE */}
          <div 
            className="relative my-6 py-8 flex flex-col items-center justify-center min-h-[180px] z-10 preserve-3d"
            style={{ transform: "translateZ(45px)", transformStyle: "preserve-3d" }}
          >
            {/* Ambient Background Glow behind the Radar */}
            <div className="absolute w-36 h-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.18),transparent_70%)] pointer-events-none blur-xl" />
            
            {/* Holographic Spark Particles */}
            {[
              { id: 1, left: "25%", color: "#06b6d4", delay: 0 },
              { id: 2, left: "42%", color: "#fbbf24", delay: 1.2 },
              { id: 3, left: "68%", color: "#06b6d4", delay: 2.4 },
              { id: 4, left: "78%", color: "#fbbf24", delay: 0.6 },
            ].map((spark) => (
              <motion.span
                key={spark.id}
                initial={{ y: 20, opacity: 0, scale: 0.4 }}
                animate={{ 
                  y: [20, -60], 
                  opacity: [0, 0.9, 0],
                  scale: [0.4, 1.2, 0.3]
                }}
                transition={{
                  repeat: Infinity,
                  duration: 3.5,
                  delay: spark.delay,
                  ease: "easeInOut"
                }}
                className="absolute w-1.5 h-1.5 rounded-full pointer-events-none filter blur-[0.5px] z-0"
                style={{
                  left: spark.left,
                  backgroundColor: spark.color,
                  boxShadow: `0 0 8px ${spark.color}`
                }}
              />
            ))}

            {/* Rotating Holographic Radar SVG */}
            <div className="relative w-44 h-44 flex items-center justify-center preserve-3d">
              
              {/* Outer Cyber Ring (Rotates Counter-Clockwise) */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
                className="absolute w-full h-full"
              >
                <svg viewBox="0 0 100 100" className="w-full h-full text-cyan-500/25">
                  <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="6 8 12 8" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" />
                </svg>
              </motion.div>

              {/* Inner Concentric Rings (Rotates Clockwise) */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
                className="absolute w-[80%] h-[80%]"
              >
                <svg viewBox="0 0 100 100" className="w-full h-full text-orange-500/30">
                  <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="30 15 10 15" />
                  <path d="M 50,2 L 50,15 M 50,85 L 50,98 M 2,50 L 15,50 M 85,50 L 98,50" stroke="currentColor" strokeWidth="1" />
                </svg>
              </motion.div>

              {/* Sweeping Radar Scanner Line */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
                className="absolute w-[90%] h-[90%] flex items-center justify-center"
              >
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <defs>
                    <radialGradient id="radarSweep" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                      <stop offset="80%" stopColor="#06b6d4" stopOpacity="0.1" />
                      <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                    </radialGradient>
                  </defs>
                  {/* Sweep sector */}
                  <path d="M 50,50 L 50,5 A 45,45 0 0,1 85,25 Z" fill="url(#radarSweep)" />
                  {/* Leading sweeping line */}
                  <line x1="50" y1="50" x2="50" y2="5" stroke="#06b6d4" strokeWidth="1.5" className="shadow-[0_0_8px_#06b6d4]" />
                </svg>
              </motion.div>

              {/* Central Glowing Smart Hub Shield Icon */}
              <motion.div 
                animate={{ 
                  scale: [1, 1.06, 1],
                  opacity: [0.85, 1, 0.85]
                }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="absolute w-14 h-14 bg-slate-950/90 rounded-full border border-cyan-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.45)] backdrop-blur-md"
              >
                {/* 3D Wireframe Cube/Hexagon SVG inside core */}
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-cyan-400">
                  <path 
                    d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="1.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className="animate-pulse"
                  />
                </svg>
              </motion.div>

              {/* Small Glowing Target Node Pins (representing parked cars/slots detected by radar) */}
              <div className="absolute inset-0">
                {/* Slot 1 Target */}
                <motion.div 
                  animate={{ opacity: [0.2, 1, 0.2] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
                  className="absolute w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] top-[24%] left-[28%]"
                />
                {/* Slot 2 Target */}
                <motion.div 
                  animate={{ opacity: [1, 0.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
                  className="absolute w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4] bottom-[30%] right-[22%]"
                />
                {/* Slot 3 Target */}
                <motion.div 
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ repeat: Infinity, duration: 1.8, delay: 0.8 }}
                  className="absolute w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_6px_#f97316] top-[40%] right-[32%]"
                />
              </div>

            </div>
          </div>
          
          <div className="mt-4 space-y-4 relative z-10" style={{ transform: "translateZ(25px)" }}>
            {promoPoints.map((p, idx) => (
              <motion.div 
                key={p.title} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + idx * 0.08 }}
                className="bg-white/10 border border-white/10 p-4 rounded-2xl backdrop-blur-sm shadow-lg"
              >
                <h4 className="font-black text-xs uppercase tracking-wider font-mono text-orange-100">{p.title}</h4>
                <p className="text-xs mt-1.5 opacity-90 leading-relaxed font-semibold">{p.text}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right Input Form Column */}
        <div className="p-8 flex flex-col justify-center bg-white/[0.08] backdrop-blur-2xl border-l border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] relative">
          {(localNotice || notice)?.message ? (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-5 rounded-xl border p-3.5 text-xs font-black uppercase tracking-wider font-mono backdrop-blur-md flex items-center gap-2.5 ${
                (localNotice || notice).type === 'success' 
                  ? 'border-emerald-500/25 bg-emerald-950/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                  : 'border-rose-500/25 bg-rose-950/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
              }`}
            >
              <AlertCircle size={14} className="shrink-0" />
              {(localNotice || notice).message}
            </motion.div>
          ) : null}

          {mode === 'forgot-password' ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div className="space-y-2 mb-4">
                <h3 className="text-sm font-bold text-foreground">Nhập email để khôi phục mật khẩu</h3>
                <p className="text-xs text-slate-400">
                  Chúng tôi sẽ gửi link đặt lại mật khẩu đến email của bạn.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
                  Email
                </label>
                <input 
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  className="block w-full rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm h-11 px-4 transition-all duration-300 outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] input-scan-focus"
                  placeholder="user@pbms.vn"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    onModeChange('login');
                    setForgotEmail('');
                    setLocalNotice(null);
                  }}
                  className="flex-1 h-11 rounded-xl border border-white/10 text-white font-black text-xs uppercase tracking-wider hover:bg-white/10 transition-all"
                >
                  Quay lại
                </button>
                <motion.button 
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:shadow-[0_0_25px_rgba(249,115,22,0.45)] disabled:opacity-50 transition-all"
                >
                  {isLoading ? 'Đang gửi...' : 'Gửi link đặt lại'}
                </motion.button>
              </div>
            </form>
          ) : mode === 'reset-password' ? (
            <form onSubmit={handleResetPassword} className="space-y-4">
              {/* Hidden email field: helps browser associate the new password with the right account */}
              <input type="hidden" autoComplete="username" value={forgotEmail || ''} />
              <div className="space-y-2 mb-4">
                <h3 className="text-sm font-bold text-foreground">Nhập mật khẩu mới</h3>
                <p className="text-xs text-slate-400">
                  Mật khẩu phải có ít nhất 6 ký tự.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
                  Mật khẩu mới
                </label>
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={resetPasswordForm.newPassword}
                    onChange={(e) => setResetPasswordForm(s => ({ ...s, newPassword: e.target.value }))}
                    required
                    className="block w-full rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm h-11 pl-4 pr-11 transition-all duration-300 outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] input-scan-focus"
                    placeholder="Ít nhất 6 ký tự"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
                  Xác nhận mật khẩu
                </label>
                <div className="relative">
                  <input 
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={resetPasswordForm.confirmPassword}
                    onChange={(e) => setResetPasswordForm(s => ({ ...s, confirmPassword: e.target.value }))}
                    required
                    className="block w-full rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm h-11 pl-4 pr-11 transition-all duration-300 outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] input-scan-focus"
                    placeholder="Nhập lại mật khẩu"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    onModeChange('login');
                    setResetPasswordForm({ newPassword: '', confirmPassword: '' });
                    setResetToken(null);
                    setLocalNotice(null);
                  }}
                  className="flex-1 h-11 rounded-xl border border-white/10 text-white font-black text-xs uppercase tracking-wider hover:bg-white/10 transition-all"
                >
                  Hủy
                </button>
                <motion.button 
                  type="submit"
                  disabled={isLoading}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.96 }}
                  className="flex-1 h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:shadow-[0_0_25px_rgba(249,115,22,0.45)] disabled:opacity-50 transition-all"
                >
                  {isLoading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
                </motion.button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Họ và tên</label>
                  <input 
                    name="fullName" 
                    value={form.fullName} 
                    onChange={handleChange} 
                    required
                    className="block w-full rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm h-11 px-4 transition-all duration-300 outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] input-scan-focus"
                    placeholder="Nguyễn Văn A" 
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Số điện thoại</label>
                  <input 
                    name="phone" 
                    value={form.phone} 
                    onChange={handleChange} 
                    required
                    className="block w-full rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm h-11 px-4 transition-all duration-300 outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] input-scan-focus"
                    placeholder="0901234567" 
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5 relative">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Email</label>
              {/* Hidden input to hold username for browser password manager association */}
              <input 
                type="text" 
                name="username" 
                autoComplete="username" 
                value={form.email} 
                readOnly 
                tabIndex={-1}
                aria-hidden="true"
                style={{ position: 'absolute', opacity: 0, height: 0, width: 0, zIndex: -1, pointerEvents: 'none' }}
              />
              <input 
                ref={emailInputRef}
                name="email" 
                value={form.email} 
                onChange={handleChange} 
                type="email" 
                required 
                autoComplete="one-time-code"
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setShowDropdown(false)}
                className="block w-full rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm h-11 px-4 transition-all duration-300 outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] input-scan-focus"
                placeholder="user@pbms.vn" 
              />

              {/* Custom Cyberpunk Saved Accounts Dropdown */}
              {showDropdown && savedAccounts.length > 0 && (
                <div 
                  ref={dropdownRef}
                  className="absolute left-0 right-0 top-[68px] z-50 rounded-xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-md overflow-hidden py-1.5 animate-fadeIn"
                >
                  <div className="px-3.5 py-1.5 border-b border-white/5 text-[9px] font-mono text-slate-500 tracking-wider uppercase font-black">
                    Tài khoản đã lưu
                  </div>
                  {savedAccounts.map((acc) => (
                    <div
                      key={acc.email}
                      onMouseDown={(e) => handleSelectAccount(e, acc)}
                      className="flex items-center justify-between px-3.5 py-2.5 hover:bg-slate-900 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer group"
                    >
                      <span className="font-medium tracking-wide truncate max-w-[85%]">{acc.email}</span>
                      <button
                        type="button"
                        onMouseDown={(e) => deleteSavedAccount(e, acc.email)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200"
                        title="Xóa tài khoản này"
                      >
                        <X size={12} className="stroke-[3]" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Mật khẩu</label>
              <div className="relative">
                <input 
                  ref={passwordInputRef}
                  name="password" 
                  value={form.password} 
                  onChange={handleChange} 
                  type={showPassword ? "text" : "password"} 
                  required 
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  className="block w-full rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm h-11 pl-4 pr-11 transition-all duration-300 outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] input-scan-focus"
                  placeholder="Ít nhất 6 ký tự" 
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {mode === 'login' && (
              <div className="flex justify-end">
                <button 
                  type="button"
                  onClick={() => onModeChange('forgot-password')}
                  className="text-xs font-semibold text-slate-400 hover:text-orange-400 transition-colors"
                >
                  Quên mật khẩu?
                </button>
              </div>
            )}

            {mode === 'register' && (
              <div className="space-y-1.5 animate-fadeIn">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Xác nhận mật khẩu</label>
                <div className="relative">
                  <input 
                    name="confirmPassword" 
                    value={form.confirmPassword} 
                    onChange={handleChange} 
                    type={showConfirmPassword ? "text" : "password"} 
                    required 
                    className="block w-full rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm h-11 pl-4 pr-11 transition-all duration-300 outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] input-scan-focus"
                    placeholder="Nhập lại mật khẩu" 
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4 pt-3">
              <motion.button
                type="submit"
                disabled={isLoading}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.96 }}
                className="w-full h-11 rounded-xl text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:shadow-[0_0_25px_rgba(249,115,22,0.45)] disabled:opacity-50"
              >
                {isLoading
                  ? 'Đang xử lý...'
                  : mode === 'login'
                  ? 'Đăng nhập'
                  : 'Tạo tài khoản'}
              </motion.button>
              
              <div className="text-center">
                <button 
                  type="button" 
                  onClick={() => onModeChange(mode === 'login' ? 'register' : 'login')} 
                  className="text-xs font-bold text-slate-400 hover:text-orange-400 underline transition-colors"
                >
                  {mode === 'login' ? 'Tạo tài khoản mới' : 'Đã có tài khoản? Đăng nhập'}
                </button>
              </div>

              {mode === 'login' && (
                <div className="mt-2 space-y-4 animate-fadeIn">
                  {/* Divider */}
                  <div className="flex items-center my-3">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="px-3 text-[9px] font-mono text-slate-500 tracking-widest uppercase font-black">
                      Hoặc đăng nhập bằng
                    </span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  {/* Social Buttons */}
                  <div className="flex justify-center gap-3.5">
                    {/* Google */}
                    <button
                      type="button"
                      onClick={() => alert('Đăng nhập bằng Google đang được xử lý...')}
                      className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 transition-all flex items-center justify-center hover:scale-105 active:scale-95 shadow-md group"
                    >
                      <svg className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
                        <path
                          fill="#EA4335"
                          d="M12 5.04c1.67 0 3.2.58 4.4 1.71l3.29-3.29C17.72 1.58 14.99 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.89 3.02C6.22 7.74 8.89 5.04 12 5.04z"
                        />
                        <path
                          fill="#4285F4"
                          d="M23.45 12.3c0-.82-.07-1.6-.22-2.3H12v4.35h6.42c-.28 1.48-1.12 2.74-2.38 3.58v2.98h3.84c2.25-2.07 3.57-5.12 3.57-8.61z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.28 14.78a6.99 6.99 0 0 1 0-4.35L1.39 7.41a11.96 11.96 0 0 0 0 10.37l3.89-3z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c3.24 0 5.95-1.08 7.93-2.91l-3.84-2.98c-1.07.72-2.45 1.15-4.09 1.15-3.11 0-5.78-2.7-6.72-5.54L1.39 15.7A11.94 11.94 0 0 0 12 23z"
                        />
                      </svg>
                    </button>

                    {/* Facebook */}
                    <button
                      type="button"
                      onClick={() => alert('Đăng nhập bằng Facebook đang được xử lý...')}
                      className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 transition-all flex items-center justify-center hover:scale-105 active:scale-95 shadow-md group"
                    >
                      <svg className="w-5 h-5 text-[#1877F2] fill-[#1877F2] group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </button>

                    {/* GitHub */}
                    <button
                      type="button"
                      onClick={() => alert('Đăng nhập bằng GitHub đang được xử lý...')}
                      className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 transition-all flex items-center justify-center hover:scale-105 active:scale-95 shadow-md group"
                    >
                      <svg className="w-5 h-5 text-white fill-white group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
                        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.162 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                      </svg>
                    </button>

                    {/* LinkedIn */}
                    <button
                      type="button"
                      onClick={() => alert('Đăng nhập bằng LinkedIn đang được xử lý...')}
                      className="w-11 h-11 rounded-2xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/20 transition-all flex items-center justify-center hover:scale-105 active:scale-95 shadow-md group"
                    >
                      <svg className="w-5 h-5 text-[#0A66C2] fill-[#0A66C2] group-hover:scale-110 transition-transform duration-200" viewBox="0 0 24 24">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
          )}
        </div>
      </motion.div>

      {/* Modal thông báo (quên/đặt lại mật khẩu) */}
      {modal ? (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 backdrop-blur-md px-4"
          onClick={closeModal}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6 text-center shadow-2xl"
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-3.5 top-3.5 rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
              aria-label="Đóng"
            >
              <X size={16} />
            </button>

            <div
              className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${
                modal.type === 'success'
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-rose-500/15 text-rose-400'
              }`}
            >
              {modal.type === 'success' ? (
                <CheckCircle2 size={30} className="stroke-[2.2]" />
              ) : (
                <AlertCircle size={30} className="stroke-[2.2]" />
              )}
            </div>

            <h3 className="text-base font-black tracking-tight text-white">{modal.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{modal.message}</p>

            <button
              type="button"
              onClick={closeModal}
              className={`mt-5 h-11 w-full rounded-xl font-black text-xs uppercase tracking-wider transition-all ${
                modal.type === 'success'
                  ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 hover:shadow-[0_0_25px_rgba(249,115,22,0.45)]'
                  : 'border border-white/10 text-white hover:bg-slate-800'
              }`}
            >
              Đã hiểu
            </button>
          </motion.div>
        </div>
      ) : null}
    </main>
  );
}
