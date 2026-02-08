// ============================================
// PrepHQ — Posture Alert Component
// Gentle non-intrusive posture correction alerts
// ============================================

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PostureSnapshot } from '../../../shared/types';

interface PostureAlertProps {
  posture: PostureSnapshot | null;
  /** Minimum seconds between alerts */
  cooldownSeconds?: number;
  className?: string;
}

const POSTURE_MESSAGES = [
  { icon: '🪑', text: 'Sit up straight — good posture shows confidence!' },
  { icon: '🧘', text: 'Relax your shoulders and straighten your spine' },
  { icon: '💪', text: 'Pull your shoulders back gently' },
  { icon: '🎯', text: 'Keep your head level with the camera' },
];

const PostureAlert: React.FC<PostureAlertProps> = ({
  posture,
  cooldownSeconds = 30,
  className = '',
}) => {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState(POSTURE_MESSAGES[0]);
  const [lastAlertTime, setLastAlertTime] = useState(0);

  useEffect(() => {
    if (!posture) return;

    const now = Date.now();
    const elapsed = (now - lastAlertTime) / 1000;

    // Only alert if slouching AND cooldown has passed
    if (posture.isSlouching && elapsed >= cooldownSeconds && posture.score < 50) {
      const randomMsg = POSTURE_MESSAGES[Math.floor(Math.random() * POSTURE_MESSAGES.length)];
      setMessage(randomMsg);
      setVisible(true);
      setLastAlertTime(now);

      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => setVisible(false), 5000);
      return () => clearTimeout(timer);
    }

    // Hide if posture improves
    if (!posture.isSlouching && posture.score >= 70) {
      setVisible(false);
    }
  }, [posture, cooldownSeconds, lastAlertTime]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={`flex items-center gap-3 rounded-xl border border-neon-yellow/20 bg-neon-yellow/5 
            backdrop-blur-sm px-4 py-3 shadow-lg ${className}`}
        >
          <span className="text-xl">{message.icon}</span>
          <div className="flex-1">
            <p className="text-xs font-medium text-neon-yellow">{message.text}</p>
            {posture && (
              <p className="mt-0.5 text-[10px] text-text-muted">
                Posture score: {posture.score}/100
              </p>
            )}
          </div>
          <button
            onClick={() => setVisible(false)}
            className="text-text-muted hover:text-text-primary text-xs transition-colors"
          >
            ✕
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PostureAlert;
