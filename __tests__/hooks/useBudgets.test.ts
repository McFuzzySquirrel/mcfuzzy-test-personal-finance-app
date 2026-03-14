import { act, renderHook, waitFor } from '@testing-library/react-native';

import * as appStateDb from '@/db/appState';
import * as budgetsDb from '@/db/budgets';
import { useBudgets } from '@/hooks/useBudgets';
import { useDatabase } from '@/store/DatabaseProvider';
import type { Budget } from '@/types';

jest.mock('@/store/DatabaseProvider', () => ({
  useDatabase: jest.fn(),
}));

jest.mock('@/db/appState');
jest.mock('@/db/budgets');

const mockDb = {
  execAsync: jest.fn(),
  getAllAsync: jest.fn(),
  getFirstAsync: jest.fn(),
  runAsync: jest.fn(),
  withTransactionAsync: jest.fn(async (cb: () => Promise<void>) => cb()),
};

const mockBudget: Budget = { categoryId: 'cat-1', month: '2026-03', limitAmount: 50000 };

beforeEach(() => {
  jest.clearAllMocks();
  (useDatabase as jest.Mock).mockReturnValue(mockDb);
  (appStateDb.getAppStateValue as jest.Mock).mockResolvedValue(null);
  (appStateDb.setAppStateValue as jest.Mock).mockResolvedValue(undefined);
  (budgetsDb.rolloverBudgets as jest.Mock).mockResolvedValue(undefined);
});

describe('useBudgets', () => {
  it('loads budgets on mount', async () => {
    (budgetsDb.getBudgetsByMonth as jest.Mock).mockResolvedValue([mockBudget]);

    const { result } = renderHook(() => useBudgets('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.budgets).toEqual([mockBudget]);
    expect(result.current.error).toBeNull();
    expect(result.current.hasAnyBudget).toBe(true);
  });

  it('has no budget when list is empty', async () => {
    (budgetsDb.getBudgetsByMonth as jest.Mock).mockResolvedValue([]);

    const { result } = renderHook(() => useBudgets('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasAnyBudget).toBe(false);
  });

  it('rolls over budgets when last active month differs', async () => {
    (appStateDb.getAppStateValue as jest.Mock).mockResolvedValue('2026-02');
    (budgetsDb.getBudgetsByMonth as jest.Mock).mockResolvedValue([mockBudget]);

    const { result } = renderHook(() => useBudgets('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(budgetsDb.rolloverBudgets).toHaveBeenCalledWith(mockDb, '2026-02', '2026-03');
    expect(appStateDb.setAppStateValue).toHaveBeenCalledWith(mockDb, 'last_active_month', '2026-03');
  });

  it('does not roll over when last active month equals current month', async () => {
    (appStateDb.getAppStateValue as jest.Mock).mockResolvedValue('2026-03');
    (budgetsDb.getBudgetsByMonth as jest.Mock).mockResolvedValue([mockBudget]);

    const { result } = renderHook(() => useBudgets('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(budgetsDb.rolloverBudgets).not.toHaveBeenCalled();
  });

  it('builds budgetByCategoryId map', async () => {
    (budgetsDb.getBudgetsByMonth as jest.Mock).mockResolvedValue([mockBudget]);

    const { result } = renderHook(() => useBudgets('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.budgetByCategoryId.get('cat-1')).toEqual(mockBudget);
    expect(result.current.budgetByCategoryId.get('nonexistent')).toBeUndefined();
  });

  it('sets error when load fails with Error instance', async () => {
    (budgetsDb.getBudgetsByMonth as jest.Mock).mockRejectedValue(new Error('Load failed'));

    const { result } = renderHook(() => useBudgets('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Load failed');
    expect(result.current.budgets).toEqual([]);
  });

  it('uses generic message for non-Error rejections', async () => {
    (budgetsDb.getBudgetsByMonth as jest.Mock).mockRejectedValue('oops');

    const { result } = renderHook(() => useBudgets('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Unable to load budgets.');
  });

  it('saves a budget', async () => {
    (budgetsDb.getBudgetsByMonth as jest.Mock).mockResolvedValue([mockBudget]);
    (budgetsDb.upsertBudget as jest.Mock).mockResolvedValue(mockBudget);

    const { result } = renderHook(() => useBudgets('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    let saved: Budget | undefined;
    await act(async () => {
      saved = await result.current.saveBudget(mockBudget);
    });

    expect(saved).toEqual(mockBudget);
    expect(budgetsDb.upsertBudget).toHaveBeenCalledWith(mockDb, mockBudget);
  });

  it('deletes a budget for a category', async () => {
    (budgetsDb.getBudgetsByMonth as jest.Mock).mockResolvedValue([]);
    (budgetsDb.deleteBudget as jest.Mock).mockResolvedValue(undefined);

    const { result } = renderHook(() => useBudgets('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.deleteBudgetForCategory('cat-1');
    });

    expect(budgetsDb.deleteBudget).toHaveBeenCalledWith(mockDb, 'cat-1', '2026-03');
  });

  it('copies budgets from another month via rollover', async () => {
    (budgetsDb.getBudgetsByMonth as jest.Mock).mockResolvedValue([mockBudget]);

    const { result } = renderHook(() => useBudgets('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    const rolloverCallsBefore = (budgetsDb.rolloverBudgets as jest.Mock).mock.calls.length;

    await act(async () => {
      await result.current.copyBudgetsFromMonth('2026-02');
    });

    expect(budgetsDb.rolloverBudgets).toHaveBeenNthCalledWith(
      rolloverCallsBefore + 1,
      mockDb,
      '2026-02',
      '2026-03'
    );
  });

  it('refreshBudgets is callable directly', async () => {
    (budgetsDb.getBudgetsByMonth as jest.Mock).mockResolvedValue([mockBudget]);

    const { result } = renderHook(() => useBudgets('2026-03'));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    (budgetsDb.getBudgetsByMonth as jest.Mock).mockResolvedValue([]);
    await act(async () => {
      await result.current.refreshBudgets();
    });

    expect(result.current.budgets).toEqual([]);
  });
});
