import { cn } from '@/utils/cn';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function Spinner({ size = 'md', className, label }: SpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-[3px]',
    lg: 'h-12 w-12 border-4',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2.5', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-t-transparent border-orange-500 border-r-orange-400/40 border-b-orange-400/10 border-l-orange-400/70',
          sizeClasses[size]
        )}
      />
      {label && <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase font-mono">{label}</span>}
    </div>
  );
}
