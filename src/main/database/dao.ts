// ============================================
// PrepHQ — Data Access Object (DAO) Layer
// Typed CRUD helpers for Sessions, Transcripts, Metrics
// ============================================

import Database from 'better-sqlite3';
import type { Session, TranscriptEntry, MetricEntry, AppMode, Sentiment } from '../../shared/types';

// ── Row types matching SQLite columns ───────────
interface SessionRow {
  id: string;
  mode: string;
  timestamp: string;
  video_path: string | null;
  score_technical: number | null;
  score_communication: number | null;
}

interface TranscriptRow {
  id: number;
  session_id: string;
  timestamp_offset: number;
  speaker: string;
  text: string;
  sentiment: string;
}

interface MetricRow {
  id: number;
  session_id: string;
  timestamp_offset: number;
  heart_rate_proxy: number | null;
  filler_word_detected: number;
}

// ── Mappers ─────────────────────────────────────
function mapSession(row: SessionRow): Session {
  return {
    id: row.id,
    mode: row.mode as AppMode,
    timestamp: row.timestamp,
    videoPath: row.video_path ?? undefined,
    scoreTechnical: row.score_technical ?? undefined,
    scoreCommunication: row.score_communication ?? undefined,
  };
}

function mapTranscript(row: TranscriptRow): TranscriptEntry {
  return {
    sessionId: row.session_id,
    timestampOffset: row.timestamp_offset,
    speaker: row.speaker as TranscriptEntry['speaker'],
    text: row.text,
    sentiment: row.sentiment as Sentiment,
  };
}

function mapMetric(row: MetricRow): MetricEntry {
  return {
    sessionId: row.session_id,
    timestampOffset: row.timestamp_offset,
    heartRateProxy: row.heart_rate_proxy ?? undefined,
    fillerWordDetected: row.filler_word_detected === 1,
  };
}

// ── DAO Class ───────────────────────────────────
export class PrepHQDao {
  private db: Database.Database;

  // Prepared statements (lazy-initialized)
  private stmts: {
    insertSession?: Database.Statement;
    getSession?: Database.Statement;
    getAllSessions?: Database.Statement;
    updateSessionScores?: Database.Statement;
    deleteSession?: Database.Statement;
    insertTranscript?: Database.Statement;
    getTranscripts?: Database.Statement;
    insertMetric?: Database.Statement;
    getMetrics?: Database.Statement;
  } = {};

  constructor(db: Database.Database) {
    this.db = db;
  }

  // ── Sessions ────────────────────────────────

  createSession(id: string, mode: AppMode): Session {
    const timestamp = new Date().toISOString();
    if (!this.stmts.insertSession) {
      this.stmts.insertSession = this.db.prepare(
        `INSERT INTO sessions (id, mode, timestamp) VALUES (?, ?, ?)`
      );
    }
    this.stmts.insertSession.run(id, mode, timestamp);
    return { id, mode, timestamp };
  }

  getSession(id: string): Session | null {
    if (!this.stmts.getSession) {
      this.stmts.getSession = this.db.prepare(
        `SELECT * FROM sessions WHERE id = ?`
      );
    }
    const row = this.stmts.getSession.get(id) as SessionRow | undefined;
    return row ? mapSession(row) : null;
  }

  getAllSessions(): Session[] {
    if (!this.stmts.getAllSessions) {
      this.stmts.getAllSessions = this.db.prepare(
        `SELECT * FROM sessions ORDER BY timestamp DESC`
      );
    }
    const rows = this.stmts.getAllSessions.all() as SessionRow[];
    return rows.map(mapSession);
  }

  updateSessionScores(
    id: string,
    scoreTechnical: number,
    scoreCommunication: number
  ): void {
    if (!this.stmts.updateSessionScores) {
      this.stmts.updateSessionScores = this.db.prepare(
        `UPDATE sessions SET score_technical = ?, score_communication = ? WHERE id = ?`
      );
    }
    this.stmts.updateSessionScores.run(scoreTechnical, scoreCommunication, id);
  }

  deleteSession(id: string): void {
    if (!this.stmts.deleteSession) {
      this.stmts.deleteSession = this.db.prepare(
        `DELETE FROM sessions WHERE id = ?`
      );
    }
    this.stmts.deleteSession.run(id);
  }

  // ── Transcripts ─────────────────────────────

  appendTranscript(entry: TranscriptEntry): void {
    if (!this.stmts.insertTranscript) {
      this.stmts.insertTranscript = this.db.prepare(
        `INSERT INTO transcripts (session_id, timestamp_offset, speaker, text, sentiment)
         VALUES (?, ?, ?, ?, ?)`
      );
    }
    this.stmts.insertTranscript.run(
      entry.sessionId,
      entry.timestampOffset,
      entry.speaker,
      entry.text,
      entry.sentiment
    );
  }

  getTranscripts(sessionId: string): TranscriptEntry[] {
    if (!this.stmts.getTranscripts) {
      this.stmts.getTranscripts = this.db.prepare(
        `SELECT * FROM transcripts WHERE session_id = ? ORDER BY timestamp_offset ASC`
      );
    }
    const rows = this.stmts.getTranscripts.all(sessionId) as TranscriptRow[];
    return rows.map(mapTranscript);
  }

  // Batch insert for performance (used when saving entire session at once)
  appendTranscriptsBatch(entries: TranscriptEntry[]): void {
    if (!this.stmts.insertTranscript) {
      this.stmts.insertTranscript = this.db.prepare(
        `INSERT INTO transcripts (session_id, timestamp_offset, speaker, text, sentiment)
         VALUES (?, ?, ?, ?, ?)`
      );
    }
    const batchInsert = this.db.transaction((items: TranscriptEntry[]) => {
      for (const entry of items) {
        this.stmts.insertTranscript!.run(
          entry.sessionId,
          entry.timestampOffset,
          entry.speaker,
          entry.text,
          entry.sentiment
        );
      }
    });
    batchInsert(entries);
  }

  // ── Metrics ─────────────────────────────────

  upsertMetric(entry: MetricEntry): void {
    if (!this.stmts.insertMetric) {
      this.stmts.insertMetric = this.db.prepare(
        `INSERT INTO metrics (session_id, timestamp_offset, heart_rate_proxy, filler_word_detected)
         VALUES (?, ?, ?, ?)`
      );
    }
    this.stmts.insertMetric.run(
      entry.sessionId,
      entry.timestampOffset,
      entry.heartRateProxy ?? null,
      entry.fillerWordDetected ? 1 : 0
    );
  }

  getMetrics(sessionId: string): MetricEntry[] {
    if (!this.stmts.getMetrics) {
      this.stmts.getMetrics = this.db.prepare(
        `SELECT * FROM metrics WHERE session_id = ? ORDER BY timestamp_offset ASC`
      );
    }
    const rows = this.stmts.getMetrics.all(sessionId) as MetricRow[];
    return rows.map(mapMetric);
  }

  // ── Cleanup ─────────────────────────────────

  close(): void {
    this.db.close();
  }
}
