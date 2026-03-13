import type { SQLiteDatabase } from 'expo-sqlite';

import { initialSchemaMigration } from '@/db/migrations/001_initial_schema';
import { appStateMigration } from '@/db/migrations/002_app_state';

export type Migration = {
  id: string;
  version: number;
  up: (db: SQLiteDatabase) => Promise<void>;
};

export const migrations: Migration[] = [initialSchemaMigration, appStateMigration];
