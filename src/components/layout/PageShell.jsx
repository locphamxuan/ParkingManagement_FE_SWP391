import { cn } from '@/lib/utils';

export default function PageShell({ children, className }) {
  return (
    <div className={cn('page-surface flex-1', className)}>
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">{children}</div>
    </div>
  );
}
