import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border/80 bg-card/96 backdrop-blur-xl shadow-[0_16px_36px_rgba(120,83,48,0.1)] transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[0_20px_42px_rgba(120,83,48,0.14)]',
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 pb-3', className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('text-[0.95rem] font-semibold tracking-[-0.02em] text-foreground', className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-5 pt-0', className)} {...props} />;
}
