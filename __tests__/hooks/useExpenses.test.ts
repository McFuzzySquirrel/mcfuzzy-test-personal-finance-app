import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as expensesDb from '@/db/expenses';
import { useExpenses } from '@/hooks/useExpenses';
import { useDatabase } from '@/store/DatabaseProvider';
import type { Expense } from '@/types';

jest.mock('@/store/DatabaseProvider', () => ({
  useDatabase: jest.fn(),
}));

jest.mock('@/db/expenses');

const mockDb = {
  execAsync: jest.fn(),
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  runAsync: jest.fn(),
  withTransactionAsync: jest.fn(async (cb: () => Promise<void>) => cb()),
};

const mockExpense: Expense = {
  id: 'exp-1',
  amount: 1000,
  categoryId: 'cat-1',
  date: '2026-03-15',
  type: 'expense',
  settled: false,
  isRecurring: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  (useDatabase as jest.Mock).mockReturnValue(mockDb);
});

describe('useExpenses', () => {
  it('returns empty expenses and not loading when no month provided', async () => {
    const { result } = renderHook(() => useExpenses());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.expenses).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(expensesDb.getExpensesByMonth).not.toHaveBeenCalled();
  });

  it('loads expenses for the given month', async () => {
    (expensesDb.getExpensesByMonth as jest.Mock).mockResolvedValue([mockExpense]);

    const { result } = renderHook(() => useExpenses('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.expenses).toEqual([mockExpense]);
    expect(result.current.error).toBeNull();
    expect(expensesDb.getExpensesByMonth).toHaveBeenCalledWith(mockDb, '2026-03');
  });

  it('sets error when load fails with an Error instance', async () => {
    (expensesDb.getExpensesByMonth as jest.Mock).mockRejectedValue(new Error('DB read error'));

    const { result } = renderHook(() => useExpenses('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('DB read error');
    expect(result.current.expenses).toEqual([]);
  });

  it('uses generic message for non-Error rejections', async () => {
    (expensesDb.getExpensesByMonth as jest.Mock).mockRejectedValue('string error');

    const { result } = renderHook(() => useExpenses('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Unable to load expenses.');
  });

  it('creates an expense and refreshes the list when month matches', async () => {
    (expensesDb.getExpensesByMonth as jest.Mock).mockResolvedValue([]);
    (expensesDb.insertExpense as jest.Mock).mockResolvedValue(mockExpense);

    const { result } = renderHook(() => useExpenses('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    (expensesDb.getExpensesByMonth as jest.Mock).mockResolvedValue([mockExpense]);

    let created: Expense | undefined;
    await act(async () => {
      created = await result.current.createExpense({
        amount: 1000,
        categoryId: 'cat-1',
        date: '2026-03-15',
        type: 'expense',
        settled: false,
      });
    });

    expect(created).toEqual(mockExpense);
    expect(expensesDb.insertExpense).toHaveBeenCalled();
    expect(expensesDb.getExpensesByMonth).toHaveBeenCalled();
  });

  it('creates an expense without refreshing when month does not match expense date', async () => {
    (expensesDb.getExpensesByMonth as jest.Mock).mockResolvedValue([]);
    const futureExpense: Expense = { ...mockExpense, date: '2026-04-01' };
    (expensesDb.insertExpense as jest.Mock).mockResolvedValue(futureExpense);

    const { result } = renderHook(() => useExpenses('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const callsBefore = (expensesDb.getExpensesByMonth as jest.Mock).mock.calls.length;

    await act(async () => {
      await result.current.createExpense({
        amount: 500,
        categoryId: 'cat-1',
        date: '2026-04-01',
        type: 'expense',
        settled: false,
      });
    });

    // No additional refresh since the date is outside the current month
    expect((expensesDb.getExpensesByMonth as jest.Mock).mock.calls.length).toBe(callsBefore);
  });

  it('gets a single expense by id', async () => {
    (expensesDb.getExpensesByMonth as jest.Mock).mockResolvedValue([]);
    (expensesDb.getExpenseById as jest.Mock).mockResolvedValue(mockExpense);

    const { result } = renderHook(() => useExpenses('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let expense: Expense | null | undefined;
    await act(async () => {
      expense = await result.current.getExpense('exp-1');
    });

    expect(expense).toEqual(mockExpense);
    expect(expensesDb.getExpenseById).toHaveBeenCalledWith(mockDb, 'exp-1');
  });

  it('saves (updates) an expense and refreshes', async () => {
    (expensesDb.getExpensesByMonth as jest.Mock).mockResolvedValue([mockExpense]);
    const updatedExpense: Expense = { ...mockExpense, amount: 2000 };
    (expensesDb.updateExpense as jest.Mock).mockResolvedValue(updatedExpense);

    const { result } = renderHook(() => useExpenses('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let saved: Expense | undefined;
    await act(async () => {
      saved = await result.current.saveExpense('exp-1', { amount: 2000 });
    });

    expect(saved).toEqual(updatedExpense);
    expect(expensesDb.updateExpense).toHaveBeenCalledWith(mockDb, 'exp-1', { amount: 2000 });
  });

  it('removes an expense and refreshes', async () => {
    (expensesDb.getExpensesByMonth as jest.Mock).mockResolvedValue([mockExpense]);
    (expensesDb.deleteExpense as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useExpenses('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.removeExpense('exp-1');
    });

    expect(expensesDb.deleteExpense).toHaveBeenCalledWith(mockDb, 'exp-1');
  });

  it('refreshExpenses is callable directly', async () => {
    (expensesDb.getExpensesByMonth as jest.Mock).mockResolvedValue([mockExpense]);

    const { result } = renderHook(() => useExpenses('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    (expensesDb.getExpensesByMonth as jest.Mock).mockResolvedValue([]);
    await act(async () => {
      await result.current.refreshExpenses();
    });

    expect(result.current.expenses).toEqual([]);
  });
});
