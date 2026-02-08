// ============================================
// PrepHQ — App Store (Zustand)
// Global transient UI state
// ============================================

import { create } from 'zustand';
import type { AppMode, GhostState, InterviewPhase } from '../../shared/types';

interface AppState {
  // Current mode
  mode: AppMode | null;
  setMode: (mode: AppMode | null) => void;

  // Ghost Mode state machine
  ghostState: GhostState;
  setGhostState: (state: GhostState) => void;

  // Interview phase
  currentPhase: InterviewPhase;
  setCurrentPhase: (phase: InterviewPhase) => void;

  // Compliance check
  complianceAccepted: boolean;
  setComplianceAccepted: (accepted: boolean) => void;

  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // Current view within Arena
  arenaView: 'editor' | 'whiteboard' | 'split';
  setArenaView: (view: 'editor' | 'whiteboard' | 'split') => void;
}

export const useAppStore = create<AppState>((set) => ({
  mode: null,
  setMode: (mode) => set({ mode }),

  ghostState: 'IDLE',
  setGhostState: (ghostState) => set({ ghostState }),

  currentPhase: 'UNKNOWN',
  setCurrentPhase: (currentPhase) => set({ currentPhase }),

  complianceAccepted: false,
  setComplianceAccepted: (complianceAccepted) => set({ complianceAccepted }),

  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),

  arenaView: 'editor',
  setArenaView: (arenaView) => set({ arenaView }),
}));
