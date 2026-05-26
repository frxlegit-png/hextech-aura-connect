import * as React from 'react';
import { cn } from '@/lib/utils';

const HexCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('rounded-lg border border-border bg-card p-6', className)} {...props} />
  )
);
HexCard.displayName = 'HexCard';

export { HexCard };
