import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Building2,
  ChevronDown,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ShieldAlert,
  Ticket,
  User,
  Wallet,
  X,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { UserNotificationBell } from '@/components/layout/UserNotificationBell';
import { Logo } from '@/components/layout/Logo';

const userNavLinks = [
  { to: '/user-dashboard', label: 'Dashboard', icon: LayoutDashboard, requiresAuth: true },
  { to: '/buildings', label: 'Buildings', icon: Building2, requiresAuth: false },
  { to: '/packages/buy', label: 'Buy Package', icon: Package, requiresAuth: true },
  { to: '/long-term-subscriptions', label: 'My Packages', icon: Ticket, requiresAuth: true },
  { to: '/wallet', label: 'Wallet', icon: Wallet, requiresAuth: true },
  { to: '/parking-history', label: 'History', icon: History, requiresAuth: true },
  { to: '/report-incident', label: 'Report Issue', icon: ShieldAlert, requiresAuth: true },
];

// Layout chung cho toàn bộ trang phía user — navbar + nền thống nhất để các
// trang không phải tự dựng header/back-button riêng lẻ như trước.
export function UserLayout() {
  const navigate = useNavigate();
  const { session, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const visibleLinks = userNavLinks.filter((link) => !link.requiresAuth || Boolean(session));

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const onLogout = () => {
    setMenuOpen(false);
    logout();
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#060a11] text-slate-100 font-sans selection:bg-cyan-500 selection:text-white relative isolate">
      {/* Nền ambient tối thống nhất cho mọi trang user */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:44px_44px] opacity-70" />
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_at_center,hsla(180,70%,30%,0.10),transparent_55%)] blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-15%] w-[55%] h-[55%] rounded-full bg-[radial-gradient(circle_at_center,hsla(195,80%,25%,0.08),transparent_55%)] blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/85 backdrop-blur-xl">
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-blue-600 via-cyan-400 to-purple-600 opacity-60 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          <Link to="/" aria-label="PBMS Home" className="shrink-0">
            <Logo size={36} tagline="My Parking Space" />
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {visibleLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold transition-all duration-200 ${
                      isActive
                        ? 'bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.12)]'
                        : 'border border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                    }`
                  }
                >
                  <Icon size={13} />
                  {link.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="flex items-center gap-2.5">
            {session ? (
              <>
                <UserNotificationBell />
                <div className="relative" ref={menuRef}>
                  <button
                    type="button"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((v) => !v)}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/5 hover:border-cyan-500/30 text-white transition-all duration-300"
                  >
                    <div className="w-5 h-5 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      <User size={10} className="text-cyan-400" />
                    </div>
                    <span className="hidden md:inline text-xs font-extrabold tracking-tight max-w-[140px] truncate">
                      {session.displayName ?? session.email}
                    </span>
                    <ChevronDown size={12} className="text-slate-400 transition-transform duration-300" style={{ transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                  </button>
                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 mt-2 w-48 bg-slate-950/95 border border-white/10 rounded-2xl shadow-2xl py-2 backdrop-blur-xl z-50 overflow-hidden"
                      >
                        <Link
                          to="/profile"
                          onClick={() => setMenuOpen(false)}
                          className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-slate-300 hover:text-white flex items-center"
                        >
                          <User size={12} className="mr-2" /> My Profile
                        </Link>
                        <button
                          className="w-full text-left px-4 py-2 text-xs font-semibold hover:bg-slate-800 text-rose-400 hover:text-rose-300 border-t border-white/5 mt-1 flex items-center"
                          onClick={onLogout}
                        >
                          <LogOut size={12} className="mr-2" /> Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <Link
                to="/auth/login"
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] font-black text-xs uppercase tracking-wider"
              >
                Login
              </Link>
            )}

            <button
              type="button"
              aria-label="Toggle navigation"
              onClick={() => setMobileNavOpen((v) => !v)}
              className="lg:hidden p-2 rounded-xl border border-white/5 bg-slate-900/80 text-slate-300 hover:text-white"
            >
              {mobileNavOpen ? <X size={16} /> : <Menu size={16} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileNavOpen && (
            <motion.nav
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden border-t border-white/5 bg-slate-950/95 backdrop-blur-xl overflow-hidden"
            >
              <div className="max-w-6xl mx-auto px-4 py-3 grid grid-cols-2 gap-1.5">
                {visibleLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={() => setMobileNavOpen(false)}
                      className={({ isActive }) =>
                        `inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-xs font-bold transition-all ${
                          isActive ? 'bg-cyan-500/10 border border-cyan-500/25 text-cyan-300' : 'border border-transparent text-slate-400 hover:text-white hover:bg-white/5'
                        }`
                      }
                    >
                      <Icon size={14} />
                      {link.label}
                    </NavLink>
                  );
                })}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </header>

      <Outlet />
    </div>
  );
}
