import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as expensesDb from '@/db/expenses';
import * as recurringDb from '@/db/recurring';
import { useRecurring } from '@/hooks/useRecurring';
import { useDatabase } from '@/store/DatabaseProvider';
import type { Expense } from '@/types';

jest.mock('@/store/DatabaseProvider', () => ({
  useDatabase: jest.fn(),
}));

jest.mock('@/db/expenses');
jest.mock('@/db/recurring');

// Mock date utils so tests are deterministic
jest.mock('@/utils/date', () => ({
  formatISODate: jest.fn(() => '2026-03-15'),
  formatMonthKey: jest.fn(() => '2026-03'),
}));

const mockDb = {
  execAsync: jest.fn(),
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  runAsync: jest.fn(),
  withTransactionAsync: jest.fn(async (cb: () => Promise<void>) => cb()),
};

const mockTemplate: Expense = {
  id: 'tmpl-1',
  amount: 18900,
  categoryId: 'cat-subscriptions',
  date: '2026-01-05',
  type: 'expense',
  isRecurring: true,
  recurringInterval: 'monthly',
  settled: false,
  note: 'Streaming',
};

const mockInstance: Expense = {
  id: 'inst-1',
  amount: 18900,
  categoryId: 'cat-subscriptions',
  date: '2026-03-05',
  type: 'expense',
  isRecurring: false,
  recurringTemplateId: 'tmpl-1',
  settled: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  (useDatabase as jest.Mock).mockReturnValue(mockDb);
});

describe('useRecurring', () => {
  it('loads recurring templates on mount', async () => {
    (recurringDb.getRecurringTemplates as jest.Mock).mockResolvedValue([mockTemplate]);

    const { result } = renderHook(() => useRecurring());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.recurringList).toEqual([mockTemplate]);
    expect(result.current.error).toBeNull();
    expect(recurringDb.getRecurringTemplates).toHaveBeenCalledWith(mockDb);
  });

  it('returns empty list when no templates', async () => {
    (recurringDb.getRecurringTemplates as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useRecurring());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.recurringList).toEqual([]);
  });

  it('sets error when load fails with Error instance', async () => {
    (recurringDb.getRecurringTemplates as jest.Mock).mockRejectedValue(new Error('Recurring error'));

    const { result } = renderHook(() => useRecurring());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Recurring error');
  });

  it('uses generic message for non-Error rejections', async () => {
    (recurringDb.getRecurringTemplates as jest.Mock).mockRejectedValue('fail');

    const { result } = renderHook(() => useRecurring());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Unable to load recurring expenses.');
  });

  it('adds a recurring template via insertExpense and refreshes', async () => {
    (recurringDb.getRecurringTemplates as jest.Mock).mockResolvedValue([]);
    (expensesDb.insertExpense as jest.Mock).mockResolvedValue(mockTemplate);

    const { result } = renderHook(() => useRecurring());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    (recurringDb.getRecurringTemplates as jest.Mock).mockResolvedValue([mockTemplate]);

    await act(async () => {
      await result.current.addRecurringTemplate({
        amount: 18900,
        categoryId: 'cat-subscriptions',
        dayOfMonth: 5,
        note: 'Streaming',
      });
    });

    expect(expensesDb.insertExpense).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({
        amount: 18900,
        categoryId: 'cat-subscriptions',
        isRecurring: true,
        recurringInterval: 'monthly',
        type: 'expense',
      })
    );
    expect(result.current.recurringList).toEqual([mockTemplate]);
  });

  it('clamps dayOfMonth to valid range (1–28)', async () => {
    (recurringDb.getRecurringTemplates as jest.Mock).mockResolvedValue([]);
    (expensesDb.insertExpense as jest.Mock).mockResolvedValue(mockTemplate);

    const { result } = renderHook(() => useRecurring());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Day 0 clamps to 1
    await act(async () => {
      await result.current.addRecurringTemplate({
        amount: 100,
        categoryId: 'cat-1',
        dayOfMonth: 0,
      });
    });

    const callArgs = (expensesDb.insertExpense as jest.Mock).mock.calls[0][1];
    expect(callArgs.date).toMatch(/^2026-03-01$/);

    jest.clearAllMocks();
    (recurringDb.getRecurringTemplates as jest.Mock).mockResolvedValue([]);
    (expensesDb.insertExpense as jest.Mock).mockResolvedValue(mockTemplate);

    // Day 35 clamps to 28
    await act(async () => {
      await result.current.addRecurringTemplate({
        amount: 100,
        categoryId: 'cat-1',
        dayOfMonth: 35,
      });
    });

    const callArgs2 = (expensesDb.insertExpense as jest.Mock).mock.calls[0][1];
    expect(callArgs2.date).toMatch(/^2026-03-28$/);
  });

  it('autoCreateDue creates instances for due templates', async () => {
    (recurringDb.getRecurringTemplates as jest.Mock).mockResolvedValue([mockTemplate]);
    (recurringDb.getDueRecurringExpenses as jest.Mock).mockResolvedValue([mockTemplate]);
    (recurringDb.createRecurringInstance as jest.Mock).mockResolvedValue(mockInstance);

    const { result } = renderHook(() => useRecurring());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let count: number | undefined;
    await act(async () => {
      count = await result.current.autoCreateDue('2026-03-15');
    });

    expect(count).toBe(1);
    expect(recurringDb.getDueRecurringExpenses).toHaveBeenCalledWith(mockDb, '2026-03-15');
    expect(recurringDb.createRecurringInstance).toHaveBeenCalledWith(mockDb, 'tmpl-1', '2026-03-05');
  });

  it('autoCreateDue silently ignores createRecurringInstance errors', async () => {
    (recurringDb.getRecurringTemplates as jest.Mock).mockResolvedValue([mockTemplate]);
    (recurringDb.getDueRecurringExpenses as jest.Mock).mockResolvedValue([mockTemplate]);
    (recurringDb.createRecurringInstance as jest.Mock).mockRejectedValue(new Error('Already exists'));

    const { result } = renderHook(() => useRecurring());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let count: number | undefined;
    await act(async () => {
      count = await result.current.autoCreateDue('2026-03-15');
    });

    expect(count).toBe(0); // error suppressed, no instances created
  });

  it('autoCreateDue uses default asOf date when not provided', async () => {
    (recurringDb.getRecurringTemplates as jest.Mock).mockResolvedValue([]);
    (recurringDb.getDueRecurringExpenses as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useRecurring());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.autoCreateDue();
    });

    // formatISODate mock returns '2026-03-15'
    expect(recurringDb.getDueRecurringExpenses).toHaveBeenCalledWith(mockDb, '2026-03-15');
  });

  it('refreshRecurring is callable directly', async () => {
    (recurringDb.getRecurringTemplates as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useRecurring());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    (recurringDb.getRecurringTemplates as jest.Mock).mockResolvedValue([mockTemplate]);
    await act(async () => {
      await result.current.refreshRecurring();
    });

    expect(result.current.recurringList).toEqual([mockTemplate]);
  });
});
