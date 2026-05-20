import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

export function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-16 top-0 h-[320px] w-[320px] rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-0 top-32 h-[280px] w-[280px] rounded-full bg-orange-500/20 blur-3xl" />
      </div>
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 text-xs uppercase tracking-[0.24em] text-muted-foreground"
        >
          PBMS Smart City Operations
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="max-w-3xl text-4xl font-semibold leading-tight md:text-6xl"
        >
          Enterprise parking control center for multi-building operations
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-5 max-w-2xl text-base text-muted-foreground md:text-lg"
        >
          Frontend-only admin prototype with protected mock authentication, analytics, fraud monitoring,
          audit trails, and governance dashboards.
        </motion.p>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.22 }} className="mt-8">
          <Link
            to="/auth/login"
            className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            Đăng nhập
            <ArrowRight size={16} />
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
