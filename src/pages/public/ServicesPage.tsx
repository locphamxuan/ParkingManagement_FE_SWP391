import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  Camera,
  Clock3,
  CreditCard,
  MapPinned,
  Package,
  ShieldAlert,
  Wallet,
} from 'lucide-react';
import { PublicPageShell, PageHero } from '@/components/home/PublicPageShell';

const driverServices = [
  {
    icon: Clock3,
    title: 'Hourly Parking',
    description: 'Drive in, get scanned, park. Fees are calculated per hour by vehicle type and paid from your e-wallet at checkout.',
    highlights: ['AI camera check-in in seconds', 'Fee preview before checkout', 'Full parking history'],
  },
  {
    icon: Package,
    title: 'Long-term Packages',
    description: 'Weekly or monthly packages for regular commuters. Register a plate once, then check in without any manual steps.',
    highlights: ['Priority slot assignment at check-in', 'Auto renewal reminder', 'Refund policy on early cancellation'],
    action: { to: '/packages/buy', label: 'Buy Package' },
  },
  {
    icon: Wallet,
    title: 'E-Wallet Payments',
    description: 'Top up via PayOS QR banking and pay every parking fee cashless. Every transaction is itemized and traceable.',
    highlights: ['Instant QR top-up', 'Transaction history & filters', 'No cash needed at the gate'],
    action: { to: '/wallet', label: 'Top Up Wallet' },
  },
  {
    icon: ShieldAlert,
    title: 'Incident Support',
    description: 'Report lost tickets, blocked slots, or vehicle issues right from the app. On-site staff resolve and you get notified.',
    highlights: ['9 incident types covered', 'Photo evidence upload', 'Resolution notifications'],
  },
];

const operatorServices = [
  {
    icon: Camera,
    title: 'AI Gate Operations',
    description: 'Staff scan plates and drivers with live cameras; the system matches packages, assigns slots, and records snapshots.',
  },
  {
    icon: BarChart3,
    title: 'Revenue & Shift Reports',
    description: 'Per-shift cash confirmation, revenue breakdown by payment method, and real-time occupancy for managers.',
  },
  {
    icon: MapPinned,
    title: 'Live Slot Maps',
    description: '2D/3D floor maps show every slot status live — vacant, occupied, or reserved by a package holder.',
  },
  {
    icon: CreditCard,
    title: 'Building Wallet',
    description: 'All digital payments flow into an auditable building wallet with pending-cash confirmation for cash transactions.',
  },
];

const steps = [
  { step: '01', title: 'Register & add your plate', description: 'Create an account, add your license plate and top up your wallet.' },
  { step: '02', title: 'Drive to the gate', description: 'The AI camera reads your plate; staff confirm and a slot is assigned instantly.' },
  { step: '03', title: 'Park & go', description: 'Your session runs automatically. Check out at the gate and the fee settles from your wallet.' },
];

export default function ServicesPage() {
  return (
    <PublicPageShell>
      <PageHero
        eyebrow="Our Services"
        title={
          <>
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-cyan-400 bg-clip-text text-transparent">park smarter</span>
          </>
        }
        description="From hourly drop-ins to monthly commuter packages, PBMS covers the full journey of a driver — and gives building operators the tools to run it all."
      />

      {/* Driver services */}
      <section className="pb-16 relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">For Drivers</span>
            <h2 className="text-2xl font-black mt-2 text-white">Park, pay, and track — all in one account</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            {driverServices.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.article
                  key={service.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.08 }}
                  className="rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-md p-6 hover:border-cyan-500/20 hover:shadow-[0_0_25px_rgba(6,182,212,0.06)] transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/15 text-cyan-400 shrink-0">
                      <Icon size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-black text-white">{service.title}</h3>
                      <p className="mt-2 text-xs text-slate-400 font-semibold leading-relaxed">{service.description}</p>
                      <ul className="mt-3 space-y-1.5">
                        {service.highlights.map((highlight) => (
                          <li key={highlight} className="flex items-center gap-2 text-[11px] text-slate-300 font-semibold">
                            <span className="w-1 h-1 rounded-full bg-cyan-400 shrink-0" />
                            {highlight}
                          </li>
                        ))}
                      </ul>
                      {service.action && (
                        <div className="mt-4">
                          <Link
                            to={service.action.to}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-950 transition hover:bg-cyan-400 hover:scale-105 active:scale-98 shadow-[0_0_15px_rgba(6,182,212,0.25)]"
                          >
                            <span>{service.action.label}</span>
                            <ArrowRight size={11} className="stroke-[3]" />
                          </Link>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 relative z-10 bg-slate-950/40">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-xl mx-auto mb-10">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">How It Works</span>
            <h2 className="text-2xl md:text-3xl font-black mt-2 text-white">Three steps from street to slot</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {steps.map((item, index) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.35, delay: index * 0.1 }}
                className="relative rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-md p-6"
              >
                <span className="text-4xl font-black font-mono text-white/10">{item.step}</span>
                <h3 className="mt-2 text-sm font-black text-white">{item.title}</h3>
                <p className="mt-2 text-xs text-slate-400 font-semibold leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Operator services */}
      <section className="py-16 relative z-10">
        <div className="max-w-6xl mx-auto px-4">
          <div className="mb-8">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 font-mono">For Building Operators</span>
            <h2 className="text-2xl font-black mt-2 text-white">Run the whole lot from one dashboard</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {operatorServices.map((service, index) => {
              const Icon = service.icon;
              return (
                <motion.article
                  key={service.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: index * 0.08 }}
                  className="rounded-2xl border border-white/5 bg-slate-900/30 backdrop-blur-md p-5 hover:border-white/15 transition-colors duration-300"
                >
                  <div className="p-2.5 w-fit rounded-xl bg-white/5 border border-white/10 text-white">
                    <Icon size={18} />
                  </div>
                  <h3 className="mt-3 text-xs font-black text-white">{service.title}</h3>
                  <p className="mt-2 text-[11px] text-slate-400 font-semibold leading-relaxed">{service.description}</p>
                </motion.article>
              );
            })}
          </div>

          <div className="mt-12 text-center">
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(6,182,212,0.25)] hover:shadow-[0_0_30px_rgba(6,182,212,0.4)] transition-all duration-300"
            >
              Get Started Today <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>
    </PublicPageShell>
  );
}
