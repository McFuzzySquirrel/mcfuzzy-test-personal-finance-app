import type { SQLiteDatabase } from 'expo-sqlite';

import { getAppStateValue, LAST_ACTIVE_MONTH_KEY, setAppStateValue } from '@/db/appState';
import { getBudgetsByMonth, rolloverBudgets, upsertBudget } from '@/db/budgets';
import { deleteCategory, getAllCategories, insertCategory, updateCategory } from '@/db/categories';
import { DatabaseError } from '@/db/errors';
import {
  deleteExpense,
  getExpenseById,
  getExpensesByMonth,
  getMonthlyTotalByCategory,
  getMonthlyTotals,
  getOutstandingSplits,
  getWeeklyTotalsByDay,
  insertExpense,
  markSplitSettled,
  updateExpense,
} from '@/db/expenses';
import { createRecurringInstance, getDueRecurringExpenses, getRecurringTemplates } from '@/db/recurring';
import { seedDefaultCategories } from '@/db/seeds';

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

  it('reads and writes app state values', async () => {
    db.runAsync.mockResolvedValue({ changes: 1 });
    db.getFirstAsync.mockResolvedValueOnce({ key: LAST_ACTIVE_MONTH_KEY, value: '2026-03' }).mockResolvedValueOnce(null);

    await setAppStateValue(db, LAST_ACTIVE_MONTH_KEY, '2026-03');
    const currentValue = await getAppStateValue(db, LAST_ACTIVE_MONTH_KEY);
    const missingValue = await getAppStateValue(db, 'missing-key');

    expect(db.runAsync).toHaveBeenCalledWith(expect.stringContaining('ON CONFLICT(key) DO UPDATE'), expect.any(Array));
    expect(currentValue).toBe('2026-03');
    expect(missingValue).toBeNull();
  });

  it('seeds default categories only when categories table is empty', async () => {
    db.getFirstAsync.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 7 });
    db.runAsync.mockResolvedValue({ changes: 1 });

    await seedDefaultCategories(db);
    await seedDefaultCategories(db);

    expect(db.runAsync).toHaveBeenCalledTimes(7);
    expect(db.runAsync).toHaveBeenCalledWith(
      'INSERT INTO categories (id, name, icon, is_custom) VALUES (?, ?, ?, ?);',
      ['default-food', 'Food', null, 0]
    );
  });

  it('updates a custom category name, icon and isCustom flag', async () => {
    db.runAsync.mockResolvedValue({ changes: 1 });
    db.getFirstAsync.mockResolvedValueOnce({
      id: 'custom-1',
      name: 'Updated Name',
      icon: 'star',
      is_custom: 1,
    });

    const result = await updateCategory(db, 'custom-1', { name: 'Updated Name', icon: 'star', isCustom: true });

    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE categories SET'),
      expect.arrayContaining(['Updated Name', 'star', 1, 'custom-1'])
    );
    expect(result.name).toBe('Updated Name');
    expect(result.icon).toBe('star');
  });

  it('updateCategory throws INVALID_INPUT when no fields provided', async () => {
    await expect(updateCategory(db, 'custom-1', {})).rejects.toMatchObject({
      name: 'DatabaseError',
      code: 'INVALID_INPUT',
    });
  });

  it('updateCategory throws NOT_FOUND when category does not exist (changes === 0)', async () => {
    db.runAsync.mockResolvedValue({ changes: 0 });

    await expect(updateCategory(db, 'nonexistent', { name: 'New' })).rejects.toMatchObject({
      name: 'DatabaseError',
      code: 'NOT_FOUND',
    });
  });

  it('updateCategory throws NOT_FOUND when getFirstAsync returns null after update', async () => {
    db.runAsync.mockResolvedValue({ changes: 1 });
    db.getFirstAsync.mockResolvedValueOnce(null);

    await expect(updateCategory(db, 'custom-1', { name: 'Ghost' })).rejects.toMatchObject({
      name: 'DatabaseError',
      code: 'NOT_FOUND',
    });
  });

  it('deleteCategory throws NOT_FOUND when category does not exist', async () => {
    db.getFirstAsync.mockResolvedValueOnce(null);

    await expect(deleteCategory(db, 'missing')).rejects.toMatchObject({
      name: 'DatabaseError',
      code: 'NOT_FOUND',
    });
  });

  it('returns outstanding split/lent/borrowed expenses', async () => {
    db.getAllAsync.mockResolvedValueOnce([
      {
        id: 'split-1',
        amount: 5000,
        category_id: 'cat-1',
        note: 'Dinner',
        date: '2026-03-10',
        type: 'split',
        split_with: 'Alice',
        split_amount: 2500,
        is_recurring: 0,
        recurring_interval: null,
        settled: 0,
        recurring_template_id: null,
      },
      {
        id: 'lent-1',
        amount: 3000,
        category_id: 'cat-1',
        note: null,
        date: '2026-03-11',
        type: 'lent',
        split_with: 'Bob',
        split_amount: null,
        is_recurring: 0,
        recurring_interval: null,
        settled: 0,
        recurring_template_id: null,
      },
    ]);

    const outstanding = await getOutstandingSplits(db);
    expect(outstanding).toHaveLength(2);
    expect(outstanding[0].type).toBe('split');
    expect(outstanding[0].settled).toBe(false);
    expect(outstanding[1].type).toBe('lent');
    expect(db.getAllAsync.mock.calls[0][0]).toContain("type IN ('split', 'lent', 'borrowed')");
    expect(db.getAllAsync.mock.calls[0][0]).toContain('settled = 0');
  });

  it('marks a split expense as settled', async () => {
    db.runAsync.mockResolvedValue({ changes: 1 });

    await markSplitSettled(db, 'split-1');

    expect(db.runAsync).toHaveBeenCalledWith(
      expect.stringContaining('SET settled = 1'),
      ['split-1']
    );
  });

  it('markSplitSettled throws NOT_FOUND when expense does not exist', async () => {
    db.runAsync.mockResolvedValue({ changes: 0 });
    db.getFirstAsync.mockResolvedValueOnce(null); // getExpenseById returns null

    await expect(markSplitSettled(db, 'missing')).rejects.toMatchObject({
      name: 'DatabaseError',
      code: 'NOT_FOUND',
    });
  });

  it('markSplitSettled throws CONSTRAINT_VIOLATION for non-split expense types', async () => {
    db.runAsync.mockResolvedValue({ changes: 0 });
    db.getFirstAsync.mockResolvedValueOnce({
      id: 'expense-1',
      amount: 1000,
      category_id: 'cat-1',
      note: null,
      date: '2026-03-01',
      type: 'expense',
      split_with: null,
      split_amount: null,
      is_recurring: 0,
      recurring_interval: null,
      settled: 0,
      recurring_template_id: null,
    });

    await expect(markSplitSettled(db, 'expense-1')).rejects.toMatchObject({
      name: 'DatabaseError',
      code: 'CONSTRAINT_VIOLATION',
    });
  });

  it('updateExpense throws INVALID_INPUT when no fields provided', async () => {
    await expect(updateExpense(db, 'exp-1', {})).rejects.toMatchObject({
      name: 'DatabaseError',
      code: 'INVALID_INPUT',
    });
  });

  it('getMonthlyTotals returns empty array for empty months input', async () => {
    const result = await getMonthlyTotals(db, []);
    expect(result).toEqual([]);
    expect(db.getAllAsync).not.toHaveBeenCalled();
  });

  it('getRecurringTemplates returns recurring expense rows', async () => {
    db.getAllAsync.mockResolvedValueOnce([
      {
        id: 'tmpl-1',
        amount: 18900,
        category_id: 'cat-subscriptions',
        note: 'Streaming',
        date: '2026-01-05',
        type: 'expense',
        split_with: null,
        split_amount: null,
        is_recurring: 1,
        recurring_interval: 'monthly',
        settled: 0,
        recurring_template_id: null,
      },
    ]);

    const templates = await getRecurringTemplates(db);
    expect(templates).toHaveLength(1);
    expect(templates[0].isRecurring).toBe(true);
    expect(templates[0].recurringInterval).toBe('monthly');
    expect(db.getAllAsync.mock.calls[0][0]).toContain('is_recurring = 1');
  });

  it('createRecurringInstance throws CONSTRAINT_VIOLATION for non-recurring template', async () => {
    db.getFirstAsync.mockResolvedValueOnce({
      id: 'not-recurring',
      amount: 1000,
      category_id: 'cat-1',
      note: null,
      date: '2026-01-10',
      type: 'expense',
      split_with: null,
      split_amount: null,
      is_recurring: 0,
      recurring_interval: null,
      settled: 0,
      recurring_template_id: null,
    });

    await expect(createRecurringInstance(db, 'not-recurring', '2026-03-10')).rejects.toMatchObject({
      name: 'DatabaseError',
      code: 'CONSTRAINT_VIOLATION',
    });
  });

  it('createRecurringInstance throws NOT_FOUND when template is missing', async () => {
    db.getFirstAsync.mockResolvedValueOnce(null);

    await expect(createRecurringInstance(db, 'missing-tmpl', '2026-03-10')).rejects.toMatchObject({
      name: 'DatabaseError',
      code: 'NOT_FOUND',
    });
  });
});
