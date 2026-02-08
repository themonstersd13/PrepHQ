// ============================================
// PrepHQ — Panic Overlay
// Displays the stall script with pulse animation
// ============================================

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PanicResponse } from '../../../shared/types';

interface PanicOverlayProps {
  open: boolean;
  response: PanicResponse | null;
  onDismiss: () => void;
}

const PanicOverlay: React.FC<PanicOverlayProps> = ({ open, response, onDismiss }) => {
  // Auto-dismiss after 30 seconds
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(onDismiss, 30000);
    return () => clearTimeout(timer);
  }, [open, onDismiss]);

  return (
    <AnimatePresence>
      {open && response && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={onDismiss}
        >
          {/* Subtle red pulse background */}
          <motion.div
            className="absolute inset-0 bg-neon-red/5"
            animate={{ opacity: [0.3, 0.5, 0.3] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="glass relative mx-4 max-w-lg rounded-2xl border-neon-red/20 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="mb-4 flex items-center gap-3">
              <motion.div
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon-red/20"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neon-red">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </motion.div>
              <div>
                <h2 className="text-lg font-bold text-neon-red">Panic Protocol</h2>
                <p className="text-xs text-text-muted">Say this to buy time:</p>
              </div>
            </div>

            {/* Topic */}
            <div className="mb-3 inline-block rounded-full bg-white/5 px-3 py-1 text-xs text-text-muted">
              Topic: {response.topic}
            </div>

            {/* Stall Script */}
            <motion.div
              className="rounded-xl bg-surface-secondary p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <p className="text-sm leading-relaxed text-text-primary italic">
                "{response.stallScript}"
              </p>
            </motion.div>

            {/* Dismiss hint */}
            <p className="mt-4 text-center text-[10px] text-text-muted">
              Click anywhere or wait 30s to dismiss
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PanicOverlay;
