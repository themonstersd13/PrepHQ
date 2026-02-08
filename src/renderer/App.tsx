// ============================================
// PrepHQ — Root App Component
// Routes between Onboarding → Home → Ghost / Arena / Analytics
// ============================================

import React, { useEffect, Suspense } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAppStore } from './stores/app-store';
import { useSettingsStore } from './stores/settings-store';
import { useThemeStore, applyTheme } from './stores/theme-store';
import TitleBar from './components/TitleBar';
import Onboarding from './pages/Onboarding';
import HomePage from './pages/HomePage';

// Lazy-loaded heavy pages for faster initial load
const GhostPage = React.lazy(() => import('./pages/GhostPage'));
const ArenaPage = React.lazy(() => import('./pages/ArenaPage'));
const AnalyticsPage = React.lazy(() => import('./pages/AnalyticsPage'));

type AppView = 'home' | 'ghost' | 'arena' | 'analytics';

/** Loading spinner shown while lazy pages load */
const PageLoader: React.FC = () => (
  <div className="flex h-full items-center justify-center">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
      className="h-8 w-8 rounded-full border-2 border-neon-blue/30 border-t-neon-blue"
    />
  </div>
);

const App: React.FC = () => {
  const { mode, setMode } = useAppStore();
  const { onboardingComplete, setOnboardingComplete } = useSettingsStore();
  const { theme } = useThemeStore();
  const [view, setView] = React.useState<AppView>('home');

  // Apply theme on mount and whenever theme changes
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const handleSelectMode = (m: 'GHOST' | 'ARENA') => {
    setMode(m);
    setView(m === 'GHOST' ? 'ghost' : 'arena');
  };

  const handleBack = () => {
    setMode(null);
    setView('home');
  };

  const handleAnalytics = () => setView('analytics');

  return (
    <div className="flex h-screen flex-col bg-surface-primary">
      <TitleBar />

      <main className="relative flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {!onboardingComplete && (
            <motion.div
              key="onboarding"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <Onboarding onComplete={() => setOnboardingComplete(true)} />
            </motion.div>
          )}

          {onboardingComplete && view === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <HomePage onSelectMode={handleSelectMode} onAnalytics={handleAnalytics} />
            </motion.div>
          )}

          {onboardingComplete && view === 'ghost' && (
            <motion.div
              key="ghost"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <Suspense fallback={<PageLoader />}>
                <GhostPage onBack={handleBack} />
              </Suspense>
            </motion.div>
          )}

          {onboardingComplete && view === 'arena' && (
            <motion.div
              key="arena"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <Suspense fallback={<PageLoader />}>
                <ArenaPage onBack={handleBack} />
              </Suspense>
            </motion.div>
          )}

          {onboardingComplete && view === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full"
            >
              <Suspense fallback={<PageLoader />}>
                <AnalyticsPage onBack={handleBack} />
              </Suspense>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;
