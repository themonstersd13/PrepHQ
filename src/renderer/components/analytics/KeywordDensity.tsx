// ============================================
// PrepHQ — Keyword Density Display Component
// Shows keyword coverage as a tag cloud / bar chart
// ============================================

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { KeywordDensityResult } from '../../services/content-auditor';

interface KeywordDensityProps {
  data: KeywordDensityResult | null;
  className?: string;
}

const categoryColors: Record<string, string> = {
  'Complexity': 'bg-neon-blue/20 text-neon-blue',
  'Data Structures': 'bg-neon-purple/20 text-neon-purple',
  'Algorithms': 'bg-neon-green/20 text-neon-green',
  'System Design': 'bg-yellow-500/20 text-yellow-400',
  'Trade-offs': 'bg-orange-500/20 text-orange-400',
  'Edge Cases': 'bg-neon-red/20 text-neon-red',
  'Communication': 'bg-cyan-500/20 text-cyan-400',
};

const KeywordDensity: React.FC<KeywordDensityProps> = ({ data, className }) => {
  if (!data || data.totalHits === 0) {
    return (
      <div className={`glass-subtle rounded-xl p-3 text-center ${className ?? ''}`}>
        <p className="text-xs text-text-muted">No keywords detected yet…</p>
      </div>
    );
  }

  return (
    <div className={`glass-subtle rounded-xl p-4 ${className ?? ''}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-text-primary">📊 Keyword Coverage</h4>
        <span className="text-xs text-text-muted">
          {data.categoriesCovered}/7 categories
        </span>
      </div>

      {/* Category bars */}
      <div className="space-y-2 mb-3">
        {Object.entries(data.byCategory)
          .sort(([, a], [, b]) => b.totalHits - a.totalHits)
          .slice(0, 5)
          .map(([category, { totalHits }]) => {
            const maxHits = Math.max(...Object.values(data.byCategory).map((c) => c.totalHits));
            const width = Math.max(8, (totalHits / maxHits) * 100);
            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[10px] text-text-secondary">{category}</span>
                  <span className="text-[10px] font-bold text-text-primary">{totalHits}</span>
                </div>
                <div className="h-1.5 rounded-full bg-surface-secondary overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${width}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="h-full rounded-full bg-neon-blue"
                  />
                </div>
              </div>
            );
          })}
      </div>

      {/* Tag cloud */}
      <div className="flex flex-wrap gap-1">
        <AnimatePresence>
          {data.topKeywords.slice(0, 10).map((kw) => (
            <motion.span
              key={kw.keyword}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${categoryColors[kw.category] ?? 'bg-white/10 text-text-secondary'
                }`}
            >
              {kw.keyword}
              <span className="opacity-60">×{kw.count}</span>
            </motion.span>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default KeywordDensity;
