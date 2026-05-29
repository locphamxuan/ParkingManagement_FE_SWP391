import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, useScroll } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BellRing,
  Building2,
  CalendarClock,
  CarFront,
  CheckCircle2,
  Clock3,
  CreditCard,
  Mail,
  MapPinned,
  PhoneCall,
  ScanLine,
  ShieldCheck,
  Ticket,
  Wallet,
  User,
  ChevronDown,
  LogOut,
  X,
} from 'lucide-react';
import type { LegacyModule } from '../data/mainFlow';
import { AnimatedParkingMap3D } from '@/components/shared/AnimatedParkingMap3D';

interface HomePageProps {
  modules: LegacyModule[];
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onViewProfile: () => void;
  onAction: (module: LegacyModule) => void;
  user?: { fullName?: string; email?: string; phone?: string; role?: string; licensePlates?: Array<{ plateNumber: string; vehicleType: 'car' | 'motorcycle' }> } | null;
  onLogout?: () => void;
}

const navigationLinks = [
  { label: 'Trang chủ', href: '#top' },
  { label: 'Giới thiệu', href: '#gioi-thieu' },
  { label: 'Giải pháp', href: '#giai-phap' },
  { label: 'Dịch vụ', href: '#dich-vu' },
  { label: 'Liên hệ', href: '#lien-he' },
];

const moduleIcons: Record<string, LucideIcon> = {
  auth: ShieldCheck,
  profile: CheckCircle2,
  wallet: Wallet,
  buildings: Building2,
  reservations: CalendarClock,
  sessions: ScanLine,
  payments: CreditCard,
  notifications: BellRing,
};

const heroHighlights = [
  { value: '24/7', label: 'Giám sát và hỗ trợ vận hành liên tục' },
  { value: '01', label: 'Nền tảng thống nhất cho cư dân và ban quản lý' },
  { value: '99.9%', label: 'Quy trình check-in, check-out rõ ràng' },
];

const benefits = [
  {
    icon: Clock3,
    title: 'Kiểm soát ra vào theo thời gian thực',
    description: 'Theo dõi lượt xe, trạng thái bãi và phiên gửi ngay trên một màn hình vận hành trực quan.',
  },
  {
    icon: BarChart3,
    title: 'Báo cáo doanh thu rõ ràng',
    description: 'Tập trung số liệu giao dịch, doanh thu và hiệu suất khai thác để quản lý dễ ra quyết định hơn.',
  },
  {
    icon: CarFront,
    title: 'Trải nghiệm thân thiện cho người dùng',
    description: 'Đăng nhập, theo dõi thông tin và mở rộng tính năng đặt chỗ, thanh toán, thông báo theo lộ trình.',
  },
];

// Interactive 3D Parking Building Component with Parallax Tilt Effect


export default function HomePage({ modules, onOpenAuth, onViewProfile, onAction, user, onLogout }: HomePageProps) {
  const hasMissingInfo = Boolean(
    user &&
    user.role === 'user' &&
    (!user.phone || user.phone.trim() === '' || !user.licensePlates || user.licensePlates.length === 0)
  );

  const productModules = modules.slice(0, 4);
  const serviceModules = modules.slice(4);
  const [showPlateBanner, setShowPlateBanner] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  const smoothScroll = useSpring(scrollYProgress, {
    stiffness: 50,
    damping: 15,
    restDelta: 0.001
  });

  // Stage 1 (Hero: 0% to 25%): Default isometric overview
  // Stage 2 (Đặc điểm: 25% to 60%): 180deg rotation (Z: -45 -> 135) + zoom details
  // Stage 3 (Giải pháp: 60% to 100%): Down shift and shrink (scale: 0.85)
  const rotateZ = useTransform(smoothScroll, [0, 0.25, 0.60, 1.0], [-45, -45, 135, -45]);
  const rotateX = useTransform(smoothScroll, [0, 0.25, 0.60, 1.0], [55, 55, 48, 55]);
  const scale = useTransform(smoothScroll, [0, 0.25, 0.60, 1.0], [1.0, 1.0, 1.45, 0.85]);
  const x = useTransform(smoothScroll, [0, 0.25, 0.60, 1.0], [0, 0, -40, 60]);
  const y = useTransform(smoothScroll, [0, 0.25, 0.60, 1.0], [0, 0, 20, -50]);

  const heroButtonText = useMemo(() => {
    if (!user) return 'Đăng nhập ngay';
    if (user.role === 'admin') return 'Bảng điều khiển Admin';
    if (user.role === 'manager') return 'Bảng quản trị Manager';
    if (user.role === 'staff') return 'Cổng nhân viên ca trực';
    return 'Trải nghiệm dịch vụ';
  }, [user]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const onViewWallet = () => {
    const walletModule = modules.find((module) => module.id === 'wallet');
    if (walletModule) onAction(walletModule);
  };

  return (
    <main id="top" className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-orange-500 selection:text-white relative">

      {/* Background Neon Glow Spheres — fixed so they never cause scroll issues */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[55%] rounded-full bg-[radial-gradient(circle_at_center,hsla(24,95%,53%,0.08),transparent_55%)] blur-3xl" />
        <div className="absolute top-[35%] right-[-15%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle_at_center,hsla(263,90%,51%,0.07),transparent_55%)] blur-3xl" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle_at_center,hsla(142,76%,45%,0.04),transparent_50%)] blur-3xl" />
      </div>


      {/* Cyber Header Navigation */}
      <header className="border-b border-white/5 bg-slate-950/60 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <a href="#top" aria-label="PBMS Trang chủ" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 grid place-items-center shadow-[0_0_15px_rgba(249,115,22,0.3)] transition-all group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(249,115,22,0.5)]">
              <span className="w-2.5 h-2.5 bg-slate-950 rounded-full" />
            </div>
            <div>
              <strong className="block text-lg font-black tracking-tight bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">PBMS Parking</strong>
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-extrabold">Cloud Management</span>
            </div>
          </a>

          <nav className="hidden md:flex gap-6">
            {navigationLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-slate-400 hover:text-orange-400 transition-colors duration-200"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-5">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold block">Hỗ trợ 24/7</span>
              <strong className="text-xs font-black text-slate-300">1900 636 447</strong>
            </div>

            {user ? (
              <div className="relative animate-fadeIn" ref={menuRef}>
                <button
                  type="button"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-slate-900 border border-white/10 hover:border-orange-500/30 text-white transition-all shadow-md"
                >
                  <User size={14} className="text-orange-400" />
                  <span className="text-xs font-bold">{user.fullName ?? user.email}</span>
                  <ChevronDown size={12} className="text-slate-400" />
                </button>

                {hasMissingInfo && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 z-30 pointer-events-none">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-[8px] font-mono font-black text-white items-center justify-center animate-bounce shadow-[0_0_8px_rgba(225,29,72,0.6)]">
                      1
                    </span>
                  </span>
                )}

                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-48 bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl py-2 backdrop-blur-md z-50"
                  >
                    <button
                      className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-between"
                      onClick={() => { setMenuOpen(false); onViewProfile(); }}
                    >
                      <span>Hồ sơ của tôi</span>
                      {hasMissingInfo && (
                        <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_6px_#f43f5e]" />
                      )}
                    </button>
                    <button
                      className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-slate-300 hover:text-white"
                      onClick={() => { setMenuOpen(false); onViewWallet(); }}
                    >
                      <Wallet size={12} className="inline-block mr-2" /> Ví tiền
                    </button>
                    <button className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-rose-400 hover:text-rose-300 border-t border-white/5 mt-1" onClick={onLogout}>
                      <LogOut size={12} className="inline-block mr-2" /> Đăng xuất
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <motion.button
                onClick={() => onOpenAuth('login')}
                whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(249,115,22,0.45)' }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300"
              >
                Đăng nhập
              </motion.button>
            )}

          </div>
        </div>
      </header>

      {/* Missing License Plate Warning Banner */}
      <AnimatePresence>
        {user && user.role === 'user' && (!user.licensePlates || user.licensePlates.length === 0) && showPlateBanner && (
          <motion.div
            key="plate-banner"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="sticky top-[57px] z-30 w-full"
          >
            <div className="max-w-6xl mx-auto px-4 py-2">
              <div className="flex items-center gap-3 rounded-2xl border border-amber-500/25 bg-amber-500/10 backdrop-blur-md px-4 py-2.5 shadow-lg">
                <div className="flex-shrink-0 p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
                  <CarFront size={15} />
                </div>
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <AlertTriangle size={12} className="text-amber-400 flex-shrink-0" />
                  <p className="text-[11px] font-semibold text-amber-200/90 truncate">
                    Tài khoản chưa có biển số xe — Hệ thống không thể tự động check-in/out cho bạn.
                  </p>
                </div>
                <a
                  href="/profile"
                  className="flex-shrink-0 px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 font-black text-[10px] uppercase tracking-wider hover:bg-amber-500/30 transition-all duration-200 whitespace-nowrap"
                >
                  Cập nhật ngay
                </a>
                <button
                  type="button"
                  onClick={() => setShowPlateBanner(false)}
                  className="flex-shrink-0 p-1 rounded-lg text-amber-500/50 hover:text-amber-300 hover:bg-amber-500/10 transition-all duration-200"
                  aria-label="Đóng thông báo"
                >
                  <X size={13} className="stroke-[3]" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scroll-Driven Presentation Deck Section */}
      <div ref={containerRef} className="relative w-full max-w-6xl mx-auto px-4 relative z-20">
        <div className="grid md:grid-cols-2 gap-12 items-start relative">

          {/* LEFT STORY STORY DECK COLUMN */}
          <div className="space-y-32 py-12 md:py-20 relative z-20">

            {/* Story Deck Item 1: Hero Intro */}
            <motion.section
              id="hero-intro"
              className="min-h-[70vh] flex flex-col justify-center animate-fadeIn"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 mb-4 w-fit animate-pulse">
                <span className="w-2 h-2 rounded-full bg-orange-500" />
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 font-mono">Platform Quản Trị Tương Lai</span>
              </div>

              <h1 className="text-4xl md:text-5xl font-black leading-[1.12] tracking-tight text-white">
                Nền tảng kiểm soát <br />
                <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-purple-400 bg-clip-text text-transparent">Bãi đỗ xe thông minh</span>
              </h1>
              <p className="mt-5 text-sm text-slate-400 leading-relaxed max-w-lg font-semibold">
                PBMS định nghĩa lại hoạt động vận hành tòa nhà. Giám sát ra vào thời gian thực, tự động hóa thanh toán, theo dõi công suất thông minh và cung cấp giải pháp 3D trực quan vượt trội.
              </p>
              <div className="mt-8 flex flex-wrap gap-4 items-center">
                {user ? (
                  <>
                    <motion.a
                      href={
                        user.role === 'admin'
                          ? '/admin/dashboard'
                          : user.role === 'manager'
                            ? '/manager/dashboard'
                            : user.role === 'staff'
                              ? '/staff'
                              : '/'
                      }
                      whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(249,115,22,0.45)' }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 inline-flex items-center gap-2"
                    >
                      {heroButtonText} <ArrowRight size={14} />
                    </motion.a>
                    <motion.button
                      onClick={onViewProfile}
                      whileHover={{ scale: 1.05, borderColor: 'rgba(249,115,22,0.3)' }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 rounded-xl bg-slate-900 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 hover:bg-slate-900/60 inline-flex items-center"
                    >
                      Xem hồ sơ cá nhân
                    </motion.button>
                  </>
                ) : (
                  <>
                    <motion.a
                      href="/auth/login"
                      whileHover={{ scale: 1.05, boxShadow: '0 0 25px rgba(249,115,22,0.45)' }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 inline-flex items-center gap-2"
                    >
                      Đăng nhập ngay <ArrowRight size={14} />
                    </motion.a>
                    <motion.a
                      href="/auth/register"
                      whileHover={{ scale: 1.05, borderColor: 'rgba(249,115,22,0.3)' }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 rounded-xl bg-slate-900 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 hover:bg-slate-900/60 inline-flex items-center"
                    >
                      Đăng ký tài khoản
                    </motion.a>
                  </>
                )}
              </div>
            </motion.section>

            {/* Story Deck Item 2: Giới thiệu & Quản lý tầng & slot */}
            <motion.section
              id="gioi-thieu"
              className="min-h-[70vh] flex flex-col justify-center scroll-mt-24"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              <div className="glass-premium glow-border-pulse p-8 rounded-3xl relative overflow-hidden shadow-2xl">
                <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12),transparent_70%)] pointer-events-none blur-2xl" />
                <span className="text-[10px] font-black uppercase tracking-widest text-cyan-400 font-mono">Đặc Điểm Vượt Trội</span>
                <h2 className="text-2xl md:text-3xl font-black mt-2 text-white">Quản lý tầng & slot thông minh</h2>
                <p className="mt-3 text-sm text-slate-400 font-semibold leading-relaxed">
                  Hệ thống lập bản đồ 3D thời gian thực. Giám sát chính xác từng vị trí đỗ (Slot) theo từng tầng (Floor), hiển thị trực quan trạng thái Trống/Đầy và tự động định tuyến xe thông minh.
                </p>
                <div className="mt-6 grid gap-4">
                  {benefits.map((benefit) => {
                    const Icon = benefit.icon;
                    return (
                      <div key={benefit.title} className="flex gap-4 p-4 rounded-2xl border border-white/5 bg-slate-950/40 hover:border-cyan-500/20 transition-all duration-300">
                        <div className="p-2 h-fit rounded-lg bg-cyan-500/10 text-cyan-400"><Icon size={16} /></div>
                        <div>
                          <h4 className="text-xs font-black text-white">{benefit.title}</h4>
                          <p className="text-[11px] text-slate-400 mt-1 font-semibold leading-relaxed">{benefit.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.section>

            {/* Story Deck Item 3: Check-in/Check-out & Cổng kiểm soát */}
            <motion.section
              id="check-in-gate"
              className="min-h-[70vh] flex flex-col justify-center scroll-mt-24"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
            >
              <div className="glass-premium glow-border-pulse p-8 rounded-3xl relative overflow-hidden shadow-2xl">
                <div className="absolute -left-12 -bottom-12 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.1),transparent_70%)] pointer-events-none blur-2xl" />
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 font-mono">Tự Động Hóa Check-In</span>
                <h2 className="text-2xl md:text-3xl font-black mt-2 text-white">Kiểm soát ra vào tự động 24/7</h2>
                <p className="mt-3 text-sm text-slate-400 font-semibold leading-relaxed">
                  Nhận diện biển số, quét RFID thẻ thông minh và vận hành thanh chắn cổng soát vé (Gate) hoàn toàn tự động. Đẩy nhanh thời gian check-in/out xuống dưới 2 giây, giảm thiểu ùn tắc.
                </p>

                {/* Floating highlight block */}
                <div className="mt-6 p-5 rounded-2xl border border-orange-500/20 bg-orange-500/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    <span className="text-xs font-black text-orange-400 font-mono">RFID & PLATE RECOGNITION OK</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-black">GATEWAY ACTIVE</span>
                </div>
              </div>
            </motion.section>

          </div>

          {/* RIGHT VIEWPORT VIEW DECK COLUMN (STICKY) */}
          <div className="sticky top-24 hidden md:flex h-[calc(100vh-140px)] w-full items-center justify-center overflow-visible z-10">
            <div className="relative w-full max-w-[480px] preserve-3d">
              {/* Glowing Ambient Background ring */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.05),transparent_70%)] pointer-events-none blur-3xl z-0" />

              <AnimatedParkingMap3D
                rotateX={isMobile ? undefined : rotateX}
                rotateZ={isMobile ? undefined : rotateZ}
                scale={isMobile ? undefined : scale}
                x={isMobile ? undefined : x}
                y={isMobile ? undefined : y}
              />

              {/* Floating highlight status badges overlay around the model — stacked on the left side to prevent bottom overlapping */}
              <div className="absolute -left-28 md:-left-36 lg:-left-44 top-[10%] flex flex-col gap-4 max-w-[140px] pointer-events-none z-20">
                {heroHighlights.slice(0, 1).map((item, idx) => (
                  <motion.article
                    key={item.label}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 + idx * 0.1 }}
                    className="rounded-2xl border border-white/5 bg-slate-950/80 p-3 backdrop-blur-md shadow-2xl"
                  >
                    <strong className="block text-lg font-black text-white font-mono bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">{item.value}</strong>
                    <span className="text-[9px] font-bold text-slate-400 mt-0.5 leading-relaxed block">{item.label}</span>
                  </motion.article>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Core Solutions Modules */}
      <section id="giai-phap" className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 font-mono">Tính Năng Hệ Thống</span>
              <h2 className="text-2xl md:text-3xl font-black mt-2 text-white">Các module giải pháp trọng tâm</h2>
              <p className="text-sm text-slate-400 font-semibold mt-2">Đồng bộ dữ liệu đa phân khu, phân quyền linh hoạt theo luồng người dùng.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {productModules.map((module, index) => {
              const Icon = moduleIcons[module.id] || CarFront;
              return (
                <motion.article
                  key={module.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  whileHover={module.available ? { 
                    scale: 1.03, 
                    y: -4, 
                    boxShadow: '0 0 25px rgba(249, 115, 22, 0.15)',
                    borderColor: 'rgba(249, 115, 22, 0.35)' 
                  } : { scale: 1.01 }}
                  className={`p-5 rounded-2xl border backdrop-blur-md flex flex-col justify-between h-[230px] transition-all duration-300 ${
                    module.available
                      ? 'border-white/5 bg-slate-900/40'
                      : 'border-white/5 bg-slate-900/10 opacity-75'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${module.available ? 'bg-orange-500/10 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.1)]' : 'bg-slate-800 text-slate-500'}`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <h3 className="font-black text-xs text-white tracking-tight uppercase">{module.title}</h3>
                        <span className={`text-[8px] font-black uppercase tracking-wider font-mono px-2 py-0.5 rounded ${module.available ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                          }`}>
                          {module.available ? 'AVAILABLE' : 'ROADMAPPED'}
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-400 leading-relaxed font-semibold">{module.description}</p>
                  </div>

                  <div className="mt-4">
                    <motion.button
                      whileHover={module.available ? { scale: 1.02, boxShadow: '0 0 15px rgba(249,115,22,0.3)' } : {}}
                      whileTap={module.available ? { scale: 0.98 } : {}}
                      className={`w-full py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 ${module.available
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 hover:shadow-[0_0_15px_rgba(249,115,22,0.2)] border-0'
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
                        }`}
                      onClick={() => { if (module.id === 'profile') return onViewProfile(); onAction(module); }}
                      disabled={!module.available}
                    >
                      {module.available ? module.actionLabel : 'Sắp ra mắt'} <ArrowRight size={12} />
                    </motion.button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Services Roadmap Section */}
      <section id="dich-vu" className="py-20 relative z-10 bg-slate-950/40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 font-mono">Dịch Vụ Gia Tăng</span>
            <h2 className="text-2xl md:text-3xl font-black mt-2 text-white">Mở rộng theo lộ trình vận hành</h2>
            <p className="text-sm text-slate-400 font-semibold mt-2">Đáp ứng đầy đủ sự gia tăng lưu lượng và quy mô quản lý bãi đỗ trong tương lai.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {serviceModules.map((module, index) => {
              const Icon = moduleIcons[module.id] || Ticket;
              return (
                <motion.article
                  key={module.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.1 }}
                  className="p-5 rounded-2xl border border-white/5 bg-slate-900/20 backdrop-blur-md flex flex-col justify-between min-h-[140px] hover:border-purple-500/20 hover:shadow-[0_0_20px_rgba(168,85,247,0.06)] transition-all duration-300"
                >
                  <div className="flex gap-4">
                    <div className="p-3 h-fit rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
                      <Icon size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm text-white tracking-tight">{module.title}</h3>
                        <span className="text-[8px] font-black uppercase font-mono tracking-wider bg-purple-500/10 text-purple-300 px-1.5 py-0.5 rounded">NEXT PHASE</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-400 leading-relaxed font-semibold">{module.description}</p>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Footer banner */}
      <section className="py-16 relative z-10 border-t border-white/5 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 font-mono">Bắt Đầu Trải Nghiệm</span>
            <h2 className="text-2xl font-black mt-1 text-white">Triển khai bãi đỗ xe thông minh toàn diện</h2>
          </div>
          <div className="flex gap-4">
            <a href="/auth/register" className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider hover:shadow-[0_0_20px_rgba(249,115,22,0.3)] transition-all duration-200">Tạo tài khoản</a>
            {user ? (
              <button className="px-6 py-3 rounded-xl bg-slate-900 border border-white/10 text-white font-bold text-xs uppercase tracking-wider hover:border-orange-500/25 transition-all duration-200" onClick={onViewProfile}>Xem hồ sơ</button>
            ) : (
              <a href="/auth/login" className="px-6 py-3 rounded-xl bg-slate-900 border border-white/10 text-white font-bold text-xs uppercase tracking-wider hover:border-orange-500/25 transition-all duration-200 inline-flex items-center">Đăng nhập</a>
            )}
          </div>
        </div>
      </section>

      {/* Cyber Footer */}
      <footer id="lien-he" className="bg-slate-950 border-t border-white/5 text-slate-400 py-12 relative z-10">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-10">
          <div>
            <p className="text-sm font-black text-white tracking-wider font-mono">PBMS PLATFORM</p>
            <h3 className="mt-3 text-xs leading-relaxed font-semibold">Hệ thống quản lý bãi đỗ xe chuyên nghiệp dành cho tòa nhà và tổ chức doanh nghiệp lớn.</h3>
            <p className="mt-2 text-[10px] text-slate-500 font-mono">Phiên bản UI V2.5.0 - Cyberpunk Glassmorphism</p>
          </div>

          <div>
            <h4 className="font-black text-white text-xs uppercase tracking-wider">Liên kết nhanh</h4>
            <nav className="mt-3 flex flex-col gap-2">
              {navigationLinks.map((link) => (
                <a key={link.href} href={link.href} className="text-xs hover:text-orange-400 transition-colors">{link.label}</a>
              ))}
            </nav>
          </div>

          <div>
            <h4 className="font-black text-white text-xs uppercase tracking-wider">Truy cập cổng</h4>
            <div className="mt-3 flex flex-wrap gap-2">
              <a href="/auth/login" className="px-3.5 py-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500 hover:text-slate-950 rounded-xl text-xs font-black uppercase transition-all">Đăng nhập</a>
              <a href="/auth/register" className="px-3.5 py-2 bg-slate-900 border border-white/5 text-slate-300 hover:border-white/20 rounded-xl text-xs font-bold uppercase transition-all">Đăng ký</a>
              {user ? <button onClick={onViewProfile} className="px-3.5 py-2 bg-slate-900 border border-white/5 text-slate-300 hover:border-white/20 rounded-xl text-xs font-bold uppercase transition-all">Hồ sơ</button> : null}
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-white/5 pt-6 text-center">
          <small className="text-[10px] font-bold text-slate-500 font-mono">© {new Date().getFullYear()} PBMS PARKING. THIẾT KẾ GIAO DIỆN PREMIUM DƯỚI GIAO THỨC TẬP TRUNG.</small>
        </div>
      </footer>
    </main>
  );
}
