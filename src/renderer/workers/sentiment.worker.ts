// ============================================
// PrepHQ — Sentiment Analysis Worker (Web Worker)
// Runs lightweight ONNX sentiment model off main thread
// ============================================
export {}; // Make this a module to isolate types

interface SentimentWorkerMessage {
  type: 'init' | 'analyze' | 'stop';
  payload?: any;
}

interface SentimentWorkerResponse {
  type: 'ready' | 'sentiment-result' | 'error';
  payload?: any;
}

let ortSession: any = null;
let isInitialized = false;

// Simple lexicon-based sentiment as primary fallback
// (ONNX model is optional enhancement)
const POSITIVE_WORDS = new Set([
  'great', 'good', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome',
  'love', 'enjoy', 'happy', 'excited', 'confident', 'strong', 'clear',
  'interesting', 'perfect', 'best', 'brilliant', 'impressive', 'outstanding',
  'efficient', 'elegant', 'optimal', 'innovative', 'powerful', 'robust',
  'scalable', 'reliable', 'secure', 'fast', 'simple', 'clean',
  'absolutely', 'definitely', 'certainly', 'exactly', 'precisely',
  'solved', 'optimized', 'improved', 'achieved', 'succeeded', 'completed',
]);

const NEGATIVE_WORDS = new Set([
  'bad', 'terrible', 'awful', 'horrible', 'poor', 'worst', 'hate',
  'confused', 'stuck', 'difficult', 'hard', 'struggle', 'fail',
  'unsure', 'maybe', 'probably', 'uncertain', 'worried', 'nervous',
  'wrong', 'error', 'bug', 'broken', 'crash', 'slow', 'complex',
  'unfortunately', 'honestly', 'actually', 'basically', 'sorry',
  'forgot', 'missed', 'overlooked', 'mistake', 'problem', 'issue',
  'dont know', "don't know", 'not sure', 'no idea', 'confused',
]);

const HEDGING_PHRASES = [
  'i think', 'i guess', 'i believe', 'sort of', 'kind of',
  'maybe', 'probably', 'possibly', 'not sure', 'i hope',
  'to be honest', 'honestly', 'actually', 'basically',
];

/**
 * Initialize ONNX runtime (optional — falls back to lexicon)
 */
async function initOrt() {
  try {
    const ort = await import('onnxruntime-web');
    // Note: In production you'd load a real sentiment model
    // For now we use the robust lexicon-based approach
    // and the ONNX infra is ready for a real model
    isInitialized = true;
    self.postMessage({ type: 'ready' } as SentimentWorkerResponse);
  } catch (err: any) {
    // ONNX init is optional — lexicon analysis still works
    console.warn('[Sentiment Worker] ONNX not available, using lexicon:', err.message);
    isInitialized = true;
    self.postMessage({ type: 'ready' } as SentimentWorkerResponse);
  }
}

/**
 * Analyze sentiment of a text segment using lexicon + heuristics
 */
function analyzeSentiment(text: string, timestamp: number) {
  if (!isInitialized) return;

  const lower = text.toLowerCase();
  const words = lower.split(/\s+/);

  let positiveCount = 0;
  let negativeCount = 0;
  let hedgingCount = 0;

  // Word-level sentiment
  for (const word of words) {
    const clean = word.replace(/[^a-z']/g, '');
    if (POSITIVE_WORDS.has(clean)) positiveCount++;
    if (NEGATIVE_WORDS.has(clean)) negativeCount++;
  }

  // Phrase-level hedging detection
  for (const phrase of HEDGING_PHRASES) {
    if (lower.includes(phrase)) hedgingCount++;
  }

  // Negation handling: "not good" should flip sentiment
  const negationPatterns = /\b(not|no|never|neither|nor|don't|doesn't|didn't|won't|wouldn't|couldn't|shouldn't|can't|isn't|aren't|wasn't|weren't)\s+(\w+)/gi;
  let match;
  while ((match = negationPatterns.exec(lower)) !== null) {
    const negatedWord = match[2];
    if (POSITIVE_WORDS.has(negatedWord)) {
      positiveCount--;
      negativeCount++;
    } else if (NEGATIVE_WORDS.has(negatedWord)) {
      negativeCount--;
      positiveCount++;
    }
  }

  // Compute valence (-1 to 1)
  const totalSignals = positiveCount + negativeCount + hedgingCount + 1;
  const rawValence = (positiveCount - negativeCount - hedgingCount * 0.3) / totalSignals;
  const valence = Math.max(-1, Math.min(1, rawValence));

  // Confidence: how sure are we about this assessment
  const confidence = Math.min(1, (positiveCount + negativeCount + hedgingCount) / Math.max(words.length * 0.3, 1));

  // Classify
  let label: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
  if (valence > 0.15) label = 'POSITIVE';
  else if (valence < -0.15) label = 'NEGATIVE';
  else label = 'NEUTRAL';

  self.postMessage({
    type: 'sentiment-result',
    payload: {
      label,
      confidence: Math.round(confidence * 100) / 100,
      valence: Math.round(valence * 100) / 100,
      timestamp,
      details: {
        positiveCount,
        negativeCount,
        hedgingCount,
        wordCount: words.length,
      },
    },
  } as SentimentWorkerResponse);
}

// ── Worker Message Handler ──────────────────────────────────

self.onmessage = async (event: MessageEvent<SentimentWorkerMessage>) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'init':
      await initOrt();
      break;
    case 'analyze':
      if (payload?.text) {
        analyzeSentiment(payload.text, payload.timestamp || Date.now());
      }
      break;
    case 'stop':
      ortSession = null;
      isInitialized = false;
      break;
  }
};
