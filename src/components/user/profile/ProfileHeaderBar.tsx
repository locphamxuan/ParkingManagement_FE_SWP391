import { motion } from 'framer-motion';
import { ArrowLeft, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProfileHeaderBarProps {
  onLogout: () => void;
}

// Thanh header dạng glass panel, dính (sticky-look): nút Back to Home + Logout.
export function ProfileHeaderBar({ onLogout }: ProfileHeaderBarProps) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 100, damping: 18 }}
      className="mb-8 flex items-center justify-between gap-4 rounded-3xl border border-white/5 bg-slate-900/60 p-4 backdrop-blur-md shadow-2xl"
    >
      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-xl border border-white/5 bg-slate-950 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-orange-400 hover:border-orange-500/30 hover:shadow-[0_0_15px_rgba(249,115,22,0.2)] transition-all duration-300 hover:scale-105"
        onClick={() => navigate('/', { replace: true })}
      >
        <ArrowLeft size={14} className="stroke-[3]" />
        Back to Home
      </button>

      <button
        type="button"
        className="inline-flex items-center gap-2 rounded-xl bg-rose-600/90 hover:bg-rose-600 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white shadow-lg transition-all duration-300 hover:shadow-[0_0_15px_rgba(220,38,38,0.25)] hover:scale-105"
        onClick={onLogout}
      >
        <LogOut size={14} className="stroke-[3]" />
        Logout
      </button>
    </motion.div>
  );
}
