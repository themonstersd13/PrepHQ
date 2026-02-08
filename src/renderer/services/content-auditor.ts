// ============================================
// PrepHQ — Content Auditor Service
// Keyword density tracking + answer completeness scoring
// ============================================

/** Technical keywords grouped by category */
const KEYWORD_CATEGORIES: Record<string, string[]> = {
  'Complexity': ['big o', 'time complexity', 'space complexity', 'o(n)', 'o(1)', 'o(log n)', 'o(n^2)', 'logarithmic', 'linear', 'quadratic', 'exponential', 'amortized'],
  'Data Structures': ['array', 'linked list', 'hash map', 'hash table', 'tree', 'binary tree', 'bst', 'heap', 'stack', 'queue', 'graph', 'trie', 'set'],
  'Algorithms': ['sorting', 'searching', 'binary search', 'dfs', 'bfs', 'dynamic programming', 'recursion', 'backtracking', 'greedy', 'divide and conquer', 'two pointer', 'sliding window'],
  'System Design': ['scalability', 'load balancer', 'caching', 'database', 'microservices', 'api', 'rest', 'message queue', 'cdn', 'sharding', 'replication', 'consistency', 'availability', 'partition tolerance', 'cap theorem'],
  'Trade-offs': ['trade-off', 'tradeoff', 'pros and cons', 'advantage', 'disadvantage', 'bottleneck', 'optimization', 'constraint'],
  'Edge Cases': ['edge case', 'corner case', 'null', 'empty', 'overflow', 'boundary', 'negative', 'duplicate', 'concurrent', 'race condition'],
  'Communication': ['because', 'therefore', 'for example', 'in other words', 'let me explain', 'my approach', 'first', 'then', 'finally', 'to summarize'],
};

export interface KeywordHit {
  keyword: string;
  category: string;
  count: number;
}

export interface KeywordDensityResult {
  /** Hits grouped by category with counts */
  byCategory: Record<string, { keywords: KeywordHit[]; totalHits: number }>;
  /** Top keywords overall */
  topKeywords: KeywordHit[];
  /** Total unique categories touched */
  categoriesCovered: number;
  /** Total keywords detected */
  totalHits: number;
}

/**
 * Track keyword density across transcript text.
 */
export class KeywordDensityTracker {
  private hitMap = new Map<string, { category: string; count: number }>();

  /** Feed a new text segment */
  push(text: string): KeywordDensityResult {
    const lower = text.toLowerCase();

    for (const [category, keywords] of Object.entries(KEYWORD_CATEGORIES)) {
      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        const matches = lower.match(regex);
        if (matches) {
          const key = `${category}::${keyword}`;
          const existing = this.hitMap.get(key);
          if (existing) {
            existing.count += matches.length;
          } else {
            this.hitMap.set(key, { category, count: matches.length });
          }
        }
      }
    }

    return this.getSnapshot();
  }

  /** Get current snapshot of keyword density */
  getSnapshot(): KeywordDensityResult {
    const byCategory: KeywordDensityResult['byCategory'] = {};
    const allKeywords: KeywordHit[] = [];

    for (const [key, { category, count }] of this.hitMap.entries()) {
      const keyword = key.split('::')[1];
      const hit: KeywordHit = { keyword, category, count };
      allKeywords.push(hit);

      if (!byCategory[category]) {
        byCategory[category] = { keywords: [], totalHits: 0 };
      }
      byCategory[category].keywords.push(hit);
      byCategory[category].totalHits += count;
    }

    // Sort each category's keywords
    for (const cat of Object.values(byCategory)) {
      cat.keywords.sort((a, b) => b.count - a.count);
    }

    const topKeywords = [...allKeywords].sort((a, b) => b.count - a.count).slice(0, 15);
    const categoriesCovered = Object.keys(byCategory).length;
    const totalHits = allKeywords.reduce((s, k) => s + k.count, 0);

    return { byCategory, topKeywords, categoriesCovered, totalHits };
  }

  reset(): void {
    this.hitMap.clear();
  }
}

/**
 * Score answer completeness using Gemini.
 * Sends the transcript + rubric to Gemini and gets a structured score.
 */
export async function scoreAnswerCompleteness(
  transcript: string,
  rubric: string[],
  apiCall: (prompt: string, history: string, stage: string) => Promise<string>,
): Promise<{
  score: number;
  covered: string[];
  missed: string[];
  feedback: string;
}> {
  const prompt = `You are an interview assessment AI. Analyze how well the candidate's answer covers the expected rubric points.

RUBRIC POINTS:
${rubric.map((r, i) => `${i + 1}. ${r}`).join('\n')}

CANDIDATE TRANSCRIPT:
${transcript}

Respond with a JSON object (no markdown code fences) with exactly these fields:
{
  "score": <number 0-100 representing coverage percentage>,
  "covered": [<array of rubric points that were adequately addressed>],
  "missed": [<array of rubric points that were missed or inadequately addressed>],
  "feedback": "<brief 2-3 sentence assessment>"
}`;

  try {
    const response = await apiCall(prompt, '', 'DEEP_DIVE');
    // Parse the JSON response
    const cleaned = response.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    return {
      score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
      covered: Array.isArray(parsed.covered) ? parsed.covered : [],
      missed: Array.isArray(parsed.missed) ? parsed.missed : [],
      feedback: String(parsed.feedback || 'Unable to assess.'),
    };
  } catch (err) {
    console.error('[ContentAuditor] Failed to score completeness:', err);
    return {
      score: 0,
      covered: [],
      missed: rubric,
      feedback: 'Failed to analyze answer completeness.',
    };
  }
}
