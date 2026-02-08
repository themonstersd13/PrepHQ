import React from 'react';
import { clsx } from 'clsx';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const variantMap: Record<BadgeVariant, string> = {
  default: 'bg-white/10 text-text-secondary',
  success: 'bg-neon-green/15 text-neon-green',
  warning: 'bg-yellow-400/15 text-yellow-400',
  danger: 'bg-neon-red/15 text-neon-red',
  info: 'bg-neon-blue/15 text-neon-blue',
};

const dotColorMap: Record<BadgeVariant, string> = {
  default: 'bg-text-muted',
  success: 'bg-neon-green',
  warning: 'bg-yellow-400',
  danger: 'bg-neon-red',
  info: 'bg-neon-blue',
};

export const Badge: React.FC<BadgeProps> = ({
  children, variant = 'default', className, dot,
}) => (
  <span
    className={clsx(
      'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium',
      variantMap[variant],
      className,
    )}
  >
    {dot && (
      <span className={clsx('h-1.5 w-1.5 rounded-full', dotColorMap[variant])} />
    )}
    {children}
  </span>
);
