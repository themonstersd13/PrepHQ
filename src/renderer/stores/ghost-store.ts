// ============================================
// PrepHQ — Ghost Store (Zustand)
// Manages all Ghost Mode renderer state
// ============================================

import { create } from 'zustand';
import type { GhostHint, GhostState, InterviewPhase, PanicResponse, TranscriptEntry, Speaker, Sentiment } from '../../shared/types';

interface GhostStore {
  // Session
  sessionId: string | null;
  isActive: boolean;
  complianceAccepted: boolean;

  // State machine
  ghostState: GhostState;
  currentPhase: InterviewPhase;

  // Data
  hints: GhostHint | null;
  panicResponse: PanicResponse | null;
  transcripts: TranscriptEntry[];

  // UI
  isPillExpanded: boolean;
  showCompliance: boolean;
  showPanicOverlay: boolean;

  // Actions
  setSessionId: (id: string | null) => void;
  setIsActive: (active: boolean) => void;
  setComplianceAccepted: (accepted: boolean) => void;
  setGhostState: (state: GhostState) => void;
  setCurrentPhase: (phase: InterviewPhase) => void;
  setHints: (hints: GhostHint | null) => void;
  setPanicResponse: (response: PanicResponse | null) => void;
  addTranscript: (entry: TranscriptEntry) => void;
  clearTranscripts: () => void;
  setIsPillExpanded: (expanded: boolean) => void;
  setShowCompliance: (show: boolean) => void;
  setShowPanicOverlay: (show: boolean) => void;
  reset: () => void;
}

export const useGhostStore = create<GhostStore>((set) => ({
  sessionId: null,
  isActive: false,
  complianceAccepted: false,
  ghostState: 'IDLE',
  currentPhase: 'UNKNOWN',
  hints: null,
  panicResponse: null,
  transcripts: [],
  isPillExpanded: true,
  showCompliance: true,
  showPanicOverlay: false,

  setSessionId: (sessionId) => set({ sessionId }),
  setIsActive: (isActive) => set({ isActive }),
  setComplianceAccepted: (complianceAccepted) => set({ complianceAccepted }),
  setGhostState: (ghostState) => set({ ghostState }),
  setCurrentPhase: (currentPhase) => set({ currentPhase }),
  setHints: (hints) => set({ hints }),
  setPanicResponse: (panicResponse) => set({ panicResponse }),
  addTranscript: (entry) =>
    set((state) => ({
      transcripts: [...state.transcripts.slice(-99), entry],
    })),
  clearTranscripts: () => set({ transcripts: [] }),
  setIsPillExpanded: (isPillExpanded) => set({ isPillExpanded }),
  setShowCompliance: (showCompliance) => set({ showCompliance }),
  setShowPanicOverlay: (showPanicOverlay) => set({ showPanicOverlay }),
  reset: () =>
    set({
      sessionId: null,
      isActive: false,
      ghostState: 'IDLE',
      currentPhase: 'UNKNOWN',
      hints: null,
      panicResponse: null,
      transcripts: [],
      isPillExpanded: true,
      showCompliance: true,
      showPanicOverlay: false,
    }),
}));
