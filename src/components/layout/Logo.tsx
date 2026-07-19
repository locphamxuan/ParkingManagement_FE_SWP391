import { useId } from 'react';

interface LogoProps {
  /** 'mark' = icon only (favicon-style square). 'full' = icon + wordmark. */
  variant?: 'mark' | 'full';
  /** Pixel size of the square mark. */
  size?: number;
  /** Subtitle line under the wordmark (full variant only). Pass false to hide it. */
  tagline?: string | false;
  className?: string;
}

/**
 * PBMS brand mark: a bold "P" fused with a rounded stadium stem, evoking both
 * the parking initial and a location pin. Single shared component so every
 * layout renders the identical mark instead of duplicating inline SVG/CSS.
 */
export function Logo({ variant = 'full', size = 36, tagline = 'Parking Space', className = '' }: LogoProps) {
  const gradientId = `pbms-mark-grad-${useId()}`;

  const mark = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className="shrink-0 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-transform duration-300 group-hover:scale-105"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#06B6D4" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="36" height="36" rx="11" fill={`url(#${gradientId})`} />
      <rect x="2" y="2" width="36" height="12" rx="9" fill="#FFFFFF" opacity="0.1" />
      <rect x="13" y="10" width="5" height="20" rx="2.5" fill="#FFFFFF" />
      <path d="M18,10 L23,10 A5,5 0 0 1 23,20 L18,20 Z" fill="#FFFFFF" />
    </svg>
  );

  if (variant === 'mark') {
    return <span className={className}>{mark}</span>;
  }

  return (
    <span className={`flex items-center gap-2.5 group ${className}`}>
      {mark}
      <span className="hidden sm:block leading-tight">
        <strong className="block text-sm font-black tracking-tight bg-gradient-to-r from-blue-400 via-cyan-400 to-blue-500 bg-clip-text text-transparent">
          PBMS
        </strong>
        {tagline && (
          <span className="text-[9px] uppercase font-mono tracking-widest text-slate-500 font-extrabold block">
            {tagline}
          </span>
        )}
      </span>
    </span>
  );
}
