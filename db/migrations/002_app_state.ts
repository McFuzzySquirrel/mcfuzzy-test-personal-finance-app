import type { SQLiteDatabase } from 'expo-sqlite';

import type { Migration } from '@/db/migrations';

export const appStateMigration: Migration = {
  id: '002_app_state',
  version: 2,
  up: async (db: SQLiteDatabase): Promise<void> => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS app_state (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
  },
};