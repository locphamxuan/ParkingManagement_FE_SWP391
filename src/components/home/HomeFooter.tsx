import { useEffect, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';
import { ArrowRight, Building2, Mail, PhoneCall } from 'lucide-react';
import footerBg from '@/assets/footer.png';
import { navigationLinks } from './homeNavigation.constants';

type HomeUser = { fullName?: string; email?: string; role?: string } | null | undefined;

// ── TiltCard ─────────────────────────────────────────────────────────────────

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
}

export function TiltCard({ children, className = '', glowColor = 'rgba(249,115,22,0.12)' }: TiltCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useSpring(useTransform(y, [0, 1], [8, -8]), { stiffness: 200, damping: 25 });
  const rotateY = useSpring(useTransform(x, [0, 1], [-8, 8]), { stiffness: 200, damping: 25 });

  const shineX = useTransform(x, [0, 1], ['-30%', '130%']);
  const shineY = useTransform(y, [0, 1], ['-30%', '130%']);

  const glowX = useMotionValue(0);
  const glowY = useMotionValue(0);

  useEffect(() => {
    if (isHovered) return;

    const controlsX = animate(x, [0.35, 0.65, 0.35], {
      duration: 6,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    });

    const controlsY = animate(y, [0.65, 0.35, 0.65], {
      duration: 7,
      repeat: Infinity,
      repeatType: 'reverse',
      ease: 'easeInOut',
    });

    return () => {
      controlsX.stop();
      controlsY.stop();
    };
  }, [isHovered, x, y]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    setIsHovered(true);
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
    glowX.set(e.clientX - rect.left);
    glowY.set(e.clientY - rect.top);
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
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      className={`relative p-[1px] rounded-3xl overflow-hidden transition-all duration-300 ${className}`}
    >
      <motion.div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: borderBg }}
      />

      <div
        className="h-full w-full rounded-[23px] bg-slate-950/85 backdrop-blur-xl p-8 md:p-12 relative overflow-hidden"
        style={{ transformStyle: 'preserve-3d' }}
      >
        <motion.div
          className="pointer-events-none absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[23px]"
          style={{
            background: useTransform(
              [glowX, glowY],
              ([gx, gy]) => `radial-gradient(350px circle at ${gx}px ${gy}px, ${glowColor}, transparent 80%)`
            ),
          }}
        />

        <motion.div
          className="pointer-events-none absolute w-[150%] h-[150%] -left-1/4 -top-1/4 opacity-0 group-hover:opacity-20 transition-opacity duration-300 mix-blend-overlay bg-[radial-gradient(circle,rgba(255,255,255,0.45)_0%,transparent_60%)]"
          style={{ x: shineX, y: shineY }}
        />

        <div style={{ transform: 'translateZ(20px)', transformStyle: 'preserve-3d' }} className="relative z-10 h-full w-full">
          {children}
        </div>
      </div>
    </motion.div>
  );
}

// ── PremiumCTABanner ──────────────────────────────────────────────────────────

interface PremiumCTABannerProps {
  user: HomeUser;
  onViewProfile: () => void;
}

export function PremiumCTABanner({ user, onViewProfile }: PremiumCTABannerProps) {
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
                Optimal management, long-term packages, and real-time monitoring. Maximize the value of your building's parking lot.
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

// ── PremiumFooter ─────────────────────────────────────────────────────────────

interface PremiumFooterProps {
  user: HomeUser;
  onViewProfile: () => void;
}

export function PremiumFooter({ user, onViewProfile }: PremiumFooterProps) {
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

              <div className="inline-flex items-center gap-2.5 px-3 py-2 rounded-xl bg-emerald-500/5 border border-emerald-500/10 backdrop-blur-sm shadow-[0_0_15px_rgba(16,185,129,0.05)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
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

                {user && (
                  <motion.button
                    whileHover={{ scale: 1.03, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.02)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onViewProfile}
                    className="px-4 py-2.5 bg-slate-900 border border-white/5 text-slate-300 rounded-xl text-xs font-bold uppercase transition-all"
                  >
                    Profile
                  </motion.button>
                )}
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

            <div className="flex items-center gap-3">
              {[
                { icon: Building2, label: 'Website', href: '#' },
                { icon: Mail, label: 'Contact', href: 'mailto:support@pbms.com' },
                { icon: PhoneCall, label: 'Hotline', href: 'tel:1900636447' },
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
