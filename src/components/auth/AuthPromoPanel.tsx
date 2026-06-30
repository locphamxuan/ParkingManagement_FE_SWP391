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

      {/* Holographic 3D Radar Scanner */}
      <div
        className="relative my-6 py-8 flex flex-col items-center justify-center min-h-[180px] z-10 preserve-3d"
        style={{ transform: 'translateZ(45px)', transformStyle: 'preserve-3d' }}
      >
        <div className="absolute w-36 h-36 rounded-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.18),transparent_70%)] pointer-events-none blur-xl" />

        {[
          { id: 1, left: '25%', color: '#06b6d4', delay: 0 },
          { id: 2, left: '42%', color: '#fbbf24', delay: 1.2 },
          { id: 3, left: '68%', color: '#06b6d4', delay: 2.4 },
          { id: 4, left: '78%', color: '#fbbf24', delay: 0.6 },
        ].map((spark) => (
          <motion.span
            key={spark.id}
            initial={{ y: 20, opacity: 0, scale: 0.4 }}
            animate={{ y: [20, -60], opacity: [0, 0.9, 0], scale: [0.4, 1.2, 0.3] }}
            transition={{ repeat: Infinity, duration: 3.5, delay: spark.delay, ease: 'easeInOut' }}
            className="absolute w-1.5 h-1.5 rounded-full pointer-events-none filter blur-[0.5px] z-0"
            style={{ left: spark.left, backgroundColor: spark.color, boxShadow: `0 0 8px ${spark.color}` }}
          />
        ))}

        <div className="relative w-44 h-44 flex items-center justify-center preserve-3d">
          {/* Outer Cyber Ring */}
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 18, ease: 'linear' }}
            className="absolute w-full h-full"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full text-cyan-500/25">
              <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="6 8 12 8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2 4" />
            </svg>
          </motion.div>

          {/* Inner Concentric Rings */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
            className="absolute w-[80%] h-[80%]"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full text-orange-500/30">
              <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="30 15 10 15" />
              <path d="M 50,2 L 50,15 M 50,85 L 50,98 M 2,50 L 15,50 M 85,50 L 98,50" stroke="currentColor" strokeWidth="1" />
            </svg>
          </motion.div>

          {/* Sweeping Radar Scanner Line */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
            className="absolute w-[90%] h-[90%] flex items-center justify-center"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              <defs>
                <radialGradient id="radarSweep" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                  <stop offset="80%" stopColor="#06b6d4" stopOpacity="0.1" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                </radialGradient>
              </defs>
              <path d="M 50,50 L 50,5 A 45,45 0 0,1 85,25 Z" fill="url(#radarSweep)" />
              <line x1="50" y1="50" x2="50" y2="5" stroke="#06b6d4" strokeWidth="1.5" className="shadow-[0_0_8px_#06b6d4]" />
            </svg>
          </motion.div>

          {/* Central Hub */}
          <motion.div
            animate={{ scale: [1, 1.06, 1], opacity: [0.85, 1, 0.85] }}
            transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
            className="absolute w-14 h-14 bg-slate-950/90 rounded-full border border-cyan-500/50 flex items-center justify-center shadow-[0_0_20px_rgba(6,182,212,0.45)] backdrop-blur-md"
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-cyan-400">
              <path
                d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="animate-pulse"
              />
            </svg>
          </motion.div>

          {/* Target Nodes */}
          <div className="absolute inset-0">
            <motion.div
              animate={{ opacity: [0.2, 1, 0.2] }}
              transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}
              className="absolute w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_#10b981] top-[24%] left-[28%]"
            />
            <motion.div
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ repeat: Infinity, duration: 2, delay: 0.5 }}
              className="absolute w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#06b6d4] bottom-[30%] right-[22%]"
            />
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ repeat: Infinity, duration: 1.8, delay: 0.8 }}
              className="absolute w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_6px_#f97316] top-[40%] right-[32%]"
            />
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-4 relative z-10" style={{ transform: 'translateZ(25px)' }}>
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
