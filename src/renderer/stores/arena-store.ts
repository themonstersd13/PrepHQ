// ============================================
// PrepHQ — Arena Store (Zustand)
// Manages all Arena Mode renderer state
// ============================================

import { create } from 'zustand';
import type { ArenaStage, PersonaProfile } from '../../shared/types';

// Built-in personas
export const BUILT_IN_PERSONAS: PersonaProfile[] = [
  {
    id: 'faang-algo',
    name: 'The FAANG Algorithmist',
    description: 'Strict focus on optimal solutions, time/space complexity analysis, and edge cases.',
    strictness: 0.95,
    focus: 'optimization',
    interruptionFrequency: 'high',
    speechPace: 'fast',
  },
  {
    id: 'sys-design',
    name: 'The System Architect',
    description: 'Deep dives into scalability, trade-offs, CAP theorem, and distributed systems.',
    strictness: 0.8,
    focus: 'system_design',
    interruptionFrequency: 'medium',
    speechPace: 'normal',
  },
  {
    id: 'grumpy-admin',
    name: 'The Grumpy SysAdmin',
    description: 'Skeptical, asks "why not just..." questions, loves edge cases and failure modes.',
    strictness: 0.9,
    focus: 'reliability',
    interruptionFrequency: 'high',
    speechPace: 'slow',
  },
  {
    id: 'hr-manager',
    name: 'The HR Manager',
    description: 'Warm but probing. Focuses on behavioral questions, culture fit, and leadership.',
    strictness: 0.5,
    focus: 'behavioral',
    interruptionFrequency: 'low',
    speechPace: 'normal',
  },
  {
    id: 'startup-cto',
    name: 'The Startup CTO',
    description: 'Practical approach, values shipping over perfection. Asks about trade-offs and MVP thinking.',
    strictness: 0.6,
    focus: 'pragmatic',
    interruptionFrequency: 'medium',
    speechPace: 'fast',
  },
];

interface ChatMessage {
  role: 'interviewer' | 'candidate' | 'system';
  content: string;
  timestamp: number;
}

interface ArenaStore {
  // Session
  sessionId: string | null;
  isActive: boolean;

  // Persona
  selectedPersona: PersonaProfile | null;

  // Interview state machine
  stage: ArenaStage;

  // Code editor
  language: string;
  code: string;
  problemStatement: string;

  // Chat
  messages: ChatMessage[];
  isAiThinking: boolean;

  // View
  activeView: 'editor' | 'whiteboard' | 'split';

  // Timer
  elapsedSeconds: number;

  // Actions
  setSessionId: (id: string | null) => void;
  setIsActive: (active: boolean) => void;
  setSelectedPersona: (persona: PersonaProfile | null) => void;
  setStage: (stage: ArenaStage) => void;
  setLanguage: (lang: string) => void;
  setCode: (code: string) => void;
  setProblemStatement: (problem: string) => void;
  addMessage: (msg: ChatMessage) => void;
  setIsAiThinking: (thinking: boolean) => void;
  setActiveView: (view: 'editor' | 'whiteboard' | 'split') => void;
  setElapsedSeconds: (seconds: number) => void;
  reset: () => void;
}

export const useArenaStore = create<ArenaStore>((set) => ({
  sessionId: null,
  isActive: false,
  selectedPersona: null,
  stage: 'INTRO',
  language: 'python',
  code: '# Write your solution here\n',
  problemStatement: '',
  messages: [],
  isAiThinking: false,
  activeView: 'editor',
  elapsedSeconds: 0,

  setSessionId: (sessionId) => set({ sessionId }),
  setIsActive: (isActive) => set({ isActive }),
  setSelectedPersona: (selectedPersona) => set({ selectedPersona }),
  setStage: (stage) => set({ stage }),
  setLanguage: (language) => set({ language }),
  setCode: (code) => set({ code }),
  setProblemStatement: (problemStatement) => set({ problemStatement }),
  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),
  setIsAiThinking: (isAiThinking) => set({ isAiThinking }),
  setActiveView: (activeView) => set({ activeView }),
  setElapsedSeconds: (elapsedSeconds) => set({ elapsedSeconds }),
  reset: () =>
    set({
      sessionId: null,
      isActive: false,
      selectedPersona: null,
      stage: 'INTRO',
      language: 'python',
      code: '# Write your solution here\n',
      problemStatement: '',
      messages: [],
      isAiThinking: false,
      activeView: 'editor',
      elapsedSeconds: 0,
    }),
}));
