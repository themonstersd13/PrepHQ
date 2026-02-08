// ============================================
// PrepHQ — Theme Store (Zustand)
// Manages Dark / Light / Cyberpunk themes
// ============================================

import { create } from 'zustand';

export type ThemeId = 'dark' | 'light' | 'cyberpunk';

export interface ThemeTokens {
  glassBg: string;
  glassBorder: string;
  glassHover: string;
  neonBlue: string;
  neonPurple: string;
  neonGreen: string;
  neonRed: string;
  surfacePrimary: string;
  surfaceSecondary: string;
  surfaceElevated: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
}

export const THEME_DEFINITIONS: Record<ThemeId, ThemeTokens> = {
  dark: {
    glassBg: 'oklch(0.15 0.01 260 / 0.6)',
    glassBorder: 'oklch(1 0 0 / 0.1)',
    glassHover: 'oklch(1 0 0 / 0.05)',
    neonBlue: 'oklch(0.7 0.2 250)',
    neonPurple: 'oklch(0.65 0.25 300)',
    neonGreen: 'oklch(0.75 0.2 150)',
    neonRed: 'oklch(0.65 0.25 25)',
    surfacePrimary: 'oklch(0.12 0.01 260)',
    surfaceSecondary: 'oklch(0.16 0.01 260)',
    surfaceElevated: 'oklch(0.2 0.01 260)',
    textPrimary: 'oklch(0.95 0 0)',
    textSecondary: 'oklch(0.7 0 0)',
    textMuted: 'oklch(0.5 0 0)',
  },
  light: {
    glassBg: 'oklch(0.97 0.005 260 / 0.7)',
    glassBorder: 'oklch(0 0 0 / 0.08)',
    glassHover: 'oklch(0 0 0 / 0.03)',
    neonBlue: 'oklch(0.55 0.2 250)',
    neonPurple: 'oklch(0.5 0.25 300)',
    neonGreen: 'oklch(0.55 0.2 150)',
    neonRed: 'oklch(0.55 0.25 25)',
    surfacePrimary: 'oklch(0.97 0.005 260)',
    surfaceSecondary: 'oklch(0.94 0.005 260)',
    surfaceElevated: 'oklch(1 0 0)',
    textPrimary: 'oklch(0.15 0.01 260)',
    textSecondary: 'oklch(0.4 0.01 260)',
    textMuted: 'oklch(0.6 0.01 260)',
  },
  cyberpunk: {
    glassBg: 'oklch(0.1 0.03 320 / 0.7)',
    glassBorder: 'oklch(0.7 0.3 340 / 0.25)',
    glassHover: 'oklch(0.7 0.3 340 / 0.1)',
    neonBlue: 'oklch(0.75 0.25 195)',
    neonPurple: 'oklch(0.7 0.35 340)',
    neonGreen: 'oklch(0.85 0.3 140)',
    neonRed: 'oklch(0.7 0.3 25)',
    surfacePrimary: 'oklch(0.08 0.03 300)',
    surfaceSecondary: 'oklch(0.12 0.04 300)',
    surfaceElevated: 'oklch(0.16 0.04 300)',
    textPrimary: 'oklch(0.95 0.05 340)',
    textSecondary: 'oklch(0.75 0.1 195)',
    textMuted: 'oklch(0.55 0.05 300)',
  },
};

interface ThemeState {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'dark',
  setTheme: (theme) => set({ theme }),
}));

/** Apply a theme's CSS variables to the document root */
export function applyTheme(themeId: ThemeId): void {
  const tokens = THEME_DEFINITIONS[themeId];
  const root = document.documentElement;

  root.style.setProperty('--color-glass-bg', tokens.glassBg);
  root.style.setProperty('--color-glass-border', tokens.glassBorder);
  root.style.setProperty('--color-glass-hover', tokens.glassHover);
  root.style.setProperty('--color-neon-blue', tokens.neonBlue);
  root.style.setProperty('--color-neon-purple', tokens.neonPurple);
  root.style.setProperty('--color-neon-green', tokens.neonGreen);
  root.style.setProperty('--color-neon-red', tokens.neonRed);
  root.style.setProperty('--color-surface-primary', tokens.surfacePrimary);
  root.style.setProperty('--color-surface-secondary', tokens.surfaceSecondary);
  root.style.setProperty('--color-surface-elevated', tokens.surfaceElevated);
  root.style.setProperty('--color-text-primary', tokens.textPrimary);
  root.style.setProperty('--color-text-secondary', tokens.textSecondary);
  root.style.setProperty('--color-text-muted', tokens.textMuted);

  // Set a data-theme attribute for conditional styling
  root.setAttribute('data-theme', themeId);
}
