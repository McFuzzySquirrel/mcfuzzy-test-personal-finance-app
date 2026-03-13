import type { SQLiteDatabase } from 'expo-sqlite';

const DEFAULT_CATEGORIES = [
  'Food',
  'Transport',
  'Rent',
  'Entertainment',
  'Books',
  'Subscriptions',
  'Other',
] as const;

export async function seedDefaultCategories(db: SQLiteDatabase): Promise<void> {
  const countRow = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM categories;');
  const count = countRow?.count ?? 0;

  if (count > 0) {
    return;
  }

  for (const categoryName of DEFAULT_CATEGORIES) {
    await db.runAsync(
      'INSERT INTO categories (id, name, icon, is_custom) VALUES (?, ?, ?, ?);',
      [`default-${categoryName.toLowerCase()}`, categoryName, null, 0]
    );
  }
}
