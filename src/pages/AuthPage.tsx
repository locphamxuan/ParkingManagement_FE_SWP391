import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import { Home } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { CartoonCar3D } from '@/components/shared/CartoonCar3D';

const initialForm = {
  fullName: '',
  phone: '',
  email: '',
  password: '',
};

type AuthMode = 'login' | 'register';

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
  const [form, setForm] = useState(initialForm);

  // 3D Mouse Tracking Tilt Motion Values
  const mouseX = useMotionValue(0.5); // Range: 0 to 1
  const mouseY = useMotionValue(0.5); // Range: 0 to 1

  // Smooth springs for high-tactile response
  const springX = useSpring(mouseX, { stiffness: 120, damping: 22 });
  const springY = useSpring(mouseY, { stiffness: 120, damping: 22 });

  // Map mouse positions to rotational angles
  const rotateY = useTransform(springX, [0, 1], [-8, 8]);
  const rotateX = useTransform(springY, [0, 1], [8, -8]);

  const title = useMemo(() => (mode === 'login' ? 'Đăng nhập vào PBMS' : 'Tạo tài khoản PBMS'), [mode]);
  const description = useMemo(
    () =>
      mode === 'login'
        ? 'Đăng nhập để tiếp tục sử dụng hệ thống quản lý bãi đỗ xe, theo dõi thông tin và truy cập các chức năng cần thiết.'
        : 'Tạo tài khoản mới để bắt đầu sử dụng nền tảng quản lý bãi đỗ xe với giao diện đồng nhất cùng trang chủ.',
    [mode]
  );

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload: Record<string, string> = {
      email: form.email.trim(),
      password: form.password,
      ...(mode === 'register' ? { fullName: form.fullName.trim(), phone: form.phone.trim() } : {}),
    };
    await onSubmit({ mode, payload });
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
        className="w-full max-w-4xl glass-panel-dark border border-white/5 shadow-2xl rounded-3xl overflow-hidden grid grid-cols-1 md:grid-cols-2 relative z-10"
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
          {notice?.message && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-5 rounded-xl border p-3.5 text-xs font-black uppercase tracking-wider font-mono backdrop-blur-md ${
                notice.type === 'success' 
                  ? 'border-emerald-500/25 bg-emerald-950/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                  : 'border-rose-500/25 bg-rose-950/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
              }`}
            >
              {notice.message}
            </motion.div>
          )}

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

            <div className="space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">Email</label>
              <input 
                name="email" 
                value={form.email} 
                onChange={handleChange} 
                type="email" 
                required 
                className="block w-full rounded-xl border border-white/10 bg-slate-950/60 text-white placeholder-slate-600 focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 text-sm h-11 px-4 transition-all duration-300 outline-none shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)] focus:shadow-[0_0_15px_rgba(249,115,22,0.15)] input-scan-focus"
                placeholder="user@pbms.vn" 
              />
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

            <div className="flex flex-col gap-4 pt-3">
              <motion.button 
                type="submit" 
                disabled={isLoading} 
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.96 }}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 hover:shadow-[0_0_25px_rgba(249,115,22,0.45)] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? 'Đang xử lý...' : mode === 'login' ? 'Đăng nhập' : 'Tạo tài khoản'}
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
        </div>
      </motion.div>
    </main>
  );
}
