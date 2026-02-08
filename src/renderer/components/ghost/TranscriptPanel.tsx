// ============================================
// PrepHQ — Transcript Panel
// Live transcript feed for Ghost Mode
// ============================================

import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import type { TranscriptEntry } from '../../../shared/types';

interface TranscriptPanelProps {
  transcripts: TranscriptEntry[];
  className?: string;
}

const TranscriptPanel: React.FC<TranscriptPanelProps> = ({ transcripts, className }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcripts.length]);

  return (
    <div className={clsx('flex flex-col', className)}>
      <div className="mb-2 flex items-center justify-between px-1">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted">
          Live Transcript
        </h3>
        <span className="text-[10px] text-text-muted">
          {transcripts.length} entries
        </span>
      </div>

      <div className="glass-subtle flex-1 overflow-y-auto rounded-xl p-3">
        {transcripts.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-xs text-text-muted">
              Transcript will appear here when speech is detected…
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {transcripts.map((entry, index) => (
                <motion.div
                  key={`${entry.timestampOffset}-${index}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-2"
                >
                  {/* Speaker badge */}
                  <span
                    className={clsx(
                      'mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold',
                      entry.speaker === 'INTERVIEWER'
                        ? 'bg-neon-purple/15 text-neon-purple'
                        : 'bg-neon-blue/15 text-neon-blue',
                    )}
                  >
                    {entry.speaker === 'INTERVIEWER' ? 'INT' : 'YOU'}
                  </span>

                  <div className="flex-1">
                    <p className="text-xs leading-relaxed text-text-secondary">{entry.text}</p>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className="text-[9px] text-text-muted">
                        {formatTimestamp(entry.timestampOffset)}
                      </span>
                      <span
                        className={clsx(
                          'text-[9px]',
                          entry.sentiment === 'POSITIVE' && 'text-neon-green',
                          entry.sentiment === 'NEUTRAL' && 'text-text-muted',
                          entry.sentiment === 'NEGATIVE' && 'text-neon-red',
                        )}
                      >
                        {entry.sentiment === 'POSITIVE' && '😊'}
                        {entry.sentiment === 'NEUTRAL' && '😐'}
                        {entry.sentiment === 'NEGATIVE' && '😟'}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            <div ref={bottomRef} />
          </div>
        )}
      </div>
    </div>
  );
};

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default TranscriptPanel;
