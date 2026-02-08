// ============================================
// PrepHQ — Gemini AI Service (Main Process)
// Handles all Gemini API communication
// ============================================

import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import { BrowserWindow } from 'electron';
import type { GhostHint, InterviewPhase, PanicResponse } from '../../shared/types';

let genAI: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

// ---------- Model Configuration ----------
// gemini-2.0-flash is DEPRECATED (shutdown March 31, 2026)
// Using gemini-2.5-flash (stable GA) as replacement
// Alternative: 'gemini-3-flash-preview' for cutting-edge features
const GEMINI_MODEL = 'gemini-2.5-flash';

// ---------- Rate Limiting ----------
const REQUEST_MIN_INTERVAL_MS = 1500;   // Min 1.5s between requests
const MAX_RETRIES = 3;
const BASE_BACKOFF_MS = 2000;
const MAX_BACKOFF_MS = 60000;

let lastRequestTime = 0;
let consecutiveErrors = 0;

/** System prompts per interview phase */
const GHOST_SYSTEM_PROMPT = `You are PrepHQ Ghost — a real-time interview copilot.
Your role is to analyze interviewer questions and provide RUBRICS, FRAMEWORKS, and STRUCTURAL HINTS — NOT direct answers.

RULES:
1. Never provide direct answers. Only provide frameworks, patterns, and rubrics.
2. Detect the current interview phase from context.
3. For behavioral questions, suggest STAR Method (Situation, Task, Action, Result).
4. For DSA questions, identify the pattern (Sliding Window, Two Pointers, BFS/DFS, Dynamic Programming, etc.).
5. For system design, suggest components to discuss (Load Balancing, Caching, Database, CDN, etc.).
6. Be concise — the user is in a live interview.

ALWAYS respond in this exact JSON format:
{
  "phase": "INTRODUCTION" | "TECHNICAL_DSA" | "SYSTEM_DESIGN" | "BEHAVIORAL" | "CLOSING" | "UNKNOWN",
  "intent": "<1-sentence summary of what the interviewer is asking>",
  "hints": ["<hint1>", "<hint2>", "<hint3>"],
  "rubric": ["<checklist item 1>", "<checklist item 2>"]
}`;

const PANIC_SYSTEM_PROMPT = `You are PrepHQ Panic Protocol. When triggered, generate a professional "stall" script that:
1. Buys the user 15-30 seconds of thinking time
2. Sounds natural and professional
3. Acknowledges the question/topic
4. Transitions into structured thinking

ALWAYS respond in this exact JSON format:
{
  "stallScript": "<The complete script the user should say>",
  "topic": "<Brief description of what the question is about>"
}`;

/**
 * Initialize the Gemini service with an API key
 */
export function initGemini(apiKey: string): void {
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  consecutiveErrors = 0;
  console.log(`[Gemini] Service initialized with model: ${GEMINI_MODEL}`);
}

/**
 * Check if the service is ready
 */
export function isGeminiReady(): boolean {
  return model !== null;
}

// ---------- Retry & Throttle Helpers ----------

/** Wait for minimum interval between requests */
async function throttle(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  if (elapsed < REQUEST_MIN_INTERVAL_MS) {
    await new Promise((r) => setTimeout(r, REQUEST_MIN_INTERVAL_MS - elapsed));
  }
  lastRequestTime = Date.now();
}

/** Parse retry delay from 429 error if available */
function parseRetryDelay(error: unknown): number | null {
  try {
    const msg = String(error);
    const match = msg.match(/retry\s*(?:in|Delay[":]*)\s*([\d.]+)s/i);
    if (match) return Math.ceil(parseFloat(match[1]) * 1000);
  } catch { /* ignore */ }
  return null;
}

/** Execute a Gemini API call with retry + exponential backoff */
async function withRetry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      await throttle();
      const result = await fn();
      consecutiveErrors = 0; // reset on success
      return result;
    } catch (error: unknown) {
      lastError = error;
      const errStr = String(error);
      const is429 = errStr.includes('429') || errStr.includes('Too Many Requests') || errStr.includes('quota');
      const is503 = errStr.includes('503') || errStr.includes('overloaded');

      if (!is429 && !is503) {
        // Non-retryable error — throw immediately
        throw error;
      }

      consecutiveErrors++;

      if (attempt < MAX_RETRIES) {
        // Use server-suggested delay or exponential backoff
        const serverDelay = parseRetryDelay(error);
        const expBackoff = Math.min(BASE_BACKOFF_MS * Math.pow(2, attempt), MAX_BACKOFF_MS);
        const delay = serverDelay ?? expBackoff;

        console.warn(
          `[Gemini] ${label} — 429/503 on attempt ${attempt + 1}/${MAX_RETRIES + 1}, retrying in ${Math.round(delay / 1000)}s...`
        );

        // Notify renderer about rate limiting
        notifyRateLimit(delay, attempt + 1, MAX_RETRIES + 1);

        await new Promise((r) => setTimeout(r, delay));
      }
    }
  }

  // All retries exhausted
  console.error(`[Gemini] ${label} — all ${MAX_RETRIES + 1} attempts failed`);
  throw lastError;
}

/** Notify renderer about rate-limit status */
function notifyRateLimit(delayMs: number, attempt: number, maxAttempts: number): void {
  try {
    const wins = BrowserWindow.getAllWindows();
    if (wins.length > 0 && !wins[0].isDestroyed()) {
      wins[0].webContents.send('gemini:rate-limited', {
        delayMs,
        attempt,
        maxAttempts,
        message: `API rate limited — retrying in ${Math.round(delayMs / 1000)}s (attempt ${attempt}/${maxAttempts})`,
      });
    }
  } catch { /* non-critical */ }
}

/**
 * Analyze interview context and return hints
 */
export async function analyzeContext(
  transcriptContext: string,
  currentPhase: InterviewPhase,
): Promise<GhostHint> {
  if (!model) {
    throw new Error('Gemini not initialized. Please set API key first.');
  }

  try {
    const prompt = `${GHOST_SYSTEM_PROMPT}

Current detected phase: ${currentPhase}

Recent conversation transcript:
${transcriptContext}

Analyze the above and provide your structured response:`;

    const result = await withRetry(
      () => model!.generateContent(prompt),
      'analyzeContext',
    );
    const text = result.response.text();

    // Extract JSON from response (handle markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        phase: currentPhase,
        intent: 'Unable to parse response',
        hints: ['Listen carefully and ask for clarification if needed'],
      };
    }

    const parsed = JSON.parse(jsonMatch[0]) as GhostHint;
    return parsed;
  } catch (error) {
    const errStr = String(error);
    const isQuota = errStr.includes('429') || errStr.includes('quota');
    console.error('[Gemini] analyzeContext error:', error);
    return {
      phase: currentPhase,
      intent: isQuota
        ? '⚠️ API quota exceeded — free tier daily limit reached'
        : 'Analysis error — check API key',
      hints: isQuota
        ? [
            'Free tier daily quota exhausted. Wait for reset at midnight PT.',
            'Or upgrade to a paid plan at https://aistudio.google.com/apikey',
            'You can still practice — hints will resume when quota resets.',
          ]
        : ['Stay calm and ask the interviewer to repeat if needed'],
    };
  }
}

/**
 * Generate a panic stall script
 */
export async function generatePanicScript(
  recentTranscript: string,
): Promise<PanicResponse> {
  if (!model) {
    return {
      stallScript:
        "That's a great question. Let me take a moment to organize my thoughts and consider the key aspects before diving in.",
      topic: 'General',
    };
  }

  try {
    const prompt = `${PANIC_SYSTEM_PROMPT}

The most recent conversation context:
${recentTranscript || 'No transcript available yet — generate a generic professional stall script.'}

Generate the stall script:`;

    const result = await withRetry(
      () => model!.generateContent(prompt),
      'generatePanicScript',
    );
    const text = result.response.text();

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return {
        stallScript:
          "That's an excellent point. Let me take a moment to structure my thoughts around the key considerations here.",
        topic: 'Unknown',
      };
    }

    return JSON.parse(jsonMatch[0]) as PanicResponse;
  } catch (error) {
    console.error('[Gemini] generatePanicScript error:', error);
    return {
      stallScript:
        "That's a really insightful question. I want to make sure I give it the consideration it deserves. Let me think through the main dimensions of this problem.",
      topic: 'Error fallback',
    };
  }
}

/**
 * Detect interview phase from transcript
 */
export async function detectPhase(
  transcript: string,
): Promise<InterviewPhase> {
  if (!model) return 'UNKNOWN';

  try {
    const prompt = `Analyze this interview transcript and determine the current phase.
Respond with ONLY one of: INTRODUCTION, TECHNICAL_DSA, SYSTEM_DESIGN, BEHAVIORAL, CLOSING, UNKNOWN

Transcript:
${transcript}

Phase:`;

    const result = await withRetry(
      () => model!.generateContent(prompt),
      'detectPhase',
    );
    const text = result.response.text().trim().toUpperCase();

    const validPhases: InterviewPhase[] = [
      'INTRODUCTION', 'TECHNICAL_DSA', 'SYSTEM_DESIGN',
      'BEHAVIORAL', 'CLOSING', 'UNKNOWN',
    ];

    const detected = validPhases.find((p) => text.includes(p));
    return detected ?? 'UNKNOWN';
  } catch {
    return 'UNKNOWN';
  }
}

/**
 * Generate AI interviewer response for Arena Mode
 */
export async function generateInterviewerResponse(
  personaPrompt: string,
  conversationHistory: string,
  stage: string,
): Promise<string> {
  if (!model) {
    throw new Error('Gemini not initialized');
  }

  const prompt = `${personaPrompt}

Current interview stage: ${stage}

Conversation so far:
${conversationHistory}

Respond as the interviewer. Keep it natural and conversational. If at PROBLEM_STATEMENT stage, present a coding problem. If at DEEP_DIVE stage, ask probing follow-up questions.`;

  const result = await withRetry(
    () => model!.generateContent(prompt),
    'generateInterviewerResponse',
  );
  return result.response.text();
}

/**
 * Analyze whiteboard drawing for Arena Mode
 */
export async function analyzeWhiteboard(
  imageBase64: string,
  context: string,
): Promise<string> {
  if (!genAI || !model) {
    throw new Error('Gemini not initialized');
  }

  const visionModel = genAI.getGenerativeModel({ model: GEMINI_MODEL });

  const result = await withRetry(
    () => visionModel.generateContent([
      {
        inlineData: {
          mimeType: 'image/png',
          data: imageBase64,
        },
      },
      `You are a system design interviewer reviewing a candidate's whiteboard diagram.
Context: ${context}

Look at this system design diagram and ask ONE probing follow-up question about something missing or worth discussing.
Keep it brief and natural.`,
    ]),
    'analyzeWhiteboard',
  );

  return result.response.text();
}
