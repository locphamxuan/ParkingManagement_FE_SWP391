import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

interface AuthNoticeBannerProps {
  notice?: { message?: string; type?: string } | null;
}

export function AuthNoticeBanner({ notice }: AuthNoticeBannerProps) {
  if (!notice?.message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mb-5 rounded-xl border p-3.5 text-xs font-black uppercase tracking-wider font-mono backdrop-blur-md flex items-center gap-2.5 ${
        notice.type === 'success'
          ? 'border-emerald-500/25 bg-emerald-950/20 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
          : 'border-rose-500/25 bg-rose-950/20 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.1)]'
      }`}
    >
      <AlertCircle size={14} className="shrink-0" />
      {notice.message}
    </motion.div>
  );
}
