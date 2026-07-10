import { Home } from 'lucide-react';
import { InteractiveParticleCanvas } from '@/components/common/InteractiveParticleCanvas';

/**
 * Hiệu ứng nền tĩnh (không phụ thuộc state) của AuthPage: laser scan-line
 * keyframes, glow, 3D cyber-grid, particle canvas và nút Back to Home nổi.
 */
export function AuthSceneBackground() {
  return (
    <>
      {/* Laser Scanning Line and perspective grid animations */}
      <style>{`
        @keyframes gridScroll {
          0% {
            background-position: 0 0;
          }
          100% {
            background-position: 0 45px;
          }
        }
        .cyber-grid-animate {
          animation: gridScroll 3.5s linear infinite;
        }
        @keyframes scanline {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .input-scan-focus {
          transition: all 0.3s ease;
        }
        .input-scan-focus:focus {
          background-image: linear-gradient(90deg, rgba(15,23,42,0.85) 0%, rgba(249,115,22,0.06) 50%, rgba(15,23,42,0.85) 100%);
          background-size: 200% 100%;
          animation: scanline 2.5s linear infinite;
        }
      `}</style>

      {/* Background Neon Glow Vectors */}
      <div className="absolute top-0 right-0 w-[550px] h-[550px] rounded-full bg-[radial-gradient(circle_at_center,rgba(249,115,22,0.08),transparent_60%)] pointer-events-none blur-3xl z-0" />
      <div className="absolute bottom-0 left-0 w-[450px] h-[450px] rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.06),transparent_60%)] pointer-events-none blur-3xl z-0" />
      <InteractiveParticleCanvas />

      {/* 3D Cyber-Grid Perspective Floor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[200%] h-[50%] opacity-40"
          style={{
            perspective: '1000px',
            transformStyle: 'preserve-3d',
          }}
        >
          <div
            className="w-full h-full cyber-grid-animate"
            style={{
              transform: 'rotateX(75deg)',
              transformOrigin: 'bottom center',
              backgroundImage: `
                linear-gradient(to right, rgba(249, 115, 22, 0.12) 1px, transparent 1px),
                linear-gradient(to bottom, rgba(168, 85, 247, 0.12) 1px, transparent 1px)
              `,
              backgroundSize: '45px 45px',
              maskImage: 'linear-gradient(to top, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 80%)',
              WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,1) 10%, rgba(0,0,0,0) 80%)',
            }}
          />
        </div>
      </div>

      {/* Floating Sticky Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <a
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-white/5 bg-slate-900/60 backdrop-blur-md px-4 py-2.5 text-xs font-black uppercase tracking-widest text-orange-400 shadow-xl hover:border-orange-500/30 hover:shadow-[0_0_15px_rgba(249,115,22,0.25)] hover:scale-105 transition-all duration-300"
        >
          <Home size={14} className="stroke-[3]" />
          Back to Home
        </a>
      </div>
    </>
  );
}
