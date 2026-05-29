import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface AnalyticsCardProps {
  label: string;
  value: string;
  delta: string;
  index?: number;
  icon?: React.ReactNode;
}

export function AnalyticsCard({ label, value, delta, index = 0, icon }: AnalyticsCardProps) {
  const isPositive = !delta.includes('-');
  const ref = useRef<HTMLDivElement>(null);

  // Mouse-tracking motion values for 3D parallax tilt
  const rawX = useMotionValue(0.5);
  const rawY = useMotionValue(0.5);
  const springX = useSpring(rawX, { stiffness: 160, damping: 22 });
  const springY = useSpring(rawY, { stiffness: 160, damping: 22 });
  const rotateY = useTransform(springX, [0, 1], [-8, 8]);
  const rotateX = useTransform(springY, [0, 1], [7, -7]);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    rawX.set((e.clientX - rect.left) / rect.width);
    rawY.set((e.clientY - rect.top) / rect.height);
  }

  function handleMouseLeave() {
    rawX.set(0.5);
    rawY.set(0.5);
  }

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 15, delay: index * 0.07 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: '900px',
      }}
    >
      <div className="h-full relative overflow-hidden rounded-2xl p-6 glass-premium glow-border-pulse shadow-2xl transition-all duration-300 group cursor-default">
        
        {/* Dynamic corner neon spot glow — shifts on hover */}
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.18),transparent_70%)] pointer-events-none transition-all duration-500 group-hover:scale-150 group-hover:opacity-75" />
        <div className="absolute -left-6 -bottom-6 h-16 w-16 rounded-full bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12),transparent_70%)] pointer-events-none group-hover:scale-125 transition-all duration-500" />
        
        {/* Content elevated with preserve-3d for floating layering effect */}
        <div className="relative z-10" style={{ transformStyle: 'preserve-3d' }}>

          {/* Top row: label + optional icon */}
          <div className="flex items-center justify-between mb-3" style={{ transform: 'translateZ(8px)' }}>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 font-mono">
              {label}
            </p>
            {icon && (
              <div className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400">
                {icon}
              </div>
            )}
          </div>

          {/* Main value — elevated forward with parallax depth */}
          <div style={{ transform: 'translateZ(16px)' }}>
            <h3 className="text-3xl font-black tracking-tight font-mono bg-gradient-to-br from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              {value}
            </h3>
          </div>

          {/* Delta badge */}
          <div className="mt-4 flex items-center gap-2" style={{ transform: 'translateZ(10px)' }}>
            <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-[9px] font-black tracking-wider uppercase font-mono border ${
              isPositive 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.2)]' 
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20 shadow-[0_0_8px_rgba(239,68,68,0.2)]'
            }`}>
              <span>{isPositive ? '▲' : '▼'}</span>
              {delta}
            </span>
            <span className="text-[10px] font-bold text-slate-500">vs tháng trước</span>
          </div>
        </div>

        {/* Neon bottom accent line — visible on hover */}
        <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-orange-500/0 via-orange-500/35 to-orange-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {/* Ambient micro-grid texture overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.012)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.012)_1px,transparent_1px)] bg-[size:12px_12px] pointer-events-none rounded-2xl" />
      </div>
    </motion.div>
  );
}
