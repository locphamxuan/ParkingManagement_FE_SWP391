/* Hằng số dùng chung cho ModuleCard — tách khỏi component để react-refresh
   hoạt động đúng (file component chỉ export component). */
import type { LucideIcon } from 'lucide-react';
import {
  BellRing,
  Building2,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  ScanLine,
  ShieldCheck,
  Star,
  Ticket,
  Wallet,
} from 'lucide-react';

export const moduleIcons: Record<string, LucideIcon> = {
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

export const CARD_THEMES = {
  cyan: {
    borderGradient: 'linear-gradient(270deg, #ffffff, #94a3b8, #ffffff)',
    glow: 'rgba(255,255,255,0.15), rgba(148,163,184,0.05)',
    glowColor: 'rgba(255,255,255,0.1)',
    boxShadowHover: '0 12px 30px rgba(255, 255, 255, 0.15), 0 0 20px rgba(255, 255, 255, 0.08), inset 0 0 10px rgba(255, 255, 255, 0.1)',
    boxShadowActive: '0 0 15px rgba(255, 255, 255, 0.1)',
    iconBg: 'bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.05)]',
    iconBgHover: 'bg-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.25)] scale-110',
    buttonBg: 'btn-sand btn-sand-cyan border border-white/10 bg-white/[0.03] backdrop-blur-sm transition-all font-black',
    buttonHoverGlow: '0 0 12px rgba(255,255,255,0.25)',
    sheenGradient: 'linear-gradient(115deg, transparent 35%, rgba(255, 255, 255, 0.05) 45%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.05) 55%, transparent 65%)',
    particleColors: ['#ffffff', '#cbd5e1', '#e2e8f0', '#94a3b8'],
  },
  orange: {
    borderGradient: 'linear-gradient(270deg, #94a3b8, #475569, #94a3b8)',
    glow: 'rgba(148,163,184,0.15), rgba(71,85,105,0.05)',
    glowColor: 'rgba(148,163,184,0.1)',
    boxShadowHover: '0 12px 30px rgba(148, 163, 184, 0.15), 0 0 20px rgba(71, 85, 105, 0.08), inset 0 0 10px rgba(148, 163, 184, 0.1)',
    boxShadowActive: '0 0 15px rgba(148, 163, 184, 0.1)',
    iconBg: 'bg-white/10 text-white shadow-[0_0_10px_rgba(255,255,255,0.05)]',
    iconBgHover: 'bg-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.25)] scale-110',
    buttonBg: 'btn-sand btn-sand-orange border border-white/10 bg-white/[0.03] backdrop-blur-sm transition-all font-black',
    buttonHoverGlow: '0 0 12px rgba(148,163,184,0.25)',
    sheenGradient: 'linear-gradient(115deg, transparent 35%, rgba(148, 163, 184, 0.05) 45%, rgba(255, 255, 255, 0.15) 50%, rgba(148, 163, 184, 0.05) 55%, transparent 65%)',
    particleColors: ['#ffffff', '#cbd5e1', '#e2e8f0', '#94a3b8'],
  },
};
