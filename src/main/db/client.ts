import path from 'path';
import Database from 'better-sqlite3';
import { app } from 'electron';
import { runMigrations } from './migrations';

type BetterSqliteDatabase = any;

let db: BetterSqliteDatabase | null = null;

export function initDatabase(): BetterSqliteDatabase {
  if (db) {
    return db;
  }

  const dbPath = path.join(app.getPath('userData'), 'todos.sqlite3');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  runMigrations(db);

  return db;
}

export function getDatabase(): BetterSqliteDatabase {
  if (!db) {
    return initDatabase();
  }

  return db;
}
