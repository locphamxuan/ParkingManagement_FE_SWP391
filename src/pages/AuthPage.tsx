import { useMemo, useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { Home, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useSearchParams } from 'react-router-dom';
import { CartoonCar3D } from '@/components/map/CartoonCar3D';
import { forgotPassword, resetPassword } from '@/services/authService';

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

export default function AuthPage({ mode, notice, onModeChange, onBackHome, onSubmit, isLoading }: AuthPageProps) {
  const [searchParams] = useSearchParams();
  const [localNotice, setLocalNotice] = useState<{ message?: string; type?: string } | null>(null);
  const [form, setForm] = useState(initialForm);
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetPasswordForm, setResetPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [savedAccounts, setSavedAccounts] = useState<{ email: string; password?: string }[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [lockTimeLeft, setLockTimeLeft] = useState<number>(0);
  const [resetToken, setResetToken] = useState<string | null>(null);
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

  useEffect(() => {
    const checkLock = () => {
      const email = form.email.trim().toLowerCase();
      if (!email) {
        setLockTimeLeft(0);
        return;
      }
      const lockUntil = Number(localStorage.getItem(`pbms.lockUntil.${email}`) || '0');
      const timeLeft = Math.ceil((lockUntil - Date.now()) / 1000);
      
      if (timeLeft > 0) {
        setLockTimeLeft(timeLeft);
      } else {
        setLockTimeLeft(0);
      }
    };


    checkLock();
    const interval = setInterval(checkLock, 1000);
    return () => clearInterval(interval);
  }, [form.email]);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const emailInputRef = useRef<HTMLInputElement | null>(null);

  // Load saved accounts from localStorage on mount and initialize phones
  useEffect(() => {
    try {
      const stored = localStorage.getItem('pbms_saved_accounts');
      if (stored) {
        setSavedAccounts(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to load saved accounts', e);
    }

    // Initialize mock database if not already present
    if (!localStorage.getItem('pbms.allRegisteredPhones')) {
      localStorage.setItem('pbms.allRegisteredPhones', JSON.stringify(["0911111111", "0922222222"]));
    }
  }, []);

  // Save account helper
  const saveAccount = (email: string, password?: string) => {
    if (!email) return;
    try {
      const stored = localStorage.getItem('pbms_saved_accounts');
      let current: { email: string; password?: string }[] = stored ? JSON.parse(stored) : [];
      
      // Remove duplicates
      current = current.filter(acc => acc.email !== email);
      
      // Add to start of list
      current.unshift({ email, password });
      
      // Keep max 5 saved accounts
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

  const handleSelectAccount = (e: React.MouseEvent, acc: { email: string; password?: string }) => {
    e.preventDefault(); // Keep focus or let it blur, but keeping focus on input with filled details is great!
    setForm(s => ({
      ...s,
      email: acc.email,
      password: acc.password || '',
    }));
    setShowDropdown(false);
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

      const allRegisteredPhonesRaw = localStorage.getItem('pbms.allRegisteredPhones');
      const allRegisteredPhones: string[] = allRegisteredPhonesRaw
        ? JSON.parse(allRegisteredPhonesRaw)
        : ['0911111111', '0922222222'];

      if (allRegisteredPhones.includes(phoneTrimmed)) {
        setLocalNotice({
          message: 'Số điện thoại này đã được đăng ký bởi một tài khoản khác!',
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
        await onSubmit({ mode, payload });
        
        // Add new phone to simulated registry on registration success
        const updatedPhones = [...allRegisteredPhones, phoneTrimmed];
        localStorage.setItem('pbms.allRegisteredPhones', JSON.stringify(updatedPhones));
      } catch (err) {
        // Error already mapped in public auth flow hook
      }
    } else {
      const email = form.email.trim().toLowerCase();
      
      // Strict frontend-side login lock check
      const lockUntil = Number(localStorage.getItem(`pbms.lockUntil.${email}`) || '0');
      const timeLeft = Math.ceil((lockUntil - Date.now()) / 1000);
      if (timeLeft > 0) {
        setLocalNotice({
          message: `Tài khoản đang bị khóa tạm thời. Vui lòng quay lại sau ${Math.floor(timeLeft / 60)} phút ${timeLeft % 60} giây!`,
          type: 'error',
        });
        return;
      }

      const payload: Record<string, string> = {
        email: form.email.trim(),
        password: form.password,
      };

      try {
        await onSubmit({ mode, payload });
        
        // Login success: clear wrong attempts counters & lock periods
        localStorage.removeItem(`pbms.failedAttempts.${email}`);
        localStorage.removeItem(`pbms.lockUntil.${email}`);
        saveAccount(form.email.trim(), form.password);
      } catch (err) {
        // Login failure: increment fail counters & lock for 5 mins if attempts >= 5
        const attempts = Number(localStorage.getItem(`pbms.failedAttempts.${email}`) || '0') + 1;
        if (attempts >= 5) {
          localStorage.setItem(`pbms.lockUntil.${email}`, String(Date.now() + 5 * 60 * 1000));
          localStorage.removeItem(`pbms.failedAttempts.${email}`);
          setLockTimeLeft(300);
          setLocalNotice({
            message: 'Tài khoản đã bị tạm khóa 5 phút do nhập sai mật khẩu quá 5 lần!',
            type: 'error',
          });
        } else {
          localStorage.setItem(`pbms.failedAttempts.${email}`, String(attempts));
          setLocalNotice({
            message: `Mật khẩu hoặc Email không đúng. Bạn còn ${5 - attempts} lần thử trước khi bị khóa tài khoản!`,
            type: 'error',
          });
        }
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
          className="p-8 bg-gradient-to-br from-orange-600/90 via-orange-600 to-amber-600/85 text-white flex flex-col justify-between relative overflow-hidden preserve-3d"
          style={{ transformStyle: "preserve-3d" }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
          
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
        <div className="p-8 flex flex-col justify-center bg-slate-900/10 backdrop-blur-md">
          {lockTimeLeft > 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-5 rounded-xl border border-rose-500/25 bg-rose-950/30 text-rose-400 p-4 text-xs font-black uppercase tracking-wider font-mono shadow-[0_0_20px_rgba(239,68,68,0.15)] flex flex-col gap-2"
            >
              <div className="flex items-center gap-2.5">
                <AlertCircle size={16} className="shrink-0 stroke-[2.5]" />
                <span>Tài khoản đã bị tạm khóa đăng nhập</span>
              </div>
              <p className="text-[10px] text-slate-400 font-sans tracking-normal font-semibold normal-case leading-relaxed">
                Nhập sai mật khẩu quá 5 lần. Vui lòng quay lại sau: <span className="text-rose-400 font-black font-mono">{Math.floor(lockTimeLeft / 60)} phút {lockTimeLeft % 60} giây</span>.
              </p>
            </motion.div>
          ) : (localNotice || notice)?.message ? (
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
                  className="flex-1 h-11 rounded-xl border border-white/10 text-white font-black text-xs uppercase tracking-wider hover:bg-slate-900 transition-all"
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
                <input 
                  type="password"
                  value={resetPasswordForm.newPassword}
                  onChange={(e) => setResetPasswordForm(s => ({ ...s, newPassword: e.target.value }))}
                  required
                  className="block w-full rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm h-11 px-4 transition-all duration-300 outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] input-scan-focus"
                  placeholder="Ít nhất 6 ký tự"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
                  Xác nhận mật khẩu
                </label>
                <input 
                  type="password"
                  value={resetPasswordForm.confirmPassword}
                  onChange={(e) => setResetPasswordForm(s => ({ ...s, confirmPassword: e.target.value }))}
                  required
                  className="block w-full rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm h-11 px-4 transition-all duration-300 outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] input-scan-focus"
                  placeholder="Nhập lại mật khẩu"
                />
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
                  className="flex-1 h-11 rounded-xl border border-white/10 text-white font-black text-xs uppercase tracking-wider hover:bg-slate-900 transition-all"
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
              <input 
                ref={emailInputRef}
                name="email" 
                value={form.email} 
                onChange={handleChange} 
                type="email" 
                required 
                autoComplete="new-email"
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
              <input 
                name="password" 
                value={form.password} 
                onChange={handleChange} 
                type="password" 
                required 
                className="block w-full rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm h-11 px-4 transition-all duration-300 outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] input-scan-focus"
                placeholder="Ít nhất 6 ký tự" 
              />
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
                <input 
                  name="confirmPassword" 
                  value={form.confirmPassword} 
                  onChange={handleChange} 
                  type="password" 
                  required 
                  className="block w-full rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm h-11 px-4 transition-all duration-300 outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] input-scan-focus"
                  placeholder="Nhập lại mật khẩu" 
                />
              </div>
            )}

            <div className="flex flex-col gap-4 pt-3">
              <motion.button 
                type="submit" 
                disabled={isLoading || (mode === 'login' && lockTimeLeft > 0)} 
                whileHover={mode === 'login' && lockTimeLeft > 0 ? {} : { scale: 1.015 }}
                whileTap={mode === 'login' && lockTimeLeft > 0 ? {} : { scale: 0.96 }}
                className={`w-full h-11 rounded-xl text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 ${
                  mode === 'login' && lockTimeLeft > 0
                    ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 cursor-not-allowed shadow-[0_0_15px_rgba(239,68,68,0.05)]'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:shadow-[0_0_25px_rgba(249,115,22,0.45)] disabled:opacity-50'
                }`}
              >
                {isLoading 
                  ? 'Đang xử lý...' 
                  : mode === 'login' && lockTimeLeft > 0 
                  ? `Bị khóa (Thử lại sau ${Math.floor(lockTimeLeft / 60)}m ${lockTimeLeft % 60}s)` 
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
