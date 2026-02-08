import React from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import { clsx } from 'clsx';

interface TabItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
}

interface GlassTabsProps {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}

export const GlassTabs: React.FC<GlassTabsProps> = ({
  items, value, onValueChange, children,
}) => (
  <Tabs.Root value={value} onValueChange={onValueChange}>
    <Tabs.List className="glass-subtle flex gap-1 rounded-xl p-1">
      {items.map((item) => (
        <Tabs.Trigger
          key={item.value}
          value={item.value}
          className={clsx(
            'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
            'data-[state=active]:bg-white/10 data-[state=active]:text-text-primary',
            'data-[state=inactive]:text-text-muted data-[state=inactive]:hover:text-text-secondary',
          )}
        >
          {item.icon}
          {item.label}
        </Tabs.Trigger>
      ))}
    </Tabs.List>
    {children}
  </Tabs.Root>
);

export const GlassTabContent = Tabs.Content;
