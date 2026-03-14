import { renderHook } from '@testing-library/react-native';

import { useBudgets } from '@/hooks/useBudgets';
import { useCategories } from '@/hooks/useCategories';
import { useDashboardSummary } from '@/hooks/useDashboardSummary';
import { useMonthlyTotals } from '@/hooks/useMonthlyTotals';
import type { Budget, Category } from '@/types';

jest.mock('@/hooks/useBudgets');
jest.mock('@/hooks/useCategories');
jest.mock('@/hooks/useMonthlyTotals');

const mockCategory: Category = { id: 'cat-1', name: 'Food', isCustom: false };
const mockCategory2: Category = { id: 'cat-2', name: 'Transport', isCustom: false };
const mockBudget: Budget = { categoryId: 'cat-1', month: '2026-03', limitAmount: 50000 };

function mockCategoriesHook(overrides: Partial<ReturnType<typeof useCategories>> = {}) {
  (useCategories as jest.Mock).mockReturnValue({
    categories: [],
    error: null,
    isLoading: false,
    createCategory: jest.fn(),
    refreshCategories: jest.fn(),
    removeCategory: jest.fn(),
    saveCategory: jest.fn(),
    ...overrides,
  });
}

function mockBudgetsHook(overrides: Partial<ReturnType<typeof useBudgets>> = {}) {
  (useBudgets as jest.Mock).mockReturnValue({
    budgets: [],
    budgetByCategoryId: new Map<string, Budget>(),
    error: null,
    hasAnyBudget: false,
    isLoading: false,
    copyBudgetsFromMonth: jest.fn(),
    deleteBudgetForCategory: jest.fn(),
    refreshBudgets: jest.fn(),
    saveBudget: jest.fn(),
    ...overrides,
  });
}

function mockMonthlyTotalsHook(overrides: Partial<ReturnType<typeof useMonthlyTotals>> = {}) {
  (useMonthlyTotals as jest.Mock).mockReturnValue({
    totalsByCategoryId: {},
    error: null,
    isLoading: false,
    refreshTotals: jest.fn(),
    ...overrides,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockCategoriesHook();
  mockBudgetsHook();
  mockMonthlyTotalsHook();
});

describe('useDashboardSummary', () => {
  it('returns zero totals when no data', () => {
    const { result } = renderHook(() => useDashboardSummary('2026-03'));

    expect(result.current.totalSpent).toBe(0);
    expect(result.current.categoryRows).toEqual([]);
    expect(result.current.topCategory).toBeNull();
    expect(result.current.totalRemaining).toBeNull();
    expect(result.current.hasMonthlyExpenses).toBe(false);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('computes totalSpent from category totals', () => {
    mockCategoriesHook({ categories: [mockCategory, mockCategory2] });
    mockMonthlyTotalsHook({
      totalsByCategoryId: { 'cat-1': 30000, 'cat-2': 20000 },
    });

    const { result } = renderHook(() => useDashboardSummary('2026-03'));

    expect(result.current.totalSpent).toBe(50000);
    expect(result.current.hasMonthlyExpenses).toBe(true);
  });

  it('identifies top spending category', () => {
    mockCategoriesHook({ categories: [mockCategory, mockCategory2] });
    mockMonthlyTotalsHook({
      totalsByCategoryId: { 'cat-1': 30000, 'cat-2': 20000 },
    });

    const { result } = renderHook(() => useDashboardSummary('2026-03'));

    expect(result.current.topCategory).toMatchObject({
      category: mockCategory,
      spent: 30000,
    });
  });

  it('returns null topCategory when no spending', () => {
    mockCategoriesHook({ categories: [mockCategory] });
    mockMonthlyTotalsHook({ totalsByCategoryId: {} });

    const { result } = renderHook(() => useDashboardSummary('2026-03'));

    expect(result.current.topCategory).toBeNull();
  });

  it('computes totalRemaining when there are budgets', () => {
    mockCategoriesHook({ categories: [mockCategory] });
    mockBudgetsHook({
      budgets: [mockBudget],
      budgetByCategoryId: new Map([['cat-1', mockBudget]]),
      hasAnyBudget: true,
    });
    mockMonthlyTotalsHook({ totalsByCategoryId: { 'cat-1': 20000 } });

    const { result } = renderHook(() => useDashboardSummary('2026-03'));

    expect(result.current.totalRemaining).toBe(30000); // 50000 - 20000
    expect(result.current.hasAnyBudget).toBe(true);
  });

  it('returns null totalRemaining when no budgets', () => {
    mockCategoriesHook({ categories: [mockCategory] });
    mockBudgetsHook({ budgets: [], hasAnyBudget: false });
    mockMonthlyTotalsHook({ totalsByCategoryId: { 'cat-1': 20000 } });

    const { result } = renderHook(() => useDashboardSummary('2026-03'));

    expect(result.current.totalRemaining).toBeNull();
  });

  it('includes only categories with spend or budget in categoryRows', () => {
    const cat3: Category = { id: 'cat-3', name: 'Unused', isCustom: false };
    mockCategoriesHook({ categories: [mockCategory, mockCategory2, cat3] });
    mockBudgetsHook({
      budgets: [mockBudget],
      budgetByCategoryId: new Map([['cat-1', mockBudget]]),
      hasAnyBudget: true,
    });
    mockMonthlyTotalsHook({ totalsByCategoryId: { 'cat-2': 15000 } });

    const { result } = renderHook(() => useDashboardSummary('2026-03'));

    const rowIds = result.current.categoryRows.map((r) => r.category.id);
    expect(rowIds).toContain('cat-1'); // has budget
    expect(rowIds).toContain('cat-2'); // has spending
    expect(rowIds).not.toContain('cat-3'); // neither
  });

  it('sorts category rows by spent descending', () => {
    mockCategoriesHook({ categories: [mockCategory, mockCategory2] });
    mockMonthlyTotalsHook({ totalsByCategoryId: { 'cat-1': 10000, 'cat-2': 25000 } });

    const { result } = renderHook(() => useDashboardSummary('2026-03'));

    expect(result.current.categoryRows[0].category.id).toBe('cat-2');
    expect(result.current.categoryRows[1].category.id).toBe('cat-1');
  });

  it('bubbles up errors from sub-hooks', () => {
    mockCategoriesHook({ error: 'categories error' });

    const { result } = renderHook(() => useDashboardSummary('2026-03'));

    expect(result.current.error).toBe('categories error');
  });

  it('prioritises categories error over budgets error', () => {
    mockCategoriesHook({ error: 'categories error' });
    mockBudgetsHook({ error: 'budgets error' });

    const { result } = renderHook(() => useDashboardSummary('2026-03'));

    expect(result.current.error).toBe('categories error');
  });

  it('returns budgets error when categories are fine', () => {
    mockBudgetsHook({ error: 'budgets error' });

    const { result } = renderHook(() => useDashboardSummary('2026-03'));

    expect(result.current.error).toBe('budgets error');
  });

  it('reflects isLoading from any sub-hook', () => {
    mockCategoriesHook({ isLoading: true });

    const { result } = renderHook(() => useDashboardSummary('2026-03'));

    expect(result.current.isLoading).toBe(true);
  });

  it('attaches budget info to category rows', () => {
    mockCategoriesHook({ categories: [mockCategory] });
    mockBudgetsHook({
      budgets: [mockBudget],
      budgetByCategoryId: new Map([['cat-1', mockBudget]]),
      hasAnyBudget: true,
    });
    mockMonthlyTotalsHook({ totalsByCategoryId: { 'cat-1': 20000 } });

    const { result } = renderHook(() => useDashboardSummary('2026-03'));

    expect(result.current.categoryRows[0].budget).toEqual(mockBudget);
    expect(result.current.categoryRows[0].spent).toBe(20000);
  });
});
