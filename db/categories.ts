import type { SQLiteDatabase } from 'expo-sqlite';

import { DatabaseError } from '@/db/errors';
import { normalizeOptionalText, toDbBoolean } from '@/db/shared';
import type { Category } from '@/types';

type CategoryRow = {
  id: string;
  name: string;
  icon: string | null;
  is_custom: number;
};

function mapCategoryRow(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon ?? undefined,
    isCustom: row.is_custom === 1,
  };
}

export async function getAllCategories(db: SQLiteDatabase): Promise<Category[]> {
  const rows = await db.getAllAsync<CategoryRow>(
    'SELECT id, name, icon, is_custom FROM categories ORDER BY is_custom ASC, name ASC;'
  );

  return rows.map(mapCategoryRow);
}

export async function insertCategory(db: SQLiteDatabase, category: Omit<Category, 'id'>): Promise<Category> {
  const id = crypto.randomUUID();
  const icon = normalizeOptionalText(category.icon);

  await db.runAsync('INSERT INTO categories (id, name, icon, is_custom) VALUES (?, ?, ?, ?);', [
    id,
    category.name,
    icon,
    toDbBoolean(category.isCustom),
  ]);

  const created = await db.getFirstAsync<CategoryRow>(
    'SELECT id, name, icon, is_custom FROM categories WHERE id = ?;',
    [id]
  );

  if (!created) {
    throw new DatabaseError('Failed to create category', 'CONSTRAINT_VIOLATION');
  }

  return mapCategoryRow(created);
}

export async function updateCategory(
  db: SQLiteDatabase,
  id: string,
  fields: Partial<Category>
): Promise<Category> {
  const updates: string[] = [];
  const params: Array<string | number | null> = [];

  if (typeof fields.name !== 'undefined') {
    updates.push('name = ?');
    params.push(fields.name);
  }

  if (typeof fields.icon !== 'undefined') {
    updates.push('icon = ?');
    params.push(normalizeOptionalText(fields.icon));
  }

  if (typeof fields.isCustom !== 'undefined') {
    updates.push('is_custom = ?');
    params.push(toDbBoolean(fields.isCustom));
  }

  if (updates.length === 0) {
    throw new DatabaseError('No updatable category fields provided', 'INVALID_INPUT');
  }

  params.push(id);
  const result = await db.runAsync(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?;`, params);

  if (result.changes === 0) {
    throw new DatabaseError(`Category ${id} not found`, 'NOT_FOUND');
  }

  const updated = await db.getFirstAsync<CategoryRow>(
    'SELECT id, name, icon, is_custom FROM categories WHERE id = ?;',
    [id]
  );

  if (!updated) {
    throw new DatabaseError(`Category ${id} not found`, 'NOT_FOUND');
  }

  return mapCategoryRow(updated);
}

export async function deleteCategory(db: SQLiteDatabase, id: string): Promise<void> {
  const existing = await db.getFirstAsync<{ is_custom: number }>('SELECT is_custom FROM categories WHERE id = ?;', [
    id,
  ]);

  if (!existing) {
    throw new DatabaseError(`Category ${id} not found`, 'NOT_FOUND');
  }

  if (existing.is_custom === 0) {
    throw new DatabaseError('System categories cannot be deleted', 'PROTECTED_RESOURCE');
  }

  await db.runAsync('DELETE FROM categories WHERE id = ?;', [id]);
}
