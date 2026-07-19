import { motion } from 'framer-motion';
import { Building2, Camera, CreditCard, Layers, ShieldCheck, Target, Users } from 'lucide-react';
import { PublicPageShell, PageHero } from '@/components/home/PublicPageShell';

const stats = [
  { value: '24/7', label: 'Continuous gate operations' },
  { value: '99%', label: 'Slot occupancy accuracy' },
  { value: '<3s', label: 'Average check-in time' },
  { value: '100%', label: 'Cashless payment support' },
];

const values = [
  {
    icon: Target,
    title: 'Operational Transparency',
    description:
      'Every parking session, payment, and shift handover is recorded and traceable. Managers see revenue in real time, users see every transaction in their wallet.',
  },
  {
    icon: ShieldCheck,
    title: 'Safety First',
    description:
      'AI cameras capture the vehicle and driver at both entry and exit. Incidents are reported in-app and resolved by on-site staff with a full audit trail.',
  },
  {
    icon: Users,
    title: 'Built for Every Role',
    description:
      'Four dedicated portals — user, staff, manager, and admin — each designed around the daily tasks of that role, nothing more, nothing less.',
  },
];

const milestones = [
  {
    icon: Building2,
    title: 'Multi-building Infrastructure',
    description: 'Model buildings, floors, zones, gates, and individual slots with live status tracking.',
  },
  {
    icon: Camera,
    title: 'AI Camera Check-in',
    description: 'License plate and vehicle recognition at the gate — no ticket, no waiting.',
  },
  {
    icon: CreditCard,
    title: 'E-Wallet & Packages',
    description: 'Hourly parking, long-term packages, and wallet payments unified in one account.',
  },
  {
    icon: Layers,
    title: 'Real-time Operations',
    description: 'Live session board, shift-based revenue reports, and incident management for operators.',
  },
];

export default function AboutPage() {
  return (
    <PublicPageShell>
      <PageHero
        eyebrow="About PBMS"
        title={
          <>
            The parking platform built for{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-cyan-400 bg-clip-text text-transparent">modern buildings</span>
          </>
        }
        description="PBMS (Parking Building Management System) digitizes the entire parking operation of a building — from the barrier gate to the monthly revenue report — so managers operate with data and drivers park without friction."
      />

      {/* Stats band */}
      <section className="pb-16 relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.08 }}
                className="rounded-2xl border border-white/5 bg-slate-900/40 backdrop-blur-md p-6 text-center hover:border-cyan-500/20 transition-colors duration-300"
              >
                <p className="text-3xl font-black font-mono bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">{stat.value}</p>
                <p className="mt-2 text-[11px] text-slate-400 font-semibold leading-snug">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-16 relative z-10 bg-slate-950/40">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">Our Mission</span>
            <h2 className="text-2xl md:text-3xl font-black mt-2 text-white leading-tight">
              Turn every parking lot into a transparent, self-reporting operation
            </h2>
            <p className="mt-4 text-sm text-slate-400 font-medium leading-relaxed">
              Paper tickets, manual cash counting, and guesswork about occupancy cost building operators real money every day. PBMS replaces
              them with AI-assisted check-in, digital payments, and live dashboards — while keeping staff in control at every step.
            </p>
            <p className="mt-3 text-sm text-slate-400 font-medium leading-relaxed">
              The platform was designed together with building managers and gate staff, so every screen maps to a real task: opening a shift,
              scanning a plate, resolving a lost-ticket incident, or closing the day's revenue.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {milestones.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, scale: 0.96 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.08 }}
                  className="rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-md p-5 hover:border-white/15 transition-colors duration-300"
                >
                  <div className="p-2 w-fit rounded-lg bg-cyan-500/10 border border-cyan-500/15 text-cyan-400">
                    <Icon size={16} />
                  </div>
                  <h3 className="mt-3 text-xs font-black text-white">{item.title}</h3>
                  <p className="mt-1.5 text-[11px] text-slate-400 font-semibold leading-relaxed">{item.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-16 relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">What We Stand For</span>
            <h2 className="text-2xl md:text-3xl font-black mt-2 text-white">Principles behind every feature</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <motion.article
                  key={value.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.1 }}
                  className="rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-md p-6 hover:border-cyan-500/20 hover:shadow-[0_0_25px_rgba(6,182,212,0.06)] transition-all duration-300"
                >
                  <div className="p-2.5 w-fit rounded-xl bg-white/5 border border-white/10 text-white">
                    <Icon size={18} />
                  </div>
                  <h3 className="mt-4 text-sm font-black text-white">{value.title}</h3>
                  <p className="mt-2 text-xs text-slate-400 font-semibold leading-relaxed">{value.description}</p>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
