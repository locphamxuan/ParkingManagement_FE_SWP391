import { cva, type VariantProps } from 'class-variance-authority';
import type { HTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

const badgeVariants = cva('inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-[0.04em]', {
  variants: {
    variant: {
      default: 'bg-primary/15 text-primary ring-1 ring-inset ring-primary/20',
      success: 'bg-emerald-500/12 text-emerald-700 ring-1 ring-inset ring-emerald-500/18',
      warning: 'bg-amber-500/12 text-amber-700 ring-1 ring-inset ring-amber-500/18',
      danger: 'bg-rose-500/12 text-rose-700 ring-1 ring-inset ring-rose-500/18',
      muted: 'bg-stone-100 text-stone-600 ring-1 ring-inset ring-stone-300/80',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
