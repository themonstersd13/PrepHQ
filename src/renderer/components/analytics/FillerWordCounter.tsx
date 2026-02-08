// ============================================
// PrepHQ — Filler Word Counter Component
// Displays real-time filler word counts during sessions
// ============================================

import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { FillerAnalysis } from '../../services/filler-word-analyzer';

interface FillerWordCounterProps {
  analysis: FillerAnalysis | null;
  compact?: boolean;
  className?: string;
}

const gradeColors: Record<string, string> = {
  EXCELLENT: 'text-neon-green',
  GOOD: 'text-neon-blue',
  FAIR: 'text-yellow-400',
  POOR: 'text-neon-red',
};

const gradeLabels: Record<string, string> = {
  EXCELLENT: '🟢 Excellent',
  GOOD: '🔵 Good',
  FAIR: '🟡 Fair',
  POOR: '🔴 Needs Work',
};

const FillerWordCounter: React.FC<FillerWordCounterProps> = ({ analysis, compact, className }) => {
  if (!analysis || analysis.totalWords === 0) {
    return compact ? null : (
      <div className={`glass-subtle rounded-xl p-3 text-center ${className ?? ''}`}>
        <p className="text-xs text-text-muted">Listening for filler words…</p>
      </div>
    );
  }

  const ratioPercent = (analysis.fillerRatio * 100).toFixed(1);

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`flex items-center gap-2 ${className ?? ''}`}
      >
        <span className={`text-sm font-bold ${gradeColors[analysis.grade]}`}>
          {analysis.totalFillers}
        </span>
        <span className="text-[10px] text-text-muted">fillers</span>
      </motion.div>
    );
  }

  return (
    <div className={`glass-subtle rounded-xl p-4 ${className ?? ''}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-text-primary">🗣️ Filler Words</h4>
        <span className={`text-xs font-medium ${gradeColors[analysis.grade]}`}>
          {gradeLabels[analysis.grade]}
        </span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <div className="text-center">
          <p className="text-lg font-bold text-neon-red">{analysis.totalFillers}</p>
          <p className="text-[9px] text-text-muted">Total</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-neon-blue">{analysis.totalWords}</p>
          <p className="text-[9px] text-text-muted">Words</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-neon-purple">{ratioPercent}%</p>
          <p className="text-[9px] text-text-muted">Ratio</p>
        </div>
      </div>

      {/* Individual fillers */}
      <div className="space-y-1">
        <AnimatePresence>
          {analysis.fillers.slice(0, 6).map((f) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-between rounded-md bg-surface-secondary/50 px-2 py-1"
            >
              <span className="text-xs text-text-secondary">"{f.label}"</span>
              <span className="text-xs font-bold text-text-primary">{f.count}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default FillerWordCounter;
