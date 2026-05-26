import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const hexButtonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-r from-accent to-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--accent)/0.3)] hover:shadow-[0_0_30px_hsl(var(--accent)/0.5)] hover:brightness-110',
        ghost: 'text-foreground hover:bg-muted',
        danger: 'bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20',
        cyan: 'bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 px-3 text-xs rounded-md',
      },
    },
    defaultVariants: { variant: 'primary', size: 'default' },
  }
);

export interface HexButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof hexButtonVariants> {
  asChild?: boolean;
}

const HexButton = React.forwardRef<HTMLButtonElement, HexButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(hexButtonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
HexButton.displayName = 'HexButton';

export { HexButton, hexButtonVariants };
