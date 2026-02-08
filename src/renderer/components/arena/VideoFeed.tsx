// ============================================
// PrepHQ — Video Feed Component
// Shows webcam feed + AI interviewer avatar
// Used in Arena Mode for interview simulation
// ============================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

interface VideoFeedProps {
  /** Ref to bind to the <video> element */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  /** Whether the camera is active */
  isActive: boolean;
  /** Camera error message */
  error?: string | null;
  /** Toggle camera on/off */
  onToggle: () => void;
  /** AI persona name */
  personaName?: string;
  /** AI persona emoji/icon */
  personaIcon?: string;
  /** Whether the AI is currently speaking */
  isSpeaking?: boolean;
  /** Variant: 'sidebar' for side panel, 'pip' for picture-in-picture */
  variant?: 'sidebar' | 'pip';
  className?: string;
}

const VideoFeed: React.FC<VideoFeedProps> = ({
  videoRef,
  isActive,
  error,
  onToggle,
  personaName = 'AI Interviewer',
  personaIcon = '🤖',
  isSpeaking = false,
  variant = 'sidebar',
  className,
}) => {
  const isPip = variant === 'pip';

  return (
    <div
      className={clsx(
        'flex flex-col gap-3',
        isPip ? 'w-48' : 'w-full',
        className,
      )}
    >
      {/* AI Interviewer Avatar */}
      <div className={clsx(
        'glass relative overflow-hidden rounded-xl',
        isPip ? 'h-28' : 'h-32',
      )}>
        {/* Animated avatar background */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-neon-purple/10 to-neon-blue/10">
          <motion.div
            animate={isSpeaking ? {
              scale: [1, 1.08, 1],
              opacity: [0.8, 1, 0.8],
            } : {}}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="mb-1.5 text-3xl"
          >
            {personaIcon}
          </motion.div>
          <p className="text-xs font-medium text-text-primary">{personaName}</p>
          <AnimatePresence>
            {isSpeaking && (
              <motion.div
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 4 }}
                className="mt-1.5 flex items-center gap-1"
              >
                {[0, 1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="w-1 rounded-full bg-neon-purple"
                    animate={{ height: [4, 14, 4] }}
                    transition={{
                      repeat: Infinity,
                      duration: 0.6,
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Speaking ring */}
        {isSpeaking && (
          <motion.div
            className="absolute inset-0 rounded-xl border-2 border-neon-purple/40"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
        )}
      </div>

      {/* Candidate Webcam */}
      <div className={clsx(
        'glass relative overflow-hidden rounded-xl',
        isPip ? 'h-28' : 'h-32',
      )}>
        {isActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
            style={{ transform: 'scaleX(-1)' }} // Mirror
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center bg-surface-elevated/50">
            <span className="text-3xl opacity-40">📷</span>
            <p className="mt-1.5 text-[10px] text-text-muted">
              {error || 'Camera off'}
            </p>
          </div>
        )}

        {/* Camera label */}
        <div className="absolute bottom-1.5 left-1.5 rounded-md bg-black/60 px-1.5 py-0.5 text-[9px] text-white/80">
          You
        </div>

        {/* Active indicator */}
        {isActive && (
          <div className="absolute top-1.5 right-1.5 flex items-center gap-1 rounded-md bg-black/60 px-1.5 py-0.5">
            <div className="h-1.5 w-1.5 rounded-full bg-neon-red animate-pulse" />
            <span className="text-[9px] text-white/80">LIVE</span>
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onToggle}
        className={clsx(
          'rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all',
          isActive
            ? 'bg-neon-red/15 text-neon-red hover:bg-neon-red/25'
            : 'bg-white/5 text-text-secondary hover:bg-white/10',
        )}
      >
        {isActive ? '📷 Turn Off Camera' : '📷 Turn On Camera'}
      </motion.button>
    </div>
  );
};

export default VideoFeed;
