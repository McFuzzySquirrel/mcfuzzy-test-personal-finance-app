import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as expensesDb from '@/db/expenses';
import { useSplits } from '@/hooks/useSplits';
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

const mockSplitExpense: Expense = {
  id: 'split-1',
  amount: 5000,
  categoryId: 'cat-1',
  date: '2026-03-15',
  type: 'split',
  splitWith: 'Alex',
  splitAmount: 2500,
  settled: false,
};

const mockLentExpense: Expense = {
  id: 'lent-1',
  amount: 3000,
  categoryId: 'cat-1',
  date: '2026-03-14',
  type: 'lent',
  splitWith: 'Sam',
  settled: false,
};

beforeEach(() => {
  jest.clearAllMocks();
  (useDatabase as jest.Mock).mockReturnValue(mockDb);
});

describe('useSplits', () => {
  it('loads outstanding splits on mount', async () => {
    (expensesDb.getOutstandingSplits as jest.Mock).mockResolvedValue([mockSplitExpense, mockLentExpense]);

    const { result } = renderHook(() => useSplits());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.outstanding).toEqual([mockSplitExpense, mockLentExpense]);
    expect(result.current.error).toBeNull();
    expect(expensesDb.getOutstandingSplits).toHaveBeenCalledWith(mockDb);
  });

  it('returns empty list when no outstanding splits', async () => {
    (expensesDb.getOutstandingSplits as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useSplits());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.outstanding).toEqual([]);
  });

  it('starts loading as true', () => {
    (expensesDb.getOutstandingSplits as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useSplits());

    expect(result.current.isLoading).toBe(true);
  });

  it('sets error when load fails with Error instance', async () => {
    (expensesDb.getOutstandingSplits as jest.Mock).mockRejectedValue(new Error('Splits error'));

    const { result } = renderHook(() => useSplits());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Splits error');
    expect(result.current.outstanding).toEqual([]);
  });

  it('uses generic message for non-Error rejections', async () => {
    (expensesDb.getOutstandingSplits as jest.Mock).mockRejectedValue('network down');

    const { result } = renderHook(() => useSplits());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Unable to load outstanding splits.');
  });

  it('marks an expense as settled and refreshes', async () => {
    (expensesDb.getOutstandingSplits as jest.Mock).mockResolvedValue([mockSplitExpense]);
    (expensesDb.markSplitSettled as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useSplits());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // After settling, the list should be empty
    (expensesDb.getOutstandingSplits as jest.Mock).mockResolvedValue([]);

    await act(async () => {
      await result.current.markAsSettled('split-1');
    });

    expect(expensesDb.markSplitSettled).toHaveBeenCalledWith(mockDb, 'split-1');
    expect(result.current.outstanding).toEqual([]);
  });

  it('refresh is callable directly', async () => {
    (expensesDb.getOutstandingSplits as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useSplits());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    (expensesDb.getOutstandingSplits as jest.Mock).mockResolvedValue([mockLentExpense]);
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.outstanding).toEqual([mockLentExpense]);
  });
});
