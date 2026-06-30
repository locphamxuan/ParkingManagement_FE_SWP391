import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';

interface HotSpotProps {
  title: string;
  desc: string;
  style: React.CSSProperties;
  delay?: number;
}

export function HotSpot({ title, desc, style, delay = 0 }: HotSpotProps) {
  const [open, setOpen] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, type: 'spring', stiffness: 200, damping: 15 }}
      className="absolute z-20"
      style={style}
    >
      <span className="absolute inset-0 rounded-full animate-ping bg-cyan-400/30 pointer-events-none" />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative w-8 h-8 rounded-full bg-white/10 border-2 border-cyan-400 backdrop-blur-sm flex items-center justify-center text-cyan-300 hover:bg-cyan-500/30 hover:scale-110 transition-all duration-200 shadow-[0_0_12px_rgba(6,182,212,0.4)]"
        aria-label={title}
      >
        <Plus size={14} strokeWidth={2.5} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.9 }}
            transition={{ duration: 0.18 }}
            className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-52 bg-slate-950/95 border border-cyan-500/20 rounded-2xl p-3 backdrop-blur-xl shadow-2xl pointer-events-none"
          >
            <p className="text-[11px] font-black text-cyan-300 mb-1">{title}</p>
            <p className="text-[10px] text-slate-400 leading-relaxed">{desc}</p>
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-slate-950 border-r border-b border-cyan-500/20 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
