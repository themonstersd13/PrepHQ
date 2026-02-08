// ============================================
// PrepHQ — Audio Analysis Worker (Web Worker)
// Runs Meyda audio feature extraction off main thread
// for voice confidence scoring & stress detection
// ============================================
export {}; // Make this a module to isolate types

interface AudioWorkerMessage {
  type: 'init' | 'process-buffer' | 'stop';
  payload?: any;
}

interface AudioWorkerResponse {
  type: 'ready' | 'voice-metrics' | 'error';
  payload?: any;
}

let Meyda: any = null;
let isInitialized = false;

// Running statistics for variance computation
let pitchHistory: number[] = [];
let volumeHistory: number[] = [];
const HISTORY_MAX = 100;

/**
 * Initialize Meyda
 */
async function initMeyda() {
  try {
    Meyda = await import('meyda');
    isInitialized = true;
    pitchHistory = [];
    volumeHistory = [];
    self.postMessage({ type: 'ready' } as AudioWorkerResponse);
  } catch (err: any) {
    self.postMessage({
      type: 'error',
      payload: { message: `Meyda init failed: ${err.message}` },
    } as AudioWorkerResponse);
  }
}

/**
 * Estimate pitch using autocorrelation method
 */
function estimatePitch(buffer: Float32Array, sampleRate: number): number {
  // Simple autocorrelation pitch detection
  const minFreq = 50;
  const maxFreq = 500;
  const minPeriod = Math.floor(sampleRate / maxFreq);
  const maxPeriod = Math.floor(sampleRate / minFreq);

  let bestCorrelation = -1;
  let bestPeriod = 0;

  for (let period = minPeriod; period < Math.min(maxPeriod, buffer.length / 2); period++) {
    let correlation = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < buffer.length - period; i++) {
      correlation += buffer[i] * buffer[i + period];
      norm1 += buffer[i] * buffer[i];
      norm2 += buffer[i + period] * buffer[i + period];
    }

    const normalizedCorrelation = correlation / (Math.sqrt(norm1 * norm2) + 1e-10);

    if (normalizedCorrelation > bestCorrelation) {
      bestCorrelation = normalizedCorrelation;
      bestPeriod = period;
    }
  }

  if (bestCorrelation < 0.3 || bestPeriod === 0) return 0;
  return sampleRate / bestPeriod;
}

/**
 * Compute jitter (pitch perturbation) — indicator of vocal stress
 */
function computeJitter(pitchValues: number[]): number {
  if (pitchValues.length < 3) return 0;
  const voiced = pitchValues.filter((p) => p > 0);
  if (voiced.length < 3) return 0;

  let sumDiff = 0;
  for (let i = 1; i < voiced.length; i++) {
    sumDiff += Math.abs(voiced[i] - voiced[i - 1]);
  }
  const meanDiff = sumDiff / (voiced.length - 1);
  const meanPitch = voiced.reduce((a, b) => a + b, 0) / voiced.length;

  return meanPitch > 0 ? (meanDiff / meanPitch) * 100 : 0;
}

/**
 * Compute shimmer (amplitude perturbation) — vocal stability
 */
function computeShimmer(rmsValues: number[]): number {
  if (rmsValues.length < 3) return 0;

  let sumDiff = 0;
  for (let i = 1; i < rmsValues.length; i++) {
    sumDiff += Math.abs(rmsValues[i] - rmsValues[i - 1]);
  }
  const meanDiff = sumDiff / (rmsValues.length - 1);
  const meanRMS = rmsValues.reduce((a, b) => a + b, 0) / rmsValues.length;

  return meanRMS > 0 ? (meanDiff / meanRMS) * 100 : 0;
}

/**
 * Compute variance of array
 */
function variance(arr: number[]): number {
  if (arr.length < 2) return 0;
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  return arr.reduce((sum, val) => sum + (val - mean) ** 2, 0) / (arr.length - 1);
}

/**
 * Compute voice confidence score from audio features
 * Confident speech: steady pitch, moderate volume, low jitter/shimmer
 */
function computeConfidence(
  pitch: number,
  pitchVar: number,
  volume: number,
  volumeVar: number,
  jitter: number,
  shimmer: number,
): number {
  let score = 50;

  // Steady pitch = confident (low variance is good)
  if (pitchVar < 500) score += 15;
  else if (pitchVar < 1500) score += 5;
  else score -= 10;

  // Good volume range (not too quiet, not screaming)
  if (volume > -30 && volume < -5) score += 15;
  else if (volume > -40) score += 5;
  else score -= 10;

  // Low volume variance = consistent projection
  if (volumeVar < 50) score += 10;
  else score -= 5;

  // Low jitter = steady voice
  if (jitter < 1.5) score += 10;
  else if (jitter < 3) score += 0;
  else score -= 15;

  // Low shimmer = stable amplitude
  if (shimmer < 3) score += 10;
  else if (shimmer < 6) score += 0;
  else score -= 10;

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Compute stress level from voice features
 * Stressed speech: high pitch, high jitter/shimmer, erratic volume
 */
function computeStress(
  pitch: number,
  pitchVar: number,
  jitter: number,
  shimmer: number,
  spectralCentroid: number,
): number {
  let stress = 20; // baseline

  // High pitch variance = stress
  if (pitchVar > 2000) stress += 20;
  else if (pitchVar > 1000) stress += 10;

  // High jitter = vocal tension
  if (jitter > 3) stress += 20;
  else if (jitter > 1.5) stress += 10;

  // High shimmer = tremor
  if (shimmer > 6) stress += 15;
  else if (shimmer > 3) stress += 8;

  // High spectral centroid = tense vocal quality
  if (spectralCentroid > 3000) stress += 15;
  else if (spectralCentroid > 2000) stress += 5;

  return Math.max(0, Math.min(100, Math.round(stress)));
}

/**
 * Process an audio buffer and extract voice metrics
 */
function processBuffer(buffer: Float32Array, sampleRate: number, timestamp: number) {
  if (!isInitialized || !Meyda) return;

  try {
    // Use Meyda to extract features
    const bufferSize = 512;
    const features = Meyda.default?.extract
      ? Meyda.default.extract(
          ['rms', 'spectralCentroid', 'spectralFlatness', 'zcr'],
          buffer.slice(0, bufferSize),
        )
      : Meyda.extract?.(
          ['rms', 'spectralCentroid', 'spectralFlatness', 'zcr'],
          buffer.slice(0, bufferSize),
        );

    if (!features) return;

    const pitch = estimatePitch(buffer, sampleRate);
    const volume = features.rms > 0 ? 20 * Math.log10(features.rms) : -60;
    const spectralCentroid = features.spectralCentroid || 0;

    // Update histories
    pitchHistory.push(pitch);
    volumeHistory.push(volume);
    if (pitchHistory.length > HISTORY_MAX) pitchHistory.shift();
    if (volumeHistory.length > HISTORY_MAX) volumeHistory.shift();

    const pitchVar = variance(pitchHistory.filter((p) => p > 0));
    const volumeVar = variance(volumeHistory);
    const jitter = computeJitter(pitchHistory.slice(-20));
    const shimmer = computeShimmer(volumeHistory.slice(-20).map((v) => Math.pow(10, v / 20)));

    const confidenceScore = computeConfidence(pitch, pitchVar, volume, volumeVar, jitter, shimmer);
    const stressLevel = computeStress(pitch, pitchVar, jitter, shimmer, spectralCentroid);

    self.postMessage({
      type: 'voice-metrics',
      payload: {
        timestamp,
        pitch: Math.round(pitch),
        pitchVariance: Math.round(pitchVar),
        volume: Math.round(volume * 10) / 10,
        volumeVariance: Math.round(volumeVar * 10) / 10,
        spectralCentroid: Math.round(spectralCentroid),
        confidenceScore,
        stressLevel,
        jitter: Math.round(jitter * 100) / 100,
        shimmer: Math.round(shimmer * 100) / 100,
      },
    } as AudioWorkerResponse);
  } catch (err: any) {
    // Silently skip processing errors
  }
}

// ── Worker Message Handler ──────────────────

self.onmessage = async (event: MessageEvent<AudioWorkerMessage>) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'init':
      await initMeyda();
      break;
    case 'process-buffer':
      if (payload?.buffer && payload?.sampleRate) {
        processBuffer(
          new Float32Array(payload.buffer),
          payload.sampleRate,
          payload.timestamp || Date.now(),
        );
      }
      break;
    case 'stop':
      pitchHistory = [];
      volumeHistory = [];
      isInitialized = false;
      break;
  }
};
