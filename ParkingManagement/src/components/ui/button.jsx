import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 disabled:pointer-events-none disabled:opacity-60 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 text-amber-950 shadow-[0_16px_40px_-20px_rgba(245,158,11,0.8)] hover:from-yellow-300 hover:to-yellow-500',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline:
          'border border-yellow-300 bg-white text-amber-900 shadow-sm hover:border-yellow-400 hover:bg-yellow-50',
        secondary:
          'bg-yellow-50 text-amber-900 shadow-sm hover:bg-yellow-100',
        ghost:
          'bg-transparent text-amber-900 hover:bg-yellow-50 hover:text-amber-950',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-5 py-2.5',
        sm: 'h-9 rounded-full px-4 text-xs',
        lg: 'h-12 rounded-full px-6',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
