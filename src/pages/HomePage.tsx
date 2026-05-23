import { useEffect, useRef, useState, useMemo } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import {
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
} from 'lucide-react';
import type { LegacyModule } from '../data/mainFlow';
import { AnimatedParkingMap3D } from '@/components/shared/AnimatedParkingMap3D';

interface HomePageProps {
  modules: LegacyModule[];
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onViewProfile: () => void;
  onAction: (module: LegacyModule) => void;
  user?: { fullName?: string; email?: string; phone?: string; role?: string } | null;
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
  const productModules = modules.slice(0, 4);
  const serviceModules = modules.slice(4);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

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

                {menuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-48 bg-slate-900/95 border border-white/10 rounded-xl shadow-2xl py-2 backdrop-blur-md z-50"
                  >
                    <button className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-slate-300 hover:text-white" onClick={() => { setMenuOpen(false); onViewProfile(); }}>
                      Hồ sơ của tôi
                    </button>
                    <button className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-rose-400 hover:text-rose-300 border-t border-white/5 mt-1" onClick={onLogout}>
                      <LogOut size={12} className="inline-block mr-2" /> Đăng xuất
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <a href="/auth/login" className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                Đăng nhập
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-16 md:py-20 max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 18 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 mb-4">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
            <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 font-mono">Platform Quản Trị Tương Lai</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black mt-3 leading-[1.12] tracking-tight text-white">
            Nền tảng kiểm soát <br />
            <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-purple-400 bg-clip-text text-transparent">Bãi đỗ xe thông minh</span>
          </h1>
          <p className="mt-5 text-sm text-slate-400 leading-relaxed max-w-lg font-semibold">
            PBMS định nghĩa lại hoạt động vận hành tòa nhà. Giám sát ra vào thời gian thực, tự động hóa thanh toán, theo dõi công suất thông minh và cung cấp giải pháp 3D trực quan vượt trội.
          </p>

          <div className="mt-8 flex flex-wrap gap-4 items-center">
            {user ? (
              <>
                <a 
                  href={
                    user.role === 'admin' 
                      ? '/admin/dashboard' 
                      : user.role === 'manager' 
                      ? '/manager/dashboard' 
                      : user.role === 'staff' 
                      ? '/staff' 
                      : '/'
                  } 
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] inline-flex items-center gap-2"
                >
                  {heroButtonText} <ArrowRight size={14} />
                </a>
                <button 
                  onClick={onViewProfile} 
                  className="px-6 py-3 rounded-xl bg-slate-900 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 hover:border-orange-500/30 hover:bg-slate-900/60 inline-flex items-center"
                >
                  Xem hồ sơ cá nhân
                </button>
              </>
            ) : (
              <>
                <a 
                  href="/auth/login" 
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider transition-all duration-300 hover:scale-105 hover:shadow-[0_0_25px_rgba(249,115,22,0.4)] inline-flex items-center gap-2"
                >
                  Đăng nhập ngay <ArrowRight size={14} />
                </a>
                <a 
                  href="/auth/register" 
                  className="px-6 py-3 rounded-xl bg-slate-900 border border-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all duration-300 hover:border-orange-500/30 hover:bg-slate-900/60 inline-flex items-center"
                >
                  Đăng ký tài khoản
                </a>
              </>
            )}
          </div>
        </motion.div>

        {/* 3D Interactive Model Visual */}
        <motion.aside
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 80, damping: 15, delay: 0.15 }}
          className="relative preserve-3d"
        >
          <AnimatedParkingMap3D />
          
          {/* Overlay stats indicators floating around */}
          <div className="absolute -left-6 -bottom-6 grid grid-cols-2 gap-3 max-w-[280px] pointer-events-none">
            {heroHighlights.slice(0, 2).map((item, idx) => (
              <motion.article 
                key={item.label} 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.1 }}
                className="rounded-2xl border border-white/5 bg-slate-900/80 p-3.5 backdrop-blur-md shadow-2xl"
              >
                <strong className="block text-lg font-black text-white font-mono bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-transparent">{item.value}</strong>
                <span className="text-[10px] font-bold text-slate-400 mt-0.5 leading-tight block">{item.label}</span>
              </motion.article>
            ))}
          </div>
        </motion.aside>
      </section>

      {/* Benefits Section */}
      <section id="gioi-thieu" className="py-20 relative z-10 bg-slate-950/40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-xl mx-auto mb-12">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 font-mono">Đặc Điểm Vượt Trội</span>
            <h2 className="text-2xl md:text-3xl font-black mt-2 text-white">Kiến trúc quản trị tinh chuẩn & tin cậy</h2>
            <p className="mt-3 text-sm text-slate-400 font-semibold">Tích hợp sâu các công nghệ phần cứng và đám mây để nâng cao trải nghiệm bãi đỗ xe doanh nghiệp.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.article 
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                  className="p-6 rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-md card-3d-hover group"
                >
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.1)] group-hover:scale-105 group-hover:bg-orange-500 group-hover:text-slate-950 transition-all duration-300">
                    <Icon size={20} />
                  </div>
                  <h3 className="mt-4 font-black text-white text-base tracking-tight">{benefit.title}</h3>
                  <p className="mt-2.5 text-xs text-slate-400 leading-relaxed font-semibold">{benefit.description}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

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
                  className={`p-5 rounded-2xl border backdrop-blur-md flex flex-col justify-between h-[230px] transition-all duration-300 ${
                    module.available 
                      ? 'border-white/5 bg-slate-900/40 hover:border-orange-500/20 hover:shadow-[0_0_20px_rgba(249,115,22,0.06)]' 
                      : 'border-white/5 bg-slate-900/10 opacity-75'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-lg ${module.available ? 'bg-orange-500/10 text-orange-400' : 'bg-slate-800 text-slate-500'}`}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <h3 className="font-black text-xs text-white tracking-tight uppercase">{module.title}</h3>
                        <span className={`text-[8px] font-black uppercase tracking-wider font-mono px-2 py-0.5 rounded ${
                          module.available ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'
                        }`}>
                          {module.available ? 'AVAILABLE' : 'ROADMAPPED'}
                        </span>
                      </div>
                    </div>
                    <p className="mt-3 text-xs text-slate-400 leading-relaxed font-semibold">{module.description}</p>
                  </div>
                  
                  <div className="mt-4">
                    <button
                      className={`w-full py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-1.5 ${
                        module.available 
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 hover:shadow-[0_0_15px_rgba(249,115,22,0.2)]' 
                          : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      }`}
                      onClick={() => { if (module.id === 'profile') return onViewProfile(); onAction(module); }}
                      disabled={!module.available}
                    >
                      {module.available ? module.actionLabel : 'Sắp ra mắt'} <ArrowRight size={12} />
                    </button>
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
