import * as SQLite from 'expo-sqlite';

import * as appState from '@/db/appState';
import * as budgets from '@/db/budgets';
import * as categories from '@/db/categories';
import { seedDefaultCategories } from '@/db/seeds';
import * as expenses from '@/db/expenses';
import * as recurring from '@/db/recurring';
import { migrations } from '@/db/migrations';

export async function openDatabase(): Promise<SQLite.SQLiteDatabase> {
  return SQLite.openDatabaseAsync('student-finance.db');
}

export async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync('PRAGMA foreign_keys = ON;');

  await db.execAsync(
    'CREATE TABLE IF NOT EXISTS schema_version (version INTEGER PRIMARY KEY NOT NULL, applied_at TEXT NOT NULL);'
  );

  for (const migration of migrations) {
    const existing = await db.getFirstAsync<{ version: number }>(
      'SELECT version FROM schema_version WHERE version = ?;',
      [migration.version]
    );

    if (existing) {
      continue;
    }

    await db.withTransactionAsync(async () => {
      await migration.up(db);
      await db.runAsync(
        'INSERT INTO schema_version (version, applied_at) VALUES (?, ?);',
        [migration.version, new Date().toISOString()]
      );
    });
  }
}

export async function initializeDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await openDatabase();
  await runMigrations(db);
  await seedDefaultCategories(db);
  return db;
}

export { appState, budgets, categories, expenses, recurring, seedDefaultCategories };
export { DatabaseError } from '@/db/errors';
