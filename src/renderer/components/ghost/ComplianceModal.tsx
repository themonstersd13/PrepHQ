// ============================================
// PrepHQ — Compliance Check Modal
// Mandatory ethical guardrail before Ghost Mode
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassButton } from '../ui';

interface ComplianceModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

const ComplianceModal: React.FC<ComplianceModalProps> = ({ open, onAccept, onDecline }) => {
  const [checked, setChecked] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [canProceed, setCanProceed] = useState(false);

  useEffect(() => {
    if (!open) {
      setChecked(false);
      setCountdown(5);
      setCanProceed(false);
      return;
    }

    if (!checked) {
      setCountdown(5);
      setCanProceed(false);
      return;
    }

    // Start 5 second countdown after checkbox is checked
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setCanProceed(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [open, checked]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="glass glow-purple mx-4 max-w-md rounded-2xl p-6"
          >
            {/* Shield Icon */}
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-neon-purple/20">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-neon-purple">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-text-primary">Ethical Use Agreement</h2>
            </div>

            {/* Description */}
            <p className="mb-4 text-sm leading-relaxed text-text-secondary">
              Ghost Mode provides real-time interview assistance. Before activating,
              you must acknowledge the following:
            </p>

            {/* Terms */}
            <div className="glass-subtle mb-4 rounded-xl p-4">
              <ul className="space-y-2 text-xs text-text-secondary">
                <li className="flex gap-2">
                  <span className="text-neon-green">✓</span>
                  Educational and mock interview practice
                </li>
                <li className="flex gap-2">
                  <span className="text-neon-green">✓</span>
                  Self-improvement and preparation
                </li>
                <li className="flex gap-2">
                  <span className="text-neon-red">✗</span>
                  Use during actual evaluated interviews without disclosure
                </li>
                <li className="flex gap-2">
                  <span className="text-neon-red">✗</span>
                  Recording others without their consent
                </li>
              </ul>
            </div>

            {/* Checkbox */}
            <label className="mb-5 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 accent-neon-purple"
              />
              <span className="text-xs leading-relaxed text-text-primary">
                I certify I am using this for <strong>educational purposes</strong> or{' '}
                <strong>mock interviews only</strong>. I understand my responsibility
                to use this tool ethically.
              </span>
            </label>

            {/* Buttons */}
            <div className="flex gap-3">
              <GlassButton variant="ghost" size="sm" onClick={onDecline} className="flex-1">
                Cancel
              </GlassButton>
              <GlassButton
                variant="primary"
                size="sm"
                onClick={onAccept}
                disabled={!canProceed}
                className="flex-1"
              >
                {!checked
                  ? 'Check to proceed'
                  : countdown > 0
                    ? `Wait ${countdown}s…`
                    : 'Activate Ghost Mode'}
              </GlassButton>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ComplianceModal;
