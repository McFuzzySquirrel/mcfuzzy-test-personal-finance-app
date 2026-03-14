import type { SQLiteDatabase } from 'expo-sqlite';

import { DatabaseError } from '@/db/errors';
import {
  assertIntegerAmount,
  assertMonthFormat,
  generateId,
  getMonthBounds,
  getWeekBounds,
  normalizeOptionalText,
  toDbBoolean,
  createPlaceholders,
} from '@/db/shared';
import type { Expense, ExpenseType } from '@/types';

type ExpenseRow = {
  id: string;
  amount: number;
  category_id: string;
  note: string | null;
  date: string;
  type: ExpenseType;
  split_with: string | null;
  split_amount: number | null;
  is_recurring: number;
  recurring_interval: 'monthly' | null;
  settled: number;
  recurring_template_id: string | null;
};

type MonthlyTotalByCategoryRow = {
  category_id: string;
  total: number;
};

type MonthlyTotalRow = {
  month: string;
  total: number;
};

type WeeklyTotalRow = {
  date: string;
  total: number;
};

function mapExpenseRow(row: ExpenseRow): Expense {
  return {
    id: row.id,
    amount: row.amount,
    categoryId: row.category_id,
    note: row.note ?? undefined,
    date: row.date,
    type: row.type,
    splitWith: row.split_with ?? undefined,
    splitAmount: typeof row.split_amount === 'number' ? row.split_amount : undefined,
    isRecurring: row.is_recurring === 1,
    recurringInterval: row.recurring_interval ?? undefined,
    settled: row.settled === 1,
    recurringTemplateId: row.recurring_template_id ?? undefined,
  };
}

function validateExpenseInput(expense: Omit<Expense, 'id'>): void {
  assertIntegerAmount(expense.amount, 'amount');
  if (typeof expense.splitAmount !== 'undefined') {
    assertIntegerAmount(expense.splitAmount, 'splitAmount');
  }
}

export async function insertExpense(db: SQLiteDatabase, expense: Omit<Expense, 'id'>): Promise<Expense> {
  validateExpenseInput(expense);

  const id = generateId();

  await db.runAsync(
    `INSERT INTO expenses (
      id, amount, category_id, note, date, type, split_with, split_amount,
      is_recurring, recurring_interval, settled, recurring_template_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
    [
      id,
      expense.amount,
      expense.categoryId,
      normalizeOptionalText(expense.note),
      expense.date,
      expense.type,
      normalizeOptionalText(expense.splitWith),
      typeof expense.splitAmount === 'number' ? expense.splitAmount : null,
      toDbBoolean(expense.isRecurring),
      expense.recurringInterval ?? null,
      toDbBoolean(expense.settled),
      expense.recurringTemplateId ?? null,
    ]
  );

  const created = await getExpenseById(db, id);
  if (!created) {
    throw new DatabaseError('Failed to insert expense', 'CONSTRAINT_VIOLATION');
  }

  return created;
}

export async function getExpensesByMonth(db: SQLiteDatabase, month: string): Promise<Expense[]> {
  const bounds = getMonthBounds(month);

  const rows = await db.getAllAsync<ExpenseRow>(
    `SELECT
      id, amount, category_id, note, date, type, split_with, split_amount,
      is_recurring, recurring_interval, settled, recurring_template_id
     FROM expenses
     WHERE date >= ? AND date < ?
     ORDER BY date DESC, id DESC;`,
    [bounds.start, bounds.end]
  );

  return rows.map(mapExpenseRow);
}

export async function getExpenseById(db: SQLiteDatabase, id: string): Promise<Expense | null> {
  const row = await db.getFirstAsync<ExpenseRow>(
    `SELECT
      id, amount, category_id, note, date, type, split_with, split_amount,
      is_recurring, recurring_interval, settled, recurring_template_id
     FROM expenses
     WHERE id = ?;`,
    [id]
  );

  return row ? mapExpenseRow(row) : null;
}

export async function updateExpense(db: SQLiteDatabase, id: string, fields: Partial<Expense>): Promise<Expense> {
  const updates: string[] = [];
  const params: Array<string | number | null> = [];

  if (typeof fields.amount !== 'undefined') {
    assertIntegerAmount(fields.amount, 'amount');
    updates.push('amount = ?');
    params.push(fields.amount);
  }

  if (typeof fields.categoryId !== 'undefined') {
    updates.push('category_id = ?');
    params.push(fields.categoryId);
  }

  if (typeof fields.note !== 'undefined') {
    updates.push('note = ?');
    params.push(normalizeOptionalText(fields.note));
  }

  if (typeof fields.date !== 'undefined') {
    updates.push('date = ?');
    params.push(fields.date);
  }

  if (typeof fields.type !== 'undefined') {
    updates.push('type = ?');
    params.push(fields.type);
  }

  if (typeof fields.splitWith !== 'undefined') {
    updates.push('split_with = ?');
    params.push(normalizeOptionalText(fields.splitWith));
  }

  if (typeof fields.splitAmount !== 'undefined') {
    assertIntegerAmount(fields.splitAmount, 'splitAmount');
    updates.push('split_amount = ?');
    params.push(fields.splitAmount);
  }

  if (typeof fields.isRecurring !== 'undefined') {
    updates.push('is_recurring = ?');
    params.push(toDbBoolean(fields.isRecurring));
  }

  if (typeof fields.recurringInterval !== 'undefined') {
    updates.push('recurring_interval = ?');
    params.push(fields.recurringInterval ?? null);
  }

  if (typeof fields.settled !== 'undefined') {
    updates.push('settled = ?');
    params.push(toDbBoolean(fields.settled));
  }

  if (typeof fields.recurringTemplateId !== 'undefined') {
    updates.push('recurring_template_id = ?');
    params.push(fields.recurringTemplateId ?? null);
  }

  if (updates.length === 0) {
    throw new DatabaseError('No updatable expense fields provided', 'INVALID_INPUT');
  }

  params.push(id);
  const result = await db.runAsync(`UPDATE expenses SET ${updates.join(', ')} WHERE id = ?;`, params);

  if (result.changes === 0) {
    throw new DatabaseError(`Expense ${id} not found`, 'NOT_FOUND');
  }

  const updated = await getExpenseById(db, id);
  if (!updated) {
    throw new DatabaseError(`Expense ${id} not found`, 'NOT_FOUND');
  }

  return updated;
}

export async function deleteExpense(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM expenses WHERE id = ?;', [id]);
}

export async function getMonthlyTotalByCategory(
  db: SQLiteDatabase,
  month: string
): Promise<{ categoryId: string; total: number }[]> {
  const bounds = getMonthBounds(month);

  const rows = await db.getAllAsync<MonthlyTotalByCategoryRow>(
    `SELECT category_id, COALESCE(SUM(amount), 0) AS total
     FROM expenses
     WHERE date >= ? AND date < ?
       AND type IN ('expense', 'split')
     GROUP BY category_id
     ORDER BY total DESC;`,
    [bounds.start, bounds.end]
  );

  return rows.map((row) => ({ categoryId: row.category_id, total: row.total }));
}

export async function getMonthlyTotals(
  db: SQLiteDatabase,
  months: string[]
): Promise<{ month: string; total: number }[]> {
  if (months.length === 0) {
    return [];
  }

  months.forEach(assertMonthFormat);

  const placeholders = createPlaceholders(months.length);
  const rows = await db.getAllAsync<MonthlyTotalRow>(
    `SELECT substr(date, 1, 7) AS month, COALESCE(SUM(amount), 0) AS total
     FROM expenses
     WHERE substr(date, 1, 7) IN (${placeholders})
       AND type IN ('expense', 'split')
     GROUP BY substr(date, 1, 7);`,
    months
  );

  const totalsByMonth = new Map(rows.map((row) => [row.month, row.total]));
  return months.map((month) => ({ month, total: totalsByMonth.get(month) ?? 0 }));
}

export async function getWeeklyTotalsByDay(
  db: SQLiteDatabase,
  weekStart: string
): Promise<{ date: string; total: number }[]> {
  const bounds = getWeekBounds(weekStart);

  const rows = await db.getAllAsync<WeeklyTotalRow>(
    `SELECT substr(date, 1, 10) AS date, COALESCE(SUM(amount), 0) AS total
     FROM expenses
     WHERE date >= ? AND date < ?
       AND type IN ('expense', 'split')
     GROUP BY substr(date, 1, 10);`,
    [bounds.start, bounds.endExclusive]
  );

  const totalByDate = new Map(rows.map((row) => [row.date, row.total]));
  return bounds.dates.map((date) => ({ date, total: totalByDate.get(date) ?? 0 }));
}

export async function getOutstandingSplits(db: SQLiteDatabase): Promise<Expense[]> {
  const rows = await db.getAllAsync<ExpenseRow>(
    `SELECT
      id, amount, category_id, note, date, type, split_with, split_amount,
      is_recurring, recurring_interval, settled, recurring_template_id
     FROM expenses
     WHERE type IN ('split', 'lent', 'borrowed')
       AND settled = 0
     ORDER BY date DESC, id DESC;`
  );

  return rows.map(mapExpenseRow);
}

export async function markSplitSettled(db: SQLiteDatabase, id: string): Promise<void> {
  const result = await db.runAsync(
    `UPDATE expenses
     SET settled = 1
     WHERE id = ?
       AND type IN ('split', 'lent', 'borrowed');`,
    [id]
  );

  if (result.changes === 0) {
    const existing = await getExpenseById(db, id);
    if (!existing) {
      throw new DatabaseError(`Expense ${id} not found`, 'NOT_FOUND');
    }

    throw new DatabaseError('Only split/lent/borrowed expenses can be settled', 'CONSTRAINT_VIOLATION');
  }
}
