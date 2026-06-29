import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';
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
  History,
  MapPinned,
  Plus,
  ScanLine,
  ShieldCheck,
  Ticket,
  Star,
  Wallet,
  User,
  ChevronDown,
  LogOut,
  X,
  Mail,
  PhoneCall,
} from 'lucide-react';
import type { LegacyModule } from '../data/mainFlow';
import { notificationApi } from '@/services/notificationApi';
import back1 from '@/assets/back1.webp';
import homeBg from '@/assets/back3.png';
import footerBg from '@/assets/footer.png';
import carGarage from '@/assets/white_car_garage.png';

interface HomePageProps {
  modules: LegacyModule[];
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onViewProfile: () => void;
  onViewReservationHistory: () => void;
  onAction: (module: LegacyModule) => void;
  user?: { fullName?: string; email?: string; phone?: string; role?: string; licensePlates?: Array<{ plateNumber: string; vehicleType: 'car' | 'motorcycle' }> } | null;
  onLogout?: () => void;
}

const navigationLinks = [
  { label: 'Home', href: '#top' },
  { label: 'About', href: '#hero-intro' },
  { label: 'Solutions', href: '#giai-phap' },
  { label: 'Services', href: '#dich-vu' },
  { label: 'Contact', href: '#lien-he' },
];

const moduleIcons: Record<string, LucideIcon> = {
  auth: ShieldCheck,
  profile: CheckCircle2,
  wallet: Wallet,
  buildings: Building2,
  packages: Ticket,
  reservations: CalendarClock,
  sessions: ScanLine,
  payments: CreditCard,
  notifications: BellRing,
  feedback: Star,
};

const heroHighlights = [
  { value: '24/7', label: 'Smart operations & 24/7 continuous support' },
  { value: '99%', label: 'Real-time slot occupancy data accuracy' },
  { value: '100%', label: 'Secure & convenient cashless payments' },
];

const benefits = [
  {
    icon: Clock3,
    title: 'Real-time Entry/Exit Monitoring',
    description: 'Track vehicle entries/exits, individual slot status, and parking sessions on the operator panel in real time.',
  },
  {
    icon: BarChart3,
    title: 'Transparent Revenue Reporting',
    description: 'Consolidated transactions, shift revenue, and occupancy rates — giving management data to make decisions.',
  },
  {
    icon: CarFront,
    title: 'Reservations, Subscriptions & Wallet',
    description: 'Pre-book spots, buy monthly packages, pay via e-wallet, and look up parking logs — all under a single account.',
  },
];

// ─── HotSpot: interactive "+" pin on the car photo ───────────────────────────
function HotSpot({ title, desc, style, delay = 0 }: {
  title: string;
  desc: string;
  style: React.CSSProperties;
  delay?: number;
}) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 200, damping: 15 }}
      className="absolute z-20"
      style={style}
    >
      {/* Ripple ring */}
      <span className="absolute inset-0 rounded-full animate-ping bg-cyan-400/30 pointer-events-none" />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative w-8 h-8 rounded-full bg-white/10 border-2 border-cyan-400 backdrop-blur-sm flex items-center justify-center text-cyan-300 hover:bg-cyan-500/30 hover:scale-110 transition-all duration-200 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
        aria-label={title}
      >
        <Plus size={14} strokeWidth={2.5} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.9 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-52 bg-slate-950/95 border border-cyan-500/20 rounded-2xl p-3 backdrop-blur-xl shadow-2xl pointer-events-none"
          >
            <p className="text-[11px] font-black text-cyan-300 mb-1">{title}</p>
            <p className="text-[10px] text-slate-400 leading-relaxed">{desc}</p>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-950 border-r border-b border-cyan-500/20 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const CARD_THEMES = {
  cyan: {
    borderGradient: 'linear-gradient(270deg, #ffffff, #94a3b8, #ffffff)', // Pure White, Silver, Pure White
    glow: 'rgba(255,255,255,0.15), rgba(148,163,184,0.05)',
    glowColor: 'rgba(255,255,255,0.1)',
    boxShadowHover: '0 12px 30px rgba(255, 255, 255, 0.15), 0 0 20px rgba(255, 255, 255, 0.08), inset 0 0 10px rgba(255, 255, 255, 0.1)',
    boxShadowActive: '0 0 15px rgba(255, 255, 255, 0.1)',
    iconBg: 'bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.05)]',
    iconBgHover: 'bg-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.25)] scale-110',
    buttonBg: 'btn-sand btn-sand-cyan border border-white/10 bg-white/[0.03] backdrop-blur-sm transition-all font-black',
    buttonHoverGlow: '0 0 12px rgba(255,255,255,0.25)',
    sheenGradient: 'linear-gradient(115deg, transparent 35%, rgba(255, 255, 255, 0.05) 45%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.05) 55%, transparent 65%)',
    particleColors: ['#ffffff', '#cbd5e1', '#e2e8f0', '#94a3b8']
  },
  orange: {
    borderGradient: 'linear-gradient(270deg, #94a3b8, #475569, #94a3b8)', // Silver, Slate, Silver
    glow: 'rgba(148,163,184,0.15), rgba(71,85,105,0.05)',
    glowColor: 'rgba(148,163,184,0.1)',
    boxShadowHover: '0 12px 30px rgba(148, 163, 184, 0.15), 0 0 20px rgba(71, 85, 105, 0.08), inset 0 0 10px rgba(148, 163, 184, 0.1)',
    boxShadowActive: '0 0 15px rgba(148, 163, 184, 0.1)',
    iconBg: 'bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.05)]',
    iconBgHover: 'bg-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.25)] scale-110',
    buttonBg: 'btn-sand btn-sand-orange border border-white/10 bg-white/[0.03] backdrop-blur-sm transition-all font-black',
    buttonHoverGlow: '0 0 12px rgba(148,163,184,0.25)',
    sheenGradient: 'linear-gradient(115deg, transparent 35%, rgba(148, 163, 184, 0.05) 45%, rgba(255, 255, 255, 0.15) 50%, rgba(148, 163, 184, 0.05) 55%, transparent 65%)',
    particleColors: ['#ffffff', '#cbd5e1', '#e2e8f0', '#94a3b8']
  }
};

function ModuleCard({
  module,
  index,
  onViewProfile,
  onAction,
  colorTheme = 'orange'
}: {
  module: any;
  index: number;
  onViewProfile: () => void;
  onAction: (module: any) => void;
  colorTheme?: 'orange' | 'cyan';
}) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = moduleIcons[module.id] || CarFront;

  // Generate unique particles for each card instance on hover
  const particles = useMemo(() => {
    const themeColors = CARD_THEMES[colorTheme].particleColors;
    return Array.from({ length: 22 }).map((_, i) => {
      const type = ['star', 'diamond', 'circle'][Math.floor(Math.random() * 3)];
      return {
        id: i,
        type,
        size: type === 'star' ? Math.random() * 6 + 3.5 : Math.random() * 3.5 + 1.5,
        delay: Math.random() * 1.5,
        duration: Math.random() * 1.6 + 1.4, // 1.4s to 3.0s
        startX: Math.random() * 90 + 5, // 5% to 95%
        drift: Math.random() * 40 - 20, // -20% to 20% drift
        color: themeColors[Math.floor(Math.random() * themeColors.length)],
      };
    });
  }, [colorTheme]);

  return (
    <motion.article
      key={module.id}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={module.available ? {
        scale: 1.03,
        y: -4,
        boxShadow: CARD_THEMES[colorTheme].boxShadowHover,
      } : { scale: 1.01 }}
      className={`rounded-2xl p-[1px] relative overflow-hidden transition-all duration-300 ${module.available
        ? isHovered
          ? colorTheme === 'cyan' ? 'shadow-[0_0_25px_rgba(6,182,212,0.2)]' : 'shadow-[0_0_25px_rgba(249,115,22,0.2)]'
          : 'bg-white/10'
        : 'bg-white/5 opacity-75'
        }`}
    >
      {/* The moving gradient border layer (only visible on hover for available modules) */}
      {module.available && (
        <motion.div
          animate={{
            backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
          }}
          transition={{
            duration: isHovered ? 4 : 8, // Slower, elegant loop when idle; faster on hover
            repeat: Infinity,
            ease: "linear"
          }}
          style={{
            position: 'absolute',
            inset: 0,
            background: CARD_THEMES[colorTheme].borderGradient,
            backgroundSize: '400% 400%',
            opacity: isHovered ? 0.85 : 0.15,
            borderRadius: '16px',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Main Inner Card Content */}
      <div className={`p-5 rounded-[15px] backdrop-blur-md flex flex-col justify-between h-[228px] w-full relative z-10 overflow-hidden ${module.available
        ? 'bg-gradient-to-b from-slate-900/90 to-slate-950/95'
        : 'bg-slate-900/10'
        }`}>
        {/* Luxurious Ambient Background Glow */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${CARD_THEMES[colorTheme].glow}, transparent 65%)`,
            opacity: isHovered && module.available ? 1 : 0
          }}
        />

        {/* Premium Diagonal Sheen sweep reflection */}
        <motion.div
          initial={{ x: '-100%', y: '-100%', rotate: -35 }}
          animate={isHovered && module.available ? { x: '200%', y: '200%' } : { x: '-100%', y: '-100%' }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            repeatDelay: 2.5,
            ease: "easeInOut"
          }}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '250%',
            background: CARD_THEMES[colorTheme].sheenGradient,
            pointerEvents: 'none',
            zIndex: 5,
          }}
        />

        {/* Glittering Sparkles Falling Effect */}
        {isHovered && module.available && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[15px] z-10">
            {particles.map((p) => {
              const clipPath = p.type === 'star'
                ? 'polygon(50% 0%, 63% 37%, 100% 50%, 63% 63%, 50% 100%, 37% 63%, 0% 50%, 37% 37%)'
                : p.type === 'diamond'
                  ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
                  : undefined;
              return (
                <motion.div
                  key={p.id}
                  initial={{
                    opacity: 0,
                    x: `${p.startX}%`,
                    y: -10,
                    scale: 0,
                    rotate: 0
                  }}
                  animate={{
                    opacity: [0, 1, 0.7, 1, 0.4, 0],
                    x: [`${p.startX}%`, `${p.startX + p.drift / 2}%`, `${p.startX + p.drift}%`],
                    y: 240,
                    scale: [0, 1.4, 0.8, 1.3, 0.6, 0],
                    rotate: [0, 180, 360, 540, 720]
                  }}
                  transition={{
                    duration: p.duration,
                    repeat: Infinity,
                    delay: p.delay,
                    ease: "linear"
                  }}
                  style={{
                    position: 'absolute',
                    width: p.size,
                    height: p.size,
                    backgroundColor: p.color,
                    borderRadius: p.type === 'circle' ? '50%' : undefined,
                    clipPath,
                    filter: `drop-shadow(0 0 3px ${p.color})`,
                    boxShadow: p.type === 'circle' ? `0 0 6px ${p.color}` : undefined,
                  }}
                />
              );
            })}
          </div>
        )}

        <div className="relative z-20">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg transition-all duration-300 ${module.available
              ? isHovered
                ? CARD_THEMES[colorTheme].iconBgHover
                : CARD_THEMES[colorTheme].iconBg
              : 'bg-slate-800 text-slate-500'
              }`}>
              <Icon size={20} className="transition-transform duration-300" />
            </div>
            <div>
              <h3 className="font-black text-xs text-white tracking-tight uppercase">{module.title}</h3>
              <span className={`text-[8px] font-black uppercase tracking-wider font-mono px-2 py-0.5 rounded ${module.available ? 'border border-white/25 bg-white/15 text-white' : 'bg-slate-800 text-slate-500'
                }`}>
                {module.available ? 'AVAILABLE' : 'ROADMAPPED'}
              </span>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400 leading-relaxed font-semibold">{module.description}</p>

        </div>

        <div className="mt-4 relative z-20">
          <motion.button
            whileHover={module.available ? { scale: 1.02, boxShadow: CARD_THEMES[colorTheme].buttonHoverGlow } : {}}
            whileTap={module.available ? { scale: 0.98 } : {}}
            className={`w-full py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors duration-200 ${module.available
              ? CARD_THEMES[colorTheme].buttonBg
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
              }`}
            onClick={() => { if (module.id === 'profile') return onViewProfile(); onAction(module); }}
            disabled={!module.available}
          >
            <span className="relative z-10 flex items-center justify-center gap-1.5 w-full">
              {module.available ? module.actionLabel : 'Sắp ra mắt'} <ArrowRight size={12} />
            </span>
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}


export default function HomePage({ modules, onOpenAuth, onViewProfile, onViewReservationHistory, onAction, user, onLogout }: HomePageProps) {
  const hasMissingInfo = Boolean(
    user &&
    user.role === 'user' &&
    (!user.phone || user.phone.trim() === '' || !user.licensePlates || user.licensePlates.length === 0)
  );

  const productModules = useMemo(() => modules.filter((m) => m.available && !(m.id === 'auth' && user)), [modules, user]);
  const serviceModules = useMemo(() => modules.filter((m) => !m.available), [modules]);
  const [showPlateBanner, setShowPlateBanner] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Số thông báo chưa đọc — hiện badge trên nút tài khoản (chỉ khi đã đăng nhập là user).
  const [unreadNotif, setUnreadNotif] = useState(0);
  useEffect(() => {
    if (!user || user.role !== 'user') return;
    notificationApi
      .list()
      .then((res) => {
        const d = (res as { data?: { unread?: number } })?.data;
        setUnreadNotif(d?.unread ?? 0);
      })
      .catch(() => undefined);
  }, [user]);


  const heroButtonText = useMemo(() => {
    if (!user) return 'Login Now';
    if (user.role === 'admin') return 'Admin Dashboard';
    if (user.role === 'manager') return 'Manager Dashboard';
    if (user.role === 'staff') return 'Staff Portal';
    return 'Experience Platform';
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
    <main id="top" className="min-h-screen text-slate-100 font-sans selection:bg-cyan-500 selection:text-white relative isolate">

      {/* Background — fixed so they never cause scroll issues */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 bg-[#0d1a1a]" aria-hidden="true">
        {/* Dark teal abstract background */}
        <div
          className="absolute inset-0 opacity-[0.70] bg-cover bg-center pointer-events-none"
          style={{ backgroundImage: `url(${homeBg})` }}
        />
        {/* Radial dark gradient overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(13,26,26,0.1)_0%,rgba(13,26,26,0.60)_100%)] pointer-events-none" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[55%] rounded-full bg-[radial-gradient(circle_at_center,hsla(180,70%,30%,0.12),transparent_55%)] blur-3xl" />
        <div className="absolute top-[35%] right-[-15%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle_at_center,hsla(195,80%,25%,0.08),transparent_55%)] blur-3xl" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle_at_center,hsla(170,60%,20%,0.06),transparent_50%)] blur-3xl" />
      </div>


      {/* Cyber Header Navigation */}
      <header className={`sticky top-0 z-40 transition-all duration-500 border-b ${scrolled
        ? 'bg-slate-950/85 backdrop-blur-xl border-cyan-500/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8),0_1px_0_0_rgba(6,182,212,0.15)] py-2.5'
        : 'bg-transparent border-transparent py-4'
        }`}>
        {/* Top edge glowing gradient border */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-600 via-cyan-400 to-purple-600 opacity-60 pointer-events-none" />

        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between">
          <a href="#top" aria-label="PBMS Trang chủ" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 grid place-items-center shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(6,182,212,0.5)] group-hover:rotate-6">
              <span className="w-2.5 h-2.5 bg-slate-950 rounded-full" />
            </div>
            <div>
              <strong className="block text-lg font-black tracking-tight bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent group-hover:brightness-110 transition-all duration-300">PBMS Parking</strong>
              <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500 font-extrabold block">Cloud Management</span>
            </div>
          </a>

          <nav className="hidden md:flex gap-8">
            {navigationLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-bold text-slate-400 hover:text-white relative py-1.5 transition-colors duration-300 group"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-600 to-cyan-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-5">
            <div className="text-right hidden sm:block group cursor-pointer">
              <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500 font-black block">Support 24/7</span>
              <strong className="text-xs font-black text-slate-300 group-hover:text-cyan-400 transition-colors duration-300">1900 636 447</strong>
            </div>

            {user ? (
              <div className="relative animate-fadeIn" ref={menuRef}>
                <button
                  type="button"
                  aria-expanded={menuOpen}
                  onClick={() => setMenuOpen((v) => !v)}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-slate-900/80 backdrop-blur-sm border border-white/5 hover:border-cyan-500/30 text-white transition-all duration-300 shadow-lg hover:shadow-cyan-500/5"
                >
                  <div className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                    <User size={10} className="text-cyan-400" />
                  </div>
                  <span className="text-xs font-extrabold tracking-tight">{user.fullName ?? user.email}</span>
                  <ChevronDown size={12} className="text-slate-400 transition-transform duration-300" style={{ transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                </button>

                {unreadNotif > 0 && (
                  <span className="absolute -top-1 -left-1 z-30 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-black text-white shadow-[0_0_8px_rgba(244,63,94,0.6)]">
                    {unreadNotif > 9 ? '9+' : unreadNotif}
                  </span>
                )}

                {hasMissingInfo && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 z-30 pointer-events-none">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-600 text-[8px] font-mono font-black text-white items-center justify-center animate-bounce shadow-[0_0_8px_rgba(225,29,72,0.6)]">
                      1
                    </span>
                  </span>
                )}

                <AnimatePresence>
                  {menuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute right-0 mt-2 w-52 bg-slate-950/95 border border-white/10 rounded-2xl shadow-2xl py-2 backdrop-blur-xl z-50 overflow-hidden"
                    >
                      <button
                        className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-between"
                        onClick={() => { setMenuOpen(false); onViewProfile(); }}
                      >
                        <span className="flex items-center"><User size={12} className="inline-block mr-2" /> My Profile</span>
                        {hasMissingInfo && (
                          <span className="flex h-2 w-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_6px_#f43f5e]" />
                        )}
                      </button>
                      <a
                        href="/notifications"
                        onClick={() => setMenuOpen(false)}
                        className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-slate-300 hover:text-white flex items-center justify-between"
                      >
                        <span className="flex items-center"><BellRing size={12} className="mr-2" /> Notifications</span>
                        {unreadNotif > 0 && (
                          <span className="rounded-full bg-rose-500 px-1.5 text-[9px] font-bold text-white">
                            {unreadNotif > 9 ? '9+' : unreadNotif}
                          </span>
                        )}
                      </a>
                      <button
                        className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-slate-300 hover:text-white"
                        onClick={() => { setMenuOpen(false); onViewWallet(); }}
                      >
                        <Wallet size={12} className="inline-block mr-2" /> E-Wallet
                      </button>
                      <button
                        className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-slate-300 hover:text-white"
                        onClick={() => { setMenuOpen(false); onViewReservationHistory(); }}
                      >
                        <History size={12} className="inline-block mr-2" /> Booking History
                      </button>
                      <a
                        href="/parking-history"
                        className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-slate-300 hover:text-white flex items-center"
                        onClick={() => setMenuOpen(false)}
                      >
                        <MapPinned size={12} className="inline-block mr-2" /> Parking History
                      </a>
                      <a
                        href="/long-term-subscriptions"
                        className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-slate-300 hover:text-white flex items-center"
                        onClick={() => setMenuOpen(false)}
                      >
                        <Ticket size={12} className="inline-block mr-2" /> Subscriptions
                      </a>
                      <button className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-rose-400 hover:text-rose-300 border-t border-white/5 mt-1" onClick={onLogout}>
                        <LogOut size={12} className="inline-block mr-2" /> Logout
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button
                onClick={() => onOpenAuth('login')}
                whileHover={{ scale: 1.05, boxShadow: '0 0 15px rgba(59,130,246,0.45)' }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] font-black text-xs uppercase tracking-wider transition-all duration-300"
              >
                Login
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
                    Your account has no license plate registered — automatic check-in/out is disabled.
                  </p>
                </div>
                <a
                  href="/profile"
                  className="flex-shrink-0 px-3 py-1 rounded-lg bg-amber-500/20 border border-amber-500/30 text-amber-300 font-black text-[10px] uppercase tracking-wider hover:bg-amber-500/30 transition-all duration-200 whitespace-nowrap"
                >
                  Update Now
                </a>
                <button
                  type="button"
                  onClick={() => setShowPlateBanner(false)}
                  className="flex-shrink-0 p-1 rounded-lg text-amber-500/50 hover:text-amber-300 hover:bg-amber-500/10 transition-all duration-200"
                  aria-label="Close notification"
                >
                  <X size={13} className="stroke-[3]" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════════
          SPLIT SCREEN HERO — Trái: Text | Phải: Ảnh xe + Hotspots
      ══════════════════════════════════════════════════════════════════ */}
      <section id="hero-intro" className="relative w-full min-h-[calc(100vh-64px)] flex flex-col md:flex-row overflow-hidden">

        {/* LEFT DARK COLUMN */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative z-10 flex flex-col justify-center px-8 md:px-14 py-16 md:py-0 w-full md:w-[40%] bg-[#060a11]/95 backdrop-blur-sm"
        >
          {/* Subtle vertical line accent */}
          <div className="absolute right-0 top-[15%] bottom-[15%] w-[1px] bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent hidden md:block" />

          {/* System label */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400 font-mono">PARKING LOT MANAGEMENT SYSTEM</span>
          </div>

          {/* Giant headline */}
          <h1 className="text-[2.6rem] md:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight text-white uppercase">
            PBMS<sup className="text-cyan-400 text-2xl align-super">©</sup>
            <br />
            <span className="bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent">INTELLIGENT</span>
            <br />
            <span className="text-slate-300 text-3xl md:text-4xl font-extrabold">PARKING SYSTEM</span>
          </h1>

          <p className="mt-5 text-[13px] text-slate-400 leading-relaxed max-w-sm font-medium">
            Digitize your entire parking operations — QR & AI camera check-in/out, pre-booking, long-term subscriptions, and real-time revenue reports.
          </p>

          {/* Stats row */}
          <div className="mt-8 flex gap-6">
            {heroHighlights.map((item) => (
              <div key={item.label} className="flex flex-col">
                <strong className="text-2xl font-black font-mono bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{item.value}</strong>
                <span className="text-[9px] text-slate-500 font-semibold mt-0.5 leading-tight max-w-[80px]">{item.label}</span>
              </div>
            ))}
          </div>

          {/* Social icons row */}
          <div className="mt-8 flex items-center gap-3">
            {[
              { href: '#', label: 'Instagram', path: 'M12 2.163c3.204 0 3.584.012 4.85.07 1.17.054 1.97.24 2.43.403a4.9 4.9 0 0 1 1.772 1.153 4.9 4.9 0 0 1 1.153 1.772c.163.46.35 1.26.403 2.43.058 1.265.07 1.645.07 4.85s-.012 3.584-.07 4.85c-.054 1.17-.24 1.97-.403 2.43a4.9 4.9 0 0 1-1.153 1.772 4.9 4.9 0 0 1-1.772 1.153c-.46.163-1.26.35-2.43.403-1.265.058-1.645.07-4.85.07s-3.584-.012-4.85-.07c-1.17-.054-1.97-.24-2.43-.403a4.9 4.9 0 0 1-1.772-1.153 4.9 4.9 0 0 1-1.153-1.772c-.163-.46-.35-1.26-.403-2.43C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.85c.054-1.17.24-1.97.403-2.43A4.9 4.9 0 0 1 3.79 2.948a4.9 4.9 0 0 1 1.772-1.153c.46-.163 1.26-.35 2.43-.403C8.416 2.175 8.796 2.163 12 2.163zm0 1.802c-3.145 0-3.504.012-4.73.069-1.143.052-1.764.24-2.177.399a3.07 3.07 0 0 0-1.14.742 3.07 3.07 0 0 0-.742 1.14c-.159.413-.347 1.034-.399 2.177-.057 1.226-.069 1.585-.069 4.73s.012 3.504.069 4.73c.052 1.143.24 1.764.399 2.177.193.497.452.918.742 1.14.222.29.643.549 1.14.742.413.159 1.034.347 2.177.399 1.226.057 1.585.069 4.73.069s3.504-.012 4.73-.069c1.143-.052 1.764-.24 2.177-.399a3.07 3.07 0 0 0 1.14-.742 3.07 3.07 0 0 0 .742-1.14c.159-.413.347-1.034.399-2.177.057-1.226.069-1.585.069-4.73s-.012-3.504-.069-4.73c-.052-1.143-.24-1.764-.399-2.177a3.07 3.07 0 0 0-.742-1.14 3.07 3.07 0 0 0-1.14-.742c-.413-.159-1.034-.347-2.177-.399-1.226-.057-1.585-.069-4.73-.069zm0 3.063a5.135 5.135 0 1 1 0 10.27 5.135 5.135 0 0 1 0-10.27zm0 1.802a3.333 3.333 0 1 0 0 6.666 3.333 3.333 0 0 0 0-6.666zm5.338-3.205a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z' },
              { href: '#', label: 'LinkedIn', path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z' },
              { href: '#', label: 'Dribbble', path: 'M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4.01-.814zm-9.78-2.96c.25-.437 3.207-5.44 8.54-7.155.033-.01.066-.02.097-.02-.24-.375-.48-.753-.84-1.13C9.845 10.787 4.74 10.6 4.298 10.6h-.308c0 2.137.767 4.1 2.035 5.65zm-2.093-7.737c.52 0 5.461.135 9.617-2.924A43.997 43.997 0 0 0 11.963.388 11.977 11.977 0 0 0 1.902 6.67zM14.17.438c.13.14 2.165 2.264 3.856 5.38-4.87 1.29-9.16 1.27-9.65 1.265A11.987 11.987 0 0 1 14.17.438z' },
            ].map((s) => (
              <a
                key={s.label}
                href={s.href}
                aria-label={s.label}
                className="w-8 h-8 rounded-lg border border-white/10 bg-white/[0.03] flex items-center justify-center text-slate-500 hover:text-cyan-400 hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all duration-200"
              >
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-wrap gap-3">
            {user ? (
              <motion.a
                href={user.role === 'admin' ? '/admin/dashboard' : user.role === 'manager' ? '/manager/dashboard' : user.role === 'staff' ? '/staff' : '/reservations'}
                whileHover={{ scale: 1.04, boxShadow: '0 0 25px rgba(6,182,212,0.4)' }}
                whileTap={{ scale: 0.97 }}
                className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-[11px] uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.25)] inline-flex items-center gap-2 transition-all duration-300"
              >
                {heroButtonText} <ArrowRight size={14} />
              </motion.a>
            ) : (
              <>
                <motion.a
                  href="/auth/login"
                  whileHover={{ scale: 1.04, boxShadow: '0 0 25px rgba(6,182,212,0.4)' }}
                  whileTap={{ scale: 0.97 }}
                  className="px-7 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-[11px] uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.25)] inline-flex items-center gap-2 transition-all duration-300"
                >
                  Login Now <ArrowRight size={14} />
                </motion.a>
                <motion.a
                  href="/auth/register"
                  whileHover={{ scale: 1.04, borderColor: 'rgba(6,182,212,0.3)' }}
                  whileTap={{ scale: 0.97 }}
                  className="px-7 py-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-slate-300 font-bold text-[11px] uppercase tracking-wider hover:bg-white/[0.06] transition-all duration-300"
                >
                  Register Account
                </motion.a>
              </>
            )}
          </div>

          {/* Bottom info strip */}
          <div className="mt-10 pt-6 border-t border-white/[0.06] flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Simple Timing & Easily Payment System</span>
          </div>
        </motion.div>

        {/* RIGHT PHOTO COLUMN */}
        <div className="relative w-full md:w-[60%] min-h-[55vw] md:min-h-0 overflow-hidden">
          {/* Car photo */}
          <motion.img
            src={carGarage}
            alt="Car parked in a concrete garage"
            initial={{ scale: 1.08, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          {/* Gradient overlay — left edge blends into dark column */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#060a11] via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060a11]/60 via-transparent to-transparent pointer-events-none" />

          {/* ── HOTSPOTS ── */}
          <HotSpot
            style={{ top: '30%', left: '38%' }}
            title="24/7 Monitoring"
            desc="AI cameras automatically recognize license plates and capture snapshots at entry/exit."
            delay={0.4}
          />
          <HotSpot
            style={{ top: '62%', left: '20%' }}
            title="2D/3D Slot Maps"
            desc="Real-time updates of vacant/occupied slot statuses."
            delay={0.6}
          />
          <HotSpot
            style={{ top: '22%', left: '68%' }}
            title="Subscriptions & E-Wallet"
            desc="Subscribe to packages, top-up wallets, and checkout in seconds."
            delay={0.8}
          />

          {/* Bottom-right info strip */}
          <div className="absolute bottom-6 right-6 text-right">
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/60">Simple Timing And</p>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/60">Easily Payment System</p>
          </div>

          {/* Slider nav buttons */}
          <div className="absolute bottom-6 right-32 flex items-center gap-2">
            <button type="button" className="w-8 h-8 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 18l-6-6 6-6" /></svg>
            </button>
            <button type="button" className="w-8 h-8 rounded-full border border-white/20 bg-white/5 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all">
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
            </button>
          </div>
        </div>
      </section>

      {/* ═══ BENEFITS SECTION ═══ */}
      <section id="giai-phap" className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="glass-premium glow-border-pulse p-8 rounded-3xl relative overflow-hidden shadow-2xl">
            <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_70%)] pointer-events-none blur-2xl" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">PBMS SYSTEM</span>
            <h2 className="text-2xl md:text-3xl font-black mt-2 text-white">Comprehensive Parking Operation Solution</h2>
            <p className="mt-3 text-sm text-slate-400 font-semibold leading-relaxed max-w-3xl">
              PBMS digitizes the entire parking operations workflow — from entry/exit checkpoints and floor layout management to pre-booking reservations and subscriptions. Designed for building managers and end-users.
            </p>
            <div className="mt-6 grid md:grid-cols-3 gap-4">
              {benefits.map((benefit) => {
                const Icon = benefit.icon;
                return (
                  <div key={benefit.title} className="flex gap-4 p-4 rounded-2xl border border-white/5 bg-slate-950/40 hover:border-white/20 transition-all duration-300">
                    <div className="p-2 h-fit rounded-lg bg-white/10 text-white"><Icon size={16} /></div>
                    <div>
                      <h4 className="text-xs font-black text-white">{benefit.title}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 font-semibold leading-relaxed">{benefit.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Core Solutions Modules */}
      <section id="dich-vu" className="py-20 relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">Core Modules</span>
              <h2 className="text-2xl md:text-3xl font-black mt-2 text-white">Platform Capabilities</h2>
              <p className="text-sm text-slate-400 font-semibold mt-2">Role-based modules serving the right operator or user at the right time.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {productModules.map((module, index) => (
              <ModuleCard
                key={module.id}
                module={module}
                index={index}
                onViewProfile={onViewProfile}
                onAction={onAction}
                colorTheme={module.id === 'profile' || module.id === 'packages' ? 'cyan' : 'orange'}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Services Roadmap Section */}
      <section id="lo-trinh" className="py-20 relative z-10 bg-slate-950/40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">Development Roadmap</span>
            <h2 className="text-2xl md:text-3xl font-black mt-2 text-cyan-400">Upcoming Features</h2>
            <p className="text-sm text-slate-400 font-semibold mt-2">Features currently in development to expand capabilities and enhance convenience.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {serviceModules.map((module, index) => {
              const Icon = moduleIcons[module.id] || Ticket;
              return (
                <motion.article
                  key={module.id}
                  initial={{ opacity: 0, scale: 0.98 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.1 }}
                  className="p-5 rounded-2xl border border-white/5 bg-slate-900/20 backdrop-blur-md flex flex-col justify-between min-h-[140px] hover:border-white/20 hover:shadow-[0_0_20px_rgba(255,255,255,0.06)] transition-all duration-300"
                >
                  <div className="flex gap-4">
                    <div className="p-3 h-fit rounded-xl bg-white/10 border border-white/15 text-white">
                      <Icon size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-black text-sm text-white tracking-tight">{module.title}</h3>
                        <span className="text-[8px] font-black uppercase font-mono tracking-wider border border-white/25 bg-white/15 text-white px-1.5 py-0.5 rounded">NEXT PHASE</span>
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

      {/* Premium CTA Banner */}
      <PremiumCTABanner user={user} onViewProfile={onViewProfile} />

      {/* Premium Cyber Footer */}
      <PremiumFooter user={user} onViewProfile={onViewProfile} navigationLinks={navigationLinks} />
    </main>
  );
}

// ==========================================
// PREMIUM FOOTER & CTA BANNER COMPONENTS WITH 3D TILT
// ==========================================

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

function TiltCard({ children, className = '', glowColor = 'rgba(249,115,22,0.12)' }: TiltCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(y, [0, 1], [8, -8]), { stiffness: 200, damping: 25 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-8, 8]), { stiffness: 200, damping: 25 });

  // Shine reflection position
  const shineX = useTransform(x, [0, 1], ['-30%', '130%']);
  const shineY = useTransform(y, [0, 1], ['-30%', '130%']);

  // Cursor glow background
  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);

  // Auto floating 3D animation when not hovered
  useEffect(() => {
    if (isHovered) return;

    // We animate x and y around the center (0.5, 0.5) in a smooth oscillation loop
    const controlsX = animate(x, [0.35, 0.65, 0.35], {
      duration: 6,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut"
    });

    const controlsY = animate(y, [0.65, 0.35, 0.65], {
      duration: 7,
      repeat: Infinity,
      repeatType: "reverse",
      ease: "easeInOut"
    });

    return () => {
      controlsX.stop();
      controlsY.stop();
    };
  }, [isHovered, x, y]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    setIsHovered(true);
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    x.set(mouseX / width);
    y.set(mouseY / height);

    glowX.set(mouseX);
    glowY.set(mouseY);
  }

  function handleMouseLeave() {
    setIsHovered(false);
    x.set(0.5);
    y.set(0.5);
  }

  const borderBg = useTransform(
    [glowX, glowY],
    ([gx, gy]) => `radial-gradient(280px circle at ${gx}px ${gy}px, rgba(249,115,22,0.35), transparent 70%)`
  );

  return (
    <motion.div
      onMouseEnter={() => setIsHovered(true)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      className={`relative p-[1px] rounded-3xl overflow-hidden transition-all duration-300 ${className}`}
    >
      {/* Cursor-following border glow background */}
      <motion.div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: borderBg,
        }}
      />

      {/* Card Content body */}
      <div
        className="h-full w-full rounded-[23px] bg-slate-950/85 backdrop-blur-xl p-8 md:p-12 relative overflow-hidden"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Interactive cursor center glow */}
        <motion.div
          className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[23px]"
          style={{
            background: useTransform(
              [glowX, glowY],
              ([gx, gy]) => `radial-gradient(350px circle at ${gx}px ${gy}px, ${glowColor}, transparent 80%)`
            ),
          }}
        />

        {/* Shine overlay */}
        <motion.div
          className="pointer-events-none absolute w-[150%] h-[150%] -left-1/4 -top-1/4 opacity-0 group-hover:opacity-20 transition-opacity duration-300 mix-blend-overlay bg-[radial-gradient(circle,rgba(255,255,255,0.45)_0%,transparent_60%)]"
          style={{
            x: shineX,
            y: shineY,
          }}
        />

        <div style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }} className="relative z-10 h-full w-full">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

interface PremiumCTABannerProps {
  user: any;
  onViewProfile: () => void;
}

function PremiumCTABanner({ user, onViewProfile }: PremiumCTABannerProps) {
  return (
    <section className="py-20 relative z-10 overflow-hidden bg-slate-950">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-cyan-500/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4">
        <TiltCard className="group p-8 md:p-12 border border-white/5 hover:border-white/10 shadow-2xl bg-black relative">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none rounded-3xl" />

          <div className="relative flex flex-col md:flex-row items-center justify-between gap-8 z-20">
            <div className="text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] font-black uppercase tracking-wider font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Start a New Experience
              </div>
              <h2 className="text-2xl md:text-3xl font-black mt-4 text-white tracking-tight leading-tight">
                Deploy an end-to-end <br className="hidden md:inline" />
                <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-cyan-400 bg-clip-text text-transparent">intelligent parking lot</span>
              </h2>
              <p className="text-xs text-slate-400 mt-2 max-w-md leading-relaxed font-semibold">
                Optimal management, instant reservations, and real-time monitoring. Maximize the value of your building's parking lot.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto shrink-0 justify-center">
              <motion.a
                whileHover={{ scale: 1.03, boxShadow: '0 0 25px rgba(6,182,212,0.4)' }}
                whileTap={{ scale: 0.98 }}
                href="/auth/register"
                className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-xs uppercase tracking-wider text-center shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all duration-200"
              >
                Create Account
              </motion.a>

              {user ? (
                <motion.button
                  whileHover={{ scale: 1.03, borderColor: 'rgba(6,182,212,0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onViewProfile}
                  className="px-8 py-4 rounded-xl bg-slate-950/80 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 text-center backdrop-blur-sm"
                >
                  View Your Profile
                </motion.button>
              ) : (
                <motion.a
                  whileHover={{ scale: 1.03, borderColor: 'rgba(6,182,212,0.4)' }}
                  whileTap={{ scale: 0.98 }}
                  href="/auth/login"
                  className="px-8 py-4 rounded-xl bg-slate-950/80 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 inline-flex items-center justify-center backdrop-blur-sm"
                >
                  Portal Login
                </motion.a>
              )}
            </div>
          </div>
        </TiltCard>
      </div>
    </section>
  );
}

interface PremiumFooterProps {
  user: any;
  onViewProfile: () => void;
  navigationLinks: Array<{ href: string; label: string }>;
}

function PremiumFooter({ user, onViewProfile, navigationLinks }: PremiumFooterProps) {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
    setTimeout(() => {
      setSubscribed(false);
      setEmail('');
    }, 3000);
  }

  return (
    <footer id="lien-he" className="bg-slate-950 py-20 relative z-10 overflow-hidden">
      {/* Footer background image */}
      <div
        className="absolute inset-0 opacity-[0.35] bg-cover bg-center pointer-events-none"
        style={{ backgroundImage: `url(${footerBg})` }}
      />
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[400px] bg-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4">
        <TiltCard className="group border border-white/5 shadow-2xl relative">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none rounded-[23px]" />

          <div className="relative z-20 grid md:grid-cols-3 gap-10 lg:gap-16 pb-12" style={{ transformStyle: 'preserve-3d' }}>
            {/* Col 1: Platform Info */}
            <div className="space-y-6" style={{ transform: 'translateZ(30px)' }}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  <span className="text-white font-black text-base font-mono">P</span>
                </div>
                <div>
                  <p className="text-sm font-black text-white tracking-wider font-mono leading-none">PBMS PLATFORM</p>
                  <span className="text-[9px] text-slate-500 font-mono tracking-widest uppercase">Cloud Management</span>
                </div>
              </div>

              <p className="text-xs leading-relaxed text-slate-400 font-medium">
                Leading intelligent parking lot management system for buildings and large enterprise organizations in Vietnam.
              </p>

              {/* Realtime Status Monitor */}
              <div className="inline-flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 backdrop-blur-sm shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[10px] font-bold text-emerald-400 font-mono uppercase tracking-wider">
                  All systems operational
                </span>
              </div>

              <div className="text-[10px] text-slate-500 font-mono space-y-1">
                <p>UI Version V2.5.0 - Cyberpunk Glassmorphism</p>
                <p>Automatic real-time sync system</p>
              </div>
            </div>

            {/* Col 2: Navigation Links */}
            <div className="space-y-6" style={{ transform: 'translateZ(30px)', transformStyle: 'preserve-3d' }}>
              <h4 className="font-black text-white text-xs uppercase tracking-wider font-mono border-l-2 border-cyan-500 pl-3">
                Quick Links
              </h4>
              <nav className="flex flex-col gap-3">
                {navigationLinks.map((link) => (
                  <motion.a
                    key={link.href}
                    href={link.href}
                    whileHover={{ x: 6, color: '#22d3ee' }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    className="text-xs font-semibold text-slate-400 flex items-center gap-1.5 transition-colors"
                  >
                    <span className="w-1 h-1 rounded-full bg-white/20 group-hover:bg-cyan-500 transition-colors" />
                    {link.label}
                  </motion.a>
                ))}
              </nav>
            </div>

            {/* Col 3: Portal & Newsletter */}
            <div className="space-y-6" style={{ transform: 'translateZ(35px)', transformStyle: 'preserve-3d' }}>
              <h4 className="font-black text-white text-xs uppercase tracking-wider font-mono border-l-2 border-cyan-500 pl-3">
                Portal Access
              </h4>

              <div className="flex flex-wrap gap-2.5">
                <motion.a
                  whileHover={{ scale: 1.03, backgroundColor: '#06b6d4', color: '#020617', boxShadow: '0 0 15px rgba(6,182,212,0.3)' }}
                  whileTap={{ scale: 0.98 }}
                  href="/auth/login"
                  className="px-4 py-2.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-xl text-xs font-black uppercase transition-all"
                >
                  Login
                </motion.a>

                <motion.a
                  whileHover={{ scale: 1.03, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.02)' }}
                  whileTap={{ scale: 0.98 }}
                  href="/auth/register"
                  className="px-4 py-2.5 bg-slate-900 border border-white/5 text-slate-300 rounded-xl text-xs font-bold uppercase transition-all"
                >
                  Register
                </motion.a>

                {user ? (
                  <motion.button
                    whileHover={{ scale: 1.03, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.02)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onViewProfile}
                    className="px-4 py-2.5 bg-slate-900 border border-white/5 text-slate-300 rounded-xl text-xs font-bold uppercase transition-all"
                  >
                    Profile
                  </motion.button>
                ) : null}
              </div>

              <div className="pt-2">
                <p className="text-[10px] font-black text-white uppercase tracking-wider font-mono mb-2">Subscribe to Newsletter</p>
                <form onSubmit={handleSubscribe} className="relative flex items-center">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email..."
                    className="w-full px-4 py-3 bg-slate-900/60 border border-white/5 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/35 transition-all"
                    required
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 p-2 bg-orange-500 text-slate-950 hover:bg-orange-400 rounded-lg transition-colors flex items-center justify-center"
                  >
                    <ArrowRight size={14} strokeWidth={2.5} />
                  </button>
                </form>
                <AnimatePresence>
                  {subscribed && (
                    <motion.p
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-[10px] text-emerald-400 font-bold mt-1.5 font-mono"
                    >
                      ✓ Successfully subscribed to newsletter!
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Bottom footer bar */}
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6" style={{ transform: 'translateZ(25px)' }}>
            <small className="text-[10px] font-bold text-slate-500 font-mono tracking-tight">
              © {new Date().getFullYear()} PBMS PARKING. PREMIUM INTERFACE DESIGN UNDER CENTRALIZED PROTOCOL.
            </small>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {[
                { icon: Building2, label: 'Website', href: '#' },
                { icon: Mail, label: 'Contact', href: 'mailto:support@pbms.com' },
                { icon: PhoneCall, label: 'Hotline', href: 'tel:1900636447' }
              ].map((social, index) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={index}
                    href={social.href}
                    whileHover={{ scale: 1.1, y: -2, backgroundColor: 'rgba(6,182,212,0.1)', color: '#22d3ee', borderColor: 'rgba(6,182,212,0.2)' }}
                    className="w-8 h-8 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-center text-slate-500 hover:text-cyan-400 transition-colors"
                    title={social.label}
                  >
                    <Icon size={14} />
                  </motion.a>
                );
              })}
            </div>
          </div>
        </TiltCard>
      </div>
    </footer>
  );
}
