// ============================================
// PrepHQ — Onboarding Flow
// Step-by-step: Permissions → API Keys → Tutorial
// ============================================

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSettingsStore } from '../stores/settings-store';

const STEPS = ['permissions', 'api-keys', 'tutorial'] as const;
type Step = (typeof STEPS)[number];

interface OnboardingProps {
  onComplete: () => void;
}

// ── Step 1: Permissions ─────────────────────

const PermissionsStep: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const { permissions, setPermission } = useSettingsStore();

  const requestMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      setPermission('microphone', true);
    } catch {
      setPermission('microphone', false);
    }
  }, [setPermission]);

  const requestCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setPermission('camera', true);
    } catch {
      setPermission('camera', false);
    }
  }, [setPermission]);

  const requestScreen = useCallback(async () => {
    try {
      // In Electron, desktopCapturer is used instead — this is a placeholder
      // Screen recording permission is granted at OS level on macOS
      setPermission('screen', true);
    } catch {
      setPermission('screen', false);
    }
  }, [setPermission]);

  const allGranted = permissions.microphone && permissions.camera && permissions.screen;

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Permissions</h2>
        <p className="mt-1 text-sm text-text-secondary">
          PrepHQ needs access to your mic, camera, and screen to work.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <PermissionRow
          icon="🎤"
          label="Microphone"
          description="Capture your voice for speech analysis"
          granted={permissions.microphone}
          onRequest={requestMicrophone}
        />
        <PermissionRow
          icon="📷"
          label="Camera"
          description="Eye tracking & posture detection"
          granted={permissions.camera}
          onRequest={requestCamera}
        />
        <PermissionRow
          icon="🖥️"
          label="Screen Recording"
          description="Ghost Mode screen context analysis"
          granted={permissions.screen}
          onRequest={requestScreen}
        />
      </div>

      <button
        onClick={onNext}
        disabled={!allGranted}
        className="mt-2 w-full rounded-xl bg-neon-blue/20 py-3 text-sm font-semibold text-neon-blue transition-all hover:bg-neon-blue/30 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {allGranted ? 'Continue →' : 'Grant all permissions to continue'}
      </button>
    </div>
  );
};

const PermissionRow: React.FC<{
  icon: string;
  label: string;
  description: string;
  granted: boolean;
  onRequest: () => void;
}> = ({ icon, label, description, granted, onRequest }) => (
  <div className="glass flex items-center justify-between rounded-xl px-4 py-3">
    <div className="flex items-center gap-3">
      <span className="text-xl">{icon}</span>
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-text-muted">{description}</p>
      </div>
    </div>
    {granted ? (
      <span className="rounded-full bg-neon-green/20 px-3 py-1 text-xs font-medium text-neon-green">
        ✓ Granted
      </span>
    ) : (
      <button
        onClick={onRequest}
        className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-text-secondary transition-colors hover:bg-white/5"
      >
        Grant
      </button>
    )}
  </div>
);

// ── Step 2: API Keys ────────────────────────

const ApiKeysStep: React.FC<{ onNext: () => void }> = ({ onNext }) => {
  const { geminiApiKey, openaiApiKey, setGeminiApiKey, setOpenaiApiKey } =
    useSettingsStore();

  const canContinue = geminiApiKey.trim().length > 0;

  const handleSave = async () => {
    // Persist keys via IPC (encrypted with safeStorage)
    if (window.api) {
      if (geminiApiKey) await window.api.setSetting('apiKey:gemini', geminiApiKey);
      if (openaiApiKey) await window.api.setSetting('apiKey:openai', openaiApiKey);
    }
    onNext();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold">API Keys</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Your keys are encrypted locally. Never sent to any third-party server.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">
            Gemini API Key <span className="text-neon-red">*required</span>
          </label>
          <input
            type="password"
            value={geminiApiKey}
            onChange={(e) => setGeminiApiKey(e.target.value)}
            placeholder="AIza..."
            className="glass w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors focus:border-neon-blue/50"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-text-secondary">
            OpenAI API Key <span className="text-text-muted">(optional — for TTS)</span>
          </label>
          <input
            type="password"
            value={openaiApiKey}
            onChange={(e) => setOpenaiApiKey(e.target.value)}
            placeholder="sk-..."
            className="glass w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors focus:border-neon-blue/50"
          />
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={!canContinue}
        className="mt-2 w-full rounded-xl bg-neon-blue/20 py-3 text-sm font-semibold text-neon-blue transition-all hover:bg-neon-blue/30 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {canContinue ? 'Save & Continue →' : 'Enter your Gemini API key'}
      </button>
    </div>
  );
};

// ── Step 3: Tutorial ────────────────────────

const tutorialSlides = [
  {
    icon: '👻',
    title: 'Ghost Mode',
    description:
      'Run alongside Zoom/Meet for real-time hints, rubrics, and a panic button during live interviews.',
  },
  {
    icon: '⚔️',
    title: 'Arena Mode',
    description:
      'Practice with AI personas, a full code editor, whiteboard, and get detailed analytics on your performance.',
  },
  {
    icon: '📊',
    title: 'Deep Analytics',
    description:
      'Eye tracking, posture detection, filler word counting, confidence scoring, and downloadable PDF reports.',
  },
];

const TutorialStep: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [slide, setSlide] = useState(0);

  const handleNext = () => {
    if (slide < tutorialSlides.length - 1) {
      setSlide(slide + 1);
    } else {
      onComplete();
    }
  };

  const current = tutorialSlides[slide];

  return (
    <div className="flex flex-col gap-6">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
          className="text-center"
        >
          <span className="text-5xl">{current.icon}</span>
          <h2 className="mt-4 text-2xl font-bold">{current.title}</h2>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            {current.description}
          </p>
        </motion.div>
      </AnimatePresence>

      {/* Dot indicators */}
      <div className="flex justify-center gap-2">
        {tutorialSlides.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${
              i === slide ? 'w-6 bg-neon-blue' : 'w-1.5 bg-white/20'
            }`}
          />
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={onComplete}
          className="flex-1 rounded-xl border border-white/10 py-3 text-sm text-text-secondary transition-colors hover:bg-white/5"
        >
          Skip
        </button>
        <button
          onClick={handleNext}
          className="flex-1 rounded-xl bg-neon-blue/20 py-3 text-sm font-semibold text-neon-blue transition-all hover:bg-neon-blue/30"
        >
          {slide < tutorialSlides.length - 1 ? 'Next →' : 'Get Started 🚀'}
        </button>
      </div>
    </div>
  );
};

// ── Main Onboarding Component ───────────────

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<Step>('permissions');

  const goTo = (next: Step) => setStep(next);

  const handleComplete = () => {
    useSettingsStore.getState().setOnboardingComplete(true);
    onComplete();
  };

  return (
    <div className="flex h-full items-center justify-center p-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass w-full max-w-md rounded-2xl p-10"
      >
        {/* Progress bar */}
        <div className="mb-8 flex gap-1">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                STEPS.indexOf(step) >= i ? 'bg-neon-blue' : 'bg-white/10'
              }`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
          >
            {step === 'permissions' && (
              <PermissionsStep onNext={() => goTo('api-keys')} />
            )}
            {step === 'api-keys' && (
              <ApiKeysStep onNext={() => goTo('tutorial')} />
            )}
            {step === 'tutorial' && (
              <TutorialStep onComplete={handleComplete} />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Onboarding;
