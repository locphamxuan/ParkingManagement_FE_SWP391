import { motion } from 'framer-motion';
import back1 from '@/assets/back1.webp';

const promoPoints = [
  {
    title: 'Easy to use',
    text: 'Clear forms, fast operation, and matching color scheme with the landing page.',
  },
  {
    title: 'Contextual Design',
    text: 'Parking lot background and amber tones clearly identify the system theme.',
  },
  {
    title: 'Secure Access',
    text: 'Your account info and all flows are structured securely and are easy to track.',
  },
];

interface AuthPromoPanelProps {
  title: string;
  description: string;
}

export function AuthPromoPanel({ title, description }: AuthPromoPanelProps) {
  return (
    <div
      className="p-8 text-white flex flex-col justify-between relative overflow-hidden preserve-3d bg-cover bg-no-repeat"
      style={{
        transformStyle: 'preserve-3d',
        backgroundImage: `url(${back1})`,
        backgroundPosition: 'center 85%',
      }}
    >
      <div className="absolute inset-0 bg-slate-950/45 pointer-events-none z-0" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none z-0" />

      <div className="relative z-10" style={{ transform: 'translateZ(30px)' }}>
        <h2 className="text-3xl font-black tracking-tight">{title}</h2>
        <p className="mt-3.5 text-xs font-bold text-orange-100 leading-relaxed">{description}</p>
      </div>

      <div className="mt-8 space-y-4 relative z-10" style={{ transform: 'translateZ(25px)' }}>
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
  );
}
