// ============================================
// PrepHQ — Persona Selector
// Choose AI interviewer persona before Arena session
// ============================================

import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import type { PersonaProfile } from '../../../shared/types';
import { BUILT_IN_PERSONAS } from '../../stores/arena-store';
import { GlassButton } from '../ui';

interface PersonaSelectorProps {
  onSelect: (persona: PersonaProfile) => void;
  onBack: () => void;
}

const focusIcons: Record<string, string> = {
  optimization: '⚡',
  system_design: '🏗️',
  reliability: '🔒',
  behavioral: '💬',
  pragmatic: '🚀',
};

const PersonaSelector: React.FC<PersonaSelectorProps> = ({ onSelect, onBack }) => {
  return (
    <div className="flex h-full flex-col items-center justify-center px-10 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl"
      >
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-text-primary">Choose Your Interviewer</h2>
          <p className="mt-3 text-sm text-text-secondary">
            Each persona has different focus areas, strictness, and interview styles
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {BUILT_IN_PERSONAS.map((persona, index) => (
            <motion.button
              key={persona.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onSelect(persona)}
              className="glass group rounded-xl p-6 text-left transition-all hover:border-neon-blue/30"
            >
              <div className="mb-3 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/5 text-2xl">
                  {focusIcons[persona.focus] || '🎯'}
                </span>
                <div>
                  <h3 className="text-base font-semibold text-text-primary group-hover:text-neon-blue">
                    {persona.name}
                  </h3>
                  <p className="text-[11px] text-text-muted capitalize">{persona.focus.replace('_', ' ')}</p>
                </div>
              </div>
              <p className="mb-4 text-xs leading-relaxed text-text-secondary">
                {persona.description}
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-text-muted">
                  🎯 Strictness: {Math.round(persona.strictness * 100)}%
                </span>
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-text-muted">
                  🗣️ Pace: {persona.speechPace}
                </span>
                <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-text-muted">
                  ⚠️ Interrupts: {persona.interruptionFrequency}
                </span>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="mt-10 text-center">
          <GlassButton variant="ghost" size="md" onClick={onBack}>
            ← Back to Home
          </GlassButton>
        </div>
      </motion.div>
    </div>
  );
};

export default PersonaSelector;
