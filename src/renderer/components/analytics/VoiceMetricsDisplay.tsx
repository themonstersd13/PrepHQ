// ============================================
// PrepHQ — Voice Metrics Display
// Shows real-time confidence / stress gauges
// ============================================

import React from 'react';
import { motion } from 'framer-motion';
import type { VoiceMetrics } from '../../../shared/types';

interface VoiceMetricsDisplayProps {
  currentMetrics: VoiceMetrics | null;
  averageConfidence: number;
  averageStress: number;
  className?: string;
}

function GaugeRing({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const pct = Math.min(value / max, 1);
  const circumference = 2 * Math.PI * 36;
  const offset = circumference * (1 - pct);

  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative h-[84px] w-[84px]">
        <svg width="84" height="84" viewBox="0 0 84 84">
          {/* Background ring */}
          <circle
            cx="42" cy="42" r="36"
            fill="none"
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="6"
          />
          {/* Value ring */}
          <motion.circle
            cx="42" cy="42" r="36"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            transform="rotate(-90 42 42)"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-bold" style={{ color }}>
            {Math.round(value)}
          </span>
        </div>
      </div>
      <span className="text-[10px] text-text-muted">{label}</span>
    </div>
  );
}

const VoiceMetricsDisplay: React.FC<VoiceMetricsDisplayProps> = ({
  currentMetrics,
  averageConfidence,
  averageStress,
  className = '',
}) => {
  return (
    <div className={className}>
      <div className="flex items-center justify-around gap-3">
        <GaugeRing
          value={currentMetrics?.confidenceScore ?? 0}
          max={100}
          color="#22c55e"
          label="Confidence"
        />
        <GaugeRing
          value={currentMetrics?.stressLevel ?? 0}
          max={100}
          color="#ef4444"
          label="Stress"
        />
      </div>

      {/* Averages bar */}
      {(averageConfidence > 0 || averageStress > 0) && (
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-16 text-[10px] text-text-muted">Avg Conf.</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full bg-neon-green"
                initial={{ width: 0 }}
                animate={{ width: `${averageConfidence}%` }}
              />
            </div>
            <span className="w-8 text-right text-[10px] text-text-muted">
              {Math.round(averageConfidence)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-16 text-[10px] text-text-muted">Avg Stress</span>
            <div className="flex-1 h-1.5 rounded-full bg-white/5">
              <motion.div
                className="h-full rounded-full bg-neon-red"
                initial={{ width: 0 }}
                animate={{ width: `${averageStress}%` }}
              />
            </div>
            <span className="w-8 text-right text-[10px] text-text-muted">
              {Math.round(averageStress)}
            </span>
          </div>
        </div>
      )}

      {/* Live detail */}
      {currentMetrics && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-text-muted">
          <div>Pitch: {Math.round(currentMetrics.pitch)} Hz</div>
          <div>Volume: {Math.round(currentMetrics.volume * 100)}%</div>
          <div>Jitter: {currentMetrics.jitter.toFixed(3)}</div>
          <div>Shimmer: {currentMetrics.shimmer.toFixed(3)}</div>
        </div>
      )}
    </div>
  );
};

export default VoiceMetricsDisplay;
