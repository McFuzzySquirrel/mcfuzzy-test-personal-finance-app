import type { SQLiteDatabase } from 'expo-sqlite';

import { getBudgetsByMonth, rolloverBudgets, upsertBudget } from '@/db/budgets';
import { deleteCategory, getAllCategories, insertCategory } from '@/db/categories';
import { DatabaseError } from '@/db/errors';
import {
  deleteExpense,
  getExpenseById,
  getExpensesByMonth,
  getMonthlyTotalByCategory,
  getMonthlyTotals,
  getWeeklyTotalsByDay,
  insertExpense,
  updateExpense,
} from '@/db/expenses';
import { createRecurringInstance, getDueRecurringExpenses } from '@/db/recurring';

type MockDb = {
  execAsync: jest.Mock;
  getAllAsync: jest.Mock;
  getFirstAsync: jest.Mock;
  runAsync: jest.Mock;
  withTransactionAsync: jest.Mock;
};

function createMockDb(): MockDb & SQLiteDatabase {
  return {
    execAsync: jest.fn(),
    getAllAsync: jest.fn(),
    getFirstAsync: jest.fn(),
    runAsync: jest.fn(),
    withTransactionAsync: jest.fn(async (callback: () => Promise<void>) => callback()),
  } as unknown as MockDb & SQLiteDatabase;
}

describe('db data layer', () => {
  let db: MockDb & SQLiteDatabase;

  beforeEach(() => {
    db = createMockDb();
  });

  it('supports expense CRUD for integer-cent amounts', async () => {
    db.runAsync.mockResolvedValue({ changes: 1 });
    db.getFirstAsync
      .mockResolvedValueOnce({
        id: 'expense-1',
        amount: 1250,
        category_id: 'default-food',
        note: 'Groceries',
        date: '2026-03-14',
        type: 'expense',
        split_with: null,
        split_amount: null,
        is_recurring: 0,
        recurring_interval: null,
        settled: 0,
        recurring_template_id: null,
      })
      .mockResolvedValueOnce({
        id: 'expense-1',
        amount: 1250,
        category_id: 'default-food',
        note: 'Groceries',
        date: '2026-03-14',
        type: 'expense',
        split_with: null,
        split_amount: null,
        is_recurring: 0,
        recurring_interval: null,
        settled: 0,
        recurring_template_id: null,
      })
      .mockResolvedValueOnce({
        id: 'expense-1',
        amount: 1400,
        category_id: 'default-food',
        note: 'Groceries and snacks',
        date: '2026-03-14',
        type: 'expense',
        split_with: null,
        split_amount: null,
        is_recurring: 0,
        recurring_interval: null,
        settled: 0,
        recurring_template_id: null,
      })
      .mockResolvedValueOnce(null);
    db.getAllAsync.mockResolvedValueOnce([
      {
        id: 'expense-1',
        amount: 1400,
        category_id: 'default-food',
        note: 'Groceries and snacks',
        date: '2026-03-14',
        type: 'expense',
        split_with: null,
        split_amount: null,
        is_recurring: 0,
        recurring_interval: null,
        settled: 0,
        recurring_template_id: null,
      },
    ]);

    const created = await insertExpense(db, {
      amount: 1250,
      categoryId: 'default-food',
      note: 'Groceries',
      date: '2026-03-14',
      type: 'expense',
      settled: false,
    });

    expect(db.runAsync).toHaveBeenCalled();
    expect(created.amount).toBe(1250);
    expect(created.id).toBe('expense-1');

    const loaded = await getExpenseById(db, 'expense-1');
    expect(loaded?.note).toBe('Groceries');

    const updated = await updateExpense(db, 'expense-1', { amount: 1400, note: 'Groceries and snacks' });
    expect(updated.amount).toBe(1400);
    expect(updated.note).toBe('Groceries and snacks');

    const monthly = await getExpensesByMonth(db, '2026-03');
    expect(monthly).toHaveLength(1);

    await deleteExpense(db, 'expense-1');
    const afterDelete = await getExpenseById(db, 'expense-1');
    expect(afterDelete).toBeNull();
  });

  it('returns monthly and weekly aggregations', async () => {
    db.getAllAsync
      .mockResolvedValueOnce([
        { category_id: 'default-food', total: 1000 },
        { category_id: 'default-transport', total: 2000 },
      ])
      .mockResolvedValueOnce([
        { month: '2026-02', total: 900 },
        { month: '2026-03', total: 3000 },
      ])
      .mockResolvedValueOnce([
        { date: '2026-03-10', total: 1000 },
        { date: '2026-03-12', total: 2000 },
      ]);

    const byCategory = await getMonthlyTotalByCategory(db, '2026-03');
    expect(byCategory).toEqual(
      expect.arrayContaining([
        { categoryId: 'default-food', total: 1000 },
        { categoryId: 'default-transport', total: 2000 },
      ])
    );

    const monthlyTotals = await getMonthlyTotals(db, ['2026-02', '2026-03', '2026-04']);
    expect(monthlyTotals).toEqual([
      { month: '2026-02', total: 900 },
      { month: '2026-03', total: 3000 },
      { month: '2026-04', total: 0 },
    ]);

    const weekly = await getWeeklyTotalsByDay(db, '2026-03-09');
    expect(weekly).toHaveLength(7);
    expect(weekly.find((entry) => entry.date === '2026-03-10')?.total).toBe(1000);
    expect(weekly.find((entry) => entry.date === '2026-03-12')?.total).toBe(2000);

    expect(db.getAllAsync.mock.calls[0][0]).toContain("type IN ('expense', 'split')");
    expect(db.getAllAsync.mock.calls[1][0]).toContain("type IN ('expense', 'split')");
    expect(db.getAllAsync.mock.calls[2][0]).toContain("type IN ('expense', 'split')");
  });

  it('prevents deletion of system categories but allows custom category deletion', async () => {
    db.getFirstAsync.mockResolvedValueOnce({ is_custom: 0 });
    await expect(deleteCategory(db, 'default-food')).rejects.toMatchObject({
      name: 'DatabaseError',
      code: 'PROTECTED_RESOURCE',
    });

    db.getFirstAsync
      .mockResolvedValueOnce({
        id: 'custom-laundry',
        name: 'Laundry',
        icon: 'basket',
        is_custom: 1,
      })
      .mockResolvedValueOnce({ is_custom: 1 });
    db.getAllAsync.mockResolvedValueOnce([
      { id: 'default-food', name: 'Food', icon: null, is_custom: 0 },
      { id: 'default-transport', name: 'Transport', icon: null, is_custom: 0 },
    ]);

    const customCategory = await insertCategory(db, {
      name: 'Laundry',
      icon: 'basket',
      isCustom: true,
    });

    await deleteCategory(db, customCategory.id);
    const categories = await getAllCategories(db);
    expect(categories.find((category) => category.id === customCategory.id)).toBeUndefined();
  });

  it('rolls over budgets to a new month only when missing', async () => {
    db.runAsync.mockResolvedValue({ changes: 1 });
    db.getFirstAsync
      .mockResolvedValueOnce({ category_id: 'default-food', month: '2026-03', limit_amount: 50000 })
      .mockResolvedValueOnce({ category_id: 'default-rent', month: '2026-03', limit_amount: 250000 })
      .mockResolvedValueOnce({ category_id: 'default-food', month: '2026-04', limit_amount: 70000 });
    db.getAllAsync.mockResolvedValueOnce([
      { category_id: 'default-food', month: '2026-04', limit_amount: 70000 },
      { category_id: 'default-rent', month: '2026-04', limit_amount: 250000 },
    ]);

    await upsertBudget(db, { categoryId: 'default-food', month: '2026-03', limitAmount: 50000 });
    await upsertBudget(db, { categoryId: 'default-rent', month: '2026-03', limitAmount: 250000 });
    await upsertBudget(db, { categoryId: 'default-food', month: '2026-04', limitAmount: 70000 });

    await rolloverBudgets(db, '2026-03', '2026-04');
    const aprilBudgets = await getBudgetsByMonth(db, '2026-04');

    expect(aprilBudgets).toEqual(
      expect.arrayContaining([
        { categoryId: 'default-food', month: '2026-04', limitAmount: 70000 },
        { categoryId: 'default-rent', month: '2026-04', limitAmount: 250000 },
      ])
    );
  });

  it('finds due recurring templates and creates one monthly instance', async () => {
    db.getAllAsync.mockResolvedValueOnce([{ id: 'template-1' }]);
    db.getFirstAsync
      .mockResolvedValueOnce({
        id: 'template-1',
        amount: 18900,
        category_id: 'default-subscriptions',
        note: 'Streaming bundle',
        date: '2026-01-05',
        type: 'expense',
        split_with: null,
        split_amount: null,
        is_recurring: 1,
        recurring_interval: 'monthly',
        settled: 0,
        recurring_template_id: null,
      })
      .mockResolvedValueOnce({
        id: 'template-1',
        amount: 18900,
        category_id: 'default-subscriptions',
        note: 'Streaming bundle',
        date: '2026-01-05',
        type: 'expense',
        split_with: null,
        split_amount: null,
        is_recurring: 1,
        recurring_interval: 'monthly',
        settled: 0,
        recurring_template_id: null,
      })
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'instance-1',
        amount: 18900,
        category_id: 'default-subscriptions',
        note: 'Streaming bundle',
        date: '2026-03-05',
        type: 'expense',
        split_with: null,
        split_amount: null,
        is_recurring: 0,
        recurring_interval: null,
        settled: 0,
        recurring_template_id: 'template-1',
      })
      .mockResolvedValueOnce({ id: 'instance-existing' });
    db.runAsync.mockResolvedValue({ changes: 1 });

    const due = await getDueRecurringExpenses(db, '2026-03-20');
    expect(due.map((entry) => entry.id)).toContain('template-1');

    const instance = await createRecurringInstance(db, 'template-1', '2026-03-05');
    expect(instance.recurringTemplateId).toBe('template-1');
    expect(instance.isRecurring).toBe(false);

    await expect(createRecurringInstance(db, 'template-1', '2026-03-10')).rejects.toBeInstanceOf(DatabaseError);
  });
});
