// ============================================
// PrepHQ — Filler Word Analyzer
// Detects and counts filler words from transcript text
// ============================================

/** Patterns to detect common filler words/phrases */
const FILLER_PATTERNS: { label: string; pattern: RegExp }[] = [
  { label: 'Um', pattern: /\bum+\b/gi },
  { label: 'Uh', pattern: /\buh+\b/gi },
  { label: 'Ah', pattern: /\bah+\b/gi },
  { label: 'Like', pattern: /\blike\b(?!\s+(a|the|this|that|it|to|my|your))/gi },
  { label: 'You know', pattern: /\byou know\b/gi },
  { label: 'So', pattern: /(?:^|\.\s+)\bso\b(?:\s*,)/gi },
  { label: 'Actually', pattern: /\bactually\b/gi },
  { label: 'Basically', pattern: /\bbasically\b/gi },
  { label: 'I mean', pattern: /\bi mean\b/gi },
  { label: 'Sort of', pattern: /\bsort of\b/gi },
  { label: 'Kind of', pattern: /\bkind of\b/gi },
  { label: 'Right', pattern: /\bright\b(?:\s*[,?])/gi },
];

export interface FillerWordResult {
  label: string;
  count: number;
}

export interface FillerAnalysis {
  /** Filler words found, sorted by count desc */
  fillers: FillerWordResult[];
  /** Total filler word count */
  totalFillers: number;
  /** Total word count in analyzed text */
  totalWords: number;
  /** Filler-to-word ratio (0-1) */
  fillerRatio: number;
  /** Grade: EXCELLENT, GOOD, FAIR, POOR */
  grade: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
}

/**
 * Analyze text for filler words.
 * Can be used on individual transcript entries or cumulative text.
 */
export function analyzeFillerWords(text: string): FillerAnalysis {
  const totalWords = text.split(/\s+/).filter(Boolean).length;

  const fillers: FillerWordResult[] = FILLER_PATTERNS.map(({ label, pattern }) => {
    const matches = text.match(pattern);
    return { label, count: matches ? matches.length : 0 };
  })
    .filter((f) => f.count > 0)
    .sort((a, b) => b.count - a.count);

  const totalFillers = fillers.reduce((sum, f) => sum + f.count, 0);
  const fillerRatio = totalWords > 0 ? totalFillers / totalWords : 0;

  let grade: FillerAnalysis['grade'];
  if (fillerRatio < 0.02) grade = 'EXCELLENT';
  else if (fillerRatio < 0.05) grade = 'GOOD';
  else if (fillerRatio < 0.1) grade = 'FAIR';
  else grade = 'POOR';

  return { fillers, totalFillers, totalWords, fillerRatio, grade };
}

/**
 * Incremental filler word counter for real-time usage.
 * Maintains a running count across multiple transcript entries.
 */
export class FillerWordTracker {
  private counts = new Map<string, number>();
  private _totalWords = 0;

  /** Feed a new text segment */
  push(text: string): FillerAnalysis {
    const analysis = analyzeFillerWords(text);
    this._totalWords += analysis.totalWords;

    for (const f of analysis.fillers) {
      this.counts.set(f.label, (this.counts.get(f.label) || 0) + f.count);
    }

    return this.getSnapshot();
  }

  /** Get the current cumulative analysis */
  getSnapshot(): FillerAnalysis {
    const fillers = Array.from(this.counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);

    const totalFillers = fillers.reduce((sum, f) => sum + f.count, 0);
    const fillerRatio = this._totalWords > 0 ? totalFillers / this._totalWords : 0;

    let grade: FillerAnalysis['grade'];
    if (fillerRatio < 0.02) grade = 'EXCELLENT';
    else if (fillerRatio < 0.05) grade = 'GOOD';
    else if (fillerRatio < 0.1) grade = 'FAIR';
    else grade = 'POOR';

    return { fillers, totalFillers, totalWords: this._totalWords, fillerRatio, grade };
  }

  /** Reset all counts */
  reset(): void {
    this.counts.clear();
    this._totalWords = 0;
  }
}
