import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CarFront } from 'lucide-react';
import { moduleIcons, CARD_THEMES } from './moduleCard.constants';

interface ModuleCardProps {
  module: {
    id: string;
    title: string;
    description: string;
    actionLabel: string;
    available: boolean;
  };
  index: number;
  onViewProfile: () => void;
  onAction: (module: ModuleCardProps['module']) => void;
  colorTheme?: 'orange' | 'cyan';
}

export function ModuleCard({ module, index, onViewProfile, onAction, colorTheme = 'orange' }: ModuleCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const Icon = moduleIcons[module.id] || CarFront;

  const particles = useMemo(() => {
    const themeColors = CARD_THEMES[colorTheme].particleColors;
    return Array.from({ length: 22 }).map((_, i) => {
      const type = ['star', 'diamond', 'circle'][Math.floor(Math.random() * 3)];
      return {
        id: i,
        type,
        size: type === 'star' ? Math.random() * 6 + 3.5 : Math.random() * 3.5 + 1.5,
        delay: Math.random() * 1.5,
        duration: Math.random() * 1.6 + 1.4,
        startX: Math.random() * 90 + 5,
        drift: Math.random() * 40 - 20,
        color: themeColors[Math.floor(Math.random() * themeColors.length)],
      };
    });
  }, [colorTheme]);

  return (
    <motion.article
      key={module.id}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: index * 0.08 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={module.available ? {
        scale: 1.03,
        y: -4,
        boxShadow: CARD_THEMES[colorTheme].boxShadowHover,
      } : { scale: 1.01 }}
      className={`rounded-2xl p-[1px] relative overflow-hidden transition-all duration-300 ${module.available
        ? isHovered
          ? colorTheme === 'cyan' ? 'shadow-[0_0_25px_rgba(6,182,212,0.2)]' : 'shadow-[0_0_25px_rgba(249,115,22,0.2)]'
          : 'bg-white/10'
        : 'bg-white/5 opacity-75'
        }`}
    >
      {module.available && (
        <motion.div
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
          transition={{ duration: isHovered ? 4 : 8, repeat: Infinity, ease: 'linear' }}
          style={{
            position: 'absolute',
            inset: 0,
            background: CARD_THEMES[colorTheme].borderGradient,
            backgroundSize: '400% 400%',
            opacity: isHovered ? 0.85 : 0.15,
            borderRadius: '16px',
            pointerEvents: 'none',
          }}
        />
      )}

      <div className={`p-5 rounded-[15px] backdrop-blur-md flex flex-col justify-between h-[228px] w-full relative z-10 overflow-hidden ${module.available
        ? 'bg-gradient-to-b from-slate-900/90 to-slate-950/95'
        : 'bg-slate-900/10'
        }`}>
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-500"
          style={{
            background: `radial-gradient(circle at 50% 0%, ${CARD_THEMES[colorTheme].glow}, transparent 65%)`,
            opacity: isHovered && module.available ? 1 : 0,
          }}
        />

        <motion.div
          initial={{ x: '-100%', y: '-100%', rotate: -35 }}
          animate={isHovered && module.available ? { x: '200%', y: '200%' } : { x: '-100%', y: '-100%' }}
          transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 2.5, ease: 'easeInOut' }}
          style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '250%',
            background: CARD_THEMES[colorTheme].sheenGradient,
            pointerEvents: 'none', zIndex: 5,
          }}
        />

        {isHovered && module.available && (
          <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[15px] z-10">
            {particles.map((p) => {
              const clipPath = p.type === 'star'
                ? 'polygon(50% 0%, 63% 37%, 100% 50%, 63% 63%, 50% 100%, 37% 63%, 0% 50%, 37% 37%)'
                : p.type === 'diamond'
                  ? 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)'
                  : undefined;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, x: `${p.startX}%`, y: -10, scale: 0, rotate: 0 }}
                  animate={{
                    opacity: [0, 1, 0.7, 1, 0.4, 0],
                    x: [`${p.startX}%`, `${p.startX + p.drift / 2}%`, `${p.startX + p.drift}%`],
                    y: 240,
                    scale: [0, 1.4, 0.8, 1.3, 0.6, 0],
                    rotate: [0, 180, 360, 540, 720],
                  }}
                  transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'linear' }}
                  style={{
                    position: 'absolute', width: p.size, height: p.size,
                    backgroundColor: p.color,
                    borderRadius: p.type === 'circle' ? '50%' : undefined,
                    clipPath,
                    filter: `drop-shadow(0 0 3px ${p.color})`,
                    boxShadow: p.type === 'circle' ? `0 0 6px ${p.color}` : undefined,
                  }}
                />
              );
            })}
          </div>
        )}

        <div className="relative z-20">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-lg transition-all duration-300 ${module.available
              ? isHovered ? CARD_THEMES[colorTheme].iconBgHover : CARD_THEMES[colorTheme].iconBg
              : 'bg-slate-800 text-slate-500'
              }`}>
              <Icon size={20} className="transition-transform duration-300" />
            </div>
            <div>
              <h3 className="font-black text-xs text-white tracking-tight uppercase">{module.title}</h3>
              <span className={`text-[8px] font-black uppercase tracking-wider font-mono px-2 py-0.5 rounded ${module.available ? 'border border-white/25 bg-white/15 text-white' : 'bg-slate-800 text-slate-500'}`}>
                {module.available ? 'AVAILABLE' : 'ROADMAPPED'}
              </span>
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400 leading-relaxed font-semibold">{module.description}</p>
        </div>

        <div className="mt-4 relative z-20">
          <motion.button
            whileHover={module.available ? { scale: 1.02, boxShadow: CARD_THEMES[colorTheme].buttonHoverGlow } : {}}
            whileTap={module.available ? { scale: 0.98 } : {}}
            className={`w-full py-2.5 px-4 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors duration-200 ${module.available
              ? CARD_THEMES[colorTheme].buttonBg
              : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-white/5'
              }`}
            onClick={() => { if (module.id === 'profile') return onViewProfile(); onAction(module); }}
            disabled={!module.available}
          >
            <span className="relative z-10 flex items-center justify-center gap-1.5 w-full">
              {module.available ? module.actionLabel : 'Coming soon'} <ArrowRight size={12} />
            </span>
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}
