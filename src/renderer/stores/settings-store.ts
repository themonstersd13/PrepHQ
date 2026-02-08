// ============================================
// PrepHQ — Settings Store (Zustand)
// Manages API keys and app preferences
// ============================================

import { create } from 'zustand';

interface SettingsState {
  // API Keys
  geminiApiKey: string;
  openaiApiKey: string;
  setGeminiApiKey: (key: string) => void;
  setOpenaiApiKey: (key: string) => void;

  // Onboarding
  onboardingComplete: boolean;
  setOnboardingComplete: (complete: boolean) => void;

  // Permissions status
  permissions: {
    microphone: boolean;
    camera: boolean;
    screen: boolean;
  };
  setPermission: (type: 'microphone' | 'camera' | 'screen', granted: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  geminiApiKey: '',
  openaiApiKey: '',
  setGeminiApiKey: (geminiApiKey) => set({ geminiApiKey }),
  setOpenaiApiKey: (openaiApiKey) => set({ openaiApiKey }),

  onboardingComplete: false,
  setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),

  permissions: {
    microphone: false,
    camera: false,
    screen: false,
  },
  setPermission: (type, granted) =>
    set((s) => ({
      permissions: { ...s.permissions, [type]: granted },
    })),
}));
