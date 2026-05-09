import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-mono text-xs uppercase tracking-meta transition-colors disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent',
  {
    variants: {
      variant: {
        default:
          'bg-ink text-paper hover:bg-ink-soft border border-ink',
        outline:
          'bg-transparent text-ink border border-ink hover:bg-ink hover:text-paper',
        ghost: 'bg-transparent text-ink-soft hover:text-accent',
        accent:
          'bg-accent text-paper hover:bg-ink border border-accent hover:border-ink',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 px-3',
        lg: 'h-12 px-7',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';

export { buttonVariants };
