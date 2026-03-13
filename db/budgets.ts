import type { SQLiteDatabase } from 'expo-sqlite';

import { DatabaseError } from '@/db/errors';
import { assertIntegerAmount, assertMonthFormat } from '@/db/shared';
import type { Budget } from '@/types';

type BudgetRow = {
  category_id: string;
  month: string;
  limit_amount: number;
};

function mapBudgetRow(row: BudgetRow): Budget {
  return {
    categoryId: row.category_id,
    month: row.month,
    limitAmount: row.limit_amount,
  };
}

export async function getBudgetsByMonth(db: SQLiteDatabase, month: string): Promise<Budget[]> {
  assertMonthFormat(month);
  const rows = await db.getAllAsync<BudgetRow>(
    'SELECT category_id, month, limit_amount FROM budgets WHERE month = ? ORDER BY category_id ASC;',
    [month]
  );

  return rows.map(mapBudgetRow);
}

export async function upsertBudget(db: SQLiteDatabase, budget: Budget): Promise<Budget> {
  assertMonthFormat(budget.month);
  assertIntegerAmount(budget.limitAmount, 'limitAmount');

  await db.runAsync(
    `INSERT INTO budgets (category_id, month, limit_amount)
     VALUES (?, ?, ?)
     ON CONFLICT(category_id, month) DO UPDATE SET limit_amount = excluded.limit_amount;`,
    [budget.categoryId, budget.month, budget.limitAmount]
  );

  const updated = await getBudgetForCategory(db, budget.categoryId, budget.month);
  if (!updated) {
    throw new DatabaseError('Failed to upsert budget', 'CONSTRAINT_VIOLATION');
  }

  return updated;
}

export async function getBudgetForCategory(
  db: SQLiteDatabase,
  categoryId: string,
  month: string
): Promise<Budget | null> {
  assertMonthFormat(month);

  const row = await db.getFirstAsync<BudgetRow>(
    'SELECT category_id, month, limit_amount FROM budgets WHERE category_id = ? AND month = ?;',
    [categoryId, month]
  );

  return row ? mapBudgetRow(row) : null;
}

export async function deleteBudget(db: SQLiteDatabase, categoryId: string, month: string): Promise<void> {
  assertMonthFormat(month);

  await db.runAsync('DELETE FROM budgets WHERE category_id = ? AND month = ?;', [categoryId, month]);
}

export async function rolloverBudgets(db: SQLiteDatabase, fromMonth: string, toMonth: string): Promise<void> {
  assertMonthFormat(fromMonth);
  assertMonthFormat(toMonth);

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO budgets (category_id, month, limit_amount)
       SELECT b.category_id, ?, b.limit_amount
       FROM budgets b
       WHERE b.month = ?
         AND NOT EXISTS (
           SELECT 1
           FROM budgets existing
           WHERE existing.category_id = b.category_id
             AND existing.month = ?
         );`,
      [toMonth, fromMonth, toMonth]
    );
  });
}
