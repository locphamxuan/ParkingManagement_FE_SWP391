import type { InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-10 w-full rounded-md border border-border bg-secondary px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-ring',
        className
      )}
      {...props}
    />
  );
}
