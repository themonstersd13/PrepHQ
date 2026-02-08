import React from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';

interface GlassTooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export const GlassTooltip: React.FC<GlassTooltipProps> = ({
  content, children, side = 'top',
}) => (
  <Tooltip.Provider delayDuration={300}>
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side={side}
          sideOffset={6}
          className="glass z-50 rounded-lg px-3 py-1.5 text-xs text-text-primary shadow-lg animate-in fade-in-0 zoom-in-95"
        >
          {content}
          <Tooltip.Arrow className="fill-[rgba(255,255,255,0.1)]" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  </Tooltip.Provider>
);
