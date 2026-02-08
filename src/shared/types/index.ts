// ============================================
// PrepHQ — Shared Types (Main ↔ Renderer)
// ============================================

/** Application modes */
export type AppMode = 'GHOST' | 'ARENA';

/** Interview phases detected by the Brain */
export type InterviewPhase =
  | 'INTRODUCTION'
  | 'TECHNICAL_DSA'
  | 'SYSTEM_DESIGN'
  | 'BEHAVIORAL'
  | 'CLOSING'
  | 'UNKNOWN';

/** Speaker identity from dual-channel audio */
export type Speaker = 'USER' | 'INTERVIEWER';

/** Sentiment labels */
export type Sentiment = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';

/** Ghost Mode context state machine */
export type GhostState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SUGGESTING';

/** Arena Mode interview stages */
export type ArenaStage =
  | 'INTRO'
  | 'PROBLEM_STATEMENT'
  | 'CLARIFICATION'
  | 'DEEP_DIVE'
  | 'WRAPUP';

/** Session record (maps to SQLite Sessions table) */
export interface Session {
  id: string;
  mode: AppMode;
  timestamp: string; // ISO 8601
  videoPath?: string;
  scoreTechnical?: number;
  scoreCommunication?: number;
}

/** Transcript entry (maps to SQLite Transcripts table) */
export interface TranscriptEntry {
  sessionId: string;
  timestampOffset: number; // ms from session start
  speaker: Speaker;
  text: string;
  sentiment: Sentiment;
}

/** Biometric metric entry (maps to SQLite Metrics table) */
export interface MetricEntry {
  sessionId: string;
  timestampOffset: number;
  heartRateProxy?: number;
  fillerWordDetected?: boolean;
}

/** AI persona profile for Arena Mode */
export interface PersonaProfile {
  id: string;
  name: string;
  description: string;
  strictness: number; // 0-1
  focus: string; // e.g. "optimization", "system_design"
  interruptionFrequency: 'low' | 'medium' | 'high';
  speechPace: 'slow' | 'normal' | 'fast';
}

/** Gemini structured response from Ghost Mode */
export interface GhostHint {
  phase: InterviewPhase;
  intent: string;
  hints: string[];
  rubric?: string[];
}

/** Panic Protocol stall script */
export interface PanicResponse {
  stallScript: string;
  topic: string;
}

// ── Biometric / ML Types ────────────────────

/** Eye gaze direction estimated from face mesh iris landmarks */
export interface GazePoint {
  x: number; // 0-1 normalized
  y: number; // 0-1 normalized
  timestamp: number;
  target: 'camera' | 'screen' | 'notes' | 'other';
}

/** Posture assessment from pose landmarks */
export interface PostureSnapshot {
  timestamp: number;
  shoulderAngle: number; // degrees from horizontal
  headTilt: number; // degrees
  isSlouching: boolean;
  isExcessiveMovement: boolean;
  score: number; // 0-100
}

/** Face mesh landmark data (468 points reduced to key metrics) */
export interface FaceMeshMetrics {
  timestamp: number;
  gazeDirection: { x: number; y: number };
  mouthOpenRatio: number;
  eyeOpenRatio: { left: number; right: number };
  headPose: { pitch: number; yaw: number; roll: number };
}

/** Voice analytics snapshot */
export interface VoiceMetrics {
  timestamp: number;
  pitch: number; // Hz
  pitchVariance: number;
  volume: number; // dB (RMS)
  volumeVariance: number;
  spectralCentroid: number;
  confidenceScore: number; // 0-100
  stressLevel: number; // 0-100
  jitter: number; // pitch perturbation
  shimmer: number; // amplitude perturbation
}

/** Sentiment analysis result from ONNX model */
export interface SentimentResult {
  label: Sentiment;
  confidence: number; // 0-1
  valence: number; // -1 to 1
}

// ── P2P / Multiplayer Types ─────────────────

/** Peer connection state */
export type PeerConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

/** Multiplayer session info */
export interface MultiplayerSession {
  peerId: string;
  roomCode: string;
  role: 'host' | 'guest';
  connectionState: PeerConnectionState;
  remotePeerName?: string;
}

/** Shared editor state for Yjs sync */
export interface SharedEditorState {
  code: string;
  language: string;
  cursorPositions: Record<string, { line: number; column: number }>;
}

// ── System Audio Types ──────────────────────

/** Audio channel configuration */
export interface AudioChannelConfig {
  micStream: boolean;
  systemStream: boolean;
  echoCancellation: boolean;
}

/** Dual-channel audio frame */
export interface AudioFrame {
  micBuffer: Float32Array;
  systemBuffer: Float32Array;
  sampleRate: number;
  timestamp: number;
}
