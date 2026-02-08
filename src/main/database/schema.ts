// ============================================
// PrepHQ — SQLite Schema Initialization
// Creates tables matching design.md spec
// ============================================

import Database from 'better-sqlite3';

/**
 * Initialize the database schema.
 * Creates tables if they don't already exist (idempotent).
 */
export function initializeSchema(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id            TEXT PRIMARY KEY,
      mode          TEXT NOT NULL CHECK(mode IN ('GHOST', 'ARENA')),
      timestamp     TEXT NOT NULL,
      video_path    TEXT,
      score_technical     REAL,
      score_communication REAL
    );

    CREATE TABLE IF NOT EXISTS transcripts (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id        TEXT NOT NULL,
      timestamp_offset  INTEGER NOT NULL,
      speaker           TEXT NOT NULL CHECK(speaker IN ('USER', 'INTERVIEWER')),
      text              TEXT NOT NULL,
      sentiment         TEXT NOT NULL DEFAULT 'NEUTRAL' CHECK(sentiment IN ('POSITIVE', 'NEUTRAL', 'NEGATIVE')),
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS metrics (
      id                INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id        TEXT NOT NULL,
      timestamp_offset  INTEGER NOT NULL,
      heart_rate_proxy  REAL,
      filler_word_detected INTEGER DEFAULT 0,
      FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_transcripts_session ON transcripts(session_id);
    CREATE INDEX IF NOT EXISTS idx_metrics_session ON metrics(session_id);
  `);
}
