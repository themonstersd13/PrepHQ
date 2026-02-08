// ============================================
// PrepHQ — TitleBar Component
// Custom frameless window title bar
// ============================================

import React from 'react';

const TitleBar: React.FC = () => {
  return (
    <div className="drag-region flex h-9 items-center justify-between border-b border-white/10 bg-surface-primary px-4">
      {/* App title */}
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-neon-blue glow-blue" />
        <span className="text-xs font-semibold tracking-wider text-text-secondary">
          PREPHQ
        </span>
      </div>

      {/* Window controls — handled by titleBarOverlay on Windows */}
      {/* On macOS the native buttons are shown automatically */}
    </div>
  );
};

export default TitleBar;
