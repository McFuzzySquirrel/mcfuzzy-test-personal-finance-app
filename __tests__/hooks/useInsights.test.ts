import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as expensesDb from '@/db/expenses';
import { useCategories } from '@/hooks/useCategories';
import { useCategoryTotals, useMonthlyTrend, useWeeklySummary } from '@/hooks/useInsights';
import { useDatabase } from '@/store/DatabaseProvider';
import type { Category } from '@/types';

jest.mock('@/store/DatabaseProvider', () => ({
  useDatabase: jest.fn(),
}));

jest.mock('@/db/expenses');

jest.mock('@/hooks/useCategories');

const mockDb = {
  execAsync: jest.fn(),
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  runAsync: jest.fn(),
  withTransactionAsync: jest.fn(async (cb: () => Promise<void>) => cb()),
};

const mockCategory: Category = { id: 'cat-1', name: 'Food', isCustom: false };

beforeEach(() => {
  jest.clearAllMocks();
  (useDatabase as jest.Mock).mockReturnValue(mockDb);
  (useCategories as jest.Mock).mockReturnValue({
    categories: [mockCategory],
    error: null,
    isLoading: false,
    createCategory: jest.fn(),
    refreshCategories: jest.fn(),
    removeCategory: jest.fn(),
    saveCategory: jest.fn(),
  });
});

// ─── useCategoryTotals ────────────────────────────────────────────────────────

describe('useCategoryTotals', () => {
  it('loads category totals on mount', async () => {
    (expensesDb.getMonthlyTotalByCategory as jest.Mock).mockResolvedValue([
      { categoryId: 'cat-1', total: 30000 },
    ]);

    const { result } = renderHook(() => useCategoryTotals('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([
      expect.objectContaining({ categoryId: 'cat-1', categoryName: 'Food', total: 30000 }),
    ]);
    expect(result.current.total).toBe(30000);
    expect(result.current.error).toBeNull();
  });

  it('filters out zero-total rows', async () => {
    (expensesDb.getMonthlyTotalByCategory as jest.Mock).mockResolvedValue([
      { categoryId: 'cat-1', total: 0 },
    ]);

    const { result } = renderHook(() => useCategoryTotals('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('uses "Unknown category" for categories not in list', async () => {
    (expensesDb.getMonthlyTotalByCategory as jest.Mock).mockResolvedValue([
      { categoryId: 'unknown-cat', total: 5000 },
    ]);

    const { result } = renderHook(() => useCategoryTotals('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data[0].categoryName).toBe('Unknown category');
  });

  it('sorts by total descending then name ascending', async () => {
    const cat2: Category = { id: 'cat-2', name: 'Arts', isCustom: false };
    (useCategories as jest.Mock).mockReturnValue({
      categories: [mockCategory, cat2],
      error: null,
      isLoading: false,
    });
    (expensesDb.getMonthlyTotalByCategory as jest.Mock).mockResolvedValue([
      { categoryId: 'cat-1', total: 10000 },
      { categoryId: 'cat-2', total: 10000 },
    ]);

    const { result } = renderHook(() => useCategoryTotals('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Arts comes before Food alphabetically when totals are equal
    expect(result.current.data[0].categoryName).toBe('Arts');
    expect(result.current.data[1].categoryName).toBe('Food');
  });

  it('sets error when load fails', async () => {
    (expensesDb.getMonthlyTotalByCategory as jest.Mock).mockRejectedValue(
      new Error('Category totals error')
    );

    const { result } = renderHook(() => useCategoryTotals('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Category totals error');
  });

  it('uses generic message for non-Error rejections', async () => {
    (expensesDb.getMonthlyTotalByCategory as jest.Mock).mockRejectedValue('fail');

    const { result } = renderHook(() => useCategoryTotals('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Unable to load category totals.');
  });

  it('refreshCategoryTotals is callable directly', async () => {
    (expensesDb.getMonthlyTotalByCategory as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useCategoryTotals('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    (expensesDb.getMonthlyTotalByCategory as jest.Mock).mockResolvedValue([
      { categoryId: 'cat-1', total: 5000 },
    ]);
    await act(async () => {
      await result.current.refreshCategoryTotals();
    });

    expect(result.current.total).toBe(5000);
  });

  it('propagates categories error', async () => {
    (useCategories as jest.Mock).mockReturnValue({
      categories: [],
      error: 'cat error',
      isLoading: false,
    });
    (expensesDb.getMonthlyTotalByCategory as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useCategoryTotals('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('cat error');
  });
});

// ─── useMonthlyTrend ──────────────────────────────────────────────────────────

describe('useMonthlyTrend', () => {
  // useMonthlyTrend's refreshMonthlyTrend useCallback depends on the `months` array reference.
  // Pass a stable reference to avoid re-creating the callback every render.
  const twoMonths = ['2026-02', '2026-03'];
  const oneMonth = ['2026-03'];

  it('loads monthly trend data', async () => {
    (expensesDb.getMonthlyTotals as jest.Mock).mockResolvedValue([
      { month: '2026-02', total: 10000 },
      { month: '2026-03', total: 20000 },
    ]);

    const { result } = renderHook(() => useMonthlyTrend(twoMonths));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([
      { month: '2026-02', total: 10000 },
      { month: '2026-03', total: 20000 },
    ]);
    expect(result.current.error).toBeNull();
  });

  it('sets error when load fails', async () => {
    (expensesDb.getMonthlyTotals as jest.Mock).mockRejectedValue(new Error('Trend error'));

    const { result } = renderHook(() => useMonthlyTrend(oneMonth));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Trend error');
  });

  it('uses generic message for non-Error rejections', async () => {
    (expensesDb.getMonthlyTotals as jest.Mock).mockRejectedValue(null);

    const { result } = renderHook(() => useMonthlyTrend(oneMonth));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Unable to load monthly trend.');
  });

  it('refreshMonthlyTrend is callable', async () => {
    (expensesDb.getMonthlyTotals as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useMonthlyTrend(oneMonth));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    (expensesDb.getMonthlyTotals as jest.Mock).mockResolvedValue([{ month: '2026-03', total: 5000 }]);
    await act(async () => {
      await result.current.refreshMonthlyTrend();
    });

    expect(result.current.data).toHaveLength(1);
  });
});

// ─── useWeeklySummary ─────────────────────────────────────────────────────────

describe('useWeeklySummary', () => {
  it('loads weekly summary data and adds day labels', async () => {
    (expensesDb.getWeeklyTotalsByDay as jest.Mock).mockResolvedValue([
      { date: '2026-03-09', total: 5000 },
      { date: '2026-03-10', total: 10000 },
    ]);

    const { result } = renderHook(() => useWeeklySummary('2026-03-09'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0]).toMatchObject({ date: '2026-03-09', total: 5000 });
    expect(typeof result.current.data[0].dayLabel).toBe('string');
    expect(result.current.total).toBe(15000);
    expect(result.current.error).toBeNull();
  });

  it('returns zero total on empty data', async () => {
    (expensesDb.getWeeklyTotalsByDay as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useWeeklySummary('2026-03-09'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.total).toBe(0);
  });

  it('sets error when load fails', async () => {
    (expensesDb.getWeeklyTotalsByDay as jest.Mock).mockRejectedValue(new Error('Week error'));

    const { result } = renderHook(() => useWeeklySummary('2026-03-09'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Week error');
  });

  it('uses generic message for non-Error rejections', async () => {
    (expensesDb.getWeeklyTotalsByDay as jest.Mock).mockRejectedValue(undefined);

    const { result } = renderHook(() => useWeeklySummary('2026-03-09'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Unable to load weekly summary.');
  });

  it('refreshWeeklySummary is callable directly', async () => {
    (expensesDb.getWeeklyTotalsByDay as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useWeeklySummary('2026-03-09'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    (expensesDb.getWeeklyTotalsByDay as jest.Mock).mockResolvedValue([
      { date: '2026-03-09', total: 8000 },
    ]);
    await act(async () => {
      await result.current.refreshWeeklySummary();
    });

    expect(result.current.total).toBe(8000);
  });
});
