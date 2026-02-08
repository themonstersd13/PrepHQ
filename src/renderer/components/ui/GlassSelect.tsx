import React from 'react';
import * as Select from '@radix-ui/react-select';
import { clsx } from 'clsx';

interface SelectOption {
  value: string;
  label: string;
}

interface GlassSelectProps {
  options: SelectOption[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const GlassSelect: React.FC<GlassSelectProps> = ({
  options, value, onValueChange, placeholder = 'Select…', className,
}) => (
  <Select.Root value={value} onValueChange={onValueChange}>
    <Select.Trigger
      className={clsx(
        'glass inline-flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-text-primary outline-none',
        'hover:bg-white/10 focus:ring-1 focus:ring-neon-blue/40',
        className,
      )}
    >
      <Select.Value placeholder={placeholder} />
      <Select.Icon>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 5L6 8L9 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </Select.Icon>
    </Select.Trigger>

    <Select.Portal>
      <Select.Content
        className="glass overflow-hidden rounded-xl border border-white/10 shadow-xl"
        position="popper"
        sideOffset={4}
      >
        <Select.Viewport className="p-1">
          {options.map((opt) => (
            <Select.Item
              key={opt.value}
              value={opt.value}
              className={clsx(
                'relative flex cursor-pointer select-none items-center rounded-lg px-3 py-2 text-sm text-text-secondary outline-none',
                'data-[highlighted]:bg-white/10 data-[highlighted]:text-text-primary',
                'data-[state=checked]:text-neon-blue',
              )}
            >
              <Select.ItemText>{opt.label}</Select.ItemText>
            </Select.Item>
          ))}
        </Select.Viewport>
      </Select.Content>
    </Select.Portal>
  </Select.Root>
);
