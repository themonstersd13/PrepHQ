import React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { clsx } from 'clsx';

type Variant = 'default' | 'primary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

const variantStyles: Record<Variant, string> = {
  default: 'glass hover:bg-white/10 text-text-primary',
  primary: 'bg-neon-blue/20 border border-neon-blue/30 text-neon-blue hover:bg-neon-blue/30',
  ghost: 'bg-transparent border-none text-text-secondary hover:bg-white/5 hover:text-text-primary',
  danger: 'bg-neon-red/20 border border-neon-red/30 text-neon-red hover:bg-neon-red/30',
};

const sizeStyles: Record<Size, string> = {
  sm: 'px-2.5 py-1 text-xs rounded-lg gap-1',
  md: 'px-4 py-2 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2',
};

export const GlassButton = React.forwardRef<HTMLButtonElement, GlassButtonProps>(
  ({ variant = 'default', size = 'md', asChild, className, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={clsx(
          'inline-flex items-center justify-center font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neon-blue/50',
          'disabled:pointer-events-none disabled:opacity-40',
          'active:scale-[0.98]',
          variantStyles[variant],
          sizeStyles[size],
          className,
        )}
        {...props}
      />
    );
  },
);
GlassButton.displayName = 'GlassButton';
