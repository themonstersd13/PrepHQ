// ============================================
// PrepHQ — Home Page (Mode Selector)
// Landing screen to choose Ghost or Arena mode
// ============================================

import React from 'react';
import { motion } from 'framer-motion';
import ThemeSwitcher from '../components/ThemeSwitcher';

interface HomePageProps {
  onSelectMode: (mode: 'GHOST' | 'ARENA') => void;
  onAnalytics?: () => void;
}

const modeCards = [
  {
    mode: 'GHOST' as const,
    title: 'Ghost Mode',
    subtitle: 'Live Interview Copilot',
    description: 'Real-time hints, rubrics, and panic protocol during live interviews.',
    icon: '👻',
    gradient: 'from-neon-blue/20 to-neon-purple/20',
    glow: 'glow-blue',
    border: 'hover:border-neon-blue/40',
  },
  {
    mode: 'ARENA' as const,
    title: 'Arena Mode',
    subtitle: 'Deep Practice Simulator',
    description: 'AI interviewer, code editor, whiteboard, and full analytics.',
    icon: '⚔️',
    gradient: 'from-neon-purple/20 to-neon-red/20',
    glow: 'glow-purple',
    border: 'hover:border-neon-purple/40',
  },
];

const HomePage: React.FC<HomePageProps> = ({ onSelectMode, onAnalytics }) => {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-12 px-10 py-12">
      {/* Theme Switcher — top right */}
      <div className="absolute top-16 right-6 z-20">
        <ThemeSwitcher />
      </div>

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center"
      >
        <h1 className="mb-3 text-5xl font-bold tracking-tight">
          Prep<span className="text-neon-blue">HQ</span>
        </h1>
        <p className="text-base text-text-secondary">
          The Ultimate Interview Intelligence Suite
        </p>
      </motion.div>

      {/* Mode Cards */}
      <div className="flex gap-8">
        {modeCards.map((card, index) => (
          <motion.button
            key={card.mode}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.15 }}
            whileHover={{ scale: 1.03, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelectMode(card.mode)}
            className={`glass group relative w-80 cursor-pointer rounded-2xl p-8 text-left transition-colors duration-300 ${card.border}`}
          >
            {/* Gradient overlay */}
            <div
              className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${card.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
            />

            <div className="relative z-10">
              <span className="text-5xl">{card.icon}</span>
              <h2 className="mt-5 text-2xl font-bold">{card.title}</h2>
              <p className="mt-1.5 text-sm font-medium text-neon-blue">
                {card.subtitle}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-text-secondary">
                {card.description}
              </p>

              {/* Feature pills */}
              <div className="mt-5 flex flex-wrap gap-2">
                {card.mode === 'GHOST' ? (
                  <>
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-text-muted">Real-time hints</span>
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-text-muted">Panic protocol</span>
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-text-muted">Voice analytics</span>
                  </>
                ) : (
                  <>
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-text-muted">AI personas</span>
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-text-muted">Code editor</span>
                    <span className="rounded-full bg-white/5 px-2.5 py-1 text-[11px] text-text-muted">Whiteboard</span>
                  </>
                )}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Footer actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex flex-col items-center gap-4"
      >
        {onAnalytics && (
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onAnalytics}
            className="rounded-xl border border-white/10 px-8 py-3 text-sm text-text-secondary transition-colors hover:bg-white/5 hover:border-white/20"
          >
            📊 View Analytics & Session History
          </motion.button>
        )}
        <p className="mt-2 text-xs text-text-muted">
          Press <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-text-secondary">Ctrl+Shift+H</kbd> at
          any time for the Panic Protocol
        </p>
      </motion.div>
    </div>
  );
};

export default HomePage;
