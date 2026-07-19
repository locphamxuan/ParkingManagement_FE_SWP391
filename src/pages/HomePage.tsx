import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CarFront,
  Clock3,
  Ticket,
  X,
} from 'lucide-react';
import type { LegacyModule } from '../data/mainFlow';
import homeBg from '@/assets/back3.png';
import carGarage from '@/assets/white_car_garage.png';
import { HotSpot } from '@/components/home/HotSpot';
import { ModuleCard } from '@/components/home/ModuleCard';
import { moduleIcons } from '@/components/home/moduleCard.constants';
import { PremiumCTABanner, PremiumFooter } from '@/components/home/HomeFooter';
import { PublicHeader } from '@/components/home/PublicHeader';

interface HomePageProps {
  modules: LegacyModule[];
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onViewProfile: () => void;
  onAction: (module: LegacyModule) => void;
  user?: { fullName?: string; email?: string; phone?: string; role?: string; licensePlates?: Array<{ plateNumber: string; vehicleType: 'car' | 'motorcycle' }> } | null;
  onLogout?: () => void;
}

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
    title: 'Packages, Subscriptions & Wallet',
    description: 'Buy monthly packages, pay via e-wallet, and look up parking logs — all under a single account.',
  },
];

export default function HomePage({ modules, onViewProfile, onAction, user }: HomePageProps) {
  const productModules = useMemo(() => modules.filter((m) => m.available && !(m.id === 'auth' && user)), [modules, user]);
  const serviceModules = useMemo(() => modules.filter((m) => !m.available), [modules]);
  const [showPlateBanner, setShowPlateBanner] = useState(true);

  const heroButtonText = useMemo(() => {
    if (!user) return 'Login Now';
    if (user.role === 'admin') return 'Admin Dashboard';
    if (user.role === 'manager') return 'Manager Dashboard';
    if (user.role === 'staff') return 'Staff Portal';
    return 'Experience Platform';
  }, [user]);

  return (
    <main id="top" className="min-h-screen text-slate-100 font-sans selection:bg-cyan-500 selection:text-white relative isolate">

      {/* Background — absolute so it scrolls naturally and doesn't overlap the header */}
      <div className="absolute inset-x-0 top-0 h-[100vh] pointer-events-none overflow-hidden -z-10 bg-[#0d1a1a]" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-[0.70] bg-cover pointer-events-none"
          style={{ backgroundImage: `url(${homeBg})`, backgroundPosition: 'center 80px' }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(13,26,26,0.1)_0%,rgba(13,26,26,0.60)_100%)] pointer-events-none" />
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[55%] rounded-full bg-[radial-gradient(circle_at_center,hsla(180,70%,30%,0.12),transparent_55%)] blur-3xl" />
        <div className="absolute top-[35%] right-[-15%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle_at_center,hsla(195,80%,25%,0.08),transparent_55%)] blur-3xl" />
        <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-[radial-gradient(circle_at_center,hsla(170,60%,20%,0.06),transparent_50%)] blur-3xl" />
      </div>

      <PublicHeader />
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

      {/* ══ SPLIT SCREEN HERO ══ */}
      <section id="hero-intro" className="relative w-full min-h-[calc(100vh-64px)] flex flex-col md:flex-row overflow-hidden">

        {/* LEFT DARK COLUMN */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative z-10 flex flex-col justify-center px-8 md:px-14 py-16 md:py-0 w-full md:w-[40%] bg-[#060a11]/95 backdrop-blur-sm"
        >
          <div className="absolute right-0 top-[15%] bottom-[15%] w-[1px] bg-gradient-to-b from-transparent via-cyan-500/30 to-transparent hidden md:block" />

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-6 w-fit">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400 font-mono">PARKING LOT MANAGEMENT SYSTEM</span>
          </div>

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

          <div className="mt-8 flex gap-6">
            {heroHighlights.map((item) => (
              <div key={item.label} className="flex flex-col">
                <strong className="text-2xl font-black font-mono bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{item.value}</strong>
                <span className="text-[9px] text-slate-500 font-semibold mt-0.5 leading-tight max-w-[80px]">{item.label}</span>
              </div>
            ))}
          </div>

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

          <div className="mt-10 flex flex-wrap gap-3">
            {user ? (
              <motion.a
                href={user.role === 'admin' ? '/admin/dashboard' : user.role === 'manager' ? '/manager/dashboard' : user.role === 'staff' ? '/staff' : '/long-term-subscriptions'}
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

          <div className="mt-10 pt-6 border-t border-white/[0.06] flex items-center gap-3">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Simple Timing & Easily Payment System</span>
          </div>
        </motion.div>

        {/* RIGHT PHOTO COLUMN */}
        <div className="relative w-full md:w-[60%] min-h-[55vw] md:min-h-0 overflow-hidden">
          <motion.img
            src={carGarage}
            alt="Car parked in a concrete garage"
            initial={{ scale: 1.08, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.1, ease: 'easeOut' }}
            className="absolute inset-0 w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#060a11] via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#060a11]/60 via-transparent to-transparent pointer-events-none" />

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

          <div className="absolute bottom-6 right-6 text-right">
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/60">Simple Timing And</p>
            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-white/60">Easily Payment System</p>
          </div>

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
              PBMS digitizes the entire parking operations workflow — from entry/exit checkpoints and floor layout management to long-term packages and subscriptions. Designed for building managers and end-users.
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
      {serviceModules.length > 0 && (
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
      )}

      <PremiumCTABanner user={user} onViewProfile={onViewProfile} />

      <PremiumFooter user={user} onViewProfile={onViewProfile} />
    </main>
  );
}
