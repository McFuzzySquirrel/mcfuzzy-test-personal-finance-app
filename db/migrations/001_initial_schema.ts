import type { SQLiteDatabase } from 'expo-sqlite';

import type { Migration } from '@/db/migrations';

export const initialSchemaMigration: Migration = {
  id: '001_initial_schema',
  version: 1,
  up: async (db: SQLiteDatabase): Promise<void> => {
    await db.execAsync('PRAGMA foreign_keys = ON;');

    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        icon TEXT,
        is_custom INTEGER NOT NULL CHECK (is_custom IN (0, 1))
      );

      CREATE UNIQUE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY NOT NULL,
        amount INTEGER NOT NULL CHECK (amount >= 0),
        category_id TEXT NOT NULL,
        note TEXT,
        date TEXT NOT NULL,
        type TEXT NOT NULL CHECK (type IN ('expense', 'split', 'lent', 'borrowed')),
        split_with TEXT,
        split_amount INTEGER,
        is_recurring INTEGER NOT NULL DEFAULT 0 CHECK (is_recurring IN (0, 1)),
        recurring_interval TEXT,
        settled INTEGER NOT NULL DEFAULT 0 CHECK (settled IN (0, 1)),
        recurring_template_id TEXT,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        FOREIGN KEY (recurring_template_id) REFERENCES expenses(id) ON UPDATE CASCADE ON DELETE SET NULL,
        CHECK (split_amount IS NULL OR split_amount >= 0),
        CHECK (recurring_interval IS NULL OR recurring_interval = 'monthly')
      );

      CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
      CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
      CREATE INDEX IF NOT EXISTS idx_expenses_type_settled ON expenses(type, settled);
      CREATE INDEX IF NOT EXISTS idx_expenses_recurring_template_id ON expenses(recurring_template_id);

      CREATE TABLE IF NOT EXISTS budgets (
        category_id TEXT NOT NULL,
        month TEXT NOT NULL,
        limit_amount INTEGER NOT NULL CHECK (limit_amount >= 0),
        PRIMARY KEY (category_id, month),
        FOREIGN KEY (category_id) REFERENCES categories(id) ON UPDATE CASCADE ON DELETE RESTRICT
      );

      CREATE INDEX IF NOT EXISTS idx_budgets_month ON budgets(month);
    `);
  },
};
