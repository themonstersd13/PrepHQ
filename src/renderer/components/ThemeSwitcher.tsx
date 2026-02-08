// ============================================
// PrepHQ — Theme Switcher Component
// Allows user to toggle Dark / Light / Cyberpunk
// ============================================

import React from 'react';
import { motion } from 'framer-motion';
import { useThemeStore, type ThemeId } from '../stores/theme-store';

const themes: { id: ThemeId; label: string; icon: string }[] = [
  { id: 'dark', label: 'Dark', icon: '🌙' },
  { id: 'light', label: 'Light', icon: '☀️' },
  { id: 'cyberpunk', label: 'Cyber', icon: '⚡' },
];

interface ThemeSwitcherProps {
  className?: string;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ className }) => {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className={`flex items-center gap-1 rounded-full bg-surface-secondary p-1 ${className ?? ''}`}>
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className="relative rounded-full px-2.5 py-1 text-xs font-medium transition-colors"
          title={t.label}
        >
          {theme === t.id && (
            <motion.div
              layoutId="theme-indicator"
              className="absolute inset-0 rounded-full bg-neon-blue/20 border border-neon-blue/30"
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            />
          )}
          <span className="relative z-10">
            {t.icon} {t.label}
          </span>
        </button>
      ))}
    </div>
  );
};

export default ThemeSwitcher;
