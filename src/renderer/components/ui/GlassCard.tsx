import React from 'react';
import { clsx } from 'clsx';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: 'blue' | 'purple' | 'none';
  hover?: boolean;
}

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ glow = 'none', hover = false, className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={clsx(
        'glass rounded-2xl p-6',
        hover && 'transition-all duration-300 hover:border-white/20 hover:bg-white/[0.08]',
        glow === 'blue' && 'glow-blue',
        glow === 'purple' && 'glow-purple',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  ),
);
GlassCard.displayName = 'GlassCard';
