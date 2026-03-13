import type { SQLiteDatabase } from 'expo-sqlite';

type AppStateRow = {
  key: string;
  value: string;
};

export const LAST_ACTIVE_MONTH_KEY = 'last_active_month';

export async function getAppStateValue(db: SQLiteDatabase, key: string): Promise<string | null> {
  const row = await db.getFirstAsync<AppStateRow>('SELECT key, value FROM app_state WHERE key = ?;', [key]);
  return row?.value ?? null;
}

export async function setAppStateValue(db: SQLiteDatabase, key: string, value: string): Promise<void> {
  await db.runAsync(
    `INSERT INTO app_state (key, value, updated_at)
     VALUES (?, ?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
    [key, value, new Date().toISOString()]
  );
}