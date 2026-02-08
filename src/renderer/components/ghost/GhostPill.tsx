// ============================================
// PrepHQ — Ghost Pill Widget
// Floating draggable pill showing hints & state
// ============================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import type { GhostHint, GhostState, InterviewPhase } from '../../../shared/types';

interface GhostPillProps {
  state: GhostState;
  phase: InterviewPhase;
  hints: GhostHint | null;
  expanded: boolean;
  onToggleExpand: () => void;
  onPanic: () => void;
  onAnalyze: () => void;
  onStop: () => void;
}

const stateColors: Record<GhostState, string> = {
  IDLE: 'bg-text-muted',
  LISTENING: 'bg-neon-green',
  PROCESSING: 'bg-neon-blue',
  SUGGESTING: 'bg-neon-purple',
};

const stateLabels: Record<GhostState, string> = {
  IDLE: 'Idle',
  LISTENING: 'Listening…',
  PROCESSING: 'Analyzing…',
  SUGGESTING: 'Hint Ready',
};

const phaseLabels: Record<InterviewPhase, string> = {
  INTRODUCTION: '👋 Introduction',
  TECHNICAL_DSA: '🧮 Technical / DSA',
  SYSTEM_DESIGN: '🏗️ System Design',
  BEHAVIORAL: '💬 Behavioral',
  CLOSING: '🤝 Closing',
  UNKNOWN: '❓ Detecting…',
};

const GhostPill: React.FC<GhostPillProps> = ({
  state,
  phase,
  hints,
  expanded,
  onToggleExpand,
  onPanic,
  onAnalyze,
  onStop,
}) => {
  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.1}
      className="select-none"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
    >
      {/* Collapsed Pill */}
      <motion.div
        layout
        className={clsx(
          'glass overflow-hidden rounded-2xl transition-all',
          expanded ? 'w-80' : 'w-52',
        )}
      >
        {/* Header — always visible */}
        <div
          className="flex cursor-pointer items-center gap-2.5 px-4 py-3"
          onClick={onToggleExpand}
        >
          {/* State indicator dot */}
          <motion.div
            className={clsx('h-3 w-3 rounded-full', stateColors[state])}
            animate={
              state === 'PROCESSING'
                ? { scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }
                : state === 'LISTENING'
                  ? { scale: [1, 1.15, 1] }
                  : {}
            }
            transition={{ repeat: Infinity, duration: 1.2 }}
          />

          <span className="flex-1 text-xs font-medium text-text-primary">
            {stateLabels[state]}
          </span>

          <span className="rounded-md bg-white/5 px-1.5 py-0.5 text-[10px] text-text-muted">
            {phaseLabels[phase]}
          </span>

          {/* Panic button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={(e) => {
              e.stopPropagation();
              onPanic();
            }}
            className="flex h-6 w-6 items-center justify-center rounded-lg bg-neon-red/15 text-neon-red transition-colors hover:bg-neon-red/25"
            title="Panic Protocol (Ctrl+Shift+H)"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </motion.button>
        </div>

        {/* Expanded content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-white/5 px-3 pb-3 pt-2">
                {/* Hints */}
                {hints ? (
                  <div className="space-y-2">
                    {/* Intent */}
                    <div className="rounded-lg bg-white/5 px-2.5 py-1.5">
                      <p className="text-[10px] font-medium uppercase text-text-muted">Intent</p>
                      <p className="text-xs text-text-primary">{hints.intent}</p>
                    </div>

                    {/* Hint list */}
                    <div>
                      <p className="mb-1 text-[10px] font-medium uppercase text-text-muted">
                        Hints
                      </p>
                      <ul className="space-y-1">
                        {hints.hints.map((hint, i) => (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="flex items-start gap-1.5 text-xs text-text-secondary"
                          >
                            <span className="mt-0.5 text-neon-blue">→</span>
                            {hint}
                          </motion.li>
                        ))}
                      </ul>
                    </div>

                    {/* Rubric checklist */}
                    {hints.rubric && hints.rubric.length > 0 && (
                      <div>
                        <p className="mb-1 text-[10px] font-medium uppercase text-text-muted">
                          Rubric
                        </p>
                        <ul className="space-y-1">
                          {hints.rubric.map((item, i) => (
                            <li
                              key={i}
                              className="flex items-center gap-1.5 text-xs text-text-secondary"
                            >
                              <span className="h-3 w-3 rounded border border-white/20" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="py-3 text-center text-xs text-text-muted">
                    {state === 'LISTENING'
                      ? 'Listening for interviewer questions…'
                      : state === 'PROCESSING'
                        ? 'Analyzing context…'
                        : 'Waiting to start…'}
                  </div>
                )}

                {/* Action buttons */}
                <div className="mt-3 flex gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onAnalyze}
                    disabled={state === 'PROCESSING'}
                    className={clsx(
                      'flex-1 rounded-lg px-2 py-1.5 text-xs font-medium transition-all',
                      state === 'PROCESSING'
                        ? 'bg-white/5 text-text-muted'
                        : 'bg-neon-blue/15 text-neon-blue hover:bg-neon-blue/25',
                    )}
                  >
                    {state === 'PROCESSING' ? 'Analyzing…' : '🔍 Analyze Now'}
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onStop}
                    className="rounded-lg bg-neon-red/10 px-2 py-1.5 text-xs font-medium text-neon-red transition-colors hover:bg-neon-red/20"
                  >
                    ⬛ Stop
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};

export default GhostPill;
