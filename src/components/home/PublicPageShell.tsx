import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicHeader } from './PublicHeader';
import { PremiumFooter } from './HomeFooter';
import { useAuth } from '@/hooks/useAuth';

interface PublicPageShellProps {
  children: ReactNode;
}

// Khung chung cho các trang public phụ (About/Services/Contact): nền tối,
// header sticky và footer premium — trang chỉ cần render phần nội dung giữa.
export function PublicPageShell({ children }: PublicPageShellProps) {
  const navigate = useNavigate();
  const { session } = useAuth();

  const user = session
    ? { fullName: session.displayName, email: session.email, role: session.role }
    : null;

  return (
    <main className="min-h-screen bg-[#060a11] text-slate-100 font-sans selection:bg-cyan-500 selection:text-white relative isolate">
      <div className="absolute inset-x-0 top-0 h-[60vh] pointer-events-none overflow-hidden -z-10" aria-hidden="true">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[55%] rounded-full bg-[radial-gradient(circle_at_center,hsla(180,70%,30%,0.12),transparent_55%)] blur-3xl" />
        <div className="absolute top-[15%] right-[-15%] w-[60%] h-[60%] rounded-full bg-[radial-gradient(circle_at_center,hsla(195,80%,25%,0.10),transparent_55%)] blur-3xl" />
      </div>

      <PublicHeader />

      {children}

      <PremiumFooter user={user} onViewProfile={() => navigate(session ? '/profile' : '/auth/login')} />
    </main>
  );
}

interface PageHeroProps {
  eyebrow: string;
  title: ReactNode;
  description: string;
}

// Hero heading thống nhất cho các trang public phụ.
export function PageHero({ eyebrow, title, description }: PageHeroProps) {
  return (
    <section className="pt-16 pb-12 relative z-10">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-cyan-400 font-mono">{eyebrow}</span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black tracking-tight text-white leading-tight">{title}</h1>
        <p className="mt-4 text-sm md:text-base text-slate-400 font-medium leading-relaxed max-w-2xl mx-auto">{description}</p>
      </div>
    </section>
  );
}
