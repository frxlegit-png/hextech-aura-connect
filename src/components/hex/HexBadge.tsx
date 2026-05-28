import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const hexBadgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        active: 'bg-green-500/15 text-green-400 border border-green-500/20',
        pending: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
        overdue: 'bg-destructive/15 text-destructive border border-destructive/20',
        paid: 'bg-green-500/15 text-green-400 border border-green-500/20',
        open: 'bg-primary/15 text-primary border border-primary/20',
        opened: 'bg-[rgba(124,58,237,0.15)] text-[hsl(262_83%_68%)] border border-[rgba(124,58,237,0.4)]',
        resolved: 'bg-accent/15 text-accent border border-accent/20',
        progress: 'bg-[rgba(124,58,237,0.15)] text-[hsl(262_83%_68%)] border border-[rgba(124,58,237,0.4)]',
        soon: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/20',
      },
    },
    defaultVariants: { variant: 'active' },
  }
);

export interface HexBadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof hexBadgeVariants> {}

export function HexBadge({ className, variant, ...props }: HexBadgeProps) {
  return <span className={cn(hexBadgeVariants({ variant }), className)} {...props} />;
}
