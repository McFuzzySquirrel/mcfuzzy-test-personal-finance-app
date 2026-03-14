import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as expensesDb from '@/db/expenses';
import { useMonthlyTotals } from '@/hooks/useMonthlyTotals';
import { useDatabase } from '@/store/DatabaseProvider';

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

beforeEach(() => {
  jest.clearAllMocks();
  (useDatabase as jest.Mock).mockReturnValue(mockDb);
});

describe('useMonthlyTotals', () => {
  it('loads category totals and builds the map', async () => {
    (expensesDb.getMonthlyTotalByCategory as jest.Mock).mockResolvedValue([
      { categoryId: 'cat-1', total: 20000 },
      { categoryId: 'cat-2', total: 5000 },
    ]);

    const { result } = renderHook(() => useMonthlyTotals('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.totalsByCategoryId).toEqual({
      'cat-1': 20000,
      'cat-2': 5000,
    });
    expect(result.current.error).toBeNull();
    expect(expensesDb.getMonthlyTotalByCategory).toHaveBeenCalledWith(mockDb, '2026-03');
  });

  it('returns empty map when no expenses', async () => {
    (expensesDb.getMonthlyTotalByCategory as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useMonthlyTotals('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.totalsByCategoryId).toEqual({});
  });

  it('starts loading as true', () => {
    (expensesDb.getMonthlyTotalByCategory as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useMonthlyTotals('2026-03'));

    expect(result.current.isLoading).toBe(true);
  });

  it('sets error when load fails with Error instance', async () => {
    (expensesDb.getMonthlyTotalByCategory as jest.Mock).mockRejectedValue(
      new Error('Monthly totals error')
    );

    const { result } = renderHook(() => useMonthlyTotals('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Monthly totals error');
    expect(result.current.totalsByCategoryId).toEqual({});
  });

  it('uses generic message for non-Error rejections', async () => {
    (expensesDb.getMonthlyTotalByCategory as jest.Mock).mockRejectedValue({ code: 'ERR' });

    const { result } = renderHook(() => useMonthlyTotals('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Unable to load monthly totals.');
  });

  it('refreshTotals is callable directly', async () => {
    (expensesDb.getMonthlyTotalByCategory as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useMonthlyTotals('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    (expensesDb.getMonthlyTotalByCategory as jest.Mock).mockResolvedValue([
      { categoryId: 'cat-1', total: 9999 },
    ]);

    await act(async () => {
      await result.current.refreshTotals();
    });

    expect(result.current.totalsByCategoryId).toEqual({ 'cat-1': 9999 });
  });
});
