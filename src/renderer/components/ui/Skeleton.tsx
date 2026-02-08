import React from 'react';
import { clsx } from 'clsx';

interface SkeletonProps {
  className?: string;
  variant?: 'line' | 'circle' | 'rect';
  width?: string | number;
  height?: string | number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className, variant = 'line', width, height,
}) => {
  const base = 'animate-pulse rounded bg-white/5';
  const variants: Record<string, string> = {
    line: 'h-4 w-full rounded-md',
    circle: 'h-10 w-10 rounded-full',
    rect: 'h-24 w-full rounded-xl',
  };

  return (
    <div
      className={clsx(base, variants[variant], className)}
      style={{ width, height }}
    />
  );
};
