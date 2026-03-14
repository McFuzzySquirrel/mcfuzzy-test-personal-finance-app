import * as SQLite from 'expo-sqlite';

import { initializeDatabase, openDatabase, runMigrations } from '@/db/index';
import { seedDefaultCategories } from '@/db/seeds';

jest.mock('@/db/seeds', () => ({
  seedDefaultCategories: jest.fn().mockResolvedValue(undefined),
}));

const mockMigrationUp = jest.fn().mockResolvedValue(undefined);

jest.mock('@/db/migrations', () => ({
  migrations: [
    { id: 'test-migration-1', version: 1, up: jest.fn().mockResolvedValue(undefined) },
    { id: 'test-migration-2', version: 2, up: jest.fn().mockResolvedValue(undefined) },
  ],
}));

const mockDb = {
  execAsync: jest.fn().mockResolvedValue(undefined),
  getAllAsync: jest.fn().mockResolvedValue([]),
  getFirstAsync: jest.fn().mockResolvedValue(null),
  runAsync: jest.fn().mockResolvedValue({ changes: 1 }),
  withTransactionAsync: jest.fn(async (cb: () => Promise<void>) => cb()),
};

beforeEach(() => {
  jest.clearAllMocks();
  // Override the global expo-sqlite mock to use our controllable mockDb
  (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue(mockDb);
  mockDb.execAsync.mockResolvedValue(undefined);
  mockDb.getFirstAsync.mockResolvedValue(null); // all migrations unapplied by default
  mockDb.runAsync.mockResolvedValue({ changes: 1 });
  mockDb.withTransactionAsync.mockImplementation(async (cb: () => Promise<void>) => cb());
  mockMigrationUp.mockResolvedValue(undefined);
  (seedDefaultCategories as jest.Mock).mockResolvedValue(undefined);
});

describe('db/index openDatabase', () => {
  it('calls openDatabaseAsync with the correct database name', async () => {
    const db = await openDatabase();

    expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('student-finance.db');
    expect(db).toBe(mockDb);
  });
});

describe('db/index runMigrations', () => {
  it('applies PRAGMA foreign_keys and creates schema_version table', async () => {
    await runMigrations(mockDb as unknown as SQLite.SQLiteDatabase);

    expect(mockDb.execAsync).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;');
    expect(mockDb.execAsync).toHaveBeenCalledWith(
      expect.stringContaining('CREATE TABLE IF NOT EXISTS schema_version')
    );
  });

  it('runs unapplied migrations inside a transaction', async () => {
    // Both migrations unapplied (getFirstAsync returns null for each check)
    mockDb.getFirstAsync.mockResolvedValue(null);

    await runMigrations(mockDb as unknown as SQLite.SQLiteDatabase);

    // withTransactionAsync called once per unapplied migration
    expect(mockDb.withTransactionAsync).toHaveBeenCalledTimes(2);
    expect(mockDb.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO schema_version'),
      expect.any(Array)
    );
  });

  it('skips migrations that are already applied', async () => {
    // Both migrations already in schema_version
    mockDb.getFirstAsync.mockResolvedValue({ version: 1 });

    await runMigrations(mockDb as unknown as SQLite.SQLiteDatabase);

    expect(mockDb.withTransactionAsync).not.toHaveBeenCalled();
  });

  it('applies only unapplied migrations when some are already done', async () => {
    // First migration already applied, second not
    mockDb.getFirstAsync
      .mockResolvedValueOnce({ version: 1 }) // migration 1: already applied
      .mockResolvedValueOnce(null);           // migration 2: unapplied

    await runMigrations(mockDb as unknown as SQLite.SQLiteDatabase);

    expect(mockDb.withTransactionAsync).toHaveBeenCalledTimes(1);
  });
});

describe('db/index initializeDatabase', () => {
  it('opens the db, runs migrations, and seeds categories', async () => {
    const db = await initializeDatabase();

    expect(SQLite.openDatabaseAsync).toHaveBeenCalledWith('student-finance.db');
    expect(mockDb.execAsync).toHaveBeenCalledWith('PRAGMA foreign_keys = ON;');
    expect(seedDefaultCategories).toHaveBeenCalledWith(mockDb);
    expect(db).toBe(mockDb);
  });
});
