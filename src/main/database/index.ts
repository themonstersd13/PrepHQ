// ============================================
// PrepHQ — Database Manager
// Singleton access point — initializes DB on first use
// Zero-persistence: DB is only created when user saves
// ============================================

import { app } from 'electron';
import path from 'node:path';
import Database from 'better-sqlite3';
import { initializeSchema } from './schema';
import { PrepHQDao } from './dao';

let db: Database.Database | null = null;
let dao: PrepHQDao | null = null;

/**
 * Get (or create) the singleton DAO instance.
 * The SQLite file lives in the user's app data directory.
 */
export function getDao(): PrepHQDao {
  if (dao) return dao;

  const dbPath = path.join(app.getPath('userData'), 'prephq.sqlite');
  db = new Database(dbPath);

  // Enable WAL mode for better concurrent read performance
  db.pragma('journal_mode = WAL');
  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  initializeSchema(db);
  dao = new PrepHQDao(db);

  return dao;
}

/**
 * Gracefully close the database connection.
 * Call this on app quit.
 */
export function closeDatabase(): void {
  if (dao) {
    dao.close();
    dao = null;
    db = null;
  }
}
