import type { SQLiteDatabase } from 'expo-sqlite';

import { DatabaseError } from '@/db/errors';
import { getExpenseById, insertExpense } from '@/db/expenses';
import { assertDateFormat } from '@/db/shared';
import type { Expense } from '@/types';

export async function getDueRecurringExpenses(db: SQLiteDatabase, asOf: string): Promise<Expense[]> {
  assertDateFormat(asOf, 'asOf');

  const dueTemplateRows = await db.getAllAsync<{ id: string }>(
    `SELECT e.id
     FROM expenses e
     WHERE e.is_recurring = 1
       AND e.recurring_interval = 'monthly'
       AND date(substr(?1, 1, 7) || '-' || strftime('%d', e.date)) <= date(?1)
       AND NOT EXISTS (
         SELECT 1
         FROM expenses instances
         WHERE instances.recurring_template_id = e.id
           AND substr(instances.date, 1, 7) = substr(?1, 1, 7)
       )
     ORDER BY e.date ASC;`,
    [asOf]
  );

  const dueExpenses: Expense[] = [];
  for (const row of dueTemplateRows) {
    const expense = await getExpenseById(db, row.id);
    if (expense) {
      dueExpenses.push(expense);
    }
  }

  return dueExpenses;
}

export async function getRecurringTemplates(db: SQLiteDatabase): Promise<Expense[]> {
  const rows = await db.getAllAsync<{
    id: string;
    amount: number;
    category_id: string;
    note: string | null;
    date: string;
    type: Expense['type'];
    split_with: string | null;
    split_amount: number | null;
    is_recurring: number;
    recurring_interval: 'monthly' | null;
    settled: number;
    recurring_template_id: string | null;
  }>(
    `SELECT
      id, amount, category_id, note, date, type, split_with, split_amount,
      is_recurring, recurring_interval, settled, recurring_template_id
     FROM expenses
     WHERE is_recurring = 1
     ORDER BY date DESC, id DESC;`
  );

  return rows.map((row) => ({
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
  }));
}

export async function createRecurringInstance(
  db: SQLiteDatabase,
  templateId: string,
  date: string
): Promise<Expense> {
  assertDateFormat(date, 'date');

  const template = await getExpenseById(db, templateId);
  if (!template) {
    throw new DatabaseError(`Recurring template ${templateId} not found`, 'NOT_FOUND');
  }

  if (!template.isRecurring || template.recurringInterval !== 'monthly') {
    throw new DatabaseError('Expense is not a recurring monthly template', 'CONSTRAINT_VIOLATION');
  }

  const month = date.slice(0, 7);
  const existingInstance = await db.getFirstAsync<{ id: string }>(
    `SELECT id
     FROM expenses
     WHERE recurring_template_id = ?
       AND substr(date, 1, 7) = ?
     LIMIT 1;`,
    [templateId, month]
  );

  if (existingInstance) {
    throw new DatabaseError('Recurring instance already exists for this month', 'CONSTRAINT_VIOLATION');
  }

  return insertExpense(db, {
    amount: template.amount,
    categoryId: template.categoryId,
    note: template.note,
    date,
    type: template.type,
    splitWith: template.splitWith,
    splitAmount: template.splitAmount,
    isRecurring: false,
    recurringInterval: undefined,
    settled: false,
    recurringTemplateId: templateId,
  });
}
